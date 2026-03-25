/**
 * 测试超时配置模块
 * 为所有测试用例提供统一的超时时间配置
 * 防止测试因无限等待或长时间阻塞而卡死
 */

/**
 * 超时时间配置（单位：毫秒）
 * 根据操作类型设置不同的超时时间
 */
export const TimeoutConfig = {
  // 页面导航超时
  navigation: {
    short: 10000,      // 10秒 - 简单导航
    medium: 20000,     // 20秒 - 常规导航
    long: 30000,       // 30秒 - 复杂页面导航
    default: 20000,    // 默认导航超时
  },
  
  // 元素等待超时
  element: {
    quick: 3000,       // 3秒 - 快速检查
    short: 5000,       // 5秒 - 简单元素
    medium: 10000,     // 10秒 - 常规元素
    long: 15000,       // 15秒 - 异步加载元素
    default: 10000,    // 默认元素超时
  },
  
  // API请求超时
  api: {
    quick: 5000,       // 5秒 - 简单查询
    short: 10000,      // 10秒 - 常规请求
    medium: 15000,     // 15秒 - 复杂查询
    long: 30000,       // 30秒 - 大数据量请求
    default: 15000,    // 默认API超时
  },
  
  // 操作执行超时
  action: {
    quick: 2000,       // 2秒 - 即时操作
    short: 5000,       // 5秒 - 简单操作
    medium: 10000,     // 10秒 - 常规操作
    long: 20000,       // 20秒 - 复杂操作
    default: 10000,    // 默认操作超时
  },
  
  // 整个测试用例超时
  test: {
    quick: 30000,      // 30秒 - 简单测试
    short: 60000,      // 60秒 - 常规测试
    medium: 120000,    // 120秒 - 复杂测试
    long: 300000,      // 300秒 - 端到端流程测试
    default: 60000,    // 默认测试超时
  },
  
  // 页面加载超时
  pageLoad: {
    short: 10000,      // 10秒
    medium: 20000,     // 20秒
    long: 30000,       // 30秒
    default: 20000,    // 默认页面加载超时
  },
  
  // 对话框/弹窗超时
  dialog: {
    short: 3000,       // 3秒
    medium: 5000,      // 5秒
    long: 10000,       // 10秒
    default: 5000,     // 默认对话框超时
  },
  
  // 表格加载超时
  table: {
    short: 5000,       // 5秒
    medium: 10000,     // 10秒
    long: 15000,       // 15秒
    default: 10000,    // 默认表格加载超时
  },
  
  // 网络空闲超时
  networkIdle: {
    short: 2000,       // 2秒
    medium: 5000,      // 5秒
    long: 10000,       // 10秒
    default: 5000,     // 默认网络空闲超时
  },
};

/**
 * 测试用例超时配置映射
 * 根据测试类型设置不同的超时时间
 */
export const TestCaseTimeouts = {
  // 登录相关测试
  login: {
    default: TimeoutConfig.test.short,
    specific: {
      'TC-LOGIN-001': TimeoutConfig.test.medium,  // 完整登录流程
      'TC-LOGIN-002': TimeoutConfig.test.medium,  // 记住我功能
    },
  },
  
  // 仪表板测试
  dashboard: {
    default: TimeoutConfig.test.short,
    specific: {
      'TC-DASH-001': TimeoutConfig.test.medium,  // 页面加载
      'TC-DASH-003': TimeoutConfig.test.medium,  // 统计数据加载
    },
  },
  
  // 导航测试
  navigation: {
    default: TimeoutConfig.test.short,
    specific: {
      'TC-NAV-021': TimeoutConfig.test.medium,  // 权限测试
      'TC-NAV-022': TimeoutConfig.test.medium,  // 404测试
    },
  },
  
  // 停车场管理测试
  parking: {
    default: TimeoutConfig.test.medium,
    specific: {
      'TC-PARK-007': TimeoutConfig.test.long,   // 新增停车场
      'TC-PARK-012': TimeoutConfig.test.medium, // 表格操作
    },
  },
  
  // 车辆管理测试
  vehicle: {
    default: TimeoutConfig.test.medium,
    specific: {
      'TC-VEH-005': TimeoutConfig.test.long,    // 车辆入场
      'TC-VEH-011': TimeoutConfig.test.medium,  // 查看详情
    },
  },
  
  // 系统管理测试
  system: {
    default: TimeoutConfig.test.medium,
    specific: {
      'TC-SYS-001': TimeoutConfig.test.medium,  // 用户管理
      'TC-SYS-005': TimeoutConfig.test.medium,  // 角色管理
    },
  },
  
  // API测试
  api: {
    default: TimeoutConfig.test.short,
    specific: {
      'TC-API-001': TimeoutConfig.test.medium,  // 登录接口
      'TC-API-012': TimeoutConfig.test.medium,  // 401测试
    },
  },
};

