<script setup>
import Background from './Background.vue'
import NavBar from './NavBar.vue'
import { useRouter } from 'vue-router'
import { onMounted } from 'vue'

// 定义props，允许子组件自定义页面标题
const props = defineProps({
  title: {
    type: String,
    default: '智慧停车引导系统'
  }
})

const router = useRouter()

// 页面挂载时检查登录状态（如果需要）
onMounted(() => {
  // 可以在这里添加全局逻辑，比如检查登录状态
  // 直接从localStorage获取token，避免在组件挂载前使用composable
  const token = localStorage.getItem('token')

  // 例如：某些页面需要登录才能访问
  // const requiresAuth = ['/parking'] // 需要登录的路由
  // if (requiresAuth.includes(router.currentRoute.value.path) && !token) {
  //   router.push('/login')
  // }
})
</script>

<template>
  <div class="base-layout">
    <Background />
    <NavBar />
    <main class="main-content">
      <h2 v-if="title" class="page-title">{{ title }}</h2>
      <slot></slot>
    </main>
    <footer class="footer">
      <p class="footer-text">© 2025 智慧停车引导系统 - 为您提供智能、便捷的停车体验</p>
    </footer>
  </div>
</template>

<style scoped>
.base-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
}

.main-content {
  flex: 1;
  max-width: 1200px;
  width: 100%;
  margin: 1rem auto 2rem;
  padding: 2rem;
  position: relative;
  z-index: 1;
  /* 白色半透明（偏白）背景 */
  background: rgba(255, 255, 255, 0.85);
  /* 添加轻微的毛玻璃效果增强层次感 */
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  /* 圆角边框增加友好感 */
  border-radius: 12px;
  /* 轻微阴影增强浮动感 */
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
}

.page-title {
  text-align: center;
  color: #333;
  margin-bottom: 2rem;
  font-size: 2rem;
  font-weight: bold;
  background: linear-gradient(45deg, #333, #666);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.footer {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  padding: 1.5rem 0;
  text-align: center;
  margin-top: auto;
  box-shadow: 0 -2px 15px rgba(0, 0, 0, 0.1);
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  margin-bottom: 0;
}

.footer-text {
  margin: 0;
  color: #666;
  font-size: 1rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .main-content {
    padding: 1.5rem;
    margin: 1rem auto 2rem;
  }

  .page-title {
    font-size: 1.6rem;
    margin-bottom: 1.5rem;
  }

  .footer-text {
    font-size: 0.9rem;
  }
}
</style>