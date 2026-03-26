<template>
  <div class="main-layout" :class="{ 'sidebar-collapsed': isCollapse }">
    <!-- 侧边栏 -->
    <MainSidebar @collapse="handleCollapse" />
    
    <!-- 主内容区域 -->
    <div class="main-container">
      <!-- 顶部导航 -->
      <MainHeader />
      
      <!-- 标签页 -->
      <TagsView v-if="showTagsView" />
      
      <!-- 页面内容 -->
      <main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade-transform" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import MainSidebar from './components/MainSidebar.vue'
import MainHeader from './components/MainHeader.vue'
import TagsView from './components/TagsView.vue'

const isCollapse = ref(false)

const showTagsView = computed(() => {
  return true
})

function handleCollapse(collapsed) {
  isCollapse.value = collapsed
}
</script>

<style lang="scss" scoped>
.main-layout {
  min-height: 100vh;
  display: flex;
  background: var(--bg-primary);
  position: relative;
  overflow-x: hidden;
  
  &::before {
    content: '';
    position: fixed;
    inset: 0;
    background: 
      radial-gradient(ellipse at 20% 0%, rgba(99, 102, 241, 0.08) 0%, transparent 50%),
      radial-gradient(ellipse at 80% 100%, rgba(16, 185, 129, 0.06) 0%, transparent 50%),
      radial-gradient(ellipse at 50% 50%, rgba(244, 63, 94, 0.04) 0%, transparent 70%);
    pointer-events: none;
    z-index: 0;
  }
  
  &.sidebar-collapsed {
    .main-container {
      margin-left: var(--sidebar-collapsed);
    }
  }
}

.main-container {
  flex: 1;
  margin-left: var(--sidebar-width);
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  z-index: 1;
  min-width: 0;
}

.main-content {
  flex: 1;
  padding: var(--space-6);
  overflow-y: auto;
  overflow-x: hidden;
  min-width: 0;
  box-sizing: border-box;
  
  // 自定义滚动条
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: var(--radius-full);
    
    &:hover {
      background: rgba(255, 255, 255, 0.2);
    }
  }
}

// 页面过渡动画
.fade-transform-enter-active,
.fade-transform-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(-10px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(10px);
}

// 响应式
@media (max-width: 768px) {
  .main-layout {
    .main-container {
      margin-left: 0;
    }
    
    &.sidebar-collapsed .main-container {
      margin-left: 0;
    }
  }
  
  .main-content {
    padding: var(--space-4);
  }
}
</style>
