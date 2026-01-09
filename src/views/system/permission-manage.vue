<template>
  <div class="permission-container">
    <el-card class="filter-card">
      <el-form :model="filterForm" :inline="true" class="filter-form">
        <el-form-item label="权限名称">
          <el-input v-model="filterForm.name" placeholder="请输入权限名称" clearable />
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
          <span>权限列表</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增权限
          </el-button>
          <el-button type="success" @click="handleRefreshCache">
            <el-icon><Refresh /></el-icon>
            刷新缓存
          </el-button>
        </div>
      </template>
      
      <el-table :data="tableData" v-loading="loading" stripe style="width: 100%">
        <el-table-column prop="name" label="权限名称" width="150" />
        <el-table-column prop="code" label="权限编码" width="150" />
        <el-table-column prop="type" label="类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getTypeTag(row.type)">
              {{ getTypeText(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="path" label="路由路径" width="180" />
        <el-table-column prop="icon" label="图标" width="100" align="center">
          <template #default="{ row }">
            <el-icon v-if="row.icon"><component :is="row.icon" /></el-icon>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="80" align="center" />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '正常' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="{ row }">
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
      :title="dialogType === 'add' ? '新增权限' : '编辑权限'"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item label="上级权限">
          <el-tree-select
            v-model="formData.parentId"
            :data="treeData"
            :props="{ label: 'name', value: 'id' }"
            placeholder="请选择上级权限（不选则为顶级）"
            clearable
            check-strictly
          />
        </el-form-item>
        <el-form-item label="权限类型" prop="type">
          <el-select v-model="formData.type" placeholder="请选择权限类型">
            <el-option label="目录" :value="0" />
            <el-option label="菜单" :value="1" />
            <el-option label="按钮" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="权限名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入权限名称" />
        </el-form-item>
        <el-form-item label="权限编码" prop="code">
          <el-input v-model="formData.code" placeholder="请输入权限编码，如: system:user:list" />
        </el-form-item>
        <el-form-item label="路由路径" prop="path">
          <el-input v-model="formData.path" placeholder="请输入路由路径" />
        </el-form-item>
        <el-form-item label="图标" prop="icon">
          <el-input v-model="formData.icon" placeholder="请输入图标名称（Element Plus图标名）" />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="formData.sort" :min="0" :step="1" />
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getPermissionList, createPermission, updatePermission, deletePermission, refreshPermissionCache } from '@/api/permission'

const loading = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)
const dialogType = ref('add')
const formRef = ref(null)

const tableData = ref([])
const treeData = ref([])

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
  parentId: null,
  type: 1,
  name: '',
  code: '',
  path: '',
  icon: '',
  sort: 0,
  status: 1
})

const formRules = {
  type: [{ required: true, message: '请选择权限类型', trigger: 'change' }],
  name: [
    { required: true, message: '请输入权限名称', trigger: 'blur' },
    { min: 2, max: 50, message: '名称长度在2-50个字符之间', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入权限编码', trigger: 'blur' }
  ]
}

function getTypeTag(type) {
  const tags = { 0: 'success', 1: 'primary', 2: 'warning' }
  return tags[type] || 'info'
}

function getTypeText(type) {
  const texts = { 0: '目录', 1: '菜单', 2: '按钮' }
  return texts[type] || '未知'
}

async function loadData() {
  loading.value = true
  try {
    const res = await getPermissionList({
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

async function loadTreeData() {
  try {
    const res = await getPermissionList({ pageNo: 1, pageSize: 999 })
    if (res.code === 200) {
      treeData.value = convertToTree(res.data.records || [])
    }
  } catch (error) {
    console.error('加载树数据失败:', error)
  }
}

function convertToTree(data, parentId = null) {
  return data
    .filter(item => item.parentId === parentId)
    .map(item => ({
      id: item.id,
      name: item.name,
      children: convertToTree(data, item.id)
    }))
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
    if (key === 'type') {
      formData[key] = 1
    } else if (key === 'sort') {
      formData[key] = 0
    } else if (key === 'status') {
      formData[key] = 1
    } else {
      formData[key] = key === 'path' ? '' : null
    }
  })
  dialogVisible.value = true
}

function handleEdit(row) {
  dialogType.value = 'edit'
  Object.assign(formData, row)
  dialogVisible.value = true
}

function handleDelete(row) {
  ElMessageBox.confirm('确定要删除该权限吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const res = await deletePermission(row.id)
      if (res.code === 200) {
        ElMessage.success('删除成功')
        loadData()
        loadTreeData()
      } else {
        ElMessage.error(res.msg || '删除失败')
      }
    } catch (_) {
      ElMessage.error('删除失败')
    }
  })
}

async function handleRefreshCache() {
  try {
    const res = await refreshPermissionCache()
    if (res.code === 200) {
      ElMessage.success('缓存已刷新')
    } else {
      ElMessage.error(res.msg || '刷新失败')
    }
  } catch (_) {
    ElMessage.error('刷新失败')
  }
}

async function handleSubmit() {
  try {
    await formRef.value.validate()
    submitLoading.value = true
    
    if (dialogType.value === 'add') {
      const res = await createPermission(formData)
      if (res.code === 200) {
        ElMessage.success('新增成功')
        dialogVisible.value = false
        loadData()
        loadTreeData()
      } else {
        ElMessage.error(res.msg || '新增失败')
      }
    } else {
      const res = await updatePermission(formData)
      if (res.code === 200) {
        ElMessage.success('更新成功')
        dialogVisible.value = false
        loadData()
        loadTreeData()
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
  loadTreeData()
})
</script>

<style lang="scss" scoped>
.permission-container {
  .filter-card {
    margin-bottom: 20px;
  }
  
  .table-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .el-button {
        margin-left: 8px;
      }
    }
  }
  
  .pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }
}
</style>
