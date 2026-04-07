<template>
  <div class="vehicle-page">
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">
          <span class="title-icon">
            <el-icon><Van /></el-icon>
          </span>
          车辆进出管理
        </h1>
        <p class="page-subtitle">统一处理车辆入场、出场登记与场内记录检索。</p>
      </div>
      <div class="header-metrics">
        <div class="metric-pill">
          <span class="metric-label">停车场</span>
          <span class="metric-value">{{ parkingList.length }}</span>
        </div>
        <div class="metric-pill accent">
          <span class="metric-label">记录数</span>
          <span class="metric-value">{{ pagination.total }}</span>
        </div>
      </div>
    </div>

    <div class="action-grid">
      <section class="panel-card entry-panel">
        <div class="panel-header">
          <div class="panel-title">
            <span class="panel-icon entry">
              <el-icon><Van /></el-icon>
            </span>
            <span>车辆入场</span>
          </div>
          <p class="panel-subtitle">选择停车场和空闲车位，完成入场登记。</p>
        </div>

        <el-form
          ref="entryFormRef"
          :model="entryForm"
          :rules="entryRules"
          class="action-form"
          label-position="top"
        >
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
                :label="getSpaceOptionLabel(s)"
                :value="s.id"
              />
            </el-select>
          </el-form-item>

          <el-form-item class="form-actions">
            <el-button
              v-permission="'billing:entry'"
              class="action-button entry-button"
              type="primary"
              :loading="entryLoading"
              @click="handleEntry"
            >
              确认入场
            </el-button>
            <el-button class="action-button reset-button" @click="handleEntryReset">重置</el-button>
          </el-form-item>
        </el-form>
      </section>

      <section class="panel-card exit-panel">
        <div class="panel-header">
          <div class="panel-title">
            <span class="panel-icon exit">
              <el-icon><SwitchButton /></el-icon>
            </span>
            <span>车辆出场</span>
          </div>
          <p class="panel-subtitle">按停车场和车牌号快速完成出场结算。</p>
        </div>

        <el-form
          ref="exitFormRef"
          :model="exitForm"
          :rules="exitRules"
          class="action-form"
          label-position="top"
        >
          <el-form-item label="停车场" prop="parkingId">
            <el-select v-model="exitForm.parkingId" placeholder="请选择停车场">
              <el-option v-for="p in parkingList" :key="p.id" :label="p.name" :value="p.id" />
            </el-select>
          </el-form-item>

          <el-form-item label="车牌号" prop="carNo">
            <el-input v-model="exitForm.carNo" placeholder="请输入车牌号" />
          </el-form-item>

          <el-form-item class="form-actions">
            <el-button
              v-permission="'billing:exit'"
              class="action-button exit-button"
              type="success"
              :loading="exitLoading"
              @click="handleExit"
            >
              确认出场
            </el-button>
            <el-button class="action-button reset-button" @click="handleExitReset">重置</el-button>
          </el-form-item>
        </el-form>
      </section>

      <section class="panel-card query-panel">
        <div class="panel-header">
          <div class="panel-title">
            <span class="panel-icon query">
              <el-icon><Search /></el-icon>
            </span>
            <span>车辆查询</span>
          </div>
          <p class="panel-subtitle">输入车牌号，查看车辆当前入场状态。</p>
        </div>

        <el-form :model="queryForm" class="action-form" label-position="top">
          <el-form-item label="车牌号">
            <el-input v-model="queryForm.carNo" placeholder="请输入车牌号" />
          </el-form-item>

          <el-form-item class="form-actions">
            <el-button
              v-permission="'billing:view'"
              class="action-button query-button"
              type="primary"
              @click="handleQuery"
            >
              查询车辆
            </el-button>
          </el-form-item>
        </el-form>

        <div v-if="queryResult" class="query-result">
          <div class="result-item">
            <span class="label">车牌号</span>
            <span class="value">{{ queryResult.carNo }}</span>
          </div>
          <div class="result-item">
            <span class="label">入场时间</span>
            <span class="value">{{ formatTime(queryResult.entryTime) }}</span>
          </div>
          <div class="result-item">
            <span class="label">状态</span>
            <el-tag :type="queryResult.status === 1 ? 'success' : 'warning'">
              {{ queryResult.status === 1 ? '已出场' : '在场' }}
            </el-tag>
          </div>
        </div>
      </section>
    </div>

    <section class="records-panel">
      <div class="records-header">
        <div>
          <div class="panel-title records-title">
            <span class="panel-icon records">
              <el-icon><Document /></el-icon>
            </span>
            <span>车辆进出记录</span>
          </div>
          <p class="panel-subtitle">支持按日期区间筛选当前停车场的进出明细。</p>
        </div>

        <div class="filter-toolbar">
          <el-date-picker
            v-model="dateRange"
            class="date-filter"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            @change="handleDateChange"
          />
        </div>
      </div>

      <el-table :data="tableData" v-loading="loading" class="records-table" stripe style="width: 100%">
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
    </section>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { vehicleEntry, vehicleExit, getActiveEntry, getVehicleRecordsByParking } from '@/api/vehicle'
