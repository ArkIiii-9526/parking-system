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

    <!-- 停车场长条列表 -->
    <div class="parking-list">
      <div
        v-for="(item, index) in tableData"
        :key="item.id"
        class="parking-row-card"
        :class="{ 'animate-in': animated }"
        :style="{ animationDelay: `${index * 50}ms` }"
      >
        <div class="row-glow"></div>

        <div class="row-main">
          <div class="row-title-group">
            <div class="status-badge" :class="item.status === 1 ? 'active' : 'inactive'">
              <span class="status-dot"></span>
              {{ item.status === 1 ? '运营中' : '已停用' }}
            </div>
            <h3 class="parking-name">{{ item.name }}</h3>
          </div>

          <div class="row-meta">
            <div class="meta-item address">
              <span class="meta-label">地址</span>
              <p class="meta-value">
                <el-icon><Location /></el-icon>
                <span>{{ item.address }}</span>
              </p>
            </div>
            <div class="meta-item coordinate">
              <span class="meta-label">坐标</span>
              <p class="meta-value coordinate-text">
                <el-icon><MapLocation /></el-icon>
                <span>{{ formatCoordinate(item.longitude, item.latitude) }}</span>
              </p>
            </div>
          </div>
        </div>

        <div class="row-stats">
          <div class="stats-overview">
            <div class="stat-item">
              <div class="stat-value">{{ item.totalSpaces }}</div>
              <div class="stat-label">总车位</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ getUsedSpaces(item) }}</div>
              <div class="stat-label">已占用</div>
            </div>
            <div class="stat-item">
              <div class="stat-value" :class="item.availableSpaces > 0 ? 'available' : 'full'">
                {{ item.availableSpaces }}
              </div>
              <div class="stat-label">空闲</div>
            </div>
            <div class="stat-item emphasis">
              <div class="stat-value">{{ calculateUsageRate(item) }}%</div>
              <div class="stat-label">使用率</div>
            </div>
          </div>

          <div class="usage-track">
            <div class="usage-bar">
              <div class="usage-progress" :style="{ width: `${calculateUsageRate(item)}%` }" :class="getUsageClass(item)"></div>
            </div>
            <span class="usage-text">已用 {{ getUsedSpaces(item) }} / {{ item.totalSpaces }}</span>
          </div>
        </div>

        <div class="row-actions">
          <div class="icon-actions">
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

          <div class="primary-actions">
            <button class="billing-rule-btn" v-permission="'billing:rule:view'" @click="openBillingRuleDialog(item)">
              绑定计费
              <el-icon><Setting /></el-icon>
            </button>
            <button class="view-spaces-btn" @click="viewSpaces(item)">
              查看车位
              <el-icon><ArrowRight /></el-icon>
            </button>
          </div>
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

        <el-form-item label="地图选点">
          <div class="map-wrapper" style="width: 100%;">
            <div id="mapContainer" style="width: 100%; height: 240px; border-radius: 8px; border: 1px solid var(--glass-border); overflow: hidden; position: relative;"></div>
            <div style="font-size: 12px; color: var(--text-tertiary); margin-top: 4px;">点击地图快速获取经纬度及详细地址</div>
          </div>
        </el-form-item>

        <el-form-item label="车位识别">
          <div class="ai-count-hint">
            车位数量将由 AI 识别停车场平面图后自动同步，新增和编辑停车场时无需手动维护。
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

        <div class="detail-section detail-actions-section">
          <h4>快捷操作</h4>
          <div class="detail-actions-row">
            <button class="detail-rule-btn" v-permission="'billing:rule:view'" @click="openBillingRuleDialog(currentParking)">
              绑定计费规则
            </button>
            <button class="detail-link-btn" @click="viewSpaces(currentParking)">
              查看车位
            </button>
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

    <ParkingBillingRuleDialog
      v-model="billingRuleDialogVisible"
      :parking="selectedParkingForBilling"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import AMapLoader from '@amap/amap-jsapi-loader'
