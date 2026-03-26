<template>
  <div class="parking-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">
          <span class="title-icon">
            <el-icon><OfficeBuilding /></el-icon>
          </span>
          停车场管理
        </h1>
        <p class="page-subtitle">管理所有停车场信息及车位配置</p>
      </div>
      <button class="add-btn" v-permission="'parking:add'" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        <span>新增停车场</span>
      </button>
    </div>

    <!-- 搜索筛选 -->
    <div class="filter-card">
      <div class="filter-row">
        <div class="filter-group">
          <div class="filter-input-wrapper">
            <el-icon class="filter-icon"><Search /></el-icon>
            <el-input
              v-model="filterForm.name"
              placeholder="搜索停车场名称..."
              clearable
              @keyup.enter="handleSearch"
            />
          </div>
          <div class="filter-input-wrapper">
            <el-icon class="filter-icon"><Location /></el-icon>
            <el-input
              v-model="filterForm.address"
              placeholder="搜索地址..."
              clearable
              @keyup.enter="handleSearch"
            />
          </div>
        </div>
        <div class="filter-actions">
          <button class="filter-btn primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            <span>搜索</span>
          </button>
          <button class="filter-btn" @click="handleReset">
            <el-icon><Refresh /></el-icon>
            <span>重置</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 附近停车场 -->
    <el-collapse class="nearby-collapse">
      <el-collapse-item title="附近停车场（按经纬度查询）" name="nearby">
        <div class="nearby-row">
          <el-input v-model="nearbyForm.longitude" placeholder="经度" style="width: 140px" clearable />
          <el-input v-model="nearbyForm.latitude" placeholder="纬度" style="width: 140px" clearable />
          <el-button type="primary" :loading="nearbyLoading" @click="fetchNearby">查询</el-button>
        </div>
        <el-table v-if="nearbyList.length" :data="nearbyList" border size="small" class="nearby-table">
          <el-table-column prop="name" label="名称" min-width="140" />
          <el-table-column prop="address" label="地址" min-width="180" show-overflow-tooltip />
          <el-table-column prop="availableSpaces" label="空位" width="80" />
          <el-table-column prop="totalSpaces" label="总车位" width="80" />
        </el-table>
        <el-empty v-else-if="nearbySearched" description="无结果" />
      </el-collapse-item>
    </el-collapse>

    <!-- 数据卡片网格 -->
    <div class="parking-grid">
      <div
        v-for="(item, index) in tableData"
        :key="item.id"
        class="parking-card"
        :class="{ 'animate-in': animated }"
        :style="{ animationDelay: `${index * 50}ms` }"
      >
        <div class="card-glow"></div>
        <div class="card-header">
          <div class="status-badge" :class="item.status === 1 ? 'active' : 'inactive'">
            <span class="status-dot"></span>
            {{ item.status === 1 ? '运营中' : '已停用' }}
          </div>
          <div class="card-actions">
            <button class="action-icon-btn" v-permission="'parking:view'" @click="handleDetail(item)" title="查看详情">
              <el-icon><View /></el-icon>
            </button>
            <button class="action-icon-btn" v-permission="'parking:edit'" @click="handleEdit(item)" title="编辑">
              <el-icon><Edit /></el-icon>
            </button>
            <button class="action-icon-btn danger" v-permission="'parking:delete'" @click="handleDelete(item)" title="删除">
              <el-icon><Delete /></el-icon>
            </button>
          </div>
        </div>

        <div class="card-body">
          <h3 class="parking-name">{{ item.name }}</h3>
          <p class="parking-address">
            <el-icon><Location /></el-icon>
            <span>{{ item.address }}</span>
          </p>

          <div class="parking-stats">
            <div class="stat-item">
              <div class="stat-value">{{ item.totalSpaces }}</div>
              <div class="stat-label">总车位</div>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <div class="stat-value" :class="item.availableSpaces > 0 ? 'available' : 'full'">
                {{ item.availableSpaces }}
              </div>
              <div class="stat-label">空闲</div>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <div class="stat-value">{{ calculateUsageRate(item) }}%</div>
              <div class="stat-label">使用率</div>
            </div>
          </div>

          <div class="usage-bar">
            <div class="usage-progress" :style="{ width: `${calculateUsageRate(item)}%` }" :class="getUsageClass(item)"></div>
          </div>
        </div>

        <div class="card-footer">
          <div class="coordinate-info">
            <el-icon><MapLocation /></el-icon>
            <span>{{ formatCoordinate(item.longitude, item.latitude) }}</span>
          </div>
          <button class="view-spaces-btn" @click="viewSpaces(item)">
            查看车位
            <el-icon><ArrowRight /></el-icon>
          </button>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="tableData.length === 0 && !loading" class="empty-state">
      <div class="empty-icon">
        <el-icon><OfficeBuilding /></el-icon>
      </div>
      <h3>暂无停车场数据</h3>
      <p>点击上方按钮添加第一个停车场</p>
    </div>

    <!-- 分页 -->
    <div class="pagination-wrapper" v-if="pagination.total > 0">
      <div class="pagination-info">
        共 <span class="highlight">{{ pagination.total }}</span> 条记录
      </div>
      <el-pagination
        v-model:current-page="pagination.pageNo"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[12, 24, 48, 96]"
        :total="pagination.total"
        layout="sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '新增停车场' : '编辑停车场'"
      width="560px"
      :close-on-click-modal="false"
      class="glass-dialog"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="90px" class="parking-form">
        <el-form-item label="停车场名称" prop="name">
          <div class="form-input-wrapper">
            <el-icon><OfficeBuilding /></el-icon>
            <el-input v-model="formData.name" placeholder="请输入停车场名称" />
          </div>
        </el-form-item>

        <el-form-item label="详细地址" prop="address">
          <div class="form-input-wrapper">
            <el-icon><Location /></el-icon>
            <el-input v-model="formData.address" placeholder="请输入详细地址" />
          </div>
        </el-form-item>

        <div class="form-row">
          <el-form-item label="经度" prop="longitude">
            <el-input-number v-model="formData.longitude" :precision="6" :step="0.000001" placeholder="经度" style="width: 100%" />
          </el-form-item>
          <el-form-item label="纬度" prop="latitude">
            <el-input-number v-model="formData.latitude" :precision="6" :step="0.000001" placeholder="纬度" style="width: 100%" />
          </el-form-item>
        </div>

        <el-form-item label="车位数量" prop="totalSpaces">
          <div class="form-input-wrapper">
            <el-icon><Grid /></el-icon>
            <el-input-number v-model="formData.totalSpaces" :min="1" :max="10000" placeholder="请输入车位数量" style="width: 100%" />
          </div>
        </el-form-item>

        <el-form-item label="运营状态" prop="status" v-if="dialogType === 'edit'">
          <el-switch
            v-model="formData.status"
            :active-value="1"
            :inactive-value="0"
            active-text="运营中"
            inactive-text="已停用"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <button class="dialog-btn" @click="dialogVisible = false">取消</button>
          <button class="dialog-btn primary" @click="handleSubmit" :disabled="submitLoading">
            <span v-if="!submitLoading">{{ dialogType === 'add' ? '创建' : '保存' }}</span>
            <span v-else class="loading-text">
              <span class="loading-spinner"></span>
              处理中...
            </span>
          </button>
        </div>
      </template>
    </el-dialog>

    <!-- 详情抽屉 -->
    <el-drawer
      v-model="detailDrawerVisible"
      title="停车场详情"
      size="480px"
      class="detail-drawer"
    >
      <div v-if="currentParking" class="detail-content">
        <div class="detail-header">
          <div class="detail-icon">
            <el-icon><OfficeBuilding /></el-icon>
          </div>
          <div class="detail-title">
            <h3>{{ currentParking.name }}</h3>
            <span class="detail-status" :class="currentParking.status === 1 ? 'active' : 'inactive'">
              {{ currentParking.status === 1 ? '运营中' : '已停用' }}
            </span>
          </div>
        </div>

        <div class="detail-section">
          <h4>基本信息</h4>
          <div class="detail-item">
            <span class="item-label">地址</span>
            <span class="item-value">{{ currentParking.address }}</span>
          </div>
          <div class="detail-item">
            <span class="item-label">坐标</span>
            <span class="item-value">{{ formatCoordinate(currentParking.longitude, currentParking.latitude) }}</span>
          </div>
        </div>

        <div class="detail-section">
          <h4>车位统计</h4>
          <div class="detail-stats">
            <div class="detail-stat-card">
              <div class="stat-icon total">
                <el-icon><Grid /></el-icon>
              </div>
              <div class="stat-info">
                <span class="stat-value">{{ currentParking.totalSpaces }}</span>
                <span class="stat-label">总车位</span>
              </div>
            </div>
            <div class="detail-stat-card">
              <div class="stat-icon available">
                <el-icon><CircleCheck /></el-icon>
              </div>
              <div class="stat-info">
                <span class="stat-value">{{ currentParking.availableSpaces }}</span>
                <span class="stat-label">空闲</span>
              </div>
            </div>
            <div class="detail-stat-card">
              <div class="stat-icon used">
                <el-icon><Van /></el-icon>
              </div>
              <div class="stat-info">
                <span class="stat-value">{{ currentParking.totalSpaces - currentParking.availableSpaces }}</span>
                <span class="stat-label">已使用</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="parkingApiStats && Object.keys(parkingApiStats).length" class="detail-section">
          <h4>车位统计（接口）</h4>
          <div class="detail-item" v-for="(val, key) in parkingApiStats" :key="key">
            <span class="item-label">{{ key }}</span>
            <span class="item-value">{{ typeof val === 'object' ? JSON.stringify(val) : val }}</span>
          </div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getParkingPage,
  createParking,
  updateParking,
  deleteParking,
  getParkingDetail,
  getNearbyParkings,
  getParkingStatistics
} from '@/api/parking'

