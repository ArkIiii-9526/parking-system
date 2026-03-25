/**
 * 全局测试拆卸
 * 在测试结束后执行
 */

async function globalTeardown(config) {
  const startTime = parseInt(process.env.TEST_START_TIME || '0');
  const duration = Date.now() - startTime;
  const minutes = Math.floor(duration / 60000);
  const seconds = Math.floor((duration % 60000) / 1000);
  
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║              智慧停车系统测试套件 - 测试完成                    ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log('\n');
  console.log(`⏱️  总执行时长: ${minutes}分${seconds}秒`);
  console.log('\n📄 测试报告位置:');
  console.log('   • HTML报告: test-results/report.html');
  console.log('   • JSON报告: test-results/test-results.json');
  console.log('   • 中文报告: test-results/chinese-report.txt');
  console.log('   • 截图: test-results/');
  console.log('   • 视频: test-results/videos/');
  console.log('\n');
}

export default globalTeardown;
