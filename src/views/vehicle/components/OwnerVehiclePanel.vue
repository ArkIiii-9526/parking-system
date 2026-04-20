<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getParkingPage } from '@/api/parking'
import { getAvailableSpaces } from '@/api/parkingSpace'
import { vehicleEntry, vehicleExit, getActiveEntry, getVehicleRecordsByCar } from '@/api/vehicle'
import { getReservationPage } from '@/api/reservation'
import { useUserStore } from '@/stores/user'
import { getCurrentUserId } from '@/utils/userRole'
import { getOwnerCars, rememberOwnerCar, rememberOwnerCars } from '@/utils/ownerCars'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const entryLoading = ref(false)
const exitLoading = ref(false)
const queryLoading = ref(false)
const recordLoading = ref(false)

const parkingList = ref([])
const availableSpaces = ref([])
const ownerReservations = ref([])
const knownCars = ref([])
const activeEntryRecord = ref(null)
const records = ref([])

const currentUserId = computed(() => getCurrentUserId(userStore))

const guideContext = reactive({
  reservationId: '',
  parkingName: '',
  spaceNumber: ''
})

const entryForm = reactive({
  parkingId: null,
  carNo: '',
  spaceId: null
})

const exitForm = reactive({
  parkingId: null,
  carNo: ''
})

const queryForm = reactive({
  carNo: ''
})

const recordFilter = reactive({
  carNo: ''
})

const entryFormRef = ref(null)
const exitFormRef = ref(null)

const entryRules = {
  parkingId: [{ required: true, message: '请选择停车场', trigger: 'change' }],
  carNo: [{ required: true, message: '请输入车牌号', trigger: 'blur' }]
}

const exitRules = {
  parkingId: [{ required: true, message: '请选择停车场', trigger: 'change' }],
  carNo: [{ required: true, message: '请输入车牌号', trigger: 'blur' }]
}

const currentActionText = computed(() => {
  const action = String(route.query.action || '')
  if (action === 'entry') return '正在准备入场'
  if (action === 'exit') return '正在准备离场'
  return '先查询停车状态，再选择入场或离场'
})

const pendingReservations = computed(() => ownerReservations.value.filter(item => item.status === 0))

function formatDateTime(value) {
  if (!value) return '-'
  return new Date(value).toLocaleString('zh-CN')
}

function calculateDuration(entryTime, exitTime) {
  if (!entryTime) return '-'
  const start = new Date(entryTime)
  const end = new Date(exitTime || Date.now())
  const totalMinutes = Math.max(0, Math.floor((end - start) / 1000 / 60))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours > 0) {
    return `${hours}小时${minutes}分钟`
  }
  return `${minutes}分钟`
}

function getSpaceCode(space) {
  return space?.spaceCode || space?.spaceNumber || space?.code || ''
}

function normalizeId(value) {
  if (value == null || value === '') {
    return null
  }

  const normalized = String(value).trim()
  return normalized || null
}

function normalizeText(value) {
  return String(value || '').trim()
}

function getSpaceOptionLabel(space) {
  const code = getSpaceCode(space)
  const area = space?.sectionArea || space?.area || space?.zone || ''
  if (code && area) {
    return `${code}｜${area}`
  }
  return code || `#${space?.id || ''}`
}

function normalizeSpace(space) {
  return {
    ...space,
    id: normalizeId(space?.id),
    parkingId: normalizeId(space?.parkingId),
    spaceCode: getSpaceCode(space)
  }
}

function normalizeParking(parking) {
  return {
    ...parking,
    id: normalizeId(parking?.id)
  }
}

function normalizeCarNo(value) {
  return String(value || '').trim().toUpperCase()
}

function prependSelectedSpaceOption() {
  if (!entryForm.spaceId || !guideContext.spaceNumber) {
    return
  }

  if (availableSpaces.value.some(space => space.id === entryForm.spaceId)) {
    return
  }

  availableSpaces.value = [
    normalizeSpace({
      id: entryForm.spaceId,
      parkingId: entryForm.parkingId,
      spaceNumber: guideContext.spaceNumber,
      sectionArea: '预约车位'
    }),
    ...availableSpaces.value
  ]
}

