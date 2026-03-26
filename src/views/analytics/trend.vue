<template>
  <div class="trend-analytics-page">
    <div class="page-header">
      <div class="header-title">
        <h2>趋势分析</h2>
        <p class="subtitle">分析停车场运营数据趋势，支持多维度对比</p>
      </div>
      <div class="header-actions">
        <el-radio-group v-model="timeRange" size="small" @change="handleTimeRangeChange">
          <el-radio-button label="7">近7天</el-radio-button>
          <el-radio-button label="30">近30天</el-radio-button>
          <el-radio-button label="90">近90天</el-radio-button>
        </el-radio-group>
        <el-select v-model="selectedParking" placeholder="选择停车场" size="small" style="width: 150px" clearable @change="handleParkingChange">
          <el-option label="全部停车场" value="" />
          <el-option v-for="item in parkingOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <el-select v-if="exportFormatOptions.length > 1" v-model="exportFormat" size="small" style="width: 100px">
          <el-option v-for="f in exportFormatOptions" :key="f" :label="f" :value="f" />
        </el-select>
        <el-tooltip v-else-if="exportFormatOptions.length" :content="`支持: ${exportFormatOptions.join(', ')}`">
          <span class="format-chip">{{ exportFormatOptions[0] }}</span>
        </el-tooltip>
        <el-button v-permission="'analytics:trend:export'" type="primary" :icon="Download" size="small" @click="handleExport">
          导出数据
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="16" class="stat-cards">
      <el-col :xs="24" :sm="12" :md="6" v-for="card in statCards" :key="card.label">
        <div class="stat-card" :class="card.type">
          <div class="card-icon">
            <el-icon :size="24">
              <component :is="card.icon" />
            </el-icon>
          </div>
          <div class="card-content">
            <div class="card-label">{{ card.label }}</div>
            <div class="card-value">{{ card.value }}</div>
            <div class="card-trend">
              <span class="trend-label">趋势</span>
              <el-icon :size="14" :class="card.trend >= 0 ? 'up' : 'down'">
                <ArrowUp v-if="card.trend >= 0" />
                <ArrowDown v-else />
              </el-icon>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 综合趋势图表 -->
    <div class="chart-card">
      <div class="chart-header">
        <h3>综合运营趋势</h3>
        <el-checkbox-group v-model="selectedMetrics" size="small">
          <el-checkbox label="income">收入</el-checkbox>
          <el-checkbox label="vehicles">车流量</el-checkbox>
          <el-checkbox label="occupancy">占用率</el-checkbox>
          <el-checkbox label="turnover">周转率</el-checkbox>
        </el-checkbox-group>
      </div>
      <div ref="comprehensiveChartRef" class="chart-container" style="height: 400px;"></div>
    </div>

    <!-- 多维度趋势对比 -->
    <el-row :gutter="16" class="chart-row">
      <el-col :xs="24" :lg="12">
        <div class="chart-card">
          <div class="chart-header">
            <h3>收入趋势</h3>
          </div>
          <div ref="incomeChartRef" class="chart-container"></div>
        </div>
      </el-col>
      <el-col :xs="24" :lg="12">
        <div class="chart-card">
          <div class="chart-header">
            <h3>车流量趋势</h3>
          </div>
          <div ref="vehicleChartRef" class="chart-container"></div>
        </div>
      </el-col>
    </el-row>

    <!-- 时段分析 -->
    <el-row :gutter="16" class="chart-row">
      <el-col :xs="24" :lg="12">
        <div class="chart-card">
          <div class="chart-header">
            <h3>时段占用率分析</h3>
          </div>
          <div ref="hourlyChartRef" class="chart-container"></div>
        </div>
      </el-col>
      <el-col :xs="24" :lg="12">
        <div class="chart-card">
          <div class="chart-header">
            <h3>星期分布分析</h3>
          </div>
          <div ref="weeklyChartRef" class="chart-container"></div>
        </div>
      </el-col>
    </el-row>

    <!-- 趋势明细表格 -->
    <div class="table-card">
      <div class="card-header">
        <h3>趋势明细数据</h3>
        <div class="header-actions">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            size="small"
            style="width: 240px"
            @change="handleDateRangeChange"
          />
        </div>
      </div>
      <el-table
        :data="trendList"
        stripe
        v-loading="loading"
        size="small"
      >
        <el-table-column prop="date" label="日期" width="120" />
        <el-table-column prop="income" label="收入" width="120" align="right">
          <template #default="{ row }">
            <span class="amount">¥{{ row.income.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="vehicles" label="车流量" width="100" align="center" />
        <el-table-column prop="occupancy" label="平均占用率" width="120" align="center">
          <template #default="{ row }">
            <el-progress 
              :percentage="row.occupancy" 
              :color="getOccupancyColor"
              :stroke-width="6"
            />
          </template>
        </el-table-column>
        <el-table-column prop="turnover" label="周转率" width="100" align="center" />
        <el-table-column prop="avgDuration" label="平均停车时长" width="130" align="center">
          <template #default="{ row }">
            {{ formatDuration(row.avgDuration) }}
          </template>
        </el-table-column>
      </el-table>
      <div class="table-footer">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          :total="trendList.length"
          layout="total, sizes, prev, pager, next"
          size="small"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import {
  Download,
  TrendCharts,
  Money,
  Van,
  OfficeBuilding,
  ArrowUp,
  ArrowDown
} from '@element-plus/icons-vue'
import { getTrendAnalysis, exportTrend } from '@/api/analytics'
import {
  createAreaGradient,
  createVerticalGradient,
  ensureChartInstance,
  getAnalyticsTheme,
  observeThemeChange,
  withAlpha
} from '@/utils/analyticsTheme'
import {
  loadAnalyticsExportFormats,
  appendFormatToPayload,
  exportBlobMimeType,
  exportFileExtension
} from '@/utils/analyticsExportFormats'

const loading = ref(false)
const exportFormatOptions = ref([])
const exportFormat = ref('excel')
const timeRange = ref('7')
const selectedParking = ref('')
const selectedMetrics = ref(['income', 'vehicles', 'occupancy'])
const dateRange = ref(null)
const currentPage = ref(1)
const pageSize = ref(10)

// 图表引用
const comprehensiveChartRef = ref(null)
const incomeChartRef = ref(null)
const vehicleChartRef = ref(null)
const hourlyChartRef = ref(null)
const weeklyChartRef = ref(null)
let comprehensiveChart = null
let incomeChart = null
let vehicleChart = null
let hourlyChart = null
let weeklyChart = null
let stopThemeObserver = null

// 停车场选项
const parkingOptions = ref([])

// 数据
const trendData = ref({
  totalIncome: 0,
  totalVehicles: 0,
  avgOccupancy: 0,
  avgTurnover: 0,
  incomeTrend: [],
  vehicleTrend: [],
  occupancyTrend: [],
  turnoverTrend: [],
  hourlyData: [],
  weeklyData: [],
  trendList: []
})

// 占用率颜色
const getOccupancyColor = (percentage) => {
  const theme = getAnalyticsTheme()
  if (percentage < 50) return theme.secondary
  if (percentage < 80) return theme.warning
  return theme.accent
}

// 统计卡片
const statCards = computed(() => [
  {
    label: '总收入',
    value: `¥${trendData.value.totalIncome.toFixed(2)}`,
    trend: calculateTrend(trendData.value.incomeTrend),
    icon: 'Money',
    type: 'primary'
  },
  {
    label: '总车流量',
    value: trendData.value.totalVehicles.toString(),
    trend: calculateTrend(trendData.value.vehicleTrend),
    icon: 'Van',
    type: 'success'
  },
  {
    label: '平均占用率',
    value: `${trendData.value.avgOccupancy.toFixed(1)}%`,
    trend: calculateTrend(trendData.value.occupancyTrend),
    icon: 'OfficeBuilding',
    type: 'warning'
  },
  {
    label: '平均周转率',
    value: trendData.value.avgTurnover.toFixed(2),
    trend: calculateTrend(trendData.value.turnoverTrend),
    icon: 'TrendCharts',
    type: 'info'
  }
])

// 计算趋势
function calculateTrend(data) {
  if (!data || data.length < 2) return 0
  const first = data[0]?.value || 0
  const last = data[data.length - 1]?.value || 0
  if (first === 0) return 0
  return ((last - first) / first * 100).toFixed(1)
}

// 格式化时长
function formatDuration(minutes) {
  if (!minutes) return '-'
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours > 0) {
    return `${hours}小时${mins > 0 ? mins + '分' : ''}`
  }
  return `${mins}分钟`
}

// 初始化综合趋势图表
function initComprehensiveChart() {
  if (!comprehensiveChartRef.value) return
  comprehensiveChart = ensureChartInstance(echarts, comprehensiveChartRef.value, comprehensiveChart)
  const theme = getAnalyticsTheme()

  const dates = trendData.value.incomeTrend?.map(item => item.date) || []

  const series = []

  if (selectedMetrics.value.includes('income')) {
    series.push({
      name: '收入',
      type: 'line',
      data: trendData.value.incomeTrend?.map(item => item.value) || [],
      smooth: true,
      yAxisIndex: 0,
      lineStyle: { color: theme.secondary, width: 3 },
      itemStyle: { color: theme.secondary },
      areaStyle: {
        color: createAreaGradient(theme.secondary)
      }
    })
  }

  if (selectedMetrics.value.includes('vehicles')) {
    series.push({
      name: '车流量',
      type: 'bar',
      data: trendData.value.vehicleTrend?.map(item => item.value) || [],
      yAxisIndex: 1,
      itemStyle: {
        color: createVerticalGradient(theme.primary, theme.primarySoft),
        borderRadius: [4, 4, 0, 0]
      },
      barWidth: '30%'
    })
  }

  if (selectedMetrics.value.includes('occupancy')) {
    series.push({
      name: '占用率',
      type: 'line',
      data: trendData.value.occupancyTrend?.map(item => item.value) || [],
      smooth: true,
      yAxisIndex: 2,
      lineStyle: { color: theme.warning, width: 2, type: 'dashed' },
      itemStyle: { color: theme.warning }
    })
  }

  if (selectedMetrics.value.includes('turnover')) {
    series.push({
      name: '周转率',
      type: 'line',
      data: trendData.value.turnoverTrend?.map(item => item.value) || [],
      smooth: true,
      yAxisIndex: 3,
      lineStyle: { color: theme.accent, width: 2 },
      itemStyle: { color: theme.accent }
    })
  }
  
  const yAxis = []
  if (selectedMetrics.value.includes('income')) {
    yAxis.push({
      type: 'value',
      name: '收入(¥)',
      position: 'left',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: theme.splitLine } },
      axisLabel: { color: theme.textSecondary }
    })
  }
  if (selectedMetrics.value.includes('vehicles')) {
    yAxis.push({
      type: 'value',
      name: '车流量',
      position: selectedMetrics.value.includes('income') ? 'right' : 'left',
      axisLine: { show: false },
      splitLine: { show: false },
      axisLabel: { color: theme.textSecondary }
    })
  }
  if (selectedMetrics.value.includes('occupancy')) {
    yAxis.push({
      type: 'value',
      name: '占用率(%)',
      position: 'right',
      axisLine: { show: false },
      splitLine: { show: false },
      axisLabel: { color: theme.textSecondary }
    })
  }
  if (selectedMetrics.value.includes('turnover')) {
    yAxis.push({
      type: 'value',
      name: '周转率',
      position: 'right',
      axisLine: { show: false },
      splitLine: { show: false },
      axisLabel: { color: theme.textSecondary }
    })
  }
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      backgroundColor: theme.panel,
      borderColor: theme.border,
      textStyle: { color: theme.textPrimary }
    },
    legend: {
      data: series.map(s => s.name),
      bottom: 0,
      textStyle: { color: theme.textSecondary }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLine: { lineStyle: { color: theme.axisLine } },
      axisLabel: { color: theme.textSecondary }
    },
    yAxis,
    series
  }
  
  comprehensiveChart.setOption(option, true)
}

