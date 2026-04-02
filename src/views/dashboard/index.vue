<template>
  <div class="dashboard-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">
          <span class="title-icon">
            <el-icon><DataBoard /></el-icon>
          </span>
          数据概览
        </h1>
        <p class="page-subtitle">实时监控停车场运营状态</p>
      </div>
      <div class="header-actions">
        <button class="action-btn" @click="refreshData">
          <el-icon><Refresh /></el-icon>
          <span>刷新数据</span>
        </button>
        <button
          v-permission="'analytics:report:export'"
          class="action-btn primary"
          type="button"
          @click="handleExportReport"
        >
          <el-icon><Download /></el-icon>
          <span>导出报表</span>
        </button>
      </div>
    </div>

    <!-- 统计卡片区域 -->
    <div class="stats-grid">
      <div 
        v-for="(stat, index) in statsCards" 
        :key="stat.key"
        class="stat-card"
        :class="[`stat-card--${stat.type}`, { 'animate-in': animated }]"
        :style="{ animationDelay: `${index * 100}ms` }"
      >
        <div class="stat-glow"></div>
        <div class="stat-icon">
          <el-icon>
            <component :is="stat.icon" />
          </el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stat.value }}</div>
          <div class="stat-label">{{ stat.label }}</div>
          <div v-if="stat.trend" class="stat-trend" :class="stat.trend.type">
            <el-icon>
              <component :is="stat.trend.type === 'up' ? ArrowUp : ArrowDown" />
            </el-icon>
            <span>{{ stat.trend.value }}%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="dashboard-grid">
      <!-- 左侧：使用率图表 -->
      <div class="dashboard-card chart-card">
        <div class="card-header">
          <div class="header-title">
            <el-icon><PieChart /></el-icon>
            <span>车位使用率</span>
          </div>
          <div class="header-actions">
            <el-radio-group v-model="chartPeriod" size="small">
              <el-radio-button label="day">今日</el-radio-button>
              <el-radio-button label="week">本周</el-radio-button>
              <el-radio-button label="month">本月</el-radio-button>
            </el-radio-group>
          </div>
        </div>
        <div class="card-body">
          <div class="usage-chart">
            <div class="chart-center">
              <div class="center-value">{{ stats.usageRate }}%</div>
              <div class="center-label">当前使用率</div>
            </div>
            <svg class="circular-chart" viewBox="0 0 200 200">
              <defs>
                <linearGradient id="chartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="var(--primary-500)"/>
                  <stop offset="100%" stop-color="var(--secondary-500)"/>
                </linearGradient>
              </defs>
              <circle class="chart-bg" cx="100" cy="100" r="80"/>
              <circle 
                class="chart-progress" 
                cx="100" 
                cy="100" 
                r="80"
                :style="{ strokeDashoffset: 502 - (502 * stats.usageRate / 100) }"
              />
            </svg>
          </div>
          <div class="usage-legend">
            <div class="legend-item">
              <div class="legend-dot used"></div>
              <span class="legend-label">已使用</span>
              <span class="legend-value">{{ stats.totalSpaces - stats.availableSpaces }} 个</span>
            </div>
            <div class="legend-item">
              <div class="legend-dot available"></div>
              <span class="legend-label">空闲</span>
              <span class="legend-value">{{ stats.availableSpaces }} 个</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：快速操作 -->
      <div class="dashboard-card actions-card">
        <div class="card-header">
          <div class="header-title">
            <el-icon><Lightning /></el-icon>
            <span>快速操作</span>
          </div>
        </div>
        <div class="card-body">
          <div class="quick-actions">
            <button 
              v-for="action in quickActions" 
              :key="action.key"
              class="quick-action-btn"
              :class="action.type"
              @click="handleQuickAction(action.key)"
            >
              <div class="action-icon">
                <el-icon>
                  <component :is="action.icon" />
                </el-icon>
              </div>
              <div class="action-info">
                <span class="action-name">{{ action.name }}</span>
                <span class="action-desc">{{ action.desc }}</span>
              </div>
              <el-icon class="action-arrow"><ArrowRight /></el-icon>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部：最近记录 -->
    <div class="dashboard-card records-card">
      <div class="card-header">
        <div class="header-title">
          <el-icon><Clock /></el-icon>
          <span>最近车辆进出记录</span>
        </div>
        <button type="button" class="view-all-btn" @click="router.push('/vehicle')">
          查看全部
          <el-icon><ArrowRight /></el-icon>
        </button>
      </div>
      <div class="card-body">
        <div class="records-table">
          <div class="table-header">
            <div class="th">车牌号</div>
            <div class="th">停车场</div>
            <div class="th">入场时间</div>
            <div class="th">出场时间</div>
            <div class="th">状态</div>
            <div class="th">费用</div>
          </div>
          <div class="table-body">
            <div 
              v-for="(record, index) in recentRecords" 
              :key="index"
              class="table-row"
              :class="{ 'slide-in': animated }"
              :style="{ animationDelay: `${300 + index * 50}ms` }"
            >
              <div class="td plate">
                <span class="plate-number">{{ record.carNo }}</span>
              </div>
              <div class="td">{{ record.parkingName }}</div>
              <div class="td time">{{ formatTime(record.entryTime) }}</div>
              <div class="td time">
                <span v-if="record.exitTime">{{ formatTime(record.exitTime) }}</span>
                <span v-else class="in-progress">停车中...</span>
              </div>
              <div class="td">
                <span class="status-badge" :class="record.status === 1 ? 'completed' : 'active'">
                  {{ record.status === 1 ? '已出场' : '在场' }}
                </span>
              </div>
              <div class="td fee">
                <span v-if="record.fee">¥{{ record.fee }}</span>
                <span v-else class="calculating">计算中</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getParkingPage } from '@/api/parking'
