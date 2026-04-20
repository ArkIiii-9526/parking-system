<template>
  <div class="parking-space-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">
          <span class="title-icon">
            <el-icon><Grid /></el-icon>
          </span>
          车位管理
        </h1>
        <p class="page-subtitle">管理停车位状态、预约及配置信息</p>
      </div>
      <div class="header-actions">
        <button class="action-btn" v-permission="'space:add'" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          <span>新增车位</span>
        </button>
        <button class="action-btn secondary" v-permission="'space:add'" @click="aiImportVisible = true">
          <el-icon><Collection /></el-icon>
          <span>AI导入</span>
        </button>
        <button class="action-btn danger" v-permission="'space:delete'" @click="handleClearByParking" :disabled="!filterForm.parkingId">
          <el-icon><Delete /></el-icon>
          <span>清空当前停车场</span>
        </button>
        <button class="action-btn danger" v-permission="'space:delete'" @click="handleBatchDelete" :disabled="selectedSpaceIds.length === 0">
          <el-icon><Delete /></el-icon>
          <span v-if="selectedSpaceIds.length > 0">批量删除 ({{ selectedSpaceIds.length }})</span>
          <span v-else>批量删除</span>
        </button>
        <button class="action-btn secondary" v-if="tableData.length > 0" @click="toggleSelectAll">
          <el-icon><Select /></el-icon>
          <span>{{ selectedSpaceIds.length === tableData.length ? '取消全选' : '全选本页' }}</span>
        </button>
      </div>
    </div>

    <!-- 统计概览 -->
    <div class="stats-overview" v-if="filterForm.parkingId">
      <div class="stat-card total">
        <div class="stat-icon">
          <el-icon><Grid /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ spaceStats.total }}</span>
          <span class="stat-label">总车位</span>
        </div>
      </div>
      <div class="stat-card available">
        <div class="stat-icon">
          <el-icon><CircleCheck /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ spaceStats.available }}</span>
          <span class="stat-label">空闲</span>
        </div>
        <div class="stat-percent">{{ calculatePercent(spaceStats.available) }}%</div>
      </div>
      <div class="stat-card occupied">
        <div class="stat-icon">
          <el-icon><Van /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ spaceStats.occupied }}</span>
          <span class="stat-label">占用</span>
        </div>
        <div class="stat-percent">{{ calculatePercent(spaceStats.occupied) }}%</div>
      </div>
      <div class="stat-card reserved">
        <div class="stat-icon">
          <el-icon><Timer /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ spaceStats.reserved }}</span>
          <span class="stat-label">已预约</span>
        </div>
        <div class="stat-percent">{{ calculatePercent(spaceStats.reserved) }}%</div>
      </div>
    </div>

    <div v-if="filterForm.parkingId" class="ai-task-banner" :class="hasAiTask(aiImportTask) ? getAiTaskBannerClass(aiImportTask.status) : 'empty'">
      <div class="ai-task-header">
        <div>
          <div class="ai-task-title">AI 车位解析任务</div>
          <div v-if="hasAiTask(aiImportTask)" class="ai-task-subtitle">
            {{ getAiTaskStatusText(aiImportTask.status) }}
            <span v-if="aiImportTask.stage"> · {{ getAiTaskStageText(aiImportTask.stage) }}</span>
          </div>
          <div v-else class="ai-task-subtitle">无任务</div>
        </div>
        <button class="ai-task-refresh" @click="refreshAiImportTask" :disabled="aiTaskLoading">
          {{ aiTaskLoading ? '刷新中...' : '刷新状态' }}
        </button>
      </div>

      <div v-if="shouldShowAiTaskProgress(aiImportTask)" class="ai-task-progress-track">
        <div class="ai-task-progress-bar" :style="{ width: `${aiImportTask.progressPercent || 0}%` }"></div>
      </div>

      <div v-if="hasAiTask(aiImportTask)" class="ai-task-meta">
        <span>进度：{{ aiImportTask.progressPercent || 0 }}%</span>
        <span v-if="aiImportTask.updatedTime">状态更新时间：{{ formatTaskTime(aiImportTask.updatedTime) }}</span>
        <span v-if="aiTaskFetchedAt">刷新时间：{{ formatTaskTime(aiTaskFetchedAt) }}</span>
        <span v-if="aiImportTask.result?.importedSpaces != null">车位：{{ aiImportTask.result.importedSpaces }}</span>
        <span v-if="aiImportTask.result?.importedFloors != null">楼层：{{ aiImportTask.result.importedFloors }}</span>
        <span v-if="aiImportTask.result?.importedSections != null">分区：{{ aiImportTask.result.importedSections }}</span>
      </div>

      <div class="ai-task-message">
        {{ hasAiTask(aiImportTask) ? (aiImportTask.message || '任务处理中') : '当前停车场暂无 AI 解析任务，点击上方“AI导入”即可创建后台解析任务。' }}
      </div>

      <div v-if="hasAiTask(aiImportTask) && aiImportTask.status === 'FAILED' && aiImportTask.failureCategory" class="ai-task-failure">
        <div class="ai-task-failure-title">{{ getAiTaskFailureSummary(aiImportTask) }}</div>
        <div v-if="aiImportTask.failureSuggestion" class="ai-task-failure-tip">{{ aiImportTask.failureSuggestion }}</div>
      </div>

      <ul v-if="hasAiTask(aiImportTask) && aiImportTask.warnings?.length" class="ai-task-warnings">
        <li v-for="warning in aiImportTask.warnings" :key="warning">{{ warning }}</li>
      </ul>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-card">
      <div class="filter-row">
        <div class="filter-group">
          <div class="filter-item">
            <label>停车场</label>
            <el-select v-model="filterForm.parkingId" placeholder="选择停车场" clearable @change="handleParkingChange">
              <el-option v-for="p in parkingList" :key="p.id" :label="p.name" :value="p.id" />
            </el-select>
          </div>
          <div class="filter-item">
            <label>区域</label>
            <div class="filter-input-wrapper">
              <el-icon><MapLocation /></el-icon>
              <el-input v-model="filterForm.area" placeholder="输入区域" clearable @keyup.enter="handleSearch" />
            </div>
          </div>
        </div>
        <div class="filter-actions">
          <el-radio-group v-model="filterForm.status" @change="handleSearch" style="margin-right: 16px;">
            <el-radio-button :label="null">全部</el-radio-button>
            <el-radio-button :label="1">空闲</el-radio-button>
            <el-radio-button :label="2">占用</el-radio-button>
            <el-radio-button :label="3">已预约</el-radio-button>
          </el-radio-group>
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

    <!-- 车位网格视图 -->
    <div class="spaces-grid" v-if="tableData.length > 0">
      <div
        v-for="(space, index) in tableData"
        :key="space.id"
        class="space-card"
        :class="[getStatusClass(space.status), { 'animate-in': animated, 'is-selected': selectedSpaceIds.includes(space.id) }]"
        :style="{ animationDelay: `${index * 30}ms` }"
        @click="toggleSelection(space.id)"
      >
        <div class="space-header">
          <div class="space-code-wrapper">
            <el-checkbox
              :model-value="selectedSpaceIds.includes(space.id)"
              @change="toggleSelection(space.id)"
              @click.stop
              style="margin-right: 8px;"
            />
            <el-icon class="header-icon"><Location /></el-icon>
            <span class="space-code">{{ getSpaceCode(space) }}</span>
          </div>
          <div class="space-type-badge" :class="getTypeClass(space.spaceType)">
            {{ getTypeText(space.spaceType) }}
          </div>
        </div>

        <div class="space-body">
          <div class="space-status-icon">
            <el-icon v-if="space.status === 1"><CircleCheck /></el-icon>
            <el-icon v-else-if="space.status === 2"><Van /></el-icon>
            <el-icon v-else><Timer /></el-icon>
          </div>
          <div class="space-status-text">{{ getStatusText(space.status) }}</div>
        </div>

        <div class="space-info">
          <div class="info-item">
            <el-icon><OfficeBuilding /></el-icon>
            <span>{{ formatFloorLabel(space.floor ?? space.level) }}</span>
          </div>
          <div class="info-item">
            <el-icon><MapLocation /></el-icon>
            <span>{{ getSpaceArea(space) }}</span>
          </div>
        </div>

        <div class="space-actions">
          <button class="action-btn-small" v-permission="'space:edit'" @click.stop="handleEdit(space)" title="编辑">
            <el-icon><Edit /></el-icon>
          </button>
          <button
            v-if="space.status === 1"
            class="action-btn-small warning"
            @click.stop="handleReserve(space)"
            title="预约"
          >
            <el-icon><Timer /></el-icon>
          </button>
          <button
            v-if="space.status === 3"
            class="action-btn-small success"
            v-permission="'space:edit'"
            @click.stop="handleRelease(space)"
            title="释放"
          >
            <el-icon><Unlock /></el-icon>
          </button>
          <button class="action-btn-small danger" v-permission="'space:delete'" @click.stop="handleDelete(space)" title="删除">
            <el-icon><Delete /></el-icon>
          </button>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="tableData.length === 0 && !loading" class="empty-state">
      <div class="empty-icon">
        <el-icon><Grid /></el-icon>
      </div>
      <h3>{{ filterForm.parkingId ? '暂无车位数据' : '请先选择停车场' }}</h3>
      <p>{{ filterForm.parkingId ? '点击上方按钮添加车位' : '从上方选择停车场查看车位' }}</p>
    </div>

    <!-- 分页 -->
    <div class="pagination-wrapper" v-if="pagination.total > 0">
      <div class="pagination-info">
        共 <span class="highlight">{{ pagination.total }}</span> 个车位
      </div>
      <el-pagination
        v-model:current-page="pagination.pageNo"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[24, 48, 96, 192]"
        :total="pagination.total"
        layout="sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '新增停车位' : '编辑停车位'"
      width="520px"
      :close-on-click-modal="false"
      class="glass-dialog"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px" class="space-form">
        <el-form-item label="停车场" prop="parkingId">
          <el-select v-model="formData.parkingId" placeholder="选择停车场" style="width: 100%">
            <el-option v-for="p in parkingList" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>

        <div class="form-row">
          <el-form-item label="车位编号" prop="spaceCode" style="flex: 1">
            <el-input v-model="formData.spaceCode" placeholder="如：A-001" />
          </el-form-item>
          <el-form-item label="楼层" prop="floor" style="flex: 1">
            <el-input v-model="formData.floor" placeholder="如：1 或 B1" />
          </el-form-item>
        </div>

        <el-form-item label="区域" prop="area">
          <el-input v-model="formData.area" placeholder="如：A区" />
        </el-form-item>

        <div class="form-row">
          <el-form-item label="车位类型" prop="spaceType" style="flex: 1">
            <el-select v-model="formData.spaceType" placeholder="选择类型" style="width: 100%">
              <el-option label="普通车位" :value="1" />
              <el-option label="VIP车位" :value="2" />
              <el-option label="充电车位" :value="3" />
            </el-select>
          </el-form-item>
          <el-form-item label="初始状态" prop="status" style="flex: 1">
            <el-switch
              v-model="formData.status"
              :active-value="1"
              :inactive-value="2"
              active-text="空闲"
              inactive-text="占用"
            />
          </el-form-item>
        </div>
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
    <AiImportDialog
      v-model="aiImportVisible"
      :parking-list="parkingList"
      :initial-parking-id="filterForm.parkingId"
      @submitted="handleAiImportSubmitted"
      @success="handleAiImportSuccess"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import AiImportDialog from './components/AiImportDialog.vue'
