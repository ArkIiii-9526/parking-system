const { chromium } = require('@playwright/test');
(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('http://localhost:8077/login');
  await page.fill('input[placeholder="请输入用户名"]', 'admin');
  await page.fill('input[placeholder="请输入密码"]', 'admin123');
  await page.click('.login-btn');
  await page.waitForURL(/.*\/dashboard/);
  
  // Dump the sidebar HTML
  const sidebarHtml = await page.innerHTML('.sidebar');
  console.log(sidebarHtml);
  
  await browser.close();
})();