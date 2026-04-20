<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getBillingRecordsPage, payBillingRecord } from '@/api/billing'
import { getReservationPage } from '@/api/reservation'
import { useUserStore } from '@/stores/user'
import { getCurrentUserId } from '@/utils/userRole'
import { getOwnerCars, rememberOwnerCar, rememberOwnerCars } from '@/utils/ownerCars'

const route = useRoute()
const userStore = useUserStore()

const loading = ref(false)
const payLoading = ref(false)
const payDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const dateRange = ref(null)
const tableData = ref([])
const knownCars = ref([])
const currentRecord = ref({})

const currentUserId = computed(() => getCurrentUserId(userStore))

const filterForm = reactive({
  carNo: '',
  paymentStatus: null
})

const pagination = reactive({
  pageNo: 1,
  pageSize: 10,
  total: 0
})

const payForm = reactive({
  paymentMethod: 'wechat',
  actualAmount: 0,
  transactionNo: ''
})

const payRules = {
  paymentMethod: [{ required: true, message: '请选择支付方式', trigger: 'change' }],
  actualAmount: [{ required: true, message: '请输入实付金额', trigger: 'blur' }]
}

const payFormRef = ref(null)

const unpaidCount = computed(() => tableData.value.filter(item => item.paymentStatus === 0).length)
const unpaidAmount = computed(() => tableData.value
  .filter(item => item.paymentStatus === 0)
  .reduce((sum, item) => sum + Number(item.feeAmount || 0), 0))
const paidAmount = computed(() => tableData.value
  .filter(item => item.paymentStatus === 1)
  .reduce((sum, item) => sum + Number(item.actualAmount || 0), 0))

function formatTime(time) {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}

function calculateDuration(entryTime, exitTime) {
  if (!entryTime || !exitTime) return '-'
  const entry = new Date(entryTime)
  const exit = new Date(exitTime)
  const duration = Math.floor((exit - entry) / 1000 / 60)
  const hours = Math.floor(duration / 60)
  const minutes = duration % 60

  if (hours > 0) {
    return `${hours}小时${minutes}分钟`
  }
  return `${minutes}分钟`
}

function formatAmount(amount) {
  return Number(amount || 0).toFixed(2)
}

function getStatusType(status) {
  const types = { 0: 'warning', 1: 'success', 2: 'info' }
  return types[status] || 'info'
}

function getStatusText(status) {
  const texts = { 0: '未支付', 1: '已支付', 2: '部分支付' }
  return texts[status] || '未知'
}

function getPaymentMethodText(method) {
  const texts = { wechat: '微信支付', alipay: '支付宝', cash: '现金', card: '银行卡' }
  return texts[method] || method || '-'
}

function normalizeBillingRecord(record) {
  const feeAmount = Number(record.feeAmount ?? record.totalAmount ?? 0)
  const actualAmount = Number(record.actualAmount ?? 0)
  const discountAmount = Number(record.discountAmount ?? Math.max(feeAmount - actualAmount, 0))

  return {
    ...record,
    feeAmount,
    totalAmount: feeAmount,
    actualAmount,
    discountAmount,
    transactionNo: record.transactionNo || record.paymentTransactionNo || '',
    paymentStatus: record.paymentStatus ?? 0
  }
}

async function loadOwnerCars() {
  if (!currentUserId.value) return

  try {
    const reservationRes = await getReservationPage({
      page: 1,
      size: 20,
      userId: currentUserId.value
    })
    const reservationCars = reservationRes?.code === 200
      ? (reservationRes.data?.records || []).map(item => item.carNo)
      : []
    knownCars.value = rememberOwnerCars(currentUserId.value, reservationCars)
  } catch (error) {
    console.error('加载车主车牌失败:', error)
    knownCars.value = getOwnerCars(currentUserId.value)
  }
}

