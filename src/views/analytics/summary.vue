<template>
  <div class="analytics-summary-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">
          <span class="title-icon">
            <el-icon><DataLine /></el-icon>
          </span>
          运营汇总
        </h1>
        <p class="page-subtitle">查看系统整体运营数据指标</p>
      </div>
      <div class="header-actions">
        <button class="export-btn" v-permission="'analytics:summary:export'" @click="handleExport">
          <el-icon><Download /></el-icon>
          <span>导出报表</span>
        </button>
      </div>
    </div>

    <!-- 筛选卡片 -->
    <div class="filter-card">
      <div class="filter-row">
        <div class="filter-group">
          <div class="filter-item">
            <span class="filter-label">停车场</span>
            <el-select
              v-model="filterForm.parkingId"
              placeholder="全部停车场"
              clearable
              @change="handleSearch"
              style="width: 200px"
            >
              <el-option
                v-for="item in parkingList"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </el-select>
          </div>
          <div class="filter-item">
            <span class="filter-label">开始日期</span>
            <el-date-picker
              v-model="filterForm.startDate"
              type="date"
              placeholder="选择开始日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              @change="handleSearch"
              style="width: 160px"
            />
          </div>
          <div class="filter-item">
            <span class="filter-label">结束日期</span>
            <el-date-picker
              v-model="filterForm.endDate"
              type="date"
              placeholder="选择结束日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              @change="handleSearch"
              style="width: 160px"
            />
          </div>
        </div>
        <div class="filter-actions">
          <button class="filter-btn" @click="handleReset">
            <el-icon><Refresh /></el-icon>
            <span>重置</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 数据概览卡片 -->
    <div class="stats-grid">
      <div class="stat-card" v-for="(card, index) in statCards" :key="index" :class="card.type">
        <div class="card-glow"></div>
        <div class="card-content">
          <div class="card-icon">
            <el-icon>
              <component :is="card.icon" />
            </el-icon>
          </div>
          <div class="card-info">
            <span class="card-label">{{ card.label }}</span>
            <span class="card-value">{{ card.value }}</span>
          </div>
        </div>
        <div class="card-footer" v-if="card.trend !== undefined">
          <span class="trend" :class="card.trend >= 0 ? 'up' : 'down'">
            <el-icon><component :is="card.trend >= 0 ? 'ArrowUp' : 'ArrowDown'" /></el-icon>
            {{ Math.abs(card.trend) }}%
          </span>
          <span class="trend-label">较上期</span>
        </div>
      </div>
    </div>

    <!-- 分析周期 -->
    <div class="period-info" v-if="summaryData.analysisPeriod">
      <el-icon><Calendar /></el-icon>
      <span>分析周期：{{ summaryData.analysisPeriod }}</span>
    </div>

    <!-- 图表区域 -->
    <div class="charts-grid">
      <!-- 收入趋势图 -->
      <div class="chart-card">
        <div class="chart-header">
          <h3 class="chart-title">
            <el-icon><TrendCharts /></el-icon>
            收入趋势
          </h3>
        </div>
        <div ref="incomeChartRef" class="chart-container"></div>
      </div>

      <!-- 车辆进出趋势图 -->
      <div class="chart-card">
        <div class="chart-header">
          <h3 class="chart-title">
            <el-icon><Van /></el-icon>
            车辆进出趋势
          </h3>
        </div>
        <div ref="vehicleChartRef" class="chart-container"></div>
      </div>
    </div>

    <!-- 停车场对比表格 -->
    <div class="table-card">
      <div class="table-header">
        <h3 class="table-title">
          <el-icon><OfficeBuilding /></el-icon>
          各停车场运营数据
        </h3>
      </div>
      <el-table
        v-loading="loading"
        :data="parkingStats"
        stripe
        class="custom-table"
      >
        <el-table-column type="index" width="60" align="center" label="序号" />
        <el-table-column prop="parkingName" label="停车场名称" min-width="150">
          <template #default="{ row }">
            <div class="parking-name">
              <el-icon><OfficeBuilding /></el-icon>
              <span>{{ row.parkingName }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="totalSpaces" label="总车位" width="100" align="center" />
        <el-table-column prop="activeVehicles" label="在场车辆" width="100" align="center">
          <template #default="{ row }">
            <span class="highlight-value">{{ row.activeVehicles }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="totalEntries" label="入场次数" width="100" align="center" />
        <el-table-column prop="totalExits" label="出场次数" width="100" align="center" />
        <el-table-column prop="totalIncome" label="总收入" width="120" align="right">
          <template #default="{ row }">
            <span class="income-value">¥{{ formatMoney(row.totalIncome) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="utilizationRate" label="利用率" width="100" align="center">
          <template #default="{ row }">
            <div class="utilization-bar">
              <div class="bar-bg">
                <div class="bar-fill" :style="{ width: `${Math.min(row.utilizationRate, 100)}%` }"></div>
              </div>
              <span class="bar-value">{{ row.utilizationRate?.toFixed(1) || 0 }}%</span>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import { getSummaryAnalysis, exportSummary } from '@/api/analytics'
import { getParkingPage } from '@/api/parking'

const loading = ref(false)
const incomeChartRef = ref(null)
const vehicleChartRef = ref(null)
let incomeChart = null
let vehicleChart = null

const summaryData = reactive({
  totalParkings: 0,
  totalSpaces: 0,
  totalEntries: 0,
  totalExits: 0,
  activeVehicles: 0,
  totalIncome: 0,
  totalTransactions: 0,
  averageTransactionAmount: 0,
  analysisPeriod: ''
})

const parkingStats = ref([])
const parkingList = ref([])

const filterForm = reactive({
  parkingId: null,
  startDate: '',
  endDate: ''
})

// 设置默认日期范围（最近30天）
function setDefaultDateRange() {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 30)
  filterForm.endDate = end.toISOString().split('T')[0]
  filterForm.startDate = start.toISOString().split('T')[0]
}

const statCards = computed(() => [
  {
    label: '停车场总数',
    value: summaryData.totalParkings,
    icon: 'OfficeBuilding',
    type: 'primary'
  },
  {
    label: '车位总数',
    value: summaryData.totalSpaces,
    icon: 'Grid',
    type: 'info'
  },
  {
    label: '总入场次数',
    value: summaryData.totalEntries,
    icon: 'ArrowRight',
    type: 'success'
  },
  {
    label: '总出场次数',
    value: summaryData.totalExits,
    icon: 'ArrowLeft',
    type: 'warning'
  },
  {
    label: '当前在场车辆',
    value: summaryData.activeVehicles,
    icon: 'Van',
    type: 'danger'
  },
  {
    label: '总收入',
    value: `¥${formatMoney(summaryData.totalIncome)}`,
    icon: 'Money',
    type: 'primary'
  }
])

async function loadParkingList() {
  try {
    const res = await getParkingPage({ pageNo: 1, pageSize: 1000 })
    if (res.code === 200) {
      parkingList.value = res.data.records || []
    }
  } catch (error) {
    console.error('加载停车场列表失败:', error)
  }
}

async function loadData() {
  loading.value = true
  try {
    const params = {}
    if (filterForm.parkingId) params.parkingId = filterForm.parkingId
    if (filterForm.startDate) params.startDate = filterForm.startDate
    if (filterForm.endDate) params.endDate = filterForm.endDate

    const res = await getSummaryAnalysis(params)
    if (res.code === 200) {
      const data = res.data || {}
      Object.assign(summaryData, data)
      parkingStats.value = data.parkingStats || []
      updateCharts()
    }
  } catch (error) {
    console.error('加载数据失败:', error)
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  loadData()
}

function handleReset() {
  filterForm.parkingId = null
  setDefaultDateRange()
  loadData()
}

async function handleExport() {
  try {
    const data = {
      startDate: filterForm.startDate,
      endDate: filterForm.endDate,
      parkingId: filterForm.parkingId
    }
    const res = await exportSummary(data)
    const blob = new Blob([res], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `运营汇总_${new Date().toISOString().split('T')[0]}.xlsx`
    link.click()
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

function formatMoney(amount) {
  if (amount === undefined || amount === null) return '0.00'
  return Number(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

function initCharts() {
  if (incomeChartRef.value) {
    incomeChart = echarts.init(incomeChartRef.value)
  }
  if (vehicleChartRef.value) {
    vehicleChart = echarts.init(vehicleChartRef.value)
  }

  window.addEventListener('resize', handleResize)
}

function handleResize() {
  incomeChart?.resize()
  vehicleChart?.resize()
}

function updateCharts() {
  if (!incomeChart || !vehicleChart) return

  // 从API返回的数据中获取图表数据
  const dates = summaryData.incomeTrend?.map(item => item.date) || []
  const incomeData = summaryData.incomeTrend?.map(item => item.value) || []
  const entryData = summaryData.entryTrend?.map(item => item.value) || []
  const exitData = summaryData.exitTrend?.map(item => item.value) || []

  // 如果没有数据，使用空数组
  if (dates.length === 0) {
    const start = new Date(filterForm.startDate || new Date().setDate(new Date().getDate() - 30))
    const end = new Date(filterForm.endDate || new Date())
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(d.toISOString().split('T')[0])
      incomeData.push(0)
      entryData.push(0)
      exitData.push(0)
    }
  }

  // 收入趋势图
  incomeChart.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.2)' } },
      axisLabel: { color: 'rgba(255,255,255,0.6)' }
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.2)' } },
      axisLabel: { color: 'rgba(255,255,255,0.6)' },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }
    },
    series: [{
      name: '收入',
      type: 'line',
      smooth: true,
      data: incomeData,
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(99, 102, 241, 0.5)' },
          { offset: 1, color: 'rgba(99, 102, 241, 0.05)' }
        ])
      },
      lineStyle: { color: '#6366f1', width: 3 },
      itemStyle: { color: '#6366f1' }
    }]
  })

  // 车辆进出趋势图
  vehicleChart.setOption({
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['入场', '出场'],
      textStyle: { color: 'rgba(255,255,255,0.6)' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.2)' } },
      axisLabel: { color: 'rgba(255,255,255,0.6)' }
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.2)' } },
      axisLabel: { color: 'rgba(255,255,255,0.6)' },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }
    },
    series: [
      {
        name: '入场',
        type: 'bar',
        data: entryData,
        itemStyle: { color: '#10b981' }
      },
      {
        name: '出场',
        type: 'bar',
        data: exitData,
        itemStyle: { color: '#f59e0b' }
      }
    ]
  })
}