import { getDailyStatistics } from '@/api/billing'
import { getVehicleRecordsByParking } from '@/api/vehicle'
import { exportComprehensive } from '@/api/analytics'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'

const router = useRouter()
const animated = ref(false)
const chartPeriod = ref('day')

const stats = reactive({
  totalParkings: 0,
  totalSpaces: 0,
  availableSpaces: 0,
  todayRevenue: 0,
  usageRate: 0
})

const statsCards = ref([
  {
    key: 'parkings',
    icon: 'OfficeBuilding',
    value: '0',
    label: '停车场总数',
    type: 'primary'
  },
  {
    key: 'spaces',
    icon: 'Grid',
    value: '0',
    label: '停车位总数',
    type: 'success'
  },
  {
    key: 'available',
    icon: 'CircleCheck',
    value: '0',
    label: '可用车位',
    type: 'warning'
  },
  {
    key: 'revenue',
    icon: 'Money',
    value: '¥0',
    label: '今日营收',
    type: 'accent'
  }
])

const quickActions = [
  { key: 'entry', name: '车辆入场', desc: '快速登记入场车辆', icon: 'Plus', type: 'primary' },
  { key: 'exit', name: '车辆出场', desc: '处理车辆出场结算', icon: 'Minus', type: 'success' },
  { key: 'query', name: '车辆查询', desc: '查询车辆停放信息', icon: 'Search', type: 'info' }
]

const recentRecords = ref([])

