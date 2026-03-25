/**
 * 错误分类处理模块
 * 提供前端错误和后端错误的分类、识别和处理功能
 * 所有错误信息使用中文显示
 */

/**
 * 错误类型枚举
 */
export const ErrorType = {
  // 前端错误类型
  FRONTEND_UI_RENDER: 'FRONTEND_UI_RENDER',           // UI渲染错误
  FRONTEND_LOGIC: 'FRONTEND_LOGIC',                   // 前端逻辑错误
  FRONTEND_NETWORK: 'FRONTEND_NETWORK',               // 客户端网络请求处理异常
  FRONTEND_TIMEOUT: 'FRONTEND_TIMEOUT',               // 前端操作超时
  FRONTEND_SELECTOR: 'FRONTEND_SELECTOR',             // 元素选择器错误
  FRONTEND_NAVIGATION: 'FRONTEND_NAVIGATION',         // 页面导航错误
  
  // 后端错误类型
  BACKEND_API_ERROR: 'BACKEND_API_ERROR',             // API响应错误
  BACKEND_LOGIC: 'BACKEND_LOGIC',                     // 服务器逻辑异常
  BACKEND_DATABASE: 'BACKEND_DATABASE',               // 数据库操作失败
  BACKEND_AUTHENTICATION: 'BACKEND_AUTHENTICATION',   // 认证授权错误
  BACKEND_VALIDATION: 'BACKEND_VALIDATION',           // 后端数据验证错误
  BACKEND_SERVER_ERROR: 'BACKEND_SERVER_ERROR',       // 服务器内部错误
  
  // 其他错误类型
  UNKNOWN: 'UNKNOWN',                                 // 未知错误
  NETWORK_CONNECTIVITY: 'NETWORK_CONNECTIVITY',       // 网络连接问题
};

/**
 * 错误分类判断标准配置
 */
export const ErrorClassificationRules = {
  // 前端错误关键词匹配
  frontendPatterns: {
    [ErrorType.FRONTEND_UI_RENDER]: [
      'element not found',
      'element is not visible',
      'element is detached',
      'waiting for selector',
      'locator\.\w+ failed',
      'elementHandle\.',
      'frame has been detached',
      'Execution context was destroyed',
    ],
    [ErrorType.FRONTEND_LOGIC]: [
      'evaluation failed',
      'page\.evaluate',
      'cannot read property',
      'undefined is not',
      'null is not',
      'is not a function',
      'JavaScript error',
    ],
    [ErrorType.FRONTEND_NETWORK]: [
      'net::ERR_',
      'Failed to fetch',
      'NetworkError',
      'Failed to load resource',
    ],
    [ErrorType.FRONTEND_TIMEOUT]: [
      'Timeout \d+ms exceeded',
      'waiting for (function|selector) failed',
      'page\.waitFor',
      'locator\.\w+.*timeout',
    ],
    [ErrorType.FRONTEND_SELECTOR]: [
      'strict mode violation',
      'ambiguous selector',
      'invalid selector',
      'unexpected token',
    ],
    [ErrorType.FRONTEND_NAVIGATION]: [
      'Navigation failed',
      'net::ERR_ABORTED',
      'Navigation timeout',
      'goto.*failed',
    ],
  },
  
  // 后端错误关键词匹配
  backendPatterns: {
    [ErrorType.BACKEND_API_ERROR]: [
      'api.*error',
      '接口错误',
      '请求失败',
      'response.*error',
      'status (4\d{2}|5\d{2})',
    ],
    [ErrorType.BACKEND_LOGIC]: [
      '业务逻辑错误',
      '操作失败',
      '处理异常',
      'service.*error',
    ],
    [ErrorType.BACKEND_DATABASE]: [
      'database',
      'sql',
      'query failed',
      'connection refused',
      '数据库',
      '数据操作失败',
    ],
    [ErrorType.BACKEND_AUTHENTICATION]: [
      'unauthorized',
      'forbidden',
      'token',
      '认证',
      '授权',
      '权限不足',
      '未登录',
    ],
    [ErrorType.BACKEND_VALIDATION]: [
      'validation',
      'invalid',
      '参数错误',
      '数据验证失败',
      '格式不正确',
    ],
    [ErrorType.BACKEND_SERVER_ERROR]: [
      'internal server error',
      '500',
      '服务器内部错误',
      '系统异常',
    ],
  },
};

