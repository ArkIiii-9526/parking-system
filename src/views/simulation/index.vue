<script setup>
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  DataLine,
  Delete,
  Histogram,
  Lightning,
  Plus,
  Refresh,
  Van
} from '@element-plus/icons-vue'
import {
  clearSimulation,
  generateSimulationData,
  getSimulationOverview,
  getSimulationParkingDetail,
  resetSimulation,
  updateSimulationStatus
} from '@/api/simulation'

const generating = ref(false)
const showGenerateDialog = ref(false)
const showSpaceDialog = ref(false)
const selectedParking = ref('')
const selectedSpace = ref(null)
const parkingOptions = ref([])
const currentParking = ref(null)

const overview = ref({
  totalRecords: 0,
  todayRecords: 0,
  activeSpaces: 0,
  totalIncome: 0,
  avgDuration: 0,
  lastGenerateTime: null
})

const generateForm = ref({
  parkingId: '',
  parkingSpaceCount: 50,
  entryExitRecordCount: 100,
  occupiedRate: 30,
  reservedRate: 10,
  generateEntryExitRecords: true,
  dateRange: null
})

const simulationStatus = computed(() => {
  if (overview.value.totalRecords === 0 && !currentParking.value?.totalSpaces) {
    return { type: 'info', text: '未生成' }
  }
  if (overview.value.activeSpaces > 0) {
    return { type: 'success', text: '运行中' }
  }
  return { type: 'warning', text: '待机中' }
})

function unwrapData(response) {
  return response?.data || {}
}

function isOperationSuccess(response) {
  const data = unwrapData(response)
  return data.success !== false
}

function getOperationMessage(response, fallbackMessage) {
  const data = unwrapData(response)
  return data.message || fallbackMessage
}

function getStatusType(status) {
  const map = {
    1: 'success',
    2: 'danger',
    3: 'warning'
  }
  return map[status] || 'info'
}

function getStatusText(status) {
  const map = {
    1: '空闲',
    2: '占用',
    3: '预约'
  }
  return map[status] || '未知'
}

function getSpaceStatusClass(status) {
  const map = {
    1: 'available',
    2: 'occupied',
    3: 'reserved'
  }
  return map[status] || 'available'
}

function formatDateTime(value) {
  if (!value) {
    return '-'
  }
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('zh-CN', { hour12: false })
}

async function loadParkingList() {
  try {
    const { getParkingPage } = await import('@/api/parking')
    const res = await getParkingPage({ page: 1, size: 1000 })
    if (res.code === 200 && res.data) {
      parkingOptions.value = (res.data.records || []).map((parking) => ({
        label: parking.name,
        value: parking.id
      }))
    }
  } catch (error) {
    console.error('加载停车场列表失败:', error)
    ElMessage.error('加载停车场列表失败')
  }
}

async function fetchOverview() {
  try {
    const params = selectedParking.value ? { parkingId: selectedParking.value } : undefined
    const res = await getSimulationOverview(params)
    const data = unwrapData(res)
    overview.value = {
      totalRecords: Number(data.totalRecords || 0),
      todayRecords: Number(data.todayRecords || 0),
      activeSpaces: Number(data.activeSpaces || 0),
      totalIncome: Number(data.totalIncome || 0),
      avgDuration: Number(data.avgDuration || 0),
      lastGenerateTime: data.lastGenerateTime || null
    }
  } catch (error) {
    console.error('获取模拟概览失败:', error)
    ElMessage.error('获取模拟概览失败')
  }
}

async function fetchParkingDetail() {
  if (!selectedParking.value) {
    currentParking.value = null
    await fetchOverview()
    return
  }

  try {
    const res = await getSimulationParkingDetail(selectedParking.value)
    const data = unwrapData(res)
    currentParking.value = {
      id: data.parkingId,
      name: data.parkingName,
      totalSpaces: Number(data.totalSpaces || 0),
      availableSpaces: Number(data.availableSpaces || 0),
      occupiedSpaces: Number(data.occupiedSpaces || 0),
      reservedSpaces: Number(data.reservedSpaces || 0),
      spaces: Array.isArray(data.spaces) ? data.spaces : []
    }
    await fetchOverview()
  } catch (error) {
    console.error('获取停车场模拟详情失败:', error)
    ElMessage.error('获取停车场模拟详情失败')
  }
}

