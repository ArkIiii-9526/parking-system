<template>
  <div class="guidance-page legacy-themed-page">
    <el-card shadow="never" class="page-card">
      <template #header>
        <span class="card-title">停车引导</span>
      </template>
      <el-tabs v-model="activeTab">
        <el-tab-pane label="附近推荐" name="recommend">
          <el-form :inline="true" class="form-row">
            <el-form-item label="经度" required>
              <el-input v-model="recommendForm.longitude" placeholder="如 116.4074" style="width: 160px" />
            </el-form-item>
            <el-form-item label="纬度" required>
              <el-input v-model="recommendForm.latitude" placeholder="如 39.9042" style="width: 160px" />
            </el-form-item>
            <el-form-item>
              <el-button :loading="locating" @click="fillCurrentLocation">使用当前位置</el-button>
            </el-form-item>
            <el-form-item label="半径(km)">
              <el-input-number v-model="recommendForm.radius" :min="0" controls-position="right" />
            </el-form-item>
            <el-form-item label="数量">
              <el-input-number v-model="recommendForm.limit" :min="1" :max="20" controls-position="right" />
            </el-form-item>
            <el-form-item label="必须可预约">
              <el-select v-model="recommendForm.needReservable" clearable placeholder="不限" style="width: 100px">
                <el-option label="是" :value="1" />
                <el-option label="否" :value="0" />
              </el-select>
            </el-form-item>
            <el-form-item label="偏好楼层">
              <el-input-number v-model="recommendForm.preferredFloor" controls-position="right" />
            </el-form-item>
            <el-form-item label="车位类型">
              <el-select v-model="recommendForm.preferredSpaceType" clearable placeholder="不限" style="width: 120px">
                <el-option label="普通" :value="1" />
                <el-option label="VIP" :value="2" />
                <el-option label="无障碍" :value="3" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="recommendLoading" @click="fetchRecommend">查询推荐</el-button>
            </el-form-item>
          </el-form>
          <el-alert
            v-if="locationHint"
            :title="locationHint"
            type="info"
            :closable="false"
            class="inline-alert"
          />
          <el-table v-if="recommendList.length" :data="recommendList" border stripe>
            <el-table-column prop="parkingName" label="停车场" min-width="140" />
            <el-table-column prop="distanceKm" label="距离(km)" width="100" />
            <el-table-column prop="availableSpaces" label="空位" width="80" />
            <el-table-column prop="recommendedSpaceNumber" label="推荐车位" width="110" />
            <el-table-column label="生成时间" min-width="160">
              <template #default="{ row }">{{ formatDateTime(row.generatedAt) }}</template>
            </el-table-column>
            <el-table-column prop="navigationSummary" label="摘要" min-width="220" show-overflow-tooltip />
            <el-table-column label="理由" min-width="240">
              <template #default="{ row }">
                <ul class="reason-list">
                  <li v-for="(r, i) in row.reasons || []" :key="i">{{ r }}</li>
                </ul>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="220" fixed="right">
              <template #default="{ row }">
                <div class="action-group">
                  <el-button link type="primary" @click="useRecommendationForNavigation(row)">去导航</el-button>
                  <el-button link type="success" @click="useRecommendationForPlan(row)">规划路径</el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-else description="填写经纬度后查询推荐结果" />
        </el-tab-pane>

        <el-tab-pane label="场内导航" name="navigation">
          <el-form :inline="true" class="form-row">
            <el-form-item label="停车场" required>
              <el-select
                v-model="navForm.parkingId"
                filterable
                placeholder="选择停车场"
                style="width: 220px"
                @focus="ensureParkings"
                @change="handleNavParkingChange"
              >
                <el-option v-for="p in parkingOptions" :key="p.id" :label="p.name" :value="p.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="目标车位">
              <el-select
                v-model="navForm.spaceId"
                clearable
                filterable
                placeholder="不指定则自动推荐"
                style="width: 220px"
                :loading="navMetaLoading"
              >
                <el-option
                  v-for="space in navMeta.candidateSpaces"
                  :key="space.id"
                  :label="formatSpaceLabel(space)"
                  :value="space.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="偏好楼层">
              <el-input-number v-model="navForm.preferredFloor" controls-position="right" />
            </el-form-item>
            <el-form-item label="自动候补">
              <el-switch v-model="navForm.allowFallback" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="navLoading" @click="fetchNavigation">获取导航</el-button>
            </el-form-item>
          </el-form>
          <el-alert
            v-if="navMeta.candidateSpaces.length"
            title="已加载当前停车场候选车位，可直接下拉选择，减少手动输入。"
            type="success"
            :closable="false"
            class="inline-alert"
          />
          <template v-if="navResult">
            <el-descriptions :column="2" border class="result-block">
              <el-descriptions-item label="停车场">{{ navResult.parkingName }}</el-descriptions-item>
              <el-descriptions-item label="入口">{{ navResult.entryPointName }}</el-descriptions-item>
              <el-descriptions-item label="目标车位">{{ navResult.spaceNumber }}</el-descriptions-item>
              <el-descriptions-item label="距离(米)">{{ navResult.totalDistanceMeters }}</el-descriptions-item>
              <el-descriptions-item label="预计(分钟)">{{ navResult.estimatedMinutes }}</el-descriptions-item>
              <el-descriptions-item label="生成时间">{{ formatDateTime(navResult.generatedAt) }}</el-descriptions-item>
              <el-descriptions-item label="摘要" :span="2">{{ navResult.navigationSummary }}</el-descriptions-item>
              <el-descriptions-item v-if="navResult.fallbackApplied" label="候补说明" :span="2">
                {{ navResult.fallbackReason }}
              </el-descriptions-item>
            </el-descriptions>
            <div v-if="navResult.candidateSpaces?.length" class="candidate-block">
              <span class="candidate-title">候补车位：</span>
              <el-tag
                v-for="space in navResult.candidateSpaces"
                :key="space.id"
                class="candidate-tag"
                @click="selectCandidateSpace(space.id)"
              >
                {{ formatSpaceLabel(space) }}
              </el-tag>
            </div>
            <div class="action-group result-actions">
              <el-button type="success" plain @click="useNavigationResultForPlan">基于当前结果规划路径</el-button>
            </div>
            <el-timeline v-if="navResult.steps?.length" class="steps-timeline">
              <el-timeline-item
                v-for="s in navResult.steps"
                :key="s.stepOrder"
                :timestamp="`步骤 ${s.stepOrder}`"
                placement="top"
              >
                <p class="step-title">{{ s.title }}</p>
                <p class="step-inst">{{ s.instruction }}</p>
                <p v-if="s.distanceMeters != null" class="step-dist">{{ s.distanceMeters }} 米</p>
              </el-timeline-item>
            </el-timeline>
          </template>
          <el-empty v-else description="请选择停车场后获取导航结果" />
        </el-tab-pane>

        <el-tab-pane label="路径规划" name="plan">
          <el-form label-width="100px" class="plan-form">
            <el-form-item label="停车场" required>
              <el-select
                v-model="planForm.parkingId"
                filterable
                placeholder="选择停车场"
                style="width: 100%"
                @focus="ensureParkings"
                @change="handlePlanParkingChange"
              >
                <el-option v-for="p in parkingOptions" :key="p.id" :label="p.name" :value="p.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="入口">
              <el-select
                v-model="planForm.entryId"
                clearable
                filterable
                placeholder="优先选择入口"
                style="width: 100%"
                :loading="planMetaLoading"
              >
                <el-option
                  v-for="entry in planMeta.entries"
                  :key="entry.id"
                  :label="formatEntryLabel(entry)"
                  :value="entry.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="目标车位">
              <el-select
                v-model="planForm.targetSpaceId"
                clearable
                filterable
                placeholder="选择要规划的车位"
                style="width: 100%"
                :loading="planMetaLoading"
              >
                <el-option
                  v-for="space in planMeta.candidateSpaces"
                  :key="space.id"
                  :label="formatSpaceLabel(space)"
                  :value="space.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="偏好楼层">
              <el-input-number v-model="planForm.preferredFloor" controls-position="right" />
            </el-form-item>
            <el-collapse class="advanced-block">
              <el-collapse-item title="高级参数（调试可选）" name="advanced">
                <el-form-item label="起始节点ID">
                  <el-input-number v-model="planForm.startNodeId" :min="1" controls-position="right" />
                </el-form-item>
                <el-form-item label="终点节点ID">
                  <el-input-number v-model="planForm.endNodeId" :min="1" controls-position="right" />
                </el-form-item>
              </el-collapse-item>
            </el-collapse>
            <el-form-item>
              <el-button type="primary" :loading="planLoading" @click="fetchPlan">规划路径</el-button>
            </el-form-item>
          </el-form>
          <template v-if="planResult">
            <el-descriptions :column="2" border class="result-block">
              <el-descriptions-item label="停车场">{{ planResult.parkingName }}</el-descriptions-item>
              <el-descriptions-item label="入口">{{ planResult.entryName }}</el-descriptions-item>
              <el-descriptions-item label="目标车位">{{ planResult.targetSpaceNumber }}</el-descriptions-item>
              <el-descriptions-item label="总距离(米)">{{ planResult.totalDistanceMeters }}</el-descriptions-item>
              <el-descriptions-item label="预计(分钟)">{{ planResult.estimatedMinutes }}</el-descriptions-item>
              <el-descriptions-item label="节点数">{{ planResult.pathNodeCount }}</el-descriptions-item>
              <el-descriptions-item label="路径摘要" :span="2">{{ planResult.routeSummary }}</el-descriptions-item>
            </el-descriptions>
            <el-timeline v-if="planResult.steps?.length" class="steps-timeline">
              <el-timeline-item v-for="(s, idx) in planResult.steps" :key="idx" placement="top">
                <template v-if="typeof s === 'object'">
                  <p class="step-title">{{ s.title || s.stepOrder }}</p>
                  <p class="step-inst">{{ s.instruction || JSON.stringify(s) }}</p>
                  <p v-if="s.distanceMeters != null" class="step-dist">{{ s.distanceMeters }} 米</p>
                </template>
                <template v-else>{{ s }}</template>
              </el-timeline-item>
            </el-timeline>
          </template>
          <el-empty v-else description="请选择停车场、入口和目标车位后规划路径" />
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { getGuidanceMeta, getParkingNavigation, getRecommendParking, planGuidanceRoute } from '@/api/guidance'
import { getParkingPage } from '@/api/parking'

