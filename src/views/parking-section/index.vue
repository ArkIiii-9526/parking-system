<template>
  <div class="parking-section-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">
          <span class="title-icon">
            <el-icon><MapLocation /></el-icon>
          </span>
          车位分区管理
        </h1>
        <p class="page-subtitle">管理停车场的分区信息及车位分布</p>
      </div>
      <button class="add-btn" v-permission="'section:add'" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        <span>新增分区</span>
      </button>
    </div>

    <!-- 搜索筛选 -->
    <div class="filter-card">
      <div class="filter-row">
        <div class="filter-group">
          <div class="filter-item">
            <span class="filter-label">所属停车场</span>
            <el-select
              v-model="filterForm.parkingId"
              placeholder="选择停车场"
              clearable
              @change="handleParkingChange"
              style="width: 200px"
            >
              <el-option
                v-for="item in parkingList"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </el-select>
          </div>
          <div class="filter-input-wrapper">
            <el-icon class="filter-icon"><Search /></el-icon>
            <el-input
              v-model="filterForm.sectionName"
              placeholder="搜索分区名称..."
              clearable
              @keyup.enter="handleSearch"
            />
          </div>
          <div class="filter-input-wrapper">
            <el-icon class="filter-icon"><Collection /></el-icon>
            <el-input
              v-model="filterForm.sectionCode"
              placeholder="搜索分区代码..."
              clearable
              @keyup.enter="handleSearch"
            />
          </div>
          <div class="filter-item">
            <span class="filter-label">楼层</span>
            <el-input-number
              v-model="filterForm.floor"
              :min="1"
              :max="100"
              placeholder="楼层"
              clearable
              @change="handleSearch"
              style="width: 100px"
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

    <!-- 数据表格 -->
    <div class="table-card">
      <el-table
        v-loading="loading"
        :data="tableData"
        stripe
        class="custom-table"
      >
        <el-table-column type="index" width="60" align="center" label="序号" />
        <el-table-column prop="sectionCode" label="分区代码" width="100" align="center">
          <template #default="{ row }">
            <span class="section-code">{{ row.sectionCode }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="sectionName" label="分区名称" min-width="120">
          <template #default="{ row }">
            <div class="section-name">
              <el-icon><MapLocation /></el-icon>
              <span>{{ row.sectionName }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="parkingName" label="所属停车场" min-width="150">
          <template #default="{ row }">
            <div class="parking-info">
              <el-icon><OfficeBuilding /></el-icon>
              <span>{{ row.parkingName }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="floor" label="楼层" width="80" align="center">
          <template #default="{ row }">
            <span class="floor-badge">{{ row.floor }}F</span>
          </template>
        </el-table-column>
        <el-table-column label="车位统计" width="280">
          <template #default="{ row }">
            <div class="space-stats">
              <div class="stat-item">
                <span class="stat-value total">{{ row.totalSpaces }}</span>
                <span class="stat-label">总车位</span>
              </div>
              <div class="stat-item">
                <span class="stat-value available">{{ row.availableSpaces }}</span>
                <span class="stat-label">空闲</span>
              </div>
              <div class="stat-item">
                <span class="stat-value occupied">{{ row.occupiedSpaces }}</span>
                <span class="stat-label">占用</span>
              </div>
              <div class="stat-item">
                <span class="stat-value rate">{{ row.utilizationRate?.toFixed(1) || 0 }}%</span>
                <span class="stat-label">利用率</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="150" show-overflow-tooltip />
        <el-table-column prop="sortOrder" label="排序" width="80" align="center" />
        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <div class="action-btns">
              <button class="action-btn" v-permission="'section:view'" @click="handleDetail(row)" title="统计信息">
                <el-icon><TrendCharts /></el-icon>
              </button>
              <button class="action-btn" v-permission="'section:edit'" @click="handleEdit(row)" title="编辑">
                <el-icon><Edit /></el-icon>
              </button>
              <button class="action-btn" v-permission="'section:edit'" @click="handleUpdateSpaceCount(row)" title="更新车位数">
                <el-icon><Grid /></el-icon>
              </button>
              <button class="action-btn danger" v-permission="'section:delete'" @click="handleDelete(row)" title="删除">
                <el-icon><Delete /></el-icon>
              </button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 空状态 -->
      <div v-if="tableData.length === 0 && !loading" class="empty-state">
        <div class="empty-icon">
          <el-icon><MapLocation /></el-icon>
        </div>
        <h3>暂无分区数据</h3>
        <p>点击上方按钮添加第一个分区</p>
      </div>

      <!-- 分页 -->
      <div class="pagination-wrapper" v-if="pagination.total > 0">
        <div class="pagination-info">
          共 <span class="highlight">{{ pagination.total }}</span> 条记录
        </div>
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '新增分区' : '编辑分区'"
      width="560px"
      :close-on-click-modal="false"
      class="glass-dialog"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px" class="section-form">
        <el-form-item label="所属停车场" prop="parkingId">
          <el-select v-model="formData.parkingId" placeholder="选择停车场" style="width: 100%">
            <el-option
              v-for="item in parkingList"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="分区代码" prop="sectionCode">
          <div class="form-input-wrapper">
            <el-icon><Collection /></el-icon>
            <el-input v-model="formData.sectionCode" placeholder="如：A、B、C" maxlength="10" />
          </div>
        </el-form-item>

        <el-form-item label="分区名称" prop="sectionName">
          <div class="form-input-wrapper">
            <el-icon><MapLocation /></el-icon>
            <el-input v-model="formData.sectionName" placeholder="如：A区、地下一层A区" maxlength="50" />
          </div>
        </el-form-item>

        <el-form-item label="楼层" prop="floor">
          <el-input-number v-model="formData.floor" :min="1" :max="100" style="width: 100%" />
        </el-form-item>

        <el-form-item label="排序" prop="sortOrder">
          <el-input-number v-model="formData.sortOrder" :min="0" :max="999" style="width: 100%" />
        </el-form-item>

        <el-form-item label="描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入分区描述"
            maxlength="200"
            show-word-limit
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

    <!-- 统计信息抽屉 -->
    <el-drawer
      v-model="detailDrawerVisible"
      title="分区统计信息"
      size="480px"
      class="detail-drawer"
    >
      <div v-if="currentSection" class="detail-content">
        <div class="detail-header">
          <div class="detail-icon">
            <el-icon><MapLocation /></el-icon>
          </div>
          <div class="detail-title">
            <h3>{{ currentSection.sectionName }}</h3>
            <span class="detail-subtitle">{{ currentSection.parkingName }} - {{ currentSection.floor }}F</span>
          </div>
        </div>

        <div class="detail-section">
          <h4>基本信息</h4>
          <div class="detail-item">
            <span class="item-label">分区代码</span>
            <span class="item-value">{{ currentSection.sectionCode }}</span>
          </div>
          <div class="detail-item">
            <span class="item-label">所属停车场</span>
            <span class="item-value">{{ currentSection.parkingName }}</span>
          </div>
          <div class="detail-item">
            <span class="item-label">楼层</span>
            <span class="item-value">{{ currentSection.floor }}F</span>
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
                <span class="stat-value">{{ statistics.totalSpaces || 0 }}</span>
                <span class="stat-label">总车位</span>
              </div>
            </div>
            <div class="detail-stat-card">
              <div class="stat-icon available">
                <el-icon><CircleCheck /></el-icon>
              </div>
              <div class="stat-info">
                <span class="stat-value">{{ statistics.availableSpaces || 0 }}</span>
                <span class="stat-label">空闲</span>
              </div>
            </div>
            <div class="detail-stat-card">
              <div class="stat-icon occupied">
                <el-icon><Van /></el-icon>
              </div>
              <div class="stat-info">
                <span class="stat-value">{{ statistics.occupiedSpaces || 0 }}</span>
                <span class="stat-label">已占用</span>
              </div>
            </div>
            <div class="detail-stat-card">
              <div class="stat-icon reserved">
                <el-icon><Timer /></el-icon>
              </div>
              <div class="stat-info">
                <span class="stat-value">{{ statistics.reservedSpaces || 0 }}</span>
                <span class="stat-label">已预约</span>
              </div>
            </div>
          </div>
          <div class="utilization-chart">
            <div class="chart-header">
              <span>利用率</span>
              <span class="chart-value">{{ statistics.utilizationRate?.toFixed(2) || 0 }}%</span>
            </div>
            <div class="chart-bar">
              <div class="chart-progress" :style="{ width: `${Math.min(statistics.utilizationRate || 0, 100)}%` }"></div>
            </div>
          </div>
        </div>
      </div>
    </el-drawer>

    <!-- 更新车位数对话框 -->
    <el-dialog
      v-model="spaceCountDialogVisible"
      title="更新分区车位数量"
      width="400px"
      :close-on-click-modal="false"
      class="glass-dialog"
    >
      <div v-if="currentSection" class="space-count-info">
        <p class="info-text">
          正在为 <strong>{{ currentSection.sectionName }}</strong> 更新车位数量
        </p>
      </div>
      <el-form ref="spaceCountFormRef" :model="spaceCountForm" :rules="spaceCountRules" label-width="100px">
        <el-form-item label="车位数量" prop="totalSpaces">
          <el-input-number v-model="spaceCountForm.totalSpaces" :min="0" :max="10000" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <button class="dialog-btn" @click="spaceCountDialogVisible = false">取消</button>
          <button class="dialog-btn primary" @click="handleSubmitSpaceCount" :disabled="submitLoading">
            <span v-if="!submitLoading">更新</span>
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
import {
  getParkingSectionPage,
  createParkingSection,
  updateParkingSection,
  deleteParkingSection,
  getSectionStatistics,
  updateSectionSpaceCount
} from '@/api/parkingSection'
import { getParkingPage } from '@/api/parking'

const loading = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)
const detailDrawerVisible = ref(false)
const spaceCountDialogVisible = ref(false)
const dialogType = ref('add')
const formRef = ref(null)
const spaceCountFormRef = ref(null)
const currentSection = ref(null)
const statistics = ref({})

const tableData = ref([])
const parkingList = ref([])

const filterForm = reactive({
  parkingId: null,
  sectionName: '',
  sectionCode: '',
  floor: null
})

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

const formData = reactive({
  id: null,
  parkingId: null,
  sectionCode: '',
  sectionName: '',
  floor: 1,
  description: '',
  sortOrder: 0
})

const spaceCountForm = reactive({
  totalSpaces: 0
})

const formRules = {
  parkingId: [
    { required: true, message: '请选择停车场', trigger: 'change' }
  ],
  sectionCode: [
    { required: true, message: '请输入分区代码', trigger: 'blur' },
    { min: 1, max: 10, message: '代码长度在1-10个字符之间', trigger: 'blur' }
  ],
  sectionName: [
    { required: true, message: '请输入分区名称', trigger: 'blur' },
    { min: 1, max: 50, message: '名称长度在1-50个字符之间', trigger: 'blur' }
  ],
  floor: [
    { required: true, message: '请输入楼层', trigger: 'blur' }
  ]
}

const spaceCountRules = {
  totalSpaces: [
    { required: true, message: '请输入车位数量', trigger: 'blur' }
  ]
}

async function loadParkingList() {
  try {
    const res = await getParkingPage({ pageNo: 1, pageSize: 1000 })
    if (res.code === 200) {
      parkingList.value = res.data.records || []
    }
  } catch (error) {
    console.error('加载停车场列表失败:', error)
  }
}

async function loadData() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      size: pagination.size
    }
    if (filterForm.parkingId) params.parkingId = filterForm.parkingId
    if (filterForm.sectionName) params.sectionName = filterForm.sectionName
    if (filterForm.sectionCode) params.sectionCode = filterForm.sectionCode
    if (filterForm.floor) params.floor = filterForm.floor

    const res = await getParkingSectionPage(params)
    if (res.code === 200) {
      tableData.value = res.data.records || []
      pagination.total = res.data.total || 0
    }
  } catch (error) {
    console.error('加载数据失败:', error)
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.page = 1
  loadData()
}

