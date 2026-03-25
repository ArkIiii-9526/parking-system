// @ts-check
import { defineConfig, devices } from '@playwright/test';

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',
  /* Run tests in files in parallel */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: 1,
  
  /* 测试用例超时配置 - 防止测试卡死 */
  timeout: 120000, // 每个测试用例最长120秒
  
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
    ['json', { outputFile: 'test-results/test-results.json' }],
    // 使用自定义中文报告器
    ['./tests/utils/chinese-reporter.js', { 
      outputPath: 'test-results/chinese-report.txt',
      environment: process.env.NODE_ENV || '开发环境',
      browser: 'Chromium'
    }],
  ],
  
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:8077',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Video recording on failure */
    video: 'retain-on-failure',
    
    /* Use Chromium browser (not system Chrome) */
    ...devices['Desktop Chrome'],
    
    /* Viewport size */
    viewport: { width: 1920, height: 1080 },
    
    /* Action timeout - 操作超时配置 */
    actionTimeout: 15000,  // 15秒
    
    /* Navigation timeout - 导航超时配置 */
    navigationTimeout: 30000,  // 30秒
    
    /* 测试失败时保留的上下文 */
    contextOptions: {
      recordVideo: {
        dir: 'test-results/videos/',
        size: { width: 1920, height: 1080 },
      },
    },
  },

  /* Configure single browser */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],

  /* Run your local dev server before starting the tests - 禁用自动启动，手动启动 */
  // webServer: {
  //   command: 'npm run preview',
  //   url: 'http://localhost:8077',
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120000,
  // },
  
  /* 全局设置 */
  globalSetup: './tests/utils/global-setup.js',
  globalTeardown: './tests/utils/global-teardown.js',
});
