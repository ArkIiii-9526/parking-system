<template>
  <div class="reservation-page legacy-themed-page">
    <section v-if="isOwnerView" class="owner-intro">
      <div class="intro-copy">
        <p class="intro-eyebrow">车主预约中心</p>
        <h1 class="intro-title">先预约，再入场，流程会更顺</h1>
        <p class="intro-subtitle">
          预约成功后系统会立即为你锁定车位 {{ RESERVATION_HOLD_MINUTES }} 分钟。超时仍未入场，预约会自动取消并释放车位。
        </p>
      </div>
      <div class="intro-stats">
        <div class="intro-card">
          <span>当前用户</span>
          <strong>{{ userStore.user?.nickname || userStore.user?.username || '车主' }}</strong>
        </div>
        <div class="intro-card accent">
          <span>待使用预约</span>
          <strong>{{ pendingReservationCount }}</strong>
        </div>
      </div>
    </section>

    <el-card shadow="never" class="filter-card">
      <el-form :inline="true" :model="filterForm">
        <el-form-item label="停车场">
          <el-select v-model="filterForm.parkingId" clearable filterable placeholder="全部" style="width: 200px" @focus="loadParkings">
            <el-option v-for="p in parkingOptions" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="车牌号">
          <el-input v-model="filterForm.carNo" clearable placeholder="模糊查询" style="width: 140px" />
        </el-form-item>
        <el-form-item v-if="!isOwnerView" label="用户ID">
          <el-input v-model="filterForm.userId" clearable style="width: 120px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filterForm.status" clearable placeholder="全部" style="width: 120px">
            <el-option label="待使用" :value="1" />
            <el-option label="已使用" :value="2" />
            <el-option label="已取消" :value="3" />
            <el-option label="已过期" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            value-format="YYYY-MM-DD"
            start-placeholder="开始"
            end-placeholder="结束"
          />
        </el-form-item>
        <el-form-item>
          <el-button v-permission="'reservation:view'" type="primary" @click="loadData">查询</el-button>
          <el-button @click="resetFilter">重置</el-button>
          <el-button type="success" @click="openCreate">新建预约</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="table-card">
      <el-table v-loading="loading" :data="tableData" border stripe>
        <el-table-column v-if="!isOwnerView" prop="id" label="ID" width="70" />
        <el-table-column prop="parkingName" label="停车场" min-width="120" />
        <el-table-column prop="spaceNumber" label="车位" width="90" />
        <el-table-column prop="carNo" label="车牌" width="110" />
        <el-table-column v-if="!isOwnerView" prop="userId" label="用户ID" width="100" />
        <el-table-column prop="reserveTime" label="预约时间" width="170" />
        <el-table-column prop="endTime" label="保留截止" width="170" />
        <el-table-column prop="statusText" label="状态" width="90" />
        <el-table-column label="操作" :width="isOwnerView ? 280 : 220" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row)">详情</el-button>
            <el-button v-if="isOwnerView && Number(row.status) === 1" link type="success" @click="goToEntry(row)">去入场</el-button>
            <el-button v-if="isOwnerView && Number(row.status) === 1" link type="info" @click="goToGuidance(row)">去引导</el-button>
            <el-button v-if="Number(row.status) === 1" link type="warning" @click="openEdit(row)">修改备注</el-button>
            <el-button v-if="Number(row.status) === 1" link type="warning" @click="handleCancel(row)">取消</el-button>
            <el-button
              v-if="Number(row.status) === 3 || Number(row.status) === 4"
              v-permission="'reservation:delete'"
              link
              type="danger"
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </el-card>

    <el-dialog v-model="createVisible" title="新建预约" width="520px" destroy-on-close @open="onCreateOpen">
      <el-form ref="createFormRef" :model="createForm" :rules="createRules" label-width="100px">
        <el-form-item label="停车场" prop="parkingId">
          <el-select v-model="createForm.parkingId" filterable style="width: 100%" @change="onCreateParkingChange">
            <el-option v-for="p in parkingOptions" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="停车位" prop="parkingSpaceId">
          <el-select v-model="createForm.parkingSpaceId" filterable style="width: 100%" :loading="spaceLoading">
            <el-option v-for="s in spaceOptions" :key="s.id" :label="s.number || s.spaceNumber || `#${s.id}`" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="车牌号" prop="carNo">
          <el-input v-model="createForm.carNo" />
        </el-form-item>
        <el-form-item v-if="!isOwnerView" label="用户ID" prop="userId">
          <el-input v-model="createForm.userId" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="createForm.remark" type="textarea" rows="2" />
        </el-form-item>
        <el-alert
          :title="`提交后会立即锁定车位，默认保留 ${RESERVATION_HOLD_MINUTES} 分钟。超时未入场，系统会自动取消预约。`"
          type="info"
          :closable="false"
          show-icon
        />
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitCreate">确定</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="detailVisible" title="预约详情" size="400px">
      <el-descriptions v-if="currentRow" :column="1" border>
        <el-descriptions-item label="停车场">{{ currentRow.parkingName }}</el-descriptions-item>
        <el-descriptions-item label="车位">{{ currentRow.spaceNumber }}</el-descriptions-item>
        <el-descriptions-item label="车牌">{{ currentRow.carNo }}</el-descriptions-item>
        <el-descriptions-item v-if="!isOwnerView" label="用户">{{ currentRow.userId }}</el-descriptions-item>
        <el-descriptions-item label="预约时间">{{ currentRow.reserveTime }}</el-descriptions-item>
        <el-descriptions-item label="保留截止">{{ currentRow.endTime }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ currentRow.statusText }}</el-descriptions-item>
        <el-descriptions-item label="备注">{{ currentRow.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-drawer>

    <el-dialog v-model="editVisible" title="修改预约备注" width="480px">
      <el-form ref="editFormRef" :model="editForm" label-width="100px">
        <el-form-item label="备注">
          <el-input v-model="editForm.remark" type="textarea" rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="editLoading" @click="submitEdit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import {
  getReservationPage,
  createReservation,
  updateReservation,
  cancelReservation,
  deleteReservation,
  getReservationDetail
} from '@/api/reservation'
import { getParkingPage } from '@/api/parking'
import { getParkingSpacesByParking } from '@/api/parkingSpace'
import { useUserStore } from '@/stores/user'
import { rememberOwnerCar, rememberOwnerCars } from '@/utils/ownerCars'
import { getCurrentUserId, isOwnerUser } from '@/utils/userRole'

const router = useRouter()
const userStore = useUserStore()
const isOwnerView = computed(() => isOwnerUser(userStore))
const currentUserId = computed(() => getCurrentUserId(userStore))
const loading = ref(false)
const tableData = ref([])
const parkingOptions = ref([])
const spaceOptions = ref([])
const spaceLoading = ref(false)
const dateRange = ref(null)

const filterForm = reactive({
  parkingId: undefined,
  carNo: '',
  userId: '',
  status: undefined
})

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

const RESERVATION_HOLD_MINUTES = 15

const pendingReservationCount = computed(() => tableData.value.filter(item => Number(item.status) === 1).length)

async function loadParkings() {
  if (parkingOptions.value.length) return
  try {
    const res = await getParkingPage({ pageNo: 1, pageSize: 500 })
    if (res.code === 200) parkingOptions.value = res.data?.records || []
  } catch (e) {
    console.error(e)
  }
}

function resetFilter() {
  filterForm.parkingId = undefined
  filterForm.carNo = ''
  filterForm.userId = isOwnerView.value && currentUserId.value ? String(currentUserId.value) : ''
  filterForm.status = undefined
  dateRange.value = null
  pagination.page = 1
  loadData()
}

async function loadData() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      size: pagination.size,
      parkingId: filterForm.parkingId,
      carNo: filterForm.carNo || undefined,
      userId: isOwnerView.value
        ? (currentUserId.value != null ? String(currentUserId.value) : undefined)
        : (filterForm.userId || undefined),
      status: filterForm.status
    }
    if (dateRange.value?.length === 2) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }
    const res = await getReservationPage(params)
    if (res.code === 200) {
      const d = res.data || {}
      tableData.value = d.records || []
      pagination.total = d.total || 0
      if (isOwnerView.value && currentUserId.value != null) {
        rememberOwnerCars(currentUserId.value, tableData.value.map(item => item.carNo))
      }
    }
  } catch (e) {
    console.error(e)
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

const createVisible = ref(false)
const createFormRef = ref(null)
const createForm = reactive({
  parkingId: undefined,
  parkingSpaceId: undefined,
  carNo: '',
  userId: '',
  remark: ''
})

const createRules = {
  parkingId: [{ required: true, message: '请选择停车场', trigger: 'change' }],
  parkingSpaceId: [{ required: true, message: '请选择车位', trigger: 'change' }],
  carNo: [{ required: true, message: '请输入车牌', trigger: 'blur' }],
  userId: [{ required: true, message: '请输入用户ID', trigger: 'blur' }]
}
const submitLoading = ref(false)

function onCreateOpen() {
  loadParkings()
  const uid = userStore.user?.userId ?? userStore.user?.id
  if (uid != null) createForm.userId = String(uid)
}

async function onCreateParkingChange(pid) {
  createForm.parkingSpaceId = undefined
  spaceOptions.value = []
  if (!pid) return
  spaceLoading.value = true
  try {
    const res = await getParkingSpacesByParking(pid)
    if (res.code === 200) {
      const list = res.data
      spaceOptions.value = Array.isArray(list) ? list : list?.records || []
    }
  } catch (e) {
    console.error(e)
  } finally {
    spaceLoading.value = false
  }
}

function openCreate() {
  Object.assign(createForm, {
    parkingId: undefined,
    parkingSpaceId: undefined,
    carNo: '',
    userId: userStore.user?.userId != null ? String(userStore.user.userId) : (userStore.user?.id != null ? String(userStore.user.id) : ''),
    remark: ''
  })
  spaceOptions.value = []
  createVisible.value = true
}

async function submitCreate() {
  const form = createFormRef.value
  if (!form) return
  try {
    await form.validate()
  } catch {
    return
  }
  submitLoading.value = true
  try {
    const res = await createReservation({ ...createForm })
    if (res.code === 200) {
      if (isOwnerView.value && currentUserId.value != null) {
        rememberOwnerCar(currentUserId.value, createForm.carNo)
      }
      ElMessage.success(`预约成功，已锁位 ${RESERVATION_HOLD_MINUTES} 分钟`)
      createVisible.value = false
      loadData()
    }
  } catch (e) {
    console.error(e)
  } finally {
    submitLoading.value = false
  }
}

const detailVisible = ref(false)
const currentRow = ref(null)

async function openDetail(row) {
  try {
    const res = await getReservationDetail(row.id)
    if (res.code === 200) {
      currentRow.value = res.data
      detailVisible.value = true
    }
  } catch (e) {
    currentRow.value = { ...row }
    detailVisible.value = true
  }
}

const editVisible = ref(false)
const editFormRef = ref(null)
const editLoading = ref(false)
const editForm = reactive({
  id: null,
  remark: ''
})

function openEdit(row) {
  editForm.id = row.id
  editForm.remark = row.remark || ''
  editVisible.value = true
}

async function submitEdit() {
  const form = editFormRef.value
  if (!form) return
  try {
    await form.validate()
  } catch {
    return
  }
  editLoading.value = true
  try {
    const res = await updateReservation(editForm.id, { remark: editForm.remark })
    if (res.code === 200) {
      ElMessage.success('已保存')
      editVisible.value = false
      loadData()
    }
  } catch (e) {
    console.error(e)
  } finally {
    editLoading.value = false
  }
}

async function handleCancel(row) {
  await ElMessageBox.confirm('确定取消该预约？取消后会立即释放车位。', '提示', { type: 'warning' })
  try {
    const res = await cancelReservation(row.id)
    if (res.code === 200) {
      ElMessage.success('已取消')
      loadData()
    }
  } catch (e) {
    if (e !== 'cancel') console.error(e)
  }
}

async function handleDelete(row) {
  await ElMessageBox.confirm('确定删除该预约？', '提示', { type: 'warning' })
  try {
    const res = await deleteReservation(row.id)
    if (res.code === 200) {
      ElMessage.success('已删除')
      loadData()
    }
  } catch (e) {
    if (e !== 'cancel') console.error(e)
  }
}

function goToEntry(row) {
  router.push({
    path: '/vehicle',
    query: {
      action: 'entry',
      parkingName: row.parkingName || '',
      spaceNumber: row.spaceNumber || '',
      carNo: row.carNo || ''
    }
  })
}

function goToGuidance(row) {
  router.push({
    path: '/guidance',
    query: {
      parkingName: row.parkingName || '',
      spaceNumber: row.spaceNumber || '',
      carNo: row.carNo || ''
    }
  })
}

onMounted(() => {
  if (isOwnerView.value && currentUserId.value != null) {
    filterForm.userId = String(currentUserId.value)
  }
  loadParkings()
  loadData()
})
</script>

<style scoped>
.reservation-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.owner-intro {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(240px, 1fr);
  gap: 16px;
  padding: 24px;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background:
    radial-gradient(circle at top left, rgba(59, 130, 246, 0.16), transparent 40%),
    radial-gradient(circle at bottom right, rgba(16, 185, 129, 0.16), transparent 38%),
    rgba(15, 23, 42, 0.86);
}

.intro-eyebrow {
  margin: 0 0 10px;
  color: rgba(148, 163, 184, 0.85);
  font-size: 12px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.intro-title {
  margin: 0;
  color: var(--text-primary);
}

.intro-subtitle {
  margin: 10px 0 0;
  color: rgba(226, 232, 240, 0.75);
  line-height: 1.8;
}

.intro-stats {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.intro-card {
  padding: 16px;
  border-radius: 18px;
  background: rgba(15, 23, 42, 0.56);
  color: var(--text-primary);
}

.intro-card span {
  display: block;
  margin-bottom: 8px;
  color: rgba(148, 163, 184, 0.84);
  font-size: 13px;
}

.intro-card strong {
  font-size: 24px;
}

.intro-card.accent {
  background: rgba(16, 185, 129, 0.16);
}

.filter-card {
  border-radius: 8px;
}
.pagination-wrap {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 960px) {
  .owner-intro {
    grid-template-columns: 1fr;
  }
}
</style>
