/**
 * 全局测试设置
 * 在测试开始前执行
 */

import { TimeoutConfig, validateTimeoutConfig, generateTimeoutReport } from './timeout-config.js';

async function globalSetup(config) {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║              智慧停车系统测试套件 - 全局设置                    ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log('\n');
  
  // 验证超时配置
  console.log('🔧 正在验证超时配置...');
  const validation = validateTimeoutConfig();
  if (validation.valid) {
    console.log('✅ 超时配置验证通过');
  } else {
    console.warn('⚠️  超时配置存在问题:');
    validation.issues.forEach(issue => console.warn(`   - ${issue}`));
  }
  
  // 显示超时配置报告
  console.log('\n' + generateTimeoutReport());
  
  // 设置环境变量
  process.env.TEST_START_TIME = Date.now().toString();
  process.env.TEST_ENVIRONMENT = process.env.NODE_ENV || 'development';
  
  console.log('\n🚀 测试环境准备完成，开始执行测试...\n');
}

export default globalSetup;