onMounted(() => {
  setDefaultDateRange()
  loadParkingList()
  loadData()
  initCharts()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  incomeChart?.dispose()
  vehicleChart?.dispose()
})
</script>

<style lang="scss" scoped>
.analytics-summary-page {
  padding: var(--space-6);
  max-width: 1600px;
  margin: 0 auto;
}

// 页面标题
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-6);

  .header-content {
    .page-title {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      font-family: var(--font-display);
      font-size: var(--text-2xl);
      font-weight: var(--font-bold);
      color: var(--text-primary);
      margin-bottom: var(--space-2);

      .title-icon {
        width: 44px;
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-glow-primary);

        .el-icon {
          font-size: 22px;
          color: white;
        }
      }
    }

    .page-subtitle {
      font-size: var(--text-sm);
      color: var(--text-tertiary);
      padding-left: calc(44px + var(--space-3));
    }
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .export-btn {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-5);
    font-size: var(--text-sm);
    font-weight: var(--font-semibold);
    color: white;
    background: linear-gradient(135deg, var(--secondary-500), var(--secondary-600));
    border: none;
    border-radius: var(--radius-lg);
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 0 20px rgba(16, 185, 129, 0.3);

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(16, 185, 129, 0.5);
    }

    .el-icon {
      font-size: 16px;
    }
  }
}