function handleReset() {
  filterForm.parkingId = null
  filterForm.sectionName = ''
  filterForm.sectionCode = ''
  filterForm.floor = null
  handleSearch()
}

function handleParkingChange() {
  handleSearch()
}

function handleSizeChange(size) {
  pagination.size = size
  loadData()
}

function handleCurrentChange(page) {
  pagination.page = page
  loadData()
}

function handleAdd() {
  dialogType.value = 'add'
  Object.keys(formData).forEach(key => {
    if (key === 'floor') {
      formData[key] = 1
    } else if (key === 'sortOrder') {
      formData[key] = 0
    } else {
      formData[key] = null
    }
  })
  dialogVisible.value = true
}

async function handleDetail(row) {
  currentSection.value = row
  try {
    const res = await getSectionStatistics(row.id)
    if (res.code === 200) {
      statistics.value = res.data
      detailDrawerVisible.value = true
    }
  } catch (error) {
    console.error('获取统计信息失败:', error)
    ElMessage.error('获取统计信息失败')
  }
}

function handleEdit(row) {
  dialogType.value = 'edit'
  Object.assign(formData, row)
  dialogVisible.value = true
}

function handleUpdateSpaceCount(row) {
  currentSection.value = row
  spaceCountForm.totalSpaces = row.totalSpaces || 0
  spaceCountDialogVisible.value = true
}

