/**
 * API集成测试套件
 * 测试后端API接口的可用性和响应
 */
import { test, expect } from '@playwright/test';
import { login } from '../utils/test-helpers.js';
import { loginTestData } from '../fixtures/test-data.js';

test.describe('API集成测试', () => {
  
  test.describe('认证API测试', () => {
    
    test('TC-API-001: 登录接口返回正确格式', async ({ page }) => {
      // 监听登录请求
      const loginResponse = page.waitForResponse(response => 
        response.url().includes('/auth/login') && response.status() === 200
      );
      
      // 执行登录
      await page.goto('/#/login');
      await page.fill('input[placeholder="请输入用户名"]', loginTestData.valid.username);
      await page.fill('input[placeholder="请输入密码"]', loginTestData.valid.password);
      await page.click('.login-btn');
      
      // 等待响应
      const response = await loginResponse;
      const data = await response.json();
      
      // 验证响应格式
      expect(data).toHaveProperty('code');
      expect(data).toHaveProperty('message');
      expect(data).toHaveProperty('data');
    });

    test('TC-API-002: 登录失败返回错误信息', async ({ page }) => {
      // 监听登录请求
      const loginResponse = page.waitForResponse(response => 
        response.url().includes('/auth/login')
      );
      
      // 执行错误登录
      await page.goto('/#/login');
      await page.fill('input[placeholder="请输入用户名"]', loginTestData.invalid.username);
      await page.fill('input[placeholder="请输入密码"]', loginTestData.invalid.password);
      await page.click('.login-btn');
      
      // 等待响应
      const response = await loginResponse;
      const data = await response.json();
      
      // 验证错误响应
      expect(data.code).not.toBe(200);
    });
  });

  test.describe('停车场API测试', () => {
    
    test.beforeEach(async ({ page }) => {
      await login(page);
    });

    test('TC-API-003: 获取停车场列表API', async ({ page }) => {
      const apiResponse = page.waitForResponse(response =>
        response.url().includes('/parkings/page') && response.request().method() === 'GET'
      );

      await page.goto('/#/parking');
      
      // 等待响应
      const response = await apiResponse;
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('code');
    });

    test('TC-API-004: 获取停车场列表数据格式正确', async ({ page }) => {
      const apiResponse = page.waitForResponse(response =>
        response.url().includes('/parkings/page') && response.request().method() === 'GET'
      );

      await page.goto('/#/parking');
      
      // 等待响应
      const response = await apiResponse;
      const data = await response.json();
      
      // 验证数据格式
      if (data.code === 200 && data.data) {
        expect(data.data).toHaveProperty('records');
        expect(data.data).toHaveProperty('total');
        expect(Array.isArray(data.data.records)).toBe(true);
      }
    });
  });

  test.describe('车辆API测试', () => {
    
    test.beforeEach(async ({ page }) => {
      await login(page);
    });

    test('TC-API-005: 获取车辆记录API', async ({ page }) => {
      const apiResponse = page.waitForResponse(response =>
        response.url().includes('/vehicle/records/parking/') && response.request().method() === 'GET'
      );

      await page.goto('/#/vehicle');
      
      // 等待响应
      const response = await apiResponse;
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('code');
    });
  });

  test.describe('收费API测试', () => {
    
    test.beforeEach(async ({ page }) => {
      await login(page);
    });

    test('TC-API-006: 获取收费记录API', async ({ page }) => {
      const apiResponse = page.waitForResponse(response =>
        response.url().includes('/billing/records/page') && response.request().method() === 'GET'
      );

      await page.goto('/#/billing');
      
      // 等待响应
      const response = await apiResponse;
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('code');
    });

    test('TC-API-007: 获取计费规则API', async ({ page }) => {
      const apiResponse = page.waitForResponse(response =>
        response.url().includes('/billing/rules/page') && response.request().method() === 'GET'
      );

      await page.goto('/#/billing-rule');
      
      // 等待响应
      const response = await apiResponse;
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('code');
    });
  });

  test.describe('系统API测试', () => {
    
    test.beforeEach(async ({ page }) => {
      await login(page);
    });

    test('TC-API-008: 获取用户列表API', async ({ page }) => {
      const apiResponse = page.waitForResponse(response =>
        response.url().includes('/sys/user/list') && response.request().method() === 'GET'
      );

      await page.goto('/#/system/user');
      
      // 等待响应
      const response = await apiResponse;
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('code');
    });

    test('TC-API-009: 获取角色列表API', async ({ page }) => {
      const apiResponse = page.waitForResponse(response =>
        response.url().includes('/sys/role/list') && response.request().method() === 'GET'
      );

      await page.goto('/#/system/role');
      
      // 等待响应
      const response = await apiResponse;
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('code');
    });

    test('TC-API-010: 获取权限树API', async ({ page }) => {
      const apiResponse = page.waitForResponse(response =>
        response.url().includes('/sys/permission/tree') || response.url().includes('/sys/permission/list')
      );

      await page.goto('/#/system/permission');
      
      // 等待响应
      const response = await apiResponse;
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('code');
    });
  });

  test.describe('数据分析API测试', () => {
    
    test.beforeEach(async ({ page }) => {
      await login(page);
    });

    test('TC-API-011: 获取统计数据API', async ({ page }) => {
      // 监听API请求
      const apiResponse = page.waitForResponse(response => 
        response.url().includes('/analytics') || response.url().includes('/statistics')
      );
      
      // 导航到首页
      await page.goto('/#/dashboard');
      
      // 等待响应
      const response = await apiResponse.catch(() => null);
      
      if (response) {
        expect(response.status()).toBe(200);
        const data = await response.json();
        expect(data).toHaveProperty('code');
      }
    });
  });

  test.describe('错误处理测试', () => {
    
    test('TC-API-012: 401未授权响应处理', async ({ page }) => {
      // 清除登录状态
      await page.goto('/#/login');
      
      // 尝试访问需要认证的API
      const response = await page.evaluate(async () => {
        try {
          const res = await fetch('/api/parkings/page?pageNo=1&pageSize=10', {
            method: 'GET',
            headers: {
              'Authorization': 'Bearer invalid_token'
            }
          });
          return { status: res.status };
        } catch (e) {
          return { error: e.message };
        }
      });
      
      // 验证返回401或未授权
      expect(response.status === 401 || response.status === 403 || response.error).toBe(true);
    });
  });
});
