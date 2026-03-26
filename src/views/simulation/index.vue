<template>
  <div class="simulation-page">
    <div class="page-header">
      <div class="header-title">
        <h2>模拟数据管理</h2>
        <p class="subtitle">生成和管理模拟停车数据，用于系统测试和演示</p>
      </div>
    </div>

    <!-- 操作卡片 -->
    <el-row :gutter="16" class="operation-cards">
      <el-col :xs="24" :md="8">
        <div class="operation-card">
          <div class="card-icon primary">
            <el-icon :size="32"><Plus /></el-icon>
          </div>
          <h3>生成模拟数据</h3>
          <p>批量生成停车记录、收入数据等模拟数据</p>
          <el-button v-permission="'simulation:generate'" type="primary" @click="showGenerateDialog = true">
            开始生成
          </el-button>
        </div>
      </el-col>
      <el-col :xs="24" :md="8">
        <div class="operation-card">
          <div class="card-icon warning">
            <el-icon :size="32"><Refresh /></el-icon>
          </div>
          <h3>重置停车场状态</h3>
          <p>将所有车位状态重置为空闲状态</p>
          <el-button v-permission="'simulation:reset'" type="warning" @click="handleReset">
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
          <p>清除所有模拟生成的数据记录</p>
          <el-button v-permission="'simulation:clear'" type="danger" @click="handleClear">
            清除数据
          </el-button>
        </div>
      </el-col>
    </el-row>

    <!-- 模拟数据概览 -->
    <el-row :gutter="16" class="overview-row">
      <el-col :xs="24" :lg="16">
        <div class="data-card">
          <div class="card-header">
            <h3>模拟数据概览</h3>
            <el-tag :type="simulationStatus.type" size="small">
              {{ simulationStatus.text }}
            </el-tag>
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
                <div class="stat-value">{{ overview.avgDuration }}分</div>
                <div class="stat-label">平均时长</div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="stat-item">
                <div class="stat-value">{{ overview.lastGenerateTime || '-' }}</div>
                <div class="stat-label">最后生成</div>
              </div>
            </el-col>
          </el-row>
        </div>
      </el-col>
      <el-col :xs="24" :lg="8">
        <div class="data-card">
          <div class="card-header">
            <h3>快速操作</h3>
          </div>
          <div class="quick-actions">
            <div v-permission="'simulation:update'" class="quick-actions-inner">
              <el-button type="primary" plain @click="handleQuickGenerate('light')">
                <el-icon><Lightning /></el-icon>
                轻量生成 (100条)
              </el-button>
              <el-button type="success" plain @click="handleQuickGenerate('normal')">
                <el-icon><DataLine /></el-icon>
                标准生成 (500条)
              </el-button>
              <el-button type="warning" plain @click="handleQuickGenerate('heavy')">
                <el-icon><Histogram /></el-icon>
                大量生成 (2000条)
              </el-button>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 停车场状态模拟 -->
    <div class="data-card">
      <div class="card-header">
        <h3>停车场状态模拟</h3>
        <el-select v-model="selectedParking" placeholder="选择停车场" size="small" style="width: 180px" @change="handleParkingChange">
          <el-option v-for="item in parkingOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </div>
      <div v-if="currentParking" class="parking-simulation">
        <div class="parking-info">
          <div class="info-item">
            <span class="label">停车场:</span>
            <span class="value">{{ currentParking.name }}</span>
          </div>
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
        </div>
        <div v-permission="'simulation:update'" class="space-grid">
          <div 
            v-for="space in currentParking.spaces" 
            :key="space.id"
            class="space-item"
            :class="space.status"
            @click="handleSpaceClick(space)"
          >
            <span class="space-number">{{ space.number }}</span>
            <el-icon v-if="space.status === 'occupied'" class="car-icon"><Van /></el-icon>
          </div>
        </div>
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
          <div class="legend-item">
            <div class="dot maintenance"></div>
            <span>维护</span>
          </div>
        </div>
      </div>
      <el-empty v-else description="请选择停车场" />
    </div>

    <!-- 生成模拟数据对话框 -->
    <el-dialog
      v-model="showGenerateDialog"
      title="生成模拟数据"
      width="500px"
      destroy-on-close
    >
      <el-form :model="generateForm" label-width="100px">
        <el-form-item label="数据类型">
          <el-checkbox-group v-model="generateForm.types">
            <el-checkbox label="records">停车记录</el-checkbox>
            <el-checkbox label="income">收入数据</el-checkbox>
            <el-checkbox label="occupancy">占用状态</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="停车场">
          <el-select v-model="generateForm.parkingId" placeholder="选择停车场" clearable style="width: 100%">
            <el-option label="全部停车场" value="" />
            <el-option v-for="item in parkingOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="记录数量">
          <el-slider v-model="generateForm.count" :min="10" :max="5000" :step="10" show-stops />
          <span class="slider-value">{{ generateForm.count }} 条</span>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="generateForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
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

    <!-- 车位状态操作对话框 -->
    <el-dialog
      v-model="showSpaceDialog"
      title="车位状态操作"
      width="400px"
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
        <div v-permission="'simulation:update'" class="action-buttons">
          <el-button 
            v-for="status in ['available', 'occupied', 'reserved', 'maintenance']" 
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

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Refresh,
  Delete,
  Lightning,
  DataLine,
  Histogram,
  Van
} from '@element-plus/icons-vue'
import {
  generateSimulationData,
  updateSimulationStatus,
  resetSimulation,
  clearSimulation
} from '@/api/simulation'