import {
  getParkingSpacePage,
  createParkingSpace,
  updateParkingSpace,
  deleteParkingSpace,
  reserveSpace,
  releaseSpace,
  getParkingSpacesByParking,
  clearParkingSpacesByParking,
  getLatestParkingSpaceAiImportTask
} from '@/api/parkingSpace'
import { getParkingPage } from '@/api/parking'

const loading = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)
const dialogType = ref('add')
const formRef = ref(null)
const animated = ref(false)
const aiImportVisible = ref(false)
const aiImportTask = ref(null)
const aiTaskLoading = ref(false)
const aiTaskFetchedAt = ref(null)

const tableData = ref([])
const parkingList = ref([])
const selectedSpaceIds = ref([])

const filterForm = reactive({
  parkingId: null,
  area: '',
  status: null
})

const pagination = reactive({
  pageNo: 1,
  pageSize: 24,
  total: 0
})

const spaceStats = reactive({
  total: 0,
  available: 0,
  occupied: 0,
  reserved: 0
})

const formData = reactive({
  id: null,
  parkingId: null,
  spaceCode: '',
  floor: '',
  area: '',
  spaceType: 1,
  status: 1,
  isReservable: 1,
  distanceToEntrance: null,
  distanceToExit: null,
  guidancePriority: null,
  navigationHint: '',
  reservationTime: null,
  currentCarNo: '',
  remark: ''
})

