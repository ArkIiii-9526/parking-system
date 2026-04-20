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
        <span v-if="exportFormatOptions.length > 1" class="format-hint">
          <span class="format-label">导出格式</span>
          <el-select v-model="exportFormat" size="small" style="width: 100px">
            <el-option v-for="f in exportFormatOptions" :key="f" :label="f" :value="f" />
          </el-select>
        </span>
        <el-tooltip v-else-if="exportFormatOptions.length" :content="`支持格式: ${exportFormatOptions.join(', ')}`" placement="top">
          <span class="format-badge">{{ exportFormatOptions[0] }}</span>
        </el-tooltip>
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
import {
  getSummaryAnalysis,
  getTrendAnalysis,
  getTurnoverAnalysis,
  getIncomeAnalysis,
  getUtilizationAnalysis,
  exportSummary
} from '@/api/analytics'
import { getParkingPage } from '@/api/parking'
import { createAreaGradient, getAnalyticsTheme, observeThemeChange } from '@/utils/analyticsTheme'
import {
  loadAnalyticsExportFormats,
  appendFormatToPayload,
  exportBlobMimeType,
  exportFileExtension
} from '@/utils/analyticsExportFormats'
import { enumerateLocalDates, formatLocalDate, getRecentDateRange } from '@/utils/localDate'

const loading = ref(false)
const incomeChartRef = ref(null)
const vehicleChartRef = ref(null)
let incomeChart = null
let vehicleChart = null
let stopThemeObserver = null

const summaryData = reactive({
  totalParkings: 0,
  totalSpaces: 0,
  totalEntries: 0,
  totalExits: 0,
  activeVehicles: 0,
  totalIncome: 0,
  totalTransactions: 0,
  averageTransactionAmount: 0,
  analysisPeriod: '',
  incomeTrend: [],
  entryTrend: [],
  exitTrend: []
})

const parkingStats = ref([])
const parkingList = ref([])

const exportFormatOptions = ref([])
const exportFormat = ref('excel')

const filterForm = reactive({
  parkingId: null,
  startDate: '',
  endDate: ''
})

function buildQueryParams() {
  const params = {}
  if (filterForm.parkingId) params.parkingId = filterForm.parkingId
  if (filterForm.startDate) params.startDate = filterForm.startDate
  if (filterForm.endDate) params.endDate = filterForm.endDate
  return params
}

function normalizeNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function setDefaultDateRange() {
  const { startDate, endDate } = getRecentDateRange(30)
  filterForm.startDate = startDate
  filterForm.endDate = endDate
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
      parkingList.value = Array.isArray(res.data?.records) ? res.data.records : []
    }
  } catch (error) {
    console.error('加载停车场列表失败:', error)
  }
}

function buildTrendSeries(trendData) {
  const dateLabels = Array.isArray(trendData?.dateLabels) ? trendData.dateLabels : []
  const entryCounts = Array.isArray(trendData?.entryCounts) ? trendData.entryCounts : []
  const exitCounts = Array.isArray(trendData?.exitCounts) ? trendData.exitCounts : []
  const incomeTrend = Array.isArray(trendData?.incomeTrend) ? trendData.incomeTrend : []

  return {
    incomeTrend: dateLabels.map((date, index) => ({
      date,
      value: normalizeNumber(incomeTrend[index])
    })),
    entryTrend: dateLabels.map((date, index) => ({
      date,
      value: normalizeNumber(entryCounts[index])
    })),
    exitTrend: dateLabels.map((date, index) => ({
      date,
      value: normalizeNumber(exitCounts[index])
    }))
  }
}

