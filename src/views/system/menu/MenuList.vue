<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElTree, ElButton, ElDialog, ElForm, ElFormItem, ElInput, ElSelect, ElOption, ElMessage, ElTag, ElIcon } from 'element-plus'
import { Setting, User, Menu as MenuIcon, Avatar } from '@element-plus/icons-vue'
import { usePermission } from '@/util/permission'
import axios from 'axios'

const { hasPermission } = usePermission()

// 菜单数据
const menus = ref([])

// 对话框状态
const dialogVisible = ref(false)

// 表单数据
const formData = reactive({
  id: '',
  label: '',
  path: '',
  component: '',
  icon: '',
  parentId: 0
})

// 表单验证规则
const rules = {
  label: [
    { required: true, message: '请输入菜单名称', trigger: 'blur' }
  ],
  path: [
    { required: true, message: '请输入菜单路径', trigger: 'blur' }
  ],
  component: [
    { required: true, message: '请输入组件名称', trigger: 'blur' }
  ],
  icon: [
    { required: true, message: '请选择图标', trigger: 'blur' }
  ]
}

// 选中的节点
const selectedNode = ref(null)

// 图标列表
const icons = [
  'Setting', 'User', 'Menu', 'Avatar', 'Monitor', 'Document', 'Location', 'Timer', 'Money', 'Star'
]

// 加载菜单数据
const loadMenus = async () => {
  try {
    const response = await axios.get('/sys/permission/tree')
    menus.value = response.data
  } catch (error) {
    ElMessage.error('获取菜单列表失败')
    console.error('获取菜单列表失败:', error)
  }
}

// 节点点击事件
const handleNodeClick = (data, node) => {
  selectedNode.value = data
}

// 添加菜单
const addMenu = () => {
  Object.keys(formData).forEach(key => {
    formData[key] = ''
  })
  formData.parentId = selectedNode.value ? selectedNode.value.id : 0
  dialogVisible.value = true
}

// 编辑菜单
const editMenu = () => {
  if (!selectedNode.value) {
    ElMessage.warning('请先选择一个菜单')
    return
  }
  Object.assign(formData, selectedNode.value)
  formData.parentId = selectedNode.value.parentId || 0
  dialogVisible.value = true
}

// 删除菜单
const deleteMenu = async () => {
  if (!selectedNode.value) {
    ElMessage.warning('请先选择一个菜单')
    return
  }
  
  try {
    await axios.delete(`/sys/permission/${selectedNode.value.id}`)
    selectedNode.value = null
    ElMessage.success('删除成功')
    await loadMenus()
  } catch (error) {
    ElMessage.error('删除失败')
    console.error('删除菜单失败:', error)
  }
}

// 保存菜单
const saveMenu = async () => {
  try {
    if (formData.id) {
      // 编辑
      await axios.put('/sys/permission', formData)
    } else {
      // 添加
      await axios.post('/sys/permission', formData)
    }
    dialogVisible.value = false
    ElMessage.success('操作成功')
    await loadMenus()
  } catch (error) {
    ElMessage.error('操作失败')
    console.error('保存菜单失败:', error)
  }
}

// 初始加载菜单数据
onMounted(() => {
  loadMenus()
})
</script>

<template>
  <div class="menu-management">
    <div class="page-header">
      <h2>菜单管理</h2>
      <div class="header-actions">
        <ElButton 
          type="success" 
          @click="addMenu" 
          v-if="hasPermission('menu:add')"
        >
          添加菜单
        </ElButton>
      </div>
    </div>
    
    <div class="menu-tree">
      <ElTree
        :data="menus"
        node-key="id"
        default-expand-all
        :props="{
          children: 'children',
          label: 'label'
        }"
        @node-click="handleNodeClick"
      >
        <template #default="{ node, data }">
          <span class="custom-tree-node">
            <span>
              <ElTag size="small" style="margin-right: 8px;">
                <ElIcon :size="16">
                  <Setting v-if="data.icon === 'Setting'" />
                  <User v-else-if="data.icon === 'User'" />
                  <MenuIcon v-else-if="data.icon === 'Menu'" />
                  <Avatar v-else-if="data.icon === 'Avatar'" />
                </ElIcon>
              </ElTag>
              <span>{{ data.label }}</span>
              <ElTag size="small" type="info" style="margin-left: 8px;">
                {{ data.path }}
              </ElTag>
            </span>
            <span>
              <ElButton 
                type="primary" 
                size="small" 
                style="margin-right: 8px;"
                @click="editMenu"
                v-if="hasPermission('menu:edit')"
              >
                编辑
              </ElButton>
              <ElButton 
                type="danger" 
                size="small"
                @click="deleteMenu"
                v-if="hasPermission('menu:delete')"
              >
                删除
              </ElButton>
            </span>
          </span>
        </template>
      </ElTree>
    </div>
    
    <!-- 添加/编辑菜单对话框 -->
    <ElDialog
      v-model="dialogVisible"
      :title="formData.id ? '编辑菜单' : '添加菜单'"
      width="500px"
    >
      <ElForm :model="formData" :rules="rules" ref="formRef" label-width="80px">
        <ElFormItem label="菜单名称" prop="label">
          <ElInput v-model="formData.label" />
        </ElFormItem>
        <ElFormItem label="菜单路径" prop="path">
          <ElInput v-model="formData.path" />
        </ElFormItem>
        <ElFormItem label="组件名称" prop="component">
          <ElInput v-model="formData.component" />
        </ElFormItem>
        <ElFormItem label="图标" prop="icon">
          <ElSelect v-model="formData.icon" placeholder="请选择图标">
            <ElOption
              v-for="icon in icons"
              :key="icon"
              :label="icon"
              :value="icon"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="父菜单">
          <ElSelect v-model="formData.parentId" placeholder="请选择父菜单">
            <ElOption label="顶级菜单" value="0" />
            <ElOption
              v-for="menu in menus"
              :key="menu.id"
              :label="menu.label"
              :value="menu.id"
            />
          </ElSelect>
        </ElFormItem>
      </ElForm>
      <template #footer>
        <span class="dialog-footer">
          <ElButton @click="dialogVisible = false">取消</ElButton>
          <ElButton type="primary" @click="saveMenu">保存</ElButton>
        </span>
      </template>
    </ElDialog>
  </div>
</template>

<style scoped>
.menu-management {
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #333;
  font-size: 18px;
  font-weight: bold;
}

.menu-tree {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 20px;
  background-color: #f9f9f9;
}

.custom-tree-node {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .custom-tree-node {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}
</style>