/**
 * 获取测试用例的超时时间
 * @param {string} testCategory - 测试类别
 * @param {string} testId - 测试用例ID
 * @returns {number} 超时时间（毫秒）
 */
export function getTestTimeout(testCategory, testId = '') {
  const category = TestCaseTimeouts[testCategory];
  if (!category) {
    return TimeoutConfig.test.default;
  }
  
  if (testId && category.specific[testId]) {
    return category.specific[testId];
  }
  
  return category.default;
}

/**
 * 带超时的包装函数
 * 为异步操作添加超时控制
 * @param {Promise} promise - 异步操作Promise
 * @param {number} timeout - 超时时间（毫秒）
 * @param {string} operationName - 操作名称
 * @returns {Promise} 带超时控制的Promise
 */
export function withTimeout(promise, timeout, operationName = '操作') {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(
          `【超时错误】${operationName} 执行超时\n` +
          `⏱️  配置超时时间：${timeout}ms (${(timeout / 1000).toFixed(1)}秒)\n` +
          `💡 可能原因：\n` +
          `   1. 页面加载过慢\n` +
          `   2. 网络延迟较高\n` +
          `   3. 目标元素未正确渲染\n` +
          `   4. 后端响应时间过长\n` +
          `🔧 建议措施：\n` +
          `   1. 检查网络连接状态\n` +
          `   2. 增加超时时间配置\n` +
          `   3. 检查页面性能问题\n` +
          `   4. 查看后端服务状态`
        ));
      }, timeout);
    }),
  ]);
}

/**
 * 创建带超时的页面操作
 * @param {import('@playwright/test').Page} page - Playwright page对象
 * @param {string} operation - 操作类型
 * @param {number} timeout - 超时时间
 * @returns {Object} 带超时配置的操作选项
 */
export function createTimeoutOptions(page, operation = 'default', timeout = null) {
  const timeoutMap = {
    'navigation': TimeoutConfig.navigation.default,
    'element': TimeoutConfig.element.default,
    'api': TimeoutConfig.api.default,
    'action': TimeoutConfig.action.default,
    'pageLoad': TimeoutConfig.pageLoad.default,
    'dialog': TimeoutConfig.dialog.default,
    'table': TimeoutConfig.table.default,
    'default': TimeoutConfig.action.default,
  };
  
  const finalTimeout = timeout || timeoutMap[operation] || TimeoutConfig.action.default;
  
  return {
    timeout: finalTimeout,
    // Playwright特定的超时选项
    waitForSelector: { timeout: finalTimeout },
    waitForNavigation: { timeout: finalTimeout },
    waitForResponse: { timeout: finalTimeout },
    waitForLoadState: { timeout: finalTimeout },
  };
}

/**
 * 超时配置装饰器
 * 用于为测试函数添加超时控制
 * @param {number} timeout - 超时时间
 * @param {string} operationName - 操作名称
 */
export function timeout(timeout, operationName = '操作') {
  return function (target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args) {
      return withTimeout(
        originalMethod.apply(this, args),
        timeout,
        operationName
      );
    };
    
    return descriptor;
  };
}

/**
 * 测试步骤超时包装器
 * 为单个测试步骤添加超时控制
 * @param {Function} stepFn - 测试步骤函数
 * @param {Object} options - 配置选项
 * @returns {Function} 包装后的函数
 */
