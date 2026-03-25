<template>
  <div class="config-manage-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">
          <span class="title-icon">
            <el-icon><Tools /></el-icon>
          </span>
          系统配置管理
        </h1>
        <p class="page-subtitle">管理系统配置参数及缓存</p>
      </div>
      <div class="header-actions">
        <button class="refresh-btn" v-permission="'config:edit'" @click="handleRefreshCache">
          <el-icon><Refresh /></el-icon>
          <span>刷新缓存</span>
        </button>
        <button class="add-btn" v-permission="'config:add'" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          <span>新增配置</span>
        </button>
      </div>
    </div>

    <!-- 搜索筛选 -->
    <div class="filter-card">
      <div class="filter-row">
        <div class="filter-group">
          <div class="filter-input-wrapper">
            <el-icon class="filter-icon"><Search /></el-icon>
            <el-input
              v-model="filterForm.configName"
              placeholder="搜索配置名称..."
              clearable
              @keyup.enter="handleSearch"
            />
          </div>
          <div class="filter-input-wrapper">
            <el-icon class="filter-icon"><Key /></el-icon>
            <el-input
              v-model="filterForm.configKey"
              placeholder="搜索配置键名..."
              clearable
              @keyup.enter="handleSearch"
            />
          </div>
          <div class="filter-item">
            <span class="filter-label">配置类型</span>
            <el-select
              v-model="filterForm.configType"
              placeholder="选择类型"
              clearable
              @change="handleSearch"
              style="width: 140px"
            >
              <el-option
                v-for="(label, value) in configTypeMap"
                :key="value"
                :label="label"
                :value="value"
              />
            </el-select>
          </div>
          <div class="filter-item">
            <span class="filter-label">系统内置</span>
            <el-select
              v-model="filterForm.isSystem"
              placeholder="全部"
              clearable
              @change="handleSearch"
              style="width: 120px"
            >
              <el-option label="是" :value="1" />
              <el-option label="否" :value="0" />
            </el-select>
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
        <el-table-column prop="configName" label="配置名称" min-width="150">
          <template #default="{ row }">
            <div class="config-name">
              <el-icon><Setting /></el-icon>
              <span>{{ row.configName }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="configKey" label="配置键名" min-width="180">
          <template #default="{ row }">
            <span class="config-key">{{ row.configKey }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="configValue" label="配置值" min-width="200">
          <template #default="{ row }">
            <div class="config-value">
              <el-tooltip
                v-if="row.configValue && row.configValue.length > 30"
                :content="row.configValue"
                placement="top"
                effect="dark"
              >
                <span>{{ truncateValue(row.configValue) }}</span>
              </el-tooltip>
              <span v-else>{{ row.configValue || '-' }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="configType" label="类型" width="100" align="center">
          <template #default="{ row }">
            <span class="type-badge" :class="row.configType?.toLowerCase()">
              {{ configTypeMap[row.configType] || row.configType }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="isSystem" label="系统内置" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.isSystem === 1" type="warning" size="small">是</el-tag>
            <el-tag v-else type="info" size="small">否</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              :active-value="1"
              :inactive-value="0"
              size="small"
              @change="(val) => handleStatusChange(row, val)"
              v-permission="'config:edit'"
            />
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="150" show-overflow-tooltip />
        <el-table-column prop="updateTime" label="更新时间" width="160" align="center">
          <template #default="{ row }">
            <span class="time-text">{{ formatTime(row.updateTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right" align="center">
          <template #default="{ row }">
            <div class="action-btns">
              <button class="action-btn" v-permission="'config:edit'" @click="handleEdit(row)" title="编辑">
                <el-icon><Edit /></el-icon>
              </button>
              <button
                class="action-btn danger"
                v-permission="'config:delete'"
                @click="handleDelete(row)"
                title="删除"
                :disabled="row.isSystem === 1"
              >
                <el-icon><Delete /></el-icon>
              </button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 空状态 -->
      <div v-if="tableData.length === 0 && !loading" class="empty-state">
        <div class="empty-icon">
          <el-icon><Tools /></el-icon>
        </div>
        <h3>暂无配置数据</h3>
        <p>点击上方按钮添加第一个配置</p>
      </div>

      <!-- 分页 -->
      <div class="pagination-wrapper" v-if="pagination.total > 0">
        <div class="pagination-info">
          共 <span class="highlight">{{ pagination.total }}</span> 条记录
        </div>
        <el-pagination
          v-model:current-page="pagination.pageNum"
          v-model:page-size="pagination.pageSize"
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
      :title="dialogType === 'add' ? '新增配置' : '编辑配置'"
      width="560px"
      :close-on-click-modal="false"
      class="glass-dialog"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px" class="config-form">
        <el-form-item label="配置名称" prop="configName">
          <div class="form-input-wrapper">
            <el-icon><Setting /></el-icon>
            <el-input v-model="formData.configName" placeholder="请输入配置名称" maxlength="50" />
          </div>
        </el-form-item>

        <el-form-item label="配置键名" prop="configKey">
          <div class="form-input-wrapper">
            <el-icon><Key /></el-icon>
            <el-input
              v-model="formData.configKey"
              placeholder="如：system.name"
              maxlength="100"
              :disabled="dialogType === 'edit'"
            />
          </div>
        </el-form-item>

        <el-form-item label="配置类型" prop="configType">
          <el-select v-model="formData.configType" placeholder="选择配置类型" style="width: 100%" @change="handleTypeChange">
            <el-option
              v-for="(label, value) in configTypeMap"
              :key="value"
              :label="label"
              :value="value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="配置值" prop="configValue">
          <!-- 字符串类型 -->
          <el-input
            v-if="formData.configType === 'STRING'"
            v-model="formData.configValue"
            type="textarea"
            :rows="3"
            placeholder="请输入配置值"
            maxlength="500"
            show-word-limit
          />
          <!-- 整数类型 -->
          <el-input-number
            v-else-if="formData.configType === 'INT'"
            v-model="formData.configValue"
            :min="-2147483648"
            :max="2147483647"
            style="width: 100%"
            placeholder="请输入整数"
          />
          <!-- 布尔类型 -->
          <el-switch
            v-else-if="formData.configType === 'BOOLEAN'"
            v-model="formData.configValue"
            :active-value="true"
            :inactive-value="false"
            active-text="是"
            inactive-text="否"
          />
          <!-- JSON类型 -->
          <el-input
            v-else-if="formData.configType === 'JSON'"
            v-model="formData.configValue"
            type="textarea"
            :rows="5"
            placeholder='请输入JSON格式数据，如：{&quot;key&quot;: &quot;value&quot;}'
          />
          <!-- 默认 -->
          <el-input
            v-else
            v-model="formData.configValue"
            placeholder="请输入配置值"
          />
        </el-form-item>

        <el-form-item label="配置说明" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="2"
            placeholder="请输入配置说明"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="formData.sort" :min="0" :max="999" style="width: 100%" />
        </el-form-item>

        <el-form-item label="系统内置" prop="isSystem" v-if="dialogType === 'add'">
          <el-switch
            v-model="formData.isSystem"
            :active-value="1"
            :inactive-value="0"
            active-text="是"
            inactive-text="否"
          />
        </el-form-item>

        <el-form-item label="状态" prop="status">
          <el-switch
            v-model="formData.status"
            :active-value="1"
            :inactive-value="0"
            active-text="启用"
            inactive-text="禁用"
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getConfigPage,
  createConfig,
  updateConfig,
  deleteConfig,
  refreshConfigCache,
  getConfigTypes
} from '@/api/config'

const loading = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)
const dialogType = ref('add')
const formRef = ref(null)

const tableData = ref([])
const configTypeMap = ref({})

const filterForm = reactive({
  configName: '',
  configKey: '',
  configType: null,
  isSystem: null
})

const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0
})

const formData = reactive({
  configId: null,
  configName: '',
  configKey: '',
  configValue: '',
  configType: 'STRING',
  description: '',
  isSystem: 0,
  sort: 0,
  status: 1
})

const formRules = {
  configName: [
    { required: true, message: '请输入配置名称', trigger: 'blur' },
    { min: 1, max: 50, message: '名称长度在1-50个字符之间', trigger: 'blur' }
  ],
  configKey: [
    { required: true, message: '请输入配置键名', trigger: 'blur' },
    { min: 1, max: 100, message: '键名长度在1-100个字符之间', trigger: 'blur' },
    { pattern: /^[a-zA-Z][a-zA-Z0-9._-]*$/, message: '键名必须以字母开头，只能包含字母、数字、点、下划线和横线', trigger: 'blur' }
  ],
  configType: [
    { required: true, message: '请选择配置类型', trigger: 'change' }
  ],
  configValue: [
    { validator: validateConfigValue, trigger: 'blur' }
  ]
}

function validateConfigValue(rule, value, callback) {
  if (formData.configType === 'JSON' && value) {
    try {
      JSON.parse(value)
      callback()
    } catch (e) {
      callback(new Error('请输入有效的JSON格式'))
    }
  } else {
    callback()
  }
}

async function loadConfigTypes() {
  try {
    const res = await getConfigTypes()
    if (res.code === 200) {
      configTypeMap.value = res.data || {}
    }
  } catch (error) {
    console.error('加载配置类型失败:', error)
  }
}

async function loadData() {
  loading.value = true
  try {
    const params = {
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize
    }
    if (filterForm.configName) params.configName = filterForm.configName
    if (filterForm.configKey) params.configKey = filterForm.configKey
    if (filterForm.configType) params.configType = filterForm.configType
    if (filterForm.isSystem !== null) params.isSystem = filterForm.isSystem

    const res = await getConfigPage(params)
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
  pagination.pageNum = 1
  loadData()
}

function handleReset() {
  filterForm.configName = ''
  filterForm.configKey = ''
  filterForm.configType = null
  filterForm.isSystem = null
  handleSearch()
}

function handleSizeChange(size) {
  pagination.pageSize = size
  loadData()
}

function handleCurrentChange(page) {
  pagination.pageNum = page
  loadData()
}

function handleAdd() {
  dialogType.value = 'add'
  Object.keys(formData).forEach(key => {
    if (key === 'configType') {
      formData[key] = 'STRING'
    } else if (key === 'isSystem') {
      formData[key] = 0
    } else if (key === 'sort') {
      formData[key] = 0
    } else if (key === 'status') {
      formData[key] = 1
    } else if (key === 'configValue') {
      formData[key] = ''
    } else {
      formData[key] = null
    }
  })
  dialogVisible.value = true
}

function handleEdit(row) {
  dialogType.value = 'edit'
  Object.assign(formData, row)
  // 根据类型转换值
  if (formData.configType === 'INT') {
    formData.configValue = parseInt(formData.configValue) || 0
  } else if (formData.configType === 'BOOLEAN') {
    formData.configValue = formData.configValue === 'true' || formData.configValue === true
  }
  dialogVisible.value = true
}

function handleTypeChange(type) {
  // 切换类型时重置值
  if (type === 'BOOLEAN') {
    formData.configValue = false
  } else if (type === 'INT') {
    formData.configValue = 0
  } else {
    formData.configValue = ''
  }
}

async function handleStatusChange(row, status) {
  try {
    const res = await updateConfig({
      ...row,
      status
    })
    if (res.code === 200) {
      ElMessage.success('状态更新成功')
    } else {
      ElMessage.error(res.message || '更新失败')
      row.status = status === 1 ? 0 : 1
    }
  } catch (error) {
    console.error('更新状态失败:', error)
    ElMessage.error('更新状态失败')
    row.status = status === 1 ? 0 : 1
  }
}

function handleDelete(row) {
  if (row.isSystem === 1) {
    ElMessage.warning('系统内置配置不允许删除')
    return
  }

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
      <p>确定要删除配置 "${row.configName}" 吗？<br>此操作不可恢复。</p>
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
      const res = await deleteConfig(row.configId)
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

async function handleRefreshCache() {
  try {
    const res = await refreshConfigCache()
    if (res.code === 200) {
      ElMessage.success(res.data?.message || '配置缓存刷新成功')
    } else {
      ElMessage.error(res.message || '刷新失败')
    }
  } catch (error) {
    console.error('刷新缓存失败:', error)
    ElMessage.error('刷新缓存失败')
  }
}

async function handleSubmit() {
  try {
    await formRef.value.validate()
    submitLoading.value = true

    // 处理不同类型的值
    const submitData = { ...formData }
    if (submitData.configType === 'BOOLEAN') {
      submitData.configValue = String(submitData.configValue)
    } else if (submitData.configType === 'INT') {
      submitData.configValue = String(submitData.configValue)
    }

    if (dialogType.value === 'add') {
      const res = await createConfig(submitData)
      if (res.code === 200) {
        ElMessage.success('新增成功')
        dialogVisible.value = false
        loadData()
      } else {
        ElMessage.error(res.message || '新增失败')
      }
    } else {
      const res = await updateConfig(submitData)
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

function truncateValue(value) {
  if (!value) return '-'
  return value.length > 30 ? value.substring(0, 30) + '...' : value
}

function formatTime(time) {
  if (!time) return '-'
  const date = new Date(time)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  loadConfigTypes()
  loadData()
})
</script>

<style lang="scss" scoped>
.config-manage-page {
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

  .header-actions {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .add-btn, .refresh-btn {
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
      box-shadow: 0 8px 25px rgba(99, 102, 241, 0.5);
    }

    .el-icon {
      font-size: 16px;
    }
  }

  .refresh-btn {
    background: linear-gradient(135deg, var(--secondary-500), var(--secondary-600));
    box-shadow: 0 0 20px rgba(16, 185, 129, 0.3);

    &:hover {
      box-shadow: 0 8px 25px rgba(16, 185, 129, 0.5);
    }
  }
}

// 筛选卡片
.filter-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
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
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: var(--radius-lg);
    transition: all 0.3s ease;

    &:hover, &:focus-within {
      border-color: rgba(255, 255, 255, 0.2);
      background: rgba(255, 255, 255, 0.08);
    }

    .filter-icon {
      font-size: 16px;
      color: var(--text-muted);
    }

    :deep(.el-input) {
      width: 180px;

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
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: var(--radius-lg);
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.2);
      color: var(--text-primary);
    }

    &.primary {
      background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
      border: none;
      color: white;
      box-shadow: var(--shadow-glow-primary);

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(99, 102, 241, 0.5);
      }
    }

    .el-icon {
      font-size: 14px;
    }
  }
}

// 表格卡片
.table-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  overflow: hidden;
}

// 自定义表格
.custom-table {
  background: transparent;

  :deep(.el-table__header) {
    th {
      background: rgba(255, 255, 255, 0.05);
      color: var(--text-secondary);
      font-weight: var(--font-semibold);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
  }

  :deep(.el-table__row) {
    background: transparent;

    &:hover {
      background: rgba(255, 255, 255, 0.03);
    }

    td {
      color: var(--text-primary);
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }
  }

  :deep(.el-table__empty-block) {
    display: none;
  }
}

// 配置名称
.config-name {
  display: flex;
  align-items: center;
  gap: var(--space-2);

  .el-icon {
    font-size: 16px;
    color: var(--primary-400);
  }
}

// 配置键名
.config-key {
  font-family: monospace;
  font-size: var(--text-sm);
  color: var(--text-secondary);
  background: rgba(255, 255, 255, 0.05);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-md);
}

// 配置值
.config-value {
  font-size: var(--text-sm);
  color: var(--text-primary);
}

// 类型标签
.type-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-1) var(--space-3);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  border-radius: var(--radius-md);

  &.string {
    background: rgba(99, 102, 241, 0.15);
    color: var(--primary-400);
  }

  &.int {
    background: rgba(16, 185, 129, 0.15);
    color: var(--secondary-400);
  }

  &.boolean {
    background: rgba(245, 158, 11, 0.15);
    color: var(--warning-400);
  }

  &.json {
    background: rgba(139, 92, 246, 0.15);
    color: #a78bfa;
  }
}

