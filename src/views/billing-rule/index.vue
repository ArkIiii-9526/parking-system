<template>
  <div class="billing-rule-container">
    <el-card class="filter-card">
      <el-form :model="filterForm" :inline="true" class="filter-form">
        <el-form-item label="规则名称">
          <el-input v-model="filterForm.name" placeholder="请输入规则名称" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filterForm.status" placeholder="请选择状态" clearable>
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>计费规则列表</span>
          <el-button v-permission="'billingRule:add'" type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增规则
          </el-button>
        </div>
      </template>
      
      <el-table :data="tableData" v-loading="loading" stripe style="width: 100%">
        <el-table-column prop="name" label="规则名称" min-width="150" />
        <el-table-column prop="description" label="规则描述" min-width="200" />
        <el-table-column prop="firstHourFee" label="首小时费用" width="100" align="right">
          <template #default="{ row }">
            ¥{{ row.firstHourFee?.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="hourlyFee" label="每小时费用" width="100" align="right">
          <template #default="{ row }">
            ¥{{ row.hourlyFee?.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="maxFee" label="上限费用" width="100" align="right">
          <template #default="{ row }">
            ¥{{ row.maxFee ? row.maxFee.toFixed(2) : '无上限' }}
          </template>
        </el-table-column>
        <el-table-column prop="freeMinutes" label="免费时长(分钟)" width="130" align="center" />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-switch
              :model-value="row.status"
              :active-value="1"
              :inactive-value="0"
              @change="handleStatusChange(row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="{ row }">
            <el-button v-permission="'billingRule:view'" link type="primary" @click="handleDetail(row)">
              查看
            </el-button>
            <el-button v-permission="'billingRule:edit'" link type="primary" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button v-permission="'billingRule:delete'" link type="danger" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.pageNo"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
    
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '新增计费规则' : dialogType === 'edit' ? '编辑计费规则' : '规则详情'"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="120px">
        <el-form-item label="规则名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入规则名称" :disabled="dialogType === 'detail'" />
        </el-form-item>
        <el-form-item label="规则描述" prop="description">
          <el-input v-model="formData.description" type="textarea" :rows="3" placeholder="请输入规则描述" :disabled="dialogType === 'detail'" />
        </el-form-item>
        <el-form-item label="免费时长(分钟)" prop="freeMinutes">
          <el-input-number v-model="formData.freeMinutes" :min="0" :step="5" :disabled="dialogType === 'detail'" />
        </el-form-item>
        <el-form-item label="首小时费用(元)" prop="firstHourFee">
          <el-input-number v-model="formData.firstHourFee" :min="0" :precision="2" :step="0.5" :disabled="dialogType === 'detail'" />
        </el-form-item>
        <el-form-item label="后续每小时费用" prop="hourlyFee">
          <el-input-number v-model="formData.hourlyFee" :min="0" :precision="2" :step="0.5" :disabled="dialogType === 'detail'" />
        </el-form-item>
        <el-form-item label="单日上限费用" prop="maxFee">
          <el-input-number v-model="formData.maxFee" :min="0" :precision="2" :placeholder="0" :disabled="dialogType === 'detail'" />
          <span class="form-tip">0表示无上限</span>
        </el-form-item>
        <el-form-item label="状态" prop="status" v-if="dialogType !== 'add'">
          <el-switch v-model="formData.status" :active-value="1" :inactive-value="0" :disabled="dialogType === 'detail'" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">关闭</el-button>
        <el-button v-if="dialogType !== 'detail'" type="primary" @click="handleSubmit" :loading="submitLoading">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getBillingRulePage, createBillingRule, updateBillingRule, deleteBillingRule, enableBillingRule, disableBillingRule } from '@/api/billingRule'

const loading = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)
const dialogType = ref('add')
const formRef = ref(null)

const tableData = ref([])
const pagination = reactive({
  pageNo: 1,
  pageSize: 10,
  total: 0
})

const filterForm = reactive({
  name: '',
  status: null
})

const formData = reactive({
  id: null,
  name: '',
  description: '',
  freeMinutes: 15,
  firstHourFee: 5,
  hourlyFee: 3,
  maxFee: null,
  status: 1
})

const formRules = {
  name: [
    { required: true, message: '请输入规则名称', trigger: 'blur' },
    { min: 2, max: 50, message: '名称长度在2-50个字符之间', trigger: 'blur' }
  ],
  firstHourFee: [
    { required: true, message: '请输入首小时费用', trigger: 'blur' }
  ],
  hourlyFee: [
    { required: true, message: '请输入后续每小时费用', trigger: 'blur' }
  ]
}

function formatTime(time) {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}

async function loadData() {
  loading.value = true
  try {
    const res = await getBillingRulePage({
      pageNo: pagination.pageNo,
      pageSize: pagination.pageSize,
      name: filterForm.name,
      status: filterForm.status
    })
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
  pagination.pageNo = 1
  loadData()
}

function handleReset() {
  filterForm.name = ''
  filterForm.status = null
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

function handleAdd() {
  dialogType.value = 'add'
  Object.keys(formData).forEach(key => {
    if (key === 'freeMinutes') {
      formData[key] = 15
    } else if (key === 'firstHourFee') {
      formData[key] = 5
    } else if (key === 'hourlyFee') {
      formData[key] = 3
    } else if (key === 'maxFee') {
      formData[key] = null
    } else if (key === 'status') {
      formData[key] = 1
    } else {
      formData[key] = key === 'description' ? '' : null
    }
  })
  dialogVisible.value = true
}

function handleDetail(row) {
  dialogType.value = 'detail'
  Object.assign(formData, row)
  dialogVisible.value = true
}

function handleEdit(row) {
  dialogType.value = 'edit'
  Object.assign(formData, row)
  dialogVisible.value = true
}

function handleDelete(row) {
  ElMessageBox.confirm('确定要删除该计费规则吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const res = await deleteBillingRule(row.id)
      if (res.code === 200) {
        ElMessage.success('删除成功')
        loadData()
      } else {
        ElMessage.error(res.msg || '删除失败')
      }
    } catch (error) {
      ElMessage.error('删除失败')
    }
  })
}

async function handleStatusChange(row) {
  try {
    if (row.status === 1) {
      await ElMessageBox.confirm('确定要禁用该规则吗？', '提示', { type: 'warning' })
      const res = await disableBillingRule(row.id)
      if (res.code === 200) {
        ElMessage.success('已禁用')
        loadData()
      }
    } else {
      const res = await enableBillingRule(row.id)
      if (res.code === 200) {
        ElMessage.success('已启用')
        loadData()
      }
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

async function handleSubmit() {
  try {
    await formRef.value.validate()
    submitLoading.value = true
    
    if (dialogType.value === 'add') {
      const res = await createBillingRule(formData)
      if (res.code === 200) {
        ElMessage.success('新增成功')
        dialogVisible.value = false
        loadData()
      } else {
        ElMessage.error(res.msg || '新增失败')
      }
    } else {
      const res = await updateBillingRule(formData)
      if (res.code === 200) {
        ElMessage.success('更新成功')
        dialogVisible.value = false
        loadData()
      } else {
        ElMessage.error(res.msg || '更新失败')
      }
    }
  } catch (error) {
    console.error('提交失败:', error)
  } finally {
    submitLoading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style lang="scss" scoped>
.billing-rule-container {
  .filter-card {
    margin-bottom: 20px;
    
    .filter-form {
      .el-form-item {
        margin-bottom: 0;
      }
    }
  }
  
  .table-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }
  
  .pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }
  
  .form-tip {
    margin-left: 8px;
    font-size: 12px;
    color: #909399;
  }
}
</style>