async function loadData() {
  const carNo = String(filterForm.carNo || '').trim().toUpperCase()
  if (!carNo) {
    tableData.value = []
    pagination.total = 0
    return
  }

  loading.value = true
  try {
    const params = {
      pageNo: pagination.pageNo,
      pageSize: pagination.pageSize,
      carNo,
      paymentStatus: filterForm.paymentStatus,
      startTime: dateRange.value?.[0] || null,
      endTime: dateRange.value?.[1] || null
    }

    const res = await getBillingRecordsPage(params)
    if (res.code === 200) {
      tableData.value = (res.data?.records || []).map(normalizeBillingRecord)
      pagination.total = res.data?.total || 0
      rememberOwnerCar(currentUserId.value, carNo)
      knownCars.value = getOwnerCars(currentUserId.value)
    } else {
      tableData.value = []
      pagination.total = 0
    }
  } catch (error) {
    console.error('加载账单失败:', error)
    ElMessage.error('加载账单失败')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.pageNo = 1
  loadData()
}

function handleReset() {
  filterForm.paymentStatus = null
  dateRange.value = null
  if (knownCars.value.length === 1) {
    filterForm.carNo = knownCars.value[0]
  }
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

function handlePay(row) {
  currentRecord.value = row
  payForm.paymentMethod = 'wechat'
  payForm.actualAmount = row.feeAmount
  payForm.transactionNo = ''
  payDialogVisible.value = true
}

function handleDetail(row) {
  currentRecord.value = row
  detailDialogVisible.value = true
}

async function handlePaySubmit() {
  if (!payFormRef.value) return

  try {
    await payFormRef.value.validate()
    payLoading.value = true
    const res = await payBillingRecord(currentRecord.value.id, {
      paymentMethod: payForm.paymentMethod,
      paymentTransactionNo: payForm.transactionNo,
      actualAmount: payForm.actualAmount
    })

    if (res.code === 200 && res.data) {
      ElMessage.success('支付成功')
      payDialogVisible.value = false
      loadData()
    } else {
      ElMessage.error(res.msg || '支付失败')
    }
  } catch (error) {
    console.error('支付失败:', error)
  } finally {
    payLoading.value = false
  }
}

watch(
  () => route.query.carNo,
  (carNo) => {
    if (!carNo) return
    filterForm.carNo = String(carNo).trim().toUpperCase()
    handleSearch()
  }
)

onMounted(async () => {
  await loadOwnerCars()

  const routeCarNo = String(route.query.carNo || '').trim().toUpperCase()
  if (routeCarNo) {
    filterForm.carNo = routeCarNo
  } else if (knownCars.value.length === 1) {
    filterForm.carNo = knownCars.value[0]
  }

  if (filterForm.carNo) {
    loadData()
  }
})
</script>

<template>
  <div class="owner-billing-page">
    <section class="billing-hero">
      <div>
        <p class="hero-eyebrow">离场后最后一步</p>
        <h1 class="hero-title">按车牌完成停车缴费</h1>
        <p class="hero-subtitle">
          这里默认按你的车牌筛选账单。离场成功后系统会自动把车牌带过来，你只要确认金额并完成支付即可。
        </p>
      </div>
      <div class="summary-stack">
        <div class="summary-card">
          <span>待支付笔数</span>
          <strong>{{ unpaidCount }}</strong>
        </div>
        <div class="summary-card accent">
          <span>待支付金额</span>
          <strong>¥{{ formatAmount(unpaidAmount) }}</strong>
        </div>
        <div class="summary-card success">
          <span>已支付金额</span>
          <strong>¥{{ formatAmount(paidAmount) }}</strong>
        </div>
      </div>
    </section>

    <section class="filter-card">
      <div class="filter-grid">
        <el-select
          v-model="filterForm.carNo"
          filterable
          allow-create
          default-first-option
          clearable
          placeholder="输入或选择车牌后查看账单"
        >
          <el-option v-for="carNo in knownCars" :key="carNo" :label="carNo" :value="carNo" />
        </el-select>

        <el-select v-model="filterForm.paymentStatus" clearable placeholder="支付状态">
          <el-option label="未支付" :value="0" />
          <el-option label="已支付" :value="1" />
          <el-option label="部分支付" :value="2" />
        </el-select>

        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
        />

        <div class="filter-actions">
          <button class="primary-btn" type="button" @click="handleSearch">查询账单</button>
          <button class="secondary-btn" type="button" @click="handleReset">重置</button>
        </div>
      </div>
    </section>

    <section class="table-card">
      <div class="card-header">
        <div>
          <p class="card-eyebrow">账单列表</p>
          <h2 class="card-title">最近停车收费记录</h2>
        </div>
      </div>

      <el-alert
        v-if="!filterForm.carNo"
        title="先输入车牌号，再查看与你相关的停车账单。"
        type="info"
        :closable="false"
        class="inline-alert"
      />

      <el-table :data="tableData" v-loading="loading" empty-text="输入车牌号后显示收费记录">
        <el-table-column prop="carNo" label="车牌号" min-width="120" />
        <el-table-column prop="parkingName" label="停车场" min-width="150" />
        <el-table-column prop="entryTime" label="入场时间" min-width="170">
          <template #default="{ row }">{{ formatTime(row.entryTime) }}</template>
        </el-table-column>
        <el-table-column prop="exitTime" label="出场时间" min-width="170">
          <template #default="{ row }">{{ formatTime(row.exitTime) }}</template>
        </el-table-column>
        <el-table-column label="停车时长" min-width="120">
          <template #default="{ row }">{{ calculateDuration(row.entryTime, row.exitTime) }}</template>
        </el-table-column>
        <el-table-column prop="feeAmount" label="应付金额" min-width="110">
          <template #default="{ row }">¥{{ formatAmount(row.feeAmount) }}</template>
        </el-table-column>
        <el-table-column prop="actualAmount" label="实付金额" min-width="110">
          <template #default="{ row }">¥{{ formatAmount(row.actualAmount) }}</template>
        </el-table-column>
        <el-table-column prop="paymentStatus" label="支付状态" min-width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.paymentStatus)">{{ getStatusText(row.paymentStatus) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="paymentMethod" label="支付方式" min-width="100">
          <template #default="{ row }">{{ getPaymentMethodText(row.paymentMethod) }}</template>
        </el-table-column>
        <el-table-column label="操作" min-width="150" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 1 && row.paymentStatus === 0"
              type="primary"
              link
              @click="handlePay(row)"
            >
              支付
            </el-button>
            <el-button type="info" link @click="handleDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.pageNo"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </section>

    <el-dialog v-model="payDialogVisible" title="支付停车费" width="460px" :close-on-click-modal="false">
      <div class="pay-info">
        <div class="pay-row">
          <span>车牌号</span>
          <strong>{{ currentRecord.carNo }}</strong>
        </div>
        <div class="pay-row">
          <span>停车时长</span>
          <strong>{{ calculateDuration(currentRecord.entryTime, currentRecord.exitTime) }}</strong>
        </div>
        <div class="pay-row">
          <span>应付金额</span>
          <strong class="money">¥{{ formatAmount(currentRecord.feeAmount) }}</strong>
        </div>
      </div>

      <el-form ref="payFormRef" :model="payForm" :rules="payRules" label-width="100px">
        <el-form-item label="支付方式" prop="paymentMethod">
          <el-select v-model="payForm.paymentMethod">
            <el-option label="微信支付" value="wechat" />
            <el-option label="支付宝" value="alipay" />
            <el-option label="现金支付" value="cash" />
            <el-option label="银行卡" value="card" />
          </el-select>
        </el-form-item>
        <el-form-item label="实付金额" prop="actualAmount">
          <el-input-number v-model="payForm.actualAmount" :min="0" :precision="2" :step="0.01" />
        </el-form-item>
        <el-form-item label="交易号">
          <el-input v-model="payForm.transactionNo" placeholder="可选，便于核对支付流水" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="payDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="payLoading" @click="handlePaySubmit">确认支付</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailDialogVisible" title="收费详情" width="520px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="车牌号">{{ currentRecord.carNo }}</el-descriptions-item>
        <el-descriptions-item label="停车场">{{ currentRecord.parkingName }}</el-descriptions-item>
        <el-descriptions-item label="入场时间">{{ formatTime(currentRecord.entryTime) }}</el-descriptions-item>
        <el-descriptions-item label="出场时间">{{ formatTime(currentRecord.exitTime) }}</el-descriptions-item>
        <el-descriptions-item label="停车时长">{{ calculateDuration(currentRecord.entryTime, currentRecord.exitTime) }}</el-descriptions-item>
        <el-descriptions-item label="应收金额">¥{{ formatAmount(currentRecord.feeAmount) }}</el-descriptions-item>
        <el-descriptions-item label="实收金额">¥{{ formatAmount(currentRecord.actualAmount) }}</el-descriptions-item>
        <el-descriptions-item label="优惠金额">¥{{ formatAmount(currentRecord.discountAmount) }}</el-descriptions-item>
        <el-descriptions-item label="支付状态">
          <el-tag :type="getStatusType(currentRecord.paymentStatus)">{{ getStatusText(currentRecord.paymentStatus) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="支付方式">{{ getPaymentMethodText(currentRecord.paymentMethod) }}</el-descriptions-item>
        <el-descriptions-item label="交易号">{{ currentRecord.transactionNo || '-' }}</el-descriptions-item>
        <el-descriptions-item label="支付时间">{{ formatTime(currentRecord.paymentTime) }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<style scoped>
.owner-billing-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: var(--space-6);
}

.billing-hero,
.filter-card,
.table-card {
  border-radius: 26px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(15, 23, 42, 0.82);
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.22);
}

.billing-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(280px, 1fr);
  gap: 18px;
  padding: 26px;
  background:
    radial-gradient(circle at top left, rgba(245, 158, 11, 0.18), transparent 42%),
    radial-gradient(circle at bottom right, rgba(16, 185, 129, 0.16), transparent 38%),
    rgba(15, 23, 42, 0.92);
}

.hero-eyebrow,
.card-eyebrow {
  margin: 0 0 10px;
  color: rgba(148, 163, 184, 0.85);
  font-size: 12px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.hero-title,
.card-title {
  margin: 0;
  color: var(--text-primary);
}

.hero-subtitle {
  margin: 12px 0 0;
  color: rgba(226, 232, 240, 0.76);
  font-size: 14px;
  line-height: 1.7;
}

.summary-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.summary-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px;
  border-radius: 22px;
  background: rgba(15, 23, 42, 0.58);
  color: var(--text-primary);
}

.summary-card.accent {
  background: rgba(245, 158, 11, 0.18);
}

.summary-card.success {
  background: rgba(16, 185, 129, 0.18);
}

.summary-card span {
  color: rgba(226, 232, 240, 0.72);
  font-size: 13px;
}

.summary-card strong {
  font-size: 28px;
}

.filter-card,
.table-card {
  padding: 22px;
}

.filter-grid {
  display: grid;
  grid-template-columns: 1.3fr 0.9fr 1fr auto;
  gap: 12px;
  align-items: center;
}

.filter-actions {
  display: flex;
  gap: 10px;
}

.primary-btn,
.secondary-btn {
  min-width: 96px;
  padding: 11px 16px;
  border: none;
  border-radius: 999px;
  cursor: pointer;
}

.primary-btn {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: #fff;
}

.secondary-btn {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
}

.card-header {
  margin-bottom: 16px;
}

.inline-alert {
  margin-bottom: 16px;
}

.pagination-container {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.pay-info {
  margin-bottom: 18px;
  padding: 16px;
  border-radius: 18px;
  background: rgba(15, 23, 42, 0.5);
}

.pay-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: var(--text-primary);
}

.pay-row + .pay-row {
  margin-top: 10px;
}

.money {
  color: #fbbf24;
}

@media (max-width: 1100px) {
  .billing-hero,
  .filter-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .owner-billing-page {
    padding: 16px;
  }

  .filter-actions {
    flex-direction: column;
  }
}
</style>