async function handleParkingChange() {
  await fetchParkingDetail()
}

function ensureParkingSelected() {
  if (selectedParking.value) {
    return true
  }
  ElMessage.warning('请先选择停车场')
  return false
}

function openGenerateDialog() {
  if (!selectedParking.value && parkingOptions.value.length > 0) {
    generateForm.value.parkingId = parkingOptions.value[0].value
  } else {
    generateForm.value.parkingId = selectedParking.value || ''
  }
  showGenerateDialog.value = true
}

async function handleGenerate() {
  if (!generateForm.value.parkingId) {
    ElMessage.warning('请选择停车场')
    return
  }

  const occupiedRate = Number(generateForm.value.occupiedRate || 0)
  const reservedRate = Number(generateForm.value.reservedRate || 0)
  if (occupiedRate + reservedRate > 100) {
    ElMessage.warning('占用率与预约率之和不能超过 100%')
    return
  }

  generating.value = true
  try {
    const res = await generateSimulationData({
      parkingId: Number(generateForm.value.parkingId),
      parkingSpaceCount: Number(generateForm.value.parkingSpaceCount),
      occupiedRate,
      reservedRate,
      generateEntryExitRecords: generateForm.value.generateEntryExitRecords,
      entryExitRecordCount: Number(generateForm.value.entryExitRecordCount),
      startTime: generateForm.value.dateRange?.[0],
      endTime: generateForm.value.dateRange?.[1]
    })

    if (!isOperationSuccess(res)) {
      ElMessage.error(getOperationMessage(res, '生成模拟数据失败'))
      return
    }

    ElMessage.success(getOperationMessage(res, '模拟数据生成成功'))
    selectedParking.value = String(generateForm.value.parkingId)
    showGenerateDialog.value = false
    await fetchParkingDetail()
  } catch (error) {
    console.error('生成模拟数据失败:', error)
    ElMessage.error('生成模拟数据失败')
  } finally {
    generating.value = false
  }
}

async function handleQuickGenerate(type) {
  if (!ensureParkingSelected()) {
    return
  }

  const presets = {
    light: { parkingSpaceCount: 30, entryExitRecordCount: 60, occupiedRate: 20, reservedRate: 10 },
    normal: { parkingSpaceCount: 60, entryExitRecordCount: 150, occupiedRate: 35, reservedRate: 10 },
    heavy: { parkingSpaceCount: 120, entryExitRecordCount: 300, occupiedRate: 45, reservedRate: 15 }
  }
  const preset = presets[type]

  try {
    await ElMessageBox.confirm(
      `确定要为当前停车场生成 ${preset.entryExitRecordCount} 条模拟记录吗？`,
      '确认生成',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    )

    generating.value = true
    const res = await generateSimulationData({
      parkingId: Number(selectedParking.value),
      parkingSpaceCount: preset.parkingSpaceCount,
      entryExitRecordCount: preset.entryExitRecordCount,
      occupiedRate: preset.occupiedRate,
      reservedRate: preset.reservedRate,
      generateEntryExitRecords: true
    })

    if (!isOperationSuccess(res)) {
      ElMessage.error(getOperationMessage(res, '生成模拟数据失败'))
      return
    }

    ElMessage.success(getOperationMessage(res, '模拟数据生成成功'))
    await fetchParkingDetail()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('快速生成失败:', error)
      ElMessage.error('快速生成失败')
    }
  } finally {
    generating.value = false
  }
}

function handleSpaceClick(space) {
  selectedSpace.value = space
  showSpaceDialog.value = true
}

async function handleUpdateSpaceStatus(status) {
  if (!selectedSpace.value || !ensureParkingSelected()) {
    return
  }

  try {
    const res = await updateSimulationStatus({
      parkingId: Number(selectedParking.value),
      spaceId: selectedSpace.value.id,
      status
    })

    if (res.code !== 200) {
      ElMessage.error('更新状态失败')
      return
    }

    ElMessage.success('状态更新成功')
    showSpaceDialog.value = false
    await fetchParkingDetail()
  } catch (error) {
    console.error('更新车位状态失败:', error)
    ElMessage.error('更新车位状态失败')
  }
}

