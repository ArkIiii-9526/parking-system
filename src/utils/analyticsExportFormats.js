import { getExportFormats } from '@/api/analytics'

let cachedFormats = null

export function resetAnalyticsExportFormatsCache() {
  cachedFormats = null
}

export async function loadAnalyticsExportFormats() {
  if (cachedFormats !== null) return cachedFormats
  try {
    const res = await getExportFormats()
    if (res.code === 200 && Array.isArray(res.data) && res.data.length) {
      cachedFormats = res.data.map((f) => String(f).toLowerCase())
    } else {
      cachedFormats = ['excel']
    }
  } catch {
    cachedFormats = ['excel']
  }
  return cachedFormats
}

export function exportFileExtension(format) {
  const f = String(format || 'excel').toLowerCase()
  if (f === 'csv') return 'csv'
  return 'xlsx'
}

export function exportBlobMimeType(format) {
  const f = String(format || 'excel').toLowerCase()
  if (f === 'csv') return 'text/csv;charset=utf-8'
  return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
}

export function appendFormatToPayload(payload, format) {
  if (!format) return payload
  return { ...payload, format: String(format).toLowerCase() }
}
