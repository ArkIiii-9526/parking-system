<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElTable, ElTableColumn, ElButton, ElInput, ElDialog, ElForm, ElFormItem, ElSelect, ElOption, ElMessage, ElPagination, ElPopconfirm, ElTag } from 'element-plus'
import { usePermission } from '@/util/permission'
import axios from '@/util/axios'

const { hasPermission } = usePermission()

// 用户数据
const users = ref([])

// 角色数据
const roles = ref([])

// 搜索条件
const searchForm = reactive({
  username: '',
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
const assignRoleDialogVisible = ref(false)

// 表单数据
const formData = reactive({
  id: '',
  username: '',
  name: '',
  email: '',
  phone: '',
  password: '',
  status: 1,
  roleId: ''
})

// 分配角色表单
const assignRoleForm = reactive({
  userId: '',
  roleId: ''
})

// 表单引用
const formRef = ref(null)
const assignRoleFormRef = ref(null)

// 表单验证规则
const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度应在3-20个字符之间', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少为6个字符', trigger: 'blur' }
  ],
  roleId: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ]
}

// 加载用户列表
const loadUsers = async () => {
  try {
    const response = await axios.get('/sys/user/list')
    users.value = response.data
    pagination.total = users.value.length
  } catch (error) {
    console.error('加载用户列表失败:', error)
    ElMessage.error('加载用户列表失败')
  }
}

// 加载角色列表
const loadRoles = async () => {
  try {
    const response = await axios.get('/sys/role/list')
    roles.value = response.data
  } catch (error) {
    console.error('加载角色列表失败:', error)
    ElMessage.error('加载角色列表失败')
  }
}

// 编辑用户
const editUser = (user) => {
  Object.assign(formData, user)
  dialogVisible.value = true
}

// 添加用户
const addUser = () => {
  Object.keys(formData).forEach(key => {
    formData[key] = ''
  })
  formData.status = 1
  dialogVisible.value = true
}

// 保存用户
const saveUser = async () => {
  try {
    if (formData.id) {
      // 编辑
      await axios.put('/sys/user', formData)
    } else {
      // 添加
      await axios.post('/sys/user', formData)
    }
    dialogVisible.value = false
    ElMessage.success('操作成功')
    await loadUsers()
  } catch (error) {
    console.error('保存用户失败:', error)
    ElMessage.error('保存用户失败')
  }
}

// 删除用户
const deleteUser = async (id) => {
  try {
    await axios.delete(`/sys/user/${id}`)
    ElMessage.success('删除成功')
    await loadUsers()
  } catch (error) {
    console.error('删除用户失败:', error)
    ElMessage.error('删除用户失败')
  }
}

// 打开分配角色对话框
const openAssignRoleDialog = async (user) => {
  assignRoleForm.userId = user.id
  try {
    // 获取用户现有角色
    const response = await axios.get(`/sys/user/${user.id}/roles`)
    assignRoleForm.roleId = response.data[0] || ''
    assignRoleDialogVisible.value = true
  } catch (error) {
    console.error('获取用户角色失败:', error)
    ElMessage.error('获取用户角色失败')
  }
}

// 分配角色
const assignRole = async () => {
  try {
    await axios.post('/sys/user/assignRoles', {
      userId: assignRoleForm.userId,
      roleIds: [assignRoleForm.roleId]
    })
    assignRoleDialogVisible.value = false
    ElMessage.success('角色分配成功')
    await loadUsers()
  } catch (error) {
    console.error('分配角色失败:', error)
    ElMessage.error('分配角色失败')
  }
}

// 搜索用户
const searchUsers = () => {
  pagination.currentPage = 1
}

// 分页变化
const handleSizeChange = (size) => {
  pagination.pageSize = size
}

const handleCurrentChange = (current) => {
  pagination.currentPage = current
}

// 计算当前页显示的用户
const currentUsers = computed(() => {
  let filteredUsers = users.value
  if (searchForm.username) {
    filteredUsers = filteredUsers.filter(user => user.username.includes(searchForm.username))
  }
  if (searchForm.name) {
    filteredUsers = filteredUsers.filter(user => user.name.includes(searchForm.name))
  }
  pagination.total = filteredUsers.length
  const start = (pagination.currentPage - 1) * pagination.pageSize
  const end = start + pagination.pageSize
  return filteredUsers.slice(start, end)
})

// 初始加载数据
onMounted(async () => {
  await loadUsers()
  await loadRoles()
})
</script>