async function handleReset() {
  if (!ensureParkingSelected()) {
    return
  }

  try {
    await ElMessageBox.confirm(
      '确定要将当前停车场的模拟车位全部重置为空闲吗？',
      '确认重置',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    )

    const res = await resetSimulation(selectedParking.value)
    if (res.code !== 200) {
      ElMessage.error('重置失败')
      return
    }

    ElMessage.success('重置成功')
    await fetchParkingDetail()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('重置模拟状态失败:', error)
      ElMessage.error('重置模拟状态失败')
    }
  }
}

async function handleClear() {
  if (!ensureParkingSelected()) {
    return
  }

  try {
    await ElMessageBox.confirm(
      '确定要清除当前停车场的全部模拟数据吗？该操作不可恢复。',
      '确认清除',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'danger' }
    )

    const res = await clearSimulation(selectedParking.value)
    if (!isOperationSuccess(res)) {
      ElMessage.error(getOperationMessage(res, '清除模拟数据失败'))
      return
    }

    ElMessage.success(getOperationMessage(res, '模拟数据已清除'))
    currentParking.value = {
      id: selectedParking.value,
      name: currentParking.value?.name || '',
      totalSpaces: 0,
      availableSpaces: 0,
      occupiedSpaces: 0,
      reservedSpaces: 0,
      spaces: []
    }
    await fetchOverview()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('清除模拟数据失败:', error)
      ElMessage.error('清除模拟数据失败')
    }
  }
}

onMounted(async () => {
  await loadParkingList()
  await fetchOverview()
})
</script>

