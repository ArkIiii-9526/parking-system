<template>
  <div class="login-container">
    <div class="login-background">
      <div class="login-gradient"></div>
      <div class="login-shapes">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
      </div>
    </div>
    <div class="login-content">
      <div class="login-box" :class="{ 'animate-in': isVisible }">
        <div class="login-header">
          <div class="logo-container">
            <img class="logo" src="@/assets/logo.svg" alt="logo" />
            <div class="logo-glow"></div>
          </div>
          <h1 class="title">智慧停车系统</h1>
          <p class="subtitle">智能管理，便捷停车</p>
        </div>
        <el-form
          ref="loginFormRef"
          :model="loginForm"
          :rules="loginRules"
          class="login-form"
          size="large"
        >
          <el-form-item prop="username" class="form-item">
            <div class="input-container">
              <el-icon class="input-icon"><User /></el-icon>
              <el-input
                v-model="loginForm.username"
                placeholder="请输入用户名"
                clearable
                :class="{ 'input-focus': focusedField === 'username' }"
                @focus="focusedField = 'username'"
                @blur="focusedField = ''"
              />
            </div>
          </el-form-item>
          <el-form-item prop="password" class="form-item">
            <div class="input-container">
              <el-icon class="input-icon"><Lock /></el-icon>
              <el-input
                v-model="loginForm.password"
                type="password"
                placeholder="请输入密码"
                show-password
                :class="{ 'input-focus': focusedField === 'password' }"
                @focus="focusedField = 'password'"
                @blur="focusedField = ''"
                @keyup.enter="handleLogin"
              />
            </div>
          </el-form-item>
          
          <div class="form-options">
            <el-checkbox v-model="rememberMe" class="remember-checkbox">记住我</el-checkbox>
            <el-link type="primary" class="forgot-link">忘记密码?</el-link>
          </div>

          <el-form-item class="form-item">
            <el-button 
              type="primary" 
              :loading="loading" 
              class="login-btn"
              @click="handleLogin"
            >
              <span v-if="!loading" class="btn-text">
                <el-icon class="btn-icon"><Check /></el-icon>
                登录系统
              </span>
              <span v-else class="btn-loading">
                <el-icon class="btn-icon"><Loading /></el-icon>
                登录中...
              </span>
            </el-button>
          </el-form-item>
        </el-form>
        <div class="login-footer">
          <p class="copyright">© 2026 智慧停车系统. 保留所有权利.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const loginFormRef = ref(null)
const loading = ref(false)
const isVisible = ref(false)
const focusedField = ref('')
const rememberMe = ref(false)

const loginForm = reactive({
  username: '',
  password: ''
})

const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度在2-20个字符之间', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在6-20个字符之间', trigger: 'blur' }
  ]
}

function handleLogin() {
  loginFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    loading.value = true
    try {
      await userStore.login(loginForm)
      ElMessage.success('登录成功')
      
      const redirect = route.query.redirect || '/'
      router.push(redirect)
    } catch (error) {
      ElMessage.error('登录失败，请检查用户名和密码')
    } finally {
      loading.value = false
    }
  })
}

onMounted(() => {
  // 页面加载后显示登录框，添加动画效果
  setTimeout(() => {
    isVisible.value = true
  }, 100)
})
</script>

<style lang="scss" scoped>
.login-container {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.login-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  
  .login-gradient {
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, var(--primary-dark) 0%, var(--primary-color) 100%);
  }
  
  .login-shapes {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    
    .shape {
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      animation: float 6s ease-in-out infinite;
      
      &.shape-1 {
        width: 300px;
        height: 300px;
        top: -100px;
        right: -100px;
        animation-delay: 0s;
      }
      
      &.shape-2 {
        width: 200px;
        height: 200px;
        bottom: -50px;
        left: -50px;
        animation-delay: 2s;
      }
      
      &.shape-3 {
        width: 150px;
        height: 150px;
        top: 50%;
        left: 10%;
        animation-delay: 4s;
      }
    }
  }
}

.login-content {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 480px;
  padding: 0 var(--spacing-lg);
}

