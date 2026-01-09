<template>
  <div class="main-layout">
    <MainSidebar />
    <div class="main-container" :class="{ 'is-collapse': isCollapse }">
      <MainHeader />
      <TagsView />
      <main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade-transform" mode="out-in">
            <keep-alive :include="cachedViews">
              <component :is="Component" />
            </keep-alive>
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import MainSidebar from './components/MainSidebar.vue'
import MainHeader from './components/MainHeader.vue'
import TagsView from './components/TagsView.vue'

const route = useRoute()

const isCollapse = ref(false)
const visitedViews = ref([])

// 缓存视图，仅缓存设置了meta.keepAlive的页面
const cachedViews = computed(() => {
  return visitedViews.value
    .filter(view => view.meta?.keepAlive)
    .map(view => view.name)
})

// 监听路由变化，更新访问过的视图
watch(
  () => route,
  (newRoute) => {
    // 确保路由有名称且不是隐藏路由
    if (newRoute.name && !newRoute.meta?.hidden) {
      // 检查视图是否已存在
      const viewExists = visitedViews.value.some(view => view.path === newRoute.path)
      if (!viewExists) {
        visitedViews.value.push({
          name: newRoute.name,
          path: newRoute.path,
          meta: { ...newRoute.meta }
        })
      }
    }
  },
  { immediate: true }
)

onMounted(() => {
})
</script>

<style lang="scss" scoped>
.main-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: margin-left 0.3s;
  padding: 0;
  
  &.is-collapse {
    margin-left: 64px;
  }
}

.main-content {
  flex: 1;
  overflow: hidden;
  overflow-y: auto;
  padding: 20px;
  background-color: #f5f7fa;
  box-sizing: border-box;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  transition: max-width 0.3s ease;
  
  @media (max-width: 1440px) {
    max-width: 100%;
  }
}
</style>
