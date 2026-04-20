<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getReservationPage } from '@/api/reservation'
import { getBillingRecordsPage } from '@/api/billing'
import { getActiveEntry } from '@/api/vehicle'
import { useUserStore } from '@/stores/user'
import { getCurrentUserId, getUserRoleLabel } from '@/utils/userRole'
import { getOwnerCars, rememberOwnerCars } from '@/utils/ownerCars'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const reservations = ref([])
const recentBills = ref([])
const activeEntry = ref(null)
const knownCars = ref([])

const ownerSummary = reactive({
  pendingReservations: 0,
  activeReservations: 0,
  unpaidCount: 0,
  unpaidAmount: 0
})

const ownerName = computed(() => userStore.displayName || '车主')
const roleLabel = computed(() => getUserRoleLabel(userStore))
const currentUserId = computed(() => getCurrentUserId(userStore))

const nextReservation = computed(() => {
  const upcoming = reservations.value
    .filter(item => item?.startTime && item?.status === 0)
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))

  return upcoming[0] || null
})

const journeySteps = computed(() => ([
  {
    key: 'reservation',
    title: '预约车位',
    description: '先锁定停车场和车位，减少到场等待时间。',
    buttonText: '去预约',
    route: '/reservation',
    done: ownerSummary.pendingReservations > 0 || ownerSummary.activeReservations > 0
  },
  {
    key: 'guidance',
    title: '查看引导',
    description: '出发前先看附近推荐，进入停车场后可继续导航到目标车位。',
    buttonText: '打开引导',
    route: '/guidance',
    done: false
  },
  {
    key: 'entry',
    title: '车辆入场',
    description: '预约后可直接带着车牌和停车场信息完成入场登记。',
    buttonText: '去入场',
    route: '/vehicle?action=entry',
    done: Boolean(activeEntry.value)
  },
  {
    key: 'exit',
    title: '车辆离场',
    description: '准备离场时在车辆页完成出场，系统会自动生成待支付账单。',
    buttonText: '去离场',
    route: '/vehicle?action=exit',
    done: ownerSummary.unpaidCount > 0
  },
  {
    key: 'billing',
    title: '缴费完成',
    description: '出场后在缴费页按车牌筛选账单，完成支付后安心离场。',
    buttonText: '去缴费',
    route: '/billing',
    done: ownerSummary.unpaidCount === 0 && recentBills.value.some(item => item.paymentStatus === 1)
  }
]))

function formatDateTime(value) {
  if (!value) return '-'
  return new Date(value).toLocaleString('zh-CN')
}

function formatAmount(value) {
  return Number(value || 0).toFixed(2)
}

function getReservationStatusText(status) {
  const statusMap = {
    0: '待使用',
    1: '使用中',
    2: '已完成',
    3: '已取消'
  }
  return statusMap[status] || '未知状态'
}

function openRoute(route) {
  router.push(route)
}

function goToEntry(reservation) {
  router.push({
    path: '/vehicle',
    query: {
      action: 'entry',
      parkingName: reservation.parkingName || '',
      carNo: reservation.carNo || '',
      spaceNumber: reservation.spaceNumber || ''
    }
  })
}

function goToBilling(carNo = '') {
  router.push({
    path: '/billing',
    query: carNo ? { carNo } : {}
  })
}

