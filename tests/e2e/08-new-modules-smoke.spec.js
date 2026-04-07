/**
 * 新模块路由烟雾测试（未登录应跳转登录页）
 */
import { test, expect } from '@playwright/test'

const protectedPaths = [
  '/#/guidance',
  '/#/reservation',
  '/#/system/audit-log',
  '/#/system/cache'
]

test.describe('新模块路由（未登录）', () => {
  const mapping = {
    '/#/guidance': 'TC-NEWMOD-001',
    '/#/reservation': 'TC-NEWMOD-002',
    '/#/system/audit-log': 'TC-NEWMOD-003',
    '/#/system/cache': 'TC-NEWMOD-004'
  }

  for (const hash of protectedPaths) {
    const tcId = mapping[hash]
    test(`${tcId} 访问 ${hash} 重定向到登录`, async ({ page }) => {
      await page.goto(hash)
      await page.waitForURL(/\/login/, { timeout: 15000 })
      await expect(page.locator('.login-form')).toBeVisible({ timeout: 10000 })
    })
  }
})