// 初始化收入趋势图表
function initIncomeChart() {
  if (!incomeChartRef.value) return
  incomeChart = ensureChartInstance(echarts, incomeChartRef.value, incomeChart)
  const theme = getAnalyticsTheme()
  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: '{b}: ¥{c}',
      backgroundColor: theme.panel,
      borderColor: theme.border,
      textStyle: { color: theme.textPrimary }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: trendData.value.incomeTrend?.map(item => item.date) || [],
      axisLine: { lineStyle: { color: theme.axisLine } },
      axisLabel: { color: theme.textSecondary }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: theme.splitLine } },
      axisLabel: {
        color: theme.textSecondary,
        formatter: '¥{value}'
      }
    },
    series: [{
      data: trendData.value.incomeTrend?.map(item => item.value) || [],
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      lineStyle: {
        color: theme.secondary,
        width: 3
      },
      itemStyle: {
        color: theme.secondary,
        borderWidth: 2,
        borderColor: theme.inverse
      },
      areaStyle: {
        color: createAreaGradient(theme.secondary)
      }
    }]
  }
  incomeChart.setOption(option)
}

// 初始化车流量趋势图表
function initVehicleChart() {
  if (!vehicleChartRef.value) return
  vehicleChart = ensureChartInstance(echarts, vehicleChartRef.value, vehicleChart)
  const theme = getAnalyticsTheme()
  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: '{b}: {c}辆',
      backgroundColor: theme.panel,
      borderColor: theme.border,
      textStyle: { color: theme.textPrimary }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: trendData.value.vehicleTrend?.map(item => item.date) || [],
      axisLine: { lineStyle: { color: theme.axisLine } },
      axisLabel: { color: theme.textSecondary }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: theme.splitLine } },
      axisLabel: { color: theme.textSecondary }
    },
    series: [{
      data: trendData.value.vehicleTrend?.map(item => item.value) || [],
      type: 'bar',
      itemStyle: {
        color: createVerticalGradient(theme.primary, theme.primarySoft),
        borderRadius: [4, 4, 0, 0]
      },
      barWidth: '50%'
    }]
  }
  vehicleChart.setOption(option)
}