function formatTime(time) {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function handleQuickAction(key) {
  switch(key) {
    case 'entry':
      router.push('/vehicle?action=entry')
      break
    case 'exit':
      router.push('/vehicle?action=exit')
      break
    case 'query':
      router.push('/vehicle')
      break
  }
}

function refreshData() {
  animated.value = false
  setTimeout(() => {
    animated.value = true
  }, 100)
  loadDashboardData()
}

async function handleExportReport() {
  try {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 29)
    const fmt = (d) => d.toISOString().split('T')[0]
    const res = await exportComprehensive({
      startDate: fmt(start),
      endDate: fmt(end),
      periodType: 'day',
      fileName: `综合报表_${fmt(end)}`
    })
    const raw = res?.data ?? res
    const blob =
      raw instanceof Blob
        ? raw
        : new Blob([raw], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `综合报表_${fmt(end)}.xlsx`
    link.click()
    ElMessage.success('导出成功')
  } catch (e) {
    console.error(e)
    ElMessage.error('导出失败')
  }
}

async function loadDashboardData() {
  try {
    // 获取停车场列表
    const parkingRes = await getParkingPage({ pageNo: 1, pageSize: 100 })
    if (parkingRes && parkingRes.code === 200) {
      const records = parkingRes.data?.records
      const parkings = Array.isArray(records) ? records : []
      stats.totalParkings = parkingRes.data?.total || parkings.length || 0
      
      stats.totalSpaces = parkings.reduce((sum, p) => sum + (Number(p?.totalSpaces) || 0), 0)
      stats.availableSpaces = parkings.reduce((sum, p) => sum + (Number(p?.availableSpaces) || 0), 0)
      
      if (stats.totalSpaces > 0) {
        stats.usageRate = Math.round(((stats.totalSpaces - stats.availableSpaces) / stats.totalSpaces) * 100)
      }
      
      // 更新统计卡片
      statsCards.value[0].value = stats.totalParkings.toString()
      statsCards.value[1].value = stats.totalSpaces.toString()
      statsCards.value[2].value = stats.availableSpaces.toString()
      
      // 获取车辆记录
      if (parkings.length > 0 && parkings[0]?.id) {
        try {
          const recordsRes = await getVehicleRecordsByParking(parkings[0].id, { pageNo: 1, pageSize: 5 })
          if (recordsRes && recordsRes.code === 200) {
            const vehicleRecords = recordsRes.data?.records
            const recordsArray = Array.isArray(vehicleRecords) ? vehicleRecords : []
            recentRecords.value = recordsArray.map(record => ({
              ...record,
              parkingName: parkings.find(p => p.id === record.parkingId)?.name || '未知停车场'
            }))
          }
        } catch (e) {
          console.error('获取车辆记录失败:', e)
        }
      }
    }
    
    // 获取营收数据
    try {
      const today = new Date()
      const formattedDate = today.toISOString().split('T')[0]
      const revenueRes = await getDailyStatistics({ date: String(formattedDate) })
      if (revenueRes && revenueRes.code === 200 && revenueRes.data) {
        stats.todayRevenue = Number(revenueRes.data.totalAmount) || 0
        statsCards.value[3].value = `¥${stats.todayRevenue.toLocaleString()}`
      }
    } catch (e) {
      console.error('获取营收数据失败:', e)
    }
  } catch (error) {
    console.error('加载数据失败详细信息:', error?.message || error)
  }
}

onMounted(() => {
  loadDashboardData()
  setTimeout(() => {
    animated.value = true
  }, 100)
})
</script>

<style lang="scss" scoped>
.dashboard-page {
  padding: var(--space-6);
  max-width: 1600px;
  margin: 0 auto;
}

// 页面标题
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-8);
  
  .header-content {
    .page-title {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      font-family: var(--font-display);
      font-size: var(--text-3xl);
      font-weight: var(--font-bold);
      color: var(--text-primary);
      margin-bottom: var(--space-2);
      
      .title-icon {
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-glow-primary);
        
        .el-icon {
          font-size: 24px;
        }
      }
    }
    
    .page-subtitle {
      font-size: var(--text-base);
      color: var(--text-tertiary);
      padding-left: calc(48px + var(--space-3));
    }
  }
  
  .header-actions {
    display: flex;
    gap: var(--space-3);
    
    .action-btn {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-3) var(--space-5);
      font-size: var(--text-sm);
      font-weight: var(--font-medium);
      color: var(--text-secondary);
      background: var(--glass-bg);
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: all 0.3s ease;
      
      &:hover {
        background: var(--glass-bg-active);
        border-color: var(--glass-border-hover);
        color: var(--text-primary);
      }
      
      &.primary {
        background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
        border: none;
        color: white;
        box-shadow: var(--shadow-glow-primary);
        
        &:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-lg), var(--shadow-glow-primary);
        }
      }
      
      .el-icon {
        font-size: 16px;
      }
    }
  }
}

// 统计卡片网格
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-5);
  margin-bottom: var(--space-6);
  
  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
}

