<template>
  <div class="sidebar-container">
    <div class="logo-container">
      <img class="logo" src="@/assets/logo.svg" alt="logo" />
      <span v-if="!isCollapse" class="title">智慧停车</span>
    </div>
    <el-scrollbar>
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :unique-opened="true"
        background-color="#ffffff"
        text-color="#303133"
        active-text-color="#409EFF"
        :collapse-transition="false"
        router
      >
        <template v-for="route in menuRoutes" :key="route.path">
          <template v-if="!route.hidden">
            <el-menu-item
              v-if="!route.children || route.children.length === 1"
              :index="route.path"
            >
              <el-icon v-if="route.meta.icon">
                <component :is="route.meta.icon" />
              </el-icon>
              <template #title>{{ route.meta.title }}</template>
            </el-menu-item>
            <el-sub-menu
              v-else
              :index="route.path"
            >
              <template #title>
                <el-icon v-if="route.meta.icon">
                  <component :is="route.meta.icon" />
                </el-icon>
                <span>{{ route.meta.title }}</span>
              </template>
              <template v-for="child in route.children" :key="child.path">
                <el-menu-item
                  v-if="!child.hidden"
                  :index="resolvePath(route.path, child.path)"
                >
                  <el-icon v-if="child.meta.icon">
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { filterAsyncRoutes } from '@/router'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const isCollapse = ref(false)
const menuRoutes = ref([])

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
  return basePath === '/' ? `/${path}` : `${basePath}/${path}`
}

onMounted(async () => {
  if (userStore.menus && userStore.menus.length > 0) {
    const accessedRoutes = filterAsyncRoutes(userStore.menus)
    accessedRoutes.forEach(item => {
      if (item.path === '/') {
        item.children = item.children || []
      }
    })
    menuRoutes.value = accessedRoutes
    router.addRoute(accessedRoutes[0])
  }
})
</script>

<style lang="scss" scoped>
.sidebar-container {
  width: 220px;
  height: 100vh;
  background: #ffffff;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  transition: width 0.3s;
  
  :deep(.el-menu) {
    border-right: none;
    
    .el-menu-item,
    .el-sub-menu__title {
      &:hover {
        background-color: #f5f7fa;
      }
      
      &.is-active {
        background-color: #ecf5ff;
      }
    }
  }
}

.logo-container {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  border-bottom: 1px solid #e4e7ed;
  
  .logo {
    width: 32px;
    height: 32px;
  }
  
  .title {
    margin-left: 8px;
    font-size: 18px;
    font-weight: 600;
    color: #409EFF;
    white-space: nowrap;
  }
}
</style>