<template>
  <div class="simulation-page">
    <div class="page-header">
      <div class="header-main">
        <h2 class="page-title">模拟数据管理</h2>
        <p class="subtitle">独立模拟沙箱，仅操作模拟专用数据，不再污染正式业务表</p>
      </div>
      <div class="header-actions">
        <el-select
          v-model="selectedParking"
          placeholder="选择停车场"
          clearable
          filterable
          style="width: 240px"
          @change="handleParkingChange"
        >
          <el-option
            v-for="item in parkingOptions"
            :key="item.value"
            :label="item.label"
            :value="String(item.value)"
          />
        </el-select>
      </div>
    </div>

    <el-row :gutter="16" class="operation-cards">
      <el-col :xs="24" :md="8">
        <div class="operation-card">
          <div class="card-icon primary">
            <el-icon :size="32"><Plus /></el-icon>
          </div>
          <h3>生成模拟数据</h3>
          <p>为当前停车场生成独立模拟车位与记录</p>
          <el-button v-permission="'simulation:generate'" type="primary" @click="openGenerateDialog">
            开始生成
          </el-button>
        </div>
      </el-col>
      <el-col :xs="24" :md="8">
        <div class="operation-card">
          <div class="card-icon warning">
            <el-icon :size="32"><Refresh /></el-icon>
          </div>
          <h3>重置模拟状态</h3>
          <p>仅重置当前停车场模拟车位状态，不影响正式车位</p>
          <el-button
            v-permission="'simulation:reset'"
            type="warning"
            :disabled="!selectedParking"
            @click="handleReset"
          >
            重置状态
          </el-button>
        </div>
      </el-col>
      <el-col :xs="24" :md="8">
        <div class="operation-card">
          <div class="card-icon danger">
            <el-icon :size="32"><Delete /></el-icon>
          </div>
          <h3>清除模拟数据</h3>
          <p>仅清除当前停车场模拟表中的数据</p>
          <el-button
            v-permission="'simulation:clear'"
            type="danger"
            :disabled="!selectedParking"
            @click="handleClear"
          >
            清除数据
          </el-button>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="overview-row">
      <el-col :xs="24" :lg="16">
        <div class="data-card">
          <div class="card-header">
            <h3>模拟数据概览</h3>
            <el-tag :type="simulationStatus.type" size="small">{{ simulationStatus.text }}</el-tag>
          </div>
          <el-row :gutter="16" class="stats-row">
            <el-col :span="8">
              <div class="stat-item">
                <div class="stat-value">{{ overview.totalRecords }}</div>
                <div class="stat-label">总记录数</div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="stat-item">
                <div class="stat-value">{{ overview.todayRecords }}</div>
                <div class="stat-label">今日记录</div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="stat-item">
                <div class="stat-value">{{ overview.activeSpaces }}</div>
                <div class="stat-label">占用车位</div>
              </div>
            </el-col>
          </el-row>
          <el-row :gutter="16" class="stats-row">
            <el-col :span="8">
              <div class="stat-item">
                <div class="stat-value">¥{{ overview.totalIncome.toFixed(2) }}</div>
                <div class="stat-label">模拟收入</div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="stat-item">
                <div class="stat-value">{{ overview.avgDuration }} 分</div>
                <div class="stat-label">平均时长</div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="stat-item">
                <div class="stat-value">{{ formatDateTime(overview.lastGenerateTime) }}</div>
                <div class="stat-label">最后生成</div>
              </div>
            </el-col>
          </el-row>
        </div>
      </el-col>
      <el-col :xs="24" :lg="8">
        <div class="data-card">
          <div class="card-header">
            <h3>快速生成</h3>
          </div>
          <div class="quick-actions">
            <div v-permission="'simulation:generate'" class="quick-actions-inner">
              <el-button type="primary" plain :disabled="!selectedParking" @click="handleQuickGenerate('light')">
                <el-icon><Lightning /></el-icon>
                轻量生成
              </el-button>
              <el-button type="success" plain :disabled="!selectedParking" @click="handleQuickGenerate('normal')">
                <el-icon><DataLine /></el-icon>
                标准生成
              </el-button>
              <el-button type="warning" plain :disabled="!selectedParking" @click="handleQuickGenerate('heavy')">
                <el-icon><Histogram /></el-icon>
                大量生成
              </el-button>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <div class="data-card">
      <div class="card-header">
        <h3>停车场模拟状态</h3>
        <span class="parking-hint">{{ currentParking?.name || '请选择停车场' }}</span>
      </div>

      <div v-if="currentParking" class="parking-simulation">
        <div class="parking-info">
          <div class="info-item">
            <span class="label">总车位:</span>
            <span class="value">{{ currentParking.totalSpaces }}</span>
          </div>
          <div class="info-item">
            <span class="label">空闲:</span>
            <span class="value success">{{ currentParking.availableSpaces }}</span>
          </div>
          <div class="info-item">
            <span class="label">占用:</span>
            <span class="value danger">{{ currentParking.occupiedSpaces }}</span>
          </div>
          <div class="info-item">
            <span class="label">预约:</span>
            <span class="value warning">{{ currentParking.reservedSpaces }}</span>
          </div>
        </div>

        <div v-if="currentParking.spaces.length > 0" v-permission="'simulation:update'" class="space-grid">
          <div
            v-for="space in currentParking.spaces"
            :key="space.id"
            class="space-item"
            :class="getSpaceStatusClass(space.status)"
            @click="handleSpaceClick(space)"
          >
            <span class="space-number">{{ space.number }}</span>
            <el-icon v-if="space.status === 2" class="car-icon"><Van /></el-icon>
          </div>
        </div>
        <el-empty v-else description="当前停车场暂无模拟车位，先点击“开始生成”创建模拟数据" />

        <div class="legend">
          <div class="legend-item">
            <div class="dot available"></div>
            <span>空闲</span>
          </div>
          <div class="legend-item">
            <div class="dot occupied"></div>
            <span>占用</span>
          </div>
          <div class="legend-item">
            <div class="dot reserved"></div>
            <span>预约</span>
          </div>
        </div>
      </div>

      <el-empty v-else description="请选择停车场查看模拟详情" />
    </div>

    <el-dialog
      v-model="showGenerateDialog"
      title="生成模拟数据"
      width="560px"
      destroy-on-close
    >
      <el-form :model="generateForm" label-width="120px">
        <el-form-item label="停车场">
          <el-select v-model="generateForm.parkingId" placeholder="选择停车场" style="width: 100%">
            <el-option
              v-for="item in parkingOptions"
              :key="item.value"
              :label="item.label"
              :value="String(item.value)"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="模拟车位数">
          <el-slider v-model="generateForm.parkingSpaceCount" :min="10" :max="300" :step="10" show-input />
        </el-form-item>
        <el-form-item label="模拟记录数">
          <el-slider v-model="generateForm.entryExitRecordCount" :min="0" :max="500" :step="10" show-input />
        </el-form-item>
        <el-form-item label="占用率">
          <el-slider v-model="generateForm.occupiedRate" :min="0" :max="100" :step="5" show-input />
        </el-form-item>
        <el-form-item label="预约率">
          <el-slider v-model="generateForm.reservedRate" :min="0" :max="100" :step="5" show-input />
        </el-form-item>
        <el-form-item label="生成进出记录">
          <el-switch v-model="generateForm.generateEntryExitRecords" />
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="generateForm.dateRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DDTHH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showGenerateDialog = false">取消</el-button>
        <el-button type="primary" :loading="generating" @click="handleGenerate">
          开始生成
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="showSpaceDialog"
      title="调整模拟车位状态"
      width="420px"
      destroy-on-close
    >
      <div v-if="selectedSpace" class="space-dialog-content">
        <div class="space-detail">
          <div class="detail-item">
            <span class="label">车位编号:</span>
            <span class="value">{{ selectedSpace.number }}</span>
          </div>
          <div class="detail-item">
            <span class="label">当前状态:</span>
            <el-tag :type="getStatusType(selectedSpace.status)" size="small">
              {{ getStatusText(selectedSpace.status) }}
            </el-tag>
          </div>
        </div>
        <div class="action-buttons">
          <el-button
            v-for="status in [1, 2, 3]"
            :key="status"
            :type="selectedSpace.status === status ? 'primary' : 'default'"
            @click="handleUpdateSpaceStatus(status)"
          >
            {{ getStatusText(status) }}
          </el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.simulation-page {
  padding: var(--space-6);
  max-width: 1600px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: var(--space-6);
}

