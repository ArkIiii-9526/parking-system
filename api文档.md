# 智慧停车引导系统 - 后端接口文档

## 1. 系统概述

智慧停车引导系统后端基于Spring Boot开发，采用RESTful API设计风格，提供了停车场管理、停车位管理、车位分区管理、模拟数据生成、车辆进出管理、收费记录管理、计费规则管理、数据统计分析、停车引导与路径规划、预约管理、审计日志管理、缓存监控管理以及系统权限管理等功能。

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

### 4.2 车位分区管理

| 接口地址 | 请求方法 | 功能描述 | 权限要求 |
|---------|---------|---------|---------|
| `/api/parking-sections/page` | GET | 分页查询车位分区 | section:list |
| `/api/parking-sections/{id}` | GET | 获取分区详情 | section:view |
| `/api/parking-sections` | POST | 新增分区 | section:add |
| `/api/parking-sections` | PUT | 更新分区 | section:edit |
| `/api/parking-sections/{id}` | DELETE | 删除分区 | section:delete |
| `/api/parking-sections/by-parking/{parkingId}` | GET | 根据停车场查询分区 | section:view |
| `/api/parking-sections/by-parking/{parkingId}/floor/{floor}` | GET | 根据停车场和楼层查询分区 | section:view |
| `/api/parking-sections/{id}/statistics` | GET | 获取分区统计信息 | section:view |
| `/api/parking-sections/by-parking/{parkingId}/statistics` | GET | 获取停车场所有分区统计 | section:view |
| `/api/parking-sections/{id}/update-space-count` | PUT | 更新分区车位数量 | section:edit |

#### 4.2.1 分页查询车位分区
**请求方式**：GET
**请求路径**：`/api/parking-sections/page`
**权限要求**：section:list
**请求参数**：
| 参数名 | 类型 | 位置 | 描述 | 必填 |
|-------|------|------|------|------|
| page | Integer | 查询参数 | 页码（默认1） | 否 |
| size | Integer | 查询参数 | 每页条数（默认10） | 否 |
| parkingId | Long | 查询参数 | 停车场ID | 否 |
| sectionCode | String | 查询参数 | 分区代码（模糊查询） | 否 |
| sectionName | String | 查询参数 | 分区名称（模糊查询） | 否 |
| floor | Integer | 查询参数 | 楼层 | 否 |

**响应结构**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "records": [
      {
        "id": 1,
        "parkingId": 1,
        "parkingName": "智慧停车场",
        "sectionCode": "A",
        "sectionName": "A区",
        "floor": 1,
        "totalSpaces": 50,
        "availableSpaces": 30,
        "occupiedSpaces": 15,
        "utilizationRate": 30.0,
        "description": "一层A区停车位",
        "sortOrder": 1,
        "createTime": "2024-01-15T10:30:00",
        "updateTime": "2024-01-15T10:30:00"
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
| data.records | Array | 分区列表 |
| data.records[].id | Long | 分区ID |
| data.records[].parkingId | Long | 停车场ID |
| data.records[].parkingName | String | 停车场名称 |
| data.records[].sectionCode | String | 分区代码 |
| data.records[].sectionName | String | 分区名称 |
| data.records[].floor | Integer | 楼层 |
| data.records[].totalSpaces | Integer | 总车位数 |
| data.records[].availableSpaces | Integer | 可用车位数 |
| data.records[].occupiedSpaces | Integer | 已占用车位数 |
| data.records[].utilizationRate | Double | 利用率（%） |
| data.records[].description | String | 描述 |
| data.records[].sortOrder | Integer | 排序顺序 |
| data.records[].createTime | String | 创建时间 |
| data.records[].updateTime | String | 更新时间 |

#### 4.2.2 新增车位分区
**请求方式**：POST
**请求路径**：`/api/parking-sections`
**权限要求**：section:add
**请求参数**：
| 参数名 | 类型 | 位置 | 描述 | 必填 |
|-------|------|------|------|------|
| parkingId | Long | 请求体 | 停车场ID | 是 |
| sectionCode | String | 请求体 | 分区代码 | 是 |
| sectionName | String | 请求体 | 分区名称 | 是 |
| floor | Integer | 请求体 | 楼层 | 否 |
| description | String | 请求体 | 描述 | 否 |
| sortOrder | Integer | 请求体 | 排序顺序 | 否 |

**响应结构**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "parkingId": 1,
    "sectionCode": "A",
    "sectionName": "A区",
    "floor": 1,
    "totalSpaces": 0,
    "availableSpaces": 0,
    "description": "一层A区停车位",
    "sortOrder": 1,
    "createTime": "2024-01-15T10:30:00",
    "updateTime": "2024-01-15T10:30:00"
  }
}
```

#### 4.2.3 获取分区统计信息
**请求方式**：GET
**请求路径**：`/api/parking-sections/{id}/statistics`
**权限要求**：section:view
**请求参数**：
| 参数名 | 类型 | 位置 | 描述 | 必填 |
|-------|------|------|------|------|
| id | Long | 路径参数 | 分区ID | 是 |

**响应结构**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "sectionId": 1,
    "sectionCode": "A",
    "sectionName": "A区",
    "floor": 1,
    "totalSpaces": 50,
    "availableSpaces": 30,
    "occupiedSpaces": 15,
    "reservedSpaces": 5,
    "utilizationRate": 40.0
  }
}
```

**响应参数**：
| 参数名 | 类型 | 描述 |
|-------|------|------|
| code | Integer | 状态码 |
| message | String | 响应消息 |
| data | Object | 统计信息 |
| data.sectionId | Long | 分区ID |
| data.sectionCode | String | 分区代码 |
| data.sectionName | String | 分区名称 |
| data.floor | Integer | 楼层 |
| data.totalSpaces | Integer | 总车位数 |
| data.availableSpaces | Integer | 可用车位数 |
| data.occupiedSpaces | Integer | 已占用车位数 |
| data.reservedSpaces | Integer | 已预约车位数 |
| data.utilizationRate | Double | 利用率（%） |

### 4.3 停车位管理

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

#### 4.3.1 查询可用车位
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

### 4.4 模拟数据管理

| 接口地址 | 请求方法 | 功能描述 | 权限要求 |
|---------|---------|---------|---------|
| `/api/simulation/generate` | POST | 生成模拟数据 | simulation:generate |
| `/api/simulation/update-status` | POST | 更新模拟车位状态 | simulation:update |
| `/api/simulation/reset/{parkingId}` | POST | 重置停车场状态 | simulation:reset |
| `/api/simulation/clear/{parkingId}` | POST | 清除模拟数据 | simulation:clear |

#### 4.4.1 生成模拟数据
**请求方式**：POST
**请求路径**：`/api/simulation/generate`
**权限要求**：simulation:generate
**请求参数**：
| 参数名 | 类型 | 位置 | 描述 | 必填 |
|-------|------|------|------|------|
| parkingId | Long | 请求体 | 停车场ID | 是 |
| parkingSpaceCount | Integer | 请求体 | 生成车位数量（默认50） | 否 |
| sectionCodes | Array | 请求体 | 分区代码列表（默认["A","B","C","D"]） | 否 |
| floors | Array | 请求体 | 楼层列表（默认[1,2]） | 否 |
| occupiedRate | Integer | 请求体 | 占用率百分比（默认30） | 否 |
| reservedRate | Integer | 请求体 | 预约率百分比（默认10） | 否 |
| generateEntryExitRecords | Boolean | 请求体 | 是否生成进出记录 | 否 |
| entryExitRecordCount | Integer | 请求体 | 进出记录数量（默认20） | 否 |
| startTime | String | 请求体 | 记录开始时间 | 否 |
| endTime | String | 请求体 | 记录结束时间 | 否 |
| minAmount | BigDecimal | 请求体 | 最小金额（默认5） | 否 |
| maxAmount | BigDecimal | 请求体 | 最大金额（默认100） | 否 |

**响应结构**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "success": true,
    "message": "模拟数据生成成功",
    "generatedParkingSpaceCount": 50,
    "generatedEntryExitCount": 20,
    "generatedBillingRecordCount": 15,
    "generatedSpaceIds": [1, 2, 3, 4, 5],
    "generateTime": "2024-01-15T10:30:00",
    "durationMs": 1250
  }
}
```

**响应参数**：
| 参数名 | 类型 | 描述 |
|-------|------|------|
| code | Integer | 状态码 |
| message | String | 响应消息 |
| data | Object | 响应数据 |
| data.success | Boolean | 是否成功 |
| data.message | String | 结果消息 |
| data.generatedParkingSpaceCount | Integer | 生成车位数量 |
| data.generatedEntryExitCount | Integer | 生成进出记录数量 |
| data.generatedBillingRecordCount | Integer | 生成收费记录数量 |
| data.generatedSpaceIds | Array | 生成的车位ID列表 |
| data.generateTime | String | 生成时间 |
| data.durationMs | Long | 耗时（毫秒） |

#### 4.4.2 更新模拟车位状态
**请求方式**：POST
**请求路径**：`/api/simulation/update-status`
**权限要求**：simulation:update
**请求参数**：
| 参数名 | 类型 | 位置 | 描述 | 必填 |
|-------|------|------|------|------|
| parkingId | Long | 请求体 | 停车场ID | 是 |
| spaceIds | Array | 请求体 | 指定更新的车位ID列表 | 否 |
| occupiedCount | Integer | 请求体 | 指定占用车位数量 | 否 |
| reservedCount | Integer | 请求体 | 指定预约车位数量 | 否 |
| randomUpdate | Boolean | 请求体 | 是否随机更新 | 否 |
| carNumbers | Array | 请求体 | 指定车牌号列表 | 否 |

**响应结构**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "parkingId": 1,
    "parkingName": "智慧停车场",
    "totalSpaces": 50,
    "availableSpaces": 30,
    "occupiedSpaces": 15,
    "reservedSpaces": 5,
    "changedSpaces": [
      {
        "spaceId": 1,
        "spaceNumber": "A101",
        "oldStatus": 1,
        "newStatus": 2,
        "carNumber": "京A12345"
      }
    ],
    "updateTime": "2024-01-15T10:30:00"
  }
}
```

