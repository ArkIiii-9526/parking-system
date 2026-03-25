import { test, expect } from '@playwright/test';

// 登录辅助函数
async function login(page) {
  await page.goto('/');
  await page.fill('input[type="text"]', 'admin');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/#/dashboard');
}

test.describe('系统管理功能测试', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });
  
  test('F024 - 用户管理页面加载', async ({ page }) => {
    // 点击用户管理菜单
    await page.click('text=用户管理');
    
    // 验证页面是否加载成功
    await expect(page).toHaveURL('/#/system/user');
    await expect(page.locator('h2')).toHaveText('用户管理');
  });
  
  test('F028 - 角色管理页面加载', async ({ page }) => {
    // 点击角色管理菜单
    await page.click('text=角色管理');
    
    // 验证页面是否加载成功
    await expect(page).toHaveURL('/#/system/role');
    await expect(page.locator('h2')).toHaveText('角色管理');
  });
  
  test('F032 - 权限管理页面加载', async ({ page }) => {
    // 点击权限管理菜单
    await page.click('text=权限管理');
    
    // 验证页面是否加载成功
    await expect(page).toHaveURL('/#/system/permission');
    await expect(page.locator('h2')).toHaveText('权限管理');
  });
  
  test('F005 - 导航菜单功能', async ({ page }) => {
    // 测试导航到停车场管理
    await page.click('text=停车场管理');
    await expect(page).toHaveURL('/#/parking');
    
    // 测试导航到停车位管理
    await page.click('text=停车位管理');
    await expect(page).toHaveURL('/#/parking-space');
    
    // 测试导航到车辆进出管理
    await page.click('text=车辆进出管理');
    await expect(page).toHaveURL('/#/vehicle');
    
    // 测试导航到收费记录管理
    await page.click('text=收费记录管理');
    await expect(page).toHaveURL('/#/billing');
    
    // 测试导航到计费规则管理
    await page.click('text=计费规则管理');
    await expect(page).toHaveURL('/#/billing-rule');
  });
});
