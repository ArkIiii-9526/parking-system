<template>
  <div class="error-page">
    <div class="error-backdrop"></div>
    <div class="error-content">
      <div class="error-code">404</div>
      <div class="error-message">抱歉，您访问的页面不存在</div>
      <div class="error-desc">您可以返回首页继续操作，或联系管理员确认页面路径。</div>
      <el-button type="primary" @click="goHome">返回首页</el-button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

function goHome() {
  router.push('/')
}
</script>

<style lang="scss" scoped>
.error-page {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background: var(--bg-primary);
}

.error-backdrop {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 20% 20%, var(--primary-surface-strong) 0%, transparent 45%),
    radial-gradient(ellipse at 80% 80%, var(--secondary-surface) 0%, transparent 45%),
    radial-gradient(ellipse at 50% 50%, var(--accent-surface) 0%, transparent 60%);
}

.error-content {
  position: relative;
  z-index: 1;
  width: min(520px, calc(100vw - 48px));
  padding: var(--space-10) var(--space-8);
  text-align: center;
  color: var(--text-primary);
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-2xl);
  backdrop-filter: blur(24px);
  box-shadow: var(--shadow-xl);
  
  .error-code {
    font-family: var(--font-display);
    font-size: clamp(96px, 18vw, 140px);
    font-weight: var(--font-bold);
    line-height: 1;
    margin-bottom: var(--space-5);
    background: linear-gradient(135deg, var(--primary-400), var(--secondary-400));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .error-message {
    font-size: var(--text-2xl);
    font-weight: var(--font-semibold);
    margin-bottom: var(--space-3);
  }
  
  .error-desc {
    font-size: var(--text-sm);
    color: var(--text-tertiary);
    margin-bottom: var(--space-8);
    max-width: 360px;
    margin-left: auto;
    margin-right: auto;
  }
}
</style>
