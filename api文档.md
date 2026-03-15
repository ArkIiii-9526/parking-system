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
**请求方式**：POST
**请求路径**：`/api/auth/login`
**权限要求**：无
**请求参数**：
| 参数名 | 类型 | 位置 | 描述 | 必填 |
|-------|------|------|------|------|
| username | String | 请求体 | 用户名 | 是 |
| password | String | 请求体 | 密码 | 是 |

**响应结构**：
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

**响应参数**：
| 参数名 | 类型 | 描述 |
|-------|------|------|
| code | Integer | 状态码 |
| message | String | 响应消息 |
| data | Object | 响应数据 |
| data.token | String | 访问令牌 |
| data.user | Object | 用户信息 |
| data.user.userId | Long | 用户ID |
| data.user.username | String | 用户名 |
| data.user.nickname | String | 昵称 |
| data.user.userType | String | 用户类型 |
| data.user.status | Integer | 状态 |

#### 3.2 登出接口
**请求方式**：POST
**请求路径**：`/api/auth/logout`
**权限要求**：无
**请求参数**：无

**响应结构**：
```json
{
  "code": 200,
  "message": "登出成功",
  "data": null
}
```

**响应参数**：
| 参数名 | 类型 | 描述 |
|-------|------|------|
| code | Integer | 状态码 |
| message | String | 响应消息 |
| data | null | 响应数据 |

#### 3.3 刷新Token接口
**请求方式**：POST
**请求路径**：`/api/auth/refresh`
**权限要求**：无
**请求参数**：
| 参数名 | 类型 | 位置 | 描述 | 必填 |
|-------|------|------|------|------|
| Authorization | String | 请求头 | Bearer token | 是 |