/**
 * 中文错误信息模板
 */
export const ErrorMessages = {
  // 前端错误信息
  [ErrorType.FRONTEND_UI_RENDER]: {
    title: '【前端错误】UI渲染异常',
    description: '页面元素渲染失败或无法找到指定元素',
    suggestion: '请检查：1) 页面是否正确加载 2) 元素选择器是否正确 3) 是否存在异步加载延迟',
  },
  [ErrorType.FRONTEND_LOGIC]: {
    title: '【前端错误】JavaScript逻辑异常',
    description: '前端JavaScript代码执行出错',
    suggestion: '请检查：1) 页面脚本是否有错误 2) 浏览器控制台报错信息 3) 前端框架状态',
  },
  [ErrorType.FRONTEND_NETWORK]: {
    title: '【前端错误】网络请求处理异常',
    description: '前端发送网络请求时发生错误',
    suggestion: '请检查：1) 网络连接是否正常 2) CORS配置是否正确 3) 请求URL是否正确',
  },
  [ErrorType.FRONTEND_TIMEOUT]: {
    title: '【前端错误】操作超时',
    description: '等待页面元素或操作完成超时',
    suggestion: '请检查：1) 页面加载速度 2) 网络延迟 3) 是否需要增加超时时间',
  },
  [ErrorType.FRONTEND_SELECTOR]: {
    title: '【前端错误】元素选择器异常',
    description: '页面元素选择器匹配失败或存在歧义',
    suggestion: '请检查：1) 选择器语法是否正确 2) 是否存在多个匹配元素 3) 元素是否在DOM中',
  },
  [ErrorType.FRONTEND_NAVIGATION]: {
    title: '【前端错误】页面导航异常',
    description: '页面跳转或导航失败',
    suggestion: '请检查：1) 路由配置是否正确 2) 目标页面是否存在 3) 是否有未处理的弹窗阻塞',
  },
  
  // 后端错误信息
  [ErrorType.BACKEND_API_ERROR]: {
    title: '【后端错误】API接口异常',
    description: '后端API接口返回错误响应',
    suggestion: '请检查：1) 接口文档是否正确 2) 请求参数是否正确 3) 后端服务是否正常运行',
  },
  [ErrorType.BACKEND_LOGIC]: {
    title: '【后端错误】业务逻辑异常',
    description: '后端业务处理逻辑出错',
    suggestion: '请检查：1) 业务流程是否正确 2) 数据状态是否合法 3) 后端日志中的错误信息',
  },
  [ErrorType.BACKEND_DATABASE]: {
    title: '【后端错误】数据库操作异常',
    description: '数据库查询或操作失败',
    suggestion: '请检查：1) 数据库连接是否正常 2) SQL语句是否正确 3) 数据库服务状态',
  },
  [ErrorType.BACKEND_AUTHENTICATION]: {
    title: '【后端错误】认证授权异常',
    description: '用户认证或权限验证失败',
    suggestion: '请检查：1) 登录状态是否有效 2) Token是否过期 3) 用户权限是否足够',
  },
  [ErrorType.BACKEND_VALIDATION]: {
    title: '【后端错误】数据验证异常',
    description: '提交的数据未通过后端验证',
    suggestion: '请检查：1) 数据格式是否正确 2) 必填字段是否完整 3) 数据范围是否合法',
  },
  [ErrorType.BACKEND_SERVER_ERROR]: {
    title: '【后端错误】服务器内部异常',
    description: '服务器发生内部错误',
    suggestion: '请检查：1) 后端服务日志 2) 服务器资源使用情况 3) 联系后端开发人员',
  },
  
  // 其他错误信息
  [ErrorType.NETWORK_CONNECTIVITY]: {
    title: '【网络错误】连接异常',
    description: '网络连接出现问题，无法访问目标服务',
    suggestion: '请检查：1) 网络连接是否正常 2) 目标服务器是否可访问 3) 防火墙设置',
  },
  [ErrorType.UNKNOWN]: {
    title: '【未知错误】未分类异常',
    description: '发生未知类型的错误',
    suggestion: '请查看详细错误信息，联系开发团队进行分析',
  },
};