import { getAvailableSpaces, getParkingSpacesByParking } from '@/api/parkingSpace'
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

function getSpaceCode(space) {
  return space?.spaceCode || space?.spaceNumber || space?.code || space?.name || ''
}

function getSpaceArea(space) {
  return space?.area || space?.sectionArea || space?.zone || space?.region || ''
}

function getSpaceOptionLabel(space) {
  const spaceCode = getSpaceCode(space)
  const spaceArea = getSpaceArea(space)

  if (spaceCode && spaceArea) {
    return `${spaceCode} (${spaceArea})`
  }
  return spaceCode || '未命名车位'
}

function normalizeSpace(space) {
  return {
    ...space,
    spaceCode: getSpaceCode(space),
    area: getSpaceArea(space)
  }
}

async function loadParkingList() {
  try {
    const res = await getParkingPage({ pageNo: 1, pageSize: 100 })
    if (res.code === 200) {
      parkingList.value = res.data.records || []
    } else {
      ElMessage.error(res.msg || '加载停车场列表失败')
      parkingList.value = []
    }
  } catch (error) {
    console.error('加载停车场列表失败:', error)
    ElMessage.error('网络错误，加载停车场列表失败')
    parkingList.value = []
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
      const spaces = Array.isArray(res.data) ? res.data : []
      availableSpaces.value = spaces.map(normalizeSpace)
    } else {
      availableSpaces.value = []
    }
  } catch (error) {
    console.error('加载可用车位失败:', error)
    availableSpaces.value = []
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

      const [recordsResult, spacesResult] = await Promise.allSettled([
        getVehicleRecordsByParking(params.parkingId, params),
        getParkingSpacesByParking(params.parkingId)
      ])

      const recordResponse = recordsResult.status === 'fulfilled' ? recordsResult.value : null
      const spaceResponse = spacesResult.status === 'fulfilled' ? spacesResult.value : null
      const records = Array.isArray(recordResponse?.data)
        ? recordResponse.data
        : (recordResponse?.data?.records || [])
      const spaces = Array.isArray(spaceResponse?.data)
        ? spaceResponse.data.map(normalizeSpace)
        : []
      const spaceCodeMap = new Map(spaces.map(space => [space.id, space.spaceCode]))

      if (recordResponse?.code === 200) {
        tableData.value = records.map(record => ({
          ...record,
          parkingName: parkingList.value.find(p => p.id === record.parkingId)?.name || '',
          spaceCode: spaceCodeMap.get(record.spaceId) || getSpaceCode(record) || (record.spaceId ? `#${record.spaceId}` : '')
        }))
        pagination.total = Array.isArray(recordResponse.data)
          ? records.length
          : (recordResponse.data?.total || 0)
      }
    } else {
      // 当没有停车场数据时，清空表格
      tableData.value = []
      pagination.total = 0
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
      if (Array.isArray(res.data)) {
        queryResult.value = res.data.find(item => item?.carNo === queryForm.carNo && item?.status === 0) || null
      } else {
        queryResult.value = res.data || null
      }
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

onMounted(async () => {
  await loadParkingList()
  await loadData()
})
</script>

<style lang="scss" scoped>
.vehicle-page {
  --el-bg-color: transparent;
  --el-bg-color-overlay: var(--bg-secondary);
  --el-fill-color-blank: transparent;
  --el-fill-color-light: rgba(255, 255, 255, 0.05);
  --el-border-color: var(--glass-border);
  --el-border-color-light: var(--border-subtle);
  --el-border-color-lighter: var(--border-subtle);
  --el-text-color-primary: var(--text-primary);
  --el-text-color-regular: var(--text-secondary);
  --el-text-color-secondary: var(--text-tertiary);
  --el-text-color-placeholder: var(--text-muted);
  padding: var(--space-6);
  max-width: 1600px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.header-content {
  flex: 1;
}

.page-title {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-2);
  color: var(--text-primary);
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
}

.title-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
  box-shadow: var(--shadow-glow-primary);

  .el-icon {
    font-size: 22px;
    color: white;
  }
}