const activeTab = ref('recommend')
const locating = ref(false)
const locationHint = ref('')

const recommendForm = reactive({
  longitude: '',
  latitude: '',
  radius: undefined,
  limit: 5,
  needReservable: undefined,
  preferredFloor: undefined,
  preferredSpaceType: undefined
})
const recommendLoading = ref(false)
const recommendList = ref([])

const parkingOptions = ref([])
async function ensureParkings() {
  if (parkingOptions.value.length) return
  try {
    const res = await getParkingPage({ pageNo: 1, pageSize: 500 })
    if (res.code === 200) {
      parkingOptions.value = res.data?.records || []
    }
  } catch (e) {
    console.error(e)
  }
}

async function fillCurrentLocation() {
  if (!navigator.geolocation) {
    ElMessage.warning('当前浏览器不支持定位，请手动输入经纬度')
    return
  }
  locating.value = true
  locationHint.value = ''
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      recommendForm.longitude = Number(coords.longitude).toFixed(6)
      recommendForm.latitude = Number(coords.latitude).toFixed(6)
      locationHint.value = `已获取当前位置：经度 ${recommendForm.longitude}，纬度 ${recommendForm.latitude}`
      locating.value = false
    },
    (error) => {
      locating.value = false
      const message = error?.message || '定位失败'
      ElMessage.warning(`定位失败：${message}`)
    },
    { enableHighAccuracy: true, timeout: 10000 }
  )
}