function findReservationFromRoute(parkingName, spaceNumber, carNo) {
  const normalizedParkingName = normalizeText(parkingName)
  const normalizedSpaceNumber = normalizeText(spaceNumber)
  const normalizedCarNo = normalizeCarNo(carNo)

  return ownerReservations.value.find((reservation) => {
    if (normalizedCarNo && normalizeCarNo(reservation.carNo) !== normalizedCarNo) {
      return false
    }
    if (normalizedParkingName && normalizeText(reservation.parkingName) !== normalizedParkingName) {
      return false
    }
    if (normalizedSpaceNumber && normalizeText(reservation.spaceNumber) !== normalizedSpaceNumber) {
      return false
    }
    return true
  }) || null
}

async function loadParkingList() {
  try {
    const res = await getParkingPage({ pageNo: 1, pageSize: 200 })
    parkingList.value = res.code === 200
      ? (res.data?.records || []).map(normalizeParking)
      : []
  } catch (error) {
    console.error('加载停车场失败:', error)
    parkingList.value = []
  }
}

async function loadOwnerReservations() {
  if (!currentUserId.value) return

  try {
    const res = await getReservationPage({
      page: 1,
      size: 20,
      userId: currentUserId.value
    })

    ownerReservations.value = res?.code === 200 ? (res.data?.records || []) : []
    knownCars.value = rememberOwnerCars(
      currentUserId.value,
      ownerReservations.value.map(item => item.carNo)
    )
  } catch (error) {
    console.error('加载车主预约失败:', error)
    ownerReservations.value = []
    knownCars.value = getOwnerCars(currentUserId.value)
  }
}

async function loadAvailableSpaces(parkingId) {
  if (!parkingId) {
    availableSpaces.value = []
    return
  }

  try {
    const res = await getAvailableSpaces(parkingId)
    const spaces = Array.isArray(res?.data) ? res.data : []
    availableSpaces.value = spaces.map(normalizeSpace)
    prependSelectedSpaceOption()
  } catch (error) {
    console.error('加载可选车位失败:', error)
    availableSpaces.value = []
  }
}

function applyRouteQuery() {
  const queryParkingId = normalizeId(route.query.parkingId)
  const querySpaceId = normalizeId(route.query.spaceId)
  const queryParkingName = normalizeText(route.query.parkingName)
  const querySpaceNumber = normalizeText(route.query.spaceNumber)
  const queryCarNo = normalizeCarNo(route.query.carNo)
  const matchedReservation = findReservationFromRoute(queryParkingName, querySpaceNumber, queryCarNo)
  const matchedParking = queryParkingName
    ? parkingList.value.find(parking => normalizeText(parking.name) === queryParkingName)
    : null
  const resolvedParkingId = normalizeId(matchedReservation?.parkingId) || queryParkingId || matchedParking?.id
  const resolvedSpaceId = normalizeId(matchedReservation?.parkingSpaceId) || querySpaceId

  guideContext.reservationId = String(route.query.reservationId || '')
  guideContext.parkingName = queryParkingName
  guideContext.spaceNumber = querySpaceNumber

  if (resolvedParkingId) {
    entryForm.parkingId = resolvedParkingId
    exitForm.parkingId = resolvedParkingId
  }
  if (resolvedSpaceId) {
    entryForm.spaceId = resolvedSpaceId
    prependSelectedSpaceOption()
  }
  if (queryCarNo) {
    entryForm.carNo = queryCarNo
    exitForm.carNo = queryCarNo
    queryForm.carNo = queryCarNo
    recordFilter.carNo = queryCarNo
    rememberOwnerCar(currentUserId.value, queryCarNo)
    knownCars.value = getOwnerCars(currentUserId.value)
  }
}

