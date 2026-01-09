<template>
  <div class="parking-space-container">
    <el-card class="filter-card">
      <el-form :model="filterForm" :inline="true" class="filter-form">
        <el-form-item label="停车场">
          <el-select v-model="filterForm.parkingId" placeholder="请选择停车场" clearable @change="handleParkingChange">
            <el-option v-for="p in parkingList" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="区域">
          <el-input v-model="filterForm.area" placeholder="请输入区域" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filterForm.status" placeholder="请选择状态" clearable>
            <el-option label="空闲" :value="1" />
            <el-option label="占用" :value="2" />
            <el-option label="已预约" :value="3" />
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
          <span>停车位列表</span>
          <div class="header-actions">
            <el-button v-permission="'parkingSpace:add'" type="primary" @click="handleAdd">
              <el-icon><Plus /></el-icon>
              新增停车位
            </el-button>
            <el-button type="success" @click="handleBatchAdd">
              <el-icon><Grid /></el-icon>
              批量添加
            </el-button>
          </div>
        </div>
      </template>
      
      <div class="space-overview" v-if="filterForm.parkingId">
        <div class="overview-item">
          <span class="label">总车位数</span>
          <span class="value">{{ spaceStats.total }}</span>
        </div>
        <div class="overview-item available">
          <span class="label">空闲</span>
          <span class="value">{{ spaceStats.available }}</span>
        </div>
        <div class="overview-item occupied">
          <span class="label">占用</span>
          <span class="value">{{ spaceStats.occupied }}</span>
        </div>
        <div class="overview-item reserved">
          <span class="label">已预约</span>
          <span class="value">{{ spaceStats.reserved }}</span>
        </div>
      </div>
      
      <el-table :data="tableData" v-loading="loading" stripe style="width: 100%">
        <el-table-column prop="spaceCode" label="车位编号" width="120" />
        <el-table-column prop="floor" label="楼层" width="100" />
        <el-table-column prop="area" label="区域" width="120" />
        <el-table-column prop="spaceType" label="车位类型" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.spaceType === 1" type="success">普通车位</el-tag>
            <el-tag v-else-if="row.spaceType === 2" type="warning">VIP车位</el-tag>
            <el-tag v-else-if="row.spaceType === 3" type="info">充电车位</el-tag>
            <el-tag v-else>-</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="{ row }">
            <el-button v-permission="'parkingSpace:edit'" link type="primary" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button v-if="row.status === 1" v-permission="'parkingSpace:reserve'" link type="warning" @click="handleReserve(row)">
              预约
            </el-button>
            <el-button v-if="row.status === 3" v-permission="'parkingSpace:edit'" link type="success" @click="handleRelease(row)">
              释放
            </el-button>
            <el-button v-permission="'parkingSpace:delete'" link type="danger" @click="handleDelete(row)">
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
      :title="dialogType === 'add' ? '新增停车位' : '编辑停车位'"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item label="停车场" prop="parkingId">
          <el-select v-model="formData.parkingId" placeholder="请选择停车场">
            <el-option v-for="p in parkingList" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="车位编号" prop="spaceCode">
          <el-input v-model="formData.spaceCode" placeholder="如：A-001" />
        </el-form-item>
        <el-form-item label="楼层" prop="floor">
          <el-input v-model="formData.floor" placeholder="如：1F、B1" />
        </el-form-item>
        <el-form-item label="区域" prop="area">
          <el-input v-model="formData.area" placeholder="如：A区" />
        </el-form-item>
        <el-form-item label="车位类型" prop="spaceType">
          <el-select v-model="formData.spaceType" placeholder="请选择车位类型">
            <el-option label="普通车位" :value="1" />
            <el-option label="VIP车位" :value="2" />
            <el-option label="充电车位" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-switch v-model="formData.status" :active-value="1" :inactive-value="2" />
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
import { getParkingSpacePage, createParkingSpace, updateParkingSpace, deleteParkingSpace, reserveSpace, releaseSpace, getParkingSpacesByParking } from '@/api/parkingSpace'
import { getParkingPage } from '@/api/parking'

const loading = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)
const dialogType = ref('add')
const formRef = ref(null)

const tableData = ref([])
const parkingList = ref([])
const filterForm = reactive({
  parkingId: null,
  area: '',
  status: null
})

const pagination = reactive({
  pageNo: 1,
  pageSize: 10,
  total: 0
})

const spaceStats = reactive({
  total: 0,
  available: 0,
  occupied: 0,
  reserved: 0
})

const formData = reactive({
  id: null,
  parkingId: null,
  spaceCode: '',
  floor: '',
  area: '',
  spaceType: 1,
  status: 1
})