.page-title {
  margin: 0 0 8px;
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
}

.subtitle {
  margin: 0;
  color: var(--text-muted);
  font-size: var(--text-sm);
}

.operation-cards,
.overview-row {
  margin-bottom: var(--space-6);
}

.operation-card,
.data-card {
  height: 100%;
  background: var(--glass-bg);
  backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
}

.operation-card {
  padding: 24px;
  text-align: center;
}

.card-icon {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  color: white;
}

.card-icon.primary {
  background: linear-gradient(135deg, var(--primary-500), var(--primary-400));
}

.card-icon.warning {
  background: linear-gradient(135deg, #f59e0b, #fbbf24);
}

.card-icon.danger {
  background: linear-gradient(135deg, #ef4444, #f87171);
}

.operation-card h3,
.card-header h3 {
  margin: 0 0 8px;
  color: var(--text-primary);
}

.operation-card p {
  min-height: 44px;
  color: var(--text-muted);
  margin-bottom: 18px;
}

.data-card {
  padding: 24px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 20px;
}

.stats-row + .stats-row {
  margin-top: 16px;
}

.stat-item {
  padding: 16px;
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.55);
  border: 1px solid rgba(148, 163, 184, 0.16);
  text-align: center;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 6px;
}

.stat-label,
.parking-hint {
  color: var(--text-muted);
  font-size: 13px;
}

.quick-actions-inner {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.parking-simulation {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.parking-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
}

.info-item,
.detail-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.58);
  border: 1px solid rgba(148, 163, 184, 0.16);
}

.label {
  color: var(--text-muted);
}

.value {
  color: var(--text-primary);
  font-weight: 600;
}

.value.success {
  color: #16a34a;
}

.value.danger {
  color: #dc2626;
}

.value.warning {
  color: #d97706;
}

.space-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(88px, 1fr));
  gap: 12px;
}

.space-item {
  position: relative;
  min-height: 88px;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.space-item:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.space-item.available {
  background: rgba(220, 252, 231, 0.9);
  color: #166534;
}

.space-item.occupied {
  background: rgba(254, 226, 226, 0.92);
  color: #991b1b;
}

.space-item.reserved {
  background: rgba(254, 243, 199, 0.95);
  color: #92400e;
}

.space-number {
  font-weight: 700;
}

.car-icon {
  font-size: 18px;
}

.legend,
.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-muted);
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.dot.available {
  background: #22c55e;
}

.dot.occupied {
  background: #ef4444;
}

.dot.reserved {
  background: #f59e0b;
}

.space-dialog-content {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

@media (max-width: 960px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