const formRules = {
  parkingId: [{ required: true, message: '请选择停车场', trigger: 'change' }],
  spaceCode: [{ required: true, message: '请输入车位编号', trigger: 'blur' }],
  floor: [{ required: true, message: '请输入楼层，如 1 或 B1', trigger: 'blur' }],
  area: [{ required: true, message: '请输入区域', trigger: 'blur' }]
}

function getSpaceCode(space) {
  return space?.spaceCode || space?.spaceNumber || space?.code || space?.name || '未知车位'
}

function getRawSpaceArea(space) {
  return space?.area || space?.sectionArea || space?.zone || space?.region || ''
}

function getSpaceArea(space) {
  return getRawSpaceArea(space) || '未知区域'
}

function parseFloorInput(value) {
  if (value === null || value === undefined || value === '') {
    return null
  }
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return value
  }

  const normalized = String(value).trim().toUpperCase()
  if (!normalized) {
    return null
  }
  if (/^B\d+$/.test(normalized)) {
    return -Number(normalized.slice(1))
  }
  if (/^F\d+$/.test(normalized)) {
    return Number(normalized.slice(1))
  }
  if (/^-?\d+$/.test(normalized)) {
    return Number(normalized)
  }

  const compact = normalized.replace(/层/g, '').replace(/F/g, '').replace(/\s+/g, '')
  if (/^B\d+$/.test(compact)) {
    return -Number(compact.slice(1))
  }
  if (/^-?\d+$/.test(compact)) {
    return Number(compact)
  }
  return null
}

