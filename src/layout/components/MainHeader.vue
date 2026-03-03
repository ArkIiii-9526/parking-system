<template>
  <header class="header">
    <div class="header-left">
      <el-button 
        type="text" 
        class="menu-toggle-btn" 
        @click="toggleCollapse"
        :title="isCollapse ? '展开菜单' : '收起菜单'"
      >
        <el-icon>
          <component :is="isCollapse ? 'Expand' : 'Fold'" />
        </el-icon>
      </el-button>
      <div class="breadcrumb-container">
        <el-breadcrumb separator="">
          <transition-group name="breadcrumb">
            <el-breadcrumb-item v-for="(item, index) in breadcrumbs" :key="item.path">
              <span v-if="item.redirect === 'noRedirect' || index === breadcrumbs.length - 1" class="no-redirect">
                {{ item.meta.title }}
              </span>
              <a v-else @click.prevent="handleLink(item)" class="breadcrumb-link">{{ item.meta.title }}</a>
              <span v-if="index < breadcrumbs.length - 1" class="breadcrumb-separator">
                <el-icon><Right /></el-icon>
              </span>
            </el-breadcrumb-item>
          </transition-group>
        </el-breadcrumb>
      </div>
    </div>
    <div class="header-right">
      <div class="header-actions">
        <el-tooltip content="全屏" placement="bottom">
          <el-button 
            type="text" 
            class="header-action-btn"
            @click="toggleFullscreen"
          >
            <el-icon><FullScreen /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="通知" placement="bottom">
          <el-button 
            type="text" 
            class="header-action-btn"
          >
            <el-icon><Bell /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="设置" placement="bottom">
          <el-button 
            type="text" 
            class="header-action-btn"
          >
            <el-icon><Setting /></el-icon>
          </el-button>
        </el-tooltip>
      </div>
      <div class="user-profile">
        <el-dropdown trigger="click" @command="handleCommand">
          <div class="user-info">
            <el-avatar :size="36" :src="userStore.avatar" class="user-avatar">
              <el-icon><User /></el-icon>
            </el-avatar>
            <div v-if="!isMobile" class="user-details">
              <span class="username">{{ userStore.userName }}</span>
              <span class="user-role">管理员</span>
            </div>
            <el-icon class="dropdown-icon"><ArrowDown /></el-icon>
          </div>
          <template #dropdown>
            <el-dropdown-menu class="user-dropdown">
              <el-dropdown-item command="profile" class="dropdown-item">
                <el-icon class="dropdown-item-icon"><User /></el-icon>
                <span>个人中心</span>
              </el-dropdown-item>
              <el-dropdown-item command="settings" class="dropdown-item">
                <el-icon class="dropdown-item-icon"><Setting /></el-icon>
                <span>账号设置</span>
              </el-dropdown-item>
              <el-dropdown-item divided command="logout" class="dropdown-item">
                <el-icon class="dropdown-item-icon"><SwitchButton /></el-icon>
                <span>退出登录</span>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import screenfull from 'screenfull'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const props = defineProps({
  isCollapse: {
    type: Boolean,
    default: false
  }
})

const isMobile = ref(false)

const breadcrumbs = computed(() => {
  const matched = route.matched.filter(item => item.meta && item.meta.title)
  return matched.filter(item => item.meta.title && item.meta.breadcrumb !== false)
})

function toggleCollapse() {
  emit('collapse', !props.isCollapse)
}

function toggleFullscreen() {
  if (screenfull.isEnabled) {
    screenfull.toggle()
  }
}

function handleLink(item) {
  const { redirect, path } = item
  if (redirect) {
    router.push(redirect)
  } else {
    router.push(path)
  }
}

function handleCommand(command) {
  switch (command) {
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

function checkMobile() {
  isMobile.value = window.innerWidth < 768
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})

const emit = defineEmits(['collapse'])
</script>

<style lang="scss" scoped>
.header {
  height: var(--header-height);
  background: var(--surface);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--spacing-lg);
  box-sizing: border-box;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex: 1;
  
  .menu-toggle-btn {
    width: 40px;
    height: 40px;
    border-radius: var(--border-radius-base);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    color: var(--text-regular);
    
    &:hover {
      background-color: var(--surface-light);
      color: var(--primary-color);
    }
  }
}

.breadcrumb-container {
  flex: 1;
  overflow: hidden;
  
  .breadcrumb-link {
    color: var(--primary-color);
    transition: color 0.2s ease;
    
    &:hover {
      color: var(--primary-light);
      text-decoration: underline;
    }
  }
  
  .no-redirect {
    color: var(--text-secondary);
    cursor: text;
  }
  
  .breadcrumb-separator {
    margin: 0 var(--spacing-sm);
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  
  .header-action-btn {
    width: 40px;
    height: 40px;
    border-radius: var(--border-radius-base);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    color: var(--text-regular);
    
    &:hover {
      background-color: var(--surface-light);
      color: var(--primary-color);
    }
  }
}

.user-profile {
  .user-info {
    display: flex;
    align-items: center;
    cursor: pointer;
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: var(--border-radius-base);
    transition: all 0.2s ease;
    
    &:hover {
      background-color: var(--surface-light);
    }
    
    .user-avatar {
      border: 2px solid var(--border-color-light);
      transition: all 0.2s ease;
      
      &:hover {
        border-color: var(--primary-color);
      }
    }
    
    .user-details {
      margin: 0 var(--spacing-sm);
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    
    .username {
      font-size: var(--font-size-base);
      font-weight: 500;
      color: var(--text-primary);
      white-space: nowrap;
    }
    
    .user-role {
      font-size: var(--font-size-xs);
      color: var(--text-secondary);
      white-space: nowrap;
    }
    
    .dropdown-icon {
      font-size: 14px;
      color: var(--text-secondary);
      transition: all 0.2s ease;
    }
  }
  
  .user-dropdown {
    border-radius: var(--border-radius-base);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    border: 1px solid var(--border-color);
    padding: var(--spacing-xs) 0;
    
    .dropdown-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-sm) var(--spacing-md);
      transition: all 0.2s ease;
      
      &:hover {
        background-color: var(--surface-light);
      }
      
      .dropdown-item-icon {
        font-size: 16px;
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .header {
    padding: 0 var(--spacing-md);
  }
  
  .user-details {
    display: none !important;
  }
  
  .breadcrumb-container {
    display: none;
  }
}

@media (max-width: 480px) {
  .header {
    padding: 0 var(--spacing-sm);
  }
  
  .header-actions {
    gap: 0;
    
    .header-action-btn {
      width: 36px;
      height: 36px;
    }
  }
  
  .user-profile {
    .user-info {
      padding: var(--spacing-xs);
      
      .user-avatar {
        width: 32px;
        height: 32px;
      }
    }
  }
}
</style>
