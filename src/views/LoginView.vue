<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/util/auth'
import { ElForm, ElFormItem, ElInput, ElButton, ElCard, ElLink, ElMessage } from 'element-plus'

const router = useRouter()
const { login } = useAuth()
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
        const success = await login(formData.username, formData.password)

        if (success) {
          ElMessage.success('登录成功')
          router.push('/')
        } else {
          ElMessage.error('用户名或密码错误')
        }
      } catch (error) {
        console.error('登录过程中出现错误:', error)
        // 模拟环境下，如果接口调不通，提供一个模拟登录
        if (formData.username === 'SuperAdministrator' && formData.password === 'admin332550@qq.com') {
          // 模拟登录成功，设置token
          localStorage.setItem('token', 'mock-token-for-testing-only')
          ElMessage.success('模拟登录成功（测试账号）')
          router.push('/')
        } else {
          ElMessage.error('登录失败，请稍后重试')
        }
      } finally {
        loading.value = false
      }
    }
  })
}

const goToRegister = () => {
  router.push('/register')
}
</script>

<template>
  <div class="login-container">
    <div class="login-wrapper">
      <ElCard class="login-card" shadow="hover">
        <div class="login-header">
          <h2 class="login-title">欢迎登录</h2>
          <p class="login-subtitle">智慧停车引导系统 - 管理平台</p>
        </div>
        <ElForm ref="formRef" :model="formData" :rules="rules" label-position="left" label-width="80px"
          class="login-form">
          <ElFormItem label="用户名" prop="username" class="form-item">
            <ElInput v-model="formData.username" placeholder="请输入用户名" prefix-icon="User" class="form-input" clearable />
          </ElFormItem>
          <ElFormItem label="密码" prop="password" class="form-item">
            <ElInput v-model="formData.password" placeholder="请输入密码" prefix-icon="Lock" show-password
              class="form-input" />
          </ElFormItem>
          <ElFormItem class="form-item">
            <ElButton type="primary" @click="handleLogin" :loading="loading" class="login-button" native-type="submit">
              {{ loading ? '登录中...' : '登录' }}
            </ElButton>
            <ElLink @click="goToRegister" class="register-link">
              立即注册
            </ElLink>
          </ElFormItem>
        </ElForm>
        <div class="login-tips">
          <p class="tips-text">~~~~~~~~~~~~~~~~~~~~</p>
        </div>
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
  background: inherit;
}

.login-wrapper {
  width: 100%;
  max-width: 450px;
}

.login-card {
  background: rgba(255, 255, 255, 0.9);
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
  padding: 2rem 0 1rem;
}

.login-title {
  font-size: 2rem;
  font-weight: bold;
  margin: 0 0 0.5rem 0;
  background: linear-gradient(45deg, #4CAF50, #2196F3);
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
  padding: 0 2rem 2rem;
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
  box-shadow: 0 0 0 1px rgba(76, 175, 80, 0.2);
  border-color: #4CAF50;
}

.login-button {
  width: 70%;
  height: 45px;
  font-size: 1.1rem;
  font-weight: bold;
  border-radius: 8px;
  background: linear-gradient(45deg, #4CAF50, #45a049);
  border: none;
  transition: all 0.3s ease;
}

.login-button:hover {
  background: linear-gradient(45deg, #45a049, #3d8b40);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.register-link {
  font-size: 1rem;
  color: #2196F3;
  transition: color 0.3s ease;
}

.register-link:hover {
  color: #1976D2;
}

.login-tips {
  padding: 0 2rem 2rem;
  text-align: center;
}

.tips-text {
  color: #999;
  font-size: 0.9rem;
  margin: 0;
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

  .login-button {
    width: 80%;
  }
}
</style>