async function fetchRecommend() {
  if (!recommendForm.longitude || !recommendForm.latitude) {
    ElMessage.warning('请填写经度、纬度')
    return
  }
  recommendLoading.value = true
  try {
    const params = {
      longitude: recommendForm.longitude,
      latitude: recommendForm.latitude,
      radius: recommendForm.radius,
      limit: recommendForm.limit,
      needReservable: recommendForm.needReservable,
      preferredFloor: recommendForm.preferredFloor,
      preferredSpaceType: recommendForm.preferredSpaceType
    }
    const res = await getRecommendParking(params)
    if (res.code === 200) {
      recommendList.value = Array.isArray(res.data) ? res.data : []
      if (!recommendList.value.length) ElMessage.info('暂无推荐结果')
    }
  } catch (e) {
    console.error(e)
  } finally {
    recommendLoading.value = false
  }
}

const navMeta = reactive({ entries: [], candidateSpaces: [], sections: [] })
const navMetaLoading = ref(false)
const navForm = reactive({
  parkingId: undefined,
  spaceId: undefined,
  preferredFloor: undefined,
  allowFallback: true
})
const navLoading = ref(false)
const navResult = ref(null)

const planMeta = reactive({ entries: [], candidateSpaces: [], sections: [] })
const planMetaLoading = ref(false)
const planForm = reactive({
  parkingId: undefined,
  entryId: undefined,
  startNodeId: undefined,
  targetSpaceId: undefined,
  endNodeId: undefined,
  preferredFloor: undefined
})
const planLoading = ref(false)
const planResult = ref(null)

