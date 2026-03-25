/**
 * 中文测试报告生成器
 * 生成格式化的中文测试报告，包含错误分类统计
 */

import { classifyError, getErrorMessage } from './error-handler.js';
import fs from 'fs';
import path from 'path';

/**
 * 测试报告配置
 */
export const ReporterConfig = {
  // 报告标题
  title: '智慧停车系统测试报告',
  
  // 报告输出路径
  outputPath: './test-results/chinese-report.txt',
  
  // 是否包含截图
  includeScreenshots: true,
  
  // 是否包含视频
  includeVideos: true,
  
  // 是否包含Trace
  includeTrace: true,
};

/**
 * 测试结果统计
 */
export class TestResultCollector {
  constructor() {
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      errors: {
        frontend: [],
        backend: [],
        network: [],
        unknown: [],
      },
      details: [],
    };
    this.startTime = Date.now();
  }
  
  /**
   * 记录测试结果
   * @param {Object} result - 测试结果
   */
  addResult(result) {
    this.results.total++;
    this.results.details.push({
      ...result,
      timestamp: new Date().toLocaleString('zh-CN'),
    });
    
    switch (result.status) {
      case 'passed':
        this.results.passed++;
        break;
      case 'failed':
        this.results.failed++;
        this.categorizeError(result);
        break;
      case 'skipped':
        this.results.skipped++;
        break;
    }
  }
  
  /**
   * 分类错误
   * @param {Object} result - 测试结果
   */
  categorizeError(result) {
    if (!result.error) return;
    
    const errorType = result.errorType || classifyError(result.error);
    const errorInfo = getErrorMessage(errorType, result.error);
    
    const errorRecord = {
      testName: result.testName,
      testFile: result.testFile,
      errorType,
      errorInfo,
      duration: result.duration,
    };
    
    if (errorType.startsWith('FRONTEND_')) {
      this.results.errors.frontend.push(errorRecord);
    } else if (errorType.startsWith('BACKEND_')) {
      this.results.errors.backend.push(errorRecord);
    } else if (errorType === 'NETWORK_CONNECTIVITY') {
      this.results.errors.network.push(errorRecord);
    } else {
      this.results.errors.unknown.push(errorRecord);
    }
  }
  
  /**
   * 获取执行时长
   * @returns {string} 格式化的时长
   */
  getDuration() {
    const duration = Date.now() - this.startTime;
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    const ms = duration % 1000;
    
    if (minutes > 0) {
      return `${minutes}分${seconds}秒${ms}毫秒`;
    }
    return `${seconds}秒${ms}毫秒`;
  }
  
  /**
   * 生成统计摘要
   * @returns {string} 统计摘要
   */
  generateSummary() {
    const passRate = this.results.total > 0 
      ? ((this.results.passed / this.results.total) * 100).toFixed(2) 
      : 0;
    
    return {
      total: this.results.total,
      passed: this.results.passed,
      failed: this.results.failed,
      skipped: this.results.skipped,
      passRate: `${passRate}%`,
      duration: this.getDuration(),
      frontendErrors: this.results.errors.frontend.length,
      backendErrors: this.results.errors.backend.length,
      networkErrors: this.results.errors.network.length,
      unknownErrors: this.results.errors.unknown.length,
    };
  }
}

/**
 * 生成中文测试报告
 * @param {TestResultCollector} collector - 结果收集器
 * @param {Object} options - 配置选项
 * @returns {string} 格式化的测试报告
 */