/**
 * 根据错误信息分类错误类型
 * @param {Error|string} error - 错误对象或错误信息
 * @returns {string} 错误类型
 */
export function classifyError(error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : '';
  const fullError = `${errorMessage} ${errorStack}`;
  
  // 先检查后端错误模式
  for (const [errorType, patterns] of Object.entries(ErrorClassificationRules.backendPatterns)) {
    for (const pattern of patterns) {
      const regex = new RegExp(pattern, 'i');
      if (regex.test(fullError)) {
        return errorType;
      }
    }
  }
  
  // 再检查前端错误模式
  for (const [errorType, patterns] of Object.entries(ErrorClassificationRules.frontendPatterns)) {
    for (const pattern of patterns) {
      const regex = new RegExp(pattern, 'i');
      if (regex.test(fullError)) {
        return errorType;
      }
    }
  }
  
  // 检查网络连接错误
  if (/ECONNREFUSED|ETIMEDOUT|ENOTFOUND|socket hang up/i.test(fullError)) {
    return ErrorType.NETWORK_CONNECTIVITY;
  }
  
  return ErrorType.UNKNOWN;
}

/**
 * 获取错误的中文信息
 * @param {string} errorType - 错误类型
 * @param {Error|string} originalError - 原始错误
 * @returns {Object} 格式化的错误信息
 */
export function getErrorMessage(errorType, originalError) {
  const template = ErrorMessages[errorType] || ErrorMessages[ErrorType.UNKNOWN];
  const originalMessage = originalError instanceof Error ? originalError.message : String(originalError);
  
  return {
    type: errorType,
    title: template.title,
    description: template.description,
    suggestion: template.suggestion,
    originalError: originalMessage,
    timestamp: new Date().toLocaleString('zh-CN'),
    formatted: `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${template.title}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【错误描述】
${template.description}

【原始错误信息】
${originalMessage}

【处理建议】
${template.suggestion}

【发生时间】
${new Date().toLocaleString('zh-CN')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `.trim(),
  };
}

/**
 * 包装测试函数，添加错误分类处理
 * @param {Function} testFn - 测试函数
 * @param {Object} options - 配置选项
 * @returns {Function} 包装后的测试函数
 */
export function wrapTestWithErrorHandling(testFn, options = {}) {
  return async (...args) => {
    try {
      return await testFn(...args);
    } catch (error) {
      const errorType = classifyError(error);
      const errorInfo = getErrorMessage(errorType, error);
      
      // 添加额外的上下文信息
      if (options.testName) {
        errorInfo.testName = options.testName;
      }
      if (options.page) {
        errorInfo.pageUrl = await options.page.url().catch(() => '无法获取');
      }
      
      // 创建新的错误对象，包含分类信息
      const classifiedError = new Error(errorInfo.formatted);
      classifiedError.errorType = errorType;
      classifiedError.errorInfo = errorInfo;
      classifiedError.originalError = error;
      
      throw classifiedError;
    }
  };
}

/**
 * Playwright 测试的错误处理器
 * 用于在测试失败时提供详细的错误分类信息
 */
export class TestErrorHandler {
  constructor() {
    this.errors = [];
  }
  
