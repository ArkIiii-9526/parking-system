#!/bin/bash

# 设置基本信息
BASE_URL="http://localhost:8077/api"
LOGIN_URL="$BASE_URL/auth/login"
USERNAME="admin"
PASSWORD="admin123"
TEST_RESULT_FILE="test_results.md"

# 清除旧的测试结果文件
> $TEST_RESULT_FILE

# 添加测试报告标题
cat <<EOF >> $TEST_RESULT_FILE
# 智能停车系统接口测试报告

## 测试概述
- 测试日期: $(date)
- 测试环境: 本地开发环境 ($BASE_URL)
- 测试用户: $USERNAME
- 测试目的: 验证所有前端系统接口的准确性和返回数据的正确性

EOF

# 登录并获取token
echo "正在登录系统..."
LOGIN_RESPONSE=$(curl -s -X POST $LOGIN_URL -H "Content-Type: application/json" -d "{\"username\":\"$USERNAME\",\"password\":\"$PASSWORD\"}")

# 检查登录是否成功
if [[ $(echo $LOGIN_RESPONSE | jq -r '.code') -eq 200 ]]; then
    TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.token')
    echo "登录成功，获取到token: $TOKEN"
    
    # 记录登录测试结果
    cat <<EOF >> $TEST_RESULT_FILE
## 1. 登录功能测试
- **接口**: POST $LOGIN_URL
- **参数**: {"username":"$USERNAME","password":"$PASSWORD"}
- **响应状态**: 成功
- **返回数据**: $(echo $LOGIN_RESPONSE | jq .)

EOF
    
    # 测试函数
    test_api() {
        local api_name=$1
        local method=$2
        local url=$3
        local params=$4
        
        echo "测试接口: $api_name ($method $url)"
        
        # 根据请求方法发送请求
        if [ "$method" = "GET" ]; then
            RESPONSE=$(curl -s -X $method "$url" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json")
        elif [ "$method" = "POST" ] || [ "$method" = "PUT" ] || [ "$method" = "DELETE" ]; then
            RESPONSE=$(curl -s -X $method "$url" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$params")
        fi
        
        # 记录测试结果
        cat <<EOF >> $TEST_RESULT_FILE
### $api_name
- **接口**: $method $url
- **参数**: $params
- **响应状态**: $(echo $RESPONSE | jq -r '.code')
- **响应信息**: $(echo $RESPONSE | jq -r '.message')
- **返回数据**: $(echo $RESPONSE | jq .)

EOF
    }
    
    # 测试所有接口
    echo "开始测试所有接口..."
    cat <<EOF >> $TEST_RESULT_FILE
## 2. 功能模块接口测试

EOF
    
    # 认证相关接口
    test_api "登出" "POST" "$BASE_URL/auth/logout" "{}"
    
    # 用户相关接口
    test_api "获取用户信息" "GET" "$BASE_URL/sys/user/menus" ""
    test_api "获取用户列表" "GET" "$BASE_URL/sys/user/list" ""
    
    # 角色相关接口
    test_api "获取角色列表" "GET" "$BASE_URL/sys/role/list" ""
    
    # 权限相关接口
    test_api "获取权限列表" "GET" "$BASE_URL/sys/permission/list" ""
    test_api "获取权限树" "GET" "$BASE_URL/sys/permission/tree" ""
    
    # 停车场相关接口
    test_api "获取停车场列表" "GET" "$BASE_URL/parkings/page" ""
    
    # 停车位相关接口
    test_api "获取停车位列表" "GET" "$BASE_URL/parking-spaces/page" ""
    
    # 车辆相关接口
    test_api "获取活跃车辆列表" "GET" "$BASE_URL/vehicle/active-entry" ""
    
    # 计费相关接口
    test_api "获取收费记录" "GET" "$BASE_URL/billing/records/page" ""
    test_api "获取计费规则列表" "GET" "$BASE_URL/billing/rules/page" ""
    
    echo "所有接口测试完成，测试结果已保存到 $TEST_RESULT_FILE"
    
else
    echo "登录失败: $(echo $LOGIN_RESPONSE | jq .)"
    exit 1
fi