**响应参数**：
| 参数名 | 类型 | 描述 |
|-------|------|------|
| code | Integer | 状态码 |
| message | String | 响应消息 |
| data | Object | 响应数据 |
| data.parkingId | Long | 停车场ID |
| data.parkingName | String | 停车场名称 |
| data.totalSpaces | Integer | 总车位数 |
| data.availableSpaces | Integer | 可用车位数 |
| data.occupiedSpaces | Integer | 已占用车位数 |
| data.reservedSpaces | Integer | 已预约车位数 |
| data.changedSpaces | Array | 变更的车位列表 |
| data.changedSpaces[].spaceId | Long | 车位ID |
| data.changedSpaces[].spaceNumber | String | 车位编号 |
| data.changedSpaces[].oldStatus | Integer | 原状态 |
| data.changedSpaces[].newStatus | Integer | 新状态 |
| data.changedSpaces[].carNumber | String | 车牌号 |
| data.updateTime | String | 更新时间 |

#### 4.4.3 重置停车场状态
**请求方式**：POST
**请求路径**：`/api/simulation/reset/{parkingId}`
**权限要求**：simulation:reset
**请求参数**：
| 参数名 | 类型 | 位置 | 描述 | 必填 |
|-------|------|------|------|------|
| parkingId | Long | 路径参数 | 停车场ID | 是 |

**响应结构**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "parkingId": 1,
    "parkingName": "智慧停车场",
    "totalSpaces": 50,
    "availableSpaces": 50,
    "occupiedSpaces": 0,
    "reservedSpaces": 0,
    "changedSpaces": [],
    "updateTime": "2024-01-15T10:30:00"
  }
}
```

#### 4.4.4 清除模拟数据
**请求方式**：POST
**请求路径**：`/api/simulation/clear/{parkingId}`
**权限要求**：simulation:clear
**请求参数**：
| 参数名 | 类型 | 位置 | 描述 | 必填 |
|-------|------|------|------|------|
| parkingId | Long | 路径参数 | 停车场ID | 是 |

**响应结构**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "success": true,
    "message": "模拟数据清除成功",
    "generatedParkingSpaceCount": 50,
    "generatedEntryExitCount": 20,
    "generatedBillingRecordCount": 15,
    "generateTime": "2024-01-15T10:30:00",
    "durationMs": 850
  }
}
```

### 4.5 车辆进出管理

| 接口地址 | 请求方法 | 功能描述 | 权限要求 |
|---------|---------|---------|---------|
| `/api/vehicle/entry` | POST | 车辆入场登记 | billing:entry |
| `/api/vehicle/exit` | POST | 车辆出场登记 | billing:exit |
| `/api/vehicle/active-entry` | GET | 获取车辆当前入场记录 | billing:view |
| `/api/vehicle/records/parking/{parkingId}` | GET | 根据停车场查询车辆进出记录 | billing:view |
| `/api/vehicle/records/car/{carNo}` | GET | 根据车牌号查询车辆进出记录 | billing:view |

#### 4.5.1 车辆入场登记
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

### 4.6 收费记录管理

| 接口地址 | 请求方法 | 功能描述 | 权限要求 |
|---------|---------|---------|---------|
| `/api/billing/records/{id}/pay` | PUT | 支付停车费 | billing:pay |
| `/api/billing/records/page` | GET | 分页查询收费记录 | billing:view |
| `/api/billing/records/statistics/daily` | GET | 日报表统计 | billing:statistics |
| `/api/billing/records/export` | POST | 导出收费记录 | billing:export |

#### 4.6.1 支付停车费
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

### 4.7 计费规则管理

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

### 4.8 数据统计分析

| 接口地址 | 请求方法 | 功能描述 | 权限要求 |
|---------|---------|---------|---------|
| `/api/analytics/turnover` | GET | 获取所有停车场周转率分析 | analytics:turnover:view |
| `/api/analytics/turnover/{parkingId}` | GET | 获取单个停车场周转率分析 | analytics:turnover:view |
| `/api/analytics/trend` | GET | 获取趋势分析（支持按日/周/月统计） | analytics:trend:view |
| `/api/analytics/income` | GET | 获取收入分析 | analytics:income:view |
| `/api/analytics/utilization` | GET | 获取所有停车场利用率分析 | analytics:utilization:view |
| `/api/analytics/utilization/{parkingId}` | GET | 获取单个停车场利用率 | analytics:utilization:view |
| `/api/analytics/summary` | GET | 获取运营指标汇总 | analytics:summary:view |
| `/api/analytics/export/turnover` | POST | 导出周转率分析数据 | analytics:turnover:export |
| `/api/analytics/export/trend` | POST | 导出趋势分析数据 | analytics:trend:export |
| `/api/analytics/export/income` | POST | 导出收入分析数据 | analytics:income:export |
| `/api/analytics/export/utilization` | POST | 导出利用率分析数据 | analytics:utilization:export |
| `/api/analytics/export/summary` | POST | 导出运营汇总数据 | analytics:summary:export |
| `/api/analytics/export/comprehensive` | POST | 导出综合报表 | analytics:report:export |
| `/api/analytics/export/formats` | GET | 获取支持的导出格式 | 无 |

#### 4.8.1 获取所有停车场周转率分析

**请求方式**：GET
**请求路径**：`/api/analytics/turnover`
**权限要求**：analytics:turnover:view
**请求参数**：
| 参数名 | 类型 | 位置 | 描述 | 必填 |
|-------|------|------|------|------|
| startDate | String | 查询参数 | 开始日期（格式：yyyy-MM-dd） | 否，默认30天前 |
| endDate | String | 查询参数 | 结束日期（格式：yyyy-MM-dd） | 否，默认今天 |

**响应结构**：
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "parkingId": 1,
      "parkingName": "智慧停车场",
      "totalSpaces": 100,
      "totalEntries": 500,
      "totalExits": 480,
      "turnoverRate": 2.5,
      "averageParkingDuration": 120.50,
      "utilizationRate": 75.00,
      "analysisPeriod": "2024-01-01 至 2024-01-31"
    }
  ]
}
```

**响应参数**：
| 参数名 | 类型 | 描述 |
|-------|------|------|
| code | Integer | 状态码 |
| message | String | 响应消息 |
| data | Array | 周转率分析列表 |
| data[].parkingId | Long | 停车场ID |
| data[].parkingName | String | 停车场名称 |
| data[].totalSpaces | Integer | 总车位数 |
| data[].totalEntries | Integer | 总入场次数 |
| data[].totalExits | Integer | 总出场次数 |
| data[].turnoverRate | BigDecimal | 周转率 |
| data[].averageParkingDuration | BigDecimal | 平均停车时长（分钟） |
| data[].utilizationRate | BigDecimal | 利用率（%） |
| data[].analysisPeriod | String | 分析周期 |

#### 4.8.2 获取单个停车场周转率分析

**请求方式**：GET
**请求路径**：`/api/analytics/turnover/{parkingId}`
**权限要求**：analytics:turnover:view
**请求参数**：
| 参数名 | 类型 | 位置 | 描述 | 必填 |
|-------|------|------|------|------|
| parkingId | Long | 路径参数 | 停车场ID | 是 |
| startDate | String | 查询参数 | 开始日期（格式：yyyy-MM-dd） | 否，默认30天前 |
| endDate | String | 查询参数 | 结束日期（格式：yyyy-MM-dd） | 否，默认今天 |

**响应结构**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "parkingId": 1,
    "parkingName": "智慧停车场",
    "totalSpaces": 100,
    "totalEntries": 500,
    "totalExits": 480,
    "turnoverRate": 2.5,
    "averageParkingDuration": 120.50,
    "utilizationRate": 75.00,
    "analysisPeriod": "2024-01-01 至 2024-01-31"
  }
}
```

**响应参数**：同获取所有停车场周转率分析中的单个对象

#### 4.8.3 获取趋势分析

