import { test, expect } from '@playwright/test';

test.describe('登录功能测试', () => {
  test('F001 - 成功登录并跳转到首页', async ({ page }) => {
    // 导航到登录页面
    await page.goto('/');
    
    // 填写登录表单
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', '123456');
    
    // 点击登录按钮
    await page.click('button[type="submit"]');
    
    // 验证是否跳转到首页
    await expect(page).toHaveURL('/#/dashboard');
    
    // 验证首页是否加载成功
    await expect(page.locator('h1')).toHaveText('欢迎使用智能停车管理系统');
  });
  
  test('F002 - 登录失败，显示错误提示', async ({ page }) => {
    // 导航到登录页面
    await page.goto('/');
    
    // 填写错误的登录信息
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'wrongpassword');
    
    // 点击登录按钮
    await page.click('button[type="submit"]');
    
    // 验证是否显示错误提示
    await expect(page.locator('.el-message--error')).toBeVisible();
  });
  
  test('F003 - 空值验证，显示必填项提示', async ({ page }) => {
    // 导航到登录页面
    await page.goto('/');
    
    // 不填写任何信息，直接点击登录按钮
    await page.click('button[type="submit"]');
    
    // 验证是否显示必填项提示
    await expect(page.locator('.el-form-item__error')).toBeVisible();
  });
});
