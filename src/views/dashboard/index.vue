<template>
  <div class="dashboard-container">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-icon parking">
            <el-icon><Van /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.totalParkings }}</div>
            <div class="stat-label">停车场总数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-icon spaces">
            <el-icon><Grid /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.totalSpaces }}</div>
            <div class="stat-label">停车位总数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-icon available">
            <el-icon><CircleCheck /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.availableSpaces }}</div>
            <div class="stat-label">可用车位</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-icon revenue">
            <el-icon><Money /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">¥{{ stats.todayRevenue }}</div>
            <div class="stat-label">今日营收</div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="16">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>停车位使用情况</span>
            </div>
          </template>
          <div class="chart-container">
            <div class="parking-status">
              <div class="status-item">
                <span class="status-label">空闲</span>
                <el-progress 
                  :percentage="stats.usageRate" 
                  :stroke-width="20"
                  status="success"
                />
              </div>
              <div class="status-item">
                <span class="status-label">占用</span>
                <el-progress 
                  :percentage="100 - stats.usageRate" 
                  :stroke-width="20"
                  status="exception"
                />
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>快速操作</span>
            </div>
          </template>
          <div class="quick-actions">
            <el-button type="primary" @click="handleQuickEntry">
              <el-icon><Plus /></el-icon>
              车辆入场
            </el-button>
            <el-button type="success" @click="handleQuickExit">
              <el-icon><Minus /></el-icon>
              车辆出场
            </el-button>
            <el-button type="warning" @click="handleQuickQuery">
              <el-icon><Search /></el-icon>
              车辆查询
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="24">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>最近车辆进出记录</span>
            </div>
          </template>
          <el-table :data="recentRecords" stripe style="width: 100%">
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
                <el-tag :type="row.status === 1 ? 'success' : 'warning'">
                  {{ row.status === 1 ? '已出场' : '在场' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
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
      const parkings = parkingRes.data.records || []
      stats.totalParkings = parkingRes.data.total || 0
      
      stats.totalSpaces = parkings.reduce((sum, p) => sum + (p.totalSpaces || 0), 0)
      stats.availableSpaces = parkings.reduce((sum, p) => sum + (p.availableSpaces || 0), 0)
      
      if (stats.totalSpaces > 0) {
        stats.usageRate = Math.round(((stats.totalSpaces - stats.availableSpaces) / stats.totalSpaces) * 100)
      }
    }
    
    // 获取营收数据
    try {
      const revenueRes = await getDailyStatistics()
      if (revenueRes.code === 200 && revenueRes.data) {
        stats.todayRevenue = revenueRes.data.totalAmount || 0
      }
    } catch (e) {
      console.error('获取营收数据失败:', e.response?.status, e.response?.config?.url, e)
    }
    
    // 获取车辆记录
    if (parkingRes.data.records.length > 0) {
      try {
        const recordsRes = await getVehicleRecordsByParking(parkingRes.data.records[0].id, { pageNo: 1, pageSize: 10 })
        if (recordsRes.code === 200) {
          recentRecords.value = (recordsRes.data.records || []).map(record => ({
            ...record,
            parkingName: parkingRes.data.records.find(p => p.id === record.parkingId)?.name || ''
          }))
        }
      } catch (e) {
        console.error('获取车辆记录失败:', e.response?.status, e.response?.config?.url, e)
      }
    }
  } catch (error) {
    console.error('加载数据失败:', error.response?.status, error.response?.config?.url, error)
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
}

.stat-card {
  border-radius: 8px;
  
  :deep(.el-card__body) {
    display: flex;
    align-items: center;
    padding: 20px;
  }
  
  .stat-icon {
    width: 56px;
    height: 56px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 16px;
    
    .el-icon {
      font-size: 28px;
      color: #ffffff;
    }
    
    &.parking {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    
    &.spaces {
      background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
    }
    
    &.available {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    }
    
    &.revenue {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    }
  }
  
  .stat-info {
    .stat-value {
      font-size: 28px;
      font-weight: 600;
      color: #303133;
      line-height: 1.2;
    }
    
    .stat-label {
      font-size: 14px;
      color: #909399;
      margin-top: 4px;
    }
  }
}

.chart-card {
  border-radius: 8px;
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 16px;
    font-weight: 500;
  }
  
  .chart-container {
    .parking-status {
      .status-item {
        margin-bottom: 20px;
        
        .status-label {
          display: block;
          margin-bottom: 8px;
          font-size: 14px;
          color: #606266;
        }
      }
    }
  }
  
  .quick-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    
    .el-button {
      flex: 1;
      min-width: 120px;
    }
  }
}
</style>