const loading = ref(false)
const generating = ref(false)
const showGenerateDialog = ref(false)
const showSpaceDialog = ref(false)
const selectedParking = ref('')
const selectedSpace = ref(null)

// 停车场选项
const parkingOptions = ref([])

// 当前停车场数据
const currentParking = ref(null)

// 模拟数据概览
const overview = ref({
  totalRecords: 0,
  todayRecords: 0,
  activeSpaces: 0,
  totalIncome: 0,
  avgDuration: 0,
  lastGenerateTime: null
})

// 模拟状态
const simulationStatus = computed(() => {
  if (overview.value.totalRecords === 0) {
    return { type: 'info', text: '未生成' }
  }
  if (overview.value.activeSpaces > 0) {
    return { type: 'success', text: '运行中' }
  }
  return { type: 'warning', text: '空闲' }
})

// 生成表单
const generateForm = ref({
  types: ['records', 'income'],
  parkingId: '',
  count: 100,
  dateRange: null
})

// 获取状态类型
function getStatusType(status) {
  const map = {
    available: 'success',
    occupied: 'danger',
    reserved: 'warning',
    maintenance: 'info'
  }
  return map[status] || 'info'
}

// 获取状态文本
function getStatusText(status) {
  const map = {
    available: '空闲',
    occupied: '占用',
    reserved: '预约',
    maintenance: '维护'
  }
  return map[status] || status
}

// 处理停车场选择
async function handleParkingChange() {
  if (!selectedParking.value) {
    currentParking.value = null
    return
  }
  // 从API加载停车场数据
  try {
    const { getParkingDetail } = await import('@/api/parking')
    const res = await getParkingDetail(selectedParking.value)
    if (res.code === 200 && res.data) {
      const parking = res.data
      currentParking.value = {
        id: parking.id,
        name: parking.name,
        totalSpaces: parking.totalSpaces || 0,
        availableSpaces: parking.availableSpaces || 0,
        occupiedSpaces: parking.occupiedSpaces || 0,
        reservedSpaces: parking.reservedSpaces || 0,
        maintenanceSpaces: parking.maintenanceSpaces || 0,
        spaces: parking.spaces || []
      }
    }
  } catch (error) {
    console.error('加载停车场数据失败:', error)
    ElMessage.error('加载停车场数据失败')
  }
}

// 处理车位点击
function handleSpaceClick(space) {
  selectedSpace.value = space
  showSpaceDialog.value = true
}

// 更新车位状态
async function handleUpdateSpaceStatus(status) {
  if (!selectedSpace.value) return
  
  try {
    await updateSimulationStatus({
      spaceId: selectedSpace.value.id,
      status: status
    })
    selectedSpace.value.status = status
    
    // 更新统计
    if (currentParking.value) {
      const spaces = currentParking.value.spaces
      currentParking.value.occupiedSpaces = spaces.filter(s => s.status === 'occupied').length
      currentParking.value.availableSpaces = spaces.filter(s => s.status === 'available').length
      currentParking.value.reservedSpaces = spaces.filter(s => s.status === 'reserved').length
      currentParking.value.maintenanceSpaces = spaces.filter(s => s.status === 'maintenance').length
    }
    
    ElMessage.success('状态更新成功')
    showSpaceDialog.value = false
  } catch (error) {
    console.error('更新状态失败:', error)
    ElMessage.error('更新状态失败')
  }
}

