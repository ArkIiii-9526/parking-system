<template>
  <div class="parking-container">
    <el-card class="filter-card">
      <el-form :model="filterForm" :inline="true" class="filter-form">
        <el-form-item label="停车场名称">
          <el-input v-model="filterForm.name" placeholder="请输入停车场名称" clearable />
        </el-form-item>
        <el-form-item label="地址">
          <el-input v-model="filterForm.address" placeholder="请输入地址" clearable />
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
          <span>停车场列表</span>
          <el-button v-permission="'parking:add'" type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增停车场
          </el-button>
        </div>
      </template>
      
      <el-table :data="tableData" v-loading="loading" stripe style="width: 100%">
        <el-table-column prop="name" label="停车场名称" min-width="150" />
        <el-table-column prop="address" label="地址" min-width="200" />
        <el-table-column prop="totalSpaces" label="总车位数" width="100" align="center" />
        <el-table-column prop="availableSpaces" label="可用车位数" width="100" align="center">
          <template #default="{ row }">
            <span :class="{ 'available': row.availableSpaces > 0 }">{{ row.availableSpaces }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '正常' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="{ row }">
            <el-button v-permission="'parking:view'" link type="primary" @click="handleDetail(row)">
              查看
            </el-button>
            <el-button v-permission="'parking:edit'" link type="primary" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button v-permission="'parking:delete'" link type="danger" @click="handleDelete(row)">
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
      :title="dialogType === 'add' ? '新增停车场' : dialogType === 'edit' ? '编辑停车场' : '停车场详情'"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入停车场名称" :disabled="dialogType === 'detail'" />
        </el-form-item>
        <el-form-item label="地址" prop="address">
          <el-input v-model="formData.address" placeholder="请输入地址" :disabled="dialogType === 'detail'" />
        </el-form-item>
        <el-form-item label="经度" prop="longitude">
          <el-input-number v-model="formData.longitude" :precision="6" :step="0.000001" placeholder="请输入经度" :disabled="dialogType === 'detail'" />
        </el-form-item>
        <el-form-item label="纬度" prop="latitude">
          <el-input-number v-model="formData.latitude" :precision="6" :step="0.000001" placeholder="请输入纬度" :disabled="dialogType === 'detail'" />
        </el-form-item>
        <el-form-item label="车位数" prop="totalSpaces">
          <el-input-number v-model="formData.totalSpaces" :min="1" placeholder="请输入车位数" :disabled="dialogType === 'detail'" />
        </el-form-item>
        <el-form-item label="状态" prop="status" v-if="dialogType !== 'add'">
          <el-switch v-model="formData.status" :active-value="1" :inactive-value="0" :disabled="dialogType === 'detail'" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">关闭</el-button>
        <el-button v-if="dialogType !== 'detail'" type="primary" @click="handleSubmit" :loading="submitLoading">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getParkingPage, createParking, updateParking, deleteParking, getParkingDetail } from '@/api/parking'

const loading = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)
const dialogType = ref('add')
const formRef = ref(null)

const tableData = ref([])
const filterForm = reactive({
  name: '',
  address: ''
})

const pagination = reactive({
  pageNo: 1,
  pageSize: 10,
  total: 0
})

const formData = reactive({
  id: null,
  name: '',
  address: '',
  longitude: null,
  latitude: null,
  totalSpaces: 100,
  status: 1
})

const formRules = {
  name: [
    { required: true, message: '请输入停车场名称', trigger: 'blur' },
    { min: 2, max: 50, message: '名称长度在2-50个字符之间', trigger: 'blur' }
  ],
  address: [
    { required: true, message: '请输入地址', trigger: 'blur' }
  ],
  totalSpaces: [
    { required: true, message: '请输入车位数', trigger: 'blur' }
  ]
}

async function loadData() {
  loading.value = true
  try {
    const res = await getParkingPage({
      pageNo: pagination.pageNo,
      pageSize: pagination.pageSize,
      name: filterForm.name,
      address: filterForm.address
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

function handleSearch() {
  pagination.pageNo = 1
  loadData()
}

function handleReset() {
  filterForm.name = ''
  filterForm.address = ''
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
    if (key === 'totalSpaces') {
      formData[key] = 100
    } else if (key === 'status') {
      formData[key] = 1
    } else {
      formData[key] = null
    }
  })
  dialogVisible.value = true
}

async function handleDetail(row) {
  dialogType.value = 'detail'
  try {
    const res = await getParkingDetail(row.id)
    if (res.code === 200) {
      Object.assign(formData, res.data)
      dialogVisible.value = true
    }
  } catch (_) {
    ElMessage.error('获取详情失败')
  }
}

async function handleEdit(row) {
  dialogType.value = 'edit'
  try {
    const res = await getParkingDetail(row.id)
    if (res.code === 200) {
      Object.assign(formData, res.data)
      dialogVisible.value = true
    }
  } catch (_) {
    ElMessage.error('获取详情失败')
  }
}

function handleDelete(row) {
  ElMessageBox.confirm('确定要删除该停车场吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const res = await deleteParking(row.id)
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
      const res = await createParking(formData)
      if (res.code === 200) {
        ElMessage.success('新增成功')
        dialogVisible.value = false
        loadData()
      } else {
        ElMessage.error(res.msg || '新增失败')
      }
    } else {
      const res = await updateParking(formData)
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
})
</script>

<style lang="scss" scoped>
.parking-container {
  .filter-card {
    margin-bottom: 20px;
    
    .filter-form {
      .el-form-item {
        margin-bottom: 0;
      }
    }
  }
  
  .table-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .available {
      color: #67C23A;
      font-weight: 500;
    }
  }
  
  .pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }
}
</style>
