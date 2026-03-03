<template>
  <div class="dashboard-container">
    <el-row :gutter="24">
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon parking">
            <el-icon><Van /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.totalParkings }}</div>
            <div class="stat-label">停车场总数</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon spaces">
            <el-icon><Grid /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.totalSpaces }}</div>
            <div class="stat-label">停车位总数</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon available">
            <el-icon><CircleCheck /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.availableSpaces }}</div>
            <div class="stat-label">可用车位</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon revenue">
            <el-icon><Money /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">¥{{ stats.todayRevenue }}</div>
            <div class="stat-label">今日营收</div>
          </div>
        </div>
      </el-col>
    </el-row>
    
    <el-row :gutter="24" class="mt-4">
      <el-col :span="16">
        <div class="card">
          <div class="card-header">
            <h3>停车位使用情况</h3>
          </div>
          <div class="card-body">
            <div class="parking-status">
              <div class="status-item">
                <div class="status-header">
                  <span class="status-label">占用</span>
                  <span class="status-percentage">{{ stats.usageRate }}%</span>
                </div>
                <el-progress 
                  :percentage="stats.usageRate" 
                  :stroke-width="12"
                  status="success"
                  class="status-progress"
                />
              </div>
              <div class="status-item">
                <div class="status-header">
                  <span class="status-label">空闲</span>
                  <span class="status-percentage">{{ 100 - stats.usageRate }}%</span>
                </div>
                <el-progress 
                  :percentage="100 - stats.usageRate" 
                  :stroke-width="12"
                  status="info"
                  class="status-progress"
                />
              </div>
            </div>
          </div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="card">
          <div class="card-header">
            <h3>快速操作</h3>
          </div>
          <div class="card-body">
            <div class="quick-actions">
              <el-button type="primary" @click="handleQuickEntry" class="action-btn primary">
                <el-icon class="btn-icon"><Plus /></el-icon>
                <span>车辆入场</span>
              </el-button>
              <el-button type="success" @click="handleQuickExit" class="action-btn success">
                <el-icon class="btn-icon"><Minus /></el-icon>
                <span>车辆出场</span>
              </el-button>
              <el-button type="warning" @click="handleQuickQuery" class="action-btn warning">
                <el-icon class="btn-icon"><Search /></el-icon>
                <span>车辆查询</span>
              </el-button>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>
    
    <el-row :gutter="24" class="mt-4">
      <el-col :span="24">
        <div class="card">
          <div class="card-header">
            <h3>最近车辆进出记录</h3>
          </div>
          <div class="card-body">
            <el-table :data="recentRecords" class="records-table">
              <el-table-column prop="carNo" label="车牌号" width="150" />
              <el-table-column prop="parkingName" label="停车场" width="200" />
              <el-table-column prop="entryTime" label="入场时间" width="180">
                <template #default="{ row }">
                  {{ formatTime(row.entryTime) }}
                </template>
              </el-table-column>
              <el-table-column prop="exitTime" label="出场时间" width="180">
                <template #default="{ row }">
                  {{ row.exitTime ? formatTime(row.exitTime) : '-' }}
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="row.status === 1 ? 'success' : 'warning'" class="status-tag">
                    {{ row.status === 1 ? '已出场' : '在场' }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getParkingPage } from '@/api/parking'
import { getDailyStatistics } from '@/api/billing'
import { getVehicleRecordsByParking } from '@/api/vehicle'

const stats = reactive({
  totalParkings: 0,
  totalSpaces: 0,
  availableSpaces: 0,
  todayRevenue: 0,
  usageRate: 0
})

const recentRecords = ref([])

function formatTime(time) {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}

async function loadDashboardData() {
  try {
    // 获取停车场列表
    const parkingRes = await getParkingPage({ pageNo: 1, pageSize: 100 })
    if (parkingRes.code === 200) {
      const parkings = parkingRes.data?.records || []
      stats.totalParkings = parkingRes.data?.total || 0
      
      stats.totalSpaces = parkings.reduce((sum, p) => sum + (p.totalSpaces || 0), 0)
      stats.availableSpaces = parkings.reduce((sum, p) => sum + (p.availableSpaces || 0), 0)
      
      if (stats.totalSpaces > 0) {
        stats.usageRate = Math.round(((stats.totalSpaces - stats.availableSpaces) / stats.totalSpaces) * 100)
      }
      
      // 获取车辆记录
      if (parkings.length > 0) {
        try {
          const recordsRes = await getVehicleRecordsByParking(parkings[0].id, { pageNo: 1, pageSize: 10 })
          if (recordsRes.code === 200) {
            recentRecords.value = (recordsRes.data?.records || []).map(record => ({
              ...record,
              parkingName: parkings.find(p => p.id === record.parkingId)?.name || ''
            }))
          }
        } catch (e) {
          console.error('获取车辆记录失败:', e)
          // 不显示错误提示，避免影响用户体验
        }
      }
    }
    
    // 获取营收数据
    let formattedDate = ''
    try {
      // 使用YYYY-MM-DD格式的日期，符合后端API预期
      const today = new Date()
      formattedDate = today.toISOString().split('T')[0]
      // 确保date参数是字符串类型，避免JavaScript将其解析为数字表达式
      const revenueRes = await getDailyStatistics({ date: String(formattedDate) })
      if (revenueRes.code === 200 && revenueRes.data) {
        stats.todayRevenue = revenueRes.data.totalAmount || 0
      }
    } catch (e) {
      console.error('获取营收数据失败:', e)
      console.error('请求参数:', { date: formattedDate })
      // 添加更详细的错误信息，方便调试
      if (e.response) {
        console.error('响应状态:', e.response.status)
        console.error('响应数据:', e.response.data)
      } else if (e.request) {
        console.error('无响应数据，请求可能未到达后端')
      }
    }
  } catch (error) {
    console.error('加载数据失败:', error)
    // 不显示错误提示，避免影响用户体验
  }
}