const router = useRouter()
const loading = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)
const detailDrawerVisible = ref(false)
const dialogType = ref('add')
const formRef = ref(null)
const animated = ref(false)
const currentParking = ref(null)
const parkingApiStats = ref(null)

const nearbyForm = reactive({ longitude: '', latitude: '' })
const nearbyLoading = ref(false)
const nearbyList = ref([])
const nearbySearched = ref(false)

const tableData = ref([])
const filterForm = reactive({
  name: '',
  address: ''
})

const pagination = reactive({
  pageNo: 1,
  pageSize: 12,
  total: 0
})

const formData = reactive({
  id: null,
  name: '',
  address: '',
  longitude: null,
  latitude: null,
  totalSpaces: 100,
  status: 1
})

const formRules = {
  name: [
    { required: true, message: '请输入停车场名称', trigger: 'blur' },
    { min: 2, max: 50, message: '名称长度在2-50个字符之间', trigger: 'blur' }
  ],
  address: [
    { required: true, message: '请输入地址', trigger: 'blur' }
  ],
  totalSpaces: [
    { required: true, message: '请输入车位数', trigger: 'blur' }
  ]
}

function calculateUsageRate(item) {
  if (!item.totalSpaces) return 0
  const used = item.totalSpaces - (item.availableSpaces || 0)
  return Math.round((used / item.totalSpaces) * 100)
}

