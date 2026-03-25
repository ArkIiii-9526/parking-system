#!/usr/bin/env node

/**
 * 测试运行脚本
 * 提供便捷的测试执行和报告生成功能
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const command = args[0] || 'all';

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(cmd, description) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`📋 ${description}`, 'bright');
  log(`${'='.repeat(60)}\n`, 'cyan');
  
  try {
    execSync(cmd, { stdio: 'inherit', cwd: process.cwd() });
    return true;
  } catch (error) {
    log(`\n❌ Command failed: ${cmd}`, 'red');
    return false;
  }
}

function generateReport() {
  log('\n' + '='.repeat(60), 'cyan');
  log('📊 生成测试报告', 'bright');
  log('='.repeat(60) + '\n', 'cyan');
  
  const reportDir = path.join(process.cwd(), 'test-results');
  const htmlReportDir = path.join(process.cwd(), 'playwright-report');
  
  // 确保目录存在
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  // 读取测试结果
  let testResults = null;
  const resultsFile = path.join(reportDir, 'test-results.json');
  
  if (fs.existsSync(resultsFile)) {
    try {
      testResults = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));
    } catch (e) {
      log('⚠️ 无法解析测试结果文件', 'yellow');
    }
  }
  
  // 生成报告摘要
  const summary = {
    timestamp: new Date().toISOString(),
    total: testResults?.stats?.tests || 0,
    passed: testResults?.stats?.expected || 0,
    failed: testResults?.stats?.unexpected || 0,
    skipped: testResults?.stats?.skipped || 0,
    duration: testResults?.stats?.duration || 0
  };
  
  // 保存摘要
  fs.writeFileSync(
    path.join(reportDir, 'summary.json'),
    JSON.stringify(summary, null, 2)
  );
  
  // 输出摘要
  log('\n📈 测试摘要:', 'bright');
  log(`   总测试数: ${summary.total}`, 'blue');
  log(`   ✅ 通过: ${summary.passed}`, 'green');
  log(`   ❌ 失败: ${summary.failed}`, summary.failed > 0 ? 'red' : 'green');
  log(`   ⏭️ 跳过: ${summary.skipped}`, 'yellow');
  log(`   ⏱️ 耗时: ${(summary.duration / 1000).toFixed(2)}秒`, 'blue');
  
  // 检查是否有HTML报告
  if (fs.existsSync(htmlReportDir)) {
    log(`\n📄 HTML报告已生成: ${htmlReportDir}/index.html`, 'cyan');
    log('   运行以下命令查看报告:', 'bright');
    log('   npx playwright show-report', 'yellow');
  }
  
  return summary;
}

function showHelp() {
  log(`
${'='.repeat(60)}
🧪 智慧停车系统 - 测试运行工具
${'='.repeat(60)}

用法: node scripts/run-tests.js [命令]

命令:
  all         运行所有测试 (默认)
  login       运行登录测试
  dashboard   运行首页测试
  nav         运行导航测试
  parking     运行停车场管理测试
  vehicle     运行车辆管理测试
  system      运行系统管理测试
  api         运行API集成测试
  ui          以UI模式运行测试
  debug       以调试模式运行测试
  report      显示测试报告
  install     安装Playwright浏览器
  help        显示帮助信息

示例:
  node scripts/run-tests.js
  node scripts/run-tests.js login
  node scripts/run-tests.js ui
${'='.repeat(60)}
`, 'cyan');
}

// 主函数
function main() {
  switch (command) {
    case 'all':
      runCommand('npx playwright test', '运行所有测试');
      generateReport();
      break;
      
    case 'login':
      runCommand('npx playwright test tests/e2e/01-login.spec.js', '运行登录测试');
      break;
      
    case 'dashboard':
      runCommand('npx playwright test tests/e2e/02-dashboard.spec.js', '运行首页测试');
      break;
      
    case 'nav':
    case 'navigation':
      runCommand('npx playwright test tests/e2e/03-navigation.spec.js', '运行导航测试');
      break;
      
    case 'parking':
      runCommand('npx playwright test tests/e2e/04-parking-management.spec.js', '运行停车场管理测试');
      break;
      
    case 'vehicle':
      runCommand('npx playwright test tests/e2e/05-vehicle-management.spec.js', '运行车辆管理测试');
      break;
      
    case 'system':
      runCommand('npx playwright test tests/e2e/06-system-management.spec.js', '运行系统管理测试');
      break;
      
    case 'api':
      runCommand('npx playwright test tests/e2e/07-api-integration.spec.js', '运行API集成测试');
      break;
      
    case 'ui':
      runCommand('npx playwright test --ui', '以UI模式运行测试');
      break;
      
    case 'debug':
      runCommand('npx playwright test --debug', '以调试模式运行测试');
      break;
      
    case 'headed':
      runCommand('npx playwright test --headed', '以有头模式运行测试');
      break;
      
    case 'report':
      runCommand('npx playwright show-report', '显示测试报告');
      break;
      
    case 'install':
      runCommand('npx playwright install', '安装Playwright浏览器');
      break;
      
    case 'help':
    case '-h':
    case '--help':
      showHelp();
      break;
      
    default:
      log(`❌ 未知命令: ${command}`, 'red');
      showHelp();
      process.exit(1);
  }
}

main();