export function wrapStepWithTimeout(stepFn, options = {}) {
  const {
    timeout: stepTimeout = TimeoutConfig.action.medium,
    stepName = '测试步骤',
    retries = 0,
  } = options;
  
  return async (...args) => {
    let lastError;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await withTimeout(
          stepFn(...args),
          stepTimeout,
          stepName
        );
      } catch (error) {
        lastError = error;
        
        if (attempt < retries) {
          console.log(`  ⚠️  ${stepName} 第 ${attempt + 1} 次尝试失败，正在重试...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    throw lastError;
  };
}

/**
 * 生成超时配置报告
 * @returns {string} 格式化的超时配置报告
 */
export function generateTimeoutReport() {
  return `
╔════════════════════════════════════════════════════════════════╗
║                  测试超时配置参数说明                           ║
╚════════════════════════════════════════════════════════════════╝

📋 超时时间配置（单位：毫秒）

【页面导航超时】
   快速导航：${TimeoutConfig.navigation.short}ms (10秒)
   常规导航：${TimeoutConfig.navigation.medium}ms (20秒)
   复杂导航：${TimeoutConfig.navigation.long}ms (30秒)

【元素等待超时】
   快速检查：${TimeoutConfig.element.quick}ms (3秒)
   简单元素：${TimeoutConfig.element.short}ms (5秒)
   常规元素：${TimeoutConfig.element.medium}ms (10秒)
   异步加载：${TimeoutConfig.element.long}ms (15秒)

【API请求超时】
   简单查询：${TimeoutConfig.api.quick}ms (5秒)
   常规请求：${TimeoutConfig.api.short}ms (10秒)
   复杂查询：${TimeoutConfig.api.medium}ms (15秒)
   大数据量：${TimeoutConfig.api.long}ms (30秒)

【操作执行超时】
   即时操作：${TimeoutConfig.action.quick}ms (2秒)
   简单操作：${TimeoutConfig.action.short}ms (5秒)
   常规操作：${TimeoutConfig.action.medium}ms (10秒)
   复杂操作：${TimeoutConfig.action.long}ms (20秒)

【测试用例超时】
   简单测试：${TimeoutConfig.test.quick}ms (30秒)
   常规测试：${TimeoutConfig.test.short}ms (60秒)
   复杂测试：${TimeoutConfig.test.medium}ms (120秒)
   端到端流程：${TimeoutConfig.test.long}ms (300秒)

【其他超时】
   页面加载：${TimeoutConfig.pageLoad.default}ms (20秒)
   对话框：${TimeoutConfig.dialog.default}ms (5秒)
   表格加载：${TimeoutConfig.table.default}ms (10秒)
   网络空闲：${TimeoutConfig.networkIdle.default}ms (5秒)

⚠️  注意：
   • 超时时间可根据实际网络环境和服务器性能调整
   • 建议在 CI/CD 环境中适当增加超时时间
   • 长时间运行的测试应使用更长的超时配置
`;
}

/**
 * 验证超时配置
 * 检查所有超时配置是否合理
 * @returns {Object} 验证结果
 */
export function validateTimeoutConfig() {
  const issues = [];
  const MIN_TIMEOUT = 1000;  // 最小1秒
  const MAX_TIMEOUT = 600000; // 最大10分钟
  
  // 检查所有配置项
  Object.entries(TimeoutConfig).forEach(([category, values]) => {
    Object.entries(values).forEach(([key, value]) => {
      if (value < MIN_TIMEOUT) {
        issues.push(`${category}.${key} 超时时间过短: ${value}ms`);
      }
      if (value > MAX_TIMEOUT) {
        issues.push(`${category}.${key} 超时时间过长: ${value}ms`);
      }
    });
  });
  
  return {
    valid: issues.length === 0,
    issues,
    message: issues.length === 0 
      ? '✅ 所有超时配置验证通过' 
      : `❌ 发现 ${issues.length} 个配置问题`,
  };
}

export default {
  TimeoutConfig,
  TestCaseTimeouts,
  getTestTimeout,
  withTimeout,
  createTimeoutOptions,
  timeout,
  wrapStepWithTimeout,
  generateTimeoutReport,
  validateTimeoutConfig,
};
