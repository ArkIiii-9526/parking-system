<template>
  <header class="main-header">
    <!-- 左侧：面包屑和页面信息 -->
    <div class="header-left">
      <div class="breadcrumb-wrapper">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/' }">
            <el-icon><HomeFilled /></el-icon>
            <span>首页</span>
          </el-breadcrumb-item>
          <el-breadcrumb-item v-if="route.meta?.title">
            {{ route.meta.title }}
          </el-breadcrumb-item>
        </el-breadcrumb>
      </div>
      <h2 class="page-title">{{ route.meta?.title || '智慧停车系统' }}</h2>
    </div>

    <!-- 右侧：工具栏 -->
    <div class="header-right">
      <!-- 搜索 -->
      <div class="search-box" :class="{ 'is-expanded': searchExpanded }">
        <el-icon class="search-icon" @click="toggleSearch"><Search /></el-icon>
        <el-input
          v-model="searchQuery"
          placeholder="搜索功能、车牌号..."
          class="search-input"
          @blur="searchExpanded = false"
        />
      </div>

      <!-- 通知 -->
      <el-popover
        placement="bottom-end"
        :width="360"
        trigger="click"
        popper-class="notification-popover"
      >
        <template #reference>
          <button class="header-btn notification-btn">
            <el-icon><Bell /></el-icon>
            <span v-if="unreadCount > 0" class="notification-badge">{{ unreadCount }}</span>
          </button>
        </template>
        <div class="notification-panel">
          <div class="notification-header">
            <h4>通知消息</h4>
            <button class="mark-all-read" @click="markAllRead">全部已读</button>
          </div>
          <div class="notification-list">
            <div 
              v-for="(notice, index) in notifications" 
              :key="index"
              class="notification-item"
              :class="{ 'is-unread': !notice.read }"
            >
              <div class="notice-icon" :class="notice.type">
                <el-icon>
                  <component :is="notice.icon" />
                </el-icon>
              </div>
              <div class="notice-content">
                <p class="notice-title">{{ notice.title }}</p>
                <p class="notice-time">{{ notice.time }}</p>
              </div>
            </div>
          </div>
          <div class="notification-footer">
            <button class="view-all">查看全部通知</button>
          </div>
        </div>
      </el-popover>

      <!-- 全屏 -->
      <button class="header-btn" @click="toggleFullscreen">
        <el-icon>
          <component :is="isFullscreen ? 'FullScreen' : 'FullScreen'" />
        </el-icon>
      </button>

      <!-- 主题切换 -->
      <button class="header-btn theme-btn" @click="toggleTheme">
        <el-icon>
          <component :is="isDark ? 'Sunny' : 'Moon'" />
        </el-icon>
      </button>

      <!-- 用户菜单 -->
      <el-dropdown trigger="click" @command="handleCommand">
        <div class="user-menu-trigger">
          <el-avatar :size="36" :src="userStore.avatar" class="user-avatar">
            <el-icon><User /></el-icon>
          </el-avatar>
          <div class="user-info">
            <span class="user-name">{{ userStore.userName }}</span>
            <span class="user-role">管理员</span>
          </div>
          <el-icon class="dropdown-arrow"><ArrowDown /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu class="user-dropdown">
            <el-dropdown-item command="profile">
              <el-icon><User /></el-icon>
              <span>个人中心</span>
            </el-dropdown-item>
            <el-dropdown-item command="settings">
              <el-icon><Setting /></el-icon>
              <span>系统设置</span>
            </el-dropdown-item>
            <el-dropdown-item divided command="logout">
              <el-icon><SwitchButton /></el-icon>
              <span>退出登录</span>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </header>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const searchExpanded = ref(false)
const searchQuery = ref('')
const isFullscreen = ref(false)
const isDark = ref(localStorage.getItem('parking_theme') !== 'light')
const unreadCount = ref(3)

