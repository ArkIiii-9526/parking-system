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
        {{ tag.meta.title }}
        <el-icon v-if="!tag.meta.affix" class="close-icon" @click.prevent.stop="closeTag(tag)">
          <Close />
        </el-icon>
      </router-link>
    </el-scrollbar>
    <ul v-show="visible" :style="{ left: left + 'px', top: top + 'px' }" class="context-menu">
      <li @click="refreshSelectedTag">
        <el-icon><Refresh /></el-icon>
        刷新
      </li>
      <li v-if="!isAffix" @click="closeSelectedTag">
        <el-icon><Close /></el-icon>
        关闭
      </li>
      <li @click="closeOthersTags">
        <el-icon><CircleClose /></el-icon>
        关闭其他
      </li>
      <li @click="closeAllTags">
        <el-icon><Remove /></el-icon>
        关闭所有
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

watch(visible, (value) => {
  if (value) {
    document.body.addEventListener('click', () => {
      visible.value = false
    })
  }
})

onMounted(() => {
  addTags()
})
</script>

<style lang="scss" scoped>
.tags-view-container {
  height: 34px;
  width: 100%;
  background: #ffffff;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  padding: 0 10px;
}

.tags-view-wrapper {
  flex: 1;
  white-space: nowrap;
  
  .tags-view-item {
    display: inline-block;
    position: relative;
    cursor: pointer;
    height: 26px;
    line-height: 26px;
    border: 1px solid #e4e7ed;
    color: #606266;
    background: #ffffff;
    padding: 0 8px;
    font-size: 12px;
    margin-left: 5px;
    border-radius: 4px;
    
    &:first-of-type {
      margin-left: 0;
    }
    
    &.active {
      background-color: #409EFF;
      color: #ffffff;
      border-color: #409EFF;
      
      &::before {
        content: '';
        background: #ffffff;
        display: inline-block;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        position: relative;
        margin-right: 4px;
      }
    }
    
    .close-icon {
      border-radius: 50%;
      text-align: center;
      transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
      margin-left: 4px;
      
      &:hover {
        background-color: #b4bccc;
        color: #ffffff;
      }
    }
  }
}

.context-menu {
  margin: 0;
  background: #ffffff;
  z-index: 3000;
  list-style-type: none;
  padding: 5px 0;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 400;
  color: #333;
  box-shadow: 2px 2px 3px 0 rgba(0, 0, 0, 0.3);
  
  li {
    display: flex;
    align-items: center;
    padding: 7px 16px;
    cursor: pointer;
    
    &:hover {
      background: #f5f7fa;
    }
    
    .el-icon {
      margin-right: 5px;
    }
  }
}
</style>
