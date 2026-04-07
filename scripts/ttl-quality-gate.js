#!/usr/bin/env node

import fs from 'fs'
import path from 'path'

const args = process.argv.slice(2)

function getArg(name, defaultValue = '') {
  const prefix = `--${name}=`
  const item = args.find(a => a.startsWith(prefix))
  if (!item) return defaultValue
  return item.slice(prefix.length)
}

const resultsPath = path.resolve(getArg('results', 'test-results/test-results.json'))
const matrixPath = path.resolve(getArg('matrix', 'tests/governance/functional-matrix.csv'))
const outputDir = path.resolve(getArg('output', 'test-results/ttl-gate'))
const stage = getArg('stage', process.env.TEST_STAGE || 'commit')
const strict = getArg('strict', 'true') !== 'false'

const ttlThresholds = {
  UI_RENDER: 2000,
  API_REQUEST: 5000,
  COMPLEX_INTERACTION: 10000
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function parseCsv(csvText) {
  const lines = csvText.trim().split('\n')
  if (lines.length <= 1) return []
  const headers = lines[0].split(',').map(h => h.trim())
  return lines.slice(1).map(line => {
    const cols = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        inQuotes = !inQuotes
      } else if (ch === ',' && !inQuotes) {
        cols.push(current.trim())
        current = ''
      } else {
        current += ch
      }
    }
    cols.push(current.trim())
    const item = {}
    headers.forEach((h, idx) => {
      item[h] = (cols[idx] || '').replace(/^"|"$/g, '')
    })
    return item
  })
}

function collectSpecsFromSuite(suite, tests = []) {
  if (!suite) return tests
  if (Array.isArray(suite.specs)) {
    suite.specs.forEach(spec => {
      if (!spec || !Array.isArray(spec.tests)) return
      spec.tests.forEach(t => {
        const latestResult = Array.isArray(t.results) && t.results.length > 0 ? t.results[t.results.length - 1] : null
        const errorText = latestResult?.error?.message || latestResult?.error?.stack || ''
        const attachments = Array.isArray(latestResult?.attachments) ? latestResult.attachments : []
        const screenshots = attachments.filter(a => a.name?.includes('screenshot') || a.contentType?.includes('image')).map(a => a.path).filter(Boolean)
        tests.push({
          title: spec.title || t.title || '',
          file: spec.file || '',
          duration: Number(latestResult?.duration || 0),
          status: t.outcome || latestResult?.status || 'unknown',
          error: errorText,
          screenshots
        })
      })
    })
  }
  if (Array.isArray(suite.suites)) suite.suites.forEach(s => collectSpecsFromSuite(s, tests))
  return tests
}

function extractCaseId(title) {
  const match = title.match(/TC-[A-Z]+-\d{3}/)
  return match ? match[0] : ''
}

function classifyRootCause(errorText) {
  const t = (errorText || '').toLowerCase()
  if (!t) return 'UNKNOWN'
  if (t.includes('net::err') || t.includes('econn') || t.includes('timed out') || t.includes('502') || t.includes('503') || t.includes('504')) return 'NETWORK_DELAY'
  if (t.includes('strict mode violation') || t.includes('invalid selector') || t.includes('locator') || t.includes('waitforselector')) return 'TEST_SCRIPT_ISSUE'
  return 'CODE_DEFECT'
}

function getDistribution(samples) {
  const dist = { '0-2s': 0, '2-5s': 0, '5-10s': 0, '>10s': 0 }
  for (const v of samples) {
    if (v <= 2000) dist['0-2s']++
    else if (v <= 5000) dist['2-5s']++
    else if (v <= 10000) dist['5-10s']++
    else dist['>10s']++
  }
  return dist
}