// 筛选卡片
.filter-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  margin-bottom: var(--space-6);

  .filter-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);

    @media (max-width: 768px) {
      flex-direction: column;
      align-items: stretch;
    }
  }

  .filter-group {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    flex: 1;
    flex-wrap: wrap;

    @media (max-width: 768px) {
      flex-direction: column;
      align-items: stretch;
    }
  }

  .filter-item {
    display: flex;
    align-items: center;
    gap: var(--space-2);

    .filter-label {
      font-size: var(--text-sm);
      color: var(--text-secondary);
      white-space: nowrap;
    }
  }

  .filter-actions {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .filter-btn {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-4);
    font-size: var(--text-sm);
    font-weight: var(--font-medium);
    color: var(--text-secondary);
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: var(--radius-lg);
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.2);
      color: var(--text-primary);
    }

    .el-icon {
      font-size: 14px;
    }
  }
}

// 统计卡片网格
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--space-5);
  margin-bottom: var(--space-6);
}

.stat-card {
  position: relative;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  overflow: hidden;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    border-color: rgba(255, 255, 255, 0.2);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);

    .card-glow {
      opacity: 0.1;
    }
  }

  .card-glow {
    position: absolute;
    top: -50%;
    right: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, var(--primary-500) 0%, transparent 70%);
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
  }

  .card-content {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    position: relative;
    z-index: 1;

    .card-icon {
      width: 56px;
      height: 56px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(99, 102, 241, 0.15);
      border-radius: var(--radius-lg);

      .el-icon {
        font-size: 28px;
        color: var(--primary-400);
      }
    }

    .card-info {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);

      .card-label {
        font-size: var(--text-sm);
        color: var(--text-tertiary);
      }

      .card-value {
        font-family: var(--font-display);
        font-size: var(--text-2xl);
        font-weight: var(--font-bold);
        color: var(--text-primary);
      }
    }
  }

  .card-footer {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-top: var(--space-4);
    padding-top: var(--space-4);
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    position: relative;
    z-index: 1;

    .trend {
      display: flex;
      align-items: center;
      gap: var(--space-1);
      font-size: var(--text-sm);
      font-weight: var(--font-semibold);

      &.up {
        color: var(--secondary-400);
      }

      &.down {
        color: var(--accent-400);
      }

      .el-icon {
        font-size: 14px;
      }
    }

    .trend-label {
      font-size: var(--text-xs);
      color: var(--text-muted);
    }
  }

  &.primary .card-icon {
    background: rgba(99, 102, 241, 0.15);
    .el-icon { color: var(--primary-400); }
  }

  &.info .card-icon {
    background: rgba(59, 130, 246, 0.15);
    .el-icon { color: #60a5fa; }
  }

  &.success .card-icon {
    background: rgba(16, 185, 129, 0.15);
    .el-icon { color: var(--secondary-400); }
  }

  &.warning .card-icon {
    background: rgba(245, 158, 11, 0.15);
    .el-icon { color: var(--warning-400); }
  }

  &.danger .card-icon {
    background: rgba(244, 63, 94, 0.15);
    .el-icon { color: var(--accent-400); }
  }
}

