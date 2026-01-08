<template>
  <div class="billing-container">
    <el-card class="filter-card">
      <el-form :model="filterForm" :inline="true" class="filter-form">
        <el-form-item label="车牌号">
          <el-input v-model="filterForm.carNo" placeholder="请输入车牌号" clearable />
        </el-form-item>
        <el-form-item label="支付状态">
          <el-select v-model="filterForm.status" placeholder="请选择状态" clearable>
            <el-option label="未支付" :value="0" />
            <el-option label="已支付" :value="1" />
            <el-option label="部分支付" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
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
          <el-button type="success" @click="handleExport">
            <el-icon><Download /></el-icon>
            导出
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>收费记录列表</span>
          <div class="stat-info">
            <span>总收入：<strong class="total-amount">¥{{ totalRevenue }}</strong></span>
          </div>
        </div>
      </template>
      
      <el-table :data="tableData" v-loading="loading" stripe style="width: 100%">
        <el-table-column prop="carNo" label="车牌号" width="120" />
        <el-table-column prop="parkingName" label="停车场" min-width="150" />
        <el-table-column prop="entryTime" label="入场时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.entryTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="exitTime" label="出场时间" width="180">
          <template #default="{ row }">
            {{ row.exitTime ? formatTime(row.exitTime) : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="duration" label="停车时长" width="120">
          <template #default="{ row }">
            {{ calculateDuration(row.entryTime, row.exitTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="totalAmount" label="应收金额" width="100" align="right">
          <template #default="{ row }">
            <span class="amount">¥{{ row.totalAmount?.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="actualAmount" label="实收金额" width="100" align="right">
          <template #default="{ row }">
            <span class="amount">¥{{ row.actualAmount?.toFixed(2) || '0.00' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="支付状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="paymentMethod" label="支付方式" width="100">
          <template #default="{ row }">
            {{ getPaymentMethodText(row.paymentMethod) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" align="center" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.status === 0" v-permission="'billing:pay'" type="primary" link @click="handlePay(row)">
              支付
            </el-button>
            <el-button v-permission="'billing:view'" type="info" link @click="handleDetail(row)">
              详情
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
      v-model="payDialogVisible"
      title="支付停车费"
      width="400px"
      :close-on-click-modal="false"
    >
      <div class="pay-info">
        <div class="info-item">
          <span class="label">车牌号：</span>
          <span class="value">{{ currentRecord.carNo }}</span>
        </div>
        <div class="info-item">
          <span class="label">停车时长：</span>
          <span class="value">{{ calculateDuration(currentRecord.entryTime, currentRecord.exitTime) }}</span>
        </div>
        <div class="info-item">
          <span class="label">应付金额：</span>
          <span class="value amount">¥{{ currentRecord.totalAmount?.toFixed(2) }}</span>
        </div>
      </div>
      <el-form :model="payForm" :rules="payRules" ref="payFormRef" label-width="100px">
        <el-form-item label="支付方式" prop="paymentMethod">
          <el-select v-model="payForm.paymentMethod" placeholder="请选择支付方式">
            <el-option label="微信支付" value="wechat" />
            <el-option label="支付宝" value="alipay" />
            <el-option label="现金支付" value="cash" />
            <el-option label="银行卡" value="card" />
          </el-select>
        </el-form-item>
        <el-form-item label="实付金额" prop="actualAmount">
          <el-input-number 
            v-model="payForm.actualAmount" 
            :min="0" 
            :precision="2" 
            :step="0.01"
          />
        </el-form-item>
        <el-form-item label="交易号" prop="transactionNo">
          <el-input v-model="payForm.transactionNo" placeholder="请输入交易号（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="payDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handlePaySubmit" :loading="payLoading">确认支付</el-button>
      </template>
    </el-dialog>
    
    <el-dialog
      v-model="detailDialogVisible"
      title="收费详情"
      width="500px"
    >
      <el-descriptions :column="2" border>
        <el-descriptions-item label="车牌号">{{ currentRecord.carNo }}</el-descriptions-item>
        <el-descriptions-item label="停车场">{{ currentRecord.parkingName }}</el-descriptions-item>
        <el-descriptions-item label="入场时间">{{ formatTime(currentRecord.entryTime) }}</el-descriptions-item>
        <el-descriptions-item label="出场时间">{{ formatTime(currentRecord.exitTime) }}</el-descriptions-item>
        <el-descriptions-item label="停车时长">{{ calculateDuration(currentRecord.entryTime, currentRecord.exitTime) }}</el-descriptions-item>
        <el-descriptions-item label="应付金额">
          <span class="amount">¥{{ currentRecord.totalAmount?.toFixed(2) }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="实付金额">
          <span class="amount">¥{{ currentRecord.actualAmount?.toFixed(2) || '0.00' }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="优惠金额">
          <span class="amount">¥{{ (currentRecord.discountAmount || 0).toFixed(2) }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="支付状态">
          <el-tag :type="getStatusType(currentRecord.status)">
            {{ getStatusText(currentRecord.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="支付方式">{{ getPaymentMethodText(currentRecord.paymentMethod) }}</el-descriptions-item>
        <el-descriptions-item label="交易号">{{ currentRecord.transactionNo || '-' }}</el-descriptions-item>
        <el-descriptions-item label="支付时间">{{ formatTime(currentRecord.paymentTime) }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getBillingRecordsPage, payBillingRecord, exportBillingRecords } from '@/api/billing'

const loading = ref(false)
const payLoading = ref(false)
const payDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const dateRange = ref(null)
const totalRevenue = ref(0)

const tableData = ref([])
const pagination = reactive({
  pageNo: 1,
  pageSize: 10,
  total: 0
})

const currentRecord = ref({})
const payForm = reactive({
  paymentMethod: 'wechat',
  actualAmount: 0,
  transactionNo: ''
})

const payRules = {
  paymentMethod: [{ required: true, message: '请选择支付方式', trigger: 'change' }],
  actualAmount: [{ required: true, message: '请输入实付金额', trigger: 'blur' }]
}

const filterForm = reactive({
  carNo: '',
  status: null
})

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
  return texts[method] || '-'
}

async function loadData() {
  loading.value = true
  try {
    const params = {
      pageNo: pagination.pageNo,
      pageSize: pagination.pageSize,
      carNo: filterForm.carNo,
      status: filterForm.status,
      startTime: dateRange.value ? dateRange.value[0] : null,
      endTime: dateRange.value ? dateRange.value[1] : null
    }
    
    const res = await getBillingRecordsPage(params)
    if (res.code === 200) {
      tableData.value = (res.data.records || []).map(record => ({
        ...record,
        parkingName: record.parkingName || ''
      }))
      pagination.total = res.data.total || 0
      
      totalRevenue.value = tableData.value
        .filter(r => r.status === 1)
        .reduce((sum, r) => sum + (r.actualAmount || 0), 0)
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
  filterForm.carNo = ''
  filterForm.status = null
  dateRange.value = null
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
  payForm.actualAmount = row.totalAmount
  payForm.transactionNo = ''
  payDialogVisible.value = true
}

function handleDetail(row) {
  currentRecord.value = row
  detailDialogVisible.value = true
}

async function handlePaySubmit() {
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

async function handleExport() {
  try {
    const params = {
      carNo: filterForm.carNo,
      status: filterForm.status,
      startTime: dateRange.value ? dateRange.value[0] : null,
      endTime: dateRange.value ? dateRange.value[1] : null
    }
    
    const res = await exportBillingRecords(params)
    const blob = new Blob([res.data], { type: 'application/vnd.ms-excel' })
    const link = document.createElement('a')
    link.href = window.URL.createObjectURL(blob)
    link.download = `收费记录_${new Date().toLocaleDateString()}.xlsx`
    link.click()
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败')
  }
}

const payFormRef = ref(null)

onMounted(() => {
  loadData()
})
</script>

<style lang="scss" scoped>
.billing-container {
  .filter-card {
    margin-bottom: 20px;
  }
  
  .table-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .stat-info {
        font-size: 14px;
        color: #606266;
        
        .total-amount {
          color: #F56C6C;
          font-size: 18px;
        }
      }
    }
    
    .amount {
      color: #F56C6C;
      font-weight: 500;
    }
  }
  
  .pay-info {
    background: #f5f7fa;
    padding: 16px;
    border-radius: 8px;
    margin-bottom: 20px;
    
    .info-item {
      margin-bottom: 8px;
      
      .label {
        color: #606266;
      }
      
      .value {
        color: #303133;
        font-weight: 500;
        
        &.amount {
          color: #F56C6C;
          font-size: 18px;
        }
      }
    }
  }
  
  .pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }
}
</style>