function run() {
  ensureDir(outputDir)
  if (!fs.existsSync(resultsPath)) {
    console.error(`未找到测试结果文件: ${resultsPath}`)
    process.exit(2)
  }
  if (!fs.existsSync(matrixPath)) {
    console.error(`未找到功能矩阵文件: ${matrixPath}`)
    process.exit(2)
  }

  const rawReport = JSON.parse(fs.readFileSync(resultsPath, 'utf8'))
  const matrixRows = parseCsv(fs.readFileSync(matrixPath, 'utf8'))
  const tests = collectSpecsFromSuite(rawReport)
  const caseToPolicy = new Map()
  matrixRows.forEach(row => {
    if (row.case_id) caseToPolicy.set(row.case_id, row)
  })

  const enriched = tests.map(item => {
    const caseId = extractCaseId(item.title)
    const policy = caseToPolicy.get(caseId)
    const ttlType = policy?.ttl_type || (item.file.includes('api') ? 'API_REQUEST' : 'COMPLEX_INTERACTION')
    const ttlMs = ttlThresholds[ttlType] || ttlThresholds.COMPLEX_INTERACTION
    const ttlExpired = item.duration > ttlMs
    const rootCause = ttlExpired || item.status !== 'expected' ? classifyRootCause(item.error) : ''
    return { ...item, caseId, ttlType, ttlMs, ttlExpired, rootCause }
  })

  const total = enriched.length
  const passed = enriched.filter(t => t.status === 'expected').length
  const failed = enriched.filter(t => t.status !== 'expected').length
  const ttlExpiredList = enriched.filter(t => t.ttlExpired)
  const coverageTotal = matrixRows.length
  const coveredCaseIds = new Set(enriched.map(t => t.caseId).filter(Boolean))
  const coverageHit = matrixRows.filter(r => coveredCaseIds.has(r.case_id)).length
  const coverageRate = coverageTotal === 0 ? 0 : (coverageHit / coverageTotal) * 100
  const passRate = total === 0 ? 0 : (passed / total) * 100
  const distribution = getDistribution(enriched.map(t => t.duration))
  const screenshots = enriched.flatMap(t => t.screenshots.map(s => ({ title: t.title, path: s })))

  const defects = enriched
    .filter(t => t.status !== 'expected' || t.ttlExpired)
    .map((t, idx) => {
      const due = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      return {
        defect_id: `TTL-${String(idx + 1).padStart(4, '0')}`,
        case_id: t.caseId || 'UNMAPPED',
        title: t.title,
        stage,
        reason_type: t.rootCause || 'UNKNOWN',
        status: 'OPEN',
        detected_at: new Date().toISOString(),
        due_at: due
      }
    })

  const summary = {
    generated_at: new Date().toISOString(),
    stage,
    total,
    passed,
    failed,
    pass_rate: Number(passRate.toFixed(2)),
    ttl_expired: ttlExpiredList.length,
    coverage_total: coverageTotal,
    coverage_hit: coverageHit,
    coverage_rate: Number(coverageRate.toFixed(2)),
    duration_distribution: distribution
  }

  fs.writeFileSync(path.join(outputDir, 'ttl-summary.json'), JSON.stringify(summary, null, 2))
  fs.writeFileSync(path.join(outputDir, 'ttl-details.json'), JSON.stringify(enriched, null, 2))
  fs.writeFileSync(path.join(outputDir, 'ttl-defects.json'), JSON.stringify(defects, null, 2))

  const reportLines = [
    '# 前端TTL测试质量报告',
    '',
    `- 生成时间: ${summary.generated_at}`,
    `- 运行阶段: ${summary.stage}`,
    `- 总用例: ${summary.total}`,
    `- 通过数: ${summary.passed}`,
    `- 失败数: ${summary.failed}`,
    `- 通过率: ${summary.pass_rate}%`,
    `- TTL过期数: ${summary.ttl_expired}`,
    `- 功能覆盖率: ${summary.coverage_rate}%`,
    '',
    '## 耗时分布',
    '',
    `- 0-2s: ${distribution['0-2s']}`,
    `- 2-5s: ${distribution['2-5s']}`,
    `- 5-10s: ${distribution['5-10s']}`,
    `- >10s: ${distribution['>10s']}`,
    '',
    '## TTL过期用例',
    ''
  ]

  if (ttlExpiredList.length === 0) {
    reportLines.push('- 无')
  } else {
    ttlExpiredList.forEach(t => {
      reportLines.push(`- ${t.caseId || 'UNMAPPED'} | ${t.title} | ${t.duration}ms > ${t.ttlMs}ms | ${t.rootCause}`)
    })
  }

  reportLines.push('', '## 失败截图', '')
  if (screenshots.length === 0) {
    reportLines.push('- 无')
  } else {
    screenshots.slice(0, 50).forEach(s => {
      reportLines.push(`- ${s.title} -> ${s.path}`)
    })
  }

  fs.writeFileSync(path.join(outputDir, 'ttl-report.md'), reportLines.join('\n'))

  const defectCsv = [
    'defect_id,case_id,title,stage,reason_type,status,detected_at,due_at',
    ...defects.map(d => `${d.defect_id},${d.case_id},"${d.title.replace(/"/g, '""')}",${d.stage},${d.reason_type},${d.status},${d.detected_at},${d.due_at}`)
  ].join('\n')
  fs.writeFileSync(path.join(outputDir, 'defect-tracking.csv'), defectCsv)

  console.log(`TTL报告已生成: ${path.join(outputDir, 'ttl-report.md')}`)
  console.log(`覆盖率: ${summary.coverage_rate}%`)
  if (summary.coverage_rate < 95) {
    console.error('覆盖率低于95%')
    if (strict) process.exit(1)
  }
  if (summary.ttl_expired > 0 || summary.failed > 0) {
    console.error('存在失败或TTL过期用例')
    if (strict) process.exit(1)
  }
}

run()