function getUsageClass(item) {
  const rate = calculateUsageRate(item)
  if (rate >= 90) return 'critical'
  if (rate >= 70) return 'warning'
  return 'normal'
}

function formatCoordinate(lng, lat) {
  if (!lng || !lat) return '未设置'
  return `${lng.toFixed(6)}, ${lat.toFixed(6)}`
}

function viewSpaces(item) {
  router.push(`/parking-space?parkingId=${item.id}`)
}

async function fetchNearby() {
  if (!nearbyForm.longitude || !nearbyForm.latitude) {
    ElMessage.warning('请填写经度、纬度')
    return
  }
  nearbyLoading.value = true
  nearbySearched.value = true
  try {
    const res = await getNearbyParkings({
      longitude: nearbyForm.longitude,
      latitude: nearbyForm.latitude
    })
    if (res.code === 200) {
      nearbyList.value = Array.isArray(res.data) ? res.data : res.data?.records || []
    }
  } catch (e) {
    console.error(e)
    nearbyList.value = []
  } finally {
    nearbyLoading.value = false
  }
}

async function loadData() {
  loading.value = true
  try {
    const res = await getParkingPage({
      pageNo: pagination.pageNo,
      pageSize: pagination.pageSize,
      name: filterForm.name,
      address: filterForm.address
    })
    if (res.code === 200) {
      tableData.value = res.data.records || []
      pagination.total = res.data.total || 0
      animated.value = false
      setTimeout(() => {
        animated.value = true
      }, 100)
    }
  } catch (error) {
    console.error('加载数据失败:', error)
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.pageNo = 1
  loadData()
}

function handleReset() {
  filterForm.name = ''
  filterForm.address = ''
  handleSearch()
}

function handleSizeChange(size) {
  pagination.pageSize = size
  loadData()
}

function handleCurrentChange(page) {
  pagination.pageNo = page
  loadData()
}

function handleAdd() {
  dialogType.value = 'add'
  Object.keys(formData).forEach(key => {
    if (key === 'totalSpaces') {
      formData[key] = 100
    } else if (key === 'status') {
      formData[key] = 1
    } else {
      formData[key] = null
    }
  })
  dialogVisible.value = true
}

async function handleDetail(row) {
  parkingApiStats.value = null
  try {
    const res = await getParkingDetail(row.id)
    if (res.code === 200) {
      currentParking.value = res.data
      detailDrawerVisible.value = true
    }
    try {
      const statRes = await getParkingStatistics(row.id)
      if (statRes.code === 200 && statRes.data && typeof statRes.data === 'object') {
        parkingApiStats.value = statRes.data
      }
    } catch (_) {
      /* 统计接口可选 */
    }
  } catch (_) {
    ElMessage.error('获取详情失败')
  }
}

async function handleEdit(row) {
  dialogType.value = 'edit'
  try {
    const res = await getParkingDetail(row.id)
    if (res.code === 200) {
      Object.assign(formData, res.data)
      dialogVisible.value = true
    }
  } catch (_) {
    ElMessage.error('获取详情失败')
  }
}

function handleDelete(row) {
  ElMessageBox.confirm(
    `<div class="confirm-content">
      <div class="confirm-icon warning">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </div>
      <h4>确认删除</h4>
      <p>确定要删除停车场 "${row.name}" 吗？<br>此操作不可恢复。</p>
    </div>`,
    '提示',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      dangerouslyUseHTMLString: true,
      customClass: 'delete-confirm-dialog'
    }
  ).then(async () => {
    try {
      const res = await deleteParking(row.id)
      if (res.code === 200) {
        ElMessage.success('删除成功')
        loadData()
      } else {
        ElMessage.error(res.msg || '删除失败')
      }
    } catch (_) {
      ElMessage.error('删除失败')
    }
  })
}