function formatFloorLabel(value) {
  const floor = parseFloorInput(value)
  if (floor == null) return '未知楼层'
  if (floor > 0) return `${floor}层`
  if (floor === 0) return '地面层'
  return `B${Math.abs(floor)}层`
}

function resetFormData(space = {}) {
  Object.assign(formData, {
    id: space.id ?? null,
    parkingId: space.parkingId ?? filterForm.parkingId ?? null,
    spaceCode: space.spaceCode || space.spaceNumber || '',
    floor: space.floor != null ? String(space.floor) : '',
    area: getRawSpaceArea(space),
    spaceType: space.spaceType ?? 1,
    status: space.status ?? 1,
    isReservable: space.isReservable ?? 1,
    distanceToEntrance: space.distanceToEntrance ?? null,
    distanceToExit: space.distanceToExit ?? null,
    guidancePriority: space.guidancePriority ?? null,
    navigationHint: space.navigationHint || '',
    reservationTime: space.reservationTime ?? null,
    currentCarNo: space.currentCarNo || '',
    remark: space.remark || ''
  })
}

function buildSpacePayload(space) {
  return {
    id: space.id ?? null,
    parkingId: space.parkingId,
    spaceNumber: space.spaceNumber || space.spaceCode,
    spaceType: space.spaceType ?? 1,
    status: space.status ?? 1,
    sectionArea: getRawSpaceArea(space),
    floor: parseFloorInput(space.floor),
    isReservable: space.isReservable ?? 1,
    distanceToEntrance: space.distanceToEntrance,
    distanceToExit: space.distanceToExit,
    guidancePriority: space.guidancePriority,
    navigationHint: space.navigationHint,
    reservationTime: space.reservationTime,
    currentCarNo: space.currentCarNo,
    remark: space.remark
  }
}

function getStatusClass(status) {
  const classes = { 1: 'status-available', 2: 'status-occupied', 3: 'status-reserved' }
  return classes[status] || ''
}

function getStatusText(status) {
  const texts = { 1: '空闲', 2: '占用', 3: '已预约' }
  return texts[status] || '未知'
}

function getTypeClass(type) {
  const classes = { 1: 'type-normal', 2: 'type-vip', 3: 'type-charging' }
  return classes[type] || 'type-normal'
}

function getTypeText(type) {
  const texts = { 1: '普通', 2: 'VIP', 3: '充电' }
  return texts[type] || '普通'
}

function calculatePercent(value) {
  if (!spaceStats.total) return 0
  return Math.round((value / spaceStats.total) * 100)
}

function getAiTaskStatusText(status) {
  const map = {
    QUEUED: '排队中',
    RUNNING: '执行中',
    SUCCEEDED: '已完成',
    FAILED: '失败'
  }
  return map[status] || '未知状态'
}

function getAiTaskStageText(stage) {
  const map = {
    SUBMITTED: '任务已提交',
    LOADING_FILES: '准备文件',
    ANALYZING_IMAGES: '识别图纸',
    VALIDATING_RESULT: '校验结果',
    CLEANING_HISTORY: '清理历史残留数据',
    PERSISTING_DATA: '写入数据',
    COMPLETED: '导入完成',
    FAILED: '导入失败'
  }
  return map[stage] || stage || '处理中'
}

function getAiTaskBannerClass(status) {
  const map = {
    QUEUED: 'queued',
    RUNNING: 'running',
    SUCCEEDED: 'succeeded',
    FAILED: 'failed'
  }
  return map[status] || ''
}

function hasAiTask(task) {
  return Boolean(task && task.taskId)
}

function shouldShowAiTaskProgress(task) {
  return Boolean(task && ['QUEUED', 'RUNNING'].includes(task.status))
}

function getAiTaskFailureSummary(task) {
  if (!task?.failureCategory) return ''
  return task.failureCode ? `${task.failureCategory}（${task.failureCode}）` : task.failureCategory
}