// 初始化时段分析图表
function initHourlyChart() {
  if (!hourlyChartRef.value) return
  hourlyChart = ensureChartInstance(echarts, hourlyChartRef.value, hourlyChart)
  const theme = getAnalyticsTheme()
  const data = trendData.value.hourlyData || []
  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: '{b}: {c}%',
      backgroundColor: theme.panel,
      borderColor: theme.border,
      textStyle: { color: theme.textPrimary }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: data.map(item => item.hour),
      axisLine: { lineStyle: { color: theme.axisLine } },
      axisLabel: { 
        color: theme.textSecondary,
        interval: 2
      }
    },
    yAxis: {
      type: 'value',
      max: 100,
      axisLine: { show: false },
      splitLine: { lineStyle: { color: theme.splitLine } },
      axisLabel: { 
        color: theme.textSecondary,
        formatter: '{value}%'
      }
    },
    series: [{
      data: data.map(item => item.occupancy),
      type: 'line',
      smooth: true,
      symbol: 'none',
      lineStyle: {
        color: theme.warning,
        width: 3
      },
      areaStyle: {
        color: createAreaGradient(theme.warning)
      }
    }]
  }
  hourlyChart.setOption(option)
}

// 初始化星期分布图表
function initWeeklyChart() {
  if (!weeklyChartRef.value) return
  weeklyChart = ensureChartInstance(echarts, weeklyChartRef.value, weeklyChart)
  const theme = getAnalyticsTheme()
  const data = trendData.value.weeklyData || []
  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: '{b}: {c}',
      backgroundColor: theme.panel,
      borderColor: theme.border,
      textStyle: { color: theme.textPrimary }
    },
    radar: {
      indicator: data.map(item => ({ name: item.day, max: 100 })),
      radius: '65%',
      axisLine: { lineStyle: { color: theme.axisLine } },
      splitLine: { lineStyle: { color: theme.splitLine } },
      splitArea: { areaStyle: { color: [withAlpha(theme.primary, 0.04)] } },
      axisName: { color: theme.textSecondary }
    },
    series: [{
      type: 'radar',
      data: [{
        value: data.map(item => item.value),
        name: '运营指数',
        areaStyle: {
          color: withAlpha(theme.primary, 0.3)
        },
        lineStyle: {
          color: theme.primary,
          width: 2
        },
        itemStyle: {
          color: theme.primary
        }
      }]
    }]
  }
  weeklyChart.setOption(option)
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