function handleQuickEntry() {
  // TODO: 打开车辆入场对话框
}

function handleQuickExit() {
  // TODO: 打开车辆出场对话框
}

function handleQuickQuery() {
  // TODO: 打开车辆查询对话框
}

onMounted(() => {
  loadDashboardData()
})
</script>

<style lang="scss" scoped>
.dashboard-container {
  padding: 0;
  overflow: hidden;
}

.stat-card {
  background: var(--surface);
  border-radius: var(--border-radius-lg);
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  padding: var(--spacing-lg);
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    transform: translateY(-2px);
  }
  
  .stat-icon {
    width: 64px;
    height: 64px;
    border-radius: var(--border-radius-lg);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: var(--spacing-md);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    
    .el-icon {
      font-size: 32px;
      color: var(--white);
    }
    
    &.parking {
      background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
    }
    
    &.spaces {
      background: linear-gradient(135deg, var(--success-color) 0%, #388e3c 100%);
    }
    
    &.available {
      background: linear-gradient(135deg, var(--warning-color) 0%, #e65100 100%);
    }
    
    &.revenue {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    }
  }
  
  .stat-info {
    flex: 1;
    
    .stat-value {
      font-size: 32px;
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1.2;
      margin-bottom: var(--spacing-xs);
    }
    
    .stat-label {
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
  }
}

.card {
  background: var(--surface);
  border-radius: var(--border-radius-lg);
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  overflow: hidden;
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  }
  
  .card-header {
    padding: var(--spacing-lg);
    border-bottom: 1px solid var(--border-color);
    background: var(--surface);
    
    h3 {
      margin: 0;
      font-size: var(--font-size-lg);
      font-weight: 600;
      color: var(--text-primary);
    }
  }
  
  .card-body {
    padding: var(--spacing-lg);
  }
  
  .parking-status {
    .status-item {
      margin-bottom: var(--spacing-lg);
      
      .status-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--spacing-sm);
        
        .status-label {
          font-size: var(--font-size-base);
          font-weight: 500;
          color: var(--text-primary);
        }
        
        .status-percentage {
          font-size: var(--font-size-sm);
          font-weight: 600;
          color: var(--text-secondary);
        }
      }
      
      .status-progress {
        .el-progress__bar {
          border-radius: var(--border-radius-sm);
        }
        
        .el-progress__text {
          font-size: var(--font-size-xs);
          color: var(--text-secondary);
        }
      }
    }
  }
  
  .quick-actions {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
    
    .action-btn {
      width: 100%;
      padding: var(--spacing-md);
      border-radius: var(--border-radius-base);
      font-weight: 500;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-sm);
      transition: all 0.2s ease;
      
      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      }
      
      .btn-icon {
        font-size: 16px;
      }
    }
  }
  
  .records-table {
    border-radius: var(--border-radius-base);
    overflow: hidden;
    
    :deep(.el-table__header-wrapper) {
      background-color: var(--surface-light);
      
      th.el-table__cell {
        background-color: var(--surface-light);
        font-weight: 600;
        color: var(--text-primary);
        border-bottom: 1px solid var(--border-color);
      }
    }
    
    :deep(.el-table__body-wrapper) {
      tr.el-table__row {
        transition: background-color 0.2s ease;
        
        &:hover {
          background-color: var(--surface-light);
        }
        
        td.el-table__cell {
          border-bottom: 1px solid var(--border-color-light);
        }
      }
    }
    
    .status-tag {
      border-radius: var(--border-radius-sm);
      font-size: var(--font-size-xs);
      padding: 2px 8px;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .el-row {
    .el-col {
      &:span-6 {
        margin-bottom: var(--spacing-md);
      }
      
      &:span-16,
      &:span-8 {
        margin-bottom: var(--spacing-md);
      }
    }
  }
  
  .stat-card {
    padding: var(--spacing-md);
    
    .stat-icon {
      width: 48px;
      height: 48px;
      margin-right: var(--spacing-sm);
      
      .el-icon {
        font-size: 24px;
      }
    }
    
    .stat-info {
      .stat-value {
        font-size: 24px;
      }
    }
  }
  
  .card {
    .card-header,
    .card-body {
      padding: var(--spacing-md);
    }
    
    .quick-actions {
      .action-btn {
        padding: var(--spacing-sm);
        font-size: var(--font-size-sm);
        
        .btn-icon {
          font-size: 14px;
        }
      }
    }
  }
}

@media (max-width: 480px) {
  .stat-card {
    flex-direction: column;
    text-align: center;
    
    .stat-icon {
      margin-right: 0;
      margin-bottom: var(--spacing-sm);
    }
  }
  
  .card {
    .parking-status {
      .status-item {
        .status-header {
          flex-direction: column;
          align-items: flex-start;
          gap: var(--spacing-xs);
        }
      }
    }
  }
}
</style>
