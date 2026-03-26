<template>
  <div class="audit-log-page legacy-themed-page">
    <el-card shadow="never" class="filter-card">
      <el-form :inline="true">
        <el-form-item label="用户名">
          <el-input v-model="filterForm.username" clearable placeholder="操作用户" style="width: 140px" />
        </el-form-item>
        <el-form-item label="业务类型">
          <el-input v-model="filterForm.businessType" clearable style="width: 140px" />
        </el-form-item>
        <el-form-item label="时间">
          <el-date-picker
            v-model="timeRange"
            type="datetimerange"
            range-separator="至"
            value-format="YYYY-MM-DD HH:mm:ss"
            start-placeholder="开始"
            end-placeholder="结束"
          />
        </el-form-item>
        <el-form-item>
          <el-button v-permission="'sys:audit:query'" type="primary" :loading="loading" @click="loadList">查询</el-button>
          <el-button v-permission="'sys:audit:clear'" type="danger" @click="handleClear">清空日志</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="table-card">
      <el-table v-loading="loading" :data="tableData" border stripe @row-dblclick="openDetail">
        <el-table-column prop="logId" label="ID" width="70" />
        <el-table-column prop="username" label="用户" width="100" />
        <el-table-column prop="operation" label="操作" min-width="120" show-overflow-tooltip />
        <el-table-column prop="businessType" label="业务类型" width="110" />
        <el-table-column prop="module" label="模块" width="110" />
        <el-table-column prop="method" label="方法" width="80" />
        <el-table-column prop="ip" label="IP" width="130" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">{{ row.status === 1 ? '成功' : '失败' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="时间" width="170" />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button v-permission="'sys:audit:detail'" link type="primary" @click="openDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="detailVisible" title="审计详情" width="640px" destroy-on-close>
      <el-descriptions v-if="detail" :column="1" border>
        <el-descriptions-item label="日志ID">{{ detail.logId }}</el-descriptions-item>
        <el-descriptions-item label="用户">{{ detail.username }} ({{ detail.userId }})</el-descriptions-item>
        <el-descriptions-item label="操作">{{ detail.operation }}</el-descriptions-item>
        <el-descriptions-item label="业务类型">{{ detail.businessType }}</el-descriptions-item>
        <el-descriptions-item label="模块">{{ detail.module }}</el-descriptions-item>
        <el-descriptions-item label="方法">{{ detail.method }}</el-descriptions-item>
        <el-descriptions-item label="IP">{{ detail.ip }}</el-descriptions-item>
        <el-descriptions-item label="UA">{{ detail.userAgent }}</el-descriptions-item>
        <el-descriptions-item label="请求参数">
          <pre class="json-pre">{{ detail.requestParams }}</pre>
        </el-descriptions-item>
        <el-descriptions-item label="响应参数">
          <pre class="json-pre">{{ detail.responseParams }}</pre>
        </el-descriptions-item>
        <el-descriptions-item v-if="detail.errorMsg" label="错误">{{ detail.errorMsg }}</el-descriptions-item>
        <el-descriptions-item label="时间">{{ detail.createTime }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAuditLogList, getAuditLogDetail, clearAuditLogs } from '@/api/auditLog'

const loading = ref(false)
const tableData = ref([])
const timeRange = ref(null)
const filterForm = reactive({
  username: '',
  businessType: ''
})

const detailVisible = ref(false)
const detail = ref(null)

async function loadList() {
  loading.value = true
  try {
    const params = {
      username: filterForm.username || undefined,
      businessType: filterForm.businessType || undefined
    }
    if (timeRange.value?.length === 2) {
      params.startTime = timeRange.value[0]
      params.endTime = timeRange.value[1]
    }
    const res = await getAuditLogList(params)
    if (res.code === 200) {
      tableData.value = Array.isArray(res.data) ? res.data : []
    }
  } catch (e) {
    console.error(e)
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

async function openDetail(row) {
  const logId = row.logId ?? row.id
  if (!logId) return
  try {
    const res = await getAuditLogDetail(logId)
    if (res.code === 200) {
      detail.value = res.data
      detailVisible.value = true
    }
  } catch (e) {
    detail.value = { ...row }
    detailVisible.value = true
  }
}

async function handleClear() {
  await ElMessageBox.confirm('确定清空全部审计日志？此操作不可恢复。', '危险操作', { type: 'warning' })
  try {
    const res = await clearAuditLogs()
    if (res.code === 200) {
      ElMessage.success(res.msg || '已清空')
      loadList()
    }
  } catch (e) {
    if (e !== 'cancel') console.error(e)
  }
}

onMounted(() => {
  loadList()
})
</script>

<style scoped>
.audit-log-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.json-pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
  font-size: 12px;
  max-height: 200px;
  overflow: auto;
}
</style>
