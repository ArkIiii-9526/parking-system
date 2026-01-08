<template>
  <div class="user-container">
    <el-card class="filter-card">
      <el-form :model="filterForm" :inline="true" class="filter-form">
        <el-form-item label="用户名">
          <el-input v-model="filterForm.username" placeholder="请输入用户名" clearable />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="filterForm.phone" placeholder="请输入手机号" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filterForm.status" placeholder="请选择状态" clearable>
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>用户列表</span>
          <el-button v-permission="'user:add'" type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增用户
          </el-button>
        </div>
      </template>
      
      <el-table :data="tableData" v-loading="loading" stripe style="width: 100%">
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="nickname" label="昵称" width="120" />
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column prop="email" label="邮箱" width="180" />
        <el-table-column prop="roleNames" label="角色" min-width="150">
          <template #default="{ row }">
            <el-tag v-for="role in (row.roleNames || [])" :key="role" size="small" class="role-tag">
              {{ role }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-switch
              :model-value="row.status"
              :active-value="1"
              :inactive-value="0"
              @change="handleStatusChange(row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" align="center" fixed="right">
          <template #default="{ row }">
            <el-button v-permission="'user:edit'" link type="primary" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button v-permission="'user:assignRole'" link type="warning" @click="handleAssignRole(row)">
              分配角色
            </el-button>
            <el-button v-permission="'user:delete'" link type="danger" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.pageNo"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
    
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '新增用户' : '编辑用户'"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="formData.username" placeholder="请输入用户名" :disabled="dialogType === 'edit'" />
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="formData.nickname" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="formData.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="formData.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="dialogType === 'add'">
          <el-input v-model="formData.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-switch v-model="formData.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">确定</el-button>
      </template>
    </el-dialog>
    
    <el-dialog
      v-model="roleDialogVisible"
      title="分配角色"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form label-width="80px">
        <el-form-item label="用户">
          <span>{{ currentUser.username }}</span>
        </el-form-item>
        <el-form-item label="角色">
          <el-checkbox-group v-model="selectedRoles">
            <el-checkbox v-for="role in allRoles" :key="role.id" :label="role.id">
              {{ role.name }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="roleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleRoleSubmit" :loading="roleLoading">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getPageList, createUser, updateUser, deleteUser, updateUserStatus, assignUserRole, getUserRoles } from '@/api/user'
import { getRoleList } from '@/api/role'

const loading = ref(false)
const submitLoading = ref(false)
const roleLoading = ref(false)
const dialogVisible = ref(false)
const roleDialogVisible = ref(false)
const dialogType = ref('add')
const formRef = ref(null)

const tableData = ref([])
const allRoles = ref([])
const selectedRoles = ref([])
const currentUser = ref({})

const pagination = reactive({
  pageNo: 1,
  pageSize: 10,
  total: 0
})

const filterForm = reactive({
  username: '',
  phone: '',
  status: null
})

const formData = reactive({
  id: null,
  username: '',
  nickname: '',
  phone: '',
  email: '',
  password: '',
  status: 1
})

const formRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度在2-20个字符之间', trigger: 'blur' }
  ],
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在6-20个字符之间', trigger: 'blur' }
  ]
}

function formatTime(time) {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}

async function loadData() {
  loading.value = true
  try {
    const res = await getPageList({
      pageNo: pagination.pageNo,
      pageSize: pagination.pageSize,
      username: filterForm.username,
      phone: filterForm.phone,
      status: filterForm.status
    })
    if (res.code === 200) {
      tableData.value = res.data.records || []
      pagination.total = res.data.total || 0
    }
  } catch (error) {
    console.error('加载数据失败:', error)
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

async function loadRoles() {
  try {
    const res = await getRoleList()
    if (res.code === 200) {
      allRoles.value = res.data || []
    }
  } catch (error) {
    console.error('加载角色列表失败:', error)
  }
}

function handleSearch() {
  pagination.pageNo = 1
  loadData()
}

function handleReset() {
  filterForm.username = ''
  filterForm.phone = ''
  filterForm.status = null
  handleSearch()
}

function handleSizeChange(size) {
  pagination.pageSize = size
  loadData()
}

function handleCurrentChange(page) {
  pagination.pageNo = page
  loadData()
}

function handleAdd() {
  dialogType.value = 'add'
  Object.keys(formData).forEach(key => {
    if (key === 'status') {
      formData[key] = 1
    } else if (key === 'password') {
      formData[key] = ''
    } else {
      formData[key] = ''
    }
  })
  dialogVisible.value = true
}

function handleEdit(row) {
  dialogType.value = 'edit'
  Object.assign(formData, row)
  dialogVisible.value = true
}

async function handleAssignRole(row) {
  currentUser.value = row
  try {
    const res = await getUserRoles(row.id)
    if (res.code === 200) {
      selectedRoles.value = res.data || []
    }
  } catch (error) {
    ElMessage.error('获取用户角色失败')
  }
  roleDialogVisible.value = true
}

async function handleRoleSubmit() {
  roleLoading.value = true
  try {
    const res = await assignUserRole({
      userId: currentUser.value.id,
      roleIds: selectedRoles.value
    })
    if (res.code === 200) {
      ElMessage.success('分配成功')
      roleDialogVisible.value = false
      loadData()
    } else {
      ElMessage.error(res.msg || '分配失败')
    }
  } catch (error) {
    ElMessage.error('分配失败')
  } finally {
    roleLoading.value = false
  }
}

async function handleStatusChange(row) {
  try {
    const res = await updateUserStatus({
      userId: row.id,
      status: row.status === 1 ? 0 : 1
    })
    if (res.code === 200) {
      ElMessage.success('状态更新成功')
    } else {
      row.status = row.status === 1 ? 0 : 1
      ElMessage.error(res.msg || '状态更新失败')
    }
  } catch (error) {
    row.status = row.status === 1 ? 0 : 1
    ElMessage.error('状态更新失败')
  }
}

function handleDelete(row) {
  ElMessageBox.confirm('确定要删除该用户吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const res = await deleteUser(row.id)
      if (res.code === 200) {
        ElMessage.success('删除成功')
        loadData()
      } else {
        ElMessage.error(res.msg || '删除失败')
      }
    } catch (error) {
      ElMessage.error('删除失败')
    }
  })
}

async function handleSubmit() {
  try {
    await formRef.value.validate()
    submitLoading.value = true
    
    if (dialogType.value === 'add') {
      const res = await createUser(formData)
      if (res.code === 200) {
        ElMessage.success('新增成功')
        dialogVisible.value = false
        loadData()
      } else {
        ElMessage.error(res.msg || '新增失败')
      }
    } else {
      const res = await updateUser(formData)
      if (res.code === 200) {
        ElMessage.success('更新成功')
        dialogVisible.value = false
        loadData()
      } else {
        ElMessage.error(res.msg || '更新失败')
      }
    }
  } catch (error) {
    console.error('提交失败:', error)
  } finally {
    submitLoading.value = false
  }
}

onMounted(() => {
  loadData()
  loadRoles()
})
</script>

<style lang="scss" scoped>
.user-container {
  .filter-card {
    margin-bottom: 20px;
  }
  
  .table-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .role-tag {
      margin-right: 4px;
      margin-bottom: 2px;
    }
  }
  
  .pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }
}
</style>
