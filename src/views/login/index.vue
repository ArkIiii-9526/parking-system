<template>
  <div class="login-page">
    <!-- 动态背景层 -->
    <div class="login-background">
      <div class="gradient-mesh"></div>
      <div class="aurora-blob blob-1"></div>
      <div class="aurora-blob blob-2"></div>
      <div class="aurora-blob blob-3"></div>
      <div class="particles-container">
        <div v-for="n in 20" :key="n" class="particle" :style="getParticleStyle(n)"></div>
      </div>
    </div>
    
    <!-- 登录内容 -->
    <div class="login-content">
      <div class="login-box" :class="{ 'animate-in': isVisible }">
        <!-- Logo区域 -->
        <div class="login-brand">
          <div class="brand-icon">
            <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="var(--primary-500)"/>
                  <stop offset="50%" stop-color="var(--secondary-500)"/>
                  <stop offset="100%" stop-color="var(--accent-500)"/>
                </linearGradient>
              </defs>
              <rect x="8" y="20" width="48" height="32" rx="4" stroke="url(#logoGradient)" stroke-width="3" fill="none"/>
              <circle cx="20" cy="36" r="4" fill="url(#logoGradient)"/>
              <circle cx="32" cy="36" r="4" fill="url(#logoGradient)"/>
              <circle cx="44" cy="36" r="4" fill="url(#logoGradient)"/>
              <path d="M16 20V14C16 11.7909 17.7909 10 20 10H44C46.2091 10 48 11.7909 48 14V20" stroke="url(#logoGradient)" stroke-width="3" stroke-linecap="round"/>
            </svg>
          </div>
          <h1 class="brand-title">智慧停车</h1>
          <p class="brand-subtitle">Smart Parking System</p>
        </div>
        
        <!-- 登录/注册表单 -->
        <el-form
          v-if="isLogin"
          ref="loginFormRef"
          :model="loginForm"
          :rules="loginRules"
          class="login-form"
        >
          <el-form-item prop="username">
            <div class="input-wrapper" :class="{ 'is-focus': focusedField === 'username' }">
              <el-icon class="input-icon"><User /></el-icon>
              <el-input
                v-model="loginForm.username"
                placeholder="请输入用户名"
                clearable
                @focus="focusedField = 'username'"
                @blur="focusedField = ''"
              />
            </div>
          </el-form-item>
          
          <el-form-item prop="password">
            <div class="input-wrapper" :class="{ 'is-focus': focusedField === 'password' }">
              <el-icon class="input-icon"><Lock /></el-icon>
              <el-input
                v-model="loginForm.password"
                type="password"
                placeholder="请输入密码"
                show-password
                @focus="focusedField = 'password'"
                @blur="focusedField = ''"
                @keyup.enter="handleLogin"
              />
            </div>
          </el-form-item>
          
          <div class="form-options">
            <el-checkbox v-model="rememberMe" class="remember-me">
              <span class="checkbox-label">记住我</span>
            </el-checkbox>
            <div class="right-links">
              <a href="#" class="action-link" @click.prevent="toggleForm">注册账号</a>
              <span class="divider">|</span>
              <a href="#" class="action-link">忘记密码?</a>
            </div>
          </div>
          
          <el-form-item>
            <button 
              type="button"
              class="login-btn"
              :class="{ 'is-loading': loading }"
              :disabled="loading"
              @click="handleLogin"
            >
              <span v-if="!loading" class="btn-content">
                <span>登录系统</span>
                <el-icon class="btn-icon"><ArrowRight /></el-icon>
              </span>
              <span v-else class="btn-loading">
                <span class="loading-spinner"></span>
                <span>登录中...</span>
              </span>
            </button>
          </el-form-item>
        </el-form>

        <el-form
          v-else
          ref="registerFormRef"
          :model="registerForm"
          :rules="registerRules"
          class="login-form"
        >
          <el-form-item prop="username">
            <div class="input-wrapper" :class="{ 'is-focus': focusedField === 'reg-username' }">
              <el-icon class="input-icon"><User /></el-icon>
              <el-input
                v-model="registerForm.username"
                placeholder="请输入用户名"
                clearable
                @focus="focusedField = 'reg-username'"
                @blur="focusedField = ''"
              />
            </div>
          </el-form-item>

          <el-form-item prop="email">
            <div class="input-wrapper" :class="{ 'is-focus': focusedField === 'reg-email' }">
              <el-icon class="input-icon"><Message /></el-icon>
              <el-input
                v-model="registerForm.email"
                placeholder="请输入邮箱"
                clearable
                @focus="focusedField = 'reg-email'"
                @blur="focusedField = ''"
              />
            </div>
          </el-form-item>
          
          <el-form-item prop="password">
            <div class="input-wrapper" :class="{ 'is-focus': focusedField === 'reg-password' }">
              <el-icon class="input-icon"><Lock /></el-icon>
              <el-input
                v-model="registerForm.password"
                type="password"
                placeholder="请输入密码"
                show-password
                @focus="focusedField = 'reg-password'"
                @blur="focusedField = ''"
              />
            </div>
          </el-form-item>

          <el-form-item prop="confirmPassword">
            <div class="input-wrapper" :class="{ 'is-focus': focusedField === 'reg-confirmPassword' }">
              <el-icon class="input-icon"><Lock /></el-icon>
              <el-input
                v-model="registerForm.confirmPassword"
                type="password"
                placeholder="请确认密码"
                show-password
                @focus="focusedField = 'reg-confirmPassword'"
                @blur="focusedField = ''"
              />
            </div>
          </el-form-item>

          <el-form-item prop="captcha">
            <div class="captcha-container">
              <div class="input-wrapper" :class="{ 'is-focus': focusedField === 'reg-captcha' }">
                <el-icon class="input-icon"><Key /></el-icon>
                <el-input
                  v-model="registerForm.captcha"
                  placeholder="验证码"
                  clearable
                  @focus="focusedField = 'reg-captcha'"
                  @blur="focusedField = ''"
                  @keyup.enter="handleRegister"
                />
              </div>
              <div class="captcha-img" @click="fetchCaptcha">
                <img v-if="captchaImg" :src="captchaImg" alt="验证码" />
                <span v-else>加载中</span>
              </div>
            </div>
          </el-form-item>
          
          <div class="form-options">
            <a href="#" class="action-link" @click.prevent="toggleForm">已有账号？返回登录</a>
          </div>
          
          <el-form-item>
            <button 
              type="button"
              class="login-btn"
              :class="{ 'is-loading': loading }"
              :disabled="loading"
              @click="handleRegister"
            >
              <span v-if="!loading" class="btn-content">
                <span>注册账号</span>
                <el-icon class="btn-icon"><ArrowRight /></el-icon>
              </span>
              <span v-else class="btn-loading">
                <span class="loading-spinner"></span>
                <span>提交中...</span>
              </span>
            </button>
          </el-form-item>
        </el-form>
        
        <!-- 底部信息 -->
        <div class="login-footer">
          <p class="copyright">© 2026 智慧停车系统 · 智能管理 便捷停车</p>
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
import { getCaptcha, register } from '@/api/login'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const loginFormRef = ref(null)
const registerFormRef = ref(null)
const loading = ref(false)
const isVisible = ref(false)
const focusedField = ref('')
const rememberMe = ref(false)
const isLogin = ref(true)
const captchaImg = ref('')
const captchaUuid = ref('')

