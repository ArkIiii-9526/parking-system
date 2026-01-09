# 智慧停车引导系统 - 后端接口文档

## 1. 系统概述

智慧停车引导系统后端基于Spring Boot开发，采用RESTful API设计风格，提供了停车场管理、停车位管理、车辆进出管理、收费记录管理、计费规则管理以及系统权限管理等功能。

## 2. 基础信息

### 2.1 服务器信息
- **端口号**：8076
- **Context Path**：/api

### 2.2 接口路径结构
后端服务器已经配置了Context Path为 `/api`，因此**所有请求路径的完整格式为**：
```
http://服务器地址:8076/api/具体接口路径
```

### 2.3 接口前缀说明
- 文档中列出的所有接口路径已经包含了完整的前缀
- **请勿在文档提供的接口路径前再添加 `/api` 前缀**，否则会导致请求路径错误（如 `/api/api/parkings` 这样的错误路径）
- 例如：文档中接口路径为 `/api/parkings/page`，前端直接使用该路径即可，无需添加任何前缀

### 2.4 响应格式
所有接口返回格式统一为：
```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

### 2.5 权限控制
- 业务接口采用 `@RequiresPermission` 注解进行权限控制
- 系统管理接口需通过JWT认证

## 3. 认证管理接口

| 接口地址 | 请求方法 | 功能描述 | 权限要求 |
|---------|---------|---------|---------|
| `/api/auth/login` | POST | 登录接口 | 无 |
| `/api/auth/logout` | POST | 登出接口 | 无 |
| `/api/auth/refresh` | POST | 刷新Token接口 | 无 |

#### 3.1 登录接口
**请求参数：**
```json
{
  "username": "admin",
  "password": "123456"
}
```

**返回结果：**
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "userId": 1,
      "username": "admin",
      "nickname": "管理员",
      "userType": "ADMIN",
      "status": 1
    }
  }
}
```

#### 3.2 登出接口
**请求参数：** 无

**返回结果：**
```json
{
  "code": 200,
  "message": "登出成功",
  "data": null
}
```

#### 3.3 刷新Token接口
**请求参数：**
- Authorization: Bearer token（请求头，必填）

**返回结果：**
```json
{
  "code": 200,
  "message": "Token刷新成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

## 4. 业务功能接口

### 4.1 停车场管理

| 接口地址 | 请求方法 | 功能描述 | 权限要求 |
|---------|---------|---------|---------|
| `/api/parkings/page` | GET | 分页查询停车场 | parking:list |
| `/api/parkings/{id}` | GET | 获取停车场详情 | parking:view |
| `/api/parkings` | POST | 新增停车场 | parking:add |
| `/api/parkings` | PUT | 更新停车场 | parking:edit |
| `/api/parkings/{id}` | DELETE | 删除停车场 | parking:delete |
| `/api/parkings/nearby` | GET | 根据经纬度查询附近停车场 | 无 |
| `/api/parkings/{id}/statistics` | GET | 获取停车场车位统计 | parking:view |

#### 4.1.1 分页查询停车场
**请求参数：**
- pageNo: 页码（默认1）
- pageSize: 每页条数（默认10）
- name: 停车场名称（模糊查询）
- address: 停车场地址（模糊查询）

**返回结果：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "records": [
      {
        "id": 1,
        "name": "智慧停车场",
        "address": "北京市朝阳区",
        "totalSpaces": 100,
        "availableSpaces": 50,
        "latitude": 39.9042,
        "longitude": 116.4074,
        "status": 1
      }
    ],
    "total": 1,
    "size": 10,
    "current": 1
  }
}
```

### 4.2 停车位管理

| 接口地址 | 请求方法 | 功能描述 | 权限要求 |
|---------|---------|---------|---------|
| `/api/parking-spaces/page` | GET | 分页查询停车位 | space:view |
| `/api/parking-spaces/by-parking/{parkingId}` | GET | 根据停车场查询车位 | space:view |
| `/api/parking-spaces/available/{parkingId}` | GET | 查询可用车位 | 无 |
| `/api/parking-spaces/group/{parkingId}` | GET | 按楼层和区域分组查询 | space:view |
| `/api/parking-spaces` | POST | 新增停车位 | space:add |
| `/api/parking-spaces` | PUT | 更新停车位 | space:edit |
| `/api/parking-spaces/{id}` | DELETE | 删除停车位 | space:delete |
| `/api/parking-spaces/{id}/status` | PUT | 更新车位状态 | space:edit |
| `/api/parking-spaces/{id}/reserve` | PUT | 预约车位 | 无 |
| `/api/parking-spaces/{id}/release` | PUT | 释放车位 | space:edit |