async function loadOwnerDashboard() {
  if (!currentUserId.value) return

  loading.value = true
  try {
    const reservationRes = await getReservationPage({
      page: 1,
      size: 20,
      userId: currentUserId.value
    })

    const reservationRecords = reservationRes?.code === 200
      ? reservationRes.data?.records || []
      : []

    reservations.value = reservationRecords
    ownerSummary.pendingReservations = reservationRecords.filter(item => item.status === 0).length
    ownerSummary.activeReservations = reservationRecords.filter(item => item.status === 1).length

    knownCars.value = rememberOwnerCars(
      currentUserId.value,
      reservationRecords.map(item => item.carNo)
    )

    if (!knownCars.value.length) {
      knownCars.value = getOwnerCars(currentUserId.value)
    }

    const billResults = await Promise.allSettled(
      knownCars.value.slice(0, 5).map(carNo => getBillingRecordsPage({
        pageNo: 1,
        pageSize: 10,
        carNo
      }))
    )

    const activeEntryResults = await Promise.allSettled(
      knownCars.value.slice(0, 5).map(carNo => getActiveEntry({ carNo }))
    )

    const mergedBills = []
    billResults.forEach((result) => {
      if (result.status !== 'fulfilled' || result.value?.code !== 200) return
      const records = result.value.data?.records || []
      records.forEach((record) => {
        if (!mergedBills.some(item => item.id === record.id)) {
          mergedBills.push(record)
        }
      })
    })

    recentBills.value = mergedBills
      .sort((a, b) => new Date(b.createTime || b.exitTime || 0) - new Date(a.createTime || a.exitTime || 0))
      .slice(0, 6)

    const unpaidBills = mergedBills.filter(item => item.paymentStatus === 0)
    ownerSummary.unpaidCount = unpaidBills.length
    ownerSummary.unpaidAmount = unpaidBills.reduce((sum, item) => sum + Number(item.feeAmount || item.totalAmount || 0), 0)

    activeEntry.value = null
    activeEntryResults.forEach((result) => {
      if (activeEntry.value || result.status !== 'fulfilled' || result.value?.code !== 200) return
      const payload = result.value.data
      if (Array.isArray(payload)) {
        activeEntry.value = payload.find(item => item?.status === 0) || null
        return
      }
      if (payload?.status === 0) {
        activeEntry.value = payload
      }
    })
  } catch (error) {
    console.error('加载车主工作台失败:', error)
    ElMessage.error('车主工作台加载失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadOwnerDashboard()
})
</script>

<template>
  <div class="owner-dashboard-page" v-loading="loading">
    <section class="owner-hero">
      <div class="hero-copy">
        <p class="hero-eyebrow">{{ roleLabel }}工作台</p>
        <h1 class="hero-title">{{ ownerName }}，欢迎回来</h1>
        <p class="hero-subtitle">
          这里把预约、入场、离场、缴费和停车引导串成了一条顺路的流程，你可以按步骤完成，也可以直接跳到当前最需要的动作。
        </p>

        <div class="hero-actions">
          <button class="hero-btn primary" type="button" @click="openRoute('/reservation')">立即预约</button>
          <button class="hero-btn" type="button" @click="openRoute('/guidance')">查看停车引导</button>
          <button class="hero-btn" type="button" @click="openRoute('/vehicle?action=entry')">去入场</button>
        </div>

        <div class="known-cars">
          <span class="known-label">常用车牌</span>
          <div class="known-list">
            <span v-if="knownCars.length === 0" class="known-empty">完成一次预约或入场后，这里会自动记住你的车牌。</span>
            <span v-for="carNo in knownCars" :key="carNo" class="known-tag">{{ carNo }}</span>
          </div>
        </div>
      </div>

      <div class="hero-summary">
        <div class="summary-card">
          <span class="summary-label">待使用预约</span>
          <strong class="summary-value">{{ ownerSummary.pendingReservations }}</strong>
          <span class="summary-desc">建议在预约开始前 15 分钟打开引导页确认路线</span>
        </div>
        <div class="summary-card accent">
          <span class="summary-label">待支付账单</span>
          <strong class="summary-value">{{ ownerSummary.unpaidCount }}</strong>
          <span class="summary-desc">待支付金额 ¥{{ formatAmount(ownerSummary.unpaidAmount) }}</span>
        </div>
        <div class="summary-card success">
          <span class="summary-label">当前在场车辆</span>
          <strong class="summary-value">{{ activeEntry ? activeEntry.carNo : '无' }}</strong>
          <span class="summary-desc">
            {{ activeEntry ? `入场于 ${formatDateTime(activeEntry.entryTime)}` : '没有正在停车中的车辆' }}
          </span>
        </div>
      </div>
    </section>

    <section class="journey-grid">
      <article
        v-for="(step, index) in journeySteps"
        :key="step.key"
        class="journey-card"
        :class="{ done: step.done }"
      >
        <div class="journey-index">0{{ index + 1 }}</div>
        <div class="journey-content">
          <h3 class="journey-title">{{ step.title }}</h3>
          <p class="journey-description">{{ step.description }}</p>
          <button class="journey-btn" type="button" @click="openRoute(step.route)">
            {{ step.buttonText }}
          </button>
        </div>
      </article>
    </section>

    <section class="detail-grid">
      <article class="panel-card">
        <div class="panel-header">
          <div>
            <p class="panel-eyebrow">下一步建议</p>
            <h2 class="panel-title">最适合你现在处理的事项</h2>
          </div>
        </div>

        <div v-if="nextReservation" class="next-reservation-card">
          <div class="next-meta">
            <span class="next-badge">推荐动作</span>
            <h3 class="next-title">{{ nextReservation.parkingName || '预约停车场' }}</h3>
            <p class="next-info">
              {{ nextReservation.carNo }} · {{ nextReservation.spaceNumber || '待系统确认车位' }}
            </p>
            <p class="next-time">{{ formatDateTime(nextReservation.startTime) }} 开始使用</p>
          </div>
          <div class="next-actions">
            <button class="mini-btn primary" type="button" @click="goToEntry(nextReservation)">按预约入场</button>
            <button class="mini-btn" type="button" @click="openRoute('/guidance')">先看引导</button>
          </div>
        </div>

        <div v-else-if="ownerSummary.unpaidCount > 0" class="next-reservation-card">
          <div class="next-meta">
            <span class="next-badge warning">待缴费</span>
            <h3 class="next-title">有账单待支付</h3>
            <p class="next-info">建议先在缴费页按车牌筛选未支付记录，完成支付后再离场。</p>
            <p class="next-time">当前待支付 {{ ownerSummary.unpaidCount }} 笔</p>
          </div>
          <div class="next-actions">
            <button class="mini-btn primary" type="button" @click="goToBilling(knownCars[0] || '')">去缴费</button>
          </div>
        </div>

        <div v-else class="empty-state">
          <p class="empty-title">当前没有待处理事项</p>
          <p class="empty-text">可以先预约新车位，或者直接进入停车引导页查看附近推荐。</p>
        </div>
      </article>

      <article class="panel-card">
        <div class="panel-header">
          <div>
            <p class="panel-eyebrow">近期预约</p>
            <h2 class="panel-title">你的预约记录</h2>
          </div>
          <button class="text-link" type="button" @click="openRoute('/reservation')">查看全部</button>
        </div>

        <div v-if="reservations.length" class="record-list">
          <div v-for="item in reservations.slice(0, 5)" :key="item.id" class="record-item">
            <div class="record-main">
              <strong>{{ item.parkingName || '未命名停车场' }}</strong>
              <span>{{ item.carNo }} · {{ item.spaceNumber || '待分配车位' }}</span>
            </div>
            <div class="record-side">
              <span class="record-status">{{ getReservationStatusText(item.status) }}</span>
              <span class="record-time">{{ formatDateTime(item.startTime) }}</span>
            </div>
          </div>
        </div>
        <div v-else class="empty-state compact">
          <p class="empty-title">还没有预约记录</p>
          <p class="empty-text">点击“立即预约”后，这里会显示你的最近预约。</p>
        </div>
      </article>

      <article class="panel-card billing-panel">
        <div class="panel-header">
          <div>
            <p class="panel-eyebrow">待办账单</p>
            <h2 class="panel-title">最近收费记录</h2>
          </div>
          <button class="text-link" type="button" @click="goToBilling(knownCars[0] || '')">进入缴费页</button>
        </div>

        <div v-if="recentBills.length" class="bill-list">
          <div v-for="bill in recentBills.slice(0, 5)" :key="bill.id" class="bill-item">
            <div>
              <strong>{{ bill.carNo }}</strong>
              <p>{{ bill.parkingName || '停车账单' }}</p>
            </div>
            <div class="bill-side">
              <span class="bill-amount">¥{{ formatAmount(bill.feeAmount || bill.totalAmount) }}</span>
              <button
                v-if="bill.paymentStatus === 0"
                class="mini-btn primary"
                type="button"
                @click="goToBilling(bill.carNo)"
              >
                去支付
              </button>
              <span v-else class="bill-paid">已支付</span>
            </div>
          </div>
        </div>
        <div v-else class="empty-state compact">
          <p class="empty-title">暂无收费记录</p>
          <p class="empty-text">完成一次停车后，最近账单会出现在这里。</p>
        </div>
      </article>
    </section>
  </div>
</template>

<style scoped>
.owner-dashboard-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: var(--space-6);
}

