/**
 * 测试辅助工具函数
 * 提供常用的测试辅助功能
 */

/**
 * 登录辅助函数
 * @param {import('@playwright/test').Page} page - Playwright page 对象
 * @param {string} username - 用户名
 * @param {string} password - 密码
 */
export async function login(page, username = 'admin', password = 'admin123') {
  await page.goto('/#/login');
  await page.waitForSelector('.login-form', { timeout: 10000 });
  
  // 填写登录表单
  await page.fill('input[placeholder="请输入用户名"]', username);
  await page.fill('input[placeholder="请输入密码"]', password);
  
  // 点击登录按钮
  await page.click('.login-btn');
  
  // 等待登录成功并跳转到首页
  await page.waitForURL(/.*\/dashboard/, { timeout: 15000 });
  await page.waitForSelector('.dashboard-page', { timeout: 10000 });
}

/**
 * 登出辅助函数
 * @param {import('@playwright/test').Page} page - Playwright page 对象
 */
export async function logout(page) {
  // 点击用户菜单（如果有）
  try {
    await page.click('.user-menu, .el-dropdown', { timeout: 5000 });
    await page.click('text=退出登录', { timeout: 5000 });
  } catch {
    // 如果没有找到退出按钮，直接跳转到登录页
    await page.goto('/#/login');
  }
  
  await page.waitForSelector('.login-form', { timeout: 10000 });
}

/**
 * 等待页面加载完成
 * @param {import('@playwright/test').Page} page - Playwright page 对象
 * @param {string} selector - 页面主要元素选择器
 */
export async function waitForPageLoad(page, selector = '.page-content, .main-content, .el-main') {
  await page.waitForLoadState('networkidle');
  await page.waitForSelector(selector, { timeout: 15000 });
}

/**
 * 清除表单字段
 * @param {import('@playwright/test').Page} page - Playwright page 对象
 * @param {string} selector - 输入框选择器
 */
export async function clearInput(page, selector) {
  await page.fill(selector, '');
  await page.click(selector);
  await page.keyboard.press('Control+a');
  await page.keyboard.press('Delete');
}

/**
 * 获取表格数据
 * @param {import('@playwright/test').Page} page - Playwright page 对象
 * @param {string} tableSelector - 表格选择器
 * @returns {Promise<Array>} 表格数据数组
 */
export async function getTableData(page, tableSelector = '.el-table') {
  const rows = await page.locator(`${tableSelector} .el-table__row`).all();
  const data = [];
  
  for (const row of rows) {
    const cells = await row.locator('.cell').allInnerTexts();
    data.push(cells);
  }
  
  return data;
}

/**
 * 等待 Element Plus 消息提示
 * @param {import('@playwright/test').Page} page - Playwright page 对象
 * @param {string} type - 消息类型: success, error, warning, info
 * @param {number} timeout - 超时时间
 */
export async function waitForMessage(page, type = 'success', timeout = 10000) {
  const messageSelector = `.el-message--${type}`;
  await page.waitForSelector(messageSelector, { timeout });
  
  // 获取消息文本（使用 first() 避免多个匹配）
  const messageText = await page.locator(messageSelector).first().innerText();
  
  // 等待消息消失
  await page.waitForSelector(messageSelector, { state: 'hidden', timeout: 5000 }).catch(() => {});
  
  return messageText;
}

/**
 * 处理对话框确认
 * @param {import('@playwright/test').Page} page - Playwright page 对象
 * @param {string} action - 操作类型: confirm, cancel
 */
export async function handleDialog(page, action = 'confirm') {
  const buttonText = action === 'confirm' ? '确定' : '取消';
  await page.click(`.el-dialog__footer button:has-text("${buttonText}")`);
  await page.waitForTimeout(500);
}

/**
 * 填写表单字段
 * @param {import('@playwright/test').Page} page - Playwright page 对象
 * @param {Object} fields - 字段映射对象 { selector: value }
 */
export async function fillFormFields(page, fields) {
  for (const [selector, value] of Object.entries(fields)) {
    await page.fill(selector, String(value));
  }
}

/**
 * 验证页面标题
 * @param {import('@playwright/test').Page} page - Playwright page 对象
 * @param {string} expectedTitle - 期望的标题
 */
export async function verifyPageTitle(page, expectedTitle) {
  const title = await page.locator('h1, h2, .page-title').first().innerText();
  if (!title.includes(expectedTitle)) {
    throw new Error(`页面标题不匹配: 期望包含 "${expectedTitle}", 实际为 "${title}"`);
  }
}

/**
 * 检查元素是否存在
 * @param {import('@playwright/test').Page} page - Playwright page 对象
 * @param {string} selector - 元素选择器
 * @returns {Promise<boolean>}
 */
export async function elementExists(page, selector) {
  return await page.locator(selector).count() > 0;
}

/**
 * 等待表格加载完成
 * @param {import('@playwright/test').Page} page - Playwright page 对象
 * @param {string} tableSelector - 表格选择器
 */
export async function waitForTableLoad(page, tableSelector = '.el-table') {
  // 等待加载状态消失
  await page.waitForSelector('.el-loading-mask', { state: 'hidden', timeout: 15000 });
  // 等待表格行出现或空数据提示
  await Promise.race([
    page.waitForSelector(`${tableSelector} .el-table__row`, { timeout: 15000 }),
    page.waitForSelector('.el-empty', { timeout: 15000 })
  ]);
}

/**
 * 生成测试数据
 * @param {string} type - 数据类型
 * @returns {string} 生成的测试数据
 */
export function generateTestData(type = 'text') {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  
  switch (type) {
    case 'username':
      return `testuser_${timestamp}`;
    case 'email':
      return `test_${timestamp}@example.com`;
    case 'phone':
      return `1${Math.floor(Math.random() * 9 + 1)}${String(random).padStart(9, '0')}`;
    case 'plate':
      const provinces = ['京', '沪', '津', '渝', '冀', '晋', '辽', '吉', '黑', '苏', '浙', '皖', '闽', '赣', '鲁', '豫', '鄂', '湘', '粤', '桂', '琼', '川', '贵', '云', '陕', '甘', '青', '宁', '新'];
      const province = provinces[Math.floor(Math.random() * provinces.length)];
      const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
      const number = String(Math.floor(Math.random() * 90000) + 10000);
      return `${province}${letter}${number}`;
    default:
      return `test_${timestamp}_${random}`;
  }
}

/**
 * 截图保存
 * @param {import('@playwright/test').Page} page - Playwright page 对象
 * @param {string} name - 截图名称
 */
export async function takeScreenshot(page, name) {
  await page.screenshot({ 
    path: `test-results/screenshots/${name}_${Date.now()}.png`,
    fullPage: true 
  });
}
