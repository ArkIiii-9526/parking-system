<template>
  <div class="sidebar-container" :class="{ 'is-collapse': isCollapse }">
    <div class="logo-container">
      <img class="logo" src="@/assets/logo.svg" alt="logo" />
      <span v-if="!isCollapse" class="title">智慧停车</span>
    </div>
    <el-scrollbar>
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :unique-opened="true"
        background-color="var(--surface)"
        text-color="var(--text-regular)"
        active-text-color="var(--white)"
        :collapse-transition="true"
        router
      >
        <template v-for="route in menuRoutes" :key="route.path">
          <template v-if="!route.hidden">
            <el-menu-item
              v-if="!route.children || route.children.length === 1"
              :index="route.path.startsWith('/') ? route.path : `/${route.path}`"
              class="menu-item"
            >
              <el-icon v-if="route.meta.icon" class="menu-icon">
                <component :is="route.meta.icon" />
              </el-icon>
              <template #title>{{ route.meta.title }}</template>
            </el-menu-item>
            <el-sub-menu
              v-else
              :index="route.path.startsWith('/') ? route.path : `/${route.path}`"
              class="menu-sub"
            >
              <template #title>
                <el-icon v-if="route.meta.icon" class="menu-icon">
                  <component :is="route.meta.icon" />
                </el-icon>
                <span>{{ route.meta.title }}</span>
              </template>
              <template v-for="child in route.children" :key="child.path">
                <el-menu-item
                  v-if="!child.hidden"
                  :index="resolvePath(route.path, child.path)"
                  class="menu-item child"
                >
                  <el-icon v-if="child.meta.icon" class="menu-icon">
                    <component :is="child.meta.icon" />
                  </el-icon>
                  <template #title>{{ child.meta.title }}</template>
                </el-menu-item>
              </template>
            </el-sub-menu>
          </template>
        </template>
      </el-menu>
    </el-scrollbar>
    <div class="sidebar-footer">
      <el-button 
        type="text" 
        class="collapse-btn" 
        @click="toggleCollapse"
        :title="isCollapse ? '展开菜单' : '收起菜单'"
      >
        <el-icon>
          <component :is="isCollapse ? 'Expand' : 'Fold'" />
        </el-icon>
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { filterAsyncRoutes } from '@/router'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const isCollapse = ref(false)
const menuRoutes = ref([])

// 获取本地路由配置中的主路由children
const localRoutes = router.getRoutes().find(route => route.path === '/')?.children || []

const activeMenu = computed(() => {
  const { meta, path } = route
  if (meta.activeMenu) {
    return meta.activeMenu
  }
  return path
})

function resolvePath(basePath, path) {
  if (path.startsWith('/')) {
    return path
  }
  // 确保basePath是绝对路径
  const absoluteBasePath = basePath.startsWith('/') ? basePath : `/${basePath}`
  // 生成子菜单的绝对路径
  return `${absoluteBasePath}/${path}`
}

function updateMenus() {
  if (userStore.menus && userStore.menus.length > 0) {
    // 使用本地路由和后端菜单数据进行匹配过滤
    const accessedRoutes = filterAsyncRoutes(localRoutes, userStore.menus)
    menuRoutes.value = accessedRoutes
  } else {
    // 如果没有后端菜单数据，直接使用本地路由作为菜单
    menuRoutes.value = localRoutes
  }
  // 调试日志
  console.log('=== 菜单路由 ===')
  menuRoutes.value.forEach(route => {
    console.log(`Path: ${route.path}, Name: ${route.name}`)
    if (route.children) {
      route.children.forEach(child => {
        console.log(`  Child: ${child.path}, Name: ${child.name}`)
      })
    }
  })
}

function toggleCollapse() {
  isCollapse.value = !isCollapse.value
  emit('collapse', isCollapse.value)
}

onMounted(async () => {
  updateMenus()
})

// 监听菜单数据变化，实时更新菜单
watch(
  () => userStore.menus,
  () => {
    updateMenus()
  },
  { deep: true }
)

const emit = defineEmits(['collapse'])
</script>

<style lang="scss" scoped>
.sidebar-container {
  width: var(--sidebar-width);
  height: 100vh;
  background: var(--surface);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.05);
  position: relative;
  
  &.is-collapse {
    width: var(--sidebar-collapse-width);
  }
  
  :deep(.el-menu) {
    border-right: none;
    background-color: transparent;
    flex: 1;
    
    .el-menu-item,
    .el-sub-menu__title {
      height: 48px;
      line-height: 48px;
      margin: var(--spacing-xs) var(--spacing-sm);
      border-radius: var(--border-radius-base);
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      
      &:hover {
        background-color: var(--surface-light);
        color: var(--primary-color);
      }
      
      &.is-active {
        background-color: var(--primary-color);
        color: var(--white);
        box-shadow: 0 4px 6px -1px rgba(54, 100, 139, 0.3);
        
        &:hover {
          background-color: var(--primary-light);
        }
      }
    }
    
    .el-sub-menu {
      .el-sub-menu__title {
        
        &:hover {
          background-color: var(--surface-light);
        }
      }
      
      .el-menu-item {
        padding-left: var(--spacing-xl) !important;
        
        &.is-active {
          background-color: var(--primary-light);
        }
      }
    }
  }
}

.logo-container {
  height: var(--header-height);
  display: flex;
  align-items: center;
  padding: 0 var(--spacing-md);
  border-bottom: 1px solid var(--border-color);
  background-color: var(--surface);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  
  .logo {
    width: 36px;
    height: 36px;
    transition: all 0.3s ease;
  }
  
  .title {
    margin-left: var(--spacing-sm);
    font-size: var(--font-size-xl);
    font-weight: 700;
    color: var(--primary-color);
    white-space: nowrap;
    transition: all 0.3s ease;
  }
}

.menu-item {
  position: relative;
  
  .menu-icon {
    font-size: 18px;
    margin-right: var(--spacing-sm);
    transition: all 0.3s ease;
  }
  
  &.child {
    .menu-icon {
      font-size: 16px;
      margin-right: var(--spacing-xs);
    }
  }
}

.sidebar-footer {
  padding: var(--spacing-md);
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: center;
  background-color: var(--surface);
  
  .collapse-btn {
    width: 36px;
    height: 36px;
    border-radius: var(--border-radius-base);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    
    &:hover {
      background-color: var(--surface-light);
      color: var(--primary-color);
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .sidebar-container {
    position: fixed;
    left: 0;
    top: 0;
    z-index: 1000;
    height: 100vh;
    box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
    
    &.is-collapse {
      transform: translateX(-100%);
    }
  }
}
</style>
