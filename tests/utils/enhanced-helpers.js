/**
 * 增强版测试辅助工具
 * 集成错误分类、超时控制和中文错误信息
 */

import { classifyError, getErrorMessage, wrapTimeoutError } from './error-handler.js';
import { TimeoutConfig, withTimeout, wrapStepWithTimeout } from './timeout-config.js';

/**
 * 增强版登录辅助函数
 * 集成错误分类和超时控制
 * @param {import('@playwright/test').Page} page - Playwright page 对象
 * @param {string} username - 用户名
 * @param {string} password - 密码
 * @param {Object} options - 配置选项
 */
export async function enhancedLogin(page, username = 'admin', password = 'admin123', options = {}) {
  const { timeout = TimeoutConfig.test.medium } = options;
  
  try {
    return await withTimeout(
      (async () => {
        await page.goto('/#/login');
        await page.waitForSelector('.login-form', { timeout: TimeoutConfig.element.medium });
        
        // 填写登录表单
        await page.fill('input[placeholder="请输入用户名"]', username);
        await page.fill('input[placeholder="请输入密码"]', password);
        
        // 点击登录按钮
        await page.click('.login-btn');
        
        // 等待登录成功并跳转到首页
        await page.waitForURL(/.*\/dashboard/, { timeout: TimeoutConfig.navigation.medium });
        await page.waitForSelector('.dashboard-page', { timeout: TimeoutConfig.element.medium });
      })(),
      timeout,
      '登录操作'
    );
  } catch (error) {
    // 分类并包装错误
    const errorType = classifyError(error);
    const errorInfo = getErrorMessage(errorType, error);
    
    console.error(`\n❌ 登录失败: ${errorInfo.title}`);
    console.error(`   ${errorInfo.suggestion}\n`);
    
    throw error;
  }
}

/**
 * 增强版元素等待函数
 * 集成错误分类和超时控制
 * @param {import('@playwright/test').Page} page - Playwright page 对象
 * @param {string} selector - 元素选择器
 * @param {Object} options - 配置选项
 */
export async function enhancedWaitForSelector(page, selector, options = {}) {
  const { 
    timeout = TimeoutConfig.element.default,
    state = 'visible',
    errorMessage = '等待元素超时'
  } = options;
  
  try {
    return await withTimeout(
      page.waitForSelector(selector, { state, timeout }),
      timeout,
      `${errorMessage}: ${selector}`
    );
  } catch (error) {
    const errorType = classifyError(error);
    const errorInfo = getErrorMessage(errorType, error);
    
    console.error(`\n❌ 元素等待失败: ${selector}`);
    console.error(`   ${errorInfo.title}`);
    console.error(`   ${errorInfo.suggestion}\n`);
    
    throw error;
  }
}

/**
 * 增强版页面导航函数
 * 集成错误分类和超时控制
 * @param {import('@playwright/test').Page} page - Playwright page 对象
 * @param {string} url - 目标URL
 * @param {Object} options - 配置选项
 */
export async function enhancedGoto(page, url, options = {}) {
  const { timeout = TimeoutConfig.navigation.default } = options;
  
  try {
    return await withTimeout(
      page.goto(url, { timeout, waitUntil: 'networkidle' }),
      timeout,
      `页面导航: ${url}`
    );
  } catch (error) {
    const errorType = classifyError(error);
    const errorInfo = getErrorMessage(errorType, error);
    
    console.error(`\n❌ 页面导航失败: ${url}`);
    console.error(`   ${errorInfo.title}`);
    console.error(`   ${errorInfo.suggestion}\n`);
    
    throw error;
  }
}

/**
 * 增强版点击操作函数
 * 集成错误分类和超时控制
 * @param {import('@playwright/test').Page} page - Playwright page 对象
 * @param {string} selector - 元素选择器
 * @param {Object} options - 配置选项
 */