export function generateChineseReport(collector, options = {}) {
  const summary = collector.generateSummary();
  const timestamp = new Date().toLocaleString('zh-CN');
  
  let report = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║                        🅂🄼🄰🅁🅃 🄿🄰🅁🄺🄸🄽🄶 🅂🅈🅂🅃🄴🄼                        ║
║                                                                              ║
║                        智 慧 停 车 系 统 测 试 报 告                          ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

📋 报告信息
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   报告生成时间：${timestamp}
   测试执行时长：${summary.duration}
   测试环境：${options.environment || '开发环境'}
   浏览器：${options.browser || 'Chromium'}

📊 测试统计概览
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   总测试数：${summary.total} 个
   
   ✅ 通过：${summary.passed} 个
   ❌ 失败：${summary.failed} 个
   ⏭️  跳过：${summary.skipped} 个
   
   通过率：${summary.passRate}

🔍 错误分类统计
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   【前端错误】${summary.frontendErrors} 个
      ├─ UI渲染错误
      ├─ 前端逻辑错误
      ├─ 客户端网络请求异常
      └─ 页面导航错误
   
   【后端错误】${summary.backendErrors} 个
      ├─ API接口错误
      ├─ 服务器逻辑异常
      ├─ 数据库操作失败
      └─ 认证授权错误
   
   【网络错误】${summary.networkErrors} 个
      └─ 网络连接问题
   
   【未知错误】${summary.unknownErrors} 个
      └─ 未分类异常

`;

  // 添加详细错误信息
  if (summary.frontendErrors > 0) {
    report += generateErrorSection('前端错误详情', collector.results.errors.frontend, '🔴');
  }
  
  if (summary.backendErrors > 0) {
    report += generateErrorSection('后端错误详情', collector.results.errors.backend, '🔵');
  }
  
  if (summary.networkErrors > 0) {
    report += generateErrorSection('网络错误详情', collector.results.errors.network, '🟡');
  }
  
  if (summary.unknownErrors > 0) {
    report += generateErrorSection('未知错误详情', collector.results.errors.unknown, '⚪');
  }
  
  // 添加测试用例详情
  report += generateTestDetails(collector.results.details);
  
  // 添加建议措施
  report += generateRecommendations(summary);
  
  // 添加页脚
  report += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                          报告生成完毕 - ${timestamp}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
  
  return report;
}

/**
 * 生成错误详情章节
 * @param {string} title - 章节标题
 * @param {Array} errors - 错误列表
 * @param {string} emoji - 表情符号
 * @returns {string} 格式化的错误详情
 */
function generateErrorSection(title, errors, emoji) {
  let section = `
${emoji} ${title} (${errors.length}个)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`;
  
  errors.forEach((error, index) => {
    section += `【${index + 1}】${error.testName}\n`;
    section += `   测试文件：${error.testFile}\n`;
    section += `   错误类型：${error.errorInfo.title}\n`;
    section += `   错误描述：${error.errorInfo.description}\n`;
    section += `   处理建议：${error.errorInfo.suggestion}\n`;
    if (error.duration) {
      section += `   执行时长：${error.duration}ms\n`;
    }
    section += '\n';
  });
  
  return section;
}

/**
 * 生成测试用例详情
 * @param {Array} details - 测试详情列表
 * @returns {string} 格式化的测试详情
 */
function generateTestDetails(details) {
  if (details.length === 0) return '';
  
  let section = `
📋 测试用例执行详情
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`;
  
  const statusMap = {
    passed: '✅ 通过',
    failed: '❌ 失败',
    skipped: '⏭️  跳过',
  };
  
  details.forEach((detail, index) => {
    const status = statusMap[detail.status] || detail.status;
    section += `${index + 1}. ${detail.testName}\n`;
    section += `   状态：${status}\n`;
    if (detail.duration) {
      section += `   耗时：${detail.duration}ms\n`;
    }
    if (detail.status === 'failed' && detail.error) {
      section += `   错误：${detail.error.message?.substring(0, 100)}...\n`;
    }
    section += '\n';
  });
  
  return section;
}

/**
 * 生成建议措施
 * @param {Object} summary - 统计摘要
 * @returns {string} 格式化的建议
 */
function generateRecommendations(summary) {
  let section = `
💡 建议措施
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`;
  
  if (summary.frontendErrors > 0) {
    section += `【前端问题处理建议】\n`;
    section += `   1. 检查页面元素选择器是否正确\n`;
    section += `   2. 确认页面加载完成后再进行操作\n`;
    section += `   3. 查看浏览器控制台是否有JavaScript错误\n`;
    section += `   4. 验证前端路由配置是否正确\n\n`;
  }
  
  if (summary.backendErrors > 0) {
    section += `【后端问题处理建议】\n`;
    section += `   1. 检查后端服务是否正常运行\n`;
    section += `   2. 查看后端应用日志中的错误信息\n`;
    section += `   3. 验证数据库连接是否正常\n`;
    section += `   4. 确认API接口参数是否正确\n\n`;
  }
  
  if (summary.networkErrors > 0) {
    section += `【网络问题处理建议】\n`;
    section += `   1. 检查网络连接是否稳定\n`;
    section += `   2. 确认目标服务器是否可访问\n`;
    section += `   3. 检查防火墙设置\n\n`;
  }
  
  if (summary.passRate === '100.00%') {
    section += `🎉 恭喜！所有测试用例均已通过！\n`;
    section += `   系统功能正常，可以放心部署。\n`;
  } else if (parseFloat(summary.passRate) >= 80) {
    section += `⚠️  大部分测试通过，建议修复失败的用例后再部署。\n`;
  } else {
    section += `🚨 测试通过率较低，请优先修复关键功能问题。\n`;
  }
  
  return section;
}

/**
 * 生成简化的控制台报告
 * @param {TestResultCollector} collector - 结果收集器
 * @returns {string} 简化的报告
 */
export function generateConsoleReport(collector) {
  const summary = collector.generateSummary();
  
  return `
╔════════════════════════════════════════════════════════╗
║           智慧停车系统测试执行结果                      ║
╚════════════════════════════════════════════════════════╝

  总测试数：${summary.total}
  ✅ 通过：${summary.passed}
  ❌ 失败：${summary.failed}
  ⏭️  跳过：${summary.skipped}
  ─────────────────────────
  通过率：${summary.passRate}
  执行时长：${summary.duration}

  前端错误：${summary.frontendErrors} 个
  后端错误：${summary.backendErrors} 个
  网络错误：${summary.networkErrors} 个
`;
}

/**
 * Playwright 自定义报告器
 * 用于生成中文测试报告
 */
export default class ChineseReporter {
  constructor(options = {}) {
    this.options = { ...ReporterConfig, ...options };
    this.collector = new TestResultCollector();
  }
  
  onBegin(config, suite) {
    console.log('\n🚀 开始执行测试...\n');
  }
  
  onTestBegin(test) {
    console.log(`  ▶️  正在执行: ${test.title}`);
  }
  
  onTestEnd(test, result) {
    const statusMap = {
      passed: '✅ 通过',
      failed: '❌ 失败',
      skipped: '⏭️  跳过',
      timedOut: '⏱️  超时',
    };
    
    console.log(`  ${statusMap[result.status] || result.status}: ${test.title}`);
    
    if (result.status === 'failed' && result.error) {
      const errorType = classifyError(result.error);
      const errorInfo = getErrorMessage(errorType, result.error);
      console.log(`     ${errorInfo.title}`);
    }
    
    this.collector.addResult({
      testName: test.title,
      testFile: test.location?.file || '未知文件',
      status: result.status,
      duration: result.duration,
      error: result.error,
      errorType: result.error ? classifyError(result.error) : null,
    });
  }
  
  onEnd(result) {
    console.log('\n' + generateConsoleReport(this.collector));
    
    // 生成详细报告
    const fullReport = generateChineseReport(this.collector, {
      environment: this.options.environment,
      browser: this.options.browser,
    });
    
    // 保存报告到文件
    if (this.options.outputPath) {
      const outputDir = path.dirname(this.options.outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      fs.writeFileSync(this.options.outputPath, fullReport, 'utf-8');
      console.log(`\n📄 详细报告已保存至: ${this.options.outputPath}`);
    }
  }
}

/**
 * 生成测试执行摘要
 * @param {Array} results - 测试结果数组
 * @returns {Object} 执行摘要
 */
export function generateExecutionSummary(results) {
  const collector = new TestResultCollector();
  
  results.forEach(result => {
    collector.addResult(result);
  });
  
  return {
    summary: collector.generateSummary(),
    consoleReport: generateConsoleReport(collector),
    fullReport: generateChineseReport(collector),
  };
}
