<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElForm, ElFormItem, ElInput, ElButton, ElCard, ElLink, ElMessage, ElCheckbox } from 'element-plus'
import axios from '@/util/axios'

const router = useRouter()
const loading = ref(false)

// 表单数据
const formData = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  agreeTerms: false
})

// 表单验证规则
const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度应在3-20个字符之间', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少为6个字符', trigger: 'blur' },
    { pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, message: '密码必须包含大小写字母和数字', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== formData.password) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  agreeTerms: [
    { 
      validator: (rule, value, callback) => {
        if (!value) {
          callback(new Error('请阅读并同意服务条款'))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ]
}

// 表单引用
const formRef = ref(null)

// 处理注册
const handleRegister = async () => {
  // 验证表单
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        // 准备注册数据（移除确认密码和同意条款字段）
        const registerData = {
          username: formData.username,
          email: formData.email,
          password: formData.password
        }
        
        // 调用注册接口
        // 实际环境中使用：const response = await axios.post('/api/register', registerData)
        
        // 模拟环境下，如果接口调不通，提供模拟注册
        // 模拟成功
        ElMessage.success('注册成功！请登录')
        
        // 延时跳转到登录页
        setTimeout(() => {
          router.push('/login')
        }, 1500)
        
      } catch (error) {
        console.error('注册过程中出现错误:', error)
        // 模拟注册失败的错误信息
        if (error.response && error.response.data) {
          ElMessage.error(error.response.data.message || '注册失败，请稍后重试')
        } else {
          ElMessage.error('网络错误，请检查您的连接')
        }
      } finally {
        loading.value = false
      }
    }
  })
}

// 跳转到登录页面
const goToLogin = () => {
  router.push('/login')
}
</script>

<template>
  <div class="register-container">
    <div class="register-wrapper">
      <ElCard class="register-card"
        shadow="hover"
      >
        <div class="register-header">
          <h2 class="register-title">创建账号</h2>
          <p class="register-subtitle">加入智慧停车引导系统，享受智能停车服务</p>
        </div>
        <ElForm
          ref="formRef"
          :model="formData"
          :rules="rules"
          label-position="left"
          label-width="80px"
          class="register-form"
        >
          <ElFormItem label="用户名" prop="username"
            class="form-item"
          >
            <ElInput
              v-model="formData.username"
              placeholder="请输入用户名"
              prefix-icon="User"
              class="form-input"
              clearable
            />
          </ElFormItem>
          <ElFormItem label="邮箱" prop="email"
            class="form-item"
          >
            <ElInput
              v-model="formData.email"
              placeholder="请输入邮箱"
              prefix-icon="Message"
              type="email"
              class="form-input"
              clearable
            />
          </ElFormItem>
          <ElFormItem label="密码" prop="password"
            class="form-item"
          >
            <ElInput
              v-model="formData.password"
              placeholder="请输入密码（至少6位，包含大小写字母和数字）"
              prefix-icon="Lock"
              show-password
              class="form-input"
            />
          </ElFormItem>
          <ElFormItem label="确认密码" prop="confirmPassword"
            class="form-item"
          >
            <ElInput
              v-model="formData.confirmPassword"
              placeholder="请再次输入密码"
              prefix-icon="Check"
              show-password
              class="form-input"
            />
          </ElFormItem>
          <ElFormItem prop="agreeTerms" class="form-item">
            <ElCheckbox v-model="formData.agreeTerms"
              class="terms-checkbox"
            >
              我已阅读并同意 <ElLink type="primary" href="#" class="terms-link">服务条款</ElLink> 和 <ElLink type="primary" href="#" class="terms-link">隐私政策</ElLink>
            </ElCheckbox>
          </ElFormItem>
          <ElFormItem class="form-item">
            <ElButton
              type="primary"
              @click="handleRegister"
              :loading="loading"
              class="register-button"
              native-type="submit"
            >
              {{ loading ? '注册中...' : '立即注册' }}
            </ElButton>
            <ElLink @click="goToLogin" class="login-link">
              已有账号？立即登录
            </ElLink>
          </ElFormItem>
        </ElForm>
      </ElCard>
    </div>
  </div>
</template>

<style scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: inherit;
}

.register-wrapper {
  width: 100%;
  max-width: 500px;
}

.register-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  overflow: hidden;
  border: none;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.register-card:hover {
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.register-header {
  text-align: center;
  padding: 2rem 0 1rem;
}

.register-title {
  font-size: 2rem;
  font-weight: bold;
  margin: 0 0 0.5rem 0;
  background: linear-gradient(45deg, #2196F3, #1976D2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.register-subtitle {
  color: #666;
  font-size: 1rem;
  margin: 0;
}

.register-form {
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
  box-shadow: 0 0 0 1px rgba(33, 150, 243, 0.2);
  border-color: #2196F3;
}

.terms-checkbox {
  color: #666;
  font-size: 0.9rem;
}

.terms-link {
  font-size: 0.9rem;
  color: #2196F3;
  transition: color 0.3s ease;
}

.terms-link:hover {
  color: #1976D2;
}

.register-button {
  width: 70%;
  height: 45px;
  font-size: 1.1rem;
  font-weight: bold;
  border-radius: 8px;
  background: linear-gradient(45deg, #2196F3, #1976D2);
  border: none;
  transition: all 0.3s ease;
}

.register-button:hover {
  background: linear-gradient(45deg, #1976D2, #1565C0);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
}

.login-link {
  font-size: 1rem;
  color: #4CAF50;
  transition: color 0.3s ease;
}

.login-link:hover {
  color: #45a049;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .register-container {
    padding: 1rem;
  }
  
  .register-title {
    font-size: 1.6rem;
  }
  
  .register-form {
    padding: 0 1.5rem 1.5rem;
  }
  
  .register-button {
    width: 80%;
  }
  
  .terms-checkbox {
    font-size: 0.85rem;
  }
}
</style>