const notifications = ref([
  { title: '车辆入场提醒', time: '5分钟前', read: false, type: 'info', icon: 'InfoFilled' },
  { title: '车位即将满位', time: '15分钟前', read: false, type: 'warning', icon: 'WarningFilled' },
  { title: '系统更新完成', time: '1小时前', read: true, type: 'success', icon: 'CircleCheckFilled' },
  { title: '新的停车记录', time: '2小时前', read: true, type: 'primary', icon: 'Document' }
])

function toggleSearch() {
  searchExpanded.value = !searchExpanded.value
  if (searchExpanded.value) {
    setTimeout(() => {
      document.querySelector('.search-input input')?.focus()
    }, 100)
  }
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
    isFullscreen.value = true
  } else {
    document.exitFullscreen()
    isFullscreen.value = false
  }
}

function toggleTheme() {
  isDark.value = !isDark.value
  localStorage.setItem('parking_theme', isDark.value ? 'dark' : 'light')
  if (isDark.value) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
  ElMessage.info(isDark.value ? '已切换到深色模式' : '已切换到浅色模式')
}

function markAllRead() {
  notifications.value.forEach(n => n.read = true)
  unreadCount.value = 0
}

function handleCommand(command) {
  switch(command) {
    case 'profile':
      router.push('/profile')
      break
    case 'settings':
      router.push('/settings')
      break
    case 'logout':
      userStore.logout()
      break
  }
}

function updateFullscreenState() {
  isFullscreen.value = !!document.fullscreenElement
}

onMounted(() => {
  document.addEventListener('fullscreenchange', updateFullscreenState)
  if (isDark.value) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
})

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', updateFullscreenState)
})
</script>

<style lang="scss" scoped>
.main-header {
  height: var(--header-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-6);
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border-subtle);
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
}

// 左侧区域
.header-left {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  
  .breadcrumb-wrapper {
    :deep(.el-breadcrumb) {
      font-size: var(--text-xs);
      
      .el-breadcrumb__item {
        color: var(--text-muted);
        
        .el-breadcrumb__inner {
          display: flex;
          align-items: center;
          gap: var(--space-1);
          color: var(--text-muted);
          transition: color 0.3s ease;
          
          &:hover {
            color: var(--text-primary);
          }
          
          .el-icon {
            font-size: 14px;
          }
        }
        
        &:last-child .el-breadcrumb__inner {
          color: var(--text-primary);
          font-weight: var(--font-medium);
        }
      }
      
      .el-breadcrumb__separator {
        color: var(--text-muted);
      }
    }
  }
  
  .page-title {
    font-family: var(--font-display);
    font-size: var(--text-xl);
    font-weight: var(--font-semibold);
    color: var(--text-primary);
    margin: 0;
  }
}

// 右侧区域
.header-right {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

// 搜索框
.search-box {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-full);
  transition: all 0.3s ease;
  width: 40px;
  overflow: hidden;
  
  &:hover, &.is-expanded {
    width: 280px;
    background: var(--glass-bg-hover);
    border-color: var(--glass-border-hover);
  }
  
  .search-icon {
    font-size: 16px;
    color: var(--text-tertiary);
    cursor: pointer;
    flex-shrink: 0;
  }
  
  .search-input {
    :deep(.el-input__wrapper) {
      background: transparent;
      box-shadow: none;
      padding: 0;
      
      .el-input__inner {
        color: var(--text-primary);
        font-size: var(--text-sm);
        
        &::placeholder {
          color: var(--text-muted);
        }
      }
    }
  }
}

// 头部按钮
.header-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-lg);
  color: var(--text-tertiary);
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
    color: var(--text-primary);
    transform: translateY(-2px);
  }
  
  .el-icon {
    font-size: 18px;
  }
}

.notification-btn {
  .notification-badge {
    position: absolute;
    top: -4px;
    right: -4px;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    background: linear-gradient(135deg, var(--accent-500), var(--accent-600));
    border-radius: var(--radius-full);
    font-size: 11px;
    font-weight: var(--font-semibold);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(244, 63, 94, 0.4);
  }
}

.theme-btn {
  &:hover {
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(245, 158, 11, 0.1));
    border-color: rgba(245, 158, 11, 0.3);
    color: var(--warning-400);
  }
}