async function handleSubmit() {
  try {
    await formRef.value.validate()
    submitLoading.value = true

    if (dialogType.value === 'add') {
      const res = await createParking(formData)
      if (res.code === 200) {
        ElMessage.success('新增成功')
        dialogVisible.value = false
        loadData()
      } else {
        ElMessage.error(res.msg || '新增失败')
      }
    } else {
      const res = await updateParking(formData)
      if (res.code === 200) {
        ElMessage.success('更新成功')
        dialogVisible.value = false
        loadData()
      } else {
        ElMessage.error(res.msg || '更新失败')
      }
    }
  } catch (error) {
    console.error('提交失败:', error)
  } finally {
    submitLoading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style lang="scss" scoped>
.parking-page {
  padding: var(--space-6);
  max-width: 1600px;
  margin: 0 auto;
}

.nearby-collapse {
  margin-bottom: var(--space-4);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.nearby-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  align-items: center;
  margin-bottom: var(--space-3);
}

.nearby-table {
  margin-top: var(--space-2);
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

  .add-btn {
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
    gap: var(--space-3);
    flex: 1;

    @media (max-width: 768px) {
      flex-direction: column;
    }
  }

  .filter-input-wrapper {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-4);
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-lg);
    transition: all 0.3s ease;
    flex: 1;

    &:hover, &:focus-within {
      border-color: var(--glass-border-hover);
      background: var(--glass-bg-hover);
    }

    .filter-icon {
      font-size: 16px;
      color: var(--text-muted);
    }

    :deep(.el-input) {
      flex: 1;

      .el-input__wrapper {
        background: transparent;
        box-shadow: none;
        padding: 0;

        .el-input__inner {
          color: var(--text-primary);
          font-size: var(--text-sm);

          &::placeholder {
            color: var(--text-muted);
          }
        }
      }
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
      font-size: 14px;
    }
  }
}

// 停车场卡片网格
.parking-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: var(--space-5);
  margin-bottom: var(--space-6);
}