async function handleSubmitSpaceCount() {
  try {
    await spaceCountFormRef.value.validate()
    submitLoading.value = true
    const res = await updateSectionSpaceCount(currentSection.value.id, {
      totalSpaces: spaceCountForm.totalSpaces
    })
    if (res.code === 200) {
      ElMessage.success('更新车位数量成功')
      spaceCountDialogVisible.value = false
      loadData()
    } else {
      ElMessage.error(res.message || '更新失败')
    }
  } catch (error) {
    console.error('提交失败:', error)
  } finally {
    submitLoading.value = false
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
      <p>确定要删除分区 "${row.sectionName}" 吗？<br>此操作不可恢复。</p>
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
      const res = await deleteParkingSection(row.id)
      if (res.code === 200) {
        ElMessage.success('删除成功')
        loadData()
      } else {
        ElMessage.error(res.message || '删除失败')
      }
    } catch (error) {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  })
}

async function handleSubmit() {
  try {
    await formRef.value.validate()
    submitLoading.value = true

    if (dialogType.value === 'add') {
      const res = await createParkingSection(formData)
      if (res.code === 200) {
        ElMessage.success('新增成功')
        dialogVisible.value = false
        loadData()
      } else {
        ElMessage.error(res.message || '新增失败')
      }
    } else {
      const res = await updateParkingSection(formData)
      if (res.code === 200) {
        ElMessage.success('更新成功')
        dialogVisible.value = false
        loadData()
      } else {
        ElMessage.error(res.message || '更新失败')
      }
    }
  } catch (error) {
    console.error('提交失败:', error)
  } finally {
    submitLoading.value = false
  }
}