// 生成模拟数据
async function handleGenerate() {
  if (generateForm.value.types.length === 0) {
    ElMessage.warning('请至少选择一种数据类型')
    return
  }
  
  generating.value = true
  try {
    const res = await generateSimulationData({
      types: generateForm.value.types,
      parkingId: generateForm.value.parkingId || undefined,
      count: generateForm.value.count,
      startDate: generateForm.value.dateRange?.[0],
      endDate: generateForm.value.dateRange?.[1]
    })
    
    if (res.code === 200) {
      ElMessage.success(`成功生成 ${res.data?.count || generateForm.value.count} 条模拟数据`)
      showGenerateDialog.value = false
      fetchOverview()
    }
  } catch (error) {
    console.error('生成数据失败:', error)
    ElMessage.error('生成数据失败')
  } finally {
    generating.value = false
  }
}

// 快速生成
async function handleQuickGenerate(type) {
  const countMap = { light: 100, normal: 500, heavy: 2000 }
  const count = countMap[type]
  
  try {
    await ElMessageBox.confirm(
      `确定要生成 ${count} 条模拟数据吗？`,
      '确认生成',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    )
    
    generating.value = true
    const res = await generateSimulationData({
      types: ['records', 'income', 'occupancy'],
      count: count
    })
    
    if (res.code === 200) {
      ElMessage.success(`成功生成 ${count} 条模拟数据`)
      fetchOverview()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('生成数据失败:', error)
      ElMessage.error('生成数据失败')
    }
  } finally {
    generating.value = false
  }
}

// 重置停车场状态
async function handleReset() {
  try {
    await ElMessageBox.confirm(
      '确定要重置所有停车场的车位状态吗？此操作将清空所有占用状态。',
      '确认重置',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    )
    
    const res = await resetSimulation('all')
    if (res.code === 200) {
      ElMessage.success('重置成功')
      if (currentParking.value) {
        handleParkingChange()
      }
      fetchOverview()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('重置失败:', error)
      ElMessage.error('重置失败')
    }
  }
}

// 清除模拟数据
async function handleClear() {
  try {
    await ElMessageBox.confirm(
      '确定要清除所有模拟数据吗？此操作不可恢复。',
      '确认清除',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'danger' }
    )
    
    const res = await clearSimulation('all')
    if (res.code === 200) {
      ElMessage.success('清除成功')
      fetchOverview()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('清除失败:', error)
      ElMessage.error('清除失败')
    }
  }
}

// 获取概览数据
async function fetchOverview() {
  try {
    const { getSummaryAnalysis } = await import('@/api/analytics')
    const res = await getSummaryAnalysis()
    if (res.code === 200 && res.data) {
      const data = res.data
      overview.value = {
        totalRecords: data.totalRecords || 0,
        todayRecords: data.todayRecords || 0,
        activeSpaces: data.activeSpaces || 0,
        totalIncome: data.totalIncome || 0,
        avgDuration: data.avgDuration || 0,
        lastGenerateTime: data.lastGenerateTime || null
      }
    }
  } catch (error) {
    console.error('获取概览数据失败:', error)
  }
}

// 加载停车场列表
async function loadParkingList() {
  try {
    const { getParkingPage } = await import('@/api/parking')
    const res = await getParkingPage({ pageNo: 1, pageSize: 1000 })
    if (res.code === 200 && res.data) {
      parkingOptions.value = (res.data.records || []).map(p => ({
        label: p.name,
        value: p.id
      }))
    }
  } catch (error) {
    console.error('加载停车场列表失败:', error)
  }
}

onMounted(() => {
  fetchOverview()
  loadParkingList()
})
</script>

<style scoped lang="scss">
.simulation-page {
  padding: var(--space-6);
  max-width: 1600px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: var(--space-6);
  
  h2 {
    margin: 0 0 8px 0;
    font-size: var(--text-2xl);
    font-weight: var(--font-bold);
    color: var(--text-primary);
  }
  
  .subtitle {
    margin: 0;
    color: var(--text-muted);
    font-size: var(--text-sm);
  }
}

.operation-cards {
  margin-bottom: var(--space-6);
}

