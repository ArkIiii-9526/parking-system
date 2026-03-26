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
        <button class="action-btn secondary" v-permission="'space:add'" @click="handleBatchAdd">
          <el-icon><Collection /></el-icon>
          <span>批量添加</span>
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
          <div class="filter-item">
            <label>状态</label>
            <el-select v-model="filterForm.status" placeholder="选择状态" clearable>
              <el-option label="空闲" :value="1">
                <span class="status-dot available"></span> 空闲
              </el-option>
              <el-option label="占用" :value="2">
                <span class="status-dot occupied"></span> 占用
              </el-option>
              <el-option label="已预约" :value="3">
                <span class="status-dot reserved"></span> 已预约
              </el-option>
            </el-select>
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

    <!-- 车位网格视图 -->
    <div class="spaces-grid" v-if="tableData.length > 0">
      <div
        v-for="(space, index) in tableData"
        :key="space.id"
        class="space-card"
        :class="[getStatusClass(space.status), { 'animate-in': animated }]"
        :style="{ animationDelay: `${index * 30}ms` }"
      >
        <div class="space-header">
          <div class="space-code-wrapper">
            <el-icon class="header-icon"><Location /></el-icon>
            <span class="space-code">{{ space.spaceCode || space.spaceNumber || space.code || space.name || '未知车位' }}</span>
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
            <span>{{ space.floor || space.level || '未知楼层' }}</span>
          </div>
          <div class="info-item">
            <el-icon><MapLocation /></el-icon>
            <span>{{ space.area || space.zone || space.region || '未知区域' }}</span>
          </div>
        </div>

        <div class="space-actions">
          <button class="action-btn-small" v-permission="'space:edit'" @click="handleEdit(space)" title="编辑">
            <el-icon><Edit /></el-icon>
          </button>
          <button
            v-if="space.status === 1"
            class="action-btn-small warning"
            @click="handleReserve(space)"
            title="预约"
          >
            <el-icon><Timer /></el-icon>
          </button>
          <button
            v-if="space.status === 3"
            class="action-btn-small success"
            v-permission="'space:edit'"
            @click="handleRelease(space)"
            title="释放"
          >
            <el-icon><Unlock /></el-icon>
          </button>
          <button class="action-btn-small danger" v-permission="'space:delete'" @click="handleDelete(space)" title="删除">
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
            <el-input v-model="formData.floor" placeholder="如：1F" />
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getParkingSpacePage, createParkingSpace, updateParkingSpace, deleteParkingSpace, reserveSpace, releaseSpace, getParkingSpacesByParking } from '@/api/parkingSpace'
import { getParkingPage } from '@/api/parking'

const loading = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)
const dialogType = ref('add')
const formRef = ref(null)
const animated = ref(false)

const tableData = ref([])
const parkingList = ref([])
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
  status: 1
})

const formRules = {
  parkingId: [{ required: true, message: '请选择停车场', trigger: 'change' }],
  spaceCode: [{ required: true, message: '请输入车位编号', trigger: 'blur' }],
  floor: [{ required: true, message: '请输入楼层', trigger: 'blur' }],
  area: [{ required: true, message: '请输入区域', trigger: 'blur' }]
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

async function loadData() {
  if (!filterForm.parkingId) {
    tableData.value = []
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
    if (key === 'spaceType') {
      formData[key] = 1
    } else if (key === 'status') {
      formData[key] = 1
    } else {
      formData[key] = null
    }
  })
  dialogVisible.value = true
}

function handleEdit(row) {
  dialogType.value = 'edit'
  Object.assign(formData, row)
  dialogVisible.value = true
}

function handleDelete(row) {
  ElMessageBox.confirm(
    `确定要删除车位 "${row.spaceCode}" 吗？`,
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

async function handleReserve(row) {
  try {
    await ElMessageBox.confirm(`确定要预约车位 "${row.spaceCode}" 吗？`, '确认预约', { type: 'info' })
    const res = await reserveSpace(row.id, {})
    if (res.code === 200) {
      ElMessage.success('预约成功')
      loadData()
    } else {
      ElMessage.error(res.msg || '预约失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('预约失败')
    }
  }
}

async function handleRelease(row) {
  try {
    await ElMessageBox.confirm(`确定要释放车位 "${row.spaceCode}" 吗？`, '确认释放', { type: 'info' })
    const res = await releaseSpace(row.id)
    if (res.code === 200) {
      ElMessage.success('释放成功')
      loadData()
    } else {
      ElMessage.error(res.msg || '释放失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('释放失败')
    }
  }
}

async function handleSubmit() {
  try {
    await formRef.value.validate()
    submitLoading.value = true

    if (dialogType.value === 'add') {
      const res = await createParkingSpace(formData)
      if (res.code === 200) {
        ElMessage.success('新增成功')
        dialogVisible.value = false
        loadData()
      } else {
        ElMessage.error(res.msg || '新增失败')
      }
    } else {
      const res = await updateParkingSpace(formData)
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

function handleBatchAdd() {
  if (!filterForm.parkingId) {
    ElMessage.warning('请先选择停车场')
    return
  }
  ElMessage.info('批量添加功能开发中...')
}

onMounted(() => {
  loadParkingList()
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
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        box-shadow: none;

        &:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.3);
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