function formatTaskTime(value) {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '--'
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`
}

async function loadParkingList() {
  try {
    const res = await getParkingPage({ pageNo: 1, pageSize: 100 })
    if (res.code === 200) {
      parkingList.value = res.data.records || []
    }
  } catch (error) {
    console.error('加载停车场列表失败:', error)
  }
}

async function loadLatestAiImportTask() {
  if (!filterForm.parkingId) {
    aiImportTask.value = null
    aiTaskFetchedAt.value = null
    return
  }
  aiTaskLoading.value = true
  try {
    const res = await getLatestParkingSpaceAiImportTask(filterForm.parkingId)
    if (res.code === 200) {
      aiImportTask.value = hasAiTask(res.data) ? res.data : null
      aiTaskFetchedAt.value = new Date().toISOString()
    }
  } catch (error) {
    console.error('加载 AI 导入任务失败:', error)
  } finally {
    aiTaskLoading.value = false
  }
}

async function refreshAiImportTask() {
  if (!filterForm.parkingId) return
  await loadLatestAiImportTask()
}

async function loadData() {
  if (!filterForm.parkingId) {
    tableData.value = []
    pagination.total = 0
    selectedSpaceIds.value = []
    Object.assign(spaceStats, {
      total: 0,
      available: 0,
      occupied: 0,
      reserved: 0
    })
    return
  }

  loading.value = true
  try {
    const res = await getParkingSpacePage({
      pageNo: pagination.pageNo,
      pageSize: pagination.pageSize,
      parkingId: filterForm.parkingId,
      area: filterForm.area,
      status: filterForm.status
    })
    if (res.code === 200) {
      tableData.value = res.data.records || []
      pagination.total = res.data.total || 0
      selectedSpaceIds.value = []
      animated.value = false
      setTimeout(() => {
        animated.value = true
      }, 100)
    }

    await loadSpaceStats()
  } catch (error) {
    console.error('加载数据失败:', error)
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

async function loadDataSilently() {
  if (!filterForm.parkingId) return

  try {
    const res = await getParkingSpacePage({
      pageNo: pagination.pageNo,
      pageSize: pagination.pageSize,
      parkingId: filterForm.parkingId,
      area: filterForm.area,
      status: filterForm.status
    })
    if (res.code === 200) {
      tableData.value = res.data.records || []
      pagination.total = res.data.total || 0
    }

    await loadSpaceStats()
  } catch (error) {
    console.error('静默加载数据失败:', error)
  }
}

async function loadSpaceStats() {
  try {
    const res = await getParkingSpacesByParking(filterForm.parkingId)
    if (res.code === 200) {
      const list = res.data || []
      spaceStats.total = list.length
      spaceStats.available = list.filter(s => s.status === 1).length
      spaceStats.occupied = list.filter(s => s.status === 2).length
      spaceStats.reserved = list.filter(s => s.status === 3).length
    }
  } catch (error) {
    console.error('加载车位统计失败:', error)
  }
}

function handleParkingChange() {
  pagination.pageNo = 1
  loadLatestAiImportTask()
  loadData()
}

function handleSearch() {
  pagination.pageNo = 1
  loadData()
}

function handleReset() {
  filterForm.parkingId = null
  filterForm.area = ''
  filterForm.status = null
  aiImportTask.value = null
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
  resetFormData()
  dialogVisible.value = true
}

function handleEdit(row) {
  dialogType.value = 'edit'
  resetFormData(row)
  dialogVisible.value = true
}

function handleDelete(row) {
  ElMessageBox.confirm(
    `确定要删除车位 "${getSpaceCode(row)}" 吗？`,
    '确认删除',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const res = await deleteParkingSpace(row.id)
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

function toggleSelection(id) {
  const index = selectedSpaceIds.value.indexOf(id)
  if (index > -1) {
    selectedSpaceIds.value.splice(index, 1)
  } else {
    selectedSpaceIds.value.push(id)
  }
}

function toggleSelectAll() {
  if (selectedSpaceIds.value.length === tableData.value.length) {
    selectedSpaceIds.value = []
  } else {
    selectedSpaceIds.value = tableData.value.map(item => item.id)
  }
}

function handleBatchDelete() {
  if (selectedSpaceIds.value.length === 0) return

  ElMessageBox.confirm(
    `确定要批量删除已选的 ${selectedSpaceIds.value.length} 个车位吗？此操作不可逆！`,
    '确认批量删除',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      submitLoading.value = true
      let successCount = 0
      let failCount = 0
      
      const promises = selectedSpaceIds.value.map(id => deleteParkingSpace(id))
      const results = await Promise.allSettled(promises)
      
      results.forEach(res => {
        if (res.status === 'fulfilled' && res.value.code === 200) {
          successCount++
        } else {
          failCount++
        }
      })
      
      if (failCount === 0) {
        ElMessage.success(`成功删除 ${successCount} 个车位`)
      } else {
        ElMessage.warning(`删除完成。成功: ${successCount}，失败: ${failCount}`)
      }
      selectedSpaceIds.value = []
      loadData()
    } catch (error) {
      console.error('批量删除失败:', error)
      ElMessage.error('批量删除失败')
    } finally {
      submitLoading.value = false
    }
  })
}

async function handleReserve(row) {
  try {
    const { value: carNo } = await ElMessageBox.prompt(
      `请输入车位 "${getSpaceCode(row)}" 的预约车牌号`,
      '确认预约',
      {
        confirmButtonText: '确认预约',
        cancelButtonText: '取消',
        inputValue: row.currentCarNo || '',
        inputValidator: value => (value && value.trim() ? true : '请输入车牌号')
      }
    )
    const res = await reserveSpace(row.id, { carNo: carNo.trim() })
    if (res.code === 200) {
      ElMessage.success('预约成功')
      loadData()
    } else {
      ElMessage.error(res.msg || '预约失败')
    }
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.error('预约失败')
    }
  }
}

async function handleRelease(row) {
  try {
    await ElMessageBox.confirm(`确定要释放车位 "${getSpaceCode(row)}" 吗？`, '确认释放', { type: 'info' })
    const res = await releaseSpace(row.id)
    if (res.code === 200) {
      ElMessage.success('释放成功')
      loadData()
    } else {
      ElMessage.error(res.msg || '释放失败')
    }
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.error('释放失败')
    }
  }
}

async function handleSubmit() {
  try {
    await formRef.value.validate()
    const payload = buildSpacePayload(formData)
    if (payload.floor == null) {
      ElMessage.warning('楼层请输入如 1、2 或 B1 这样的格式')
      return
    }
    submitLoading.value = true

    if (dialogType.value === 'add') {
      const res = await createParkingSpace(payload)
      if (res.code === 200) {
        ElMessage.success('新增成功')
        dialogVisible.value = false
        loadData()
      } else {
        ElMessage.error(res.msg || '新增失败')
      }
    } else {
      const res = await updateParkingSpace(payload)
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

async function handleAiImportSuccess(result) {
  if (result?.parkingId) {
    filterForm.parkingId = result.parkingId
  }
  pagination.pageNo = 1
  await loadLatestAiImportTask()
  await loadData()
}

async function handleAiImportSubmitted(task) {
  if (task?.parkingId) {
    filterForm.parkingId = task.parkingId
  }
  aiImportTask.value = hasAiTask(task) ? task : null
  aiTaskFetchedAt.value = new Date().toISOString()
  pagination.pageNo = 1
  await loadData()
}

async function handleClearByParking() {
  if (!filterForm.parkingId) {
    ElMessage.warning('请先选择停车场')
    return
  }

  const parkingName = parkingList.value.find(item => item.id === filterForm.parkingId)?.name || '当前停车场'
  try {
    await ElMessageBox.confirm(
      `确定要清空“${parkingName}”下的所有车位和分区吗？此操作不可恢复。`,
      '确认清空',
      {
        confirmButtonText: '确定清空',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    const res = await clearParkingSpacesByParking(filterForm.parkingId)
    if (res.code === 200) {
      ElMessage.success(`已清空 ${res.data.deletedSpaces || 0} 个车位`)
      await loadData()
    } else {
      ElMessage.error(res.msg || '清空失败')
    }
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      console.error('清空停车场车位失败:', error)
    }
  }
}

let refreshTimer = null

onMounted(() => {
  loadParkingList()
  
  // 开启轮询，每5秒获取一次最新的车位状态，实现实时监控
  refreshTimer = setInterval(() => {
    if (filterForm.parkingId && !loading.value) {
      loadDataSilently()
      if (aiImportTask.value && ['QUEUED', 'RUNNING'].includes(aiImportTask.value.status)) {
        refreshAiImportTask()
      }
    }
  }, 5000)
})

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
})
</script>

<style lang="scss" scoped>
.parking-space-page {
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
        background: linear-gradient(135deg, var(--secondary-500), var(--secondary-600));
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-glow-secondary);

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

    .action-btn {
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
        box-shadow: 0 8px 25px rgba(99, 102, 241, 0.5);
      }

      &.secondary {
        color: var(--text-primary);
        background: var(--glass-bg);
        border: 1px solid var(--glass-border);
        box-shadow: none;
        backdrop-filter: blur(16px);

        &:hover {
          background: var(--glass-bg-hover);
          border-color: var(--glass-border-hover);
        }
      }

      .el-icon {
        font-size: 16px;
      }
    }
  }
}

// 统计概览
.stats-overview {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-5);
  margin-bottom: var(--space-6);

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }

  .stat-card {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    padding: var(--space-5);
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: var(--radius-xl);
    position: relative;
    overflow: hidden;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      border-color: rgba(255, 255, 255, 0.2);
    }

    .stat-icon {
      width: 56px;
      height: 56px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-lg);
      font-size: 24px;
    }

    .stat-info {
      flex: 1;

      .stat-value {
        font-family: var(--font-display);
        font-size: var(--text-3xl);
        font-weight: var(--font-bold);
        color: var(--text-primary);
        line-height: 1.2;
      }

      .stat-label {
        font-size: var(--text-sm);
        color: var(--text-tertiary);
      }
    }

    .stat-percent {
      position: absolute;
      top: var(--space-3);
      right: var(--space-4);
      font-size: var(--text-sm);
      font-weight: var(--font-semibold);
      color: var(--text-muted);
    }

    &.total .stat-icon {
      background: rgba(99, 102, 241, 0.15);
      color: var(--primary-400);
    }

    &.available {
      border-color: rgba(16, 185, 129, 0.3);

      .stat-icon {
        background: rgba(16, 185, 129, 0.15);
        color: var(--secondary-400);
      }

      .stat-percent {
        color: var(--secondary-400);
      }
    }

    &.occupied {
      border-color: rgba(244, 63, 94, 0.3);

      .stat-icon {
        background: rgba(244, 63, 94, 0.15);
        color: var(--accent-400);
      }

      .stat-percent {
        color: var(--accent-400);
      }
    }

    &.reserved {
      border-color: rgba(245, 158, 11, 0.3);

      .stat-icon {
        background: rgba(245, 158, 11, 0.15);
        color: var(--warning-400);
      }

      .stat-percent {
        color: var(--warning-400);
      }
    }
  }
}

.ai-task-banner {
  margin-bottom: var(--space-6);
  padding: var(--space-5);
  border-radius: var(--radius-xl);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.ai-task-banner.queued {
  border-color: rgba(245, 158, 11, 0.28);
}

.ai-task-banner.running {
  border-color: rgba(59, 130, 246, 0.28);
}

.ai-task-banner.succeeded {
  border-color: rgba(16, 185, 129, 0.28);
}

.ai-task-banner.failed {
  border-color: rgba(239, 68, 68, 0.28);
}

.ai-task-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-3);
}

.ai-task-title {
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  color: var(--text-primary);
}

.ai-task-subtitle {
  margin-top: 4px;
  font-size: var(--text-sm);
  color: var(--text-tertiary);
}

.ai-task-refresh {
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: var(--radius-lg);
  cursor: pointer;
}

.ai-task-refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.ai-task-progress-track {
  height: 10px;
  margin-bottom: var(--space-3);
  background: rgba(255, 255, 255, 0.08);
  border-radius: 999px;
  overflow: hidden;
}

.ai-task-progress-bar {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--primary-500), var(--secondary-500));
}

.ai-task-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  margin-bottom: var(--space-2);
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}

.ai-task-message {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.ai-task-failure {
  margin-top: var(--space-3);
  padding: 12px 14px;
  border-radius: var(--radius-lg);
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.18);
}

.ai-task-failure-title {
  font-size: var(--text-sm);
  font-weight: var(--font-bold);
  color: #fca5a5;
}

.ai-task-failure-tip {
  margin-top: 4px;
  font-size: var(--text-xs);
  line-height: 1.6;
  color: var(--text-secondary);
}

.ai-task-warnings {
  margin: var(--space-3) 0 0;
  padding-left: 18px;
  font-size: var(--text-xs);
  line-height: 1.6;
  color: var(--warning-400);
}

// 筛选栏
.filter-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  margin-bottom: var(--space-6);

  .filter-row {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: var(--space-4);

    @media (max-width: 1024px) {
      flex-direction: column;
      align-items: stretch;
    }
  }

  .filter-group {
    display: flex;
    align-items: flex-end;
    gap: var(--space-4);
    flex: 1;

    @media (max-width: 768px) {
      flex-direction: column;
      align-items: stretch;
    }
  }

  .filter-item {
    flex: 1;

    label {
      display: block;
      font-size: var(--text-xs);
      font-weight: var(--font-medium);
      color: var(--text-tertiary);
      margin-bottom: var(--space-2);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    :deep(.el-select) {
      width: 100%;

      .el-input__wrapper,
      .el-select__wrapper {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: var(--radius-md);
        box-shadow: none;
        padding: var(--space-2) var(--space-3);
        min-height: 40px;

        .el-input__inner,
        .el-select__selected-item {
          color: var(--text-primary);
          font-size: var(--text-sm);
        }

        .el-select__placeholder {
          color: var(--text-muted);
          font-size: var(--text-sm);
          &.is-transparent {
            color: var(--text-muted);
          }
        }

        .el-input__icon,
        .el-select__icon {
          color: var(--text-muted);
        }

        &:hover {
          border-color: rgba(255, 255, 255, 0.2);
        }

        &.is-focus,
        &.is-focused {
          border-color: var(--border-focus);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
        }
      }

      .status-dot {
        display: inline-block;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        margin-right: var(--space-2);

        &.available { background: var(--secondary-500); }
        &.occupied { background: var(--accent-500); }
        &.reserved { background: var(--warning-500); }
      }
    }
  }

  .filter-input-wrapper {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: var(--radius-md);
    transition: all 0.3s ease;

    &:hover, &:focus-within {
      border-color: rgba(255, 255, 255, 0.2);
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
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: var(--radius-lg);
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.2);
      color: var(--text-primary);
    }

    &.primary {
      background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
      border: none;
      color: white;
      box-shadow: var(--shadow-glow-primary);

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(99, 102, 241, 0.5);
      }
    }

    .el-icon {
      font-size: 14px;
    }
  }
}

// 车位网格
.spaces-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--space-4);
  margin-bottom: var(--space-6);

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  }
}

.space-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-xl);
  padding: var(--space-4);
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
  overflow: hidden;

  &.animate-in {
    opacity: 1;
    transform: translateY(0);
  }

  &.is-selected {
    border-color: var(--primary-500);
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.4);
    transform: translateY(-4px);
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);

    .space-actions {
      opacity: 1;
      transform: translateY(0);
    }
  }

  &.status-available {
    border-color: rgba(16, 185, 129, 0.3);

    .space-status-icon {
      background: rgba(16, 185, 129, 0.15);
      color: var(--secondary-400);
    }
  }

  &.status-occupied {
    border-color: rgba(244, 63, 94, 0.3);

    .space-status-icon {
      background: rgba(244, 63, 94, 0.15);
      color: var(--accent-400);
    }
  }

  &.status-reserved {
    border-color: rgba(245, 158, 11, 0.3);

    .space-status-icon {
      background: rgba(245, 158, 11, 0.15);
      color: var(--warning-400);
    }
  }

  .space-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-3);

    .space-code-wrapper {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      
      .header-icon {
        font-size: 16px;
        color: var(--primary-400);
      }
      
      .space-code {
        font-family: var(--font-display);
        font-size: var(--text-lg);
        font-weight: var(--font-bold);
        color: var(--text-primary);
      }
    }

    .space-type-badge {
      padding: var(--space-1) var(--space-2);
      font-size: var(--text-xs);
      font-weight: var(--font-medium);
      border-radius: var(--radius-sm);

      &.type-normal {
        background: rgba(99, 102, 241, 0.15);
        color: var(--primary-400);
      }

      &.type-vip {
        background: rgba(245, 158, 11, 0.15);
        color: var(--warning-400);
      }

      &.type-charging {
        background: rgba(16, 185, 129, 0.15);
        color: var(--secondary-400);
      }
    }
  }

  .space-body {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: var(--space-4) 0;

    .space-status-icon {
      width: 64px;
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      margin-bottom: var(--space-3);

      .el-icon {
        font-size: 32px;
      }
    }

    .space-status-text {
      font-size: var(--text-sm);
      font-weight: var(--font-medium);
      color: var(--text-secondary);
    }
  }

  .space-info {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-4);
    padding: var(--space-3) 0;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    margin-bottom: var(--space-3);

    .info-item {
      display: flex;
      align-items: center;
      gap: var(--space-1);
      font-size: var(--text-xs);
      color: var(--text-tertiary);

      .el-icon {
        font-size: 12px;
      }
    }
  }

  .space-actions {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    opacity: 0;
    transform: translateY(10px);
    transition: all 0.3s ease;

    .action-btn-small {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: var(--radius-md);
      color: var(--text-tertiary);
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.2);
        color: var(--text-primary);
      }

      &.warning:hover {
        background: rgba(245, 158, 11, 0.15);
        border-color: rgba(245, 158, 11, 0.3);
        color: var(--warning-400);
      }

      &.success:hover {
        background: rgba(16, 185, 129, 0.15);
        border-color: rgba(16, 185, 129, 0.3);
        color: var(--secondary-400);
      }

      &.danger:hover {
        background: rgba(244, 63, 94, 0.15);
        border-color: rgba(244, 63, 94, 0.3);
        color: var(--accent-400);
      }

      .el-icon {
        font-size: 14px;
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
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
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
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
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
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: var(--text-secondary);

        &:hover {
          color: var(--text-primary);
          border-color: rgba(255, 255, 255, 0.2);
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
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
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
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: none;

        .el-input__inner {
          color: var(--text-primary);
        }
      }
    }
  }
}

// 表单样式
.space-form {
  .form-row {
    display: flex;
    gap: var(--space-4);
  }

  :deep(.el-form-item__label) {
    color: var(--text-secondary);
  }

  :deep(.el-input__wrapper) {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: none;

    .el-input__inner {
      color: var(--text-primary);
    }
  }

  :deep(.el-select) {
    width: 100%;

    .el-input__wrapper,
    .el-select__wrapper {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: none;
    }
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
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: var(--text-secondary);

      &:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.2);
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
        box-shadow: 0 8px 25px rgba(99, 102, 241, 0.5);
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
        border: 2px solid rgba(255, 255, 255, 0.3);
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
</style>