.login-box {
  background: var(--white);
  border-radius: var(--border-radius-xl);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  padding: var(--spacing-2xl);
  transform: translateY(20px);
  opacity: 0;
  transition: all 0.6s ease;
  
  &.animate-in {
    transform: translateY(0);
    opacity: 1;
  }
}

.login-header {
  text-align: center;
  margin-bottom: var(--spacing-xl);
  
  .logo-container {
    position: relative;
    display: inline-block;
    margin-bottom: var(--spacing-lg);
    
    .logo {
      width: 80px;
      height: 80px;
      z-index: 2;
      position: relative;
    }
    
    .logo-glow {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 100px;
      height: 100px;
      background: var(--primary-light);
      border-radius: 50%;
      filter: blur(20px);
      opacity: 0.3;
      z-index: 1;
      animation: pulse 2s ease-in-out infinite;
    }
  }
  
  .title {
    font-size: var(--font-size-2xl);
    font-weight: 700;
    color: var(--text-primary);
    margin: 0 0 var(--spacing-xs);
  }
  
  .subtitle {
    font-size: var(--font-size-base);
    color: var(--text-secondary);
    margin: 0;
  }
}

.login-form {
  .form-item {
    margin-bottom: var(--spacing-lg);
  }
  
  .input-container {
    position: relative;
    display: flex;
    align-items: center;
    background: var(--surface-light);
    border-radius: var(--border-radius-lg);
    padding: 0 var(--spacing-md);
    transition: all 0.3s ease;
    border: 2px solid transparent;
    
    &:hover {
      background: var(--surface);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    
    .input-focus + & {
      border-color: var(--primary-color);
      box-shadow: 0 0 0 3px rgba(54, 100, 139, 0.1);
    }
    
    .input-icon {
      font-size: 18px;
      color: var(--text-secondary);
      margin-right: var(--spacing-sm);
      transition: color 0.3s ease;
      
      .input-focus + & {
        color: var(--primary-color);
      }
    }
    
    .el-input {
      flex: 1;
      border: none;
      background: transparent;
      
      &:focus {
        box-shadow: none;
      }
      
      .el-input__wrapper {
        background: transparent !important;
        box-shadow: none !important;
        border: none !important;
      }
    }
  }
  
  .form-options {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-xl);
    
    .remember-checkbox {
      font-size: var(--font-size-sm);
      color: var(--text-regular);
    }
    
    .forgot-link {
      font-size: var(--font-size-sm);
    }
  }
  
  .login-btn {
    width: 100%;
    height: 50px;
    font-size: var(--font-size-lg);
    font-weight: 600;
    border-radius: var(--border-radius-lg);
    background: var(--primary-color);
    border: none;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
    
    &:hover {
      background: var(--primary-light);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(54, 100, 139, 0.4);
    }
    
    &:active {
      transform: translateY(0);
    }
    
    .btn-icon {
      font-size: 18px;
    }
  }
}

.login-footer {
  margin-top: var(--spacing-xl);
  text-align: center;
  
  .copyright {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    margin: 0;
  }
}

/* 动画效果 */
@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20px);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.3;
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    opacity: 0.5;
    transform: translate(-50%, -50%) scale(1.1);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .login-content {
    padding: 0 var(--spacing-md);
  }
  
  .login-box {
    padding: var(--spacing-xl);
  }
  
  .login-header {
    .logo-container {
      .logo {
        width: 64px;
        height: 64px;
      }
      
      .logo-glow {
        width: 80px;
        height: 80px;
      }
    }
    
    .title {
      font-size: var(--font-size-xl);
    }
  }
  
  .login-form {
    .login-btn {
      height: 44px;
      font-size: var(--font-size-base);
    }
  }
}

@media (max-width: 480px) {
  .login-box {
    padding: var(--spacing-lg);
  }
  
  .login-header {
    .title {
      font-size: var(--font-size-lg);
    }
    
    .subtitle {
      font-size: var(--font-size-sm);
    }
  }
  
  .login-form {
    .input-container {
      padding: 0 var(--spacing-sm);
    }
    
    .form-options {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--spacing-sm);
    }
  }
}
</style>
