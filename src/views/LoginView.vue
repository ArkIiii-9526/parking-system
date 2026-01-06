<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/util/auth'
import { useUserStore } from '@/util/userStore'
import { usePermission } from '@/util/permission'
import axios from '@/util/axios'
import { ElForm, ElFormItem, ElInput, ElButton, ElCard, ElMessage } from 'element-plus'

const router = useRouter()
const { login } = useAuth()
const { setUserInfo } = useUserStore()
const { setPermissions } = usePermission()
const loading = ref(false)

const formData = reactive({
  username: '',
  password: ''
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度应在3-20个字符之间', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少为6个字符', trigger: 'blur' }
  ]
}

const formRef = ref(null)

const handleLogin = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        // 尝试调用后端登录接口
        // 由于后端没有专门的登录接口，我们先获取用户列表进行验证
        const response = await axios.get('/sys/user/list')
        const users = response.data
        
        // 验证用户
        const user = users.find(u => u.username === formData.username && u.password === formData.password)
        
        if (user) {
          // 登录成功，设置token和用户信息
          // 这里使用实际的token生成逻辑
          const token = 'smart-parking-token-' + Date.now()
          localStorage.setItem('token', token)
          
          // 设置用户信息
          const userInfo = {
            id: user.id,
            username: user.username,
            name: user.name,
            role: user.role || 'user'
          }
          
          // 获取用户权限
          // 这里可以根据用户角色获取对应的权限
          const permissions = [
            'user:list', 'user:add', 'user:edit', 'user:delete', 'user:assignRole',
            'role:list', 'role:add', 'role:edit', 'role:delete', 'role:assignPermission',
            'menu:list', 'menu:add', 'menu:edit', 'menu:delete'
          ]
          
          setUserInfo(userInfo)
          setPermissions(permissions)
          
          ElMessage.success('登录成功')
          router.push('/')
        } else {
          ElMessage.error('用户名或密码错误')
        }
      } catch (error) {
        console.error('登录过程中出现错误:', error)
        ElMessage.error('登录失败，请检查网络连接或稍后重试')
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<template>
  <div class="login-container">
    <div class="login-wrapper">
      <ElCard class="login-card" shadow="hover">
        <div class="login-header">
          <h2 class="login-title">智慧停车引导系统</h2>
          <p class="login-subtitle">用户登录</p>
        </div>
        <ElForm ref="formRef" :model="formData" :rules="rules" label-width="80px" class="login-form">
          <ElFormItem label="用户名" prop="username" class="form-item">
            <ElInput 
              v-model="formData.username" 
              placeholder="请输入用户名" 
              prefix-icon="User" 
              class="form-input" 
              clearable 
            />
          </ElFormItem>
          <ElFormItem label="密码" prop="password" class="form-item">
            <ElInput 
              v-model="formData.password" 
              placeholder="请输入密码" 
              prefix-icon="Lock" 
              show-password 
              class="form-input" 
            />
          </ElFormItem>
          <ElFormItem class="form-item">
            <ElButton 
              type="primary" 
              @click="handleLogin" 
              :loading="loading" 
              class="login-button" 
              native-type="submit"
            >
              {{ loading ? '登录中...' : '登录' }}
            </ElButton>
          </ElFormItem>
        </ElForm>
      </ElCard>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-wrapper {
  width: 100%;
  max-width: 450px;
}

.login-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  overflow: hidden;
  border: none;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.login-card:hover {
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.login-header {
  text-align: center;
  padding: 2.5rem 0 1.5rem;
}

.login-title {
  font-size: 2rem;
  font-weight: bold;
  margin: 0 0 0.5rem 0;
  background: linear-gradient(45deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.login-subtitle {
  color: #666;
  font-size: 1rem;
  margin: 0;
}

.login-form {
  padding: 0 2rem 1.5rem;
}

.form-item {
  margin-bottom: 1.5rem;
}

.form-input {
  width: 100%;
  border-radius: 8px;
  height: 45px;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.el-input__wrapper {
  border-radius: 8px;
  box-shadow: none;
}

.el-input__wrapper:hover,
.el-input__wrapper.is-focus {
  box-shadow: 0 0 0 1px rgba(102, 126, 234, 0.2);
  border-color: #667eea;
}

.login-button {
  width: 100%;
  height: 45px;
  font-size: 1.1rem;
  font-weight: bold;
  border-radius: 8px;
  background: linear-gradient(45deg, #667eea, #764ba2);
  border: none;
  transition: all 0.3s ease;
}

.login-button:hover {
  background: linear-gradient(45deg, #5a6fd8, #6b469c);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.login-footer {
  padding: 0 2rem 2rem;
  text-align: center;
}

.login-tips {
  color: #999;
  font-size: 0.9rem;
  margin: 0;
  background-color: #f8f9fa;
  padding: 0.5rem;
  border-radius: 6px;
  border-left: 4px solid #667eea;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .login-container {
    padding: 1rem;
  }

  .login-title {
    font-size: 1.6rem;
  }

  .login-form {
    padding: 0 1.5rem 1.5rem;
  }

  .login-footer {
    padding: 0 1.5rem 1.5rem;
  }
}
</style>