.parking-card {
  position: relative;
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
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

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-4);
    position: relative;
    z-index: 1;

    .status-badge {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-1) var(--space-3);
      font-size: var(--text-xs);
      font-weight: var(--font-medium);
      border-radius: var(--radius-full);

      &.active {
        background: var(--secondary-surface);
        color: var(--secondary-400);

        .status-dot {
          background: var(--secondary-500);
          box-shadow: 0 0 8px var(--secondary-500);
        }
      }

      &.inactive {
        background: var(--neutral-surface);
        color: var(--text-muted);

        .status-dot {
          background: var(--text-muted);
        }
      }

      .status-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
      }
    }

    .card-actions {
      display: flex;
      align-items: center;
      gap: var(--space-2);

      .action-icon-btn {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--glass-bg);
        border: 1px solid var(--glass-border);
        border-radius: var(--radius-md);
        color: var(--text-tertiary);
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
          background: var(--glass-bg-active);
          border-color: var(--glass-border-hover);
          color: var(--text-primary);
        }

        &.danger:hover {
          background: var(--accent-surface);
          border-color: color-mix(in srgb, var(--accent-500) 35%, transparent);
          color: var(--accent-400);
        }

        .el-icon {
          font-size: 14px;
        }
      }
    }
  }

  .card-body {
    position: relative;
    z-index: 1;

    .parking-name {
      font-family: var(--font-display);
      font-size: var(--text-lg);
      font-weight: var(--font-semibold);
      color: var(--text-primary);
      margin-bottom: var(--space-2);
    }

    .parking-address {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--text-sm);
      color: var(--text-tertiary);
      margin-bottom: var(--space-4);

      .el-icon {
        font-size: 14px;
        color: var(--primary-400);
      }

      span {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }

    .parking-stats {
      display: flex;
      align-items: center;
      gap: var(--space-4);
      margin-bottom: var(--space-4);

      .stat-item {
        text-align: center;

        .stat-value {
          font-family: var(--font-display);
          font-size: var(--text-2xl);
          font-weight: var(--font-bold);
          color: var(--text-primary);
          line-height: 1.2;

          &.available {
            color: var(--secondary-400);
          }

          &.full {
            color: var(--accent-400);
          }
        }

        .stat-label {
          font-size: var(--text-xs);
          color: var(--text-muted);
          margin-top: var(--space-1);
        }
      }

      .stat-divider {
        width: 1px;
        height: 40px;
        background: var(--glass-bg-active);
      }
    }

    .usage-bar {
      height: 6px;
      background: var(--glass-bg-active);
      border-radius: var(--radius-full);
      overflow: hidden;

      .usage-progress {
        height: 100%;
        border-radius: var(--radius-full);
        transition: width 0.5s ease;

        &.normal {
          background: linear-gradient(90deg, var(--secondary-500), var(--secondary-400));
        }

        &.warning {
          background: linear-gradient(90deg, var(--warning-500), var(--warning-400));
        }

        &.critical {
          background: linear-gradient(90deg, var(--accent-500), var(--accent-400));
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
    position: relative;
    z-index: 1;

    .coordinate-info {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--text-xs);
      color: var(--text-muted);

      .el-icon {
        font-size: 12px;
      }
    }

    .view-spaces-btn {
      display: flex;
      align-items: center;
      gap: var(--space-1);
      font-size: var(--text-sm);
      font-weight: var(--font-medium);
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

// 空状态
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-20);
  text-align: center;

  .empty-icon {
    width: 80px;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-xl);
    margin-bottom: var(--space-4);

    .el-icon {
      font-size: 40px;
      color: var(--text-muted);
    }
  }

  h3 {
    font-size: var(--text-lg);
    font-weight: var(--font-semibold);
    color: var(--text-primary);
    margin-bottom: var(--space-2);
  }

  p {
    font-size: var(--text-sm);
    color: var(--text-tertiary);
  }
}

// 分页
.pagination-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) 0;

  .pagination-info {
    font-size: var(--text-sm);
    color: var(--text-tertiary);

    .highlight {
      color: var(--primary-400);
      font-weight: var(--font-semibold);
    }
  }

  :deep(.el-pagination) {
    .el-pagination__sizes {
      .el-select {
        .el-input__wrapper,
        .el-select__wrapper {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          box-shadow: none;

          .el-input__inner,
          .el-select__selected-item {
            color: var(--text-primary);
          }
        }
      }
    }

    .el-pager {
      li {
        background: var(--glass-bg);
        border: 1px solid var(--glass-border);
        color: var(--text-secondary);

        &:hover {
          color: var(--text-primary);
          border-color: var(--glass-border-hover);
        }

        &.is-active {
          background: var(--primary-500);
          border-color: var(--primary-500);
          color: white;
        }
      }
    }

    .btn-prev,
    .btn-next {
      background: var(--glass-bg);
      border: 1px solid var(--glass-border);
      color: var(--text-secondary);

      &:hover {
        color: var(--text-primary);
      }

      &:disabled {
        opacity: 0.5;
      }
    }

    .el-pagination__jump {
      color: var(--text-tertiary);

      .el-input__wrapper {
        background: var(--glass-bg);
        border: 1px solid var(--glass-border);
        box-shadow: none;

        .el-input__inner {
          color: var(--text-primary);
        }
      }
    }
  }
}

