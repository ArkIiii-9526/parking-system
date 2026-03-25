/**
 * 增强版测试示例
 * 展示如何使用错误分类、超时控制和中文错误信息功能
 */
import { test, expect } from '@playwright/test';
import { 
  enhancedLogin, 
  enhancedWaitForSelector,
  enhancedClick,
  enhancedFill,
  enhancedWaitForTableLoad,
  testStep,
} from '../utils/enhanced-helpers.js';
import { TimeoutConfig, getTestTimeout } from '../utils/timeout-config.js';
import { loginTestData } from '../fixtures/test-data.js';

// 为测试用例设置超时时间
test.describe('增强版登录功能测试', () => {
  
  // 设置测试套件级别的超时
  test.setTimeout(TimeoutConfig.test.medium);
  
  test.beforeEach(async ({ page }) => {
    // 使用增强版导航函数
    await testStep('导航到登录页面', async () => {
      await page.goto('/#/login');
      await enhancedWaitForSelector(page, '.login-form', { 
        timeout: TimeoutConfig.element.medium 
      });
    })();
  });

  test('TC-ENHANCED-001: 使用增强功能成功登录', async ({ page }) => {
    // 设置单个测试的超时时间
    test.setTimeout(getTestTimeout('login', 'TC-LOGIN-001'));
    
    // 使用增强版登录函数，自动处理错误分类和超时
    await enhancedLogin(page, loginTestData.valid.username, loginTestData.valid.password);
    
    // 验证登录成功
    await expect(page).toHaveURL(/.*\/dashboard/);
    await enhancedWaitForSelector(page, '.dashboard-page');
  });

  test('TC-ENHANCED-002: 使用增强功能填写表单', async ({ page }) => {
    test.setTimeout(getTestTimeout('login', 'TC-LOGIN-005'));
    
    // 使用增强版表单填写函数
    await enhancedFill(page, 'input[placeholder="请输入用户名"]', loginTestData.valid.username);
    await enhancedFill(page, 'input[placeholder="请输入密码"]', loginTestData.valid.password);
    
    // 使用增强版点击函数
    await enhancedClick(page, '.login-btn');
    
    // 验证页面跳转
    await expect(page).toHaveURL(/.*\/dashboard/, { timeout: TimeoutConfig.navigation.medium });
  });
});

test.describe('增强版页面导航测试', () => {
  
  test.setTimeout(TimeoutConfig.test.medium);
  
  test.beforeEach(async ({ page }) => {
    // 登录
    await enhancedLogin(page);
  });

  test('TC-ENHANCED-003: 导航到停车场管理页面', async ({ page }) => {
    test.setTimeout(getTestTimeout('parking', 'TC-PARK-001'));
    
    // 使用测试步骤包装器
    await testStep('点击停车场管理菜单', async () => {
      await enhancedClick(page, '.menu-title:has-text("停车场管理")');
    })();
    
    await testStep('验证页面跳转', async () => {
      await expect(page).toHaveURL(/.*\/parking/, { timeout: TimeoutConfig.navigation.medium });
    })();
    
    await testStep('验证页面标题', async () => {
      await enhancedWaitForSelector(page, 'h2:has-text("停车场管理")');
    })();
  });

  test('TC-ENHANCED-004: 表格加载测试', async ({ page }) => {
    test.setTimeout(getTestTimeout('parking', 'TC-PARK-002'));
    
    // 导航到停车场管理页面
    await enhancedClick(page, '.el-menu-item:has-text("停车场管理")');
    await expect(page).toHaveURL(/.*\/parking/);
    
    // 使用增强版表格加载等待函数
    await enhancedWaitForTableLoad(page, '.el-table', {
      timeout: TimeoutConfig.table.long
    });
    
    // 验证表格存在
    await expect(page.locator('.el-table')).toBeVisible();
  });
});

test.describe('错误处理演示测试', () => {
  
  test('TC-ENHANCED-005: 演示前端错误处理', async ({ page }) => {
    test.setTimeout(30000);
    
    // 尝试访问一个不存在的元素，触发前端错误
    try {
      await enhancedWaitForSelector(page, '.non-existent-element', {
        timeout: 5000,
        errorMessage: '查找不存在的元素'
      });
    } catch (error) {
      // 错误会被自动分类并显示中文信息
      console.log('预期内的错误捕获，用于演示错误分类功能');
      // 在实际测试中，这里应该使用 expect 来验证错误处理
      expect(error).toBeDefined();
    }
  });

  test('TC-ENHANCED-006: 演示超时错误处理', async ({ page }) => {
    test.setTimeout(15000);
    
    // 设置一个很短的超时时间来演示超时错误
    try {
      await enhancedWaitForSelector(page, '.login-form', {
        timeout: 1, // 1毫秒，肯定会超时
        errorMessage: '演示超时错误'
      });
    } catch (error) {
      // 错误信息会包含中文的超时说明
      console.log('预期内的超时错误捕获，用于演示超时处理功能');
      expect(error.message).toContain('超时');
    }
  });
});

test.describe('多步骤流程测试', () => {
  
  test.setTimeout(TimeoutConfig.test.long);
  
  test.beforeEach(async ({ page }) => {
    await enhancedLogin(page);
  });

  test('TC-ENHANCED-007: 完整的业务流程测试', async ({ page }) => {
    // 这是一个完整的业务流程测试，使用多个步骤
    
    // 步骤1: 导航到停车场管理
    await testStep('步骤1: 导航到停车场管理页面', async () => {
      await enhancedClick(page, '.el-menu-item:has-text("停车场管理")');
      await expect(page).toHaveURL(/.*\/parking/);
      await enhancedWaitForTableLoad(page);
    })();
    
    // 步骤2: 点击新增按钮
    await testStep('步骤2: 打开新增停车场对话框', async () => {
      await enhancedClick(page, 'button:has-text("新增")');
      await enhancedWaitForSelector(page, '.el-dialog', { timeout: TimeoutConfig.dialog.medium });
    })();
    
    // 步骤3: 填写表单
    await testStep('步骤3: 填写停车场信息', async () => {
      await enhancedFill(page, '.el-dialog input', '测试停车场');
    })();
    
    // 步骤4: 取消操作
    await testStep('步骤4: 取消操作', async () => {
      await enhancedClick(page, '.el-dialog__footer button:has-text("取消")');
      // 等待对话框关闭
      await page.waitForSelector('.el-dialog', { state: 'hidden', timeout: 5000 });
    })();
    
    console.log('✅ 完整业务流程测试通过');
  });
});
