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
        <el-select v-if="exportFormatOptions.length > 1" v-model="exportFormat" size="small" style="width: 100px">
          <el-option v-for="f in exportFormatOptions" :key="f" :label="f" :value="f" />
        </el-select>
        <el-tooltip v-else-if="exportFormatOptions.length" :content="`支持: ${exportFormatOptions.join(', ')}`">
          <span class="format-chip">{{ exportFormatOptions[0] }}</span>
        </el-tooltip>
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
import {
  createAreaGradient,
  createVerticalGradient,
  ensureChartInstance,
  getAnalyticsTheme,
  observeThemeChange
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
let stopThemeObserver = null

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
  sourceChart = ensureChartInstance(echarts, sourceChartRef.value, sourceChart)
  const theme = getAnalyticsTheme()
  const palette = [theme.primary, theme.secondary, theme.warning, theme.accent]
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: ¥{c} ({d}%)',
      backgroundColor: theme.panel,
      borderColor: theme.border,
      textStyle: { color: theme.textPrimary }
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
      textStyle: { color: theme.textSecondary }
    },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['35%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: theme.inverse,
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
      data: (incomeData.value.sourceDistribution || []).map((item, index) => ({
        ...item,
        itemStyle: {
          ...(item.itemStyle || {}),
          color: item.itemStyle?.color || palette[index % palette.length]
        }
      }))
    }]
  }
  sourceChart.setOption(option)
}

// 初始化收入趋势图表
function initTrendChart() {
  if (!trendChartRef.value) return
  trendChart = ensureChartInstance(echarts, trendChartRef.value, trendChart)
  const theme = getAnalyticsTheme()
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
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
      data: incomeData.value.trendData?.map(item => item.date) || [],
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
      data: incomeData.value.trendData?.map(item => item.amount) || [],
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
  trendChart.setOption(option)
}

// 初始化停车场收入对比图表
function initParkingChart() {
  if (!parkingChartRef.value) return
  parkingChart = ensureChartInstance(echarts, parkingChartRef.value, parkingChart)
  const theme = getAnalyticsTheme()
  const data = incomeData.value.parkingIncome || []
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
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
      data: data.map(item => item.name),
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
      data: data.map(item => ({
        value: item.income,
        itemStyle: {
          color: createVerticalGradient(theme.primary, theme.primarySoft)
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
    let payload = { period: period.value }
    payload = appendFormatToPayload(payload, exportFormat.value)
    const res = await exportIncome(payload)
    const raw = res?.data ?? res
    const blob =
      raw instanceof Blob ? raw : new Blob([raw], { type: exportBlobMimeType(exportFormat.value) })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    const ext = exportFileExtension(exportFormat.value)
    link.download = `收入分析_${period.value}_${new Date().toISOString().split('T')[0]}.${ext}`
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

onMounted(async () => {
  const fmts = await loadAnalyticsExportFormats()
  exportFormatOptions.value = fmts
  exportFormat.value = fmts[0] || 'excel'
  fetchIncomeData()
  window.addEventListener('resize', handleResize)
  stopThemeObserver = observeThemeChange(() => {
    initSourceChart()
    initTrendChart()
    initParkingChart()
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  stopThemeObserver?.()
  sourceChart?.dispose()
  trendChart?.dispose()
  parkingChart?.dispose()
})
</script>

<style scoped lang="scss">
.income-analytics-page {
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
  
  .header-actions {
    display: flex;
    gap: var(--space-3);
    align-items: center;
    flex-wrap: wrap;
  }

  .format-chip {
    font-size: var(--text-xs);
    color: var(--text-tertiary);
    padding: var(--space-1) var(--space-2);
    border-radius: var(--radius-md);
    background: rgba(255, 255, 255, 0.06);
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
  
  .card-change {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    
    .up {
      color: var(--secondary-400);
    }
    
    .down {
      color: var(--accent-400);
    }
    
    .change-text {
      color: var(--text-muted);
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
    
    &.highlight {
      color: var(--secondary-400);
      font-weight: 600;
    }
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
}
</style>