.stat-card {
  position: relative;
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  display: flex;
  align-items: center;
  gap: var(--space-5);
  overflow: hidden;
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  
  &.animate-in {
    opacity: 1;
    transform: translateY(0);
  }
  
  &:hover {
    transform: translateY(-4px);
    border-color: var(--glass-border-hover);
    box-shadow: var(--shadow-xl);
  }
  
  .stat-glow {
    position: absolute;
    top: -50%;
    right: -50%;
    width: 200%;
    height: 200%;
    opacity: 0.1;
    pointer-events: none;
  }
  
  &--primary .stat-glow {
    background: radial-gradient(circle, var(--primary-500) 0%, transparent 70%);
  }
  
  &--success .stat-glow {
    background: radial-gradient(circle, var(--secondary-500) 0%, transparent 70%);
  }
  
  &--warning .stat-glow {
    background: radial-gradient(circle, var(--warning-500) 0%, transparent 70%);
  }
  
  &--accent .stat-glow {
    background: radial-gradient(circle, var(--accent-500) 0%, transparent 70%);
  }
  
  .stat-icon {
    width: 64px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-lg);
    font-size: 28px;
    position: relative;
    z-index: 1;
    
    .el-icon {
      color: white;
    }
  }
  
  &--primary .stat-icon {
    background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
    box-shadow: var(--shadow-glow-primary);
  }
  
  &--success .stat-icon {
    background: linear-gradient(135deg, var(--secondary-500), var(--secondary-600));
    box-shadow: var(--shadow-glow-secondary);
  }
  
  &--warning .stat-icon {
    background: linear-gradient(135deg, var(--warning-500), var(--warning-600));
  }
  
  &--accent .stat-icon {
    background: linear-gradient(135deg, var(--accent-500), var(--accent-600));
    box-shadow: var(--shadow-glow-accent);
  }
  
  .stat-content {
    flex: 1;
    position: relative;
    z-index: 1;
    
    .stat-value {
      font-family: var(--font-display);
      font-size: var(--text-3xl);
      font-weight: var(--font-bold);
      color: var(--text-primary);
      line-height: 1.2;
      margin-bottom: var(--space-1);
    }
    
    .stat-label {
      font-size: var(--text-sm);
      color: var(--text-tertiary);
      margin-bottom: var(--space-2);
    }
    
    .stat-trend {
      display: inline-flex;
      align-items: center;
      gap: var(--space-1);
      font-size: var(--text-xs);
      font-weight: var(--font-medium);
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-full);
      
      &.up {
        background: var(--secondary-surface-strong);
        color: var(--secondary-400);
      }
      
      &.down {
        background: var(--accent-surface-strong);
        color: var(--accent-400);
      }
      
      .el-icon {
        font-size: 12px;
      }
    }
  }
}

// 仪表板网格
.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: var(--space-6);
  margin-bottom: var(--space-6);
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
}

// 通用卡片样式
.dashboard-card {
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
  
  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-5) var(--space-6);
    border-bottom: 1px solid var(--border-subtle);
    
    .header-title {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      font-family: var(--font-display);
      font-size: var(--text-lg);
      font-weight: var(--font-semibold);
      color: var(--text-primary);
      
      .el-icon {
        font-size: 20px;
        color: var(--primary-400);
      }
    }
    
    .header-actions {
      :deep(.el-radio-group) {
        .el-radio-button__inner {
          background: var(--glass-bg);
          border-color: var(--glass-border);
          color: var(--text-tertiary);
          
          &:hover {
            color: var(--text-primary);
          }
        }
        
        .el-radio-button__original-radio:checked + .el-radio-button__inner {
          background: var(--primary-500);
          border-color: var(--primary-500);
          color: white;
          box-shadow: -1px 0 0 0 var(--primary-500);
        }
      }
    }
    
    .view-all-btn {
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
    }
  }
  
  .card-body {
    padding: var(--space-6);
  }
}

