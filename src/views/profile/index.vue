<template>
  <div class="app-container">
    <el-row :gutter="20">
      <el-col :span="8" :xs="24">
        <el-card class="box-card">
          <template #header>
            <div class="clearfix">
              <span>个人信息</span>
            </div>
          </template>
          <div class="text-center">
            <el-avatar :size="100" :src="userStore.avatar" class="user-avatar">
              <el-icon :size="50"><User /></el-icon>
            </el-avatar>
          </div>
          <ul class="list-group list-group-striped">
            <li class="list-group-item">
              <el-icon><User /></el-icon>用户名称
              <div class="pull-right">{{ user.username || '-' }}</div>
            </li>
            <li class="list-group-item">
              <el-icon><Phone /></el-icon>手机号码
              <div class="pull-right">{{ user.phone || '-' }}</div>
            </li>
            <li class="list-group-item">
              <el-icon><Message /></el-icon>用户邮箱
              <div class="pull-right">{{ user.email || '-' }}</div>
            </li>
            <li class="list-group-item">
              <el-icon><Postcard /></el-icon>用户类型
              <div class="pull-right">
                <el-tag :type="getUserTagType(user.userType)" size="small">
                  {{ getUserTypeName(user.userType) }}
                </el-tag>
              </div>
            </li>
            <li class="list-group-item">
              <el-icon><Calendar /></el-icon>创建日期
              <div class="pull-right">{{ user.createTime || '-' }}</div>
            </li>
          </ul>
        </el-card>
      </el-col>
      <el-col :span="16" :xs="24">
        <el-card>
          <template #header>
            <div class="clearfix">
              <span>基本资料</span>
            </div>
          </template>
          <el-tabs v-model="activeTab">
            <el-tab-pane label="基本资料" name="userinfo">
              <el-form ref="infoFormRef" :model="user" :rules="infoRules" label-width="80px">
                <el-form-item label="用户昵称" prop="nickname">
                  <el-input v-model="user.nickname" maxlength="30" />
                </el-form-item>
                <el-form-item label="手机号码" prop="phone">
                  <el-input v-model="user.phone" maxlength="11" />
                </el-form-item>
                <el-form-item label="邮箱" prop="email">
                  <el-input v-model="user.email" maxlength="50" />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="submitInfo" :loading="loading">保存</el-button>
                </el-form-item>
              </el-form>
            </el-tab-pane>
            <el-tab-pane label="修改密码" name="resetPwd">
              <el-form ref="pwdFormRef" :model="pwdForm" :rules="pwdRules" label-width="80px">
                <el-form-item label="原密码" prop="oldPassword">
                  <el-input v-model="pwdForm.oldPassword" placeholder="请输入原密码" type="password" show-password />
                </el-form-item>
                <el-form-item label="新密码" prop="newPassword">
                  <el-input v-model="pwdForm.newPassword" placeholder="请输入新密码" type="password" show-password />
                </el-form-item>
                <el-form-item label="确认密码" prop="confirmPassword">
                  <el-input v-model="pwdForm.confirmPassword" placeholder="请确认密码" type="password" show-password />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="submitPwd" :loading="loading">保存</el-button>
                </el-form-item>
              </el-form>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { getUserDetail, updateUserProfile, updateUserPwd } from '@/api/user'
import { ElMessage } from 'element-plus'
import { User, Phone, Message, Postcard, Calendar } from '@element-plus/icons-vue'

const userStore = useUserStore()
const activeTab = ref('userinfo')
const loading = ref(false)

const user = ref({})
const pwdForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const infoFormRef = ref(null)
const pwdFormRef = ref(null)

const getUserTypeName = (type) => {
  const map = {
    '00': '超级管理员',
    'admin': '超级管理员',
    'SUPER_ADMIN': '超级管理员',
    'ADMIN': '管理员',
    'INSPECTOR': '巡检员',
    'OWNER': '普通用户'
  }
  return map[type] || type || '普通用户'
}

const getUserTagType = (type) => {
  if (type === '00' || type === 'admin' || type === 'SUPER_ADMIN') return 'danger'
  if (type === 'ADMIN') return 'warning'
  if (type === 'INSPECTOR') return 'success'
  return 'info'
}

const infoRules = {
  nickname: [{ required: true, message: '用户昵称不能为空', trigger: 'blur' }],
  email: [{ type: 'email', message: '请输入正确的邮箱地址', trigger: ['blur', 'change'] }],
  phone: [{ pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }]
}

const validateConfirmPwd = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== pwdForm.newPassword) {
    callback(new Error('两次输入密码不一致!'))
  } else {
    callback()
  }
}

const pwdRules = {
  oldPassword: [
    { required: true, message: '原密码不能为空', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '新密码不能为空', trigger: 'blur' },
    { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, validator: validateConfirmPwd, trigger: 'blur' }
  ]
}

const getUser = async () => {
  try {
    const userId = userStore.user?.userId || userStore.user?.id
    if (!userId) return
    const res = await getUserDetail(userId)
    if (res.code === 200) {
      user.value = res.data
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
  }
}

const submitInfo = async () => {
  if (!infoFormRef.value) return
  await infoFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        const res = await updateUserProfile({
          userId: user.value.userId,
          nickname: user.value.nickname,
          phone: user.value.phone,
          email: user.value.email
        })
        if (res.code === 200) {
          ElMessage.success('个人资料修改成功')
          userStore.getUserInfo() // 刷新全局状态
        } else {
          ElMessage.error(res.msg || '修改失败')
        }
      } catch (error) {
        console.error('修改失败:', error)
        ElMessage.error('修改失败')
      } finally {
        loading.value = false
      }
    }
  })
}

const submitPwd = async () => {
  if (!pwdFormRef.value) return
  await pwdFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        const res = await updateUserPwd({
          oldPassword: pwdForm.oldPassword,
          newPassword: pwdForm.newPassword
        })
        if (res.code === 200) {
          ElMessage.success('密码修改成功，请重新登录')
          userStore.logout()
        } else {
          ElMessage.error(res.msg || '密码修改失败')
        }
      } catch (error) {
        console.error('密码修改失败:', error)
        ElMessage.error('密码修改失败')
      } finally {
        loading.value = false
      }
    }
  })
}

onMounted(() => {
  getUser()
})
</script>

<style lang="scss" scoped>
.app-container {
  padding: 20px;
}

.text-center {
  text-align: center;
  padding: 20px 0;
}

.user-avatar {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto;
  background-color: var(--primary-50);
  color: var(--primary-400);
}

.list-group-striped > .list-group-item {
  border-left: 0;
  border-right: 0;
  border-radius: 0;
  padding-left: 0;
  padding-right: 0;
}

.list-group {
  padding-left: 0px;
  list-style: none;
}

.list-group-item {
  border-bottom: 1px solid var(--border-subtle);
  padding: 11px 0px;
  font-size: 14px;
  display: flex;
  align-items: center;
  color: var(--text-primary);
  
  .el-icon {
    margin-right: 5px;
    color: var(--text-secondary);
  }
}

.pull-right {
  float: right;
  margin-left: auto;
  color: var(--text-secondary);
}

:deep(.el-card) {
  border-radius: var(--radius-lg);
  border-color: var(--border-subtle);
  background: var(--bg-secondary);
  
  .el-card__header {
    border-bottom-color: var(--border-subtle);
    padding: 15px 20px;
    font-weight: var(--font-medium);
  }
}
</style>
