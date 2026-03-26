<template>
  <div class="cache-page legacy-themed-page">
    <el-card shadow="never" class="page-card">
      <template #header>
        <div class="card-head">
          <span>缓存监控</span>
          <el-button v-permission="'sys:cache:metrics'" type="primary" link :loading="loading" @click="loadMetrics">刷新指标</el-button>
        </div>
      </template>
      <el-row v-if="metrics" :gutter="16" class="metric-row">
        <el-col :xs="12" :sm="8" :md="6">
          <div class="metric-item">
            <div class="metric-label">命中次数</div>
            <div class="metric-value">{{ metrics.hitCount ?? '-' }}</div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="8" :md="6">
          <div class="metric-item">
            <div class="metric-label">未命中</div>
            <div class="metric-value">{{ metrics.missCount ?? '-' }}</div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="8" :md="6">
          <div class="metric-item">
            <div class="metric-label">命中率</div>
            <div class="metric-value">{{ formatRate(metrics.hitRate) }}</div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="8" :md="6">
          <div class="metric-item">
            <div class="metric-label">总请求</div>
            <div class="metric-value">{{ metrics.totalRequests ?? '-' }}</div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="8" :md="6">
          <div class="metric-item">
            <div class="metric-label">缓存大小</div>
            <div class="metric-value">{{ metrics.cacheSize ?? '-' }}</div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="8" :md="6">
          <div class="metric-item">
            <div class="metric-label">驱逐次数</div>
            <div class="metric-value">{{ metrics.evictionCount ?? '-' }}</div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="8" :md="6">
          <div class="metric-item">
            <div class="metric-label">平均加载(ms)</div>
            <div class="metric-value">{{ metrics.averageLoadPenalty ?? '-' }}</div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="8" :md="6">
          <div class="metric-item">
            <div class="metric-label">加载成功/异常</div>
            <div class="metric-value">{{ metrics.loadSuccessCount ?? 0 }} / {{ metrics.loadExceptionCount ?? 0 }}</div>
          </div>
        </el-col>
      </el-row>
      <el-empty v-else description="暂无指标，点击刷新加载" />
    </el-card>

    <el-card shadow="never" class="page-card">
      <template #header>
        <span>缓存操作</span>
      </template>
      <el-space direction="vertical" alignment="start" :size="16" style="width: 100%">
        <div>
          <el-button v-permission="'sys:cache:reset'" type="warning" @click="handleReset">重置监控指标</el-button>
        </div>
        <div class="pattern-row">
          <el-input v-model="pattern" placeholder="缓存键模式（支持通配符）" style="width: 320px" clearable />
          <el-button v-permission="'sys:cache:clear'" type="primary" :disabled="!pattern" @click="handleClearPattern">按模式清除</el-button>
        </div>
        <div>
          <el-button v-permission="'sys:cache:clearAll'" type="danger" @click="handleClearAll">清除全部缓存</el-button>
        </div>
      </el-space>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getCacheMetrics, resetCacheMetrics, clearCacheByPattern, clearAllCache } from '@/api/cache'

const loading = ref(false)
const metrics = ref(null)
const pattern = ref('')

function formatRate(r) {
  if (r == null || Number.isNaN(r)) return '-'
  return `${(Number(r) * 100).toFixed(2)}%`
}

async function loadMetrics() {
  loading.value = true
  try {
    const res = await getCacheMetrics()
    if (res.code === 200) {
      metrics.value = res.data || null
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function handleReset() {
  try {
    const res = await resetCacheMetrics()
    if (res.code === 200) {
      ElMessage.success(res.msg || '已重置')
      loadMetrics()
    }
  } catch (e) {
    console.error(e)
  }
}

async function handleClearPattern() {
  if (!pattern.value) return
  await ElMessageBox.confirm(`确定按模式清除缓存：${pattern.value}？`, '确认', { type: 'warning' })
  try {
    const res = await clearCacheByPattern(pattern.value)
    if (res.code === 200) {
      ElMessage.success(res.msg || '已清除')
    }
  } catch (e) {
    if (e !== 'cancel') console.error(e)
  }
}

async function handleClearAll() {
  await ElMessageBox.confirm('确定清除所有缓存？', '危险操作', { type: 'warning' })
  try {
    const res = await clearAllCache()
    if (res.code === 200) {
      ElMessage.success(res.msg || '已清除全部')
      loadMetrics()
    }
  } catch (e) {
    if (e !== 'cancel') console.error(e)
  }
}

onMounted(() => {
  loadMetrics()
})
</script>

<style scoped>
.cache-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.metric-row {
  margin-top: 8px;
}
.metric-item {
  padding: 12px;
  background: var(--el-fill-color-light);
  border-radius: 8px;
  margin-bottom: 12px;
}
.metric-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.metric-value {
  font-size: 20px;
  font-weight: 600;
  margin-top: 4px;
}
.pattern-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}
</style>