**响应结构**：
```json
{
  "code": 200,
  "message": "Token刷新成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**响应参数**：
| 参数名 | 类型 | 描述 |
|-------|------|------|
| code | Integer | 状态码 |
| message | String | 响应消息 |
| data | Object | 响应数据 |
| data.token | String | 新的访问令牌 |

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
**请求方式**：GET
**请求路径**：`/api/parkings/page`
**权限要求**：parking:list
**请求参数**：
| 参数名 | 类型 | 位置 | 描述 | 必填 |
|-------|------|------|------|------|
| pageNo | Integer | 查询参数 | 页码（默认1） | 否 |
| pageSize | Integer | 查询参数 | 每页条数（默认10） | 否 |
| name | String | 查询参数 | 停车场名称（模糊查询） | 否 |
| address | String | 查询参数 | 停车场地址（模糊查询） | 否 |

**响应结构**：
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

**响应参数**：
| 参数名 | 类型 | 描述 |
|-------|------|------|
| code | Integer | 状态码 |
| message | String | 响应消息 |
| data | Object | 响应数据 |
| data.records | Array | 停车场列表 |
| data.records[].id | Long | 停车场ID |
| data.records[].name | String | 停车场名称 |
| data.records[].address | String | 停车场地址 |
| data.records[].totalSpaces | Integer | 总车位数 |
| data.records[].availableSpaces | Integer | 可用车位数 |
| data.records[].latitude | Double | 纬度 |
| data.records[].longitude | Double | 经度 |
| data.records[].status | Integer | 状态 |
| data.total | Long | 总记录数 |
| data.size | Integer | 每页大小 |
| data.current | Integer | 当前页码 |

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
**请求方式**：GET
**请求路径**：`/api/parking-spaces/available/{parkingId}`
**权限要求**：无
**请求参数**：
| 参数名 | 类型 | 位置 | 描述 | 必填 |
|-------|------|------|------|------|
| parkingId | Long | 路径参数 | 停车场ID | 是 |

**响应结构**：
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

**响应参数**：
| 参数名 | 类型 | 描述 |
|-------|------|------|
| code | Integer | 状态码 |
| message | String | 响应消息 |
| data | Array | 可用车位列表 |
| data[].id | Long | 车位ID |
| data[].spaceCode | String | 车位编码 |
| data[].parkingId | Long | 停车场ID |
| data[].floor | String | 楼层 |
| data[].area | String | 区域 |
| data[].spaceType | Integer | 车位类型 |
| data[].status | Integer | 状态 |

### 4.3 车辆进出管理

| 接口地址 | 请求方法 | 功能描述 | 权限要求 |
|---------|---------|---------|---------|
| `/api/vehicle/entry` | POST | 车辆入场登记 | billing:entry |
| `/api/vehicle/exit` | POST | 车辆出场登记 | billing:exit |
| `/api/vehicle/active-entry` | GET | 获取车辆当前入场记录 | billing:view |
| `/api/vehicle/records/parking/{parkingId}` | GET | 根据停车场查询车辆进出记录 | billing:view |
| `/api/vehicle/records/car/{carNo}` | GET | 根据车牌号查询车辆进出记录 | billing:view |

#### 4.3.1 车辆入场登记
**请求方式**：POST
**请求路径**：`/api/vehicle/entry`
**权限要求**：billing:entry
**请求参数**：
| 参数名 | 类型 | 位置 | 描述 | 必填 |
|-------|------|------|------|------|
| parkingId | Long | 请求体 | 停车场ID | 是 |
| spaceId | Long | 请求体 | 停车位ID | 是 |
| carNo | String | 请求体 | 车牌号 | 是 |

**响应结构**：
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

**响应参数**：
| 参数名 | 类型 | 描述 |
|-------|------|------|
| code | Integer | 状态码 |
| message | String | 响应消息 |
| data | Object | 响应数据 |
| data.id | Long | 入场记录ID |
| data.carNo | String | 车牌号 |
| data.parkingId | Long | 停车场ID |
| data.spaceId | Long | 停车位ID |
| data.entryTime | String | 入场时间 |
| data.exitTime | String | 出场时间 |
| data.status | Integer | 状态 |

### 4.4 收费记录管理

| 接口地址 | 请求方法 | 功能描述 | 权限要求 |
|---------|---------|---------|---------|
| `/api/billing/records/{id}/pay` | PUT | 支付停车费 | billing:pay |
| `/api/billing/records/page` | GET | 分页查询收费记录 | billing:view |
| `/api/billing/records/statistics/daily` | GET | 日报表统计 | billing:statistics |
| `/api/billing/records/export` | POST | 导出收费记录 | billing:export |

#### 4.4.1 支付停车费
**请求方式**：PUT
**请求路径**：`/api/billing/records/{id}/pay`
**权限要求**：billing:pay
**请求参数**：
| 参数名 | 类型 | 位置 | 描述 | 必填 |
|-------|------|------|------|------|
| id | Long | 路径参数 | 记录ID | 是 |
| paymentMethod | String | 请求体 | 支付方式 | 是 |
| paymentTransactionNo | String | 请求体 | 支付交易号 | 是 |
| actualAmount | BigDecimal | 请求体 | 实际支付金额 | 是 |

**响应结构**：
```json
{
  "code": 200,
  "message": "success",
  "data": true
}
```

**响应参数**：
| 参数名 | 类型 | 描述 |
|-------|------|------|
| code | Integer | 状态码 |
| message | String | 响应消息 |
| data | Boolean | 操作是否成功 |

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
**请求方式**：POST
**请求路径**：`/api/billing/rules/calculate`
**权限要求**：billing:rule:calculate
**请求参数**：
| 参数名 | 类型 | 位置 | 描述 | 必填 |
|-------|------|------|------|------|
| ruleId | Long | 请求体 | 规则ID | 是 |
| entryTime | String | 请求体 | 入场时间 | 是 |
| exitTime | String | 请求体 | 出场时间 | 是 |

**响应结构**：
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

**响应参数**：
| 参数名 | 类型 | 描述 |
|-------|------|------|
| code | Integer | 状态码 |
| message | String | 响应消息 |
| data | Object | 响应数据 |
| data.totalTime | Integer | 总停车时间（分钟） |
| data.totalFee | BigDecimal | 总费用 |
| data.details | Array | 费用详情列表 |
| data.details[].period | String | 计费时段 |
| data.details[].time | Integer | 时段时长（分钟） |
| data.details[].fee | BigDecimal | 时段费用 |

#### 4.5.2 删除计费规则
**请求方式**：DELETE
**请求路径**：`/api/billing/rules/{id}`
**权限要求**：billing:rule:delete
**请求参数**：
| 参数名 | 类型 | 位置 | 描述 | 必填 |
|-------|------|------|------|------|
| id | Long | 路径参数 | 规则ID | 是 |

**响应结构**：
```json
{
  "code": 200,
  "message": "success",
  "data": true
}
```

**响应参数**：
| 参数名 | 类型 | 描述 |
|-------|------|------|
| code | Integer | 状态码 |
| message | String | 响应消息 |
| data | Boolean | 操作是否成功 |

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
| `/api/sys/user/{userId}/permissions` | GET | 获取用户权限列表（包括继承的权限） | 无 |
| `/api/sys/user/status` | PUT | 更新用户状态 | user:edit |
| `/api/sys/user/menus` | GET | 获取用户菜单 | 无 |

#### 4.1.1 获取用户列表
**请求方式**：GET
**请求路径**：`/api/sys/user/list`
**权限要求**：无
**请求参数**：无

**响应结构**：
```json
[
  {
    "userId": 1,
    "username": "admin",
    "password": "$2a$10$4.ATFcumioQdf3mjzMllvuvYi.LwdGrUmVInLVcCB4usSlaVTaSNK",
    "nickname": "超级管理员",
    "userType": "ADMIN",
    "deptId": null,
    "phone": "13800138000",
    "email": "admin@example.com",
    "status": 1,
    "createTime": "2026-03-03T09:46:46.000+00:00",
    "updateTime": "2026-03-03T09:46:46.000+00:00",
    "deleted": 0,
    "deptName": null,
    "roleNames": null
  }
]
```

**响应参数**：
| 参数名 | 类型 | 描述 |
|-------|------|------|
| userId | Long | 用户ID |
| username | String | 用户名 |
| password | String | 密码（加密后） |
| nickname | String | 昵称 |
| userType | String | 用户类型：ADMIN(管理员), INSPECTOR(巡检员), OWNER(车主) |
| deptId | Long | 所属部门/停车场ID |
| phone | String | 手机号 |
| email | String | 邮箱 |
| status | Integer | 状态：1启用，0禁用 |
| createTime | String | 创建时间 |
| updateTime | String | 更新时间 |
| deleted | Integer | 软删除标记 |
| deptName | String | 部门名称 |
| roleNames | String | 角色名称 |

#### 4.1.2 获取用户详情
**请求方式**：GET
**请求路径**：`/api/sys/user/{userId}`
**权限要求**：无
**请求参数**：
| 参数名 | 类型 | 位置 | 描述 | 必填 |
|-------|------|------|------|------|
| userId | Long | 路径参数 | 用户ID | 是 |

**响应结构**：
```json
{
  "userId": 1,
  "username": "admin",
  "password": "$2a$10$4.ATFcumioQdf3mjzMllvuvYi.LwdGrUmVInLVcCB4usSlaVTaSNK",
  "nickname": "超级管理员",
  "userType": "ADMIN",
  "deptId": null,
  "phone": "13800138000",
  "email": "admin@example.com",
  "status": 1,
  "createTime": "2026-03-03T09:46:46.000+00:00",
  "updateTime": "2026-03-03T09:46:46.000+00:00",
  "deleted": 0,
  "deptName": null,
  "roleNames": null
}
```

**响应参数**：同获取用户列表

#### 4.1.3 新增用户
**请求方式**：POST
**请求路径**：`/api/sys/user`
**权限要求**：user:add
**请求参数**：
| 参数名 | 类型 | 位置 | 描述 | 必填 |
|-------|------|------|------|------|
| username | String | 请求体 | 用户名 | 是 |
| password | String | 请求体 | 密码 | 是 |
| nickname | String | 请求体 | 昵称 | 否 |
| userType | String | 请求体 | 用户类型 | 是 |
| deptId | Long | 请求体 | 所属部门ID | 否 |
| phone | String | 请求体 | 手机号 | 否 |
| email | String | 请求体 | 邮箱 | 否 |
| status | Integer | 请求体 | 状态 | 否 |

**响应结构**：
```json
true
```

**响应参数**：
| 参数名 | 类型 | 描述 |
|-------|------|------|
| 响应体 | Boolean | 操作是否成功 |

#### 4.1.4 更新用户
**请求方式**：PUT
**请求路径**：`/api/sys/user`
**权限要求**：user:edit
**请求参数**：同新增用户，需包含userId

**响应结构**：
```json
true
```

**响应参数**：同新增用户

#### 4.1.5 删除用户
**请求方式**：DELETE
**请求路径**：`/api/sys/user/{userId}`
**权限要求**：user:delete
**请求参数**：
| 参数名 | 类型 | 位置 | 描述 | 必填 |
|-------|------|------|------|------|
| userId | Long | 路径参数 | 用户ID | 是 |

**响应结构**：
```json
true
```

**响应参数**：同新增用户

#### 4.1.6 为用户分配角色
**请求方式**：POST
**请求路径**：`/api/sys/user/role/assign`
**权限要求**：user:assignRole
**请求参数**：
| 参数名 | 类型 | 位置 | 描述 | 必填 |
|-------|------|------|------|------|
| userId | Long | 请求体 | 用户ID | 是 |
| roleIds | List<Long> | 请求体 | 角色ID列表 | 是 |

**响应结构**：
```json
// 无返回值
```

#### 4.1.7 获取用户角色ID列表
**请求方式**：GET
**请求路径**：`/api/sys/user/{userId}/roles`
**权限要求**：无
**请求参数**：
| 参数名 | 类型 | 位置 | 描述 | 必填 |
|-------|------|------|------|------|
| userId | Long | 路径参数 | 用户ID | 是 |

**响应结构**：
```json
[1, 2, 3]
```

**响应参数**：
| 参数名 | 类型 | 描述 |
|-------|------|------|
| 响应体 | List<Long> | 角色ID列表 |

#### 4.1.8 获取用户权限列表
**请求方式**：GET
**请求路径**：`/api/sys/user/{userId}/permissions`
**权限要求**：无
**请求参数**：
| 参数名 | 类型 | 位置 | 描述 | 必填 |
|-------|------|------|------|------|
| userId | Long | 路径参数 | 用户ID | 是 |

**响应结构**：
```json
["user:list", "user:add", "user:edit"]
```

**响应参数**：
| 参数名 | 类型 | 描述 |
|-------|------|------|
| 响应体 | List<String> | 权限编码列表 |

#### 4.1.9 更新用户状态
**请求方式**：PUT
**请求路径**：`/api/sys/user/status`
**权限要求**：user:edit
**请求参数**：
| 参数名 | 类型 | 位置 | 描述 | 必填 |
|-------|------|------|------|------|
| userId | Long | 请求体 | 用户ID | 是 |
| status | Integer | 请求体 | 状态：1启用，0禁用 | 是 |

**响应结构**：
```json
// 无返回值
```

#### 4.1.10 获取用户菜单
**请求方式**：GET
**请求路径**：`/api/sys/user/menus`
**权限要求**：无
**请求参数**：
| 参数名 | 类型 | 位置 | 描述 | 必填 |
|-------|------|------|------|------|
| userId | Long | 查询参数 | 用户ID，不提供则使用当前登录用户 | 否 |

**响应结构**：
```json
[
  {
    "permissionId": 1,
    "permissionName": "系统管理",
    "permissionCode": "system:manage",
    "parentId": 0,
    "type": "MENU",
    "url": null,
    "component": "views/system/index.vue",
    "icon": "Setting",
    "isMenu": 1,
    "method": null,
    "menuId": 1,
    "sort": 10,
    "status": 1
  }
]
```

**响应参数**：
| 参数名 | 类型 | 描述 |
|-------|------|------|
| permissionId | Long | 权限ID |
| permissionName | String | 权限名称 |
| permissionCode | String | 权限编码 |
| parentId | Long | 父权限ID |
| type | String | 权限类型：MENU(菜单), BUTTON(按钮), API(接口) |
| url | String | 接口URL |
| component | String | 前端组件路径 |
| icon | String | 菜单图标 |
| isMenu | Integer | 是否作为菜单显示 |
| method | String | 请求方法 |
| menuId | Long | 关联菜单ID |
| sort | Integer | 排序 |
| status | Integer | 状态：1启用，0禁用 |

### 4.2 角色管理

| 接口地址 | 请求方法 | 功能描述 | 权限要求 |
|---------|---------|---------|---------|
| `/api/sys/role/list` | GET | 获取角色列表 | 无 |
| `/api/sys/role/{roleId}` | GET | 获取角色详情 | 无 |
| `/api/sys/role` | POST | 新增角色 | 无 |
| `/api/sys/role` | PUT | 更新角色 | 无 |
| `/api/sys/role/{roleId}` | DELETE | 删除角色 | 无 |
| `/api/sys/role/permission/bind` | POST | 绑定权限到角色 | 无 |
| `/api/sys/role/{roleId}/permissions` | GET | 获取角色权限ID列表（包括继承的权限） | 无 |
| `/api/sys/role/{roleId}/permissions/tree` | GET | 获取角色权限树（包括继承的权限） | 无 |
| `/api/sys/role/child/{parentId}` | GET | 获取子角色列表 | 无 |
| `/api/sys/role/parent/{roleId}` | GET | 获取角色的所有父角色 | 无 |
| `/api/sys/role/permission/check` | GET | 检查角色是否有指定权限（包括继承的权限） | 无 |

#### 4.2.1 获取角色列表
**请求方式**：GET
**请求路径**：`/api/sys/role/list`
**权限要求**：无
**请求参数**：无

**响应结构**：
```json
[
  {
    "roleId": 1,
    "roleName": "超级管理员",
    "roleCode": "SUPER_ADMIN",
    "parentId": 0,
    "dataScope": "ALL",
    "description": "拥有系统所有权限",
    "status": 1,
    "createTime": "2026-03-03T09:46:46.000+00:00",
    "updateTime": "2026-03-03T09:46:46.000+00:00",
    "deleted": 0
  }
]
```

**响应参数**：
| 参数名 | 类型 | 描述 |
|-------|------|------|
| roleId | Long | 角色ID |
| roleName | String | 角色名称 |
| roleCode | String | 角色编码 |
| parentId | Long | 父角色ID |
| dataScope | String | 数据范围：ALL(全部), DEPT(本部门), CUSTOM(自定义) |
| description | String | 描述 |
| status | Integer | 状态：1启用，0禁用 |
| createTime | String | 创建时间 |
| updateTime | String | 更新时间 |
| deleted | Integer | 软删除标记 |

#### 4.2.2 获取角色详情
**请求方式**：GET
**请求路径**：`/api/sys/role/{roleId}`
**权限要求**：无
**请求参数**：
| 参数名 | 类型 | 位置 | 描述 | 必填 |
|-------|------|------|------|------|
| roleId | Long | 路径参数 | 角色ID | 是 |

**响应结构**：
```json
{
  "roleId": 1,
  "roleName": "超级管理员",
  "roleCode": "SUPER_ADMIN",
  "parentId": 0,
  "dataScope": "ALL",
  "description": "拥有系统所有权限",
  "status": 1,
  "createTime": "2026-03-03T09:46:46.000+00:00",
  "updateTime": "2026-03-03T09:46:46.000+00:00",
  "deleted": 0
}
```

**响应参数**：同获取角色列表

#### 4.2.3 新增角色
**请求方式**：POST
**请求路径**：`/api/sys/role`
**权限要求**：无
**请求参数**：
| 参数名 | 类型 | 位置 | 描述 | 必填 |
|-------|------|------|------|------|
| roleName | String | 请求体 | 角色名称 | 是 |
| roleCode | String | 请求体 | 角色编码 | 是 |
| parentId | Long | 请求体 | 父角色ID | 否 |
| dataScope | String | 请求体 | 数据范围 | 否 |
| description | String | 请求体 | 描述 | 否 |
| status | Integer | 请求体 | 状态 | 否 |

**响应结构**：
```json
true
```

**响应参数**：
| 参数名 | 类型 | 描述 |
|-------|------|------|
| 响应体 | Boolean | 操作是否成功 |

#### 4.2.4 更新角色
**请求方式**：PUT
**请求路径**：`/api/sys/role`
**权限要求**：无
**请求参数**：同新增角色，需包含roleId

**响应结构**：
```json
true
```

**响应参数**：同新增角色

#### 4.2.5 删除角色
**请求方式**：DELETE
**请求路径**：`/api/sys/role/{roleId}`
**权限要求**：无
**请求参数**：
| 参数名 | 类型 | 位置 | 描述 | 必填 |
|-------|------|------|------|------|
| roleId | Long | 路径参数 | 角色ID | 是 |

**响应结构**：
```json
true
```

**响应参数**：同新增角色

#### 4.2.6 绑定权限到角色
**请求方式**：POST
**请求路径**：`/api/sys/role/permission/bind`
**权限要求**：无
**请求参数**：
| 参数名 | 类型 | 位置 | 描述 | 必填 |
|-------|------|------|------|------|
| roleId | Long | 请求体 | 角色ID | 是 |
| permissionIds | List<Long> | 请求体 | 权限ID列表 | 是 |

**响应结构**：
```json
// 无返回值
```

#### 4.2.7 获取角色权限ID列表
**请求方式**：GET
**请求路径**：`/api/sys/role/{roleId}/permissions`
**权限要求**：无
**请求参数**：
| 参数名 | 类型 | 位置 | 描述 | 必填 |
|-------|------|------|------|------|
| roleId | Long | 路径参数 | 角色ID | 是 |

**响应结构**：
```json
[1, 2, 3]
```

**响应参数**：
| 参数名 | 类型 | 描述 |
|-------|------|------|
| 响应体 | List<Long> | 权限ID列表 |

#### 4.2.8 获取角色权限树
**请求方式**：GET
**请求路径**：`/api/sys/role/{roleId}/permissions/tree`
**权限要求**：无
**请求参数**：
| 参数名 | 类型 | 位置 | 描述 | 必填 |
|-------|------|------|------|------|
| roleId | Long | 路径参数 | 角色ID | 是 |

**响应结构**：
```json
[
  {
    "permissionId": 1,
    "permissionName": "系统管理",
    "permissionCode": "system:manage",
    "parentId": 0,
    "type": "MENU",
    "url": null,
    "component": "views/system/index.vue",
    "icon": "Setting",
    "isMenu": 1,
    "method": null,
    "menuId": 1,
    "sort": 10,
    "status": 1
  }
]
```

**响应参数**：同获取用户菜单

#### 4.2.9 获取子角色列表
**请求方式**：GET
**请求路径**：`/api/sys/role/child/{parentId}`
**权限要求**：无
**请求参数**：
| 参数名 | 类型 | 位置 | 描述 | 必填 |
|-------|------|------|------|------|
| parentId | Long | 路径参数 | 父角色ID | 是 |

**响应结构**：
```json
[
  {
    "roleId": 1,
    "roleName": "子角色1",
    "roleCode": "ROLE_CHILD_1",
    "parentId": 2,
    "dataScope": "ALL",
    "description": "子角色描述",
    "status": 1,
    "createTime": "2026-03-03T09:46:46.000+00:00",
    "updateTime": "2026-03-03T09:46:46.000+00:00",
    "deleted": 0
  }
]
```

**响应参数**：同获取角色列表

#### 4.2.10 获取角色的所有父角色
**请求方式**：GET
**请求路径**：`/api/sys/role/parent/{roleId}`
**权限要求**：无
**请求参数**：
| 参数名 | 类型 | 位置 | 描述 | 必填 |
|-------|------|------|------|------|
| roleId | Long | 路径参数 | 角色ID | 是 |

**响应结构**：
```json
[
  {
    "roleId": 2,
    "roleName": "父角色1",
    "roleCode": "ROLE_PARENT_1",
    "parentId": 3,
    "dataScope": "ALL",
    "description": "父角色描述",
    "status": 1,
    "createTime": "2026-03-03T09:46:46.000+00:00",
    "updateTime": "2026-03-03T09:46:46.000+00:00",
    "deleted": 0
  }
]
```

**响应参数**：同获取角色列表

#### 4.2.11 检查角色是否有指定权限
**请求方式**：GET
**请求路径**：`/api/sys/role/permission/check`
**权限要求**：无
**请求参数**：
| 参数名 | 类型 | 位置 | 描述 | 必填 |
|-------|------|------|------|------|
| roleId | Long | 查询参数 | 角色ID | 是 |
| permissionCode | String | 查询参数 | 权限编码 | 是 |

**响应结构**：
```json
true
```

**响应参数**：
| 参数名 | 类型 | 描述 |
|-------|------|------|
| 响应体 | Boolean | 是否拥有指定权限 |

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

#### 4.3.1 获取权限列表
**请求方式**：GET
**请求路径**：`/api/sys/permission/list`
**权限要求**：无
**请求参数**：无

**响应结构**：
```json
[
  {
    "permissionId": 1,
    "permissionName": "系统管理",
    "permissionCode": "system:manage",
    "parentId": 0,
    "type": "MENU",
    "url": null,
    "component": "views/system/index.vue",
    "icon": "Setting",
    "isMenu": 1,
    "method": null,
    "menuId": 1,
    "sort": 10,
    "status": 1,
    "createTime": "2026-03-03T09:46:46.000+00:00",
    "updateTime": "2026-03-03T09:46:46.000+00:00",
    "deleted": 0
  }
]
```

**响应参数**：
| 参数名 | 类型 | 描述 |
|-------|------|------|
| permissionId | Long | 权限ID |
| permissionName | String | 权限名称 |
| permissionCode | String | 权限编码 |
| parentId | Long | 父权限ID |
| type | String | 权限类型：MENU(菜单), BUTTON(按钮), API(接口) |
| url | String | 接口URL |
| component | String | 前端组件路径 |
| icon | String | 菜单图标 |
| isMenu | Integer | 是否作为菜单显示 |
| method | String | 请求方法 |
| menuId | Long | 关联菜单ID |
| sort | Integer | 排序 |
| status | Integer | 状态：1启用，0禁用 |
| createTime | String | 创建时间 |
| updateTime | String | 更新时间 |
| deleted | Integer | 软删除标记 |

#### 4.3.2 获取完整权限树
**请求方式**：GET
**请求路径**：`/api/sys/permission/tree`
**权限要求**：无
**请求参数**：无

**响应结构**：
```json
[
  {
    "permissionId": 1,
    "permissionName": "系统管理",
    "permissionCode": "system:manage",
    "parentId": 0,
    "type": "MENU",
    "url": null,
    "component": "views/system/index.vue",
    "icon": "Setting",
    "isMenu": 1,
    "method": null,
    "menuId": 1,
    "sort": 10,
    "status": 1
  }
]
```

**响应参数**：同获取权限列表

#### 4.3.3 获取权限详情
**请求方式**：GET
**请求路径**：`/api/sys/permission/{permissionId}`
**权限要求**：无
**请求参数**：
| 参数名 | 类型 | 位置 | 描述 | 必填 |
|-------|------|------|------|------|
| permissionId | Long | 路径参数 | 权限ID | 是 |

**响应结构**：
```json
{
  "permissionId": 1,
  "permissionName": "系统管理",
  "permissionCode": "system:manage",
  "parentId": 0,
  "type": "MENU",
  "url": null,
  "component": "views/system/index.vue",
  "icon": "Setting",
  "isMenu": 1,
  "method": null,
  "menuId": 1,
  "sort": 10,
  "status": 1,
  "createTime": "2026-03-03T09:46:46.000+00:00",
  "updateTime": "2026-03-03T09:46:46.000+00:00",
  "deleted": 0
}
```

**响应参数**：同获取权限列表

#### 4.3.4 新增权限
**请求方式**：POST
**请求路径**：`/api/sys/permission`
**权限要求**：无
**请求参数**：
| 参数名 | 类型 | 位置 | 描述 | 必填 |
|-------|------|------|------|------|
| permissionName | String | 请求体 | 权限名称 | 是 |
| permissionCode | String | 请求体 | 权限编码 | 是 |
| parentId | Long | 请求体 | 父权限ID | 否 |
| type | String | 请求体 | 权限类型 | 是 |
| url | String | 请求体 | 接口URL | 否 |
| component | String | 请求体 | 前端组件路径 | 否 |
| icon | String | 请求体 | 菜单图标 | 否 |
| isMenu | Integer | 请求体 | 是否作为菜单显示 | 否 |
| method | String | 请求体 | 请求方法 | 否 |
| menuId | Long | 请求体 | 关联菜单ID | 否 |
| sort | Integer | 请求体 | 排序 | 否 |
| status | Integer | 请求体 | 状态 | 否 |

**响应结构**：
```json
true
```

**响应参数**：
| 参数名 | 类型 | 描述 |
|-------|------|------|
| 响应体 | Boolean | 操作是否成功 |

#### 4.3.5 更新权限
**请求方式**：PUT
**请求路径**：`/api/sys/permission`
**权限要求**：无
**请求参数**：同新增权限，需包含permissionId

**响应结构**：
```json
true
```

**响应参数**：同新增权限

#### 4.3.6 删除权限
**请求方式**：DELETE
**请求路径**：`/api/sys/permission/{permissionId}`
**权限要求**：无
**请求参数**：
| 参数名 | 类型 | 位置 | 描述 | 必填 |
|-------|------|------|------|------|
| permissionId | Long | 路径参数 | 权限ID | 是 |

**响应结构**：
```json
true
```

**响应参数**：同新增权限

#### 4.3.7 刷新权限缓存
**请求方式**：POST
**请求路径**：`/api/sys/permission/refresh`
**权限要求**：无
**请求参数**：无

**响应结构**：
```json
// 无返回值
```

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
| 1.0.6 | 2026-03-03 | 完善RBAC权限管理，实现角色权限继承功能，包括角色继承父角色权限、权限检查支持继承权限验证 |
| 1.0.5 | 2026-01-08 | 添加了logout、refresh和deleteBillingRule接口 |
| 1.0.4 | 2026-01-08 | 添加了认证管理接口章节，包含登录接口 |
| 1.0.3 | 2026-01-08 | 增强了接口路径说明，明确了Context Path配置，添加了防止出现/api/api错误路径的警告 |
| 1.0.2 | 2026-01-08 | 添加了服务器端口信息（8076），修正了系统管理接口路径，确保所有接口都包含正确的`/api`前缀 |
| 1.0.1 | 2026-01-08 | 修正了接口路径配置，移除了Controller类中重复的`/api`前缀，确保接口路径正确 |
| 1.0.0 | 2023-12-01 | 初始版本，包含停车场、停车位、车辆进出、收费记录、计费规则管理以及系统权限管理功能 |
