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
              <el-input v-model="recommendForm.longitude" placeholder="如 116.4074" style="width: 140px" />
            </el-form-item>
            <el-form-item label="纬度" required>
              <el-input v-model="recommendForm.latitude" placeholder="如 39.9042" style="width: 140px" />
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
          <el-table v-if="recommendList.length" :data="recommendList" border stripe>
            <el-table-column prop="parkingName" label="停车场" min-width="140" />
            <el-table-column prop="distanceKm" label="距离(km)" width="100" />
            <el-table-column prop="availableSpaces" label="空位" width="80" />
            <el-table-column prop="recommendedSpaceNumber" label="推荐车位" width="100" />
            <el-table-column prop="navigationSummary" label="摘要" min-width="200" show-overflow-tooltip />
            <el-table-column label="理由" min-width="220">
              <template #default="{ row }">
                <ul class="reason-list">
                  <li v-for="(r, i) in (row.reasons || [])" :key="i">{{ r }}</li>
                </ul>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-else description="填写经纬度后查询" />
        </el-tab-pane>

        <el-tab-pane label="场内导航" name="navigation">
          <el-form :inline="true">
            <el-form-item label="停车场" required>
              <el-select v-model="navForm.parkingId" filterable placeholder="选择停车场" style="width: 220px" @focus="ensureParkings">
                <el-option v-for="p in parkingOptions" :key="p.id" :label="p.name" :value="p.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="目标车位ID">
              <el-input-number v-model="navForm.spaceId" :min="1" controls-position="right" />
            </el-form-item>
            <el-form-item label="偏好楼层">
              <el-input-number v-model="navForm.preferredFloor" controls-position="right" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="navLoading" @click="fetchNavigation">获取导航</el-button>
            </el-form-item>
          </el-form>
          <template v-if="navResult">
            <el-descriptions :column="2" border class="result-block">
              <el-descriptions-item label="停车场">{{ navResult.parkingName }}</el-descriptions-item>
              <el-descriptions-item label="入口">{{ navResult.entryPointName }}</el-descriptions-item>
              <el-descriptions-item label="目标车位">{{ navResult.spaceNumber }}</el-descriptions-item>
              <el-descriptions-item label="距离(米)">{{ navResult.totalDistanceMeters }}</el-descriptions-item>
              <el-descriptions-item label="预计(分钟)">{{ navResult.estimatedMinutes }}</el-descriptions-item>
              <el-descriptions-item label="摘要" :span="2">{{ navResult.navigationSummary }}</el-descriptions-item>
            </el-descriptions>
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
        </el-tab-pane>

        <el-tab-pane label="路径规划" name="plan">
          <el-form label-width="120px" class="plan-form">
            <el-form-item label="停车场ID" required>
              <el-input-number v-model="planForm.parkingId" :min="1" controls-position="right" />
            </el-form-item>
            <el-form-item label="入口ID">
              <el-input-number v-model="planForm.entryId" :min="1" controls-position="right" />
            </el-form-item>
            <el-form-item label="起始节点ID">
              <el-input-number v-model="planForm.startNodeId" :min="1" controls-position="right" />
            </el-form-item>
            <el-form-item label="目标车位ID">
              <el-input-number v-model="planForm.targetSpaceId" :min="1" controls-position="right" />
            </el-form-item>
            <el-form-item label="终点节点ID">
              <el-input-number v-model="planForm.endNodeId" :min="1" controls-position="right" />
            </el-form-item>
            <el-form-item label="偏好楼层">
              <el-input-number v-model="planForm.preferredFloor" controls-position="right" />
            </el-form-item>
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
              <el-timeline-item
                v-for="(s, idx) in planResult.steps"
                :key="idx"
                placement="top"
              >
                <template v-if="typeof s === 'object'">
                  <p class="step-title">{{ s.title || s.stepOrder }}</p>
                  <p class="step-inst">{{ s.instruction || JSON.stringify(s) }}</p>
                </template>
                <template v-else>{{ s }}</template>
              </el-timeline-item>
            </el-timeline>
          </template>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { getRecommendParking, getParkingNavigation, planGuidanceRoute } from '@/api/guidance'
import { getParkingPage } from '@/api/parking'

const activeTab = ref('recommend')

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

const navForm = reactive({
  parkingId: undefined,
  spaceId: undefined,
  preferredFloor: undefined
})
const navLoading = ref(false)
const navResult = ref(null)

async function fetchNavigation() {
  if (!navForm.parkingId) {
    ElMessage.warning('请选择停车场')
    return
  }
  navLoading.value = true
  navResult.value = null
  try {
    const params = { parkingId: navForm.parkingId }
    if (navForm.spaceId) params.spaceId = navForm.spaceId
    if (navForm.preferredFloor != null) params.preferredFloor = navForm.preferredFloor
    const res = await getParkingNavigation(params)
    if (res.code === 200) {
      navResult.value = res.data
    }
  } catch (e) {
    console.error(e)
  } finally {
    navLoading.value = false
  }
}

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

async function fetchPlan() {
  if (!planForm.parkingId) {
    ElMessage.warning('请填写停车场ID')
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
  max-width: 720px;
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
  max-width: 480px;
}
</style>