**请求方式**：GET
**请求路径**：`/api/analytics/trend`
**权限要求**：analytics:trend:view
**请求参数**：
| 参数名 | 类型 | 位置 | 描述 | 必填 |
|-------|------|------|------|------|
| parkingId | Long | 查询参数 | 停车场ID | 否 |
| startDate | String | 查询参数 | 开始日期（格式：yyyy-MM-dd） | 否，默认30天前 |
| endDate | String | 查询参数 | 结束日期（格式：yyyy-MM-dd） | 否，默认今天 |
| periodType | String | 查询参数 | 周期类型：day/week/month | 否，自动根据日期范围判断 |

**响应结构**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "periodType": "day",
    "dateLabels": ["2024-01-01", "2024-01-02", "2024-01-03"],
    "entryCounts": [50, 60, 55],
    "exitCounts": [48, 58, 53],
    "incomeTrend": [500.00, 600.00, 550.00],
    "turnoverRates": [2.0, 2.4, 2.2],
    "summary": {
      "totalEntries": 165,
      "totalExits": 159,
      "totalIncome": 1650.00,
      "averageDailyIncome": 550.00
    }
  }
}
```

**响应参数**：
| 参数名 | 类型 | 描述 |
|-------|------|------|
| code | Integer | 状态码 |
| message | String | 响应消息 |
| data | Object | 趋势分析数据 |
| data.periodType | String | 周期类型 |
| data.dateLabels | Array | 日期标签列表 |
| data.entryCounts | Array | 入场数列表 |
| data.exitCounts | Array | 出场数列表 |
| data.incomeTrend | Array | 收入趋势列表 |
| data.turnoverRates | Array | 周转率列表 |
| data.summary | Object | 汇总数据 |
| data.summary.totalEntries | Integer | 总入场次数 |
| data.summary.totalExits | Integer | 总出场次数 |
| data.summary.totalIncome | BigDecimal | 总收入 |
| data.summary.averageDailyIncome | BigDecimal | 平均日收入 |

#### 4.8.4 获取收入分析

**请求方式**：GET
**请求路径**：`/api/analytics/income`
**权限要求**：analytics:income:view
**请求参数**：
| 参数名 | 类型 | 位置 | 描述 | 必填 |
|-------|------|------|------|------|
| parkingId | Long | 查询参数 | 停车场ID | 否 |
| startDate | String | 查询参数 | 开始日期（格式：yyyy-MM-dd） | 否，默认30天前 |
| endDate | String | 查询参数 | 结束日期（格式：yyyy-MM-dd） | 否，默认今天 |

**响应结构**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "totalIncome": 15000.00,
    "averageDailyIncome": 500.00,
    "maxDailyIncome": 800.00,
    "minDailyIncome": 200.00,
    "totalTransactions": 500,
    "averageTransactionAmount": 30.00,
    "incomeByPaymentMethod": {
      "微信支付": 9000.00,
      "支付宝": 4500.00,
      "现金": 1500.00
    },
    "incomeByParking": {
      "1": 15000.00
    },
    "dailyIncomeList": [
      {
        "date": "2024-01-01",
        "income": 500.00
      }
    ],
    "analysisPeriod": "2024-01-01 至 2024-01-31"
  }
}
```

**响应参数**：
| 参数名 | 类型 | 描述 |
|-------|------|------|
| code | Integer | 状态码 |
| message | String | 响应消息 |
| data | Object | 收入分析数据 |
| data.totalIncome | BigDecimal | 总收入 |
| data.averageDailyIncome | BigDecimal | 平均日收入 |
| data.maxDailyIncome | BigDecimal | 最大日收入 |
| data.minDailyIncome | BigDecimal | 最小日收入 |
| data.totalTransactions | Integer | 总交易笔数 |
| data.averageTransactionAmount | BigDecimal | 平均交易金额 |
| data.incomeByPaymentMethod | Object | 按支付方式统计的收入 |
| data.incomeByParking | Object | 按停车场统计的收入 |
| data.dailyIncomeList | Array | 日收入明细列表 |
| data.dailyIncomeList[].date | String | 日期 |
| data.dailyIncomeList[].income | BigDecimal | 收入金额 |
| data.analysisPeriod | String | 分析周期 |

#### 4.8.5 获取所有停车场利用率分析

**请求方式**：GET
**请求路径**：`/api/analytics/utilization`
**权限要求**：analytics:utilization:view
**请求参数**：无

**响应结构**：
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "parkingId": 1,
      "parkingName": "智慧停车场",
      "totalSpaces": 100,
      "occupiedSpaces": 60,
      "availableSpaces": 30,
      "reservedSpaces": 10,
      "utilizationRate": 70.00,
      "occupancyRate": 60.00,
      "statisticsTime": "2024-01-15T10:30:00"
    }
  ]
}
```

**响应参数**：
| 参数名 | 类型 | 描述 |
|-------|------|------|
| code | Integer | 状态码 |
| message | String | 响应消息 |
| data | Array | 利用率分析列表 |
| data[].parkingId | Long | 停车场ID |
| data[].parkingName | String | 停车场名称 |
| data[].totalSpaces | Integer | 总车位数 |
| data[].occupiedSpaces | Integer | 已占用车位数 |
| data[].availableSpaces | Integer | 可用车位数 |
| data[].reservedSpaces | Integer | 预约车位数 |
| data[].utilizationRate | BigDecimal | 利用率（占用+预约）/总数（%） |
| data[].occupancyRate | BigDecimal | 占用率（占用/总数）（%） |
| data[].statisticsTime | String | 统计时间 |

#### 4.8.6 获取单个停车场利用率

**请求方式**：GET
**请求路径**：`/api/analytics/utilization/{parkingId}`
**权限要求**：analytics:utilization:view
**请求参数**：
| 参数名 | 类型 | 位置 | 描述 | 必填 |
|-------|------|------|------|------|
| parkingId | Long | 路径参数 | 停车场ID | 是 |

**响应结构**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "parkingId": 1,
    "parkingName": "智慧停车场",
    "totalSpaces": 100,
    "occupiedSpaces": 60,
    "availableSpaces": 30,
    "reservedSpaces": 10,
    "utilizationRate": 70.00,
    "occupancyRate": 60.00,
    "statisticsTime": "2024-01-15T10:30:00"
  }
}
```

**响应参数**：同获取所有停车场利用率分析中的单个对象

#### 4.8.7 获取运营指标汇总

**请求方式**：GET
**请求路径**：`/api/analytics/summary`
**权限要求**：analytics:summary:view
**请求参数**：
| 参数名 | 类型 | 位置 | 描述 | 必填 |
|-------|------|------|------|------|
| parkingId | Long | 查询参数 | 停车场ID | 否 |
| startDate | String | 查询参数 | 开始日期（格式：yyyy-MM-dd） | 否，默认30天前 |
| endDate | String | 查询参数 | 结束日期（格式：yyyy-MM-dd） | 否，默认今天 |

