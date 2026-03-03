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
          <component :is="tag.meta.icon" />
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
  height: var(--tags-view-height);
  width: 100%;
  background: var(--surface);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  padding: 0 var(--spacing-md);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.tags-view-wrapper {
  flex: 1;
  white-space: nowrap;
  display: flex;
  align-items: center;
  
  .el-scrollbar__view {
    display: flex;
    align-items: center;
  }
  
  .tags-view-item {
    display: inline-flex;
    align-items: center;
    position: relative;
    cursor: pointer;
    height: 32px;
    line-height: 32px;
    border: 1px solid var(--border-color);
    color: var(--text-regular);
    background: var(--surface);
    padding: 0 var(--spacing-sm);
    font-size: var(--font-size-sm);
    margin-left: var(--spacing-xs);
    border-radius: var(--border-radius-base);
    transition: all 0.2s ease;
    
    &:first-of-type {
      margin-left: 0;
    }
    
    &:hover {
      border-color: var(--primary-light);
      background-color: var(--surface-light);
    }
    
    &.active {
      background-color: var(--primary-color);
      color: var(--white);
      border-color: var(--primary-color);
      box-shadow: 0 2px 4px rgba(54, 100, 139, 0.3);
      
      &:hover {
        background-color: var(--primary-light);
        border-color: var(--primary-light);
      }
    }
    
    .tag-icon {
      font-size: 14px;
      margin-right: var(--spacing-xs);
      opacity: 0.8;
    }
    
    .close-icon {
      font-size: 14px;
      border-radius: 50%;
      text-align: center;
      transition: all 0.2s ease;
      margin-left: var(--spacing-xs);
      padding: 2px;
      
      &:hover {
        background-color: rgba(255, 255, 255, 0.2);
        color: var(--white);
      }
    }
  }
}

.context-menu {
  margin: 0;
  background: var(--surface);
  z-index: 3000;
  list-style-type: none;
  padding: var(--spacing-xs) 0;
  border-radius: var(--border-radius-base);
  font-size: var(--font-size-sm);
  font-weight: 400;
  color: var(--text-primary);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  border: 1px solid var(--border-color);
  
  .menu-item {
    display: flex;
    align-items: center;
    padding: var(--spacing-sm) var(--spacing-md);
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover {
      background: var(--surface-light);
      color: var(--primary-color);
    }
    
    .menu-icon {
      margin-right: var(--spacing-sm);
      font-size: 14px;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .tags-view-container {
    padding: 0 var(--spacing-sm);
  }
  
  .tags-view-wrapper {
    .tags-view-item {
      font-size: var(--font-size-xs);
      height: 28px;
      line-height: 28px;
      padding: 0 var(--spacing-xs);
      
      .tag-icon {
        font-size: 12px;
      }
      
      .close-icon {
        font-size: 12px;
      }
    }
  }
}
</style>