import ParkingBillingRuleDialog from './components/ParkingBillingRuleDialog.vue'
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
const billingRuleDialogVisible = ref(false)
const selectedParkingForBilling = ref(null)

// 地图实例
const mapInstance = ref(null)
const markerInstance = ref(null)
let AMapObj = null

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

const formData = reactive(createDefaultFormData())

const formRules = {
  name: [
    { required: true, message: '请输入停车场名称', trigger: 'blur' },
    { min: 2, max: 50, message: '名称长度在2-50个字符之间', trigger: 'blur' }
  ],
  address: [
    { required: true, message: '请输入地址', trigger: 'blur' }
  ]
}

function createDefaultFormData() {
  return {
    id: null,
    name: '',
    address: '',
    longitude: null,
    latitude: null,
    status: 1
  }
}

function resetParkingFormData() {
  Object.assign(formData, createDefaultFormData())
}

function buildParkingPayload() {
  return {
    ...(formData.id ? { id: formData.id } : {}),
    name: formData.name?.trim(),
    address: formData.address?.trim(),
    longitude: formData.longitude,
    latitude: formData.latitude,
    status: formData.status
  }
}

function calculateUsageRate(item) {
  if (!item.totalSpaces) return 0
  const used = getUsedSpaces(item)
  return Math.round((used / item.totalSpaces) * 100)
}

function getUsedSpaces(item) {
  const totalSpaces = Number(item?.totalSpaces) || 0
  const availableSpaces = Number(item?.availableSpaces) || 0
  return Math.max(totalSpaces - availableSpaces, 0)
}

function getUsageClass(item) {
  const rate = calculateUsageRate(item)
  if (rate >= 90) return 'critical'
  if (rate >= 70) return 'warning'
  return 'normal'
}

function formatCoordinate(lng, lat) {
  if (lng === null || lng === undefined || lat === null || lat === undefined) return '未设置'
  const nLng = Number(lng)
  const nLat = Number(lat)
  if (isNaN(nLng) || isNaN(nLat)) return '未设置'
  return `${nLng.toFixed(6)}, ${nLat.toFixed(6)}`
}

function viewSpaces(item) {
  router.push(`/parking-space?parkingId=${item.id}`)
}