export async function enhancedClick(page, selector, options = {}) {
  const { timeout = TimeoutConfig.action.default, force = false } = options;
  
  try {
    return await withTimeout(
      (async () => {
        await page.waitForSelector(selector, { timeout: TimeoutConfig.element.short });
        await page.click(selector, { force });
      })(),
      timeout,
      `点击操作: ${selector}`
    );
  } catch (error) {
    const errorType = classifyError(error);
    const errorInfo = getErrorMessage(errorType, error);
    
    console.error(`\n❌ 点击操作失败: ${selector}`);
    console.error(`   ${errorInfo.title}`);
    console.error(`   ${errorInfo.suggestion}\n`);
    
    throw error;
  }
}

/**
 * 增强版表单填写函数
 * 集成错误分类和超时控制
 * @param {import('@playwright/test').Page} page - Playwright page 对象
 * @param {string} selector - 输入框选择器
 * @param {string} value - 填写值
 * @param {Object} options - 配置选项
 */
export async function enhancedFill(page, selector, value, options = {}) {
  const { timeout = TimeoutConfig.action.short } = options;
  
  try {
    return await withTimeout(
      (async () => {
        await page.waitForSelector(selector, { timeout: TimeoutConfig.element.short });
        await page.fill(selector, value);
      })(),
      timeout,
      `表单填写: ${selector}`
    );
  } catch (error) {
    const errorType = classifyError(error);
    const errorInfo = getErrorMessage(errorType, error);
    
    console.error(`\n❌ 表单填写失败: ${selector}`);
    console.error(`   ${errorInfo.title}`);
    console.error(`   ${errorInfo.suggestion}\n`);
    
    throw error;
  }
}

/**
 * 增强版API响应等待函数
 * 集成错误分类和超时控制
 * @param {import('@playwright/test').Page} page - Playwright page 对象
 * @param {string|Function} urlOrPredicate - URL或判断函数
 * @param {Object} options - 配置选项
 */
export async function enhancedWaitForResponse(page, urlOrPredicate, options = {}) {
  const { timeout = TimeoutConfig.api.default } = options;
  
  try {
    return await withTimeout(
      page.waitForResponse(urlOrPredicate, { timeout }),
      timeout,
      '等待API响应'
    );
  } catch (error) {
    const errorType = classifyError(error);
    const errorInfo = getErrorMessage(errorType, error);
    
    console.error(`\n❌ API响应等待失败`);
    console.error(`   ${errorInfo.title}`);
    console.error(`   ${errorInfo.suggestion}\n`);
    
    throw error;
  }
}

/**
 * 增强版表格加载等待函数
 * 集成错误分类和超时控制
 * @param {import('@playwright/test').Page} page - Playwright page 对象
 * @param {string} tableSelector - 表格选择器
 * @param {Object} options - 配置选项
 */
export async function enhancedWaitForTableLoad(page, tableSelector = '.el-table', options = {}) {
  const { timeout = TimeoutConfig.table.default } = options;
  
  try {
    return await withTimeout(
      (async () => {
        // 等待加载状态消失
        await page.waitForSelector('.el-loading-mask', { 
          state: 'hidden', 
          timeout: timeout / 2 
        }).catch(() => {});
        
        // 等待表格行出现或空数据提示
        await Promise.race([
          page.waitForSelector(`${tableSelector} .el-table__row`, { timeout: timeout / 2 }),
          page.waitForSelector('.el-empty', { timeout: timeout / 2 })
        ]);
      })(),
      timeout,
      '表格加载'
    );
  } catch (error) {
    const errorType = classifyError(error);
    const errorInfo = getErrorMessage(errorType, error);
    
    console.error(`\n❌ 表格加载失败`);
    console.error(`   ${errorInfo.title}`);
    console.error(`   ${errorInfo.suggestion}\n`);
    
    throw error;
  }
}

/**
 * 增强版消息等待函数
 * 集成错误分类和超时控制
 * @param {import('@playwright/test').Page} page - Playwright page 对象
 * @param {string} type - 消息类型: success, error, warning, info
 * @param {Object} options - 配置选项
 */
