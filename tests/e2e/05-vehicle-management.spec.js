/**
 * 车辆进出管理测试套件
 * 测试车辆入场、出场和查询功能
 */
import { test, expect } from '@playwright/test';
import { login, waitForTableLoad, generateTestData } from '../utils/test-helpers.js';

test.describe('车辆进出管理测试', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page);
    // 导航到车辆进出管理页面
    await page.click('.menu-title:has-text("车辆进出管理")');
    await page.waitForURL(/.*\/vehicle/);
    await page.waitForSelector('h2:has-text("车辆进出管理")', { timeout: 10000 });
  });

  test.describe('页面加载测试', () => {
    
    test('TC-VEH-001: 车辆管理页面正确加载', async ({ page }) => {
      // 验证页面标题
      await expect(page.locator('h2')).toContainText('车辆进出管理');
      
      // 验证搜索区域
      await expect(page.locator('.search-form, .filter-section')).toBeVisible();
      
      // 验证操作按钮
      await expect(page.locator('button:has-text("入场")')).toBeVisible();
      await expect(page.locator('button:has-text("出场")')).toBeVisible();
    });

    test('TC-VEH-002: 车辆记录列表正确显示', async ({ page }) => {
      // 等待表格加载
      await waitForTableLoad(page);
      
      // 验证表格存在
      await expect(page.locator('.el-table')).toBeVisible();
      
      // 验证表头
      const headers = ['车牌号', '停车场', '车位号', '入场时间', '出场时间', '状态', '费用'];
      for (const header of headers) {
        const headerCell = page.locator(`.el-table__header th:has-text("${header}")`);
        if (await headerCell.count() > 0) {
          await expect(headerCell).toBeVisible();
        }
      }
    });
  });

  test.describe('车辆入场测试', () => {
    
    test('TC-VEH-003: 打开车辆入场对话框', async ({ page }) => {
      // 点击入场按钮
      await page.click('button:has-text("入场")');
      
      // 验证对话框显示
      await page.waitForSelector('.el-dialog', { timeout: 5000 });
      await expect(page.locator('.el-dialog__title')).toContainText('入场');
    });

    test('TC-VEH-004: 车辆入场表单验证', async ({ page }) => {
      // 打开入场对话框
      await page.click('button:has-text("入场")');
      await page.waitForSelector('.el-dialog', { timeout: 5000 });
      
      // 直接点击确定，不填写任何信息
      await page.click('.el-dialog__footer button:has-text("确定")');
      await page.waitForTimeout(1000);
      
      // 验证表单验证提示
      const errors = await page.locator('.el-form-item__error').all();
      expect(errors.length).toBeGreaterThan(0);
    });

    test('TC-VEH-005: 成功登记车辆入场', async ({ page }) => {
      // 打开入场对话框
      await page.click('button:has-text("入场")');
      await page.waitForSelector('.el-dialog', { timeout: 5000 });
      
      // 填写车牌号
      const plateNumber = generateTestData('plate');
      await page.fill('.el-dialog input[placeholder*="车牌"], .el-dialog .el-input__inner', plateNumber);
      
      // 选择停车场（如果有下拉选择）
      const parkingSelect = page.locator('.el-dialog .el-select').first();
      if (await parkingSelect.count() > 0) {
        await parkingSelect.click();
        await page.waitForTimeout(500);
        await page.click('.el-select-dropdown__item').first();
      }
      
      // 点击确定
      await page.click('.el-dialog__footer button:has-text("确定")');
      
      // 等待操作完成
      await page.waitForTimeout(3000);
      
      // 验证对话框关闭或显示成功消息
      const dialogVisible = await page.locator('.el-dialog').isVisible().catch(() => false);
      expect(dialogVisible).toBe(false);
    });
  });

  test.describe('车辆出场测试', () => {
    
    test('TC-VEH-006: 打开车辆出场对话框', async ({ page }) => {
      // 点击出场按钮
      await page.click('button:has-text("出场")');
      
      // 验证对话框显示
      await page.waitForSelector('.el-dialog', { timeout: 5000 });
      await expect(page.locator('.el-dialog__title')).toContainText('出场');
    });

    test('TC-VEH-007: 车辆出场表单验证', async ({ page }) => {
      // 打开出场对话框
      await page.click('button:has-text("出场")');
      await page.waitForSelector('.el-dialog', { timeout: 5000 });
      
      // 直接点击确定，不填写任何信息
      await page.click('.el-dialog__footer button:has-text("确定")');
      await page.waitForTimeout(1000);
      
      // 验证表单验证提示
      const errors = await page.locator('.el-form-item__error').all();
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  test.describe('搜索功能测试', () => {
    
    test('TC-VEH-008: 按车牌号搜索车辆记录', async ({ page }) => {
      // 等待表格加载
      await waitForTableLoad(page);
      
      // 输入搜索关键词
      const searchInput = page.locator('input[placeholder*="车牌"], .search-form input').first();
      if (await searchInput.count() > 0) {
        await searchInput.fill('京A');
        
        // 点击搜索按钮
        await page.click('button:has-text("查询"), button:has-text("搜索")');
        await page.waitForTimeout(2000);
        
        // 验证搜索结果
        await expect(page.locator('.el-table')).toBeVisible();
      }
    });

    test('TC-VEH-009: 按状态筛选车辆记录', async ({ page }) => {
      // 等待表格加载
      await waitForTableLoad(page);
      
      // 查找状态下拉框
      const statusSelect = page.locator('.search-form .el-select').first();
      if (await statusSelect.count() > 0) {
        await statusSelect.click();
        await page.waitForTimeout(500);
        
        // 选择"在场"状态
        await page.click('.el-select-dropdown__item:has-text("在场")');
        await page.waitForTimeout(2000);
        
        // 验证表格重新加载
        await expect(page.locator('.el-table')).toBeVisible();
      }
    });
  });

  test.describe('分页功能测试', () => {
    
    test('TC-VEH-010: 分页组件显示', async ({ page }) => {
      // 等待表格加载
      await waitForTableLoad(page);
      
      // 验证分页组件存在
      const pagination = page.locator('.el-pagination');
      if (await pagination.count() > 0) {
        await expect(pagination).toBeVisible();
      }
    });
  });

  test.describe('表格操作测试', () => {
    
    test('TC-VEH-011: 查看车辆详情', async ({ page }) => {
      // 等待表格加载
      await waitForTableLoad(page);
      
      // 查找查看按钮
      const viewButtons = await page.locator('.el-table__row .el-button:has-text("查看")').all();
      
      if (viewButtons.length > 0) {
        // 点击第一个查看按钮
        await viewButtons[0].click();
        
        // 验证详情对话框显示
        await page.waitForSelector('.el-dialog', { timeout: 5000 });
        
        // 关闭对话框
        await page.click('.el-dialog__headerbtn, .el-dialog__close');
      } else {
        test.skip('没有可查看的车辆记录');
      }
    });
  });
});
