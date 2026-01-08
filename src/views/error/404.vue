<template>
  <div class="error-page">
    <div class="error-content">
      <div class="error-code">404</div>
      <div class="error-message">抱歉，您访问的页面不存在</div>
      <div class="error-desc">您可以尝试返回首页或联系管理员</div>
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.error-content {
  text-align: center;
  color: #ffffff;
  
  .error-code {
    font-size: 120px;
    font-weight: 700;
    line-height: 1;
    margin-bottom: 20px;
    text-shadow: 4px 4px 8px rgba(0, 0, 0, 0.2);
  }
  
  .error-message {
    font-size: 24px;
    font-weight: 500;
    margin-bottom: 12px;
  }
  
  .error-desc {
    font-size: 14px;
    opacity: 0.8;
    margin-bottom: 32px;
  }
}
</style>
