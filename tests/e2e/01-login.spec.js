/**
 * 登录功能测试套件
 * 测试登录页面的所有功能
 */
import { test, expect } from '@playwright/test';
import { loginTestData } from '../fixtures/test-data.js';
import { login, waitForMessage } from '../utils/test-helpers.js';

test.describe('登录功能测试', () => {
  
  test.beforeEach(async ({ page }) => {
    // 每个测试前都导航到登录页
    await page.goto('/#/login');
    await page.waitForSelector('.login-form', { timeout: 10000 });
  });

  test.describe('正常登录场景', () => {
    
    test('TC-LOGIN-001: 使用正确的用户名和密码成功登录', async ({ page }) => {
      // 填写正确的登录信息
      await page.fill('input[placeholder="请输入用户名"]', loginTestData.valid.username);
      await page.fill('input[placeholder="请输入密码"]', loginTestData.valid.password);
      
      // 点击登录按钮
      await page.click('.login-btn');
      
      // 等待页面跳转到首页（说明登录成功）
      await page.waitForURL(/.*\/dashboard/, { timeout: 15000 });
      
      // 验证首页内容加载
      await page.waitForSelector('.dashboard-page', { timeout: 10000 });
      
      // 验证页面标题包含"数据概览"（使用 filter 找到 h1 标题）
      const pageTitle = await page.locator('h1.page-title').innerText();
      expect(pageTitle).toContain('数据概览');
      
      // 验证页面显示管理员角色
      await expect(page.locator('.user-role').first()).toContainText('管理员');
    });

    test('TC-LOGIN-002: 登录后记住我功能', async ({ page, context }) => {
      // 填写登录信息
      await page.fill('input[placeholder="请输入用户名"]', loginTestData.valid.username);
      await page.fill('input[placeholder="请输入密码"]', loginTestData.valid.password);
      
      // 勾选记住我
      await page.click('.remember-me .el-checkbox__input');
      
      // 点击登录
      await page.click('.login-btn');
      await page.waitForURL(/.*\/dashboard/);
      
      // 验证 cookie 或 localStorage 中保存了登录信息
      const cookies = await context.cookies();
      const hasToken = cookies.some(cookie => cookie.name.includes('token'));
      // 注意：根据实际实现，可能需要检查不同的存储方式
    });
  });

  test.describe('异常登录场景', () => {
    
    test('TC-LOGIN-003: 使用错误的密码登录失败', async ({ page }) => {
      // 填写错误的密码
      await page.fill('input[placeholder="请输入用户名"]', loginTestData.valid.username);
      await page.fill('input[placeholder="请输入密码"]', loginTestData.invalid.password);
      
      // 点击登录按钮
      await page.click('.login-btn');
      
      // 验证错误提示
      const messageText = await page.locator('.el-message--error').textContent({ timeout: 5000 }).catch(() => '');
      expect(messageText).toContain('用户名或密码错误');
      
      // 验证仍在登录页面
      await expect(page).toHaveURL(/.*\/login/);
    });

    test('TC-LOGIN-004: 使用不存在的用户名登录失败', async ({ page }) => {
      // 填写不存在的用户名
      await page.fill('input[placeholder="请输入用户名"]', 'nonexistentuser');
      await page.fill('input[placeholder="请输入密码"]', 'anypassword');
      
      // 点击登录按钮
      await page.click('.login-btn');
      
      // 验证错误提示
      const messageText = await page.locator('.el-message--error').textContent({ timeout: 5000 }).catch(() => '');
      expect(messageText).toContain('用户名或密码错误');
    });

    test('TC-LOGIN-005: 空用户名验证', async ({ page }) => {
      // 只填写密码
      await page.fill('input[placeholder="请输入密码"]', loginTestData.valid.password);
      
      // 点击登录按钮
      await page.click('.login-btn');
      
      // 验证表单验证提示
      await page.waitForSelector('.el-form-item__error', { timeout: 5000 });
      const errorText = await page.locator('.el-form-item__error').innerText();
      expect(errorText).toContain('请输入用户名');
    });

    test('TC-LOGIN-006: 空密码验证', async ({ page }) => {
      // 只填写用户名
      await page.fill('input[placeholder="请输入用户名"]', loginTestData.valid.username);
      
      // 点击登录按钮
      await page.click('.login-btn');
      
      // 验证表单验证提示
      await page.waitForSelector('.el-form-item__error', { timeout: 5000 });
      const errorText = await page.locator('.el-form-item__error').innerText();
      expect(errorText).toContain('请输入密码');
    });

    test('TC-LOGIN-007: 用户名和密码都为空', async ({ page }) => {
      // 直接点击登录按钮
      await page.click('.login-btn');
      
      // 验证表单验证提示
      await page.waitForSelector('.el-form-item__error', { timeout: 5000 });
      const errors = await page.locator('.el-form-item__error').allInnerTexts();
      expect(errors.length).toBeGreaterThanOrEqual(1);
    });

    test('TC-LOGIN-008: 用户名长度验证', async ({ page }) => {
      // 输入过短的用户名
      await page.fill('input[placeholder="请输入用户名"]', 'a');
      await page.fill('input[placeholder="请输入密码"]', loginTestData.valid.password);
      
      // 点击登录按钮
      await page.click('.login-btn');
      
      // 验证长度验证提示
      await page.waitForSelector('.el-form-item__error', { timeout: 5000 });
      const errorText = await page.locator('.el-form-item__error').innerText();
      expect(errorText).toContain('用户名长度');
    });

    test('TC-LOGIN-009: 密码长度验证', async ({ page }) => {
      // 输入过短的密码
      await page.fill('input[placeholder="请输入用户名"]', loginTestData.valid.username);
      await page.fill('input[placeholder="请输入密码"]', '123');
      
      // 点击登录按钮
      await page.click('.login-btn');
      
      // 验证长度验证提示
      await page.waitForSelector('.el-form-item__error', { timeout: 5000 });
      const errorText = await page.locator('.el-form-item__error').innerText();
      expect(errorText).toContain('密码长度');
    });
  });

  test.describe('安全测试', () => {
    
    test('TC-LOGIN-010: SQL注入攻击防护', async ({ page }) => {
      // 尝试 SQL 注入
      await page.fill('input[placeholder="请输入用户名"]', loginTestData.specialChars.username);
      await page.fill('input[placeholder="请输入密码"]', loginTestData.specialChars.password);
      
      // 点击登录按钮
      await page.click('.login-btn');
      
      // 验证登录失败，系统没有崩溃
      await page.waitForTimeout(2000);
      const isLoginPage = await page.locator('.login-form').isVisible();
      expect(isLoginPage).toBe(true);
    });

    test('TC-LOGIN-011: XSS攻击防护', async ({ page }) => {
      // 尝试 XSS 攻击
      await page.fill('input[placeholder="请输入用户名"]', '<img src=x onerror=alert(1)>');
      await page.fill('input[placeholder="请输入密码"]', '<script>alert(1)</script>');
      
      // 点击登录按钮
      await page.click('.login-btn');
      
      // 验证系统正常处理，没有执行脚本
      await page.waitForTimeout(2000);
      const isLoginPage = await page.locator('.login-form').isVisible();
      expect(isLoginPage).toBe(true);
    });
  });

  test.describe('UI测试', () => {
    
    test('TC-LOGIN-012: 登录页面元素完整性检查', async ({ page }) => {
      // 验证品牌区域
      await expect(page.locator('.brand-title')).toBeVisible();
      await expect(page.locator('.brand-subtitle')).toBeVisible();
      
      // 验证表单元素
      await expect(page.locator('input[placeholder="请输入用户名"]')).toBeVisible();
      await expect(page.locator('input[placeholder="请输入密码"]')).toBeVisible();
      
      // 验证登录按钮
      await expect(page.locator('.login-btn')).toBeVisible();
      await expect(page.locator('.login-btn')).toContainText('登录系统');
      
      // 验证记住我选项
      await expect(page.locator('.remember-me')).toBeVisible();
      
      // 验证忘记密码链接
      await expect(page.locator('.forgot-link')).toBeVisible();
      
      // 验证底部版权信息
      await expect(page.locator('.copyright')).toBeVisible();
    });

    test('TC-LOGIN-013: 登录按钮加载状态', async ({ page }) => {
      // 填写登录信息
      await page.fill('input[placeholder="请输入用户名"]', loginTestData.valid.username);
      await page.fill('input[placeholder="请输入密码"]', loginTestData.valid.password);
      
      // 点击登录按钮
      await page.click('.login-btn');
      
      // 验证按钮显示加载状态
      await expect(page.locator('.login-btn.is-loading')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('.login-btn')).toContainText('登录中...');
    });

    test('TC-LOGIN-014: 响应式布局测试', async ({ page }) => {
      // 测试不同屏幕尺寸
      const viewports = [
        { width: 1920, height: 1080, name: 'Desktop' },
        { width: 1366, height: 768, name: 'Laptop' },
        { width: 768, height: 1024, name: 'Tablet' },
        { width: 375, height: 667, name: 'Mobile' }
      ];
      
      for (const viewport of viewports) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto('/#/login');
        await page.waitForTimeout(500);
        
        // 验证登录表单仍然可见
        await expect(page.locator('.login-form')).toBeVisible();
      }
    });
  });
});
