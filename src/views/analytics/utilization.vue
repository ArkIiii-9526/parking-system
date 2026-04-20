<template>
  <div class="analytics-utilization-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">
          <span class="title-icon">
            <el-icon><PieChart /></el-icon>
          </span>
          利用率分析
        </h1>
        <p class="page-subtitle">实时监控各停车场车位利用率</p>
      </div>
      <div class="header-actions">
        <button class="refresh-btn" @click="loadData">
          <el-icon><Refresh /></el-icon>
          <span>刷新数据</span>
        </button>
        <el-select v-if="exportFormatOptions.length > 1" v-model="exportFormat" size="small" style="width: 100px">
          <el-option v-for="f in exportFormatOptions" :key="f" :label="f" :value="f" />
        </el-select>
        <el-tooltip v-else-if="exportFormatOptions.length" :content="`支持: ${exportFormatOptions.join(', ')}`">
          <span class="format-chip">{{ exportFormatOptions[0] }}</span>
        </el-tooltip>
        <button class="export-btn" v-permission="'analytics:utilization:export'" @click="handleExport">
          <el-icon><Download /></el-icon>
          <span>导出报表</span>
        </button>
      </div>
    </div>

    <!-- 总体利用率卡片 -->
    <div class="overview-card">
      <div class="overview-content">
        <div class="overview-chart">
          <div ref="overviewChartRef" class="chart-container"></div>
          <div class="overview-center">
            <span class="center-value">{{ overallUtilization }}%</span>
            <span class="center-label">整体利用率</span>
          </div>
        </div>
        <div class="overview-stats">
          <div class="stat-item">
            <div class="stat-icon total">
              <el-icon><Grid /></el-icon>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ totalStats.totalSpaces }}</span>
              <span class="stat-label">总车位</span>
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-icon occupied">
              <el-icon><Van /></el-icon>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ totalStats.occupiedSpaces }}</span>
              <span class="stat-label">已占用</span>
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-icon available">
              <el-icon><CircleCheck /></el-icon>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ totalStats.availableSpaces }}</span>
              <span class="stat-label">空闲</span>
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-icon reserved">
              <el-icon><Timer /></el-icon>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ totalStats.reservedSpaces }}</span>
              <span class="stat-label">已预约</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 各停车场利用率 -->
    <div class="parking-utilization">
      <div class="section-header">
        <h3 class="section-title">
          <el-icon><OfficeBuilding /></el-icon>
          各停车场利用率
        </h3>
        <div class="legend">
          <div class="legend-item">
            <span class="legend-dot low"></span>
            <span>空闲 (&lt;50%)</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot medium"></span>
            <span>适中 (50-80%)</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot high"></span>
            <span>紧张 (&gt;80%)</span>
          </div>
        </div>
      </div>

      <div class="parking-grid">
        <div
          v-for="item in utilizationData"
          :key="item.parkingId"
          class="parking-card"
          :class="getUtilizationClass(item.utilizationRate)"
        >
          <div class="card-header">
            <h4 class="parking-name">{{ item.parkingName }}</h4>
            <span class="utilization-badge" :class="getUtilizationClass(item.utilizationRate)">
              {{ item.utilizationRate?.toFixed(1) }}%
            </span>
          </div>
          <div class="card-body">
            <div class="utilization-bar">
              <div class="bar-bg">
                <div
                  class="bar-fill"
                  :style="{ width: `${Math.min(item.utilizationRate, 100)}%` }"
                ></div>
              </div>
            </div>
            <div class="space-stats">
              <div class="space-item">
                <span class="space-value">{{ item.totalSpaces }}</span>
                <span class="space-label">总车位</span>
              </div>
              <div class="space-item">
                <span class="space-value occupied">{{ item.occupiedSpaces }}</span>
                <span class="space-label">占用</span>
              </div>
              <div class="space-item">
                <span class="space-value available">{{ item.availableSpaces }}</span>
                <span class="space-label">空闲</span>
              </div>
              <div class="space-item">
                <span class="space-value reserved">{{ item.reservedSpaces }}</span>
                <span class="space-label">预约</span>
              </div>
            </div>
          </div>
          <div class="card-footer">
            <span class="update-time">
              <el-icon><Clock /></el-icon>
              {{ formatTime(item.statisticsTime) }}
            </span>
            <button class="detail-btn" @click="viewDetail(item)">
              详情
              <el-icon><ArrowRight /></el-icon>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 利用率趋势图 -->
    <div class="trend-card">
      <div class="card-header">
        <h3 class="card-title">
          <el-icon><TrendCharts /></el-icon>
          利用率趋势
        </h3>
        <el-radio-group v-model="trendPeriod" size="small" @change="updateTrendChart">
          <el-radio-button label="day">今日</el-radio-button>
          <el-radio-button label="week">本周</el-radio-button>
          <el-radio-button label="month">本月</el-radio-button>
        </el-radio-group>
      </div>
      <div ref="trendChartRef" class="trend-chart"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import { getUtilizationAnalysis, exportUtilization } from '@/api/analytics'