.operation-card {
  background: var(--glass-bg);
  backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  padding: 24px;
  text-align: center;
  box-shadow: var(--shadow-lg);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-xl);
    border-color: var(--glass-border-hover);
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
    
    &.primary {
      background: linear-gradient(135deg, var(--primary-500), var(--primary-400));
      box-shadow: var(--shadow-glow-primary);
    }
    
    &.warning {
      background: linear-gradient(135deg, var(--warning-500), var(--warning-400));
    }
    
    &.danger {
      background: linear-gradient(135deg, var(--accent-500), var(--accent-400));
      box-shadow: var(--shadow-glow-accent);
    }
  }
  
  h3 {
    margin: 0 0 8px 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
  }
  
  p {
    margin: 0 0 16px 0;
    color: var(--text-muted);
    font-size: 14px;
  }
}

.overview-row {
  margin-bottom: var(--space-6);
}

.data-card {
  background: var(--glass-bg);
  backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  padding: 20px;
  box-shadow: var(--shadow-lg);
  height: 100%;
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    
    h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: var(--text-primary);
    }
  }
}

.stats-row {
  margin-bottom: 16px;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.stat-item {
  text-align: center;
  padding: 16px;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  
  .stat-value {
    font-size: 20px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 4px;
  }
  
  .stat-label {
    font-size: 12px;
    color: var(--text-muted);
  }
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .quick-actions-inner {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .el-button {
    justify-content: flex-start;
    padding: 12px 16px;
    
    .el-icon {
      margin-right: 8px;
    }
  }
}

.parking-simulation {
  .parking-info {
    display: flex;
    gap: 24px;
    margin-bottom: 20px;
    padding: 16px;
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-lg);
    
    .info-item {
      .label {
        color: var(--text-muted);
        font-size: 12px;
        margin-right: 4px;
      }
      
      .value {
        font-weight: 600;
        color: var(--text-primary);
        
        &.success {
          color: var(--secondary-400);
        }
        
        &.danger {
          color: var(--accent-400);
        }
      }
    }
  }
  
  .space-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
    gap: 8px;
    margin-bottom: 20px;
    max-height: 300px;
    overflow-y: auto;
    padding: 8px;
    
    .space-item {
      aspect-ratio: 1;
      border-radius: var(--radius-md);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
      
      &.available {
        background: var(--primary-surface);
        border: 2px solid var(--primary-400);
        
        &:hover {
          background: var(--primary-surface-strong);
        }
      }
      
      &.occupied {
        background: var(--accent-surface);
        border: 2px solid var(--accent-400);
        
        &:hover {
          background: var(--accent-surface-strong);
        }
      }
      
      &.reserved {
        background: var(--warning-surface);
        border: 2px solid var(--warning-400);
        
        &:hover {
          background: var(--warning-surface-strong);
        }
      }
      
      &.maintenance {
        background: var(--neutral-surface);
        border: 2px solid var(--text-muted);
        
        &:hover {
          background: var(--neutral-surface-strong);
        }
      }
      
      .space-number {
        font-size: 12px;
        font-weight: 600;
        color: var(--text-secondary);
      }
      
      .car-icon {
        position: absolute;
        font-size: 20px;
        color: var(--accent-400);
      }
    }
  }
  
  .legend {
    display: flex;
    justify-content: center;
    gap: 24px;
    
    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
      
      .dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        
        &.available {
          background: var(--primary-400);
        }
        
        &.occupied {
          background: var(--accent-400);
        }
        
        &.reserved {
          background: var(--warning-400);
        }
        
        &.maintenance {
          background: var(--text-muted);
        }
      }
      
      span {
        font-size: 12px;
        color: var(--text-secondary);
      }
    }
  }
}

.slider-value {
  margin-left: 12px;
  color: var(--text-secondary);
  font-size: 14px;
}

.space-dialog-content {
  .space-detail {
    margin-bottom: 20px;
    padding: 16px;
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-lg);
    
    .detail-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      
      &:last-child {
        margin-bottom: 0;
      }
      
      .label {
        color: var(--text-muted);
      }
      
      .value {
        font-weight: 600;
        color: var(--text-primary);
      }
    }
  }
  
  .action-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    
    .el-button {
      flex: 1;
      min-width: 80px;
    }
  }
}

@media (max-width: 768px) {
  .operation-card {
    margin-bottom: 16px;
  }
  
  .parking-info {
    flex-wrap: wrap;
    gap: 12px !important;
  }
  
  .space-grid {
    grid-template-columns: repeat(auto-fill, minmax(50px, 1fr)) !important;
  }
}
</style>