**响应结构**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "totalParkings": 5,
    "totalSpaces": 500,
    "totalEntries": 1500,
    "totalExits": 1450,
    "activeVehicles": 50,
    "totalIncome": 45000.00,
    "totalTransactions": 1500,
    "averageTransactionAmount": 30.00,
    "analysisPeriod": "2024-01-01 至 2024-01-31"
  }
}
```

**响应参数**：
| 参数名 | 类型 | 描述 |
|-------|------|------|
| code | Integer | 状态码 |
| message | String | 响应消息 |
| data | Object | 运营汇总数据 |
| data.totalParkings | Long | 停车场总数 |
| data.totalSpaces | Long | 车位总数 |
| data.totalEntries | Long | 总入场次数 |
| data.totalExits | Long | 总出场次数 |
| data.activeVehicles | Long | 当前在场车辆数 |
| data.totalIncome | BigDecimal | 总收入 |
| data.totalTransactions | Integer | 总交易笔数 |
| data.averageTransactionAmount | BigDecimal | 平均交易金额 |
| data.analysisPeriod | String | 分析周期 |

#### 4.8.8 导出周转率分析数据

**请求方式**：POST
**请求路径**：`/api/analytics/export/turnover`
**权限要求**：analytics:turnover:export
**请求参数**：
| 参数名 | 类型 | 位置 | 描述 | 必填 |
|-------|------|------|------|------|
| startDate | String | 请求体 | 开始日期（格式：yyyy-MM-dd） | 否，默认30天前 |
| endDate | String | 请求体 | 结束日期（格式：yyyy-MM-dd） | 否，默认今天 |
| parkingId | Long | 请求体 | 停车场ID | 否 |
| fileName | String | 请求体 | 自定义文件名（不含扩展名） | 否 |
| includeSummary | Boolean | 请求体 | 是否包含汇总数据 | 否，默认true |

**响应结构**：文件流（Excel格式）

**响应说明**：
- 响应头 `Content-Type`: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- 响应头 `Content-Disposition`: `attachment;filename*=utf-8''周转率分析_20240315_143022.xlsx`
- 导出文件包含字段：停车场ID、停车场名称、总车位数、入场次数、出场次数、周转率(%)、平均停车时长(分钟)、利用率(%)、分析周期

#### 4.8.9 导出趋势分析数据

**请求方式**：POST
**请求路径**：`/api/analytics/export/trend`
**权限要求**：analytics:trend:export
**请求参数**：
| 参数名 | 类型 | 位置 | 描述 | 必填 |
|-------|------|------|------|------|
| startDate | String | 请求体 | 开始日期（格式：yyyy-MM-dd） | 否，默认30天前 |
| endDate | String | 请求体 | 结束日期（格式：yyyy-MM-dd） | 否，默认今天 |
| parkingId | Long | 请求体 | 停车场ID | 否 |
| periodType | String | 请求体 | 周期类型：day/week/month | 否，自动判断 |
| fileName | String | 请求体 | 自定义文件名（不含扩展名） | 否 |
| includeSummary | Boolean | 请求体 | 是否包含汇总数据 | 否，默认true |

**响应结构**：文件流（Excel格式，多Sheet）

**响应说明**：
- Sheet1「趋势数据」：日期、入场数、出场数、收入(元)、周转率(%)
- Sheet2「汇总数据」：汇总指标键值对

#### 4.8.10 导出收入分析数据

**请求方式**：POST
**请求路径**：`/api/analytics/export/income`
**权限要求**：analytics:income:export
**请求参数**：
| 参数名 | 类型 | 位置 | 描述 | 必填 |
|-------|------|------|------|------|
| startDate | String | 请求体 | 开始日期（格式：yyyy-MM-dd） | 否，默认30天前 |
| endDate | String | 请求体 | 结束日期（格式：yyyy-MM-dd） | 否，默认今天 |
| parkingId | Long | 请求体 | 停车场ID | 否 |
| fileName | String | 请求体 | 自定义文件名（不含扩展名） | 否 |
| includeSummary | Boolean | 请求体 | 是否包含汇总数据 | 否，默认true |

**响应结构**：文件流（Excel格式，多Sheet）

**响应说明**：
- Sheet1「日收入明细」：日期、收入(元)
- Sheet2「按支付方式统计」：支付方式、收入(元)
- Sheet3「按停车场统计」：停车场ID、收入(元)
- Sheet4「汇总信息」：总收入、总交易笔数、平均单笔金额、平均日收入、最高日收入、最低日收入、分析周期

#### 4.8.11 导出利用率分析数据

**请求方式**：POST
**请求路径**：`/api/analytics/export/utilization`
**权限要求**：analytics:utilization:export
**请求参数**：
| 参数名 | 类型 | 位置 | 描述 | 必填 |
|-------|------|------|------|------|
| fileName | String | 请求体 | 自定义文件名（不含扩展名） | 否 |

**响应结构**：文件流（Excel格式）

**响应说明**：
- 导出文件包含字段：停车场ID、停车场名称、总车位数、已占用、空闲、已预约、利用率(%)、占用率(%)、统计时间

#### 4.8.12 导出运营汇总数据

**请求方式**：POST
**请求路径**：`/api/analytics/export/summary`
**权限要求**：analytics:summary:export
**请求参数**：
| 参数名 | 类型 | 位置 | 描述 | 必填 |
|-------|------|------|------|------|
| startDate | String | 请求体 | 开始日期（格式：yyyy-MM-dd） | 否，默认30天前 |
| endDate | String | 请求体 | 结束日期（格式：yyyy-MM-dd） | 否，默认今天 |
| parkingId | Long | 请求体 | 停车场ID | 否 |
| fileName | String | 请求体 | 自定义文件名（不含扩展名） | 否 |

**响应结构**：文件流（Excel格式）

**响应说明**：
- 导出文件包含字段：停车场总数、车位总数、总入场次数、总出场次数、当前在场车辆、总收入(元)、总交易笔数、平均交易金额(元)、分析周期

#### 4.8.13 导出综合报表

**请求方式**：POST
**请求路径**：`/api/analytics/export/comprehensive`
**权限要求**：analytics:report:export
**请求参数**：
| 参数名 | 类型 | 位置 | 描述 | 必填 |
|-------|------|------|------|------|
| startDate | String | 请求体 | 开始日期（格式：yyyy-MM-dd） | 否，默认30天前 |
| endDate | String | 请求体 | 结束日期（格式：yyyy-MM-dd） | 否，默认今天 |
| parkingId | Long | 请求体 | 停车场ID | 否 |
| periodType | String | 请求体 | 周期类型：day/week/month | 否，自动判断 |
| fileName | String | 请求体 | 自定义文件名（不含扩展名） | 否 |

**响应结构**：文件流（Excel格式，多Sheet）

**响应说明**：
- Sheet1「运营汇总」：整体运营指标
- Sheet2「周转率分析」：各停车场周转率数据
- Sheet3「利用率分析」：各停车场利用率数据
- Sheet4「趋势分析」：入场、出场、收入趋势
- Sheet5「收入分析」：日收入明细

#### 4.8.14 获取支持的导出格式

**请求方式**：GET
**请求路径**：`/api/analytics/export/formats`
**权限要求**：无
**请求参数**：无

**响应结构**：
```json
{
  "code": 200,
  "message": "success",
  "data": ["excel", "csv"]
}
```

**响应参数**：
| 参数名 | 类型 | 描述 |
|-------|------|------|
| code | Integer | 状态码 |
| message | String | 响应消息 |
| data | Array | 支持的导出格式列表 |

#### 4.7.1 试算停车费用
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

#### 4.7.2 删除计费规则
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

### 4.9 停车引导

| 接口地址 | 请求方法 | 功能描述 | 权限要求 |
|---------|---------|---------|---------|
| `/api/guidance/recommend` | GET | 获取综合停车引导推荐结果 | 无 |
| `/api/guidance/navigation` | GET | 获取停车场内简化导航路径 | 无 |
| `/api/guidance/route/plan` | POST | 规划停车场室内最短路径 | 无 |

#### 4.9.1 获取综合停车引导推荐结果
**请求方式**：GET
**请求路径**：`/api/guidance/recommend`
**请求参数**：
| 参数名 | 类型 | 位置 | 描述 | 必填 |
|-------|------|------|------|------|
| longitude | BigDecimal | 查询参数 | 用户当前位置经度 | 是 |
| latitude | BigDecimal | 查询参数 | 用户当前位置纬度 | 是 |
| radius | Integer | 查询参数 | 推荐搜索半径，单位公里，默认不限 | 否 |
| limit | Integer | 查询参数 | 返回推荐数量，默认5 | 否 |
| needReservable | Integer | 查询参数 | 是否必须可预约，1表示是 | 否 |
| preferredFloor | Integer | 查询参数 | 偏好楼层，如1、-1、-2 | 否 |
| preferredSpaceType | Integer | 查询参数 | 偏好车位类型，1普通/2VIP/3无障碍 | 否 |

**响应结构**：
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "parkingId": 1,
      "parkingName": "中心广场停车场",
      "parkingCode": "PARK001",
      "address": "市中心广场地下一层",
      "score": 88.25,
      "distanceKm": 0.42,
      "totalSpaces": 200,
      "availableSpaces": 150,
      "feeStandard": "首小时5元，之后每小时3元，封顶30元/天",
      "recommendedSpaceId": 1,
      "recommendedSpaceNumber": "A-001",
      "recommendedFloor": 1,
      "recommendedSectionCode": "A",
      "recommendedSectionName": "A区",
      "estimatedDrivingDistance": 80,
      "estimatedWalkingDistance": 20,
      "reservationAvailable": true,
      "navigationSummary": "从东入口进入，前往1层A区，最终停入A-001",
      "reasons": [
        "距离当前位置约 0.42 公里",
        "停车场当前剩余 150 个可用车位",
        "推荐车位 A-001，距入口约 20 米"
      ]
    }
  ]
}
```

#### 4.9.2 获取停车场内简化导航路径
**请求方式**：GET
**请求路径**：`/api/guidance/navigation`
**请求参数**：
| 参数名 | 类型 | 位置 | 描述 | 必填 |
|-------|------|------|------|------|
| parkingId | Long | 查询参数 | 停车场ID | 是 |
| spaceId | Long | 查询参数 | 目标车位ID，不传则自动选择最优车位 | 否 |
| preferredFloor | Integer | 查询参数 | 自动选位时的偏好楼层 | 否 |

