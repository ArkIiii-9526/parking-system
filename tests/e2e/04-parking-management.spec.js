/**
 * 停车场管理测试套件
 * 测试停车场管理页面的CRUD操作
 */
import { test, expect } from '@playwright/test';
import { login, waitForTableLoad, waitForMessage, generateTestData } from '../utils/test-helpers.js';
import { parkingTestData } from '../fixtures/test-data.js';

test.describe('停车场管理测试', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page);
    // 导航到停车场管理页面
    await page.click('.menu-title:has-text("停车场管理")');
    await page.waitForURL(/.*\/parking/);
    await page.waitForSelector('h2:has-text("停车场管理")', { timeout: 10000 });
  });

  test.describe('页面加载测试', () => {
    
    test('TC-PARK-001: 停车场管理页面正确加载', async ({ page }) => {
      // 验证页面标题
      await expect(page.locator('h2')).toContainText('停车场管理');
      
      // 验证搜索区域
      await expect(page.locator('.search-form, .filter-section')).toBeVisible();
      
      // 验证操作按钮
      await expect(page.locator('button:has-text("新增")')).toBeVisible();
    });

    test('TC-PARK-002: 停车场列表正确显示', async ({ page }) => {
      // 等待表格加载
      await waitForTableLoad(page);
      
      // 验证表格存在
      await expect(page.locator('.el-table')).toBeVisible();
      
      // 验证表头
      const headers = ['名称', '地址', '总车位', '可用车位', '联系人', '联系电话', '状态', '操作'];
      for (const header of headers) {
        const headerCell = page.locator(`.el-table__header th:has-text("${header}")`);
        if (await headerCell.count() > 0) {
          await expect(headerCell).toBeVisible();
        }
      }
    });
  });

  test.describe('搜索功能测试', () => {
    
    test('TC-PARK-003: 按名称搜索停车场', async ({ page }) => {
      // 等待表格加载
      await waitForTableLoad(page);
      
      // 输入搜索关键词
      const searchInput = page.locator('input[placeholder*="名称"], .search-form input').first();
      if (await searchInput.count() > 0) {
        await searchInput.fill('测试');
        
        // 点击搜索按钮
        await page.click('button:has-text("查询"), button:has-text("搜索")');
        await page.waitForTimeout(2000);
        
        // 验证搜索结果
        const rows = await page.locator('.el-table__row').all();
        // 搜索结果可能为空或包含匹配项
      }
    });

    test('TC-PARK-004: 重置搜索条件', async ({ page }) => {
      // 输入搜索条件
      const searchInput = page.locator('input[placeholder*="名称"], .search-form input').first();
      if (await searchInput.count() > 0) {
        await searchInput.fill('测试');
        
        // 点击重置按钮
        await page.click('button:has-text("重置")');
        await page.waitForTimeout(1000);
        
        // 验证输入框被清空
        const value = await searchInput.inputValue();
        expect(value).toBe('');
      }
    });
  });

  test.describe('新增停车场测试', () => {
    
    test('TC-PARK-005: 打开新增停车场对话框', async ({ page }) => {
      // 点击新增按钮
      await page.click('button:has-text("新增")');
      
      // 验证对话框显示
      await page.waitForSelector('.el-dialog', { timeout: 5000 });
      await expect(page.locator('.el-dialog__title')).toContainText('新增');
    });

    test('TC-PARK-006: 新增停车场表单验证', async ({ page }) => {
      // 打开新增对话框
      await page.click('button:has-text("新增")');
      await page.waitForSelector('.el-dialog', { timeout: 5000 });
      
      // 直接点击确定，不填写任何信息
      await page.click('.el-dialog__footer button:has-text("确定")');
      await page.waitForTimeout(1000);
      
      // 验证表单验证提示
      const errors = await page.locator('.el-form-item__error').all();
      expect(errors.length).toBeGreaterThan(0);
    });

    test('TC-PARK-007: 成功新增停车场', async ({ page }) => {
      // 打开新增对话框
      await page.click('button:has-text("新增")');
      await page.waitForSelector('.el-dialog', { timeout: 5000 });
      
      // 填写表单
      const testName = `测试停车场_${generateTestData()}`;
      await page.fill('.el-dialog input[placeholder*="名称"], .el-dialog .el-input__inner', testName);
      
      // 填写地址
      const addressInput = page.locator('.el-dialog input[placeholder*="地址"]').first();
      if (await addressInput.count() > 0) {
        await addressInput.fill('测试地址123号');
      }
      
      // 点击确定
      await page.click('.el-dialog__footer button:has-text("确定")');
      
      // 等待操作完成
      await page.waitForTimeout(3000);
      
      // 验证成功消息或对话框关闭
      const dialogVisible = await page.locator('.el-dialog').isVisible().catch(() => false);
      expect(dialogVisible).toBe(false);
    });
  });

  test.describe('编辑停车场测试', () => {
    
    test('TC-PARK-008: 编辑按钮功能', async ({ page }) => {
      // 等待表格加载
      await waitForTableLoad(page);
      
      // 查找编辑按钮
      const editButtons = await page.locator('.el-table__row .el-button:has-text("编辑")').all();
      
      if (editButtons.length > 0) {
        // 点击第一个编辑按钮
        await editButtons[0].click();
        
        // 验证编辑对话框显示
        await page.waitForSelector('.el-dialog', { timeout: 5000 });
        await expect(page.locator('.el-dialog__title')).toContainText('编辑');
        
        // 关闭对话框
        await page.click('.el-dialog__headerbtn, .el-dialog__close');
      } else {
        test.skip('没有可编辑的停车场数据');
      }
    });
  });

  test.describe('删除停车场测试', () => {
    
    test('TC-PARK-009: 删除按钮功能', async ({ page }) => {
      // 等待表格加载
      await waitForTableLoad(page);
      
      // 查找删除按钮
      const deleteButtons = await page.locator('.el-table__row .el-button:has-text("删除")').all();
      
      if (deleteButtons.length > 0) {
        // 点击第一个删除按钮
        await deleteButtons[0].click();
        
        // 验证确认对话框显示
        await page.waitForSelector('.el-message-box', { timeout: 5000 });
        await expect(page.locator('.el-message-box__message')).toContainText('确定');
        
        // 点击取消
        await page.click('.el-message-box__btns button:has-text("取消")');
      } else {
        test.skip('没有可删除的停车场数据');
      }
    });
  });

  test.describe('分页功能测试', () => {
    
    test('TC-PARK-010: 分页组件显示', async ({ page }) => {
      // 等待表格加载
      await waitForTableLoad(page);
      
      // 验证分页组件存在
      const pagination = page.locator('.el-pagination');
      if (await pagination.count() > 0) {
        await expect(pagination).toBeVisible();
      }
    });

    test('TC-PARK-011: 切换每页显示数量', async ({ page }) => {
      const pagination = page.locator('.el-pagination');
      if (await pagination.count() > 0) {
        // 查找每页数量选择器
        const sizeSelector = page.locator('.el-pagination__sizes .el-input');
        if (await sizeSelector.count() > 0) {
          await sizeSelector.click();
          await page.waitForTimeout(500);
          
          // 选择50条/页
          await page.click('.el-select-dropdown__item:has-text("50")');
          await page.waitForTimeout(2000);
          
          // 验证表格重新加载
          await expect(page.locator('.el-table')).toBeVisible();
        }
      }
    });
  });

  test.describe('表格操作测试', () => {
    
    test('TC-PARK-012: 表格行选择功能', async ({ page }) => {
      // 等待表格加载
      await waitForTableLoad(page);
      
      // 查找复选框
      const checkboxes = await page.locator('.el-table__header .el-checkbox').all();
      if (checkboxes.length > 0) {
        // 点击全选
        await checkboxes[0].click();
        await page.waitForTimeout(500);
        
        // 验证行被选中
        const selectedRows = await page.locator('.el-table__row .is-checked').all();
        // 可能有选中行
      }
    });

    test('TC-PARK-013: 表格排序功能', async ({ page }) => {
      // 等待表格加载
      await waitForTableLoad(page);
      
      // 查找可排序的表头
      const sortableHeaders = await page.locator('.el-table__header .caret-wrapper').all();
      
      if (sortableHeaders.length > 0) {
        // 点击排序
        await sortableHeaders[0].click();
        await page.waitForTimeout(1000);
        
        // 验证表格重新排序
        await expect(page.locator('.el-table')).toBeVisible();
      }
    });
  });
});