// 获取趋势分析数据
async function fetchTrendData() {
  loading.value = true
  try {
    const params = {
      days: timeRange.value,
      parkingId: selectedParking.value || undefined
    }
    const res = await getTrendAnalysis(params)
    if (res.code === 200) {
      trendData.value = { ...trendData.value, ...res.data }
      nextTick(() => {
        initComprehensiveChart()
        initIncomeChart()
        initVehicleChart()
        initHourlyChart()
        initWeeklyChart()
      })
    }
  } catch (error) {
    console.error('获取趋势分析数据失败:', error)
    ElMessage.error('获取趋势分析数据失败')
  } finally {
    loading.value = false
  }
}

// 处理时间范围变化
function handleTimeRangeChange() {
  fetchTrendData()
}

// 处理停车场选择变化
function handleParkingChange() {
  fetchTrendData()
}

// 处理日期范围变化
function handleDateRangeChange() {
  if (dateRange.value && dateRange.value.length === 2) {
    // 根据选择的日期范围重新获取数据
    fetchTrendData()
  }
}

// 导出数据
async function handleExport() {
  try {
    let payload = {
      days: timeRange.value,
      parkingId: selectedParking.value || undefined
    }
    payload = appendFormatToPayload(payload, exportFormat.value)
    const res = await exportTrend(payload)
    const raw = res?.data ?? res
    const blob =
      raw instanceof Blob ? raw : new Blob([raw], { type: exportBlobMimeType(exportFormat.value) })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    const ext = exportFileExtension(exportFormat.value)
    link.download = `趋势分析_${timeRange.value}天_${new Date().toISOString().split('T')[0]}.${ext}`
    link.click()
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

// 监听指标选择变化
watch(selectedMetrics, () => {
  nextTick(() => {
    initComprehensiveChart()
  })
}, { deep: true })

// 处理窗口大小变化
function handleResize() {
  comprehensiveChart?.resize()
  incomeChart?.resize()
  vehicleChart?.resize()
  hourlyChart?.resize()
  weeklyChart?.resize()
}

onMounted(async () => {
  const fmts = await loadAnalyticsExportFormats()
  exportFormatOptions.value = fmts
  exportFormat.value = fmts[0] || 'excel'
  loadParkingList()
  fetchTrendData()
  window.addEventListener('resize', handleResize)
  stopThemeObserver = observeThemeChange(() => {
    initComprehensiveChart()
    initIncomeChart()
    initVehicleChart()
    initHourlyChart()
    initWeeklyChart()
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  stopThemeObserver?.()
  comprehensiveChart?.dispose()
  incomeChart?.dispose()
  vehicleChart?.dispose()
  hourlyChart?.dispose()
  weeklyChart?.dispose()
})
</script>

<style scoped lang="scss">
.trend-analytics-page {
  padding: var(--space-6);
  max-width: 1600px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-6);
  
  .header-title {
    h2 {
      margin: 0 0 8px 0;
      font-size: var(--text-2xl);
      font-weight: var(--font-bold);
      color: var(--text-primary);
    }
    
    .subtitle {
      margin: 0;
      color: var(--text-tertiary);
      font-size: var(--text-sm);
    }
  }
  
  .format-chip {
    font-size: var(--text-xs);
    color: var(--text-tertiary);
    padding: var(--space-1) var(--space-2);
    border-radius: var(--radius-md);
    background: rgba(255, 255, 255, 0.06);
  }

  .header-actions {
    display: flex;
    gap: var(--space-3);
    flex-wrap: wrap;
  }
}

.stat-cards {
  margin-bottom: var(--space-5);
}

.stat-card {
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  display: flex;
  align-items: center;
  gap: var(--space-4);
  box-shadow: var(--shadow-lg);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    border-color: var(--glass-border-hover);
    box-shadow: var(--shadow-xl);
  }
  
  &.primary .card-icon {
    background: linear-gradient(135deg, var(--primary-500) 0%, var(--primary-400) 100%);
  }
  
  &.success .card-icon {
    background: linear-gradient(135deg, var(--secondary-500) 0%, var(--secondary-400) 100%);
  }
  
  &.warning .card-icon {
    background: linear-gradient(135deg, var(--warning-500) 0%, var(--warning-400) 100%);
  }
  
  &.info .card-icon {
    background: linear-gradient(135deg, var(--text-muted) 0%, var(--text-tertiary) 100%);
  }
  
  .card-icon {
    width: 56px;
    height: 56px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    flex-shrink: 0;
  }
  
  .card-content {
    flex: 1;
    min-width: 0;
  }
  
  .card-label {
    font-size: var(--text-sm);
    color: var(--text-tertiary);
    margin-bottom: 4px;
  }
  
  .card-value {
    font-size: var(--text-2xl);
    font-weight: var(--font-bold);
    color: var(--text-primary);
    margin-bottom: 4px;
  }
  
  .card-trend {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    
    .trend-label {
      color: var(--text-muted);
    }
    
    .up {
      color: var(--secondary-400);
    }
    
    .down {
      color: var(--accent-400);
    }
  }
}

.chart-row {
  margin-bottom: var(--space-4);
}

.chart-card {
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  box-shadow: var(--shadow-lg);
  margin-bottom: var(--space-4);
  
  .chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-4);
    
    h3 {
      margin: 0;
      font-size: var(--text-lg);
      font-weight: var(--font-semibold);
      color: var(--text-primary);
    }
  }
  
  .chart-container {
    height: 300px;
  }
}

.table-card {
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  box-shadow: var(--shadow-lg);
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-4);
    
    h3 {
      margin: 0;
      font-size: var(--text-lg);
      font-weight: var(--font-semibold);
      color: var(--text-primary);
    }
  }
  
  .amount {
    font-family: 'Roboto Mono', monospace;
    font-weight: 500;
    color: var(--secondary-400);
  }
  
  .table-footer {
    display: flex;
    justify-content: flex-end;
    padding-top: var(--space-4);
    border-top: 1px solid var(--border-subtle);
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-4);
    
    .header-actions {
      width: 100%;
      flex-wrap: wrap;
    }
  }
  
  .stat-card {
    margin-bottom: var(--space-3);
  }
  
  .chart-card .chart-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>
