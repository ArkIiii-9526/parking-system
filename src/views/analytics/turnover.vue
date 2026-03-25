<template>
  <div class="turnover-analytics-page">
    <div class="page-header">
      <div class="header-title">
        <h2>周转率分析</h2>
        <p class="subtitle">分析停车场车位周转情况，评估运营效率</p>
      </div>
      <div class="header-actions">
        <el-radio-group v-model="period" size="small" @change="handlePeriodChange">
          <el-radio-button label="day">今日</el-radio-button>
          <el-radio-button label="week">本周</el-radio-button>
          <el-radio-button label="month">本月</el-radio-button>
        </el-radio-group>
        <el-button v-permission="'analytics:turnover:export'" type="primary" :icon="Download" size="small" @click="handleExport">
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
            <div class="card-change" v-if="card.change !== undefined">
              <el-icon :size="12">
                <ArrowUp v-if="card.change >= 0" />
                <ArrowDown v-else />
              </el-icon>
              <span :class="card.change >= 0 ? 'up' : 'down'">{{ Math.abs(card.change) }}%</span>
              <span class="change-text">环比</span>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="16" class="chart-row">
      <el-col :xs="24" :lg="12">
        <div class="chart-card">
          <div class="chart-header">
            <h3>周转率分布</h3>
          </div>
          <div ref="distributionChartRef" class="chart-container"></div>
        </div>
      </el-col>
      <el-col :xs="24" :lg="12">
        <div class="chart-card">
          <div class="chart-header">
            <h3>周转率趋势</h3>
          </div>
          <div ref="trendChartRef" class="chart-container"></div>
        </div>
      </el-col>
    </el-row>

    <!-- 停车场周转率对比 -->
    <div class="chart-card">
      <div class="chart-header">
        <h3>各停车场周转率对比</h3>
      </div>
      <div ref="parkingChartRef" class="chart-container" style="height: 350px;"></div>
    </div>

    <!-- 周转率明细表格 -->
    <div class="table-card">
      <div class="card-header">
        <h3>周转率明细</h3>
        <div class="header-actions">
          <el-input
            v-model="searchQuery"
            placeholder="搜索停车场"
            size="small"
            clearable
            style="width: 200px"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
      </div>
      <el-table
        :data="filteredTurnoverList"
        stripe
        v-loading="loading"
        size="small"
      >
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="parkingName" label="停车场" min-width="150" />
        <el-table-column prop="totalSpaces" label="车位数" width="100" align="center" />
        <el-table-column prop="turnoverRate" label="周转率" width="120" align="center" sortable>
          <template #default="{ row }">
            <el-tag :type="getTurnoverTagType(row.turnoverRate)" size="small">
              {{ row.turnoverRate.toFixed(2) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="avgDuration" label="平均停车时长" width="130" align="center">
          <template #default="{ row }">
            {{ formatDuration(row.avgDuration) }}
          </template>
        </el-table-column>
        <el-table-column prop="peakHours" label="高峰时段" min-width="150">
          <template #default="{ row }">
            <el-tag v-for="hour in row.peakHours" :key="hour" size="small" class="hour-tag">
              {{ hour }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="efficiency" label="运营效率" width="120" align="center">
          <template #default="{ row }">
            <el-progress 
              :percentage="row.efficiency" 
              :color="getEfficiencyColor"
              :stroke-width="8"
            />
          </template>
        </el-table-column>
      </el-table>
      <div class="table-footer">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          :total="filteredTurnoverList.length"
          layout="total, sizes, prev, pager, next"
          size="small"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import {
  Download,
  Refresh,
  Timer,
  TrendCharts,
  OfficeBuilding,
  ArrowUp,
  ArrowDown,
  Search
} from '@element-plus/icons-vue'
import { getTurnoverAnalysis, exportTurnover } from '@/api/analytics'

const loading = ref(false)
const period = ref('day')
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(10)

// 图表引用
const distributionChartRef = ref(null)
const trendChartRef = ref(null)
const parkingChartRef = ref(null)
let distributionChart = null
let trendChart = null
let parkingChart = null

// 数据
const turnoverData = ref({
  avgTurnoverRate: 0,
  turnoverChange: 0,
  totalVehicles: 0,
  vehicleChange: 0,
  avgDuration: 0,
  durationChange: 0,
  peakHoursCount: 0,
  peakChange: 0,
  distribution: [],
  trendData: [],
  parkingTurnover: [],
  turnoverList: []
})

// 效率进度条颜色
const getEfficiencyColor = (percentage) => {
  if (percentage < 50) return '#f56c6c'
  if (percentage < 80) return '#e6a23c'
  return '#67c23a'
}

// 统计卡片
const statCards = computed(() => [
  {
    label: '平均周转率',
    value: turnoverData.value.avgTurnoverRate.toFixed(2),
    change: turnoverData.value.turnoverChange,
    icon: 'Refresh',
    type: 'primary'
  },
  {
    label: '总车流量',
    value: turnoverData.value.totalVehicles.toString(),
    change: turnoverData.value.vehicleChange,
    icon: 'TrendCharts',
    type: 'success'
  },
  {
    label: '平均停车时长',
    value: formatDuration(turnoverData.value.avgDuration),
    change: turnoverData.value.durationChange,
    icon: 'Timer',
    type: 'warning'
  },
  {
    label: '高峰时段数',
    value: turnoverData.value.peakHoursCount.toString(),
    change: turnoverData.value.peakChange,
    icon: 'OfficeBuilding',
    type: 'info'
  }
])

// 过滤后的周转率列表
const filteredTurnoverList = computed(() => {
  let list = turnoverData.value.turnoverList || []
  if (searchQuery.value) {
    list = list.filter(item => 
      item.parkingName.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }
  return list
})

// 获取周转率标签类型
function getTurnoverTagType(rate) {
  if (rate >= 3) return 'success'
  if (rate >= 1.5) return 'warning'
  return 'danger'
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

// 初始化周转率分布图表
function initDistributionChart() {
  if (!distributionChartRef.value) return
  distributionChart = echarts.init(distributionChartRef.value)
  const data = turnoverData.value.distribution.length > 0
    ? turnoverData.value.distribution
    : []
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}个 ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center'
    },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['35%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: false
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 14,
          fontWeight: 'bold'
        }
      },
      data: data
    }]
  }
  distributionChart.setOption(option)
}

