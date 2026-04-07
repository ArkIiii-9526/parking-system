<template>
  <div class="permission-container legacy-themed-page">
    <el-card class="filter-card">
      <el-form :model="filterForm" :inline="true" class="filter-form">
        <el-form-item label="权限名称">
          <el-input v-model="filterForm.name" placeholder="请输入权限名称" clearable />
        </el-form-item>
        <el-form-item label="权限类型">
          <el-select v-model="filterForm.type" placeholder="请选择类型" clearable style="width: 150px">
            <el-option label="目录" value="DIR" />
            <el-option label="菜单" value="MENU" />
            <el-option label="按钮" value="BUTTON" />
            <el-option label="接口" value="API" />
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
          <div class="header-left">
            <span>权限列表</span>
          </div>
          <div class="header-right">
            <el-button type="primary" @click="handleAdd">
              <el-icon><Plus /></el-icon>
              新增权限
            </el-button>
            <el-button type="success" @click="handleRefreshCache">
              <el-icon><Refresh /></el-icon>
              刷新缓存
            </el-button>
          </div>
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
          <el-select v-model="formData.parentId" placeholder="请选择上级权限（不选则为顶级）" clearable>
            <el-option
              v-for="item in treeData"
              :key="item.id"
              :label="item.displayName"
              :value="item.id"
            >
              <template #default="{ item: optionItem }">
                <span style="margin-left: 10px;">{{ item.displayName }}</span>
              </template>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="权限类型" prop="type">
          <el-select v-model="formData.type" placeholder="请选择权限类型">
            <el-option label="菜单" value="MENU" />
            <el-option label="按钮" value="BUTTON" />
            <el-option label="接口" value="API" />
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
import {
  buildPermissionPayload,
  flattenPermissionTree,
  getPermissionTypeTag as getTypeTag,
  getPermissionTypeText as getTypeText,
  normalizePermission,
  normalizePermissionTree
} from '@/utils/system-manage'

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
  name: '',
  type: ''
})

const formData = reactive({
  id: null,
  parentId: null,
  type: 'MENU',
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

async function loadData() {
  loading.value = true
  try {
    const params = {
      pageNo: pagination.pageNo,
      pageSize: pagination.pageSize,
      name: filterForm.name
    }
    if (filterForm.type) {
      params.type = filterForm.type
    }
    const res = await getPermissionList(params)
    if (res.code === 200) {
      const list = res.data.records || res.data || []
      pagination.total = res.data.total !== undefined ? res.data.total : list.length
      const normalizedList = list.map(item => normalizePermission(item))
      
      if (!res.data.records && Array.isArray(res.data)) {
        const start = (pagination.pageNo - 1) * pagination.pageSize
        const end = start + pagination.pageSize
        tableData.value = normalizedList.slice(start, end)
      } else {
        tableData.value = normalizedList
      }
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
      const list = res.data.records || res.data || []
      treeData.value = flattenPermissionTree(normalizePermissionTree(list))
    }
  } catch (error) {
    console.error('加载树数据失败:', error)
  }
}

function handleSearch() {
  pagination.pageNo = 1
  loadData()
}

function handleReset() {
  filterForm.name = ''
  filterForm.type = ''
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
  Object.assign(formData, {
    id: null,
    parentId: null,
    type: 'MENU',
    name: '',
    code: '',
    path: '',
    icon: '',
    sort: 0,
    status: 1,
    component: '',
    method: null,
    isMenu: null,
    menuId: null
  })
  dialogVisible.value = true
}

function handleEdit(row) {
  dialogType.value = 'edit'
  Object.assign(formData, normalizePermission(row))
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
    const payload = buildPermissionPayload(formData)
    
    if (dialogType.value === 'add') {
      const res = await createPermission(payload)
      if (res.code === 200) {
        ElMessage.success('新增成功')
        dialogVisible.value = false
        loadData()
        loadTreeData()
      } else {
        ElMessage.error(res.msg || '新增失败')
      }
    } else {
      const res = await updatePermission(payload)
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
      
      .header-left {
        display: flex;
        align-items: center;
        font-size: 16px;
        font-weight: 500;
      }
      
      .header-right {
        display: flex;
        gap: 8px;
        
        .el-button {
          margin-left: 0;
        }
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