// 图表卡片
.chart-card {
  .card-body {
    display: flex;
    align-items: center;
    gap: var(--space-8);
  }
  
  .usage-chart {
    position: relative;
    width: 200px;
    height: 200px;
    flex-shrink: 0;
    
    .chart-center {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      z-index: 1;
      
      .center-value {
        font-family: var(--font-display);
        font-size: var(--text-4xl);
        font-weight: var(--font-bold);
        background: linear-gradient(135deg, var(--primary-400), var(--secondary-400));
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      
      .center-label {
        font-size: var(--text-xs);
        color: var(--text-tertiary);
        margin-top: var(--space-1);
      }
    }
    
    .circular-chart {
      width: 100%;
      height: 100%;
      transform: rotate(-90deg);
      
      .chart-bg {
        fill: none;
        stroke: var(--glass-border);
        stroke-width: 12;
      }
      
      .chart-progress {
        fill: none;
        stroke: url(#chartGradient);
        stroke-width: 12;
        stroke-linecap: round;
        stroke-dasharray: 502;
        transition: stroke-dashoffset 1s ease-out;
      }
    }
  }
  
  .usage-legend {
    flex: 1;
    
    .legend-item {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-3) 0;
      border-bottom: 1px solid var(--border-subtle);
      
      &:last-child {
        border-bottom: none;
      }
      
      .legend-dot {
        width: 12px;
        height: 12px;
        border-radius: var(--radius-full);
        
        &.used {
          background: linear-gradient(135deg, var(--primary-500), var(--secondary-500));
        }
        
        &.available {
          background: var(--neutral-surface-strong);
        }
      }
      
      .legend-label {
        flex: 1;
        font-size: var(--text-sm);
        color: var(--text-secondary);
      }
      
      .legend-value {
        font-family: var(--font-display);
        font-size: var(--text-lg);
        font-weight: var(--font-semibold);
        color: var(--text-primary);
      }
    }
  }
}

// 快速操作卡片
.actions-card {
  .quick-actions {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }
  
  .quick-action-btn {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    padding: var(--space-4);
    background: var(--neutral-surface);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-lg);
    cursor: pointer;
    transition: all 0.3s ease;
    text-align: left;
    
    &:hover {
      background: var(--glass-bg-hover);
      border-color: var(--glass-border-hover);
      transform: translateX(4px);
    }
    
    .action-icon {
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-md);
      font-size: 20px;
      
      .el-icon {
        color: white;
      }
    }
    
    &.primary .action-icon {
      background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
    }
    
    &.success .action-icon {
      background: linear-gradient(135deg, var(--secondary-500), var(--secondary-600));
    }
    
    &.info .action-icon {
      background: linear-gradient(135deg, var(--warning-500), var(--warning-600));
    }
    
    .action-info {
      flex: 1;
      
      .action-name {
        display: block;
        font-weight: var(--font-semibold);
        color: var(--text-primary);
        margin-bottom: var(--space-1);
      }
      
      .action-desc {
        display: block;
        font-size: var(--text-xs);
        color: var(--text-tertiary);
      }
    }
    
    .action-arrow {
      color: var(--text-muted);
      transition: all 0.3s ease;
    }
    
    &:hover .action-arrow {
      color: var(--text-primary);
      transform: translateX(4px);
    }
  }
}

// 记录卡片
.records-card {
  .records-table {
    .table-header {
      display: grid;
      grid-template-columns: 120px 1fr 140px 140px 80px 80px;
      gap: var(--space-4);
      padding: var(--space-3) var(--space-4);
      background: var(--neutral-surface);
      border-radius: var(--radius-md);
      margin-bottom: var(--space-3);
      
      .th {
        font-size: var(--text-xs);
        font-weight: var(--font-semibold);
        color: var(--text-tertiary);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
    }
    
    .table-body {
      .table-row {
        display: grid;
        grid-template-columns: 120px 1fr 140px 140px 80px 80px;
        gap: var(--space-4);
        padding: var(--space-4);
        border-bottom: 1px solid var(--border-subtle);
        opacity: 0;
        transform: translateX(-20px);
        transition: all 0.4s ease;
        
        &.slide-in {
          opacity: 1;
          transform: translateX(0);
        }
        
        &:hover {
          background: var(--neutral-surface);
          border-radius: var(--radius-md);
        }
        
        &:last-child {
          border-bottom: none;
        }
        
        .td {
          font-size: var(--text-sm);
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          
          &.plate .plate-number {
            font-family: var(--font-mono);
            font-weight: var(--font-semibold);
            color: var(--text-primary);
            background: var(--glass-bg-hover);
            padding: var(--space-1) var(--space-3);
            border-radius: var(--radius-sm);
          }
          
          &.time {
            font-family: var(--font-mono);
            font-size: var(--text-xs);
          }
          
          .in-progress {
            color: var(--secondary-400);
            font-style: italic;
          }
          
          .calculating {
            color: var(--text-muted);
            font-style: italic;
          }
          
          .status-badge {
            display: inline-flex;
            align-items: center;
            padding: var(--space-1) var(--space-2);
            font-size: var(--text-xs);
            font-weight: var(--font-medium);
            border-radius: var(--radius-full);
            
            &.completed {
              background: var(--secondary-surface);
              color: var(--secondary-400);
            }
            
            &.active {
              background: var(--primary-surface);
              color: var(--primary-400);
            }
          }
          
          &.fee {
            font-family: var(--font-display);
            font-weight: var(--font-semibold);
            color: var(--accent-400);
          }
        }
      }
    }
  }
}

// 响应式调整
@media (max-width: 1024px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-4);
    
    .header-actions {
      width: 100%;
      justify-content: flex-end;
    }
  }
  
  .chart-card .card-body {
    flex-direction: column;
    align-items: center;
  }
  
  .records-card {
    .records-table {
      .table-header,
      .table-body .table-row {
        grid-template-columns: 100px 1fr 100px 100px 70px 60px;
        gap: var(--space-2);
      }
    }
  }
}
</style>
