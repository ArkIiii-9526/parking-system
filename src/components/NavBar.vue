<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMenu, ElMenuItem, ElButton } from 'element-plus'

const router = useRouter()
const route = useRoute()
const currentRoute = ref('')

// 直接从localStorage获取token
const getToken = () => {
  return localStorage.getItem('token')
}

// 处理登出
const handleLogout = () => {
  localStorage.removeItem('token')
  router.push('/login')
}

// 监听路由变化，更新当前激活的菜单项
onMounted(() => {
  currentRoute.value = route.path

  // 监听路由变化
  router.beforeEach((to) => {
    currentRoute.value = to.path
  })
})

// 菜单项配置
const menuItems = [
  { path: '/', label: '首页', showWhenLoggedIn: true },
  { path: '/login', label: '登录', showWhenLoggedIn: false },
]
</script>

<template>
  <nav class="navbar-container">
    <div class="navbar-content">
      <div class="navbar-left">
        <span class="brand-title">智慧停车引导系统</span>
        <ElMenu :default-active="currentRoute" mode="horizontal" router class="main-menu" text-color="#333"
          active-text-color="#4CAF50">
          <ElMenuItem v-for="item in menuItems" :key="item.path" :index="item.path"
            v-show="item.showWhenLoggedIn === !!getToken()" class="menu-item">
            {{ item.label }}
          </ElMenuItem>
        </ElMenu>
      </div>
      <div class="navbar-right">
        <ElButton v-show="!!getToken()" type="primary" plain @click="handleLogout" class="logout-button">
          退出登录
        </ElButton>
      </div>
    </div>
  </nav>
</template>

<style scoped>
/* 导航栏容器 - 增强毛玻璃效果 */
.navbar-container {
  background: rgba(255, 255, 255, 0.65) !important;
  backdrop-filter: blur(20px) !important;
  -webkit-backdrop-filter: blur(20px) !important;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08) !important;
  position: fixed !important;
  /* 修改为fixed以确保覆盖背景 */
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  z-index: 1000 !important;
  height: 60px !important;
  overflow: hidden !important;
  margin: 0 !important;
  padding: 0 !important;
  border: none !important;
}

/* 导航栏内容 */
.navbar-content {
  max-width: 1200px !important;
  margin: 0 auto !important;
  padding: 0 20px !important;
  display: flex !important;
  justify-content: space-between !important;
  align-items: center !important;
  height: 100% !important;
  width: 100% !important;
}

/* 左侧区域 - 标题和菜单 */
.navbar-left {
  display: flex !important;
  align-items: center !important;
  gap: 10px !important;
  /* 减小间隙，避免挤占菜单空间 */
  flex: 1 !important;
  flex-wrap: nowrap !important;
}

.brand-title {
  font-size: 1.3rem !important;
  font-weight: bold !important;
  color: #333 !important;
  white-space: nowrap !important;
  flex-shrink: 0 !important;
  margin: 0 30px 0 20px !important;
  padding: 0 !important;
  min-width: max-content !important;
}

/* 右侧区域 - 登出按钮 */
.navbar-right {
  display: flex !important;
  align-items: center !important;
  gap: 10px !important;
}

/* 登出按钮 */
.logout-button {
  background: rgba(244, 67, 54, 0.1) !important;
  border: 1px solid rgba(244, 67, 54, 0.3) !important;
  color: #f44336 !important;
  font-size: 0.9rem !important;
  padding: 4px 12px !important;
  height: auto !important;
  transition: all 0.3s ease !important;
}

.logout-button:hover {
  background: rgba(244, 67, 54, 0.2) !important;
  border-color: #f44336 !important;
}


:deep(.el-menu) {
  height: 60px !important;
  border-bottom: none !important;
  background: transparent !important;
  display: flex !important;
  align-items: center !important;
  flex: 1 !important;
  min-width: 0 !important;
  margin-left: 0 !important;
}

:deep(.el-menu-item:first-child) {
  margin-left: 0 !important;
  position: relative !important;
  z-index: 1 !important;
}

:deep(.el-menu--horizontal) {
  height: 60px !important;
  border-bottom: none !important;
  background: transparent !important;
}

:deep(.el-menu-item) {
  height: 60px !important;
  line-height: 60px !important;
  padding: 0 12px !important;
  font-size: 1rem !important;
  color: #333 !important;
  transition: all 0.3s ease !important;
  white-space: nowrap !important;
}

:deep(.el-menu-item:hover) {
  background-color: rgba(76, 175, 80, 0.1) !important;
  color: #4CAF50 !important;
}

:deep(.el-menu-item.is-active) {
  color: #4CAF50 !important;
  background-color: transparent !important;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .navbar-container {
    height: 50px !important;
  }

  .navbar-content {
    padding: 0 15px !important;
  }

  .navbar-left {
    display: flex !important;
    align-items: center !important;
    gap: 0 !important;
    flex: 1 !important;
    flex-wrap: nowrap !important;
    padding-left: 0 !important;
  }

  .brand-title {
    font-size: 1.1rem !important;
  }

  :deep(.el-menu) {
    height: 50px !important;
  }

  :deep(.el-menu--horizontal) {
    height: 50px !important;
  }

  :deep(.el-menu-item) {
    height: 50px !important;
    line-height: 50px !important;
    padding: 0 8px !important;
    font-size: 0.9rem !important;
  }

  .logout-button {
    font-size: 0.8rem !important;
    padding: 3px 10px !important;
  }
}

@media (max-width: 576px) {
  .brand-title {
    font-size: 1rem !important;
  }

  :deep(.el-menu-item) {
    font-size: 0.8rem !important;
    padding: 0 6px !important;
  }
}
</style>