import {
  createAreaGradient,
  getAnalyticsTheme,
  observeThemeChange
} from '@/utils/analyticsTheme'
import {
  loadAnalyticsExportFormats,
  appendFormatToPayload,
  exportBlobMimeType,
  exportFileExtension
} from '@/utils/analyticsExportFormats'
import { formatLocalDate } from '@/utils/localDate'

const loading = ref(false)
const exportFormatOptions = ref([])
const exportFormat = ref('excel')
const overviewChartRef = ref(null)
const trendChartRef = ref(null)
let overviewChart = null
let trendChart = null
let stopThemeObserver = null

const utilizationData = ref([])
const trendPeriod = ref('day')

const totalStats = reactive({
  totalSpaces: 0,
  occupiedSpaces: 0,
  availableSpaces: 0,
  reservedSpaces: 0
})

const overallUtilization = computed(() => {
  if (totalStats.totalSpaces === 0) return 0
  return ((totalStats.occupiedSpaces + totalStats.reservedSpaces) / totalStats.totalSpaces * 100).toFixed(1)
})

async function loadData() {
  loading.value = true
  try {
    const res = await getUtilizationAnalysis()
    if (res.code === 200) {
      const data = res.data || []
      utilizationData.value = data

      // 计算总体统计
      totalStats.totalSpaces = data.reduce((sum, item) => sum + (item.totalSpaces || 0), 0)
      totalStats.occupiedSpaces = data.reduce((sum, item) => sum + (item.occupiedSpaces || 0), 0)
      totalStats.availableSpaces = data.reduce((sum, item) => sum + (item.availableSpaces || 0), 0)
      totalStats.reservedSpaces = data.reduce((sum, item) => sum + (item.reservedSpaces || 0), 0)

      updateOverviewChart()
      updateTrendChart()
    }
  } catch (error) {
    console.error('加载数据失败:', error)
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

function getUtilizationClass(rate) {
  if (rate < 50) return 'low'
  if (rate < 80) return 'medium'
  return 'high'
}

function formatTime(time) {
  if (!time) return '-'
  const date = new Date(time)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

async function handleExport() {
  try {
    let payload = {}
    payload = appendFormatToPayload(payload, exportFormat.value)
    const res = await exportUtilization(payload)
    const raw = res?.data ?? res
    const blob =
      raw instanceof Blob ? raw : new Blob([raw], { type: exportBlobMimeType(exportFormat.value) })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    const ext = exportFileExtension(exportFormat.value)
    link.download = `利用率分析_${formatLocalDate()}.${ext}`
    link.click()
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

function viewDetail(item) {
  ElMessage.info(`查看 ${item.parkingName} 详情功能开发中`)
}

function initCharts() {
  if (overviewChartRef.value) {
    overviewChart = echarts.init(overviewChartRef.value)
  }
  if (trendChartRef.value) {
    trendChart = echarts.init(trendChartRef.value)
  }
  window.addEventListener('resize', handleResize)
}

function handleResize() {
  overviewChart?.resize()
  trendChart?.resize()
}

function updateOverviewChart() {
  if (!overviewChart) return
  const theme = getAnalyticsTheme()

  const option = {
    series: [{
      type: 'pie',
      radius: ['60%', '80%'],
      avoidLabelOverlap: false,
      label: { show: false },
      labelLine: { show: false },
      data: [
        {
          value: totalStats.occupiedSpaces,
          name: '已占用',
          itemStyle: { color: theme.accent }
        },
        {
          value: totalStats.reservedSpaces,
          name: '已预约',
          itemStyle: { color: theme.warning }
        },
        {
          value: totalStats.availableSpaces,
          name: '空闲',
          itemStyle: { color: theme.secondary }
        }
      ]
    }]
  }
  overviewChart.setOption(option)
}

function updateTrendChart() {
  if (!trendChart) return
  const theme = getAnalyticsTheme()

  // 从API数据中获取趋势数据
  const trendData = utilizationData.value[0]?.hourlyTrend || []
  const hours = trendData.map(item => item.hour) || Array.from({length: 24}, (_, i) => `${i}:00`)
  const data = trendData.map(item => item.utilizationRate) || Array.from({length: 24}, () => 0)

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: '{b}<br/>利用率: {c}%'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: hours,
      axisLine: { lineStyle: { color: theme.axisLine } },
      axisLabel: { color: theme.textSecondary }
    },
    yAxis: {
      type: 'value',
      max: 100,
      axisLine: { lineStyle: { color: theme.axisLine } },
      axisLabel: { color: theme.textSecondary, formatter: '{value}%' },
      splitLine: { lineStyle: { color: theme.splitLine } }
    },
    series: [{
      name: '利用率',
      type: 'line',
      smooth: true,
      data: data,
      areaStyle: {
        color: createAreaGradient(theme.primary, 0.45, 0.05)
      },
      lineStyle: { color: theme.primary, width: 3 },
      itemStyle: { color: theme.primary }
    }]
  }
  trendChart.setOption(option)
}

onMounted(async () => {
  const fmts = await loadAnalyticsExportFormats()
  exportFormatOptions.value = fmts
  exportFormat.value = fmts[0] || 'excel'
  loadData()
  initCharts()
  stopThemeObserver = observeThemeChange(() => {
    updateOverviewChart()
    updateTrendChart()
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  stopThemeObserver?.()
  overviewChart?.dispose()
  trendChart?.dispose()
})
</script>

<style lang="scss" scoped>
.analytics-utilization-page {
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

  .format-chip {
    font-size: var(--text-xs);
    color: var(--text-tertiary);
    padding: 4px 8px;
    border-radius: var(--radius-md);
    background: var(--glass-bg);
  }

  .refresh-btn, .export-btn {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-5);
    font-size: var(--text-sm);
    font-weight: var(--font-semibold);
    color: white;
    background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
    border: none;
    border-radius: var(--radius-lg);
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: var(--shadow-glow-primary);

    &:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg), var(--shadow-glow-primary);
    }

    .el-icon {
      font-size: 16px;
    }
  }

  .refresh-btn {
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);

    &:hover {
      background: var(--glass-bg-hover);
    }
  }

  .export-btn {
    background: linear-gradient(135deg, var(--secondary-500), var(--secondary-600));
    box-shadow: var(--shadow-glow-secondary);

    &:hover {
      box-shadow: var(--shadow-lg), var(--shadow-glow-secondary);
    }
  }
}

// 概览卡片
.overview-card {
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  margin-bottom: var(--space-6);

  .overview-content {
    display: grid;
    grid-template-columns: 300px 1fr;
    gap: var(--space-8);
    align-items: center;

    @media (max-width: 992px) {
      grid-template-columns: 1fr;
    }
  }

  .overview-chart {
    position: relative;

    .chart-container {
      height: 250px;
    }

    .overview-center {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;

      .center-value {
        display: block;
        font-family: var(--font-display);
        font-size: var(--text-3xl);
        font-weight: var(--font-bold);
        color: var(--primary-400);
      }

      .center-label {
        font-size: var(--text-sm);
        color: var(--text-muted);
      }
    }
  }

  .overview-stats {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-4);

    .stat-item {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-4);
      background: var(--glass-bg);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);

      .stat-icon {
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--radius-md);

        &.total {
          background: rgba(99, 102, 241, 0.15);
          color: var(--primary-400);
        }

        &.occupied {
          background: rgba(244, 63, 94, 0.15);
          color: var(--accent-400);
        }

        &.available {
          background: rgba(16, 185, 129, 0.15);
          color: var(--secondary-400);
        }

        &.reserved {
          background: rgba(245, 158, 11, 0.15);
          color: var(--warning-400);
        }

        .el-icon {
          font-size: 24px;
        }
      }

      .stat-info {
        display: flex;
        flex-direction: column;

        .stat-value {
          font-family: var(--font-display);
          font-size: var(--text-xl);
          font-weight: var(--font-bold);
          color: var(--text-primary);
        }

        .stat-label {
          font-size: var(--text-xs);
          color: var(--text-muted);
        }
      }
    }
  }
}