<template>
  <div class="user-management">
    <div class="page-header">
      <h2>用户管理</h2>
      <div class="header-actions">
        <ElInput 
          v-model="searchForm.username" 
          placeholder="按用户名搜索" 
          class="search-input" 
          clearable
        />
        <ElInput 
          v-model="searchForm.name" 
          placeholder="按姓名搜索" 
          class="search-input" 
          clearable
        />
        <ElButton type="primary" @click="searchUsers">搜索</ElButton>
        <ElButton 
          type="success" 
          @click="addUser" 
          v-if="hasPermission('user:add')"
        >
          添加用户
        </ElButton>
      </div>
    </div>
    
    <ElTable :data="currentUsers" style="width: 100%" border>
      <ElTableColumn prop="id" label="ID" width="80" />
      <ElTableColumn prop="username" label="用户名" />
      <ElTableColumn prop="name" label="姓名" />
      <ElTableColumn prop="email" label="邮箱" />
      <ElTableColumn prop="phone" label="手机号" />
      <ElTableColumn prop="status" label="状态" width="100">
        <template #default="scope">
          <ElTag :type="scope.row.status === 1 ? 'success' : 'danger'">
            {{ scope.row.status === 1 ? '启用' : '禁用' }}
          </ElTag>
        </template>
      </ElTableColumn>
      <ElTableColumn prop="role" label="角色" />
      <ElTableColumn prop="createdTime" label="创建时间" width="180" />
      <ElTableColumn label="操作" width="250" fixed="right">
        <template #default="scope">
          <ElButton 
            type="primary" 
            size="small" 
            @click="editUser(scope.row)" 
            v-if="hasPermission('user:edit')"
          >
            编辑
          </ElButton>
          <ElButton 
            type="warning" 
            size="small" 
            @click="openAssignRoleDialog(scope.row)" 
            v-if="hasPermission('user:assignRole')"
          >
            分配角色
          </ElButton>
          <ElPopconfirm
            title="确定要删除吗？"
            @confirm="deleteUser(scope.row.id)"
          >
            <template #reference>
              <ElButton 
                type="danger" 
                size="small" 
                v-if="hasPermission('user:delete')"
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
    
    <!-- 添加/编辑用户对话框 -->
    <ElDialog
      v-model="dialogVisible"
      :title="formData.id ? '编辑用户' : '添加用户'"
      width="500px"
    >
      <ElForm :model="formData" :rules="rules" ref="formRef" label-width="80px">
        <ElFormItem label="用户名" prop="username">
          <ElInput v-model="formData.username" />
        </ElFormItem>
        <ElFormItem label="姓名" prop="name">
          <ElInput v-model="formData.name" />
        </ElFormItem>
        <ElFormItem label="邮箱" prop="email">
          <ElInput v-model="formData.email" />
        </ElFormItem>
        <ElFormItem label="手机号" prop="phone">
          <ElInput v-model="formData.phone" />
        </ElFormItem>
        <ElFormItem label="密码" prop="password">
          <ElInput v-model="formData.password" type="password" />
        </ElFormItem>
        <ElFormItem label="角色" prop="roleId">
          <ElSelect v-model="formData.roleId" placeholder="请选择角色">
            <ElOption
              v-for="role in roles"
              :key="role.id"
              :label="role.name"
              :value="role.id"
            ></ElOption>
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="状态">
          <ElSelect v-model="formData.status" placeholder="请选择状态">
            <ElOption label="启用" value="1"></ElOption>
            <ElOption label="禁用" value="0"></ElOption>
          </ElSelect>
        </ElFormItem>
      </ElForm>
      <template #footer>
        <span class="dialog-footer">
          <ElButton @click="dialogVisible = false">取消</ElButton>
          <ElButton type="primary" @click="saveUser">保存</ElButton>
        </span>
      </template>
    </ElDialog>
    
    <!-- 分配角色对话框 -->
    <ElDialog
      v-model="assignRoleDialogVisible"
      title="分配角色"
      width="400px"
    >
      <ElForm :model="assignRoleForm" ref="assignRoleFormRef" label-width="80px">
        <ElFormItem label="角色" prop="roleId">
          <ElSelect v-model="assignRoleForm.roleId" placeholder="请选择角色">
            <ElOption
              v-for="role in roles"
              :key="role.id"
              :label="role.name"
              :value="role.id"
            ></ElOption>
          </ElSelect>
        </ElFormItem>
      </ElForm>
      <template #footer>
        <span class="dialog-footer">
          <ElButton @click="assignRoleDialogVisible = false">取消</ElButton>
          <ElButton type="primary" @click="assignRole">确定</ElButton>
        </span>
      </template>
    </ElDialog>
  </div>
</template>

<style scoped>
.user-management {
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