  /**
   * 处理测试错误
   * @param {Error} error - 错误对象
   * @param {Object} context - 测试上下文
   * @returns {Object} 处理后的错误信息
   */
  handleError(error, context = {}) {
    const errorType = classifyError(error);
    const errorInfo = getErrorMessage(errorType, error);
    
    const enrichedError = {
      ...errorInfo,
      testName: context.testName || '未知测试',
      testFile: context.testFile || '未知文件',
      pageUrl: context.pageUrl || '未知页面',
    };
    
    this.errors.push(enrichedError);
    
    return enrichedError;
  }
  
  /**
   * 生成测试错误报告
   * @returns {string} 格式化的错误报告
   */
  generateReport() {
    if (this.errors.length === 0) {
      return '✅ 测试执行成功，未发现错误';
    }
    
    const frontendErrors = this.errors.filter(e => e.type.startsWith('FRONTEND_'));
    const backendErrors = this.errors.filter(e => e.type.startsWith('BACKEND_'));
    const otherErrors = this.errors.filter(e => 
      !e.type.startsWith('FRONTEND_') && !e.type.startsWith('BACKEND_')
    );
    
    let report = `
╔════════════════════════════════════════════════════════════════╗
║                    测试错误分析报告                             ║
╚════════════════════════════════════════════════════════════════╝

📊 错误统计：
   • 前端错误：${frontendErrors.length} 个
   • 后端错误：${backendErrors.length} 个
   • 其他错误：${otherErrors.length} 个
   • 总计：${this.errors.length} 个

`;
    
    if (frontendErrors.length > 0) {
      report += `┌─────────────────────────────────────────────────────────────┐\n`;
      report += `│  前端错误详情 (${frontendErrors.length}个)                      │\n`;
      report += `└─────────────────────────────────────────────────────────────┘\n\n`;
      frontendErrors.forEach((err, index) => {
        report += `[${index + 1}] ${err.title}\n`;
        report += `    测试用例：${err.testName}\n`;
        report += `    错误描述：${err.description}\n`;
        report += `    建议措施：${err.suggestion}\n\n`;
      });
    }
    
    if (backendErrors.length > 0) {
      report += `┌─────────────────────────────────────────────────────────────┐\n`;
      report += `│  后端错误详情 (${backendErrors.length}个)                      │\n`;
      report += `└─────────────────────────────────────────────────────────────┘\n\n`;
      backendErrors.forEach((err, index) => {
        report += `[${index + 1}] ${err.title}\n`;
        report += `    测试用例：${err.testName}\n`;
        report += `    错误描述：${err.description}\n`;
        report += `    建议措施：${err.suggestion}\n\n`;
      });
    }
    
    return report;
  }
  
  /**
   * 清空错误记录
   */
  clear() {
    this.errors = [];
  }
}

/**
 * 创建带错误分类的测试标题
 * @param {string} title - 原始测试标题
 * @param {string} category - 测试类别
 * @returns {string} 增强的测试标题
 */
export function createTestTitle(title, category = '') {
  const categoryPrefix = category ? `[${category}] ` : '';
  return `${categoryPrefix}${title}`;
}

/**
 * 超时错误包装器
 * 将超时错误转换为分类错误
 * @param {Error} error - 原始错误
 * @param {string} operation - 操作描述
 * @returns {Error} 包装后的错误
 */
export function wrapTimeoutError(error, operation = '操作') {
  const errorType = ErrorType.FRONTEND_TIMEOUT;
  const template = ErrorMessages[errorType];
  
  const message = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${template.title}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【错误描述】
${template.description}

【超时操作】
${operation}

【原始错误】
${error.message}

【处理建议】
${template.suggestion}

【发生时间】
${new Date().toLocaleString('zh-CN')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `.trim();
  
  const wrappedError = new Error(message);
  wrappedError.errorType = errorType;
  wrappedError.originalError = error;
  
  return wrappedError;
}

export default {
  ErrorType,
  ErrorClassificationRules,
  ErrorMessages,
  classifyError,
  getErrorMessage,
  wrapTestWithErrorHandling,
  TestErrorHandler,
  createTestTitle,
  wrapTimeoutError,
};