// 停车场利用率
.parking-utilization {
  margin-bottom: var(--space-6);

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-4);

    .section-title {
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

    .legend {
      display: flex;
      align-items: center;
      gap: var(--space-4);

      .legend-item {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        font-size: var(--text-sm);
        color: var(--text-secondary);

        .legend-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;

          &.low { background: var(--secondary-500); }
          &.medium { background: var(--warning-500); }
          &.high { background: var(--accent-500); }
        }
      }
    }
  }

  .parking-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: var(--space-4);
  }

  .parking-card {
    background: var(--glass-bg);
    backdrop-filter: blur(20px);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-xl);
    padding: var(--space-5);
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-4px);
      border-color: var(--glass-border-hover);
      box-shadow: var(--shadow-xl);
    }

    &.low {
      border-left: 4px solid var(--secondary-500);
    }

    &.medium {
      border-left: 4px solid var(--warning-500);
    }

    &.high {
      border-left: 4px solid var(--accent-500);
    }

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: var(--space-4);

      .parking-name {
        font-size: var(--text-base);
        font-weight: var(--font-semibold);
        color: var(--text-primary);
      }

      .utilization-badge {
        padding: var(--space-1) var(--space-3);
        font-size: var(--text-sm);
        font-weight: var(--font-bold);
        border-radius: var(--radius-md);

        &.low {
          background: rgba(16, 185, 129, 0.15);
          color: var(--secondary-500);
        }

        &.medium {
          background: rgba(245, 158, 11, 0.15);
          color: var(--warning-500);
        }

        &.high {
          background: rgba(244, 63, 94, 0.15);
          color: var(--accent-500);
        }
      }
    }

    .card-body {
      .utilization-bar {
        margin-bottom: var(--space-4);

        .bar-bg {
          height: 10px;
          background: var(--glass-bg-hover);
          border-radius: var(--radius-full);
          overflow: hidden;

          .bar-fill {
            height: 100%;
            border-radius: var(--radius-full);
            transition: width 0.5s ease;
            background: linear-gradient(90deg, var(--primary-500), var(--primary-400));
          }
        }
      }

      .space-stats {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: var(--space-2);

        .space-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-1);

          .space-value {
            font-family: var(--font-display);
            font-size: var(--text-lg);
            font-weight: var(--font-bold);
            color: var(--text-primary);

            &.occupied { color: var(--accent-400); }
            &.available { color: var(--secondary-400); }
            &.reserved { color: var(--warning-400); }
          }

          .space-label {
            font-size: var(--text-xs);
            color: var(--text-muted);
          }
        }
      }
    }

    .card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: var(--space-4);
      padding-top: var(--space-4);
      border-top: 1px solid var(--border-subtle);

      .update-time {
        display: flex;
        align-items: center;
        gap: var(--space-1);
        font-size: var(--text-xs);
        color: var(--text-muted);

        .el-icon {
          font-size: 12px;
        }
      }

      .detail-btn {
        display: flex;
        align-items: center;
        gap: var(--space-1);
        font-size: var(--text-sm);
        color: var(--primary-400);
        background: none;
        border: none;
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
          color: var(--primary-300);
          gap: var(--space-2);
        }

        .el-icon {
          font-size: 12px;
        }
      }
    }
  }
}

// 趋势卡片
.trend-card {
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  padding: var(--space-5);

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-4);

    .card-title {
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

  .trend-chart {
    height: 300px;
  }
}

// 响应式
@media (max-width: 768px) {
  .analytics-utilization-page {
    padding: var(--space-4);
  }

  .overview-card .overview-content {
    grid-template-columns: 1fr;
  }

  .overview-stats {
    grid-template-columns: 1fr !important;
  }

  .parking-grid {
    grid-template-columns: 1fr !important;
  }

  .section-header {
    flex-direction: column;
    gap: var(--space-3);
    align-items: flex-start !important;
  }
}
</style>