function buildParkingStats(turnoverList, utilizationList, incomeData) {
  const incomeByParking = incomeData?.incomeByParking || {}
  const turnoverMap = new Map((turnoverList || []).map(item => [String(item.parkingId), item]))
  const utilizationMap = new Map((utilizationList || []).map(item => [String(item.parkingId), item]))

  const selectedParkings = filterForm.parkingId
    ? parkingList.value.filter(item => String(item.id) === String(filterForm.parkingId))
    : parkingList.value

  return selectedParkings.map(parking => {
    const key = String(parking.id)
    const turnover = turnoverMap.get(key)
    const utilization = utilizationMap.get(key)
    const totalSpaces = normalizeNumber(parking.totalSpaces) || normalizeNumber(turnover?.totalSpaces)
    const activeVehicles = normalizeNumber(utilization?.occupiedSpaces) || Math.max(totalSpaces - normalizeNumber(parking.availableSpaces), 0)
    const utilizationRate = totalSpaces > 0
      ? Number(((activeVehicles / totalSpaces) * 100).toFixed(2))
      : normalizeNumber(utilization?.utilizationRate)

    return {
      parkingId: parking.id,
      parkingName: parking.name,
      totalSpaces,
      activeVehicles,
      totalEntries: normalizeNumber(turnover?.totalEntries),
      totalExits: normalizeNumber(turnover?.totalExits),
      totalIncome: normalizeNumber(incomeByParking[key] ?? incomeByParking[parking.id]),
      utilizationRate
    }
  }).sort((left, right) => right.totalIncome - left.totalIncome || right.totalEntries - left.totalEntries)
}

function applySummaryData(summary, trend, turnover, utilization, income) {
  const selectedParkings = filterForm.parkingId
    ? parkingList.value.filter(item => String(item.id) === String(filterForm.parkingId))
    : parkingList.value
  const totalSpacesFromParking = selectedParkings.reduce((sum, item) => sum + normalizeNumber(item.totalSpaces), 0)
  const utilizationMap = new Map((utilization || []).map(item => [String(item.parkingId), item]))
  const activeVehiclesFromParking = selectedParkings.reduce((sum, item) => {
    const utilizationItem = utilizationMap.get(String(item.id))
    if (utilizationItem) {
      return sum + normalizeNumber(utilizationItem.occupiedSpaces)
    }
    return sum + Math.max(normalizeNumber(item.totalSpaces) - normalizeNumber(item.availableSpaces), 0)
  }, 0)
  const trendSeries = buildTrendSeries(trend)

  Object.assign(summaryData, {
    totalParkings: selectedParkings.length || normalizeNumber(summary?.totalParkings),
    totalSpaces: totalSpacesFromParking || normalizeNumber(summary?.totalSpaces),
    totalEntries: normalizeNumber(summary?.totalEntries),
    totalExits: normalizeNumber(summary?.totalExits),
    activeVehicles: activeVehiclesFromParking || normalizeNumber(summary?.activeVehicles),
    totalIncome: normalizeNumber(summary?.totalIncome),
    totalTransactions: normalizeNumber(summary?.totalTransactions),
    averageTransactionAmount: normalizeNumber(summary?.averageTransactionAmount),
    analysisPeriod: summary?.analysisPeriod || `${filterForm.startDate} 至 ${filterForm.endDate}`,
    ...trendSeries
  })

  parkingStats.value = buildParkingStats(turnover, utilization, income)
}