// 时间文本
.time-text {
  font-size: var(--text-xs);
  color: var(--text-muted);
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
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: var(--radius-md);
    color: var(--text-tertiary);
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.2);
      color: var(--text-primary);
    }

    &.danger:hover:not(:disabled) {
      background: rgba(244, 63, 94, 0.1);
      border-color: rgba(244, 63, 94, 0.3);
      color: var(--accent-400);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
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
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
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
  border-top: 1px solid rgba(255, 255, 255, 0.06);

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
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: none;

          .el-input__inner {
            color: var(--text-primary);
          }
        }
      }
    }

    .el-pager {
      li {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: var(--text-secondary);

        &:hover {
          color: var(--text-primary);
          border-color: rgba(255, 255, 255, 0.2);
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
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
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
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: none;

        .el-input__inner {
          color: var(--text-primary);
        }
      }
    }
  }
}

// 表单样式
.config-form {
  .form-input-wrapper {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: var(--radius-md);
    transition: all 0.3s ease;

    &:hover, &:focus-within {
      border-color: rgba(255, 255, 255, 0.2);
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
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: var(--text-primary);

      &:hover, &:focus {
        border-color: rgba(255, 255, 255, 0.2);
      }
    }

    .el-input__count {
      background: transparent;
      color: var(--text-muted);
    }
  }

  :deep(.el-switch__label) {
    color: var(--text-tertiary);

    &.is-active {
      color: var(--text-primary);
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
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: var(--text-secondary);

      &:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.2);
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
        box-shadow: 0 8px 25px rgba(99, 102, 241, 0.5);
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
        border: 2px solid rgba(255, 255, 255, 0.3);
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

// 响应式
@media (max-width: 768px) {
  .config-manage-page {
    padding: var(--space-4);
  }

  .header-actions {
    flex-direction: column;
    gap: var(--space-2);
  }

  .pagination-wrapper {
    flex-direction: column;
    gap: var(--space-4);
    align-items: center;
  }
}
</style>
