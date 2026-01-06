<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElTable, ElTableColumn, ElButton, ElInput, ElDialog, ElForm, ElTree, ElMessage, ElPagination, ElPopconfirm, ElTag } from 'element-plus'
import { usePermission } from '@/util/permission'
import axios from 'axios'

const { hasPermission } = usePermission()

// 角色数据
const roles = ref([])

// 权限数据
const permissions = ref([])

// 搜索条件
const searchForm = reactive({
  name: ''
})

// 分页数据
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 对话框状态
const dialogVisible = ref(false)
const assignPermissionDialogVisible = ref(false)

// 表单数据
const formData = reactive({
  id: '',
  name: '',
  description: ''
})

// 分配权限表单
const assignPermissionForm = reactive({
  roleId: '',
  permissions: []
})

// 表单验证规则
const rules = {
  name: [
    { required: true, message: '请输入角色名称', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入角色描述', trigger: 'blur' }
  ]
}

// 加载角色列表
const loadRoles = async () => {
  try {
    const response = await axios.get('/sys/role/list')
    roles.value = response.data
    pagination.total = roles.value.length
  } catch (error) {
    ElMessage.error('获取角色列表失败')
    console.error('获取角色列表失败:', error)
  }
}

// 加载权限树形结构
const loadPermissions = async () => {
  try {
    const response = await axios.get('/sys/permission/tree')
    permissions.value = response.data
  } catch (error) {
    ElMessage.error('获取权限列表失败')
    console.error('获取权限列表失败:', error)
  }
}

// 编辑角色
const editRole = (role) => {
  Object.assign(formData, role)
  dialogVisible.value = true
}

// 添加角色
const addRole = () => {
  Object.keys(formData).forEach(key => {
    formData[key] = ''
  })
  dialogVisible.value = true
}

// 保存角色
const saveRole = async () => {
  try {
    if (formData.id) {
      // 编辑
      await axios.put('/sys/role', formData)
    } else {
      // 添加
      await axios.post('/sys/role', formData)
    }
    dialogVisible.value = false
    ElMessage.success('操作成功')
    await loadRoles()
  } catch (error) {
    ElMessage.error('操作失败')
    console.error('保存角色失败:', error)
  }
}

// 删除角色
const deleteRole = async (id) => {
  try {
    await axios.delete(`/sys/role/${id}`)
    ElMessage.success('删除成功')
    await loadRoles()
  } catch (error) {
    ElMessage.error('删除失败')
    console.error('删除角色失败:', error)
  }
}

// 打开分配权限对话框
const openAssignPermissionDialog = async (role) => {
  assignPermissionForm.roleId = role.id
  try {
    // 获取角色现有权限
    const response = await axios.get(`/sys/role/${role.id}/permissions`)
    assignPermissionForm.permissions = response.data
    assignPermissionDialogVisible.value = true
  } catch (error) {
    ElMessage.error('获取角色权限失败')
    console.error('获取角色权限失败:', error)
  }
}

// 分配权限
const assignPermission = async () => {
  try {
    await axios.post('/sys/role/assignPermissions', {
      roleId: assignPermissionForm.roleId,
      permissionIds: assignPermissionForm.permissions
    })
    ElMessage.success('权限分配成功')
    assignPermissionDialogVisible.value = false
  } catch (error) {
    ElMessage.error('权限分配失败')
    console.error('分配权限失败:', error)
  }
}

// 搜索角色
const searchRoles = () => {
  pagination.currentPage = 1
}

// 分页变化
const handleSizeChange = (size) => {
  pagination.pageSize = size
}

const handleCurrentChange = (current) => {
  pagination.currentPage = current
}

// 计算当前页显示的角色
const currentRoles = computed(() => {
  let filteredRoles = roles.value
  if (searchForm.name) {
    filteredRoles = filteredRoles.filter(role => role.name.includes(searchForm.name))
  }
  pagination.total = filteredRoles.length
  const start = (pagination.currentPage - 1) * pagination.pageSize
  const end = start + pagination.pageSize
  return filteredRoles.slice(start, end)
})

// 组件挂载时加载数据
onMounted(async () => {
  await loadRoles()
  await loadPermissions()
})
</script>

<template>
  <div class="role-management">
    <div class="page-header">
      <h2>角色管理</h2>
      <div class="header-actions">
        <ElInput 
          v-model="searchForm.name" 
          placeholder="按角色名称搜索" 
          class="search-input" 
          clearable
        />
        <ElButton type="primary" @click="searchRoles">搜索</ElButton>
        <ElButton 
          type="success" 
          @click="addRole" 
          v-if="hasPermission('role:add')"
        >
          添加角色
        </ElButton>
      </div>
    </div>
    
    <ElTable :data="currentRoles" style="width: 100%" border>
      <ElTableColumn prop="id" label="ID" width="80" />
      <ElTableColumn prop="name" label="角色名称" />
      <ElTableColumn prop="description" label="角色描述" />
      <ElTableColumn prop="createdTime" label="创建时间" width="180" />
      <ElTableColumn label="操作" width="250" fixed="right">
        <template #default="scope">
          <ElButton 
            type="primary" 
            size="small" 
            @click="editRole(scope.row)" 
            v-if="hasPermission('role:edit')"
          >
            编辑
          </ElButton>
          <ElButton 
            type="warning" 
            size="small" 
            @click="openAssignPermissionDialog(scope.row)" 
            v-if="hasPermission('role:assignPermission')"
          >
            分配权限
          </ElButton>
          <ElPopconfirm
            title="确定要删除吗？"
            @confirm="deleteRole(scope.row.id)"
          >
            <template #reference>
              <ElButton 
                type="danger" 
                size="small" 
                v-if="hasPermission('role:delete')"
              >
                删除
              </ElButton>
            </template>
          </ElPopconfirm>
        </template>
      </ElTableColumn>
    </ElTable>
    
    <div class="pagination-container">
      <ElPagination
        v-model:current-page="pagination.currentPage"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="pagination.total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
    
    <!-- 添加/编辑角色对话框 -->
    <ElDialog
      v-model="dialogVisible"
      :title="formData.id ? '编辑角色' : '添加角色'"
      width="500px"
    >
      <ElForm :model="formData" :rules="rules" ref="formRef" label-width="80px">
        <ElFormItem label="角色名称" prop="name">
          <ElInput v-model="formData.name" />
        </ElFormItem>
        <ElFormItem label="角色描述" prop="description">
          <ElInput v-model="formData.description" type="textarea" rows="3" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <span class="dialog-footer">
          <ElButton @click="dialogVisible = false">取消</ElButton>
          <ElButton type="primary" @click="saveRole">保存</ElButton>
        </span>
      </template>
    </ElDialog>
    
    <!-- 分配权限对话框 -->
    <ElDialog
      v-model="assignPermissionDialogVisible"
      title="分配权限"
      width="600px"
    >
      <ElForm :model="assignPermissionForm" ref="assignPermissionFormRef" label-width="80px">
        <ElFormItem label="权限列表">
          <ElTree
            :data="permissions"
            show-checkbox
            node-key="id"
            default-expand-all
            :props="{
              children: 'children',
              label: 'label'
            }"
            v-model="assignPermissionForm.permissions"
          />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <span class="dialog-footer">
          <ElButton @click="assignPermissionDialogVisible = false">取消</ElButton>
          <ElButton type="primary" @click="assignPermission">确定</ElButton>
        </span>
      </template>
    </ElDialog>
  </div>
</template>

<style scoped>
.role-management {
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

.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.search-input {
  width: 200px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .header-actions {
    width: 100%;
    flex-wrap: wrap;
  }
  
  .search-input {
    flex: 1;
    min-width: 150px;
  }
  
  .pagination-container {
    justify-content: center;
  }
}
</style>