// 用户菜单
.user-menu-trigger {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
  }
  
  .user-avatar {
    border: 2px solid rgba(255, 255, 255, 0.1);
  }
  
  .user-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    
    .user-name {
      font-size: var(--text-sm);
      font-weight: var(--font-medium);
      color: var(--text-primary);
    }
    
    .user-role {
      font-size: var(--text-xs);
      color: var(--text-muted);
    }
  }
  
  .dropdown-arrow {
    font-size: 12px;
    color: var(--text-muted);
    transition: transform 0.3s ease;
  }
  
  &:hover .dropdown-arrow {
    transform: rotate(180deg);
  }
}

// 用户下拉菜单
:deep(.user-dropdown) {
  background: var(--bg-secondary);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-lg);
  padding: var(--space-2);
  
  .el-dropdown-menu__item {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    border-radius: var(--radius-md);
    color: var(--text-secondary);
    transition: all 0.3s ease;
    
    &:hover {
      background: rgba(255, 255, 255, 0.08);
      color: var(--text-primary);
    }
    
    .el-icon {
      font-size: 16px;
    }
  }
  
  .el-dropdown-menu__item--divided {
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    margin: var(--space-2) 0;
    
    &:before {
      display: none;
    }
  }
}

// 通知面板
:deep(.notification-popover) {
  background: var(--bg-secondary);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-xl);
  padding: 0;
  box-shadow: var(--shadow-xl);
}

.notification-panel {
  .notification-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-4) var(--space-5);
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    
    h4 {
      font-size: var(--text-base);
      font-weight: var(--font-semibold);
      color: var(--text-primary);
      margin: 0;
    }
    
    .mark-all-read {
      font-size: var(--text-sm);
      color: var(--primary-400);
      background: none;
      border: none;
      cursor: pointer;
      transition: color 0.3s ease;
      
      &:hover {
        color: var(--primary-300);
      }
    }
  }
  
  .notification-list {
    max-height: 320px;
    overflow-y: auto;
    
    .notification-item {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-4) var(--space-5);
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      transition: background 0.3s ease;
      cursor: pointer;
      
      &:hover {
        background: rgba(255, 255, 255, 0.03);
      }
      
      &.is-unread {
        background: rgba(99, 102, 241, 0.05);
        
        .notice-title {
          font-weight: var(--font-medium);
          color: var(--text-primary);
        }
      }
      
      .notice-icon {
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--radius-md);
        flex-shrink: 0;
        
        &.info {
          background: rgba(99, 102, 241, 0.15);
          color: var(--primary-400);
        }
        
        &.warning {
          background: rgba(245, 158, 11, 0.15);
          color: var(--warning-400);
        }
        
        &.success {
          background: rgba(16, 185, 129, 0.15);
          color: var(--secondary-400);
        }
        
        &.primary {
          background: rgba(99, 102, 241, 0.15);
          color: var(--primary-400);
        }
        
        .el-icon {
          font-size: 18px;
        }
      }
      
      .notice-content {
        flex: 1;
        
        .notice-title {
          font-size: var(--text-sm);
          color: var(--text-secondary);
          margin-bottom: var(--space-1);
        }
        
        .notice-time {
          font-size: var(--text-xs);
          color: var(--text-muted);
        }
      }
    }
  }
  
  .notification-footer {
    padding: var(--space-3) var(--space-5);
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    text-align: center;
    
    .view-all {
      font-size: var(--text-sm);
      color: var(--primary-400);
      background: none;
      border: none;
      cursor: pointer;
      transition: color 0.3s ease;
      
      &:hover {
        color: var(--primary-300);
      }
    }
  }
}

// 响应式
@media (max-width: 768px) {
  .main-header {
    padding: 0 var(--space-4);
  }
  
  .header-left {
    .page-title {
      font-size: var(--text-lg);
    }
  }
  
  .user-info {
    display: none;
  }
  
  .search-box {
    display: none;
  }
}
</style>
