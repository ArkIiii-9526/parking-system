<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElCard, ElForm, ElFormItem, ElInput, ElButton, ElAvatar, ElMessage, ElDivider, ElTag } from 'element-plus'
import { useUserStore } from '@/util/userStore'

const { userInfo, loadUserInfo } = useUserStore()

// 表单数据
const formData = reactive({
  username: '',
  name: '',
  email: '',
  phone: ''
})

// 表单验证规则
const rules = {
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式', trigger: 'blur' }
  ]
}

// 加载用户信息
onMounted(() => {
  loadUserInfo()
  if (userInfo.value) {
    Object.assign(formData, userInfo.value)
  }
})

// 保存个人信息
const saveUserInfo = () => {
  // 实际项目中这里会调用API更新用户信息
  ElMessage.success('个人信息更新成功')
}

// 修改密码表单
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 密码验证规则
const passwordRules = {
  oldPassword: [
    { required: true, message: '请输入旧密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少为6个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    { 
      validator: (rule, value, callback) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 修改密码
const changePassword = () => {
  // 实际项目中这里会调用API修改密码
  ElMessage.success('密码修改成功')
  // 重置表单
  Object.keys(passwordForm).forEach(key => {
    passwordForm[key] = ''
  })
}
</script>

<template>
  <div class="personal-center">
    <div class="page-header">
      <h2>个人中心</h2>
    </div>
    
    <ElCard class="personal-info-card">
      <template #header>
        <div class="card-header">
          <span>个人信息</span>
        </div>
      </template>
      
      <div class="user-avatar-section">
        <ElAvatar size="large" :src="''" class="user-avatar">
          {{ userInfo?.name?.charAt(0) || 'U' }}
        </ElAvatar>
        <div class="user-basic-info">
          <h3>{{ userInfo?.name || '未登录' }}</h3>
          <ElTag size="small" type="info">{{ userInfo?.username || '无用户名' }}</ElTag>
        </div>
      </div>
      
      <ElDivider />
      
      <ElForm :model="formData" :rules="rules" ref="formRef" label-width="100px">
        <ElFormItem label="用户名" prop="username">
          <ElInput v-model="formData.username" disabled />
        </ElFormItem>
        <ElFormItem label="姓名" prop="name">
          <ElInput v-model="formData.name" />
        </ElFormItem>
        <ElFormItem label="邮箱" prop="email">
          <ElInput v-model="formData.email" />
        </ElFormItem>
        <ElFormItem label="手机号" prop="phone">
          <ElInput v-model="formData.phone" />
        </ElFormItem>
        <ElFormItem>
          <ElButton type="primary" @click="saveUserInfo">保存修改</ElButton>
        </ElFormItem>
      </ElForm>
    </ElCard>
    
    <ElCard class="password-card" style="margin-top: 20px;">
      <template #header>
        <div class="card-header">
          <span>修改密码</span>
        </div>
      </template>
      
      <ElForm :model="passwordForm" :rules="passwordRules" ref="passwordFormRef" label-width="100px">
        <ElFormItem label="旧密码" prop="oldPassword">
          <ElInput v-model="passwordForm.oldPassword" type="password" />
        </ElFormItem>
        <ElFormItem label="新密码" prop="newPassword">
          <ElInput v-model="passwordForm.newPassword" type="password" />
        </ElFormItem>
        <ElFormItem label="确认新密码" prop="confirmPassword">
          <ElInput v-model="passwordForm.confirmPassword" type="password" />
        </ElFormItem>
        <ElFormItem>
          <ElButton type="primary" @click="changePassword">修改密码</ElButton>
        </ElFormItem>
      </ElForm>
    </ElCard>
  </div>
</template>

<style scoped>
.personal-center {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #333;
  font-size: 18px;
  font-weight: bold;
}

.personal-info-card {
  max-width: 800px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user-avatar-section {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.user-avatar {
  width: 80px;
  height: 80px;
  font-size: 32px;
  margin-right: 20px;
}

.user-basic-info h3 {
  margin: 0 0 8px 0;
  color: #333;
}

.password-card {
  max-width: 600px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .personal-center {
    padding: 10px;
  }
  
  .user-avatar-section {
    flex-direction: column;
    text-align: center;
  }
  
  .user-avatar {
    margin-right: 0;
    margin-bottom: 10px;
  }
}
</style>