#### 4.2.1 查询可用车位
**请求参数：**
- parkingId: 停车场ID（路径参数）

**返回结果：**
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 1,
      "spaceCode": "A-001",
      "parkingId": 1,
      "floor": "1F",
      "area": "A区",
      "spaceType": 1,
      "status": 1
    }
  ]
}
```

### 4.3 车辆进出管理

| 接口地址 | 请求方法 | 功能描述 | 权限要求 |
|---------|---------|---------|---------|
| `/api/vehicle/entry` | POST | 车辆入场登记 | billing:entry |
| `/api/vehicle/exit` | POST | 车辆出场登记 | billing:exit |
| `/api/vehicle/active-entry` | GET | 获取车辆当前入场记录 | billing:view |
| `/api/vehicle/records/parking/{parkingId}` | GET | 根据停车场查询车辆进出记录 | billing:view |
| `/api/vehicle/records/car/{carNo}` | GET | 根据车牌号查询车辆进出记录 | billing:view |

#### 4.3.1 车辆入场登记
**请求参数：**
- parkingId: 停车场ID（必填）
- spaceId: 停车位ID（必填）
- carNo: 车牌号（必填）

**返回结果：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "carNo": "京A12345",
    "parkingId": 1,
    "spaceId": 1,
    "entryTime": "2023-12-01T10:00:00",
    "exitTime": null,
    "status": 1
  }
}
```

### 4.4 收费记录管理

| 接口地址 | 请求方法 | 功能描述 | 权限要求 |
|---------|---------|---------|---------|
| `/api/billing/records/{id}/pay` | PUT | 支付停车费 | billing:pay |
| `/api/billing/records/page` | GET | 分页查询收费记录 | billing:view |
| `/api/billing/records/statistics/daily` | GET | 日报表统计 | billing:statistics |
| `/api/billing/records/export` | POST | 导出收费记录 | billing:export |

#### 4.4.1 支付停车费
**请求参数：**
- id: 记录ID（路径参数）
- paymentMethod: 支付方式（必填）
- paymentTransactionNo: 支付交易号（必填）
- actualAmount: 实际支付金额（必填）

**返回结果：**
```json
{
  "code": 200,
  "message": "success",
  "data": true
}
```

### 4.5 计费规则管理

| 接口地址 | 请求方法 | 功能描述 | 权限要求 |
|---------|---------|---------|---------|
| `/api/billing/rules/page` | GET | 分页查询计费规则 | billing:rule:view |
| `/api/billing/rules` | POST | 新增计费规则 | billing:rule:add |
| `/api/billing/rules` | PUT | 更新计费规则 | billing:rule:update |
| `/api/billing/rules/{id}` | DELETE | 删除计费规则 | billing:rule:delete |
| `/api/billing/rules/{id}/enable` | PUT | 启用规则 | billing:rule:enable |
| `/api/billing/rules/{id}/disable` | PUT | 禁用规则 | billing:rule:disable |
| `/api/billing/rules/calculate` | POST | 试算停车费用 | billing:rule:calculate |
| `/api/billing/rules/parking/{parkingId}` | GET | 获取停车场有效规则 | 无 |

#### 4.5.1 试算停车费用
**请求参数：**
- ruleId: 规则ID（必填）
- entryTime: 入场时间（必填）
- exitTime: 出场时间（必填）