async function loadGuidanceMeta(parkingId, preferredFloor, target) {
  if (!parkingId) return
  const loadingRef = target === 'nav' ? navMetaLoading : planMetaLoading
  const metaState = target === 'nav' ? navMeta : planMeta
  loadingRef.value = true
  try {
    const res = await getGuidanceMeta({ parkingId, preferredFloor })
    if (res.code === 200 && res.data) {
      metaState.entries = res.data.entries || []
      metaState.candidateSpaces = res.data.candidateSpaces || []
      metaState.sections = res.data.sections || []
    }
  } catch (e) {
    console.error(e)
  } finally {
    loadingRef.value = false
  }
}

async function handleNavParkingChange() {
  navForm.spaceId = undefined
  navResult.value = null
  await loadGuidanceMeta(navForm.parkingId, navForm.preferredFloor, 'nav')
}

async function handlePlanParkingChange() {
  planForm.entryId = undefined
  planForm.targetSpaceId = undefined
  planResult.value = null
  await loadGuidanceMeta(planForm.parkingId, planForm.preferredFloor, 'plan')
}

watch(
  () => navForm.preferredFloor,
  () => {
    if (navForm.parkingId) loadGuidanceMeta(navForm.parkingId, navForm.preferredFloor, 'nav')
  }
)

watch(
  () => planForm.preferredFloor,
  () => {
    if (planForm.parkingId) loadGuidanceMeta(planForm.parkingId, planForm.preferredFloor, 'plan')
  }
)

async function fetchNavigation() {
  if (!navForm.parkingId) {
    ElMessage.warning('请选择停车场')
    return
  }
  navLoading.value = true
  navResult.value = null
  try {
    const params = {
      parkingId: navForm.parkingId,
      allowFallback: navForm.allowFallback
    }
    if (navForm.spaceId) params.spaceId = navForm.spaceId
    if (navForm.preferredFloor != null) params.preferredFloor = navForm.preferredFloor
    const res = await getParkingNavigation(params)
    if (res.code === 200) {
      navResult.value = res.data
      if (res.data?.fallbackApplied) {
        ElMessage.warning(res.data.fallbackReason || '已自动切换到候补车位')
      }
    }
  } catch (e) {
    console.error(e)
  } finally {
    navLoading.value = false
  }
}

async function fetchPlan() {
  if (!planForm.parkingId) {
    ElMessage.warning('请选择停车场')
    return
  }
  if (!planForm.entryId && !planForm.startNodeId) {
    ElMessage.warning('请至少选择入口或填写起始节点ID')
    return
  }
  if (!planForm.targetSpaceId && !planForm.endNodeId) {
    ElMessage.warning('请至少选择目标车位或填写终点节点ID')
    return
  }
  planLoading.value = true
  planResult.value = null
  try {
    const body = { parkingId: planForm.parkingId }
    if (planForm.entryId) body.entryId = planForm.entryId
    if (planForm.startNodeId) body.startNodeId = planForm.startNodeId
    if (planForm.targetSpaceId) body.targetSpaceId = planForm.targetSpaceId
    if (planForm.endNodeId) body.endNodeId = planForm.endNodeId
    if (planForm.preferredFloor != null) body.preferredFloor = planForm.preferredFloor
    const res = await planGuidanceRoute(body)
    if (res.code === 200) {
      planResult.value = res.data
    }
  } catch (e) {
    console.error(e)
  } finally {
    planLoading.value = false
  }
}

