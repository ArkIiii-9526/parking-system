# 前端页面TTL测试计划

## 1. 目标

- 通过TTL门禁将单次测试周期控制在可预测范围内。
- 以功能清单矩阵驱动覆盖，确保导航、表单、图表、权限、异常处理全覆盖。
- 在提交、每日凌晨、预发布三个阶段形成分层执行策略。

## 2. TTL分级策略

| TTL类型 | 阈值 | 适用场景 | 失败判定 |
|---|---:|---|---|
| UI_RENDER | 2000ms | 页面首屏渲染、静态组件展示、错误提示出现 | 用例耗时 > 阈值 |
| API_REQUEST | 5000ms | 单接口请求、鉴权、统计查询 | 用例耗时 > 阈值 |
| COMPLEX_INTERACTION | 10000ms | 多步骤交互、弹窗+表单+跳转、权限流转 | 用例耗时 > 阈值 |

- 质量门禁脚本会读取 `test-results/test-results.json`，对每条用例执行TTL对比。
- 超时即标记为TTL过期，写入 `test-results/ttl-gate/ttl-details.json` 与 `ttl-report.md`。

## 3. 功能清单矩阵

- 功能矩阵文件：`tests/governance/functional-matrix.csv`。
- 每条记录包含 `case_id/module/dimension/scenario_type/ttl_type/direction`。
- 每个维度至少包含正向与逆向场景：
  - 导航：菜单跳转、重定向、404。
  - 表单：必填校验、非法输入、提交成功。
  - 图表：图表渲染、筛选切换、数据刷新。
  - 权限：菜单可见性、无权限拒绝、401跳转。
  - 异常处理：超时、网络波动、后端异常响应。

## 4. 三阶段执行策略

| 阶段 | 触发条件 | 执行范围 | 质量目标 |
|---|---|---|---|
| 提交阶段 | push / pull_request | 冒烟集（登录、导航、仪表盘、API、新模块路由） | 快速反馈，阻断显著回归 |
| 每日凌晨 | schedule 02:00 | 全量E2E | 覆盖率≥95%，识别慢性性能退化 |
| 预发布阶段 | release分支push或手动stage=pre-release | 全量E2E + TTL门禁 | 发布前零高优先缺陷 |

## 5. 失败与根因分析流程

- 根因类型统一归档为：
  - CODE_DEFECT
  - NETWORK_DELAY
  - TEST_SCRIPT_ISSUE
- 质量门禁脚本按错误文本自动初分；QA在缺陷表中二次确认。
- SLA：TTL过期或失败用例需在24小时内完成修复或更新用例。
- 修复闭环动作：
  - 代码缺陷：修复业务代码并回归。
  - 网络延迟：补充重试策略或环境稳定性治理。
  - 脚本问题：更新定位器、等待策略或数据夹具。

## 6. 交付物定义

- 测试计划文档：`tests/governance/test-plan.md`
- 自动化脚本：`scripts/ttl-quality-gate.js`
- 覆盖与耗时报告：`test-results/ttl-gate/ttl-report.md`
- 缺陷跟踪表：`test-results/ttl-gate/defect-tracking.csv` 与 `tests/governance/defect-tracking.csv`
- 用例版本记录：`tests/governance/case-version-log.csv`