**响应结构**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "parkingId": 1,
    "parkingName": "中心广场停车场",
    "entryPointName": "东入口",
    "spaceId": 1,
    "spaceNumber": "A-001",
    "spaceStatus": 1,
    "sectionCode": "A",
    "sectionName": "A区",
    "floor": 1,
    "totalDistanceMeters": 125,
    "estimatedMinutes": 2,
    "navigationSummary": "从东入口进入，前往1层A区，最终停入A-001",
    "steps": [
      {
        "stepOrder": 1,
        "title": "进入停车场",
        "instruction": "从东入口进入 中心广场停车场",
        "distanceMeters": 0
      },
      {
        "stepOrder": 2,
        "title": "前往目标楼层",
        "instruction": "沿车行主通道前往1层",
        "distanceMeters": 80
      },
      {
        "stepOrder": 3,
        "title": "进入目标分区",
        "instruction": "进入A区，保持直行，经过收费岗后右转",
        "distanceMeters": 25
      },
      {
        "stepOrder": 4,
        "title": "抵达目标车位",
        "instruction": "按照提示驶入 A-001，车位位于右侧第二列",
        "distanceMeters": 20
      }
    ]
  }
}
```

#### 4.9.3 规划停车场室内最短路径
**请求方式**：POST
**请求路径**：`/api/guidance/route/plan`
**权限要求**：无
**请求参数**：
| 参数名 | 类型 | 位置 | 描述 | 必填 |
|-------|------|------|------|------|
| parkingId | Long | 请求体 | 停车场ID | 是 |
| entryId | Long | 请求体 | 入口ID | 否 |
| startNodeId | Long | 请求体 | 起始节点ID | 否 |
| targetSpaceId | Long | 请求体 | 目标车位ID | 否 |
| endNodeId | Long | 请求体 | 终点节点ID | 否 |
| preferredFloor | Integer | 请求体 | 偏好楼层 | 否 |

**响应结构**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "parkingId": 1,
    "parkingName": "中心广场停车场",
    "entryId": 1,
    "entryName": "东入口",
    "startNodeId": 1,
    "endNodeId": 10,
    "targetSpaceId": 5,
    "targetSpaceNumber": "A-005",
    "totalDistanceMeters": 150,
    "estimatedMinutes": 3,
    "pathNodeCount": 8,
    "routeSummary": "从东入口进入，沿主通道行驶150米到达A-005",
    "nodes": [],
    "segments": [],
    "steps": []
  }
}
```

**响应参数**：
| 参数名 | 类型 | 描述 |
|-------|------|------|
| code | Integer | 状态码 |
| message | String | 响应消息 |
| data | Object | 路径规划结果 |
| data.parkingId | Long | 停车场ID |
| data.parkingName | String | 停车场名称 |
| data.entryId | Long | 入口ID |
| data.entryName | String | 入口名称 |
| data.startNodeId | Long | 起始节点ID |
| data.endNodeId | Long | 终点节点ID |
| data.targetSpaceId | Long | 目标车位ID |
| data.targetSpaceNumber | String | 目标车位编号 |
| data.totalDistanceMeters | Integer | 总距离（米） |
| data.estimatedMinutes | Integer | 预计行驶时间（分钟） |
| data.pathNodeCount | Integer | 路径节点数量 |
| data.routeSummary | String | 路径摘要 |
| data.nodes | Array | 路径节点列表 |
| data.segments | Array | 路径段列表 |
| data.steps | Array | 导航步骤列表 |

### 4.10 预约管理

| 接口地址 | 请求方法 | 功能描述 | 权限要求 |
|---------|---------|---------|---------|
| `/api/reservations` | POST | 创建预约 | 无 |
| `/api/reservations` | GET | 分页查询预约 | reservation:view |
| `/api/reservations/{id}` | GET | 获取预约详情 | 无 |
| `/api/reservations/{id}/update` | PUT | 更新预约 | 无 |
| `/api/reservations/{id}/cancel` | PUT | 取消预约 | 无 |
| `/api/reservations/{id}` | DELETE | 删除预约 | reservation:delete |
| `/api/reservations/user/{userId}` | GET | 获取用户的预约记录 | 无 |
| `/api/reservations/parking/{parkingId}` | GET | 获取停车场的预约记录 | reservation:view |

#### 4.10.1 创建预约
**请求方式**：POST
**请求路径**：`/api/reservations`
**权限要求**：无
**请求参数**：
| 参数名 | 类型 | 位置 | 描述 | 必填 |
|-------|------|------|------|------|
| parkingId | Long | 请求体 | 停车场ID | 是 |
| parkingSpaceId | Long | 请求体 | 停车位ID | 是 |
| carNo | String | 请求体 | 车牌号 | 是 |
| userId | String | 请求体 | 用户ID | 是 |
| startTime | String | 请求体 | 预约开始时间 | 是 |
| endTime | String | 请求体 | 预约结束时间 | 是 |
| remark | String | 请求体 | 备注 | 否 |

**响应结构**：
```json
{
  "id": 1,
  "parkingId": 1,
  "parkingSpaceId": 5,
  "carNo": "京A12345",
  "userId": "user001",
  "reserveTime": "2024-01-15T10:30:00",
  "startTime": "2024-01-15T14:00:00",
  "endTime": "2024-01-15T18:00:00",
  "status": 1,
  "remark": "预约停车"
}
```

**响应参数**：
| 参数名 | 类型 | 描述 |
|-------|------|------|
| id | Long | 预约ID |
| parkingId | Long | 停车场ID |
| parkingSpaceId | Long | 停车位ID |
| carNo | String | 车牌号 |
| userId | String | 用户ID |
| reserveTime | String | 预约时间 |
| startTime | String | 预约开始时间 |
| endTime | String | 预约结束时间 |
| status | Integer | 预约状态 |
| remark | String | 备注 |

#### 4.10.2 分页查询预约
**请求方式**：GET
**请求路径**：`/api/reservations`
**权限要求**：reservation:view
**请求参数**：
| 参数名 | 类型 | 位置 | 描述 | 必填 |
|-------|------|------|------|------|
| page | Integer | 查询参数 | 页码（默认1） | 否 |
| size | Integer | 查询参数 | 每页条数（默认10） | 否 |
| parkingId | Long | 查询参数 | 停车场ID | 否 |
| parkingSpaceId | Long | 查询参数 | 停车位ID | 否 |
| carNo | String | 查询参数 | 车牌号（模糊查询） | 否 |
| userId | String | 查询参数 | 用户ID | 否 |
| status | Integer | 查询参数 | 预约状态 | 否 |
| startDate | String | 查询参数 | 开始日期 | 否 |
| endDate | String | 查询参数 | 结束日期 | 否 |

**响应结构**：
```json
{
  "records": [
    {
      "id": 1,
      "parkingId": 1,
      "parkingName": "智慧停车场",
      "parkingSpaceId": 5,
      "spaceNumber": "A-005",
      "sectionArea": "A区",
      "floor": 1,
      "carNo": "京A12345",
      "userId": "user001",
      "reserveTime": "2024-01-15T10:30:00",
      "startTime": "2024-01-15T14:00:00",
      "endTime": "2024-01-15T18:00:00",
      "status": 1,
      "statusText": "待使用",
      "remark": "预约停车",
      "createTime": "2024-01-15T10:30:00",
      "updateTime": "2024-01-15T10:30:00"
    }
  ],
  "total": 1,
  "size": 10,
  "current": 1
}
```

**响应参数**：
| 参数名 | 类型 | 描述 |
|-------|------|------|
| records | Array | 预约记录列表 |
| records[].id | Long | 预约ID |
| records[].parkingId | Long | 停车场ID |
| records[].parkingName | String | 停车场名称 |
| records[].parkingSpaceId | Long | 停车位ID |
| records[].spaceNumber | String | 车位编号 |
| records[].sectionArea | String | 所在分区 |
| records[].floor | Integer | 楼层 |
| records[].carNo | String | 车牌号 |
| records[].userId | String | 用户ID |
| records[].reserveTime | String | 预约时间 |
| records[].startTime | String | 预约开始时间 |
| records[].endTime | String | 预约结束时间 |
| records[].status | Integer | 预约状态 |
| records[].statusText | String | 状态文本 |
| records[].remark | String | 备注 |
| records[].createTime | String | 创建时间 |
| records[].updateTime | String | 更新时间 |
| total | Long | 总记录数 |
| size | Integer | 每页大小 |
| current | Integer | 当前页码 |

#### 4.10.3 获取预约详情
**请求方式**：GET
**请求路径**：`/api/reservations/{id}`
**权限要求**：无
**请求参数**：
| 参数名 | 类型 | 位置 | 描述 | 必填 |
|-------|------|------|------|------|
| id | Long | 路径参数 | 预约ID | 是 |

**响应结构**：
```json
{
  "id": 1,
  "parkingId": 1,
  "parkingName": "智慧停车场",
  "parkingSpaceId": 5,
  "spaceNumber": "A-005",
  "sectionArea": "A区",
  "floor": 1,
  "carNo": "京A12345",
  "userId": "user001",
  "reserveTime": "2024-01-15T10:30:00",
  "startTime": "2024-01-15T14:00:00",
  "endTime": "2024-01-15T18:00:00",
  "status": 1,
  "statusText": "待使用",
  "remark": "预约停车",
  "createTime": "2024-01-15T10:30:00",
  "updateTime": "2024-01-15T10:30:00",
  "parking": {},
  "parkingSpace": {}
}
```

**响应参数**：同分页查询预约中的单个对象，额外包含parking和parkingSpace详细信息

#### 4.10.4 更新预约
**请求方式**：PUT
**请求路径**：`/api/reservations/{id}/update`
**权限要求**：无
**请求参数**：
| 参数名 | 类型 | 位置 | 描述 | 必填 |
|-------|------|------|------|------|
| id | Long | 路径参数 | 预约ID | 是 |
| startTime | String | 请求体 | 预约开始时间 | 否 |
| endTime | String | 请求体 | 预约结束时间 | 否 |
| remark | String | 请求体 | 备注 | 否 |

**响应结构**：
```json
true
```

