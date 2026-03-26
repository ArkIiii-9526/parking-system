<template>
  <div class="reservation-page legacy-themed-page">
    <el-card shadow="never" class="filter-card">
      <el-form :inline="true" :model="filterForm">
        <el-form-item label="停车场">
          <el-select v-model="filterForm.parkingId" clearable filterable placeholder="全部" style="width: 200px" @focus="loadParkings">
            <el-option v-for="p in parkingOptions" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="车牌号">
          <el-input v-model="filterForm.carNo" clearable placeholder="模糊查询" style="width: 140px" />
        </el-form-item>
        <el-form-item label="用户ID">
          <el-input v-model="filterForm.userId" clearable style="width: 120px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filterForm.status" clearable placeholder="全部" style="width: 120px">
            <el-option label="待使用" :value="0" />
            <el-option label="使用中" :value="1" />
            <el-option label="已完成" :value="2" />
            <el-option label="已取消" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            value-format="YYYY-MM-DD"
            start-placeholder="开始"
            end-placeholder="结束"
          />
        </el-form-item>
        <el-form-item>
          <el-button v-permission="'reservation:view'" type="primary" @click="loadData">查询</el-button>
          <el-button @click="resetFilter">重置</el-button>
          <el-button type="success" @click="openCreate">新建预约</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="table-card">
      <el-table v-loading="loading" :data="tableData" border stripe>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="parkingName" label="停车场" min-width="120" />
        <el-table-column prop="spaceNumber" label="车位" width="90" />
        <el-table-column prop="carNo" label="车牌" width="110" />
        <el-table-column prop="userId" label="用户ID" width="100" />
        <el-table-column prop="startTime" label="开始" width="160" />
        <el-table-column prop="endTime" label="结束" width="160" />
        <el-table-column prop="statusText" label="状态" width="90" />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row)">详情</el-button>
            <el-button v-if="row.status !== 3" link type="warning" @click="openEdit(row)">修改</el-button>
            <el-button v-if="row.status !== 3" link type="warning" @click="handleCancel(row)">取消</el-button>
            <el-button v-permission="'reservation:delete'" link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </el-card>

    <el-dialog v-model="createVisible" title="新建预约" width="520px" destroy-on-close @open="onCreateOpen">
      <el-form ref="createFormRef" :model="createForm" :rules="createRules" label-width="100px">
        <el-form-item label="停车场" prop="parkingId">
          <el-select v-model="createForm.parkingId" filterable style="width: 100%" @change="onCreateParkingChange">
            <el-option v-for="p in parkingOptions" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="停车位" prop="parkingSpaceId">
          <el-select v-model="createForm.parkingSpaceId" filterable style="width: 100%" :loading="spaceLoading">
            <el-option v-for="s in spaceOptions" :key="s.id" :label="s.number || s.spaceNumber || `#${s.id}`" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="车牌号" prop="carNo">
          <el-input v-model="createForm.carNo" />
        </el-form-item>
        <el-form-item label="用户ID" prop="userId">
          <el-input v-model="createForm.userId" />
        </el-form-item>
        <el-form-item label="开始时间" prop="startTime">
          <el-date-picker v-model="createForm.startTime" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss" style="width: 100%" />
        </el-form-item>
        <el-form-item label="结束时间" prop="endTime">
          <el-date-picker v-model="createForm.endTime" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss" style="width: 100%" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="createForm.remark" type="textarea" rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitCreate">确定</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="detailVisible" title="预约详情" size="400px">
      <el-descriptions v-if="currentRow" :column="1" border>
        <el-descriptions-item label="停车场">{{ currentRow.parkingName }}</el-descriptions-item>
        <el-descriptions-item label="车位">{{ currentRow.spaceNumber }}</el-descriptions-item>
        <el-descriptions-item label="车牌">{{ currentRow.carNo }}</el-descriptions-item>
        <el-descriptions-item label="用户">{{ currentRow.userId }}</el-descriptions-item>
        <el-descriptions-item label="开始">{{ currentRow.startTime }}</el-descriptions-item>
        <el-descriptions-item label="结束">{{ currentRow.endTime }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ currentRow.statusText }}</el-descriptions-item>
        <el-descriptions-item label="备注">{{ currentRow.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-drawer>

    <el-dialog v-model="editVisible" title="修改预约" width="480px">
      <el-form :model="editForm" label-width="100px">
        <el-form-item label="开始时间">
          <el-date-picker v-model="editForm.startTime" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss" style="width: 100%" />
        </el-form-item>
        <el-form-item label="结束时间">
          <el-date-picker v-model="editForm.endTime" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss" style="width: 100%" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="editForm.remark" type="textarea" rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="editLoading" @click="submitEdit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getReservationPage,
  createReservation,
  updateReservation,
  cancelReservation,
  deleteReservation,
  getReservationDetail
} from '@/api/reservation'
import { getParkingPage } from '@/api/parking'
import { getParkingSpacesByParking } from '@/api/parkingSpace'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const loading = ref(false)
const tableData = ref([])
const parkingOptions = ref([])
const spaceOptions = ref([])
const spaceLoading = ref(false)
const dateRange = ref(null)

const filterForm = reactive({
  parkingId: undefined,
  carNo: '',
  userId: '',
  status: undefined
})

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

async function loadParkings() {
  if (parkingOptions.value.length) return
  try {
    const res = await getParkingPage({ pageNo: 1, pageSize: 500 })
    if (res.code === 200) parkingOptions.value = res.data?.records || []
  } catch (e) {
    console.error(e)
  }
}

function resetFilter() {
  filterForm.parkingId = undefined
  filterForm.carNo = ''
  filterForm.userId = ''
  filterForm.status = undefined
  dateRange.value = null
  pagination.page = 1
  loadData()
}

async function loadData() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      size: pagination.size,
      parkingId: filterForm.parkingId,
      carNo: filterForm.carNo || undefined,
      userId: filterForm.userId || undefined,
      status: filterForm.status
    }
    if (dateRange.value?.length === 2) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }
    const res = await getReservationPage(params)
    if (res.code === 200) {
      const d = res.data || {}
      tableData.value = d.records || []
      pagination.total = d.total || 0
    }
  } catch (e) {
    console.error(e)
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

const createVisible = ref(false)
const createFormRef = ref(null)
const createForm = reactive({
  parkingId: undefined,
  parkingSpaceId: undefined,
  carNo: '',
  userId: '',
  startTime: '',
  endTime: '',
  remark: ''
})
const createRules = {
  parkingId: [{ required: true, message: '请选择停车场', trigger: 'change' }],
  parkingSpaceId: [{ required: true, message: '请选择车位', trigger: 'change' }],
  carNo: [{ required: true, message: '请输入车牌', trigger: 'blur' }],
  userId: [{ required: true, message: '请输入用户ID', trigger: 'blur' }],
  startTime: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  endTime: [{ required: true, message: '请选择结束时间', trigger: 'change' }]
}
const submitLoading = ref(false)

function onCreateOpen() {
  loadParkings()
  const uid = userStore.user?.userId ?? userStore.user?.id
  if (uid != null) createForm.userId = String(uid)
}

async function onCreateParkingChange(pid) {
  createForm.parkingSpaceId = undefined
  spaceOptions.value = []
  if (!pid) return
  spaceLoading.value = true
  try {
    const res = await getParkingSpacesByParking(pid)
    if (res.code === 200) {
      const list = res.data
      spaceOptions.value = Array.isArray(list) ? list : list?.records || []
    }
  } catch (e) {
    console.error(e)
  } finally {
    spaceLoading.value = false
  }
}

function openCreate() {
  Object.assign(createForm, {
    parkingId: undefined,
    parkingSpaceId: undefined,
    carNo: '',
    userId: userStore.user?.userId != null ? String(userStore.user.userId) : (userStore.user?.id != null ? String(userStore.user.id) : ''),
    startTime: '',
    endTime: '',
    remark: ''
  })
  spaceOptions.value = []
  createVisible.value = true
}

async function submitCreate() {
  const form = createFormRef.value
  if (!form) return
  try {
    await form.validate()
  } catch {
    return
  }
  submitLoading.value = true
  try {
    const res = await createReservation({ ...createForm })
    if (res.code === 200) {
      ElMessage.success('创建成功')
      createVisible.value = false
      loadData()
    }
  } catch (e) {
    console.error(e)
  } finally {
    submitLoading.value = false
  }
}

const detailVisible = ref(false)
const currentRow = ref(null)

async function openDetail(row) {
  try {
    const res = await getReservationDetail(row.id)
    if (res.code === 200) {
      currentRow.value = res.data
      detailVisible.value = true
    }
  } catch (e) {
    currentRow.value = { ...row }
    detailVisible.value = true
  }
}

const editVisible = ref(false)
const editLoading = ref(false)
const editForm = reactive({
  id: null,
  startTime: '',
  endTime: '',
  remark: ''
})

function openEdit(row) {
  editForm.id = row.id
  editForm.startTime = row.startTime
  editForm.endTime = row.endTime
  editForm.remark = row.remark || ''
  editVisible.value = true
}

async function submitEdit() {
  editLoading.value = true
  try {
    const res = await updateReservation(editForm.id, {
      startTime: editForm.startTime,
      endTime: editForm.endTime,
      remark: editForm.remark
    })
    if (res.code === 200) {
      ElMessage.success('已保存')
      editVisible.value = false
      loadData()
    }
  } catch (e) {
    console.error(e)
  } finally {
    editLoading.value = false
  }
}

async function handleCancel(row) {
  await ElMessageBox.confirm('确定取消该预约？', '提示', { type: 'warning' })
  try {
    const res = await cancelReservation(row.id)
    if (res.code === 200) {
      ElMessage.success('已取消')
      loadData()
    }
  } catch (e) {
    if (e !== 'cancel') console.error(e)
  }
}

async function handleDelete(row) {
  await ElMessageBox.confirm('确定删除该预约？', '提示', { type: 'warning' })
  try {
    const res = await deleteReservation(row.id)
    if (res.code === 200) {
      ElMessage.success('已删除')
      loadData()
    }
  } catch (e) {
    if (e !== 'cancel') console.error(e)
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.reservation-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.filter-card {
  border-radius: 8px;
}
.pagination-wrap {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