.owner-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(320px, 1fr);
  gap: 20px;
  padding: 28px;
  border-radius: 28px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background:
    radial-gradient(circle at top left, rgba(99, 102, 241, 0.25), transparent 38%),
    radial-gradient(circle at bottom right, rgba(16, 185, 129, 0.18), transparent 36%),
    linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(30, 41, 59, 0.88));
  box-shadow: 0 24px 80px rgba(15, 23, 42, 0.35);
}

.hero-eyebrow,
.panel-eyebrow {
  margin: 0 0 8px;
  color: rgba(148, 163, 184, 0.92);
  font-size: 12px;
  letter-spacing: 0.24em;
  text-transform: uppercase;
}

.hero-title {
  margin: 0 0 12px;
  color: var(--text-primary);
  font-size: clamp(30px, 4vw, 42px);
  line-height: 1.08;
}

.hero-subtitle {
  max-width: 720px;
  margin: 0;
  color: rgba(226, 232, 240, 0.88);
  font-size: 15px;
  line-height: 1.8;
}

.hero-actions,
.next-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 22px;
}

.hero-btn,
.journey-btn,
.mini-btn,
.text-link {
  border: none;
  cursor: pointer;
  transition: transform 0.25s ease, box-shadow 0.25s ease, background-color 0.25s ease;
}