.page-subtitle {
  padding-left: calc(44px + var(--space-3));
  color: var(--text-tertiary);
  font-size: var(--text-sm);
}

.header-metrics {
  display: flex;
  gap: var(--space-3);
}

.metric-pill {
  min-width: 120px;
  padding: var(--space-4);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  box-shadow: var(--shadow-md);

  &.accent {
    border-color: rgba(16, 185, 129, 0.25);
  }
}

.metric-label {
  display: block;
  margin-bottom: var(--space-1);
  color: var(--text-tertiary);
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.metric-value {
  color: var(--text-primary);
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-5);
  margin-bottom: var(--space-6);
}

.panel-card,
.records-panel {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  box-shadow: var(--shadow-lg);
}

.panel-card {
  padding: var(--space-5);
}

.panel-card::before,
.records-panel::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.06), transparent 60%);
  pointer-events: none;
}

.panel-card > *,
.records-panel > * {
  position: relative;
  z-index: 1;
}

.entry-panel {
  border-color: rgba(99, 102, 241, 0.25);
}

.exit-panel {
  border-color: rgba(16, 185, 129, 0.25);
}

.query-panel {
  border-color: rgba(244, 63, 94, 0.25);
}

.panel-header {
  margin-bottom: var(--space-5);
}

.panel-title {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  color: var(--text-primary);
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
}

.panel-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-lg);

  .el-icon {
    font-size: 18px;
  }

  &.entry {
    background: rgba(99, 102, 241, 0.18);
    color: var(--primary-400);
  }

  &.exit {
    background: rgba(16, 185, 129, 0.18);
    color: var(--secondary-400);
  }

  &.query {
    background: rgba(244, 63, 94, 0.16);
    color: var(--accent-400);
  }

  &.records {
    background: rgba(148, 163, 184, 0.14);
    color: var(--text-primary);
  }
}

.panel-subtitle {
  margin-top: var(--space-2);
  color: var(--text-tertiary);
  font-size: var(--text-sm);
  line-height: 1.6;
}

.action-form {
  :deep(.el-form-item) {
    margin-bottom: var(--space-4);
  }

  :deep(.el-form-item__label) {
    padding-bottom: var(--space-2);
    color: var(--text-secondary);
    font-size: var(--text-sm);
    line-height: 1.4;
  }

  :deep(.el-form-item__content) {
    line-height: 1.5;
  }

  :deep(.el-select) {
    width: 100%;
  }

  :deep(.el-input__wrapper),
  :deep(.el-select__wrapper),
  :deep(.el-date-editor.el-input__wrapper) {
    background: rgba(255, 255, 255, 0.06);
    box-shadow: 0 0 0 1px var(--glass-border) inset;
    border-radius: var(--radius-md);
    transition: box-shadow var(--duration-normal) var(--ease-default);

    &:hover {
      box-shadow: 0 0 0 1px var(--glass-border-hover) inset;
    }

    &.is-focus {
      box-shadow: 0 0 0 1px var(--border-focus) inset, 0 0 0 3px rgba(99, 102, 241, 0.18);
    }
  }

  :deep(.el-input__inner) {
    color: var(--text-primary);

    &::placeholder {
      color: var(--text-muted);
    }
  }
}

.form-actions {
  margin-bottom: 0;

  :deep(.el-form-item__content) {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
  }
}

.action-button {
  min-width: 108px;
}

.entry-button,
.query-button {
  border: none;
}

.exit-button {
  border: none;
  background: linear-gradient(135deg, var(--secondary-500), var(--secondary-600));
  box-shadow: var(--shadow-md), var(--shadow-glow-secondary);

  &:hover {
    background: linear-gradient(135deg, var(--secondary-400), var(--secondary-500));
    box-shadow: var(--shadow-lg), var(--shadow-glow-secondary);
  }
}