const formRules = {
  parkingId: [{ required: true, message: '请选择停车场', trigger: 'change' }],
  spaceCode: [{ required: true, message: '请输入车位编号', trigger: 'blur' }],
  floor: [{ required: true, message: '请输入楼层', trigger: 'blur' }],
  area: [{ required: true, message: '请输入区域', trigger: 'blur' }]
}

function getStatusType(status) {
  const types = { 1: 'success', 2: 'danger', 3: 'warning' }
  return types[status] || 'info'
}

function getStatusText(status) {
  const texts = { 1: '空闲', 2: '占用', 3: '已预约' }
  return texts[status] || '未知'
}

async function loadParkingList() {
  try {
    const res = await getParkingPage({ pageNo: 1, pageSize: 100 })
    if (res.code === 200) {
      parkingList.value = res.data.records || []
    }
  } catch (error) {
    console.error('加载停车场列表失败:', error)
    // 不显示错误提示，避免影响用户体验
  }
}

async function loadData() {
  if (!filterForm.parkingId) {
    tableData.value = []
    return
  }
  
  loading.value = true
  try {
    const res = await getParkingSpacePage({
      pageNo: pagination.pageNo,
      pageSize: pagination.pageSize,
      parkingId: filterForm.parkingId,
      area: filterForm.area,
      status: filterForm.status
    })
    if (res.code === 200) {
      tableData.value = res.data.records || []
      pagination.total = res.data.total || 0
    }
    
    await loadSpaceStats()
  } catch (error) {
    console.error('加载数据失败:', error)
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

async function loadSpaceStats() {
  try {
    const res = await getParkingSpacesByParking(filterForm.parkingId)
    if (res.code === 200) {
      const list = res.data || []
      spaceStats.total = list.length
      spaceStats.available = list.filter(s => s.status === 1).length
      spaceStats.occupied = list.filter(s => s.status === 2).length
      spaceStats.reserved = list.filter(s => s.status === 3).length
    }
  } catch (error) {
    console.error('加载车位统计失败:', error)
  }
}

function handleParkingChange() {
  pagination.pageNo = 1
  loadData()
}

function handleSearch() {
  pagination.pageNo = 1
  loadData()
}

function handleReset() {
  filterForm.parkingId = null
  filterForm.area = ''
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
    if (key === 'spaceType') {
      formData[key] = 1
    } else if (key === 'status') {
      formData[key] = 1
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

function handleDelete(row) {
  ElMessageBox.confirm('确定要删除该停车位吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const res = await deleteParkingSpace(row.id)
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

async function handleReserve(row) {
  try {
    await ElMessageBox.confirm('确定要预约该车位吗？', '提示', { type: 'warning' })
    const res = await reserveSpace(row.id, {})
    if (res.code === 200) {
      ElMessage.success('预约成功')
      loadData()
    } else {
      ElMessage.error(res.msg || '预约失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('预约失败')
    }
  }
}

async function handleRelease(row) {
  try {
    await ElMessageBox.confirm('确定要释放该车位吗？', '提示', { type: 'warning' })
    const res = await releaseSpace(row.id)
    if (res.code === 200) {
      ElMessage.success('释放成功')
      loadData()
    } else {
      ElMessage.error(res.msg || '释放失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('释放失败')
    }
  }
}

async function handleSubmit() {
  try {
    await formRef.value.validate()
    submitLoading.value = true
    
    if (dialogType.value === 'add') {
      const res = await createParkingSpace(formData)
      if (res.code === 200) {
        ElMessage.success('新增成功')
        dialogVisible.value = false
        loadData()
      } else {
        ElMessage.error(res.msg || '新增失败')
      }
    } else {
      const res = await updateParkingSpace(formData)
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

function handleBatchAdd() {
  if (!filterForm.parkingId) {
    ElMessage.warning('请先选择停车场')
    return
  }
  // TODO: 打开批量添加对话框
}

onMounted(() => {
  loadParkingList()
})
</script>

<style lang="scss" scoped>
.parking-space-container {
  .filter-card {
    margin-bottom: 20px;
  }
  
  .table-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .space-overview {
      display: flex;
      gap: 24px;
      padding: 16px;
      background: #f5f7fa;
      border-radius: 8px;
      margin-bottom: 20px;
      
      .overview-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        
        .label {
          font-size: 12px;
          color: #909399;
          margin-bottom: 4px;
        }
        
        .value {
          font-size: 24px;
          font-weight: 600;
          color: #303133;
        }
        
        &.available .value {
          color: #67C23A;
        }
        
        &.occupied .value {
          color: #F56C6C;
        }
        
        &.reserved .value {
          color: #E6A23C;
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