function useReservation(reservation) {
  guideContext.reservationId = String(reservation.id || '')
  guideContext.parkingName = reservation.parkingName || ''
  guideContext.spaceNumber = reservation.spaceNumber || ''

  entryForm.parkingId = normalizeId(reservation.parkingId)
  entryForm.carNo = normalizeCarNo(reservation.carNo)
  entryForm.spaceId = normalizeId(reservation.parkingSpaceId)
  prependSelectedSpaceOption()

  exitForm.parkingId = normalizeId(reservation.parkingId)
  exitForm.carNo = normalizeCarNo(reservation.carNo)
  queryForm.carNo = normalizeCarNo(reservation.carNo)
  recordFilter.carNo = normalizeCarNo(reservation.carNo)
}

function goToGuidance(reservation) {
  router.push({
    path: '/guidance',
    query: {
      parkingName: reservation.parkingName || '',
      spaceNumber: reservation.spaceNumber || '',
      carNo: reservation.carNo || ''
    }
  })
}

async function handleEntry() {
  if (!entryFormRef.value) return
  try {
    await entryFormRef.value.validate()
  } catch {
    return
  }

  entryLoading.value = true
  try {
    const res = await vehicleEntry({
      parkingId: entryForm.parkingId,
      carNo: normalizeCarNo(entryForm.carNo),
      spaceId: entryForm.spaceId || undefined
    })

    if (res.code === 200) {
      const carNo = normalizeCarNo(entryForm.carNo)
      rememberOwnerCar(currentUserId.value, carNo)
      knownCars.value = getOwnerCars(currentUserId.value)
      queryForm.carNo = carNo
      recordFilter.carNo = carNo
      ElMessage.success('入场成功，已同步更新你的停车状态')
      await handleQuery()
      await loadRecords()
    } else {
      ElMessage.error(res.msg || '入场失败')
    }
  } catch (error) {
    console.error('入场失败:', error)
  } finally {
    entryLoading.value = false
  }
}

async function handleExit() {
  if (!exitFormRef.value) return
  try {
    await exitFormRef.value.validate()
  } catch {
    return
  }

  exitLoading.value = true
  try {
    const carNo = normalizeCarNo(exitForm.carNo)
    const res = await vehicleExit({
      parkingId: exitForm.parkingId,
      carNo
    })

    if (res.code === 200) {
      rememberOwnerCar(currentUserId.value, carNo)
      knownCars.value = getOwnerCars(currentUserId.value)
      ElMessage.success('离场成功，正在为你打开缴费页')
      await loadRecords()
      router.push({
        path: '/billing',
        query: { carNo }
      })
    } else {
      ElMessage.error(res.msg || '离场失败')
    }
  } catch (error) {
    console.error('离场失败:', error)
  } finally {
    exitLoading.value = false
  }
}

async function handleQuery() {
  const carNo = normalizeCarNo(queryForm.carNo)
  if (!carNo) {
    ElMessage.warning('请先输入车牌号')
    return
  }

  queryLoading.value = true
  try {
    const res = await getActiveEntry({ carNo })
    if (res.code === 200) {
      const payload = Array.isArray(res.data)
        ? res.data.find(item => item?.status === 0 && normalizeCarNo(item.carNo) === carNo)
        : res.data

      activeEntryRecord.value = payload?.status === 0 ? payload : null
      rememberOwnerCar(currentUserId.value, carNo)
      knownCars.value = getOwnerCars(currentUserId.value)

      if (!activeEntryRecord.value) {
        ElMessage.info('当前没有找到这辆车的在场记录')
      }
    } else {
      ElMessage.error(res.msg || '查询失败')
    }
  } catch (error) {
    console.error('查询在场状态失败:', error)
  } finally {
    queryLoading.value = false
  }
}

async function loadRecords() {
  const carNo = normalizeCarNo(recordFilter.carNo)
  if (!carNo) {
    records.value = []
    return
  }

  recordLoading.value = true
  try {
    const res = await getVehicleRecordsByCar(carNo, { pageNo: 1, pageSize: 20 })
    if (res.code === 200) {
      const rows = Array.isArray(res.data) ? res.data : (res.data?.records || [])
      records.value = rows
      rememberOwnerCar(currentUserId.value, carNo)
      knownCars.value = getOwnerCars(currentUserId.value)
    }
  } catch (error) {
    console.error('加载车辆记录失败:', error)
    records.value = []
  } finally {
    recordLoading.value = false
  }
}