.reset-button {
  background: rgba(255, 255, 255, 0.04);
  border-color: var(--glass-border);
}

.query-result {
  display: grid;
  gap: var(--space-3);
  margin-top: var(--space-4);
  padding: var(--space-4);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.04);
}

.result-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--border-subtle);

  &:last-child {
    padding-bottom: 0;
    border-bottom: none;
  }

  .label {
    color: var(--text-tertiary);
    font-size: var(--text-sm);
  }

  .value {
    color: var(--text-primary);
    font-weight: var(--font-semibold);
    text-align: right;
  }
}

.records-panel {
  padding: var(--space-5);
}

.records-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-5);
}

.records-title {
  margin-bottom: 0;
}

.filter-toolbar {
  min-width: 300px;
}

.date-filter {
  width: 100%;
}

.records-panel :deep(.el-date-editor.el-input__wrapper) {
  background: rgba(255, 255, 255, 0.06);
  box-shadow: 0 0 0 1px var(--glass-border) inset;
  border-radius: var(--radius-md);

  &:hover {
    box-shadow: 0 0 0 1px var(--glass-border-hover) inset;
  }

  &.is-focus {
    box-shadow: 0 0 0 1px var(--border-focus) inset, 0 0 0 3px rgba(99, 102, 241, 0.18);
  }
}

.records-panel :deep(.el-range-input),
.records-panel :deep(.el-range-separator),
.records-panel :deep(.el-input__icon) {
  color: var(--text-secondary);
}

.records-panel :deep(.el-table) {
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-row-hover-bg-color: rgba(255, 255, 255, 0.08);
  --el-table-header-bg-color: rgba(255, 255, 255, 0.06);
  --el-table-border-color: var(--border-subtle);
  --el-table-text-color: var(--text-primary);
  --el-table-header-text-color: var(--text-secondary);
  background: transparent !important;
}

.records-panel :deep(.el-table__inner-wrapper),
.records-panel :deep(.el-table__body),
.records-panel :deep(.el-table__header),
.records-panel :deep(.el-table__body-wrapper),
.records-panel :deep(.el-table__header-wrapper) {
  background: transparent !important;
}

.records-panel :deep(.el-table__inner-wrapper::before),
.records-panel :deep(.el-table::before) {
  background: var(--border-subtle);
}

.records-panel :deep(th.el-table__cell) {
  background: rgba(255, 255, 255, 0.06) !important;
  color: var(--text-secondary);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  letter-spacing: 0.04em;
  border-bottom: 1px solid var(--border-subtle);
}

.records-panel :deep(td.el-table__cell) {
  background: transparent !important;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-subtle);
}

.records-panel :deep(.el-table__body tr:hover > td.el-table__cell) {
  background: rgba(255, 255, 255, 0.08) !important;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--space-5);
  padding-top: var(--space-4);
  border-top: 1px solid var(--border-subtle);

  :deep(.el-pagination) {
    --el-pagination-bg-color: rgba(255, 255, 255, 0.06);
    --el-pagination-text-color: var(--text-secondary);
    --el-pagination-button-color: var(--text-secondary);
    --el-pagination-hover-color: var(--primary-400);
  }

  :deep(.btn-prev),
  :deep(.btn-next),
  :deep(.el-pager li) {
    background: rgba(255, 255, 255, 0.06);
    border-radius: var(--radius-md);
  }

  :deep(.el-pager li.is-active) {
    color: white;
    background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
  }
}

@media (max-width: 1200px) {
  .action-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .page-header,
  .records-header {
    flex-direction: column;
  }

  .header-metrics,
  .filter-toolbar {
    width: 100%;
  }

  .header-metrics {
    flex-wrap: wrap;
  }

  .metric-pill {
    flex: 1;
  }

  .filter-toolbar {
    min-width: 0;
  }
}

@media (max-width: 768px) {
  .vehicle-page {
    padding: var(--space-4);
  }

  .page-subtitle {
    padding-left: 0;
  }

  .action-grid {
    grid-template-columns: 1fr;
  }

  .form-actions :deep(.el-form-item__content) {
    flex-direction: column;
    align-items: stretch;
  }

  .action-button {
    width: 100%;
  }
}

@media (max-width: 640px) {
  .result-item {
    flex-direction: column;
    align-items: flex-start;

    .value {
      text-align: left;
    }
  }
}
</style>