// 初始化周转率趋势图表
function initTrendChart() {
  if (!trendChartRef.value) return
  trendChart = echarts.init(trendChartRef.value)
  const trendData = turnoverData.value.trendData || []
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    legend: {
      data: ['周转率', '车流量'],
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
      data: trendData.map(item => item.date),
      axisLine: { lineStyle: { color: '#dcdfe6' } },
      axisLabel: { color: '#606266' }
    },
    yAxis: [
      {
        type: 'value',
        name: '周转率',
        position: 'left',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#ebeef5' } },
        axisLabel: { color: '#606266' }
      },
      {
        type: 'value',
        name: '车流量',
        position: 'right',
        axisLine: { show: false },
        splitLine: { show: false },
        axisLabel: { color: '#606266' }
      }
    ],
    series: [
      {
        name: '周转率',
        type: 'line',
        data: trendData.map(item => item.turnoverRate),
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { color: '#409eff', width: 3 },
        itemStyle: { color: '#409eff' }
      },
      {
        name: '车流量',
        type: 'bar',
        yAxisIndex: 1,
        data: trendData.map(item => item.vehicleCount),
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#67c23a' },
            { offset: 1, color: '#95d475' }
          ]),
          borderRadius: [4, 4, 0, 0]
        },
        barWidth: '40%'
      }
    ]
  }
  trendChart.setOption(option)
}

// 初始化停车场周转率对比图表
function initParkingChart() {
  if (!parkingChartRef.value) return
  parkingChart = echarts.init(parkingChartRef.value)
  const data = turnoverData.value.parkingTurnover || []
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: '{b}: 周转率 {c}'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: data.map(item => item.name),
      axisLine: { lineStyle: { color: '#dcdfe6' } },
      axisLabel: { color: '#606266' }
    },
    yAxis: {
      type: 'value',
      name: '周转率',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#ebeef5' } },
      axisLabel: { color: '#606266' }
    },
    series: [{
      data: data.map(item => ({
        value: item.rate,
        itemStyle: {
          color: item.rate >= 3 
            ? '#67c23a'
            : item.rate >= 1.5 
              ? '#e6a23c'
              : '#f56c6c'
        }
      })),
      type: 'bar',
      barWidth: '50%',
      itemStyle: {
        borderRadius: [4, 4, 0, 0]
      },
      label: {
        show: true,
        position: 'top',
        formatter: '{c}'
      }
    }]
  }
  parkingChart.setOption(option)
}

// 获取周转率分析数据
async function fetchTurnoverData() {
  loading.value = true
  try {
    const res = await getTurnoverAnalysis({ period: period.value })
    if (res.code === 200) {
      turnoverData.value = { ...turnoverData.value, ...res.data }
      nextTick(() => {
        initDistributionChart()
        initTrendChart()
        initParkingChart()
      })
    }
  } catch (error) {
    console.error('获取周转率分析数据失败:', error)
    ElMessage.error('获取周转率分析数据失败')
  } finally {
    loading.value = false
  }
}

// 处理周期变化
function handlePeriodChange() {
  fetchTurnoverData()
}

// 导出数据
async function handleExport() {
  try {
    const res = await exportTurnover({ period: period.value })
    const blob = new Blob([res], { type: 'application/vnd.ms-excel' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `周转率分析_${period.value}_${new Date().toISOString().split('T')[0]}.xlsx`
    link.click()
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

// 处理窗口大小变化
function handleResize() {
  distributionChart?.resize()
  trendChart?.resize()
  parkingChart?.resize()
}

onMounted(() => {
  fetchTurnoverData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  distributionChart?.dispose()
  trendChart?.dispose()
  parkingChart?.dispose()
})
</script>

<style scoped lang="scss">
.turnover-analytics-page {
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
  
  .card-change {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    
    .up {
      color: #67c23a;
    }
    
    .down {
      color: #f56c6c;
    }
    
    .change-text {
      color: #909399;
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
  
  .hour-tag {
    margin-right: 4px;
    margin-bottom: 4px;
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
}
</style>
