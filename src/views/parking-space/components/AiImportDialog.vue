<script setup>
import { computed, onUnmounted, reactive, shallowRef, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  createParkingSpaceAiImportTask,
  getLatestParkingSpaceAiImportTask,
  getParkingSpaceAiImportTask
} from '@/api/parkingSpace'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  parkingList: {
    type: Array,
    default: () => []
  },
  initialParkingId: {
    type: [String, Number],
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'success', 'submitted'])

const MAX_FILE_SIZE = 20 * 1024 * 1024
const MAX_TOTAL_SIZE = 50 * 1024 * 1024
const submitting = shallowRef(false)
const fileInputKey = shallowRef(0)
const currentTask = shallowRef(null)
const latestNotifiedTaskId = shallowRef('')
const taskFetchedAt = shallowRef(null)
const form = reactive({
  parkingId: null,
  files: []
})
let pollTimer = null

const selectedParkingName = computed(() => {
  return props.parkingList.find(item => item.id === form.parkingId)?.name || ''
})

watch(
  () => props.modelValue,
  async (visible) => {
    if (visible) {
      form.parkingId = props.initialParkingId ?? form.parkingId
      await loadLatestTask()
      return
    }
    resetForm()
    if (!shouldPoll(currentTask.value)) {
      stopPolling()
    }
  }
)

watch(
  () => props.initialParkingId,
  async (parkingId) => {
    if (props.modelValue && parkingId != null) {
      form.parkingId = parkingId
      await loadLatestTask(parkingId)
    }
  }
)

watch(
  () => form.parkingId,
  async (parkingId) => {
    if (!props.modelValue || parkingId == null) {
      currentTask.value = null
      stopPolling()
      return
    }
    await loadLatestTask(parkingId)
  }
)

onUnmounted(() => {
  stopPolling()
})

function resetForm() {
  form.files = []
  fileInputKey.value += 1
}

