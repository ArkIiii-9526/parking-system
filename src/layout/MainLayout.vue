<template>
  <div class="main-layout">
    <Sidebar />
    <div class="main-container" :class="{ 'is-collapse': isCollapse }">
      <Header />
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
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import Sidebar from './components/Sidebar.vue'
import Header from './components/Header.vue'
import TagsView from './components/TagsView.vue'

const route = useRoute()
const userStore = useUserStore()

const isCollapse = ref(false)
const cachedViews = ref([])

const visitedViews = computed(() => userStore.menus)

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
  margin-left: 220px;
  
  &.is-collapse {
    margin-left: 64px;
  }
}

.main-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background-color: #f5f7fa;
}
</style>
