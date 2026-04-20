<template>
  <div class="tags-view-container">
    <el-scrollbar class="tags-view-wrapper">
      <router-link
        v-for="tag in visitedViews"
        :key="tag.path"
        :to="{ path: tag.path, query: tag.query }"
        :class="['tags-view-item', { active: isActive(tag) }]"
        @click.middle="closeTag(tag)"
        @contextmenu.prevent="openMenu(tag, $event)"
      >
        <el-icon v-if="tag.meta.icon" class="tag-icon">
          <component :is="getTagIcon(tag.meta.icon)" />
        </el-icon>
        {{ tag.meta.title }}
        <el-icon v-if="!tag.meta.affix" class="close-icon" @click.prevent.stop="closeTag(tag)">
          <Close />
        </el-icon>
      </router-link>
    </el-scrollbar>
    <ul v-show="visible" :style="{ left: left + 'px', top: top + 'px' }" class="context-menu">
      <li @click="refreshSelectedTag" class="menu-item">
        <el-icon class="menu-icon"><Refresh /></el-icon>
        <span>刷新</span>
      </li>
      <li v-if="!isAffix" @click="closeSelectedTag" class="menu-item">
        <el-icon class="menu-icon"><Close /></el-icon>
        <span>关闭</span>
      </li>
      <li @click="closeOthersTags" class="menu-item">
        <el-icon class="menu-icon"><CircleClose /></el-icon>
        <span>关闭其他</span>
      </li>
      <li @click="closeAllTags" class="menu-item">
        <el-icon class="menu-icon"><Remove /></el-icon>
        <span>关闭所有</span>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { resolveElementIcon } from '@/utils/elementIcon'

const route = useRoute()
const router = useRouter()

const visitedViews = ref([])
const visible = ref(false)
const left = ref(0)
const top = ref(0)
const selectedTag = ref({})

const isAffix = computed(() => {
  return selectedTag.value.meta && selectedTag.value.meta.affix
})

function getTagIcon(iconName) {
  return resolveElementIcon(iconName, 'Menu')
}

function isActive(tag) {
  return tag.path === route.path
}

function addTags() {
  if (route.name) {
    const exists = visitedViews.value.find(item => item.path === route.path)
    if (!exists) {
      visitedViews.value.push({
        name: route.name,
        path: route.path,
        meta: route.meta,
        fullPath: route.fullPath
      })
    }
  }
}

function closeTag(view) {
  const index = visitedViews.value.findIndex(item => item.path === view.path)
  if (index > -1) {
    visitedViews.value.splice(index, 1)
    if (view.path === route.path) {
      const lastView = visitedViews.value[index - 1] || visitedViews.value[0]
      if (lastView) {
        router.push(lastView.fullPath)
      } else {
        router.push('/')
      }
    }
  }
}

function openMenu(tag, e) {
  left.value = e.clientX
  top.value = e.clientY
  visible.value = true
  selectedTag.value = tag
  // 阻止事件冒泡，避免菜单立即关闭
  e.stopPropagation()
  // 添加点击事件监听器，点击其他地方关闭菜单
  setTimeout(() => {
    document.body.addEventListener('click', handleBodyClick)
  }, 0)
}

function handleBodyClick() {
  visible.value = false
  document.body.removeEventListener('click', handleBodyClick)
}

function closeSelectedTag() {
  closeTag(selectedTag.value)
  visible.value = false
}

function refreshSelectedTag() {
  const { fullPath } = selectedTag.value
  router.replace({
    path: '/redirect' + fullPath
  })
  visible.value = false
}

function closeOthersTags() {
  router.push(selectedTag.value.path)
  visitedViews.value = visitedViews.value.filter(item => 
    item.path === selectedTag.value.path || item.meta.affix
  )
  visible.value = false
}

function closeAllTags() {
  visitedViews.value = visitedViews.value.filter(item => item.meta.affix)
  if (visitedViews.value.length === 0) {
    router.push('/')
  } else {
    router.push(visitedViews.value[0].path)
  }
  visible.value = false
}

watch(() => route.path, () => {
  addTags()
})

onMounted(() => {
  addTags()
})
</script>

<style lang="scss" scoped>
.tags-view-container {
  height: 44px;
  width: 100%;
  background: var(--tags-view-bg);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  padding: 0 var(--space-4);
  transition: all 0.3s ease;
  z-index: 10;
}

.tags-view-wrapper {
  flex: 1;
  white-space: nowrap;
  display: flex;
  align-items: center;
  
  :deep(.el-scrollbar__view) {
    display: flex;
    align-items: center;
    height: 44px;
  }
  
  .tags-view-item {
    display: inline-flex;
    align-items: center;
    position: relative;
    cursor: pointer;
    height: 28px;
    line-height: 28px;
    background: var(--tags-view-item-bg);
    border: 1px solid var(--tags-view-item-border);
    color: var(--tags-view-item-text);
    padding: 0 var(--space-3);
    font-size: var(--text-sm);
    margin-right: var(--space-2);
    border-radius: var(--radius-full);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    
    &:hover {
      background: var(--tags-view-item-bg-hover);
      border-color: var(--tags-view-item-border-hover);
      color: var(--tags-view-item-text-hover);
      transform: translateY(-1px);
    }
    
    &.active {
      background: var(--tags-view-item-active-bg);
      border-color: var(--tags-view-item-active-border);
      color: var(--tags-view-item-active-text);
      font-weight: var(--font-medium);
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
      
      &:hover {
        background: var(--tags-view-item-active-bg-hover);
        border-color: var(--tags-view-item-active-border-hover);
      }

      &::before {
        content: '';
        display: inline-block;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background-color: currentColor;
        margin-right: 6px;
        box-shadow: var(--tags-view-item-active-dot-shadow);
      }
    }
    
    .tag-icon {
      font-size: 14px;
      margin-right: 6px;
      opacity: 0.9;
    }
    
    .close-icon {
      font-size: 12px;
      border-radius: 50%;
      text-align: center;
      transition: all 0.2s ease;
      margin-left: 6px;
      width: 16px;
      height: 16px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: inherit;
      opacity: 0.6;
      
      &:hover {
        background-color: rgba(244, 63, 94, 0.8);
        color: #fff;
        opacity: 1;
      }
    }
  }
}

.context-menu {
  margin: 0;
  background: var(--bg-elevated);
  z-index: var(--z-dropdown);
  list-style-type: none;
  padding: var(--space-2) 0;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  color: var(--text-secondary);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--glass-border);
  position: absolute;
  backdrop-filter: blur(10px);
  
  .menu-item {
    display: flex;
    align-items: center;
    padding: var(--space-2) var(--space-4);
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover {
      background: var(--glass-bg-hover);
      color: var(--primary-400);
    }
    
    .menu-icon {
      margin-right: var(--space-2);
      font-size: 14px;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .tags-view-container {
    height: 36px;
    padding: 0 var(--space-2);
  }
  
  .tags-view-wrapper {
    :deep(.el-scrollbar__view) {
      height: 36px;
    }

    .tags-view-item {
      font-size: var(--text-xs);
      height: 24px;
      line-height: 24px;
      padding: 0 var(--space-2);
      
      .tag-icon {
        font-size: 12px;
      }
      
      .close-icon {
        font-size: 10px;
        width: 14px;
        height: 14px;
      }
    }
  }
}
</style>