function closeDialog() {
  emit('update:modelValue', false)
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

function shouldPoll(task) {
  return Boolean(task && ['QUEUED', 'RUNNING'].includes(task.status))
}

function shouldShowTaskProgress(task) {
  return Boolean(task && ['QUEUED', 'RUNNING'].includes(task.status))
}

function hasTask(task) {
  return Boolean(task && task.taskId)
}

function startPolling(taskId) {
  stopPolling()
  pollTimer = setInterval(() => {
    fetchTask(taskId)
  }, 3000)
}

function getTaskStatusText(status) {
  const map = {
    QUEUED: '排队中',
    RUNNING: '解析中',
    SUCCEEDED: '已完成',
    FAILED: '失败'
  }
  return map[status] || '未知'
}

function getTaskStatusClass(status) {
  const map = {
    QUEUED: 'queued',
    RUNNING: 'running',
    SUCCEEDED: 'succeeded',
    FAILED: 'failed'
  }
  return map[status] || ''
}

function getTaskStageText(stage) {
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

function getTaskFailureSummary(task) {
  if (!task?.failureCategory) return ''
  return task.failureCode ? `${task.failureCategory}（${task.failureCode}）` : task.failureCategory
}

async function loadLatestTask(parkingId = form.parkingId) {
  if (!parkingId) {
    currentTask.value = null
    taskFetchedAt.value = null
    stopPolling()
    return
  }
  try {
    const res = await getLatestParkingSpaceAiImportTask(parkingId)
    if (res.code === 200) {
      currentTask.value = hasTask(res.data) ? res.data : null
      taskFetchedAt.value = new Date().toISOString()
      if (shouldPoll(currentTask.value)) {
        startPolling(currentTask.value.taskId)
      } else {
        stopPolling()
      }
    }
  } catch (_error) {
    currentTask.value = null
    stopPolling()
  }
}

async function fetchTask(taskId = currentTask.value?.taskId) {
  if (!taskId) return
  try {
    const res = await getParkingSpaceAiImportTask(taskId)
    if (res.code !== 200) return
    currentTask.value = hasTask(res.data) ? res.data : null
    taskFetchedAt.value = new Date().toISOString()
    if (shouldPoll(currentTask.value)) {
      return
    }
    stopPolling()
    if (currentTask.value?.status === 'SUCCEEDED' && latestNotifiedTaskId.value !== taskId) {
      latestNotifiedTaskId.value = taskId
      emit('success', currentTask.value.result)
      ElMessage.success(`AI 导入完成：${currentTask.value.result?.importedSpaces || 0} 个车位`)
    }
  } catch (_error) {
    stopPolling()
  }
}

function handleFileChange(event) {
  const nextFiles = Array.from(event.target.files || [])
  const oversizedFile = nextFiles.find(file => file.size > MAX_FILE_SIZE)
  const totalSize = nextFiles.reduce((sum, file) => sum + file.size, 0)

  if (oversizedFile) {
    ElMessage.warning(`文件“${oversizedFile.name}”超过 20MB，请压缩后重试`)
    resetForm()
    return
  }
  if (totalSize > MAX_TOTAL_SIZE) {
    ElMessage.warning('所选文件总大小超过 50MB，请减少图片数量或压缩图片')
    resetForm()
    return
  }
  form.files = nextFiles
}

async function submitImport() {
  if (!form.parkingId) {
    ElMessage.warning('请先选择停车场')
    return
  }
  if (form.files.length === 0) {
    ElMessage.warning('请至少上传一张停车场平面图')
    return
  }

  const payload = new FormData()
  form.files.forEach(file => {
    payload.append('files', file)
  })

  submitting.value = true
  try {
    const res = await createParkingSpaceAiImportTask(form.parkingId, payload)
    if (res.code === 200) {
      currentTask.value = res.data
      latestNotifiedTaskId.value = ''
      emit('submitted', res.data)
      closeDialog()
      startPolling(res.data.taskId)
      ElMessage.success('导入任务已提交，系统将在后台继续解析')
      return
    }
    ElMessage.error(res.msg || '创建导入任务失败')
  } catch (error) {
    console.error('创建 AI 导入任务失败:', error)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    title="AI 导入停车位"
    width="560px"
    :close-on-click-modal="false"
    class="glass-dialog"
    @close="closeDialog"
  >
    <div class="ai-import-dialog">
      <div class="ai-import-intro">
        <h3 class="ai-import-title">上传停车场平面图，后台异步生成车位</h3>
        <p class="ai-import-desc">
          当前版本仅支持图片格式平面图。提交后系统会在后台异步识别楼层、分区，并按“层-区-序”生成车位编号。
        </p>
        <p class="ai-import-desc">上传限制：单张不超过 20MB，总大小不超过 50MB。</p>
      </div>

      <div class="ai-import-field">
        <label class="ai-import-label">停车场</label>
        <el-select v-model="form.parkingId" placeholder="选择停车场" style="width: 100%">
          <el-option v-for="item in parkingList" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
      </div>

      <div class="ai-import-field">
        <label class="ai-import-label">平面图图片</label>
        <label class="upload-dropzone">
          <input
            :key="fileInputKey"
            class="upload-input"
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            multiple
            @change="handleFileChange"
          >
          <span class="upload-title">点击选择图片</span>
          <span class="upload-subtitle">支持多张图片，多层停车场建议一层一张</span>
        </label>
      </div>

      <div v-if="selectedParkingName || form.files.length > 0" class="ai-import-summary">
        <div class="summary-item" v-if="selectedParkingName">
          <span class="summary-label">目标停车场</span>
          <span class="summary-value">{{ selectedParkingName }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">已选文件</span>
          <span class="summary-value">{{ form.files.length }} 张</span>
        </div>
      </div>

      <ul v-if="form.files.length > 0" class="file-list">
        <li v-for="file in form.files" :key="file.name + file.size" class="file-item">
          <span class="file-name">{{ file.name }}</span>
          <span class="file-size">{{ Math.max(1, Math.round(file.size / 1024)) }} KB</span>
        </li>
      </ul>

      <div v-if="hasTask(currentTask)" class="task-card" :class="getTaskStatusClass(currentTask.status)">
        <div class="task-header">
          <span class="task-title">最近一次导入任务</span>
          <span class="task-status">{{ getTaskStatusText(currentTask.status) }}</span>
        </div>
        <div class="task-stage">
          <span>{{ getTaskStageText(currentTask.stage) }}</span>
          <span>{{ currentTask.progressPercent || 0 }}%</span>
        </div>
        <div v-if="shouldShowTaskProgress(currentTask)" class="task-progress-track">
          <div class="task-progress-bar" :style="{ width: `${currentTask.progressPercent || 0}%` }"></div>
        </div>
        <p class="task-message">{{ currentTask.message || '任务处理中' }}</p>
        <div class="task-meta">
          <span>任务ID：{{ currentTask.taskId }}</span>
          <span v-if="currentTask.updatedTime">状态更新时间：{{ new Date(currentTask.updatedTime).toLocaleTimeString() }}</span>
          <span v-if="taskFetchedAt">刷新时间：{{ new Date(taskFetchedAt).toLocaleTimeString() }}</span>
          <span v-if="currentTask.result?.importedSpaces != null">车位：{{ currentTask.result.importedSpaces }}</span>
          <span v-if="currentTask.result?.importedFloors != null">楼层：{{ currentTask.result.importedFloors }}</span>
        </div>
        <div v-if="currentTask.status === 'FAILED' && currentTask.failureCategory" class="task-failure">
          <div class="task-failure-title">{{ getTaskFailureSummary(currentTask) }}</div>
          <div v-if="currentTask.failureSuggestion" class="task-failure-tip">{{ currentTask.failureSuggestion }}</div>
        </div>
        <ul v-if="currentTask.warnings?.length" class="task-warnings">
          <li v-for="warning in currentTask.warnings" :key="warning">{{ warning }}</li>
        </ul>
      </div>

      <div v-else-if="form.parkingId" class="task-card empty">
        <div class="task-header">
          <span class="task-title">最近一次导入任务</span>
          <span class="task-status">无任务</span>
        </div>
        <p class="task-message">当前停车场还没有 AI 解析任务，上传平面图后会在后台异步创建并执行。</p>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <button class="dialog-btn" @click="closeDialog">取消</button>
        <button class="dialog-btn primary" :disabled="submitting" @click="submitImport">
          <span v-if="!submitting">提交导入任务</span>
          <span v-else class="loading-text">
            <span class="loading-spinner"></span>
            正在提交...
          </span>
        </button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.ai-import-dialog {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.ai-import-intro {
  padding: 16px 18px;
  background: rgba(99, 102, 241, 0.08);
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 16px;
}

.ai-import-title {
  margin: 0 0 6px;
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

.ai-import-desc {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--text-secondary);
}

.ai-import-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ai-import-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
}

.upload-dropzone {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 24px 18px;
  border: 1px dashed rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.04);
  cursor: pointer;
  transition: all 0.2s ease;
}

.upload-dropzone:hover {
  border-color: rgba(99, 102, 241, 0.45);
  background: rgba(99, 102, 241, 0.08);
}

.upload-input {
  display: none;
}

.upload-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.upload-subtitle {
  font-size: 12px;
  color: var(--text-tertiary);
}

.ai-import-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.summary-item {
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.summary-label {
  display: block;
  margin-bottom: 4px;
  font-size: 12px;
  color: var(--text-tertiary);
}

.summary-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.file-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.file-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.file-name {
  font-size: 13px;
  color: var(--text-primary);
  word-break: break-all;
}

.file-size {
  margin-left: 12px;
  font-size: 12px;
  color: var(--text-tertiary);
  white-space: nowrap;
}

.task-card {
  padding: 14px 16px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
}

.task-card.queued {
  border-color: rgba(245, 158, 11, 0.25);
}

.task-card.running {
  border-color: rgba(59, 130, 246, 0.25);
}

.task-card.succeeded {
  border-color: rgba(16, 185, 129, 0.25);
}

.task-card.failed {
  border-color: rgba(239, 68, 68, 0.25);
}

.task-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.task-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
}

.task-status {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-secondary);
}

.task-message {
  margin: 0 0 8px;
  font-size: 13px;
  color: var(--text-secondary);
}

.task-stage {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
  font-size: 12px;
  color: var(--text-tertiary);
}

.task-progress-track {
  height: 8px;
  margin-bottom: 10px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 999px;
  overflow: hidden;
}

.task-progress-bar {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--primary-500), var(--secondary-500));
}

.task-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  font-size: 12px;
  color: var(--text-tertiary);
}

.task-warnings {
  margin: 10px 0 0;
  padding-left: 18px;
  color: var(--warning-400);
  font-size: 12px;
  line-height: 1.6;
}

.task-failure {
  margin-top: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.task-failure-title {
  font-size: 12px;
  font-weight: 700;
  color: #fca5a5;
}

.task-failure-tip {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--text-secondary);
}
</style>
