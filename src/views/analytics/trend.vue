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

const loading = ref(false)
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
  if (percentage < 50) return '#67c23a'
  if (percentage < 80) return '#e6a23c'
  return '#f56c6c'
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
  comprehensiveChart = echarts.init(comprehensiveChartRef.value)

  const dates = trendData.value.incomeTrend?.map(item => item.date) || []

  const series = []

  if (selectedMetrics.value.includes('income')) {
    series.push({
      name: '收入',
      type: 'line',
      data: trendData.value.incomeTrend?.map(item => item.value) || [],
      smooth: true,
      yAxisIndex: 0,
      lineStyle: { color: '#67c23a', width: 3 },
      itemStyle: { color: '#67c23a' },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(103, 194, 58, 0.3)' },
          { offset: 1, color: 'rgba(103, 194, 58, 0.05)' }
        ])
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
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#409eff' },
          { offset: 1, color: '#79bbff' }
        ]),
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
      lineStyle: { color: '#e6a23c', width: 2, type: 'dashed' },
      itemStyle: { color: '#e6a23c' }
    })
  }

  if (selectedMetrics.value.includes('turnover')) {
    series.push({
      name: '周转率',
      type: 'line',
      data: trendData.value.turnoverTrend?.map(item => item.value) || [],
      smooth: true,
      yAxisIndex: 3,
      lineStyle: { color: '#f56c6c', width: 2 },
      itemStyle: { color: '#f56c6c' }
    })
  }
  
  const yAxis = []
  if (selectedMetrics.value.includes('income')) {
    yAxis.push({
      type: 'value',
      name: '收入(¥)',
      position: 'left',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#ebeef5' } },
      axisLabel: { color: '#606266' }
    })
  }
  if (selectedMetrics.value.includes('vehicles')) {
    yAxis.push({
      type: 'value',
      name: '车流量',
      position: selectedMetrics.value.includes('income') ? 'right' : 'left',
      axisLine: { show: false },
      splitLine: { show: false },
      axisLabel: { color: '#606266' }
    })
  }
  if (selectedMetrics.value.includes('occupancy')) {
    yAxis.push({
      type: 'value',
      name: '占用率(%)',
      position: 'right',
      axisLine: { show: false },
      splitLine: { show: false },
      axisLabel: { color: '#606266' }
    })
  }
  if (selectedMetrics.value.includes('turnover')) {
    yAxis.push({
      type: 'value',
      name: '周转率',
      position: 'right',
      axisLine: { show: false },
      splitLine: { show: false },
      axisLabel: { color: '#606266' }
    })
  }
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    legend: {
      data: series.map(s => s.name),
      bottom: 0
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
      axisLine: { lineStyle: { color: '#dcdfe6' } },
      axisLabel: { color: '#606266' }
    },
    yAxis,
    series
  }
  
  comprehensiveChart.setOption(option, true)
}

// 初始化收入趋势图表
function initIncomeChart() {
  if (!incomeChartRef.value) return
  incomeChart = echarts.init(incomeChartRef.value)
  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: '{b}: ¥{c}'
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
      axisLine: { lineStyle: { color: '#dcdfe6' } },
      axisLabel: { color: '#606266' }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#ebeef5' } },
      axisLabel: {
        color: '#606266',
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
        color: '#67c23a',
        width: 3
      },
      itemStyle: {
        color: '#67c23a',
        borderWidth: 2,
        borderColor: '#fff'
      },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(103, 194, 58, 0.3)' },
          { offset: 1, color: 'rgba(103, 194, 58, 0.05)' }
        ])
      }
    }]
  }
  incomeChart.setOption(option)
}

