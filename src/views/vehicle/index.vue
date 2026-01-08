<template>
  <div class="vehicle-container">
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card class="action-card">
          <template #header>
            <div class="card-header">
              <span>车辆入场</span>
            </div>
          </template>
          <el-form :model="entryForm" :rules="entryRules" ref="entryFormRef" label-width="80px">
            <el-form-item label="停车场" prop="parkingId">
              <el-select v-model="entryForm.parkingId" placeholder="请选择停车场">
                <el-option v-for="p in parkingList" :key="p.id" :label="p.name" :value="p.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="车牌号" prop="carNo">
              <el-input v-model="entryForm.carNo" placeholder="请输入车牌号" />
            </el-form-item>
            <el-form-item label="车位" prop="spaceId">
              <el-select v-model="entryForm.spaceId" placeholder="请选择车位" filterable>
                <el-option 
                  v-for="s in availableSpaces" 
                  :key="s.id" 
                  :label="`${s.spaceCode} (${s.area})`" 
                  :value="s.id" 
                />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleEntry" :loading="entryLoading">确认入场</el-button>
              <el-button @click="handleEntryReset">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
      
      <el-col :span="8">
        <el-card class="action-card">
          <template #header>
            <div class="card-header">
              <span>车辆出场</span>
            </div>
          </template>
          <el-form :model="exitForm" :rules="exitRules" ref="exitFormRef" label-width="80px">
            <el-form-item label="停车场" prop="parkingId">
              <el-select v-model="exitForm.parkingId" placeholder="请选择停车场">
                <el-option v-for="p in parkingList" :key="p.id" :label="p.name" :value="p.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="车牌号" prop="carNo">
              <el-input v-model="exitForm.carNo" placeholder="请输入车牌号" />
            </el-form-item>
            <el-form-item>
              <el-button type="success" @click="handleExit" :loading="exitLoading">确认出场</el-button>
              <el-button @click="handleExitReset">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
      
      <el-col :span="8">
        <el-card class="action-card">
          <template #header>
            <div class="card-header">
              <span>车辆查询</span>
            </div>
          </template>
          <el-form :model="queryForm" label-width="80px">
            <el-form-item label="车牌号">
              <el-input v-model="queryForm.carNo" placeholder="请输入车牌号" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleQuery">查询</el-button>
            </el-form-item>
          </el-form>
          <div v-if="queryResult" class="query-result">
            <div class="result-item">
              <span class="label">车牌号：</span>
              <span class="value">{{ queryResult.carNo }}</span>
            </div>
            <div class="result-item">
              <span class="label">入场时间：</span>
              <span class="value">{{ formatTime(queryResult.entryTime) }}</span>
            </div>
            <div class="result-item">
              <span class="label">状态：</span>
              <el-tag :type="queryResult.status === 1 ? 'success' : 'warning'">
                {{ queryResult.status === 1 ? '已出场' : '在场' }}
              </el-tag>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-card class="table-card" style="margin-top: 20px;">
      <template #header>
        <div class="card-header">
          <span>车辆进出记录</span>
          <div class="header-actions">
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              @change="handleDateChange"
            />
          </div>
        </div>
      </template>
      
      <el-table :data="tableData" v-loading="loading" stripe style="width: 100%">
        <el-table-column prop="carNo" label="车牌号" width="150" />
        <el-table-column prop="parkingName" label="停车场" min-width="150" />
        <el-table-column prop="spaceCode" label="车位编号" width="120" />
        <el-table-column prop="entryTime" label="入场时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.entryTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="exitTime" label="出场时间" width="180">
          <template #default="{ row }">
            {{ row.exitTime ? formatTime(row.exitTime) : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="duration" label="停车时长" width="120">
          <template #default="{ row }">
            {{ calculateDuration(row.entryTime, row.exitTime || new Date()) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'warning'">
              {{ row.status === 1 ? '已出场' : '在场' }}
            </el-tag>
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { vehicleEntry, vehicleExit, getActiveEntry, getVehicleRecordsByParking } from '@/api/vehicle'
import { getAvailableSpaces } from '@/api/parkingSpace'
import { getParkingPage } from '@/api/parking'

const loading = ref(false)
const entryLoading = ref(false)
const exitLoading = ref(false)
const dateRange = ref(null)
const parkingList = ref([])
const availableSpaces = ref([])
const queryResult = ref(null)

const tableData = ref([])
const pagination = reactive({
  pageNo: 1,
  pageSize: 10,
  total: 0
})

const entryForm = reactive({
  parkingId: null,
  carNo: '',
  spaceId: null
})

const entryRules = {
  parkingId: [{ required: true, message: '请选择停车场', trigger: 'change' }],
  carNo: [{ required: true, message: '请输入车牌号', trigger: 'blur' }],
  spaceId: [{ required: true, message: '请选择车位', trigger: 'change' }]
}

const exitForm = reactive({
  parkingId: null,
  carNo: ''
})

const exitRules = {
  parkingId: [{ required: true, message: '请选择停车场', trigger: 'change' }],
  carNo: [{ required: true, message: '请输入车牌号', trigger: 'blur' }]
}

const queryForm = reactive({
  carNo: ''
})

function formatTime(time) {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}

function calculateDuration(entryTime, exitTime) {
  const entry = new Date(entryTime)
  const exit = new Date(exitTime)
  const duration = Math.floor((exit - entry) / 1000 / 60)
  
  const hours = Math.floor(duration / 60)
  const minutes = duration % 60
  
  if (hours > 0) {
    return `${hours}小时${minutes}分钟`
  }
  return `${minutes}分钟`
}

async function loadParkingList() {
  try {
    const res = await getParkingPage({ pageNo: 1, pageSize: 100 })
    if (res.code === 200) {
      parkingList.value = res.data.records || []
    }
  } catch (error) {
    console.error('加载停车场列表失败:', error)
  }
}

async function loadAvailableSpaces(parkingId) {
  if (!parkingId) {
    availableSpaces.value = []
    return
  }
  try {
    const res = await getAvailableSpaces(parkingId)
    if (res.code === 200) {
      availableSpaces.value = res.data || []
    }
  } catch (error) {
    console.error('加载可用车位失败:', error)
  }
}

async function loadData() {
  loading.value = true
  try {
    const params = {
      pageNo: pagination.pageNo,
      pageSize: pagination.pageSize,
      startTime: dateRange.value ? dateRange.value[0] : null,
      endTime: dateRange.value ? dateRange.value[1] : null
    }
    
    if (parkingList.value.length > 0) {
      params.parkingId = parkingList.value[0].id
    }
    
    const res = await getVehicleRecordsByParking(params.parkingId, params)
    if (res.code === 200) {
      tableData.value = (res.data.records || []).map(record => ({
        ...record,
        parkingName: parkingList.value.find(p => p.id === record.parkingId)?.name || ''
      }))
      pagination.total = res.data.total || 0
    }
  } catch (error) {
    console.error('加载数据失败:', error)
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

watch(() => entryForm.parkingId, (newVal) => {
  entryForm.spaceId = null
  loadAvailableSpaces(newVal)
})

watch(() => exitForm.parkingId, () => {
  exitForm.carNo = ''
  queryResult.value = null
})

async function handleEntry() {
  try {
    await entryFormRef.value.validate()
    entryLoading.value = true
    
    const res = await vehicleEntry(entryForm)
    if (res.code === 200) {
      ElMessage.success('入场登记成功')
      handleEntryReset()
      loadData()
    } else {
      ElMessage.error(res.msg || '入场登记失败')
    }
  } catch (error) {
    console.error('入场失败:', error)
  } finally {
    entryLoading.value = false
  }
}

function handleEntryReset() {
  entryForm.parkingId = null
  entryForm.carNo = ''
  entryForm.spaceId = null
  availableSpaces.value = []
}

async function handleExit() {
  try {
    await exitFormRef.value.validate()
    exitLoading.value = true
    
    const res = await vehicleExit(exitForm)
    if (res.code === 200) {
      ElMessage.success('出场登记成功')
      handleExitReset()
      loadData()
    } else {
      ElMessage.error(res.msg || '出场登记失败')
    }
  } catch (error) {
    console.error('出场失败:', error)
  } finally {
    exitLoading.value = false
  }
}

function handleExitReset() {
  exitForm.parkingId = null
  exitForm.carNo = ''
  queryResult.value = null
}

async function handleQuery() {
  if (!queryForm.carNo) {
    ElMessage.warning('请输入车牌号')
    return
  }
  
  try {
    const res = await getActiveEntry({ carNo: queryForm.carNo })
    if (res.code === 200) {
      queryResult.value = res.data || null
      if (!queryResult.value) {
        ElMessage.info('未找到该车辆的入场记录')
      }
    } else {
      ElMessage.error(res.msg || '查询失败')
    }
  } catch (error) {
    console.error('查询失败:', error)
  }
}

function handleDateChange() {
  pagination.pageNo = 1
  loadData()
}

function handleSizeChange(size) {
  pagination.pageSize = size
  loadData()
}

function handleCurrentChange(page) {
  pagination.pageNo = page
  loadData()
}

const entryFormRef = ref(null)
const exitFormRef = ref(null)

onMounted(() => {
  loadParkingList()
  loadData()
})
</script>

<style lang="scss" scoped>
.vehicle-container {
  .action-card {
    height: 100%;
    
    .card-header {
      font-weight: 500;
    }
    
    .query-result {
      margin-top: 16px;
      padding: 16px;
      background: #f5f7fa;
      border-radius: 8px;
      
      .result-item {
        margin-bottom: 8px;
        
        .label {
          color: #606266;
        }
        
        .value {
          color: #303133;
          font-weight: 500;
        }
      }
    }
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
}
</style>