function openBillingRuleDialog(parking) {
  if (!parking?.id) {
    ElMessage.warning('未找到有效停车场')
    return
  }
  selectedParkingForBilling.value = { ...parking }
  billingRuleDialogVisible.value = true
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

function initMap() {
  window._AMapSecurityConfig = {
    securityJsCode: 'c6c1265edc3d030c7baae5a773d69385'
  }
  AMapLoader.load({
    key: 'd963732f1faa63a7f398b0c114b65cad',
    version: '2.0',
    plugins: ['AMap.Geocoder']
  }).then((AMap) => {
    AMapObj = AMap
    mapInstance.value = new AMap.Map('mapContainer', {
      zoom: 15,
      center: formData.longitude && formData.latitude 
        ? [formData.longitude, formData.latitude] 
        : [116.397428, 39.90923]
    })

    if (formData.longitude && formData.latitude) {
      markerInstance.value = new AMap.Marker({
        position: [formData.longitude, formData.latitude],
        map: mapInstance.value
      })
    }

    mapInstance.value.on('click', (e) => {
      const lng = e.lnglat.getLng()
      const lat = e.lnglat.getLat()
      formData.longitude = lng
      formData.latitude = lat

      if (markerInstance.value) {
        markerInstance.value.setPosition([lng, lat])
      } else {
        markerInstance.value = new AMap.Marker({
          position: [lng, lat],
          map: mapInstance.value
        })
      }

      const geocoder = new AMap.Geocoder({ city: '全国' })
      geocoder.getAddress([lng, lat], (status, result) => {
        if (status === 'complete' && result.regeocode) {
          formData.address = result.regeocode.formattedAddress
        }
      })
    })
  }).catch((e) => {
    console.error('地图加载失败', e)
  })
}

function handleAdd() {
  dialogType.value = 'add'
  resetParkingFormData()
  dialogVisible.value = true
  nextTick(() => {
    initMap()
  })
}

function applyParkingFormData(parking = {}) {
  formData.id = parking.id ?? null
  formData.name = parking.name ?? ''
  formData.address = parking.address ?? ''
  formData.longitude = parking.longitude ?? null
  formData.latitude = parking.latitude ?? null
  formData.status = parking.status ?? 1
}

async function handleDetail(row) {
  parkingApiStats.value = null
  currentParking.value = { ...row }
  detailDrawerVisible.value = true
  try {
    const res = await getParkingDetail(row.id)
    if (res.code === 200) {
      currentParking.value = res.data
    }
    try {
      const statRes = await getParkingStatistics(row.id)
      if (statRes.code === 200 && statRes.data && typeof statRes.data === 'object') {
        parkingApiStats.value = statRes.data
      }
    } catch (_) {
      /* 统计接口可选 */
    }
  } catch (error) {
    console.error('获取停车场详情失败:', error)
  }
}

async function handleEdit(row) {
  dialogType.value = 'edit'
  applyParkingFormData(row)
  dialogVisible.value = true
  await nextTick()
  initMap()
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
    const payload = buildParkingPayload()

    if (dialogType.value === 'add') {
      const res = await createParking(payload)
      if (res.code === 200) {
        ElMessage.success('新增成功')
        dialogVisible.value = false
        loadData()
      } else {
        ElMessage.error(res.msg || '新增失败')
      }
    } else {
      const res = await updateParking(payload)
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

// 停车场长条列表
.parking-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.parking-row-card {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(320px, 1fr) 220px;
  gap: var(--space-5);
  align-items: center;
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
    transform: translateY(-2px);
    border-color: var(--glass-border-hover);
    box-shadow: var(--shadow-xl);

    .row-glow {
      opacity: 0.08;
    }
  }

  .row-glow {
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, rgba(99, 102, 241, 0.12), transparent 32%, transparent 70%, rgba(45, 212, 191, 0.08));
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
  }

  .row-main,
  .row-stats,
  .row-actions {
    position: relative;
    z-index: 1;
  }

  .row-main {
    min-width: 0;
  }

  .row-title-group {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-3);
    margin-bottom: var(--space-4);

    .parking-name {
      margin: 0;
      font-family: var(--font-display);
      font-size: var(--text-xl);
      font-weight: var(--font-semibold);
      color: var(--text-primary);
    }
  }

  .status-badge {
    display: inline-flex;
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

  .row-meta {
    display: grid;
    grid-template-columns: minmax(0, 1.35fr) minmax(220px, 0.85fr);
    gap: var(--space-4);

    .meta-item {
      min-width: 0;
      padding: var(--space-3) var(--space-4);
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-lg);

      .meta-label {
        display: block;
        margin-bottom: var(--space-2);
        font-size: var(--text-xs);
        color: var(--text-muted);
        letter-spacing: 0.04em;
      }

      .meta-value {
        display: flex;
        align-items: flex-start;
        gap: var(--space-2);
        margin: 0;
        font-size: var(--text-sm);
        color: var(--text-secondary);
        line-height: 1.6;

        .el-icon {
          flex-shrink: 0;
          margin-top: 3px;
          font-size: 14px;
          color: var(--primary-400);
        }

        span {
          min-width: 0;
          word-break: break-all;
        }
      }

      &.address .meta-value span {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    }
  }

  .row-stats {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    min-width: 0;
  }

  .stats-overview {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--space-3);

    .stat-item {
      padding: var(--space-3);
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-lg);
      text-align: center;

      &.emphasis {
        background: rgba(99, 102, 241, 0.08);
        border-color: rgba(99, 102, 241, 0.18);
      }

      .stat-value {
        font-family: var(--font-display);
        font-size: clamp(1.35rem, 2vw, 1.9rem);
        font-weight: var(--font-bold);
        color: var(--text-primary);
        line-height: 1.15;

        &.available {
          color: var(--secondary-400);
        }

        &.full {
          color: var(--accent-400);
        }
      }

      .stat-label {
        margin-top: var(--space-1);
        font-size: var(--text-xs);
        color: var(--text-muted);
      }
    }
  }

  .usage-track {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .usage-bar {
    flex: 1;
    height: 8px;
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

  .usage-text {
    flex-shrink: 0;
    font-size: var(--text-xs);
    color: var(--text-tertiary);
  }

  .row-actions {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    padding-left: var(--space-1);
    border-left: 1px solid var(--border-subtle);
  }

  .icon-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-2);

    .action-icon-btn {
      width: 34px;
      height: 34px;
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

  .primary-actions {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .billing-rule-btn,
  .view-spaces-btn {
    width: 100%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    padding: 10px 16px;
    border-radius: var(--radius-lg);
    font-size: var(--text-sm);
    font-weight: var(--font-semibold);
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .billing-rule-btn {
    background: rgba(15, 118, 110, 0.08);
    border: 1px solid rgba(15, 118, 110, 0.18);
    color: #0f766e;

    &:hover {
      background: rgba(15, 118, 110, 0.14);
      border-color: rgba(15, 118, 110, 0.3);
      transform: translateY(-1px);
    }

    .el-icon {
      font-size: 13px;
    }
  }

  .view-spaces-btn {
    background: rgba(99, 102, 241, 0.08);
    border: 1px solid rgba(99, 102, 241, 0.18);
    color: var(--primary-300);

    &:hover {
      background: rgba(99, 102, 241, 0.14);
      border-color: rgba(99, 102, 241, 0.32);
      color: white;
    }

    .el-icon {
      font-size: 13px;
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
  .ai-count-hint {
    width: 100%;
    padding: var(--space-3) var(--space-4);
    background: rgba(15, 118, 110, 0.08);
    border: 1px dashed rgba(15, 118, 110, 0.24);
    border-radius: var(--radius-md);
    color: var(--text-secondary);
    font-size: var(--text-sm);
    line-height: 1.6;
  }

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

  .detail-actions-section {
    .detail-actions-row {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-3);
    }

    .detail-rule-btn,
    .detail-link-btn {
      padding: var(--space-3) var(--space-4);
      border-radius: var(--radius-lg);
      font-size: var(--text-sm);
      font-weight: var(--font-semibold);
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .detail-rule-btn {
      color: #0f766e;
      background: rgba(15, 118, 110, 0.08);
      border: 1px solid rgba(15, 118, 110, 0.18);

      &:hover {
        background: rgba(15, 118, 110, 0.14);
        border-color: rgba(15, 118, 110, 0.28);
      }
    }

    .detail-link-btn {
      color: var(--text-secondary);
      background: var(--glass-bg);
      border: 1px solid var(--glass-border);

      &:hover {
        background: var(--glass-bg-active);
        border-color: var(--glass-border-hover);
        color: var(--text-primary);
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

  .parking-row-card {
    grid-template-columns: 1fr;
    gap: var(--space-4);

    .row-meta,
    .stats-overview,
    .primary-actions {
      grid-template-columns: 1fr;
      flex-direction: column;
    }

    .usage-track {
      flex-direction: column;
      align-items: stretch;
    }

    .row-actions {
      padding-top: var(--space-4);
      padding-left: 0;
      border-top: 1px solid var(--border-subtle);
      border-left: none;
    }

    .icon-actions {
      justify-content: flex-start;
    }
  }

  .pagination-wrapper {
    flex-direction: column;
    gap: var(--space-4);
    align-items: center;
  }
}

@media (max-width: 1200px) {
  .parking-row-card {
    grid-template-columns: 1fr;

    .row-actions {
      padding-top: var(--space-4);
      padding-left: 0;
      border-top: 1px solid var(--border-subtle);
      border-left: none;
    }

    .primary-actions {
      flex-direction: row;
    }
  }
}

@media (max-width: 900px) {
  .parking-row-card {
    .row-meta,
    .stats-overview,
    .primary-actions {
      grid-template-columns: 1fr;
      flex-direction: column;
    }
  }
}
</style>