// 分析周期
.period-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-4);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-6);

  .el-icon {
    font-size: 16px;
    color: var(--primary-400);
  }

  span {
    font-size: var(--text-sm);
    color: var(--text-secondary);
  }
}

// 图表网格
.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: var(--space-5);
  margin-bottom: var(--space-6);

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.chart-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-xl);
  padding: var(--space-5);

  .chart-header {
    margin-bottom: var(--space-4);

    .chart-title {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--text-lg);
      font-weight: var(--font-semibold);
      color: var(--text-primary);

      .el-icon {
        font-size: 20px;
        color: var(--primary-400);
      }
    }
  }

  .chart-container {
    height: 300px;
  }
}

// 表格卡片
.table-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  overflow: hidden;

  .table-header {
    margin-bottom: var(--space-4);

    .table-title {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--text-lg);
      font-weight: var(--font-semibold);
      color: var(--text-primary);

      .el-icon {
        font-size: 20px;
        color: var(--primary-400);
      }
    }
  }
}

// 自定义表格
.custom-table {
  background: transparent;

  :deep(.el-table__header) {
    th {
      background: rgba(255, 255, 255, 0.05);
      color: var(--text-secondary);
      font-weight: var(--font-semibold);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
  }

  :deep(.el-table__row) {
    background: transparent;

    &:hover {
      background: rgba(255, 255, 255, 0.03);
    }

    td {
      color: var(--text-primary);
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }
  }
}

// 停车场名称
.parking-name {
  display: flex;
  align-items: center;
  gap: var(--space-2);

  .el-icon {
    font-size: 16px;
    color: var(--primary-400);
  }
}

// 高亮值
.highlight-value {
  font-weight: var(--font-semibold);
  color: var(--warning-400);
}

// 收入值
.income-value {
  font-weight: var(--font-semibold);
  color: var(--secondary-400);
}

// 利用率进度条
.utilization-bar {
  display: flex;
  align-items: center;
  gap: var(--space-2);

  .bar-bg {
    flex: 1;
    height: 8px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: var(--radius-full);
    overflow: hidden;

    .bar-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--primary-500), var(--primary-400));
      border-radius: var(--radius-full);
      transition: width 0.5s ease;
    }
  }

  .bar-value {
    font-size: var(--text-xs);
    color: var(--text-muted);
    min-width: 40px;
    text-align: right;
  }
}

// 响应式
@media (max-width: 768px) {
  .analytics-summary-page {
    padding: var(--space-4);
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .charts-grid {
    grid-template-columns: 1fr;
  }
}
</style>
