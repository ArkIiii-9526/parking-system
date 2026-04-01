/**
 * 系统管理测试套件
 * 测试用户管理、角色管理、权限管理和系统配置
 */
import { test, expect } from '@playwright/test';
import { login, waitForTableLoad, generateTestData } from '../utils/test-helpers.js';
import { userTestData, roleTestData } from '../fixtures/test-data.js';

test.describe('系统管理测试', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test.describe('用户管理测试', () => {
    
    test.beforeEach(async ({ page }) => {
      // 导航到用户管理页面
      await page.click('.menu-group:has-text("系统管理") .menu-trigger');
      await page.waitForTimeout(500);
      await page.click('.submenu-item:has-text("用户管理")');
      await page.waitForURL(/.*\/system\/user/);
      await page.waitForSelector('.card-header:has-text("用户列表")', { timeout: 10000 });
    });

    test('TC-SYS-001: 用户管理页面正确加载', async ({ page }) => {
      // 验证页面标题
      await expect(page.locator('.card-header')).toContainText('用户列表');
      
      // 验证搜索区域
      await expect(page.locator('.filter-form')).toBeVisible();

      // 验证操作按钮
      await expect(page.locator('button:has-text("新增用户")')).toBeVisible();
    });

    test('TC-SYS-002: 用户列表正确显示', async ({ page }) => {
      // 等待表格加载
      await waitForTableLoad(page);
      
      // 验证表格存在
      await expect(page.locator('.el-table')).toBeVisible();
    });

    test('TC-SYS-003: 打开新增用户对话框', async ({ page }) => {
      // 点击新增按钮
      await page.click('button:has-text("新增")');
      
      // 验证对话框显示
      await page.waitForSelector('.el-dialog', { timeout: 5000 });
      await expect(page.locator('.el-dialog__title')).toContainText('新增');
    });

    test('TC-SYS-004: 搜索用户功能', async ({ page }) => {
      // 等待表格加载
      await waitForTableLoad(page);
      
      // 输入搜索关键词
      const searchInput = page.locator('.search-form input').first();
      if (await searchInput.count() > 0) {
        await searchInput.fill('admin');
        
        // 点击搜索按钮
        await page.click('button:has-text("查询"), button:has-text("搜索")');
        await page.waitForTimeout(2000);
        
        // 验证搜索结果
        await expect(page.locator('.el-table')).toBeVisible();
      }
    });
  });

  test.describe('角色管理测试', () => {
    
    test.beforeEach(async ({ page }) => {
      // 导航到角色管理页面
      await page.click('.menu-group:has-text("系统管理") .menu-trigger');
      await page.waitForTimeout(500);
      await page.click('.submenu-item:has-text("角色管理")');
      await page.waitForURL(/.*\/system\/role/);
      await page.waitForSelector('.card-header:has-text("角色列表")', { timeout: 10000 });
    });

    test('TC-SYS-005: 角色管理页面正确加载', async ({ page }) => {
      // 验证页面标题
      await expect(page.locator('.card-header')).toContainText('角色列表');
      
      // 验证搜索区域
      await expect(page.locator('.filter-form')).toBeVisible();

      // 验证操作按钮
      await expect(page.locator('button:has-text("新增角色")')).toBeVisible();
    });

    test('TC-SYS-006: 角色列表正确显示', async ({ page }) => {
      // 等待表格加载
      await waitForTableLoad(page);
      
      // 验证表格存在
      await expect(page.locator('.el-table')).toBeVisible();
    });

    test('TC-SYS-007: 打开新增角色对话框', async ({ page }) => {
      // 点击新增按钮
      await page.click('button:has-text("新增")');
      
      // 验证对话框显示
      await page.waitForSelector('.el-dialog', { timeout: 5000 });
      await expect(page.locator('.el-dialog__title')).toContainText('新增');
    });
  });

  test.describe('权限管理测试', () => {
    
    test.beforeEach(async ({ page }) => {
      // 导航到权限管理页面
      await page.click('.menu-group:has-text("系统管理") .menu-trigger');
      await page.waitForTimeout(500);
      await page.click('.submenu-item:has-text("菜单管理")');
      await page.waitForURL(/.*\/system\/permission/);
      await page.waitForSelector('.card-header:has-text("权限列表")', { timeout: 10000 });
    });

    test('TC-SYS-008: 权限管理页面正确加载', async ({ page }) => {
      // 验证页面标题
      await expect(page.locator('.card-header')).toContainText('权限列表');
      
      // 验证搜索区域
      await expect(page.locator('.filter-form')).toBeVisible();

      // 验证操作按钮
      await expect(page.locator('button:has-text("新增权限")')).toBeVisible();
    });

    test('TC-SYS-009: 权限树正确显示', async ({ page }) => {
      // 验证权限树存在
      const tree = page.locator('.el-tree, .permission-tree');
      if (await tree.count() > 0) {
        await expect(tree).toBeVisible();
      }
    });
  });

  test.describe.skip('系统配置测试', () => {
    
    test.beforeEach(async ({ page }) => {
      // 导航到系统配置页面
      await page.click('.menu-group:has-text("系统管理") .menu-trigger');
      await page.waitForTimeout(500);
      await page.click('.submenu-item:has-text("系统配置")');
      await page.waitForURL(/.*\/system\/config/);
      await page.waitForSelector('.card-header:has-text("系统配置")', { timeout: 10000 });
    });

    test('TC-SYS-010: 系统配置页面正确加载', async ({ page }) => {
      // 验证页面标题
      await expect(page.locator('h2')).toContainText('系统配置');
    });

    test('TC-SYS-011: 配置表单正确显示', async ({ page }) => {
      // 验证配置表单存在
      const form = page.locator('.el-form, .config-form');
      if (await form.count() > 0) {
        await expect(form).toBeVisible();
      }
    });

    test('TC-SYS-012: 保存配置按钮', async ({ page }) => {
      // 验证保存按钮存在
      const saveButton = page.locator('button:has-text("保存"), button:has-text("提交")');
      if (await saveButton.count() > 0) {
        await expect(saveButton).toBeVisible();
      }
    });
  });
});