**响应参数**：
| 参数名 | 类型 | 描述 |
|-------|------|------|
| 响应体 | Boolean | 操作是否成功 |

#### 4.10.5 取消预约
**请求方式**：PUT
**请求路径**：`/api/reservations/{id}/cancel`
**权限要求**：无
**请求参数**：
| 参数名 | 类型 | 位置 | 描述 | 必填 |
|-------|------|------|------|------|
| id | Long | 路径参数 | 预约ID | 是 |

**响应结构**：
```json
true
```

**响应参数**：
| 参数名 | 类型 | 描述 |
|-------|------|------|
| 响应体 | Boolean | 操作是否成功 |

#### 4.10.6 删除预约
**请求方式**：DELETE
**请求路径**：`/api/reservations/{id}`
**权限要求**：reservation:delete
**请求参数**：
| 参数名 | 类型 | 位置 | 描述 | 必填 |
|-------|------|------|------|------|
| id | Long | 路径参数 | 预约ID | 是 |

**响应结构**：
```json
true
```

**响应参数**：
| 参数名 | 类型 | 描述 |
|-------|------|------|
| 响应体 | Boolean | 操作是否成功 |

#### 4.10.7 获取用户的预约记录
**请求方式**：GET
**请求路径**：`/api/reservations/user/{userId}`
**权限要求**：无
**请求参数**：
| 参数名 | 类型 | 位置 | 描述 | 必填 |
|-------|------|------|------|------|
| userId | String | 路径参数 | 用户ID | 是 |

**响应结构**：
```json
[
  {
    "id": 1,
    "parkingId": 1,
    "parkingName": "智慧停车场",
    "parkingSpaceId": 5,
    "spaceNumber": "A-005",
    "sectionArea": "A区",
    "floor": 1,
    "carNo": "京A12345",
    "userId": "user001",
    "reserveTime": "2024-01-15T10:30:00",
    "startTime": "2024-01-15T14:00:00",
    "endTime": "2024-01-15T18:00:00",
    "status": 1,
    "statusText": "待使用",
    "remark": "预约停车",
    "createTime": "2024-01-15T10:30:00",
    "updateTime": "2024-01-15T10:30:00"
  }
]
```

**响应参数**：
| 参数名 | 类型 | 描述 |
|-------|------|------|
| 响应体 | Array | 预约记录列表，同分页查询预约中的records项 |

#### 4.10.8 获取停车场的预约记录
**请求方式**：GET
**请求路径**：`/api/reservations/parking/{parkingId}`
**权限要求**：reservation:view
**请求参数**：
| 参数名 | 类型 | 位置 | 描述 | 必填 |
|-------|------|------|------|------|
| parkingId | Long | 路径参数 | 停车场ID | 是 |

**响应结构**：
```json
[
  {
    "id": 1,
    "parkingId": 1,
    "parkingName": "智慧停车场",
    "parkingSpaceId": 5,
    "spaceNumber": "A-005",
    "sectionArea": "A区",
    "floor": 1,
    "carNo": "京A12345",
    "userId": "user001",
    "reserveTime": "2024-01-15T10:30:00",
    "startTime": "2024-01-15T14:00:00",
    "endTime": "2024-01-15T18:00:00",
    "status": 1,
    "statusText": "待使用",
    "remark": "预约停车",
    "createTime": "2024-01-15T10:30:00",
    "updateTime": "2024-01-15T10:30:00"
  }
]
```

**响应参数**：
| 参数名 | 类型 | 描述 |
|-------|------|------|
| 响应体 | Array | 预约记录列表，同分页查询预约中的records项 |

## 5. 系统管理接口

### 5.1 用户管理

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

#### 5.1.1 获取用户列表
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

#### 5.1.2 获取用户详情
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

#### 5.1.3 新增用户
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

#### 5.1.4 更新用户
**请求方式**：PUT
**请求路径**：`/api/sys/user`
**权限要求**：user:edit
**请求参数**：同新增用户，需包含userId

**响应结构**：
```json
true
```

**响应参数**：同新增用户

#### 5.1.5 删除用户
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

#### 5.1.6 为用户分配角色
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

#### 5.1.7 获取用户角色ID列表
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

#### 5.1.8 获取用户权限列表
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

#### 5.1.9 更新用户状态
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

#### 5.1.10 获取用户菜单
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

### 5.2 角色管理

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

#### 5.2.1 获取角色列表
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

#### 5.2.2 获取角色详情
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

#### 5.2.3 新增角色
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

#### 5.2.4 更新角色
**请求方式**：PUT
**请求路径**：`/api/sys/role`
**权限要求**：无
**请求参数**：同新增角色，需包含roleId

**响应结构**：
```json
true
```

**响应参数**：同新增角色

#### 5.2.5 删除角色
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

#### 5.2.6 绑定权限到角色
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

#### 5.2.7 获取角色权限ID列表
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

#### 5.2.8 获取角色权限树
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

#### 5.2.9 获取子角色列表
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

#### 5.2.10 获取角色的所有父角色
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

#### 5.2.11 检查角色是否有指定权限
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

### 5.3 权限管理

| 接口地址 | 请求方法 | 功能描述 | 权限要求 |
|---------|---------|---------|---------|
| `/api/sys/permission/list` | GET | 获取权限列表 | 无 |
| `/api/sys/permission/tree` | GET | 获取完整权限树 | 无 |
| `/api/sys/permission/{permissionId}` | GET | 获取权限详情 | 无 |
| `/api/sys/permission` | POST | 新增权限 | 无 |
| `/api/sys/permission` | PUT | 更新权限 | 无 |
| `/api/sys/permission/{permissionId}` | DELETE | 删除权限 | 无 |
| `/api/sys/permission/refresh` | POST | 刷新权限缓存 | 无 |

#### 5.3.1 获取权限列表
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

#### 5.3.2 获取完整权限树
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

#### 5.3.3 获取权限详情
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

#### 5.3.4 新增权限
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

#### 5.3.5 更新权限
**请求方式**：PUT
**请求路径**：`/api/sys/permission`
**权限要求**：无
**请求参数**：同新增权限，需包含permissionId

**响应结构**：
```json
true
```

**响应参数**：同新增权限

#### 5.3.6 删除权限
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

#### 5.3.7 刷新权限缓存
**请求方式**：POST
**请求路径**：`/api/sys/permission/refresh`
**权限要求**：无
**请求参数**：无

**响应结构**：
```json
// 无返回值
```

### 5.4 系统配置管理

| 接口地址 | 请求方法 | 功能描述 | 权限要求 |
|---------|---------|---------|---------|
| `/api/sys/config/page` | GET | 分页查询配置列表 | 无 |
| `/api/sys/config/list` | GET | 获取配置列表 | 无 |
| `/api/sys/config/{configId}` | GET | 获取配置详情 | 无 |
| `/api/sys/config/getByKey` | GET | 根据键获取配置值 | 无 |
| `/api/sys/config/getByKeyWithDefault` | GET | 根据键获取配置值（带默认值） | 无 |
| `/api/sys/config/getBoolean` | GET | 获取布尔类型配置 | 无 |
| `/api/sys/config/getInt` | GET | 获取整数类型配置 | 无 |
| `/api/sys/config/types` | GET | 获取支持的配置类型 | 无 |
| `/api/sys/config` | POST | 新增配置 | config:add |
| `/api/sys/config` | PUT | 更新配置 | config:edit |
| `/api/sys/config/{configId}` | DELETE | 删除配置 | config:delete |
| `/api/sys/config/refresh` | POST | 刷新配置缓存 | config:edit |

#### 5.4.1 分页查询配置列表

**请求方式**：GET
**请求路径**：`/api/sys/config/page`
**权限要求**：无
**请求参数**：
| 参数名 | 类型 | 位置 | 描述 | 必填 |
|-------|------|------|------|------|
| pageNum | Integer | 查询参数 | 页码（默认1） | 否 |
| pageSize | Integer | 查询参数 | 每页条数（默认10） | 否 |
| configName | String | 查询参数 | 配置名称（模糊查询） | 否 |
| configKey | String | 查询参数 | 配置键名（模糊查询） | 否 |
| configType | String | 查询参数 | 配置类型：STRING/INT/BOOLEAN/JSON | 否 |
| isSystem | Integer | 查询参数 | 是否系统内置：1是，0否 | 否 |
| status | Integer | 查询参数 | 状态：1启用，0禁用 | 否 |