// 初始化车流量趋势图表
function initVehicleChart() {
  if (!vehicleChartRef.value) return
  vehicleChart = echarts.init(vehicleChartRef.value)
  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: '{b}: {c}辆'
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
      axisLine: { lineStyle: { color: '#dcdfe6' } },
      axisLabel: { color: '#606266' }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#ebeef5' } },
      axisLabel: { color: '#606266' }
    },
    series: [{
      data: trendData.value.vehicleTrend?.map(item => item.value) || [],
      type: 'bar',
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#409eff' },
          { offset: 1, color: '#79bbff' }
        ]),
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
  hourlyChart = echarts.init(hourlyChartRef.value)
  const data = trendData.value.hourlyData || []
  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: '{b}: {c}%'
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
      axisLine: { lineStyle: { color: '#dcdfe6' } },
      axisLabel: { 
        color: '#606266',
        interval: 2
      }
    },
    yAxis: {
      type: 'value',
      max: 100,
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#ebeef5' } },
      axisLabel: { 
        color: '#606266',
        formatter: '{value}%'
      }
    },
    series: [{
      data: data.map(item => item.occupancy),
      type: 'line',
      smooth: true,
      symbol: 'none',
      lineStyle: {
        color: '#e6a23c',
        width: 3
      },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(230, 162, 60, 0.3)' },
          { offset: 1, color: 'rgba(230, 162, 60, 0.05)' }
        ])
      }
    }]
  }
  hourlyChart.setOption(option)
}

// 初始化星期分布图表
function initWeeklyChart() {
  if (!weeklyChartRef.value) return
  weeklyChart = echarts.init(weeklyChartRef.value)
  const data = trendData.value.weeklyData || []
  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: '{b}: {c}'
    },
    radar: {
      indicator: data.map(item => ({ name: item.day, max: 100 })),
      radius: '65%'
    },
    series: [{
      type: 'radar',
      data: [{
        value: data.map(item => item.value),
        name: '运营指数',
        areaStyle: {
          color: 'rgba(64, 158, 255, 0.3)'
        },
        lineStyle: {
          color: '#409eff',
          width: 2
        },
        itemStyle: {
          color: '#409eff'
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
    const res = await exportTrend({ 
      days: timeRange.value,
      parkingId: selectedParking.value || undefined
    })
    const blob = new Blob([res], { type: 'application/vnd.ms-excel' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `趋势分析_${timeRange.value}天_${new Date().toISOString().split('T')[0]}.xlsx`
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

onMounted(() => {
  loadParkingList()
  fetchTrendData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  comprehensiveChart?.dispose()
  incomeChart?.dispose()
  vehicleChart?.dispose()
  hourlyChart?.dispose()
  weeklyChart?.dispose()
})
</script>

<style scoped lang="scss">
.trend-analytics-page {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  
  .header-title {
    h2 {
      margin: 0 0 8px 0;
      font-size: 24px;
      font-weight: 600;
      color: #303133;
    }
    
    .subtitle {
      margin: 0;
      color: #909399;
      font-size: 14px;
    }
  }
  
  .header-actions {
    display: flex;
    gap: 12px;
  }
}

.stat-cards {
  margin-bottom: 20px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
  }
  
  &.primary .card-icon {
    background: linear-gradient(135deg, #409eff 0%, #79bbff 100%);
  }
  
  &.success .card-icon {
    background: linear-gradient(135deg, #67c23a 0%, #95d475 100%);
  }
  
  &.warning .card-icon {
    background: linear-gradient(135deg, #e6a23c 0%, #eebe77 100%);
  }
  
  &.info .card-icon {
    background: linear-gradient(135deg, #909399 0%, #b1b3b8 100%);
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
    font-size: 14px;
    color: #909399;
    margin-bottom: 4px;
  }
  
  .card-value {
    font-size: 24px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 4px;
  }
  
  .card-trend {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    
    .trend-label {
      color: #909399;
    }
    
    .up {
      color: #67c23a;
    }
    
    .down {
      color: #f56c6c;
    }
  }
}

.chart-row {
  margin-bottom: 16px;
}

.chart-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  margin-bottom: 16px;
  
  .chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    
    h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #303133;
    }
  }
  
  .chart-container {
    height: 300px;
  }
}

.table-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    
    h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #303133;
    }
  }
  
  .amount {
    font-family: 'Roboto Mono', monospace;
    font-weight: 500;
    color: #67c23a;
  }
  
  .table-footer {
    display: flex;
    justify-content: flex-end;
    padding-top: 16px;
    border-top: 1px solid #ebeef5;
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
    
    .header-actions {
      width: 100%;
      flex-wrap: wrap;
    }
  }
  
  .stat-card {
    margin-bottom: 12px;
  }
  
  .chart-card .chart-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>