async function useRecommendationForNavigation(row) {
  await ensureParkings()
  activeTab.value = 'navigation'
  navForm.parkingId = row.parkingId
  navForm.spaceId = row.recommendedSpaceId
  navForm.preferredFloor = row.recommendedFloor
  await loadGuidanceMeta(navForm.parkingId, navForm.preferredFloor, 'nav')
  fetchNavigation()
}

async function useRecommendationForPlan(row) {
  await ensureParkings()
  activeTab.value = 'plan'
  planForm.parkingId = row.parkingId
  planForm.targetSpaceId = row.recommendedSpaceId
  planForm.preferredFloor = row.recommendedFloor
  planForm.startNodeId = undefined
  planForm.endNodeId = undefined
  await loadGuidanceMeta(planForm.parkingId, planForm.preferredFloor, 'plan')
  if (!planForm.entryId && planMeta.entries.length) {
    planForm.entryId = planMeta.entries[0].id
  }
}

async function useNavigationResultForPlan() {
  if (!navResult.value?.parkingId || !navResult.value?.spaceId) {
    return
  }
  await ensureParkings()
  activeTab.value = 'plan'
  planForm.parkingId = navResult.value.parkingId
  planForm.targetSpaceId = navResult.value.spaceId
  planForm.preferredFloor = navResult.value.floor
  await loadGuidanceMeta(planForm.parkingId, planForm.preferredFloor, 'plan')
  if (!planForm.entryId && planMeta.entries.length) {
    planForm.entryId = planMeta.entries[0].id
  }
}

function selectCandidateSpace(spaceId) {
  navForm.spaceId = spaceId
  ElMessage.success('已切换候补车位，可重新获取导航')
}

function formatSpaceLabel(space) {
  const floor = space.floor != null ? formatFloor(space.floor) : '未知楼层'
  const section = space.sectionArea || '未分区'
  return `${space.spaceNumber}｜${floor}｜${section}`
}

function formatEntryLabel(entry) {
  const floor = entry.floor != null ? `（${formatFloor(entry.floor)}）` : ''
  return `${entry.entryName}${floor}`
}

function formatFloor(floor) {
  if (floor == null) return '未知楼层'
  if (floor > 0) return `${floor}层`
  if (floor === 0) return '地面层'
  return `B${Math.abs(floor)}层`
}

function formatDateTime(value) {
  if (!value) return '-'
  return String(value).replace('T', ' ')
}
</script>

<style scoped>
.guidance-page {
  padding: var(--space-6);
}
.page-card {
  border-radius: var(--radius-xl);
}
.card-title {
  font-weight: 600;
}
.form-row {
  flex-wrap: wrap;
}
.inline-alert {
  margin: 0 0 16px;
}
.reason-list {
  margin: 0;
  padding-left: 18px;
  font-size: 12px;
}
.result-block {
  margin-top: 16px;
}
.steps-timeline {
  margin-top: 20px;
  max-width: 760px;
}
.step-title {
  font-weight: 600;
  margin: 0 0 4px;
}
.step-inst {
  margin: 0;
  color: var(--text-secondary);
  font-size: 13px;
}
.step-dist {
  margin: 4px 0 0;
  font-size: 12px;
}
.plan-form {
  max-width: 520px;
}
.action-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.result-actions {
  margin-top: 12px;
}
.candidate-block {
  margin-top: 12px;
}
.candidate-title {
  margin-right: 8px;
  font-size: 13px;
  color: var(--text-secondary);
}
.candidate-tag {
  margin: 0 8px 8px 0;
  cursor: pointer;
}
.advanced-block {
  margin-bottom: 18px;
}
</style>