.hero-btn,
.mini-btn {
  padding: 12px 18px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
}

.hero-btn.primary,
.journey-btn,
.mini-btn.primary {
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: #fff;
  box-shadow: 0 16px 36px rgba(79, 70, 229, 0.34);
}

.hero-btn:hover,
.journey-btn:hover,
.mini-btn:hover,
.text-link:hover {
  transform: translateY(-2px);
}

.known-cars {
  margin-top: 24px;
}

.known-label {
  display: block;
  margin-bottom: 10px;
  color: rgba(148, 163, 184, 0.88);
  font-size: 13px;
}

.known-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.known-tag,
.known-empty {
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.55);
  color: rgba(226, 232, 240, 0.9);
  font-size: 13px;
}

.known-empty {
  border: 1px dashed rgba(148, 163, 184, 0.35);
}

.hero-summary {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.summary-card {
  padding: 18px;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(15, 23, 42, 0.72);
  color: var(--text-primary);
}

.summary-card.accent {
  background: rgba(91, 33, 182, 0.18);
}

.summary-card.success {
  background: rgba(6, 95, 70, 0.2);
}

.summary-label {
  display: block;
  margin-bottom: 12px;
  color: rgba(191, 219, 254, 0.84);
  font-size: 13px;
}

.summary-value {
  display: block;
  margin-bottom: 8px;
  font-size: 28px;
  font-weight: 700;
}

.summary-desc {
  color: rgba(226, 232, 240, 0.72);
  font-size: 13px;
  line-height: 1.6;
}

.journey-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 16px;
}

.journey-card,
.panel-card {
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(15, 23, 42, 0.78);
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.22);
}

.journey-card {
  position: relative;
  overflow: hidden;
  padding: 20px;
}

.journey-card.done::after {
  content: '已就绪';
  position: absolute;
  top: 16px;
  right: -30px;
  width: 120px;
  padding: 4px 0;
  transform: rotate(32deg);
  background: rgba(16, 185, 129, 0.88);
  color: #052e16;
  font-size: 11px;
  text-align: center;
}

.journey-index {
  margin-bottom: 16px;
  color: rgba(99, 102, 241, 0.82);
  font-size: 12px;
  letter-spacing: 0.18em;
}

.journey-title,
.panel-title,
.next-title,
.empty-title {
  margin: 0;
  color: var(--text-primary);
}

.journey-description,
.empty-text,
.next-info,
.next-time,
.record-item span,
.bill-item p {
  margin: 10px 0 0;
  color: rgba(226, 232, 240, 0.74);
  font-size: 13px;
  line-height: 1.7;
}

.journey-btn {
  margin-top: 18px;
  padding: 10px 14px;
  border-radius: 999px;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1.3fr 1fr 1fr;
  gap: 18px;
}

.panel-card {
  padding: 22px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
}

.text-link {
  padding: 0;
  background: transparent;
  color: #93c5fd;
  font-size: 13px;
}

.next-reservation-card,
.record-item,
.bill-item {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 16px;
  border-radius: 18px;
  background: rgba(15, 23, 42, 0.55);
}

.next-badge {
  display: inline-flex;
  align-items: center;
  margin-bottom: 10px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(79, 70, 229, 0.24);
  color: #c7d2fe;
  font-size: 12px;
}

.next-badge.warning {
  background: rgba(245, 158, 11, 0.22);
  color: #fde68a;
}

.record-list,
.bill-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.record-main,
.bill-item > div:first-child {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.record-side,
.bill-side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: space-between;
  gap: 8px;
  text-align: right;
}

.record-status {
  color: #c7d2fe;
  font-weight: 600;
}

.bill-amount {
  color: #fbbf24;
  font-size: 18px;
  font-weight: 700;
}

.bill-paid {
  color: #86efac;
  font-size: 13px;
}

.empty-state {
  padding: 18px;
  border-radius: 18px;
  border: 1px dashed rgba(148, 163, 184, 0.22);
  background: rgba(15, 23, 42, 0.42);
}

.empty-state.compact {
  padding: 16px;
}

@media (max-width: 1280px) {
  .journey-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 960px) {
  .owner-hero {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .owner-dashboard-page {
    padding: 16px;
  }

  .journey-grid {
    grid-template-columns: 1fr;
  }

  .hero-actions,
  .next-actions {
    flex-direction: column;
  }

  .hero-btn,
  .journey-btn,
  .mini-btn {
    width: 100%;
  }

  .next-reservation-card,
  .record-item,
  .bill-item {
    flex-direction: column;
  }

  .record-side,
  .bill-side {
    align-items: flex-start;
    text-align: left;
  }
}
</style>