// 表单样式
.parking-form {
  .form-input-wrapper {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-md);
    transition: all 0.3s ease;

    &:hover, &:focus-within {
      border-color: var(--glass-border-hover);
    }

    .el-icon {
      font-size: 16px;
      color: var(--text-muted);
    }

    :deep(.el-input) {
      flex: 1;

      .el-input__wrapper {
        background: transparent;
        box-shadow: none;
        padding: 0;

        .el-input__inner {
          color: var(--text-primary);
        }
      }
    }

    :deep(.el-input-number) {
      flex: 1;

      .el-input__wrapper {
        background: transparent;
        box-shadow: none;
        padding: 0;

        .el-input__inner {
          color: var(--text-primary);
          text-align: left;
        }
      }
    }
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-4);
  }

  :deep(.el-form-item__label) {
    color: var(--text-secondary);
  }

  :deep(.el-switch__label) {
    color: var(--text-tertiary);

    &.is-active {
      color: var(--text-primary);
    }
  }
}

// 对话框底部
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);

  .dialog-btn {
    padding: var(--space-3) var(--space-5);
    font-size: var(--text-sm);
    font-weight: var(--font-medium);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all 0.3s ease;

    &:not(.primary) {
      background: var(--glass-bg);
      border: 1px solid var(--glass-border);
      color: var(--text-secondary);

      &:hover {
        background: var(--glass-bg-active);
        border-color: var(--glass-border-hover);
        color: var(--text-primary);
      }
    }

    &.primary {
      background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
      border: none;
      color: white;
      box-shadow: var(--shadow-glow-primary);

      &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: var(--shadow-lg), var(--shadow-glow-primary);
      }

      &:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }
    }

    .loading-text {
      display: flex;
      align-items: center;
      gap: var(--space-2);

      .loading-spinner {
        width: 14px;
        height: 14px;
        border: 2px solid var(--glass-border-hover);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
    }
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

// 详情抽屉
.detail-content {
  .detail-header {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    padding-bottom: var(--space-5);
    border-bottom: 1px solid var(--border-subtle);
    margin-bottom: var(--space-5);

    .detail-icon {
      width: 64px;
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-glow-primary);

      .el-icon {
        font-size: 32px;
        color: white;
      }
    }

    .detail-title {
      h3 {
        font-family: var(--font-display);
        font-size: var(--text-xl);
        font-weight: var(--font-semibold);
        color: var(--text-primary);
        margin-bottom: var(--space-2);
      }

      .detail-status {
        display: inline-flex;
        align-items: center;
        padding: var(--space-1) var(--space-3);
        font-size: var(--text-xs);
        font-weight: var(--font-medium);
        border-radius: var(--radius-full);

        &.active {
          background: var(--secondary-surface);
          color: var(--secondary-400);
        }

        &.inactive {
          background: var(--neutral-surface);
          color: var(--text-muted);
        }
      }
    }
  }

  .detail-section {
    margin-bottom: var(--space-6);

    h4 {
      font-size: var(--text-sm);
      font-weight: var(--font-semibold);
      color: var(--text-primary);
      margin-bottom: var(--space-4);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .detail-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-3) 0;
      border-bottom: 1px solid var(--border-subtle);

      .item-label {
        font-size: var(--text-sm);
        color: var(--text-tertiary);
      }

      .item-value {
        font-size: var(--text-sm);
        color: var(--text-primary);
        font-weight: var(--font-medium);
      }
    }
  }

  .detail-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-3);

    .detail-stat-card {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-4);
      background: var(--glass-bg);
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-lg);

      .stat-icon {
        width: 44px;
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--radius-md);

        &.total {
          background: var(--primary-surface);
          color: var(--primary-400);
        }

        &.available {
          background: var(--secondary-surface);
          color: var(--secondary-400);
        }

        &.used {
          background: var(--accent-surface);
          color: var(--accent-400);
        }

        .el-icon {
          font-size: 20px;
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

// 响应式
@media (max-width: 768px) {
  .parking-page {
    padding: var(--space-4);
  }

  .parking-grid {
    grid-template-columns: 1fr;
  }

  .pagination-wrapper {
    flex-direction: column;
    gap: var(--space-4);
    align-items: center;
  }
}
</style>