onMounted(() => {
  loadParkingList()
  loadData()
})
</script>

<style lang="scss" scoped>
.parking-section-page {
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

    @media (max-width: 1200px) {
      flex-direction: column;
      align-items: stretch;
    }
  }

  .filter-group {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    flex: 1;
    flex-wrap: wrap;

    @media (max-width: 768px) {
      flex-direction: column;
      align-items: stretch;
    }
  }

  .filter-item {
    display: flex;
    align-items: center;
    gap: var(--space-2);

    .filter-label {
      font-size: var(--text-sm);
      color: var(--text-secondary);
      white-space: nowrap;
    }
  }

  .filter-input-wrapper {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-lg);
    transition: all 0.3s ease;

    &:hover, &:focus-within {
      border-color: var(--glass-border-hover);
      background: var(--glass-bg-hover);
    }

    .filter-icon {
      font-size: 16px;
      color: var(--text-muted);
    }

    :deep(.el-input) {
      width: 160px;

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

// 表格卡片
.table-card {
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  overflow: hidden;
}

// 自定义表格
.custom-table {
  background: transparent;

  :deep(.el-table__header) {
    th {
      background: var(--glass-bg);
      color: var(--text-secondary);
      font-weight: var(--font-semibold);
      border-bottom: 1px solid var(--border-subtle);
    }
  }

  :deep(.el-table__row) {
    background: transparent;

    &:hover {
      background: var(--neutral-surface);
    }

    td {
      color: var(--text-primary);
      border-bottom: 1px solid var(--border-subtle);
    }
  }

  :deep(.el-table__empty-block) {
    display: none;
  }
}

// 分区代码
.section-code {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-1) var(--space-3);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--primary-400);
  background: var(--primary-surface);
  border-radius: var(--radius-md);
}

