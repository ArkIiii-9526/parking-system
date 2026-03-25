<template>
  <div class="income-analytics-page">
    <div class="page-header">
      <div class="header-title">
        <h2>收入分析</h2>
        <p class="subtitle">分析停车场收入数据，了解收入来源和趋势</p>
      </div>
      <div class="header-actions">
        <el-radio-group v-model="period" size="small" @change="handlePeriodChange">
          <el-radio-button label="day">今日</el-radio-button>
          <el-radio-button label="week">本周</el-radio-button>
          <el-radio-button label="month">本月</el-radio-button>
        </el-radio-group>
        <el-button v-permission="'analytics:income:export'" type="primary" :icon="Download" size="small" @click="handleExport">
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
            <h3>收入来源分布</h3>
          </div>
          <div ref="sourceChartRef" class="chart-container"></div>
        </div>
      </el-col>
      <el-col :xs="24" :lg="12">
        <div class="chart-card">
          <div class="chart-header">
            <h3>收入趋势</h3>
          </div>
          <div ref="trendChartRef" class="chart-container"></div>
        </div>
      </el-col>
    </el-row>

    <!-- 停车场收入对比 -->
    <div class="chart-card">
      <div class="chart-header">
        <h3>各停车场收入对比</h3>
      </div>
      <div ref="parkingChartRef" class="chart-container" style="height: 350px;"></div>
    </div>

    <!-- 收入明细表格 -->
    <div class="table-card">
      <div class="card-header">
        <h3>收入明细</h3>
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
        :data="filteredIncomeList"
        stripe
        v-loading="loading"
        size="small"
      >
        <el-table-column prop="date" label="日期" width="120" />
        <el-table-column prop="parkingName" label="停车场" min-width="150" />
        <el-table-column prop="cashIncome" label="现金收入" width="120" align="right">
          <template #default="{ row }">
            <span class="amount">¥{{ row.cashIncome.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="wechatIncome" label="微信支付" width="120" align="right">
          <template #default="{ row }">
            <span class="amount">¥{{ row.wechatIncome.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="alipayIncome" label="支付宝" width="120" align="right">
          <template #default="{ row }">
            <span class="amount">¥{{ row.alipayIncome.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="cardIncome" label="银行卡" width="120" align="right">
          <template #default="{ row }">
            <span class="amount">¥{{ row.cardIncome.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="totalIncome" label="总收入" width="120" align="right" sortable>
          <template #default="{ row }">
            <span class="amount highlight">¥{{ row.totalIncome.toFixed(2) }}</span>
          </template>
        </el-table-column>
      </el-table>
      <div class="table-footer">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          :total="filteredIncomeList.length"
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
  Money,
  TrendCharts,
  Wallet,
  Coin,
  ArrowUp,
  ArrowDown,
  Search
} from '@element-plus/icons-vue'
import { getIncomeAnalysis, exportIncome } from '@/api/analytics'

const loading = ref(false)
const period = ref('day')
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(10)

// 图表引用
const sourceChartRef = ref(null)
const trendChartRef = ref(null)
const parkingChartRef = ref(null)
let sourceChart = null
let trendChart = null
let parkingChart = null

// 数据
const incomeData = ref({
  totalIncome: 0,
  incomeChange: 0,
  avgIncome: 0,
  avgChange: 0,
  cashIncome: 0,
  cashChange: 0,
  onlineIncome: 0,
  onlineChange: 0,
  sourceDistribution: [],
  trendData: [],
  parkingIncome: [],
  incomeList: []
})

// 统计卡片
const statCards = computed(() => [
  {
    label: '总收入',
    value: `¥${incomeData.value.totalIncome.toFixed(2)}`,
    change: incomeData.value.incomeChange,
    icon: 'Money',
    type: 'primary'
  },
  {
    label: '平均收入',
    value: `¥${incomeData.value.avgIncome.toFixed(2)}`,
    change: incomeData.value.avgChange,
    icon: 'TrendCharts',
    type: 'success'
  },
  {
    label: '现金收入',
    value: `¥${incomeData.value.cashIncome.toFixed(2)}`,
    change: incomeData.value.cashChange,
    icon: 'Wallet',
    type: 'warning'
  },
  {
    label: '线上收入',
    value: `¥${incomeData.value.onlineIncome.toFixed(2)}`,
    change: incomeData.value.onlineChange,
    icon: 'Coin',
    type: 'info'
  }
])

// 过滤后的收入列表
const filteredIncomeList = computed(() => {
  let list = incomeData.value.incomeList || []
  if (searchQuery.value) {
    list = list.filter(item => 
      item.parkingName.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }
  return list
})

// 初始化收入来源分布图表
function initSourceChart() {
  if (!sourceChartRef.value) return
  sourceChart = echarts.init(sourceChartRef.value)
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: ¥{c} ({d}%)'
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
      data: incomeData.value.sourceDistribution || []
    }]
  }
  sourceChart.setOption(option)
}

// 初始化收入趋势图表
function initTrendChart() {
  if (!trendChartRef.value) return
  trendChart = echarts.init(trendChartRef.value)
  const option = {
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
      data: incomeData.value.trendData?.map(item => item.date) || [],
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
      data: incomeData.value.trendData?.map(item => item.amount) || [],
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
  trendChart.setOption(option)
}

// 初始化停车场收入对比图表
function initParkingChart() {
  if (!parkingChartRef.value) return
  parkingChart = echarts.init(parkingChartRef.value)
  const data = incomeData.value.parkingIncome || []
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
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
      data: data.map(item => item.name),
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
      data: data.map(item => ({
        value: item.income,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#409eff' },
            { offset: 1, color: '#79bbff' }
          ])
        }
      })),
      type: 'bar',
      barWidth: '50%',
      itemStyle: {
        borderRadius: [4, 4, 0, 0]
      }
    }]
  }
  parkingChart.setOption(option)
}

// 获取收入分析数据
async function fetchIncomeData() {
  loading.value = true
  try {
    const res = await getIncomeAnalysis({ period: period.value })
    if (res.code === 200) {
      incomeData.value = { ...incomeData.value, ...res.data }
      nextTick(() => {
        initSourceChart()
        initTrendChart()
        initParkingChart()
      })
    }
  } catch (error) {
    console.error('获取收入分析数据失败:', error)
    ElMessage.error('获取收入分析数据失败')
  } finally {
    loading.value = false
  }
}

// 处理周期变化
function handlePeriodChange() {
  fetchIncomeData()
}

// 导出数据
async function handleExport() {
  try {
    const res = await exportIncome({ period: period.value })
    const blob = new Blob([res], { type: 'application/vnd.ms-excel' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `收入分析_${period.value}_${new Date().toISOString().split('T')[0]}.xlsx`
    link.click()
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

// 处理窗口大小变化
function handleResize() {
  sourceChart?.resize()
  trendChart?.resize()
  parkingChart?.resize()
}

onMounted(() => {
  fetchIncomeData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  sourceChart?.dispose()
  trendChart?.dispose()
  parkingChart?.dispose()
})
</script>

<style scoped lang="scss">
.income-analytics-page {
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
  
  .amount {
    font-family: 'Roboto Mono', monospace;
    font-weight: 500;
    
    &.highlight {
      color: #67c23a;
      font-weight: 600;
    }
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