**返回结果：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "totalTime": 120,
    "totalFee": 10.00,
    "details": [
      {
        "period": "首小时",
        "time": 60,
        "fee": 5.00
      },
      {
        "period": "超时",
        "time": 60,
        "fee": 5.00
      }
    ]
  }
}
```

#### 4.5.2 删除计费规则
**请求参数：**
- id: 规则ID（路径参数，必填）

**返回结果：**
```json
{
  "code": 200,
  "message": "success",
  "data": true
}
```

## 4. 系统管理接口

### 4.1 用户管理

| 接口地址 | 请求方法 | 功能描述 | 权限要求 |
|---------|---------|---------|---------|
| `/api/sys/user/list` | GET | 获取用户列表 | 无 |
| `/api/sys/user/{userId}` | GET | 获取用户详情 | 无 |
| `/api/sys/user` | POST | 新增用户 | user:add |
| `/api/sys/user` | PUT | 更新用户 | user:edit |
| `/api/sys/user/{userId}` | DELETE | 删除用户 | user:delete |
| `/api/sys/user/role/assign` | POST | 为用户分配角色 | user:assignRole |
| `/api/sys/user/{userId}/roles` | GET | 获取用户角色ID列表 | 无 |
| `/api/sys/user/{userId}/permissions` | GET | 获取用户权限列表 | 无 |
| `/api/sys/user/status` | PUT | 更新用户状态 | user:edit |
| `/api/sys/user/menus` | GET | 获取用户菜单 | 无 |

### 4.2 角色管理

| 接口地址 | 请求方法 | 功能描述 | 权限要求 |
|---------|---------|---------|---------|
| `/api/sys/role/list` | GET | 获取角色列表 | 无 |
| `/api/sys/role/{roleId}` | GET | 获取角色详情 | 无 |
| `/api/sys/role` | POST | 新增角色 | 无 |
| `/api/sys/role` | PUT | 更新角色 | 无 |
| `/api/sys/role/{roleId}` | DELETE | 删除角色 | 无 |
| `/api/sys/role/permission/bind` | POST | 绑定权限到角色 | 无 |
| `/api/sys/role/{roleId}/permissions` | GET | 获取角色权限ID列表 | 无 |
| `/api/sys/role/{roleId}/permissions/tree` | GET | 获取角色权限树 | 无 |

### 4.3 权限管理

| 接口地址 | 请求方法 | 功能描述 | 权限要求 |
|---------|---------|---------|---------|
| `/api/sys/permission/list` | GET | 获取权限列表 | 无 |
| `/api/sys/permission/tree` | GET | 获取完整权限树 | 无 |
| `/api/sys/permission/{permissionId}` | GET | 获取权限详情 | 无 |
| `/api/sys/permission` | POST | 新增权限 | 无 |
| `/api/sys/permission` | PUT | 更新权限 | 无 |
| `/api/sys/permission/{permissionId}` | DELETE | 删除权限 | 无 |
| `/api/sys/permission/refresh` | POST | 刷新权限缓存 | 无 |

## 5. 数据字典

### 5.1 停车位状态
| 状态值 | 状态描述 |
|-------|---------|
| 1 | 空闲 |
| 2 | 占用 |
| 3 | 已预约 |

### 5.2 支付状态
| 状态值 | 状态描述 |
|-------|---------|
| 0 | 未支付 |
| 1 | 已支付 |
| 2 | 部分支付 |

### 5.3 订单状态
| 状态值 | 状态描述 |
|-------|---------|
| 0 | 进行中 |
| 1 | 未支付 |
| 2 | 已支付 |
| 3 | 已取消 |

## 6. 注意事项

1. 所有接口请求参数需严格按照文档要求传递
2. 接口返回结果中的数据结构可能会根据实际业务需求进行调整
3. 涉及权限控制的接口需确保当前用户具有相应权限
4. 对于分页查询接口，建议前端默认使用pageNo=1，pageSize=10
5. 时间参数格式统一使用ISO 8601格式，如：2023-12-01T10:00:00

## 7. 版本更新日志

| 版本号 | 更新日期 | 更新内容 |
|-------|---------|---------|
| 1.0.5 | 2026-01-08 | 添加了logout、refresh和deleteBillingRule接口 |
| 1.0.4 | 2026-01-08 | 添加了认证管理接口章节，包含登录接口 |
| 1.0.3 | 2026-01-08 | 增强了接口路径说明，明确了Context Path配置，添加了防止出现/api/api错误路径的警告 |
| 1.0.2 | 2026-01-08 | 添加了服务器端口信息（8076），修正了系统管理接口路径，确保所有接口都包含正确的`/api`前缀 |
| 1.0.1 | 2026-01-08 | 修正了接口路径配置，移除了Controller类中重复的`/api`前缀，确保接口路径正确 |
| 1.0.0 | 2023-12-01 | 初始版本，包含停车场、停车位、车辆进出、收费记录、计费规则管理以及系统权限管理功能 |