async function loadData() {
  loading.value = true
  try {
    const params = buildQueryParams()
    const trendParams = {
      ...params,
      periodType: 'day'
    }

    const [summaryRes, trendRes, turnoverRes, utilizationRes, incomeRes] = await Promise.all([
      getSummaryAnalysis(params),
      getTrendAnalysis(trendParams),
      getTurnoverAnalysis(params),
      getUtilizationAnalysis(),
      getIncomeAnalysis(params)
    ])

    applySummaryData(
      summaryRes?.data || {},
      trendRes?.data || {},
      turnoverRes?.data || [],
      utilizationRes?.data || [],
      incomeRes?.data || {}
    )
    updateCharts()
  } catch (error) {
    console.error('加载数据失败:', error)
    console.error('错误详情:', error.response?.data || error.message)
    console.error('请求 URL:', error.config?.url)
    console.error('HTTP 状态:', error.response?.status)
    ElMessage.error(`加载数据失败：${error.response?.data?.msg || error.message}`)
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
    let data = buildQueryParams()
    data = appendFormatToPayload(data, exportFormat.value)
    const res = await exportSummary(data)
    const raw = res?.data ?? res
    const blob =
      raw instanceof Blob
        ? raw
        : new Blob([raw], { type: exportBlobMimeType(exportFormat.value) })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    const ext = exportFileExtension(exportFormat.value)
    link.download = `运营汇总_${formatLocalDate()}.${ext}`
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
  const theme = getAnalyticsTheme()

  const dates = summaryData.incomeTrend.map(item => item.date)
  const incomeData = summaryData.incomeTrend.map(item => item.value)
  const entryData = summaryData.entryTrend.map(item => item.value)
  const exitData = summaryData.exitTrend.map(item => item.value)

  if (dates.length === 0) {
    const fallbackDates = enumerateLocalDates(
      filterForm.startDate || getRecentDateRange(30).startDate,
      filterForm.endDate || formatLocalDate()
    )
    fallbackDates.forEach(date => {
      dates.push(date)
      incomeData.push(0)
      entryData.push(0)
      exitData.push(0)
    })
  }

  incomeChart.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    legend: {
      data: ['收入'],
      textStyle: { color: theme.textSecondary },
      top: 0,
      right: 16
    },
    grid: {
      left: '3%',
      right: '4%',
      top: 40,
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLine: { lineStyle: { color: theme.axisLine } },
      axisLabel: { color: theme.textSecondary }
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: theme.axisLine } },
      axisLabel: { color: theme.textSecondary },
      splitLine: { lineStyle: { color: theme.splitLine } }
    },
    series: [{
      name: '收入',
      type: 'line',
      smooth: true,
      data: incomeData,
      areaStyle: {
        color: createAreaGradient(theme.primary, 0.45, 0.05)
      },
      lineStyle: { color: theme.primary, width: 3 },
      itemStyle: { color: theme.primary }
    }]
  })

  vehicleChart.setOption({
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['入场', '出场'],
      textStyle: { color: theme.textSecondary },
      top: 0,
      right: 16
    },
    grid: {
      left: '3%',
      right: '4%',
      top: 40,
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLine: { lineStyle: { color: theme.axisLine } },
      axisLabel: { color: theme.textSecondary }
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: theme.axisLine } },
      axisLabel: { color: theme.textSecondary },
      splitLine: { lineStyle: { color: theme.splitLine } }
    },
    series: [
      {
        name: '入场',
        type: 'bar',
        data: entryData,
        itemStyle: { color: theme.secondary }
      },
      {
        name: '出场',
        type: 'bar',
        data: exitData,
        itemStyle: { color: theme.warning }
      }
    ]
  })
}

onMounted(async () => {
  setDefaultDateRange()
  const fmts = await loadAnalyticsExportFormats()
  exportFormatOptions.value = fmts
  exportFormat.value = fmts[0] || 'excel'
  await loadParkingList()
  initCharts()
  await loadData()
  stopThemeObserver = observeThemeChange(updateCharts)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  stopThemeObserver?.()
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
    flex-wrap: wrap;
  }

  .format-hint {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    .format-label {
      font-size: var(--text-sm);
      color: var(--text-secondary);
    }
  }

  .format-badge {
    font-size: var(--text-xs);
    color: var(--text-tertiary);
    padding: 4px 8px;
    border-radius: var(--radius-md);
    background: var(--glass-bg);
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
    box-shadow: var(--shadow-glow-secondary);

    &:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg), var(--shadow-glow-secondary);
    }

    .el-icon {
      font-size: 16px;
    }
  }
}

// 筛选卡片
.filter-card {
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
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
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-lg);
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      background: var(--glass-bg-hover);
      border-color: var(--glass-border-hover);
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
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  overflow: hidden;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    border-color: var(--glass-border-hover);
    box-shadow: var(--shadow-xl);

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
    border-top: 1px solid var(--border-subtle);
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
    .el-icon { color: var(--primary-400); }
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
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
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
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
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
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
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
      background: var(--glass-bg);
      color: var(--text-secondary);
      font-weight: var(--font-semibold);
      border-bottom: 1px solid var(--border-subtle);
    }
  }

  :deep(.el-table__row) {
    background: transparent;

    &:hover {
      background: var(--glass-bg-hover);
    }

    td {
      color: var(--text-primary);
      border-bottom: 1px solid var(--border-subtle);
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
    background: var(--glass-bg-hover);
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