const loginForm = reactive({
  username: '',
  password: ''
})

const registerForm = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  captcha: ''
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

const validatePass2 = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== registerForm.password) {
    callback(new Error('两次输入密码不一致!'))
  } else {
    callback()
  }
}

const registerRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度在2-20个字符之间', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: ['blur', 'change'] }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在6-20个字符之间', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, validator: validatePass2, trigger: 'blur' }
  ],
  captcha: [
    { required: true, message: '请输入验证码', trigger: 'blur' }
  ]
}

function toggleForm() {
  isLogin.value = !isLogin.value
  focusedField.value = ''
  if (!isLogin.value) {
    fetchCaptcha()
  }
}

async function fetchCaptcha() {
  try {
    const res = await getCaptcha()
    captchaImg.value = res.data.img
    captchaUuid.value = res.data.uuid
  } catch (error) {
    ElMessage.error('获取验证码失败')
  }
}

// 生成粒子样式
function getParticleStyle(_n) {
  const size = Math.random() * 4 + 2
  const left = Math.random() * 100
  const delay = Math.random() * 20
  const duration = Math.random() * 10 + 15

  return {
    width: `${size}px`,
    height: `${size}px`,
    left: `${left}%`,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`
  }
}

async function handleLogin() {
  const valid = await loginFormRef.value.validate().catch(() => false)
  if (!valid) return
  
  loading.value = true
  try {
    await userStore.login(loginForm)
    ElMessage.success({
      message: '欢迎回来！',
      type: 'success',
      plain: true
    })
    
    const redirect = route.query.redirect || '/'
    router.push(redirect)
  } catch (_error) {
    ElMessage.error({
      message: '登录失败，请检查用户名和密码',
      type: 'error',
      plain: true
    })
  } finally {
    loading.value = false
  }
}

async function handleRegister() {
  const valid = await registerFormRef.value.validate().catch(() => false)
  if (!valid) return
  
  loading.value = true
  try {
    await register({
      username: registerForm.username,
      email: registerForm.email,
      password: registerForm.password,
      confirmPassword: registerForm.confirmPassword,
      captcha: registerForm.captcha,
      uuid: captchaUuid.value
    })
    ElMessage.success({
      message: '注册成功，请登录！',
      type: 'success',
      plain: true
    })
    toggleForm()
  } catch (error) {
    fetchCaptcha() // 刷新验证码
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  setTimeout(() => {
    isVisible.value = true
  }, 100)
})
</script>

<style lang="scss" scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background: var(--bg-primary);
}

// 动态背景
.login-background {
  position: fixed;
  inset: 0;
  z-index: 0;
  
  .gradient-mesh {
    position: absolute;
    inset: 0;
    background: 
      radial-gradient(ellipse at 20% 20%, var(--primary-surface-strong) 0%, transparent 50%),
      radial-gradient(ellipse at 80% 80%, var(--secondary-surface) 0%, transparent 50%),
      radial-gradient(ellipse at 50% 50%, var(--accent-surface) 0%, transparent 70%),
      radial-gradient(ellipse at 80% 20%, var(--primary-surface) 0%, transparent 40%),
      radial-gradient(ellipse at 20% 80%, var(--secondary-surface) 0%, transparent 40%);
  }
  
  .aurora-blob {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.4;
    animation: float 20s ease-in-out infinite;
    
    &.blob-1 {
      width: 600px;
      height: 600px;
      background: linear-gradient(135deg, var(--primary-surface-strong), var(--primary-surface));
      top: -200px;
      right: -200px;
      animation-delay: 0s;
    }
    
    &.blob-2 {
      width: 500px;
      height: 500px;
      background: linear-gradient(135deg, var(--secondary-surface-strong), var(--secondary-surface));
      bottom: -150px;
      left: -150px;
      animation-delay: -7s;
    }
    
    &.blob-3 {
      width: 400px;
      height: 400px;
      background: linear-gradient(135deg, var(--accent-surface-strong), var(--accent-surface));
      top: 50%;
      left: 30%;
      animation-delay: -14s;
    }
  }
  
  .particles-container {
    position: absolute;
    inset: 0;
    overflow: hidden;
    
    .particle {
      position: absolute;
      background: var(--glass-bg-active);
      border-radius: 50%;
      bottom: -10px;
      animation: rise linear infinite;
    }
  }
}

@keyframes rise {
  0% {
    transform: translateY(0) scale(1);
    opacity: 0;
  }
  10% {
    opacity: 0.6;
  }
  90% {
    opacity: 0.6;
  }
  100% {
    transform: translateY(-100vh) scale(0.5);
    opacity: 0;
  }
}

// 登录内容
.login-content {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 440px;
  padding: var(--space-6);
}

.login-box {
  background: var(--glass-bg);
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-2xl);
  padding: var(--space-10) var(--space-8);
  box-shadow: 
    var(--shadow-xl),
    0 0 0 1px var(--glass-border) inset,
    var(--shadow-glow-primary);
  opacity: 0;
  transform: translateY(30px) scale(0.98);
  transition: all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  
  &.animate-in {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

// 品牌区域
.login-brand {
  text-align: center;
  margin-bottom: var(--space-8);
  
  .brand-icon {
    width: 80px;
    height: 80px;
    margin: 0 auto var(--space-4);
    position: relative;
    
    &::before {
      content: '';
      position: absolute;
      inset: -10px;
      background: linear-gradient(135deg, var(--primary-surface-strong), var(--secondary-surface));
      border-radius: 50%;
      filter: blur(20px);
      animation: pulse-glow 3s ease-in-out infinite;
    }
    
    svg {
      width: 100%;
      height: 100%;
      position: relative;
      z-index: 1;
    }
  }
  
  .brand-title {
    font-family: var(--font-display);
    font-size: var(--text-3xl);
    font-weight: var(--font-bold);
    background: linear-gradient(135deg, var(--text-primary) 0%, var(--text-secondary) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: var(--space-2);
    letter-spacing: -0.02em;
  }
  
  .brand-subtitle {
    font-size: var(--text-sm);
    color: var(--text-secondary);
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }
}

// 表单样式
.login-form {
  .input-wrapper {
    display: flex;
    align-items: center;
    width: 100%;
    box-sizing: border-box;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-lg);
    transition: all 0.3s ease;
    
    &:hover {
      background: var(--glass-bg-hover);
      border-color: var(--glass-border-hover);
    }
    
    &.is-focus {
      background: var(--glass-bg-active);
      border-color: var(--primary-400);
      box-shadow: 0 0 0 3px var(--primary-surface);
    }
    
    .input-icon {
      font-size: 20px;
      color: var(--text-tertiary);
      transition: color 0.3s ease;
    }
    
    &:hover .input-icon,
    &.is-focus .input-icon {
      color: var(--primary-400);
    }
    
    :deep(.el-input) {
      flex: 1;
      
      .el-input__wrapper {
        background: transparent;
        box-shadow: none;
        padding: 0;
      }
      
      .el-input__inner {
        color: var(--text-primary);
        font-size: var(--text-base);
        height: 28px;
        
        &::placeholder {
          color: var(--text-muted);
        }
      }
    }
  }
  
  .form-options {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: var(--space-5) 0 var(--space-6);
    
    .remember-me {
      :deep(.el-checkbox__input) {
        .el-checkbox__inner {
          background: var(--glass-bg);
          border-color: var(--glass-border-hover);
          
          &:hover {
            border-color: var(--primary-400);
          }
          
          &::after {
            border-color: var(--text-primary);
          }
        }
        
        &.is-checked .el-checkbox__inner {
          background: var(--primary-500);
          border-color: var(--primary-500);
          
          &::after {
            border-color: var(--text-primary);
          }
        }
      }
      
      :deep(.el-checkbox__label) {
        padding-left: var(--space-2);
      }
      
      .checkbox-label {
        font-size: var(--text-sm);
        color: var(--text-secondary);
      }
    }
    
    .right-links {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }
    
    .divider {
      color: var(--text-muted);
      font-size: var(--text-xs);
    }

    .action-link, .forgot-link {
      font-size: var(--text-sm);
      color: var(--primary-400);
      text-decoration: none;
      transition: color 0.3s ease;
      
      &:hover {
        color: var(--primary-300);
        text-decoration: underline;
      }
    }
  }

  .captcha-container {
    display: flex;
    gap: var(--space-3);
    width: 100%;
    
    .input-wrapper {
      flex: 1;
    }
    
    .captcha-img {
      width: 120px;
      height: 38px;
      border-radius: var(--radius-lg);
      overflow: hidden;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--glass-bg);
      border: 1px solid var(--glass-border);
      
      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      
      span {
        font-size: var(--text-xs);
        color: var(--text-muted);
      }
    }
  }
  
  .login-btn {
    width: 100%;
    padding: var(--space-4) var(--space-6);
    font-family: var(--font-sans);
    font-size: var(--text-base);
    font-weight: var(--font-semibold);
    color: white;
    background: linear-gradient(135deg, var(--primary-500) 0%, var(--primary-600) 100%);
    border: none;
    border-radius: var(--radius-lg);
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: all 0.3s ease;
    box-shadow: var(--shadow-md), var(--shadow-glow-primary);
    
    &::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(105deg, 
        transparent 40%, 
        var(--neutral-surface-strong) 50%, 
        transparent 60%
      );
      transform: translateX(-100%);
      transition: transform 0.6s ease;
    }
    
    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg), var(--shadow-glow-primary);
      
      &::before {
        transform: translateX(100%);
      }
    }
    
    &:active:not(:disabled) {
      transform: translateY(0);
    }
    
    &:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
    
    .btn-content {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-2);
      position: relative;
      z-index: 1;
      
      .btn-icon {
        font-size: 18px;
        transition: transform 0.3s ease;
      }
    }
    
    &:hover .btn-icon {
      transform: translateX(4px);
    }
    
    &.is-loading {
      .btn-loading {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--space-3);
        position: relative;
        z-index: 1;
        
        .loading-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid var(--glass-border-hover);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
      }
    }
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

// 底部信息
.login-footer {
  margin-top: var(--space-8);
  text-align: center;
  
  .copyright {
    font-size: var(--text-xs);
    color: var(--text-muted);
    letter-spacing: 0.05em;
  }
}

// 响应式设计
@media (max-width: 480px) {
  .login-content {
    padding: var(--space-4);
  }
  
  .login-box {
    padding: var(--space-8) var(--space-6);
  }
  
  .login-brand {
    .brand-icon {
      width: 64px;
      height: 64px;
    }
    
    .brand-title {
      font-size: var(--text-2xl);
    }
  }
}
</style>
