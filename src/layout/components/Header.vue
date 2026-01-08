<template>
  <header class="header">
    <div class="header-left">
      <el-icon class="collapse-btn" @click="toggleCollapse">
        <component :is="isCollapse ? 'Expand' : 'Fold'" />
      </el-icon>
      <el-breadcrumb separator="/">
        <transition-group name="breadcrumb">
          <el-breadcrumb-item v-for="(item, index) in breadcrumbs" :key="item.path">
            <span v-if="item.redirect === 'noRedirect' || index === breadcrumbs.length - 1" class="no-redirect">
              {{ item.meta.title }}
            </span>
            <a v-else @click.prevent="handleLink(item)">{{ item.meta.title }}</a>
          </el-breadcrumb-item>
        </transition-group>
      </el-breadcrumb>
    </div>
    <div class="header-right">
      <el-tooltip content="全屏" placement="bottom">
        <el-icon class="header-icon" @click="toggleFullscreen">
          <FullScreen />
        </el-icon>
      </el-tooltip>
      <el-dropdown trigger="click" @command="handleCommand">
        <div class="user-info">
          <el-avatar :size="32" :src="userStore.avatar">
            <el-icon><User /></el-icon>
          </el-avatar>
          <span class="username">{{ userStore.userName }}</span>
          <el-icon><ArrowDown /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile">
              <el-icon><User /></el-icon>
              个人中心
            </el-dropdown-item>
            <el-dropdown-item divided command="logout">
              <el-icon><SwitchButton /></el-icon>
              退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </header>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import screenfull from 'screenfull'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const isCollapse = ref(false)

const breadcrumbs = computed(() => {
  const matched = route.matched.filter(item => item.meta && item.meta.title)
  return matched.filter(item => item.meta.title && item.meta.breadcrumb !== false)
})

function toggleCollapse() {
  isCollapse.value = !isCollapse.value
  emit('collapse', isCollapse.value)
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
    case 'logout':
      userStore.logout()
      break
  }
}

const emit = defineEmits(['collapse'])
</script>

<style lang="scss" scoped>
.header {
  height: 64px;
  background: #ffffff;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.header-left {
  display: flex;
  align-items: center;
  
  .collapse-btn {
    font-size: 20px;
    cursor: pointer;
    margin-right: 16px;
    color: #606266;
    
    &:hover {
      color: #409EFF;
    }
  }
}

.header-right {
  display: flex;
  align-items: center;
  
  .header-icon {
    font-size: 18px;
    cursor: pointer;
    padding: 0 12px;
    color: #606266;
    
    &:hover {
      color: #409EFF;
    }
  }
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 0 8px;
  
  .username {
    margin: 0 8px;
    font-size: 14px;
    color: #303133;
  }
}

.no-redirect {
  color: #909399;
  cursor: text;
}
</style>