// 分区名称
.section-name {
  display: flex;
  align-items: center;
  gap: var(--space-2);

  .el-icon {
    font-size: 16px;
    color: var(--primary-400);
  }
}

// 停车场信息
.parking-info {
  display: flex;
  align-items: center;
  gap: var(--space-2);

  .el-icon {
    font-size: 16px;
    color: var(--text-muted);
  }
}

// 楼层标签
.floor-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-1) var(--space-2);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
  background: var(--glass-bg-hover);
  border-radius: var(--radius-md);
}

// 车位统计
.space-stats {
  display: flex;
  align-items: center;
  gap: var(--space-3);

  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-1);

    .stat-value {
      font-family: var(--font-display);
      font-size: var(--text-lg);
      font-weight: var(--font-bold);

      &.total {
        color: var(--primary-400);
      }

      &.available {
        color: var(--secondary-400);
      }

      &.occupied {
        color: var(--accent-400);
      }

      &.rate {
        color: var(--warning-400);
      }
    }

    .stat-label {
      font-size: var(--text-xs);
      color: var(--text-muted);
    }
  }
}

// 操作按钮
.action-btns {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);

  .action-btn {
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
  padding: var(--space-4) 0 0;
  margin-top: var(--space-4);
  border-top: 1px solid var(--border-subtle);

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
.section-form {
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
  }

  :deep(.el-form-item__label) {
    color: var(--text-secondary);
  }

  :deep(.el-textarea) {
    .el-textarea__inner {
      background: var(--glass-bg);
      border: 1px solid var(--glass-border);
      color: var(--text-primary);

      &:hover, &:focus {
        border-color: var(--glass-border-hover);
      }
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

      .detail-subtitle {
        font-size: var(--text-sm);
        color: var(--text-tertiary);
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
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-3);
    margin-bottom: var(--space-5);

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

        &.occupied {
          background: var(--accent-surface);
          color: var(--accent-400);
        }

        &.reserved {
          background: var(--warning-surface);
          color: var(--warning-400);
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

  .utilization-chart {
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-lg);
    padding: var(--space-4);

    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-3);

      span {
        font-size: var(--text-sm);
        color: var(--text-secondary);
      }

      .chart-value {
        font-family: var(--font-display);
        font-size: var(--text-xl);
        font-weight: var(--font-bold);
        color: var(--primary-400);
      }
    }

    .chart-bar {
      height: 12px;
      background: var(--glass-bg-active);
      border-radius: var(--radius-full);
      overflow: hidden;

      .chart-progress {
        height: 100%;
        background: linear-gradient(90deg, var(--primary-500), var(--primary-400));
        border-radius: var(--radius-full);
        transition: width 0.5s ease;
      }
    }
  }
}

// 车位数量更新对话框
.space-count-info {
  margin-bottom: var(--space-4);

  .info-text {
    font-size: var(--text-sm);
    color: var(--text-secondary);

    strong {
      color: var(--primary-400);
    }
  }
}

// 响应式
@media (max-width: 768px) {
  .parking-section-page {
    padding: var(--space-4);
  }

  .pagination-wrapper {
    flex-direction: column;
    gap: var(--space-4);
    align-items: center;
  }

  .detail-stats {
    grid-template-columns: 1fr !important;
  }
}
</style>