export async function enhancedWaitForMessage(page, type = 'success', options = {}) {
  const { timeout = TimeoutConfig.element.medium } = options;
  const messageSelector = `.el-message--${type}`;
  
  try {
    return await withTimeout(
      (async () => {
        await page.waitForSelector(messageSelector, { timeout });
        
        // 获取消息文本
        const messageText = await page.locator(messageSelector).innerText();
        
        // 等待消息消失
        await page.waitForSelector(messageSelector, { 
          state: 'hidden', 
          timeout: 5000 
        }).catch(() => {});
        
        return messageText;
      })(),
      timeout,
      `等待消息提示: ${type}`
    );
  } catch (error) {
    const errorType = classifyError(error);
    const errorInfo = getErrorMessage(errorType, error);
    
    console.error(`\n❌ 消息等待失败: ${type}`);
    console.error(`   ${errorInfo.title}`);
    console.error(`   ${errorInfo.suggestion}\n`);
    
    throw error;
  }
}

/**
 * 测试步骤包装器
 * 为测试步骤添加错误处理和超时控制
 * @param {string} stepName - 步骤名称
 * @param {Function} stepFn - 步骤函数
 * @param {Object} options - 配置选项
 */
export function testStep(stepName, stepFn, options = {}) {
  const { timeout = TimeoutConfig.action.medium } = options;

  return wrapStepWithTimeout(
    async (...args) => {
      console.log(`  ▶️  执行步骤: ${stepName}`);
      const startTime = Date.now();
      
      try {
        const result = await stepFn(...args);
        const duration = Date.now() - startTime;
        console.log(`  ✅ 步骤完成: ${stepName} (${duration}ms)`);
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        console.log(`  ❌ 步骤失败: ${stepName} (${duration}ms)`);
        throw error;
      }
    },
    { timeout, stepName }
  );
}

/**
 * 测试用例包装器
 * 为整个测试用例添加错误处理和超时控制
 * @param {string} testName - 测试名称
 * @param {Function} testFn - 测试函数
 * @param {Object} options - 配置选项
 */
export function enhancedTest(testName, testFn, options = {}) {
  const { timeout = TimeoutConfig.test.default } = options;
  
  return async (...args) => {
    console.log(`\n📝 开始测试: ${testName}`);
    const startTime = Date.now();
    
    try {
      const result = await withTimeout(testFn(...args), timeout, `测试用例: ${testName}`);
      const duration = Date.now() - startTime;
      console.log(`✅ 测试通过: ${testName} (${duration}ms)\n`);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorType = classifyError(error);
      const errorInfo = getErrorMessage(errorType, error);
      
      console.error(`\n❌ 测试失败: ${testName} (${duration}ms)`);
      console.error(`   错误类型: ${errorInfo.title}`);
      console.error(`   错误描述: ${errorInfo.description}`);
      console.error(`   处理建议: ${errorInfo.suggestion}\n`);
      
      throw error;
    }
  };
}

/**
 * 截图辅助函数
 * 在测试失败时自动截图
 * @param {import('@playwright/test').Page} page - Playwright page 对象
 * @param {string} name - 截图名称
 * @param {Object} options - 配置选项
 */
export async function takeFailureScreenshot(page, name, options = {}) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const screenshotName = `${name}_${timestamp}.png`;
  
  try {
    await page.screenshot({
      path: `test-results/screenshots/${screenshotName}`,
      fullPage: true,
    });
    console.log(`   📸 已保存截图: ${screenshotName}`);
  } catch (error) {
    console.warn(`   ⚠️  截图失败: ${error.message}`);
  }
}

/**
 * 错误信息格式化工具
 * 将错误信息格式化为中文显示
 * @param {Error} error - 错误对象
 * @param {Object} context - 上下文信息
 * @returns {string} 格式化的错误信息
 */
export function formatErrorForDisplay(error, context = {}) {
  const errorType = classifyError(error);
  const errorInfo = getErrorMessage(errorType, error);
  
  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
测试执行失败
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

测试用例：${context.testName || '未知测试'}
测试文件：${context.testFile || '未知文件'}
页面URL：${context.pageUrl || '未知页面'}

${errorInfo.formatted}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `.trim();
}

export default {
  enhancedLogin,
  enhancedWaitForSelector,
  enhancedGoto,
  enhancedClick,
  enhancedFill,
  enhancedWaitForResponse,
  enhancedWaitForTableLoad,
  enhancedWaitForMessage,
  testStep,
  enhancedTest,
  takeFailureScreenshot,
  formatErrorForDisplay,
};
