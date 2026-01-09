<template>
  <div class="role-container">
    <el-card class="filter-card">
      <el-form :model="filterForm" :inline="true" class="filter-form">
        <el-form-item label="角色名称">
          <el-input v-model="filterForm.name" placeholder="请输入角色名称" clearable />
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
          <span>角色列表</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增角色
          </el-button>
        </div>
      </template>
      
      <el-table :data="tableData" v-loading="loading" stripe style="width: 100%">
        <el-table-column prop="name" label="角色名称" width="150" />
        <el-table-column prop="code" label="角色编码" width="150" />
        <el-table-column prop="description" label="描述" min-width="200" />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '正常' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handlePermission(row)">
              权限
            </el-button>
            <el-button link type="primary" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button link type="danger" @click="handleDelete(row)">
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
      :title="dialogType === 'add' ? '新增角色' : '编辑角色'"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="80px">
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="角色编码" prop="code">
          <el-input v-model="formData.code" placeholder="请输入角色编码，如: admin" :disabled="dialogType === 'edit'" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="formData.description" type="textarea" :rows="3" placeholder="请输入描述" />
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
      v-model="permissionDialogVisible"
      title="分配权限"
      width="500px"
      :close-on-click-modal="false"
    >
      <div class="permission-tree">
        <el-tree
          ref="permissionTree"
          :data="permissionTree"
          :props="{ label: 'name', children: 'children' }"
          show-checkbox
          node-key="id"
          :default-checked-keys="checkedPermissions"
          @check="handleTreeCheck"
        />
      </div>
      <template #footer>
        <el-button @click="permissionDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handlePermissionSubmit" :loading="permissionLoading">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getRoleList, createRole, updateRole, deleteRole, getRolePermissionTree, bindRolePermission } from '@/api/role'
import { getPermissionTree } from '@/api/permission'

const loading = ref(false)
const submitLoading = ref(false)
const permissionLoading = ref(false)
const dialogVisible = ref(false)
const permissionDialogVisible = ref(false)
const dialogType = ref('add')
const formRef = ref(null)
const permissionTree = ref(null)
const permissionTreeRef = ref(null)

const tableData = ref([])
const checkedPermissions = ref([])
const currentRole = ref({})

const pagination = reactive({
  pageNo: 1,
  pageSize: 10,
  total: 0
})

const filterForm = reactive({
  name: ''
})

const formData = reactive({
  id: null,
  name: '',
  code: '',
  description: '',
  status: 1
})

const formRules = {
  name: [
    { required: true, message: '请输入角色名称', trigger: 'blur' },
    { min: 2, max: 50, message: '名称长度在2-50个字符之间', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入角色编码', trigger: 'blur' },
    { pattern: /^[a-zA-Z]+$/, message: '角色编码只能包含英文字母', trigger: 'blur' }
  ]
}

function formatTime(time) {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}

async function loadData() {
  loading.value = true
  try {
    const res = await getRoleList({
      pageNo: pagination.pageNo,
      pageSize: pagination.pageSize,
      name: filterForm.name
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

async function loadPermissionTree() {
  try {
    const res = await getPermissionTree()
    if (res.code === 200) {
      permissionTree.value = res.data || []
    }
  } catch (error) {
    console.error('加载权限树失败:', error)
  }
}

function handleSearch() {
  pagination.pageNo = 1
  loadData()
}

function handleReset() {
  filterForm.name = ''
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
    } else if (key === 'description') {
      formData[key] = ''
    } else {
      formData[key] = null
    }
  })
  dialogVisible.value = true
}

function handleEdit(row) {
  dialogType.value = 'edit'
  Object.assign(formData, row)
  dialogVisible.value = true
}

async function handlePermission(row) {
  currentRole.value = row
  try {
    const res = await getRolePermissionTree(row.id)
    if (res.code === 200) {
      checkedPermissions.value = res.data || []
    }
  } catch (_) {
    ElMessage.error('获取权限失败')
  }
  permissionDialogVisible.value = true
}

function handleTreeCheck() {
  const checkedNodes = permissionTreeRef.value.getCheckedNodes()
  checkedPermissions.value = checkedNodes.map(n => n.id)
}

async function handlePermissionSubmit() {
  permissionLoading.value = true
  try {
    const checkedKeys = permissionTreeRef.value.getCheckedKeys()
    const halfCheckedKeys = permissionTreeRef.value.getHalfCheckedKeys()
    const permissionIds = [...checkedKeys, ...halfCheckedKeys]
    
    const res = await bindRolePermission({
      roleId: currentRole.value.id,
      permissionIds
    })
    if (res.code === 200) {
      ElMessage.success('权限分配成功')
      permissionDialogVisible.value = false
    } else {
      ElMessage.error(res.msg || '权限分配失败')
    }
  } catch (_) {
    ElMessage.error('权限分配失败')
  } finally {
    permissionLoading.value = false
  }
}

function handleDelete(row) {
  ElMessageBox.confirm('确定要删除该角色吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const res = await deleteRole(row.id)
      if (res.code === 200) {
        ElMessage.success('删除成功')
        loadData()
      } else {
        ElMessage.error(res.msg || '删除失败')
      }
    } catch (_) {
      ElMessage.error('删除失败')
    }
  })
}

async function handleSubmit() {
  try {
    await formRef.value.validate()
    submitLoading.value = true
    
    if (dialogType.value === 'add') {
      const res = await createRole(formData)
      if (res.code === 200) {
        ElMessage.success('新增成功')
        dialogVisible.value = false
        loadData()
      } else {
        ElMessage.error(res.msg || '新增失败')
      }
    } else {
      const res = await updateRole(formData)
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
  loadPermissionTree()
})
</script>

<style lang="scss" scoped>
.role-container {
  .filter-card {
    margin-bottom: 20px;
  }
  
  .table-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }
  
  .pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }
  
  .permission-tree {
    max-height: 400px;
    overflow-y: auto;
  }
}
</style>