**响应结构**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "records": [
      {
        "configId": 1,
        "configName": "系统名称",
        "configKey": "system.name",
        "configValue": "智慧停车引导系统",
        "configType": "STRING",
        "description": "系统显示名称",
        "isSystem": 1,
        "sort": 1,
        "status": 1,
        "createTime": "2024-01-15T10:30:00",
        "updateTime": "2024-01-15T10:30:00",
        "createBy": "admin",
        "updateBy": "admin"
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
| data.records | Array | 配置列表 |
| data.records[].configId | Long | 配置ID |
| data.records[].configName | String | 配置名称 |
| data.records[].configKey | String | 配置键名 |
| data.records[].configValue | String | 配置值 |
| data.records[].configType | String | 配置类型 |
| data.records[].description | String | 配置说明 |
| data.records[].isSystem | Integer | 是否系统内置 |
| data.records[].sort | Integer | 排序 |
| data.records[].status | Integer | 状态 |
| data.records[].createTime | String | 创建时间 |
| data.records[].updateTime | String | 更新时间 |
| data.records[].createBy | String | 创建人 |
| data.records[].updateBy | String | 更新人 |
| data.total | Long | 总记录数 |
| data.size | Integer | 每页大小 |
| data.current | Integer | 当前页码 |

#### 5.4.2 获取配置列表

**请求方式**：GET
**请求路径**：`/api/sys/config/list`
**权限要求**：无
**请求参数**：
| 参数名 | 类型 | 位置 | 描述 | 必填 |
|-------|------|------|------|------|
| configType | String | 查询参数 | 配置类型 | 否 |

**响应结构**：
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "configId": 1,
      "configName": "系统名称",
      "configKey": "system.name",
      "configValue": "智慧停车引导系统",
      "configType": "STRING",
      "description": "系统显示名称",
      "isSystem": 1,
      "sort": 1,
      "status": 1,
      "createTime": "2024-01-15T10:30:00",
      "updateTime": "2024-01-15T10:30:00",
      "createBy": "admin",
      "updateBy": "admin"
    }
  ]
}
```

**响应参数**：同分页查询配置列表中的records项

#### 5.4.3 获取配置详情

**请求方式**：GET
**请求路径**：`/api/sys/config/{configId}`
**权限要求**：无
**请求参数**：
| 参数名 | 类型 | 位置 | 描述 | 必填 |
|-------|------|------|------|------|
| configId | Long | 路径参数 | 配置ID | 是 |

**响应结构**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "configId": 1,
    "configName": "系统名称",
    "configKey": "system.name",
    "configValue": "智慧停车引导系统",
    "configType": "STRING",
    "description": "系统显示名称",
    "isSystem": 1,
    "sort": 1,
    "status": 1,
    "createTime": "2024-01-15T10:30:00",
    "updateTime": "2024-01-15T10:30:00",
    "createBy": "admin",
    "updateBy": "admin"
  }
}
```

**响应参数**：同分页查询配置列表中的单个对象

#### 5.4.4 根据键获取配置值

**请求方式**：GET
**请求路径**：`/api/sys/config/getByKey`
**权限要求**：无
**请求参数**：
| 参数名 | 类型 | 位置 | 描述 | 必填 |
|-------|------|------|------|------|
| configKey | String | 查询参数 | 配置键名 | 是 |

**响应结构**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "configKey": "system.name",
    "configValue": "智慧停车引导系统"
  }
}
```

**响应参数**：
| 参数名 | 类型 | 描述 |
|-------|------|------|
| code | Integer | 状态码 |
| message | String | 响应消息 |
| data | Object | 响应数据 |
| data.configKey | String | 配置键名 |
| data.configValue | String | 配置值 |

#### 5.4.5 根据键获取配置值（带默认值）

**请求方式**：GET
**请求路径**：`/api/sys/config/getByKeyWithDefault`
**权限要求**：无
**请求参数**：
| 参数名 | 类型 | 位置 | 描述 | 必填 |
|-------|------|------|------|------|
| configKey | String | 查询参数 | 配置键名 | 是 |
| defaultValue | String | 查询参数 | 默认值 | 否 |

**响应结构**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "configKey": "system.name",
    "configValue": "智慧停车引导系统"
  }
}
```

**响应参数**：同根据键获取配置值

#### 5.4.6 获取布尔类型配置

**请求方式**：GET
**请求路径**：`/api/sys/config/getBoolean`
**权限要求**：无
**请求参数**：
| 参数名 | 类型 | 位置 | 描述 | 必填 |
|-------|------|------|------|------|
| configKey | String | 查询参数 | 配置键名 | 是 |
| defaultValue | Boolean | 查询参数 | 默认值 | 否 |

**响应结构**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "configKey": "system.maintenance",
    "configValue": false
  }
}
```

**响应参数**：
| 参数名 | 类型 | 描述 |
|-------|------|------|
| code | Integer | 状态码 |
| message | String | 响应消息 |
| data | Object | 响应数据 |
| data.configKey | String | 配置键名 |
| data.configValue | Boolean | 配置值（布尔类型） |

#### 5.4.7 获取整数类型配置

**请求方式**：GET
**请求路径**：`/api/sys/config/getInt`
**权限要求**：无
**请求参数**：
| 参数名 | 类型 | 位置 | 描述 | 必填 |
|-------|------|------|------|------|
| configKey | String | 查询参数 | 配置键名 | 是 |
| defaultValue | Integer | 查询参数 | 默认值 | 否 |

**响应结构**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "configKey": "system.max.login.retry",
    "configValue": 5
  }
}
```

**响应参数**：
| 参数名 | 类型 | 描述 |
|-------|------|------|
| code | Integer | 状态码 |
| message | String | 响应消息 |
| data | Object | 响应数据 |
| data.configKey | String | 配置键名 |
| data.configValue | Integer | 配置值（整数类型） |

#### 5.4.8 获取支持的配置类型

**请求方式**：GET
**请求路径**：`/api/sys/config/types`
**权限要求**：无
**请求参数**：无

**响应结构**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "STRING": "字符串",
    "INT": "整数",
    "BOOLEAN": "布尔值",
    "JSON": "JSON对象"
  }
}
```

**响应参数**：
| 参数名 | 类型 | 描述 |
|-------|------|------|
| code | Integer | 状态码 |
| message | String | 响应消息 |
| data | Object | 配置类型映射 |

#### 5.4.9 新增配置

**请求方式**：POST
**请求路径**：`/api/sys/config`
**权限要求**：config:add
**请求参数**：
| 参数名 | 类型 | 位置 | 描述 | 必填 |
|-------|------|------|------|------|
| configName | String | 请求体 | 配置名称 | 是 |
| configKey | String | 请求体 | 配置键名 | 是 |
| configValue | String | 请求体 | 配置值 | 否 |
| configType | String | 请求体 | 配置类型 | 否，默认STRING |
| description | String | 请求体 | 配置说明 | 否 |
| isSystem | Integer | 请求体 | 是否系统内置 | 否，默认0 |
| sort | Integer | 请求体 | 排序 | 否，默认0 |
| status | Integer | 请求体 | 状态 | 否，默认1 |

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

#### 5.4.10 更新配置

**请求方式**：PUT
**请求路径**：`/api/sys/config`
**权限要求**：config:edit
**请求参数**：同新增配置，需包含configId

**响应结构**：
```json
{
  "code": 200,
  "message": "success",
  "data": true
}
```

**响应参数**：同新增配置

**注意事项**：
- 系统内置配置（isSystem=1）不允许修改

#### 5.4.11 删除配置

**请求方式**：DELETE
**请求路径**：`/api/sys/config/{configId}`
**权限要求**：config:delete
**请求参数**：
| 参数名 | 类型 | 位置 | 描述 | 必填 |
|-------|------|------|------|------|
| configId | Long | 路径参数 | 配置ID | 是 |

**响应结构**：
```json
{
  "code": 200,
  "message": "success",
  "data": true
}
```

**响应参数**：同新增配置

**注意事项**：
- 系统内置配置（isSystem=1）不允许删除
- 删除为软删除，数据保留在数据库中

#### 5.4.12 刷新配置缓存

**请求方式**：POST
**请求路径**：`/api/sys/config/refresh`
**权限要求**：config:edit
**请求参数**：无

**响应结构**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "success": true,
    "message": "配置缓存刷新成功"
  }
}
```

**响应参数**：
| 参数名 | 类型 | 描述 |
|-------|------|------|
| code | Integer | 状态码 |
| message | String | 响应消息 |
| data | Object | 响应数据 |
| data.success | Boolean | 是否成功 |
| data.message | String | 结果消息 |

### 5.5 审计日志管理

| 接口地址 | 请求方法 | 功能描述 | 权限要求 |
|---------|---------|---------|---------|
| `/api/audit-log/list` | GET | 查询审计日志 | sys:audit:query |
| `/api/audit-log/detail` | GET | 获取审计日志详情 | sys:audit:detail |
| `/api/audit-log/clear` | GET | 清空审计日志 | sys:audit:clear |

#### 5.5.1 查询审计日志
**请求方式**：GET
**请求路径**：`/api/audit-log/list`
**权限要求**：sys:audit:query
**请求参数**：
| 参数名 | 类型 | 位置 | 描述 | 必填 |
|-------|------|------|------|------|
| username | String | 查询参数 | 操作用户名 | 否 |
| businessType | String | 查询参数 | 业务类型 | 否 |
| startTime | String | 查询参数 | 开始时间 | 否 |
| endTime | String | 查询参数 | 结束时间 | 否 |

