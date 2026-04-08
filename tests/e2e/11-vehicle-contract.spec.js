import { test, expect } from '@playwright/test'

const mockParking = {
  id: 1,
  name: '中心广场停车场'
}

const mockSpace = {
  id: 101,
  parkingId: 1,
  spaceNumber: 'A-001',
  sectionArea: 'A区',
  status: 1
}

const mockSession = {
  user: {
    userId: 1,
    username: 'admin',
    nickname: '管理员'
  },
  roles: ['ADMIN'],
  permissions: [
    'vehicle:manage',
    'vehicle:entry-exit',
    'vehicle:entry-exit:view',
    'billing:entry',
    'billing:exit',
    'billing:view'
  ],
  menus: [],
  permissionsLoaded: true
}

function buildOkResponse(data, message = 'success') {
  return JSON.stringify({
    code: 200,
    message,
    data
  })
}

async function seedAuthenticatedSession(page) {
  await page.addInitScript((session) => {
    window.localStorage.setItem('parking_token', 'mock-token')
    window.localStorage.setItem('parking_user_info', JSON.stringify(session))
  }, mockSession)
}

async function mockAuthenticatedUserApis(page, overrides = {}) {
  const session = {
    ...mockSession,
    ...overrides,
    user: {
      ...mockSession.user,
      ...(overrides.user || {})
    },
    roles: overrides.roles || mockSession.roles,
    permissions: overrides.permissions || mockSession.permissions,
    menus: overrides.menus || mockSession.menus
  }

  await page.route('**/sys/user/menus**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: buildOkResponse({
        user: session.user,
        roles: session.roles,
        permissions: session.permissions,
        menus: session.menus
      })
    })
  })

  await page.route(`**/sys/user/${session.user.userId}/permissions**`, async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: buildOkResponse(session.permissions)
    })
  })
}

async function mockVehiclePageApis(page, overrides = {}) {
  const parkings = overrides.parkings ?? [mockParking]
  const availableSpaces = overrides.availableSpaces ?? [mockSpace]
  const allSpaces = overrides.allSpaces ?? [mockSpace]
  const records = overrides.records ?? []

  await page.route('**/parkings/page**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: buildOkResponse({
        records: parkings,
        total: parkings.length
      })
    })
  })

  await page.route('**/vehicle/records/parking/**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: buildOkResponse(records)
    })
  })

  await page.route('**/parking-spaces/by-parking/**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: buildOkResponse(allSpaces)
    })
  })

  await page.route('**/parking-spaces/available/**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: buildOkResponse(availableSpaces)
    })
  })
}

async function selectParkingAndSpace(page) {
  const availableSpacesResponse = page.waitForResponse(response =>
    response.url().includes('/parking-spaces/available/1') && response.request().method() === 'GET'
  )

  await page.locator('.entry-panel .el-select').first().click()
  await page.locator('.el-select-dropdown__item').filter({ hasText: mockParking.name }).first().click()
  await availableSpacesResponse

  await page.locator('.entry-panel .el-select').nth(1).click()
}

test.describe('车辆页前后端契约测试', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuthenticatedSession(page)
    await mockAuthenticatedUserApis(page)
    await mockVehiclePageApis(page)
  })

  test('TC-VEH-012: 车位选项兼容后端字段名', async ({ page }) => {
    await page.goto('/#/vehicle')
    await expect(page.locator('h1.page-title')).toContainText('车辆进出管理')

    await selectParkingAndSpace(page)

    await expect(page.locator('.el-select-dropdown__item').filter({ hasText: 'A-001 (A区)' }).first()).toBeVisible()
    await expect(page.locator('.el-select-dropdown__item').filter({ hasText: /undefined/i })).toHaveCount(0)
  })

  test('TC-VEH-005: 车辆入场请求使用查询参数提交', async ({ page }) => {
    const carNo = '粤A12345'
    let entryRequestUrl = ''
    let entryRequestBody = null

    await page.route('**/vehicle/entry**', async route => {
      entryRequestUrl = route.request().url()
      entryRequestBody = route.request().postData()

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: buildOkResponse({
          id: 9001,
          parkingId: 1,
          spaceId: 101,
          carNo,
          status: 0
        })
      })
    })

    await page.goto('/#/vehicle')
    await selectParkingAndSpace(page)

    await page.locator('.entry-panel input[placeholder="请输入车牌号"]').fill(carNo)
    await page.locator('.el-select-dropdown__item').filter({ hasText: 'A-001 (A区)' }).first().click()
    await page.locator('.entry-panel button:has-text("确认入场")').click()

    await expect.poll(() => entryRequestUrl).toContain('/vehicle/entry')

    const requestUrl = new URL(entryRequestUrl)
    expect(requestUrl.searchParams.get('parkingId')).toBe('1')
    expect(requestUrl.searchParams.get('spaceId')).toBe('101')
    expect(requestUrl.searchParams.get('carNo')).toBe(carNo)
    expect(entryRequestBody === null || entryRequestBody === '').toBeTruthy()

    await expect(page.locator('.el-message--success')).toContainText('入场登记成功')
  })
})
