const { chromium } = require('@playwright/test');
(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('http://localhost:8077/login');
  await page.fill('input[placeholder="请输入用户名"]', 'admin');
  await page.fill('input[placeholder="请输入密码"]', 'admin123');
  await page.click('.login-btn');
  await page.waitForURL(/.*\/dashboard/);
  console.log('Logged in!');
  
  await page.click('.menu-group:has-text("系统管理") .menu-trigger');
  await page.waitForTimeout(1000);
  
  await Promise.all([
    page.waitForURL(/.*\/system\/role/),
    page.click('.submenu-item:has-text("角色管理")')
  ]);
  
  console.log('Navigated to Role Management:', page.url());
  
  await browser.close();
})();