**响应结构**：
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "logId": 1,
      "userId": "1",
      "username": "admin",
      "operation": "用户登录",
      "businessType": "LOGIN",
      "method": "POST",
      "requestParams": "{\"username\":\"admin\"}",
      "responseParams": "{\"code\":200}",
      "ip": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "status": 1,
      "errorMsg": null,
      "createTime": "2024-01-15T10:30:00",
      "module": "认证管理"
    }
  ]
}
```

**响应参数**：
| 参数名 | 类型 | 描述 |
|-------|------|------|
| code | Integer | 状态码 |
| message | String | 响应消息 |
| data | Array | 审计日志列表 |
| data[].logId | Long | 日志ID |
| data[].userId | String | 用户ID |
| data[].username | String | 用户名 |
| data[].operation | String | 操作描述 |
| data[].businessType | String | 业务类型 |
| data[].method | String | 请求方法 |
| data[].requestParams | String | 请求参数 |
| data[].responseParams | String | 响应参数 |
| data[].ip | String | 请求IP |
| data[].userAgent | String | 用户代理 |
| data[].status | Integer | 状态：1成功，0失败 |
| data[].errorMsg | String | 错误信息 |
| data[].createTime | String | 创建时间 |
| data[].module | String | 模块名称 |

#### 5.5.2 获取审计日志详情
**请求方式**：GET
**请求路径**：`/api/audit-log/detail`
**权限要求**：sys:audit:detail
**请求参数**：
| 参数名 | 类型 | 位置 | 描述 | 必填 |
|-------|------|------|------|------|
| logId | Long | 查询参数 | 日志ID | 是 |

**响应结构**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "logId": 1,
    "userId": "1",
    "username": "admin",
    "operation": "用户登录",
    "businessType": "LOGIN",
    "method": "POST",
    "requestParams": "{\"username\":\"admin\"}",
    "responseParams": "{\"code\":200}",
    "ip": "192.168.1.1",
    "userAgent": "Mozilla/5.0...",
    "status": 1,
    "errorMsg": null,
    "createTime": "2024-01-15T10:30:00",
    "module": "认证管理"
  }
}
```

**响应参数**：同查询审计日志中的单个对象

#### 5.5.3 清空审计日志
**请求方式**：GET
**请求路径**：`/api/audit-log/clear`
**权限要求**：sys:audit:clear
**请求参数**：无

**响应结构**：
```json
{
  "code": 200,
  "message": "审计日志清空成功",
  "data": null
}
```

**响应参数**：
| 参数名 | 类型 | 描述 |
|-------|------|------|
| code | Integer | 状态码 |
| message | String | 响应消息 |
| data | null | 响应数据 |

### 5.6 缓存监控管理

| 接口地址 | 请求方法 | 功能描述 | 权限要求 |
|---------|---------|---------|---------|
| `/api/cache/metrics` | GET | 获取缓存监控指标 | sys:cache:metrics |
| `/api/cache/reset` | GET | 重置缓存监控指标 | sys:cache:reset |
| `/api/cache/clear` | GET | 清除指定模式的缓存 | sys:cache:clear |
| `/api/cache/clearAll` | GET | 清除所有缓存 | sys:cache:clearAll |

#### 5.6.1 获取缓存监控指标
**请求方式**：GET
**请求路径**：`/api/cache/metrics`
**权限要求**：sys:cache:metrics
**请求参数**：无

**响应结构**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "hitCount": 1500,
    "missCount": 200,
    "hitRate": 0.88,
    "totalRequests": 1700,
    "cacheSize": 256,
    "evictionCount": 50,
    "averageLoadPenalty": 10.5,
    "loadSuccessCount": 200,
    "loadExceptionCount": 0
  }
}
```

**响应参数**：
| 参数名 | 类型 | 描述 |
|-------|------|------|
| code | Integer | 状态码 |
| message | String | 响应消息 |
| data | Object | 缓存监控指标 |
| data.hitCount | Long | 缓存命中次数 |
| data.missCount | Long | 缓存未命中次数 |
| data.hitRate | Double | 缓存命中率 |
| data.totalRequests | Long | 总请求次数 |
| data.cacheSize | Integer | 缓存大小 |
| data.evictionCount | Long | 缓存驱逐次数 |
| data.averageLoadPenalty | Double | 平均加载延迟（毫秒） |
| data.loadSuccessCount | Long | 加载成功次数 |
| data.loadExceptionCount | Long | 加载异常次数 |

#### 5.6.2 重置缓存监控指标
**请求方式**：GET
**请求路径**：`/api/cache/reset`
**权限要求**：sys:cache:reset
**请求参数**：无

**响应结构**：
```json
{
  "code": 200,
  "message": "缓存监控指标已重置",
  "data": null
}
```

**响应参数**：
| 参数名 | 类型 | 描述 |
|-------|------|------|
| code | Integer | 状态码 |
| message | String | 响应消息 |
| data | null | 响应数据 |

#### 5.6.3 清除指定模式的缓存
**请求方式**：GET
**请求路径**：`/api/cache/clear`
**权限要求**：sys:cache:clear
**请求参数**：
| 参数名 | 类型 | 位置 | 描述 | 必填 |
|-------|------|------|------|------|
| pattern | String | 查询参数 | 缓存键模式（支持通配符） | 是 |

**响应结构**：
```json
{
  "code": 200,
  "message": "缓存已清除",
  "data": null
}
```

**响应参数**：
| 参数名 | 类型 | 描述 |
|-------|------|------|
| code | Integer | 状态码 |
| message | String | 响应消息 |
| data | null | 响应数据 |

#### 5.6.4 清除所有缓存
**请求方式**：GET
**请求路径**：`/api/cache/clearAll`
**权限要求**：sys:cache:clearAll
**请求参数**：无

**响应结构**：
```json
{
  "code": 200,
  "message": "所有缓存已清除",
  "data": null
}
```

**响应参数**：
| 参数名 | 类型 | 描述 |
|-------|------|------|
| code | Integer | 状态码 |
| message | String | 响应消息 |
| data | null | 响应数据 |

## 6. 数据字典

### 6.1 停车位状态
| 状态值 | 状态描述 |
|-------|---------|
| 1 | 空闲 |
| 2 | 占用 |
| 3 | 已预约 |

### 6.2 支付状态
| 状态值 | 状态描述 |
|-------|---------|
| 0 | 未支付 |
| 1 | 已支付 |
| 2 | 部分支付 |

### 6.3 订单状态
| 状态值 | 状态描述 |
|-------|---------|
| 0 | 进行中 |
| 1 | 未支付 |
| 2 | 已支付 |
| 3 | 已取消 |

### 6.4 预约状态
| 状态值 | 状态描述 |
|-------|---------|
| 0 | 待使用 |
| 1 | 使用中 |
| 2 | 已完成 |
| 3 | 已取消 |
| 4 | 已过期 |

### 6.5 审计日志状态
| 状态值 | 状态描述 |
|-------|---------|
| 0 | 失败 |
| 1 | 成功 |

## 7. 注意事项

1. 所有接口请求参数需严格按照文档要求传递
2. 接口返回结果中的数据结构可能会根据实际业务需求进行调整
3. 涉及权限控制的接口需确保当前用户具有相应权限
4. 对于分页查询接口，建议前端默认使用pageNo=1，pageSize=10
5. 时间参数格式统一使用ISO 8601格式，如：2023-12-01T10:00:00

## 8. 版本更新日志

| 版本号 | 更新日期 | 更新内容 |
|-------|---------|---------|
| 1.2.0 | 2026-03-25 | 新增预约管理模块（8个接口）、停车引导路径规划接口、审计日志管理模块（3个接口）、缓存监控管理模块（4个接口），完善数据字典，确保所有后端接口录入完毕 |
| 1.1.0 | 2026-03-15 | 新增系统配置管理模块，包含配置CRUD、缓存管理、多类型配置值获取等12个API接口，支持STRING/INT/BOOLEAN/JSON四种配置类型 |
| 1.0.9 | 2026-03-15 | 新增车位分区管理API和模拟数据生成API，完善停车场管理模块功能 |
| 1.0.8 | 2026-03-15 | 新增数据统计分析导出功能，包含周转率、趋势、收入、利用率、运营汇总导出及综合报表导出等8个API接口，支持Excel多Sheet导出 |
| 1.0.7 | 2026-03-15 | 新增数据统计分析模块，包含周转率分析、趋势分析、收入分析、利用率分析、运营指标汇总等7个API接口 |
| 1.0.6 | 2026-03-03 | 完善RBAC权限管理，实现角色权限继承功能，包括角色继承父角色权限、权限检查支持继承权限验证 |
| 1.0.5 | 2026-01-08 | 添加了logout、refresh和deleteBillingRule接口 |
| 1.0.4 | 2026-01-08 | 添加了认证管理接口章节，包含登录接口 |
| 1.0.3 | 2026-01-08 | 增强了接口路径说明，明确了Context Path配置，添加了防止出现/api/api错误路径的警告 |
| 1.0.2 | 2026-01-08 | 添加了服务器端口信息（8076），修正了系统管理接口路径，确保所有接口都包含正确的`/api`前缀 |
| 1.0.1 | 2026-01-08 | 修正了接口路径配置，移除了Controller类中重复的`/api`前缀，确保接口路径正确 |
| 1.0.0 | 2023-12-01 | 初始版本，包含停车场、停车位、车辆进出、收费记录、计费规则管理以及系统权限管理功能 |