watch(() => entryForm.parkingId, (parkingId) => {
  entryForm.spaceId = normalizeId(entryForm.spaceId)
  loadAvailableSpaces(parkingId)
})

watch(
  () => route.query,
  () => {
    applyRouteQuery()
  }
)

onMounted(async () => {
  loading.value = true
  try {
    await Promise.all([loadParkingList(), loadOwnerReservations()])
    applyRouteQuery()

    if (!recordFilter.carNo && knownCars.value.length === 1) {
      recordFilter.carNo = knownCars.value[0]
      queryForm.carNo = knownCars.value[0]
      exitForm.carNo = knownCars.value[0]
      entryForm.carNo = entryForm.carNo || knownCars.value[0]
    }

    if (queryForm.carNo) {
      await handleQuery()
    }
    if (recordFilter.carNo) {
      await loadRecords()
    }
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="owner-vehicle-page" v-loading="loading">
    <section class="owner-banner">
      <div>
        <p class="banner-eyebrow">预约接力入场</p>
        <h1 class="banner-title">车辆进出操作台</h1>
        <p class="banner-subtitle">
          {{ currentActionText }}。如果你已经预约，先点下面的“带入预约”，车牌号、停车场和车位会自动填进表单。
        </p>
      </div>
      <div class="banner-tip">
        <span class="tip-label">当前焦点</span>
        <strong>{{ route.query.action === 'exit' ? '离场结算' : '入场登记' }}</strong>
        <span>{{ guideContext.parkingName || '可直接手动选择停车场' }}</span>
      </div>
    </section>

    <section v-if="pendingReservations.length" class="reservation-strip">
      <article v-for="reservation in pendingReservations.slice(0, 3)" :key="reservation.id" class="reservation-card">
        <div class="reservation-main">
          <strong>{{ reservation.parkingName || '预约停车场' }}</strong>
          <span>{{ reservation.carNo }} · {{ reservation.spaceNumber || '待确认车位' }}</span>
          <span>{{ formatDateTime(reservation.startTime) }}</span>
        </div>
        <div class="reservation-actions">
          <button class="outline-btn" type="button" @click="useReservation(reservation)">带入预约</button>
          <button class="outline-btn primary" type="button" @click="goToGuidance(reservation)">先看引导</button>
        </div>
      </article>
    </section>

    <section class="form-grid">
      <article class="panel-card">
        <div class="panel-header">
          <div>
            <p class="panel-eyebrow">第一步</p>
            <h2 class="panel-title">我要入场</h2>
          </div>
          <span class="panel-hint">支持按预约车位直接入场，也支持手动选择停车场</span>
        </div>

        <el-form ref="entryFormRef" :model="entryForm" :rules="entryRules" label-position="top" class="owner-form">
          <el-form-item label="停车场" prop="parkingId">
            <el-select v-model="entryForm.parkingId" placeholder="请选择停车场">
              <el-option v-for="parking in parkingList" :key="parking.id" :label="parking.name" :value="parking.id" />
            </el-select>
          </el-form-item>

          <el-form-item label="车牌号" prop="carNo">
            <el-select
              v-model="entryForm.carNo"
              filterable
              allow-create
              default-first-option
              placeholder="输入或选择常用车牌"
              clearable
            >
              <el-option v-for="carNo in knownCars" :key="carNo" :label="carNo" :value="carNo" />
            </el-select>
          </el-form-item>

          <el-form-item label="预约车位（可选）">
            <el-select
              v-model="entryForm.spaceId"
              filterable
              clearable
              placeholder="不知道停哪个车位时可留空"
            >
              <el-option
                v-for="space in availableSpaces"
                :key="space.id"
                :label="getSpaceOptionLabel(space)"
                :value="space.id"
              />
            </el-select>
          </el-form-item>

          <div class="form-footer">
            <button class="primary-btn" type="button" :disabled="entryLoading" @click="handleEntry">
              {{ entryLoading ? '入场中...' : '确认入场' }}
            </button>
          </div>
        </el-form>
      </article>

      <article class="panel-card">
        <div class="panel-header">
          <div>
            <p class="panel-eyebrow">第二步</p>
            <h2 class="panel-title">我要离场</h2>
          </div>
          <span class="panel-hint">离场完成后会自动跳到缴费页，继续完成付款</span>
        </div>

        <el-form ref="exitFormRef" :model="exitForm" :rules="exitRules" label-position="top" class="owner-form">
          <el-form-item label="停车场" prop="parkingId">
            <el-select v-model="exitForm.parkingId" placeholder="请选择停车场">
              <el-option v-for="parking in parkingList" :key="parking.id" :label="parking.name" :value="parking.id" />
            </el-select>
          </el-form-item>

          <el-form-item label="车牌号" prop="carNo">
            <el-select
              v-model="exitForm.carNo"
              filterable
              allow-create
              default-first-option
              placeholder="输入或选择常用车牌"
              clearable
            >
              <el-option v-for="carNo in knownCars" :key="carNo" :label="carNo" :value="carNo" />
            </el-select>
          </el-form-item>

          <div class="form-footer">
            <button class="primary-btn success" type="button" :disabled="exitLoading" @click="handleExit">
              {{ exitLoading ? '离场处理中...' : '确认离场' }}
            </button>
          </div>
        </el-form>
      </article>
    </section>

    <section class="record-grid">
      <article class="panel-card">
        <div class="panel-header">
          <div>
            <p class="panel-eyebrow">实时状态</p>
            <h2 class="panel-title">我现在停在哪里</h2>
          </div>
        </div>

        <div class="lookup-row">
          <el-select
            v-model="queryForm.carNo"
            filterable
            allow-create
            default-first-option
            clearable
            placeholder="选择要查询的车牌"
          >
            <el-option v-for="carNo in knownCars" :key="carNo" :label="carNo" :value="carNo" />
          </el-select>
          <button class="outline-btn primary" type="button" :disabled="queryLoading" @click="handleQuery">
            {{ queryLoading ? '查询中...' : '查询状态' }}
          </button>
        </div>

        <div v-if="activeEntryRecord" class="status-card">
          <span class="status-badge">在场中</span>
          <h3>{{ activeEntryRecord.carNo }}</h3>
          <p>{{ formatDateTime(activeEntryRecord.entryTime) }} 入场</p>
          <p>车位：{{ activeEntryRecord.spaceCode || activeEntryRecord.spaceNumber || activeEntryRecord.spaceId || '系统分配中' }}</p>
        </div>
        <div v-else class="empty-box">
          没有找到在场中的车辆记录，若已经离场，可以直接去缴费页确认账单。
        </div>
      </article>

      <article class="panel-card">
        <div class="panel-header">
          <div>
            <p class="panel-eyebrow">停车记录</p>
            <h2 class="panel-title">按车牌查看最近进出记录</h2>
          </div>
          <button class="text-link" type="button" @click="router.push('/billing')">查看缴费记录</button>
        </div>

        <div class="lookup-row">
          <el-select
            v-model="recordFilter.carNo"
            filterable
            allow-create
            default-first-option
            clearable
            placeholder="选择要查看的车牌"
          >
            <el-option v-for="carNo in knownCars" :key="carNo" :label="carNo" :value="carNo" />
          </el-select>
          <button class="outline-btn" type="button" :disabled="recordLoading" @click="loadRecords">
            {{ recordLoading ? '加载中...' : '查看记录' }}
          </button>
        </div>

        <el-table :data="records" v-loading="recordLoading" class="record-table" empty-text="先选择车牌后查看停车记录">
          <el-table-column prop="carNo" label="车牌号" min-width="120" />
          <el-table-column prop="parkingName" label="停车场" min-width="150" />
          <el-table-column prop="spaceCode" label="车位" min-width="120" />
          <el-table-column prop="entryTime" label="入场时间" min-width="168">
            <template #default="{ row }">{{ formatDateTime(row.entryTime) }}</template>
          </el-table-column>
          <el-table-column prop="exitTime" label="出场时间" min-width="168">
            <template #default="{ row }">{{ row.exitTime ? formatDateTime(row.exitTime) : '停车中' }}</template>
          </el-table-column>
          <el-table-column label="停车时长" min-width="120">
            <template #default="{ row }">{{ calculateDuration(row.entryTime, row.exitTime) }}</template>
          </el-table-column>
        </el-table>
      </article>
    </section>
  </div>
</template>

<style scoped>
.owner-vehicle-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: var(--space-6);
}

.owner-banner,
.panel-card,
.reservation-card {
  border-radius: 26px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(15, 23, 42, 0.82);
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.22);
}

.owner-banner {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 26px;
  background:
    radial-gradient(circle at top left, rgba(59, 130, 246, 0.18), transparent 42%),
    radial-gradient(circle at bottom right, rgba(16, 185, 129, 0.16), transparent 38%),
    rgba(15, 23, 42, 0.94);
}

.banner-eyebrow,
.panel-eyebrow {
  margin: 0 0 10px;
  color: rgba(148, 163, 184, 0.85);
  font-size: 12px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.banner-title,
.panel-title {
  margin: 0;
  color: var(--text-primary);
}

.banner-subtitle,
.panel-hint,
.reservation-main span,
.status-card p,
.empty-box {
  margin: 10px 0 0;
  color: rgba(226, 232, 240, 0.75);
  font-size: 14px;
  line-height: 1.7;
}

.banner-tip {
  min-width: 220px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 18px;
  border-radius: 22px;
  background: rgba(15, 23, 42, 0.56);
}

.tip-label {
  color: rgba(147, 197, 253, 0.88);
  font-size: 12px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.reservation-strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.reservation-card {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 18px;
}

.reservation-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.reservation-actions,
.form-footer,
.lookup-row {
  display: flex;
  gap: 12px;
}

.form-grid,
.record-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.panel-card {
  padding: 22px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
}

.owner-form :deep(.el-select),
.lookup-row :deep(.el-select) {
  width: 100%;
}

.form-footer {
  margin-top: 12px;
}

.primary-btn,
.outline-btn,
.text-link {
  border: none;
  cursor: pointer;
  transition: transform 0.25s ease, box-shadow 0.25s ease, background-color 0.25s ease;
}

.primary-btn {
  min-width: 140px;
  padding: 12px 20px;
  border-radius: 999px;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #fff;
  box-shadow: 0 14px 28px rgba(37, 99, 235, 0.28);
}

.primary-btn.success {
  background: linear-gradient(135deg, #10b981, #059669);
  box-shadow: 0 14px 28px rgba(5, 150, 105, 0.28);
}

.outline-btn {
  padding: 10px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
}

.outline-btn.primary {
  background: rgba(59, 130, 246, 0.2);
  color: #bfdbfe;
}

.text-link {
  padding: 0;
  background: transparent;
  color: #93c5fd;
  font-size: 13px;
}

.primary-btn:hover,
.outline-btn:hover,
.text-link:hover {
  transform: translateY(-2px);
}

.status-card {
  padding: 16px;
  border-radius: 18px;
  background: rgba(15, 23, 42, 0.52);
}

.status-badge {
  display: inline-flex;
  margin-bottom: 12px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(16, 185, 129, 0.18);
  color: #86efac;
  font-size: 12px;
}

.empty-box {
  padding: 18px;
  border-radius: 18px;
  border: 1px dashed rgba(148, 163, 184, 0.24);
  background: rgba(15, 23, 42, 0.42);
}

.record-table {
  margin-top: 12px;
}

@media (max-width: 1200px) {
  .reservation-strip,
  .form-grid,
  .record-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .owner-vehicle-page {
    padding: 16px;
  }

  .owner-banner,
  .reservation-card,
  .panel-header,
  .lookup-row {
    flex-direction: column;
  }

  .reservation-actions,
  .form-footer {
    flex-direction: column;
  }
}
</style>
