<script setup>
import { computed, shallowRef, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import {
  createBillingRule,
  disableBillingRule,
  getBillingRulePage,
  getBillingRulesByParking
} from '@/api/billingRule'
import { hasPermission } from '@/utils/hasPermission'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  parking: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'bound'])

const router = useRouter()
const loading = shallowRef(false)
const binding = shallowRef(false)
const currentRule = shallowRef(null)
const ruleTemplates = shallowRef([])
const activeParkingRules = shallowRef([])
const selectedRuleId = shallowRef(null)

const canViewRuleCenter = computed(() => hasPermission('billing:rule:view'))
const canCreateParkingRule = computed(() => hasPermission('billing:rule:add'))
const canDisableParkingRule = computed(() => hasPermission('billing:rule:disable'))

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const selectedRule = computed(() => {
  return ruleTemplates.value.find(rule => rule.id === selectedRuleId.value) || null
})

const currentRuleScopeLabel = computed(() => {
  if (!currentRule.value) return '未命中有效规则'
  if (currentRule.value.parkingId === props.parking?.id) return '当前使用停车场专属规则'
  return '当前使用通用规则'
})

const bindingHint = computed(() => {
  if (!canCreateParkingRule.value) {
    return '当前账号没有新增计费规则权限，暂时只能查看规则，无法执行绑定。'
  }
  if (activeParkingRules.value.length > 0 && !canDisableParkingRule.value) {
    return '当前停车场已经存在专属规则，切换前需要先停用旧规则，请补充禁用规则权限。'
  }
  if (!selectedRule.value) {
    return '请选择一条已启用且当前生效的规则模板，系统会复制为当前停车场的专属规则。'
  }
  if (activeParkingRules.value.some(rule => rule.id === selectedRule.value.id)) {
    return '当前停车场已经启用了这条专属规则，无需重复绑定。'
  }
  return '绑定时会复制所选规则，不会改动原有通用规则或其他停车场的规则。'
})

const canBindSelectedRule = computed(() => {
  if (!selectedRule.value || !canCreateParkingRule.value) return false
  if (activeParkingRules.value.length > 0 && !canDisableParkingRule.value) return false
  return !activeParkingRules.value.some(rule => rule.id === selectedRule.value.id)
})

watch(
  () => [props.modelValue, props.parking?.id],
  async ([visible, parkingId]) => {
    if (!visible || !parkingId) {
      if (!visible) {
        resetDialogState()
      }
      return
    }
    await loadDialogData(parkingId)
  }
)

function resetDialogState() {
  loading.value = false
  binding.value = false
  currentRule.value = null
  ruleTemplates.value = []
  activeParkingRules.value = []
  selectedRuleId.value = null
}

function closeDialog() {
  dialogVisible.value = false
}

function navigateToRuleCenter() {
  closeDialog()
  router.push('/billing-rule')
}

function normalizeBillingRule(rule = {}) {
  return {
    id: rule.id ?? null,
    ruleName: rule.ruleName ?? rule.name ?? '',
    ruleCode: rule.ruleCode ?? '',
    parkingId: rule.parkingId ?? null,
    ruleType: rule.ruleType ?? 1,
    baseFee: rule.baseFee ?? rule.firstHourFee ?? 0,
    baseTime: rule.baseTime ?? 60,
    unitFee: rule.unitFee ?? rule.hourlyFee ?? 0,
    unitTime: rule.unitTime ?? 60,
    dailyCap: rule.dailyCap ?? rule.maxFee ?? 0,
    monthlyCap: rule.monthlyCap ?? 0,
    freeMinutes: rule.freeMinutes ?? 0,
    graceMinutes: rule.graceMinutes ?? 0,
    is24h: rule.is24h ?? 1,
    dayStartTime: rule.dayStartTime ?? null,
    dayEndTime: rule.dayEndTime ?? null,
    dayUnitFee: rule.dayUnitFee ?? 0,
    nightUnitFee: rule.nightUnitFee ?? 0,
    holidayMultiplier: rule.holidayMultiplier ?? 1,
    isActive: rule.isActive ?? rule.status ?? 0,
    effectiveDate: rule.effectiveDate ?? null,
    expireDate: rule.expireDate ?? null,
    remark: rule.remark ?? rule.description ?? ''
  }
}

function extractRecords(response) {
  if (Array.isArray(response?.data?.records)) {
    return response.data.records
  }
  if (Array.isArray(response?.data)) {
    return response.data
  }
  return []
}

function parseDateBoundary(value, boundary) {
  if (!value) return null
  if (typeof value === 'string' && !value.includes('T')) {
    return new Date(`${value}T${boundary}`)
  }
  return new Date(value)
}

function isRuleEffective(rule) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const effectiveDate = parseDateBoundary(rule.effectiveDate, '00:00:00')
  const expireDate = parseDateBoundary(rule.expireDate, '23:59:59')
  if (effectiveDate && effectiveDate > today) return false
  if (expireDate && expireDate < today) return false
  return true
}

function dedupeById(rules = []) {
  const seen = new Set()
  return rules.filter((rule) => {
    if (rule.id == null || seen.has(rule.id)) return false
    seen.add(rule.id)
    return true
  })
}

function getRuleTypeText(ruleType) {
  const typeMap = {
    1: '按时计费',
    2: '按次计费',
    3: '分时段计费',
    4: '包月计费'
  }
  return typeMap[ruleType] || '自定义规则'
}

function getRuleScopeLabel(rule) {
  if (rule.parkingId == null) return '通用规则'
  if (rule.parkingId === props.parking?.id) return '当前停车场专属'
  return `停车场专属 #${rule.parkingId}`
}

function formatCurrency(value) {
  const amount = Number(value ?? 0)
  if (Number.isNaN(amount)) return '￥0.00'
  return `￥${amount.toFixed(2)}`
}

function generateBillingRuleCode() {
  const now = new Date()
  const pad = (value, length = 2) => String(value).padStart(length, '0')
  const timestamp = [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds()),
    pad(now.getMilliseconds(), 3)
  ].join('')
  const randomSuffix = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `RULE_${timestamp}_${randomSuffix}`
}

function buildParkingRulePayload(rule, parking) {
  return {
    ruleName: rule.ruleName,
    ruleCode: generateBillingRuleCode(),
    parkingId: parking.id,
    ruleType: rule.ruleType,
    baseFee: rule.baseFee,
    baseTime: rule.baseTime,
    unitFee: rule.unitFee,
    unitTime: rule.unitTime,
    dailyCap: rule.dailyCap,
    monthlyCap: rule.monthlyCap,
    freeMinutes: rule.freeMinutes,
    graceMinutes: rule.graceMinutes,
    is24h: rule.is24h,
    dayStartTime: rule.dayStartTime,
    dayEndTime: rule.dayEndTime,
    dayUnitFee: rule.dayUnitFee,
    nightUnitFee: rule.nightUnitFee,
    holidayMultiplier: rule.holidayMultiplier,
    isActive: 1,
    effectiveDate: rule.effectiveDate,
    expireDate: rule.expireDate,
    remark: rule.remark
  }
}

async function loadDialogData(parkingId) {
  loading.value = true
  selectedRuleId.value = null
  try {
    const [currentRuleRes, templatesRes, activeParkingRulesRes] = await Promise.all([
      getBillingRulesByParking(parkingId),
      getBillingRulePage({ pageNo: 1, pageSize: 200, isActive: 1 }),
      getBillingRulePage({ pageNo: 1, pageSize: 50, parkingId, isActive: 1 })
    ])

    currentRule.value = typeof currentRuleRes.data === 'string'
      ? null
      : normalizeBillingRule(currentRuleRes.data)

    activeParkingRules.value = extractRecords(activeParkingRulesRes)
      .map(normalizeBillingRule)
      .filter(rule => rule.isActive === 1)

    const normalizedTemplates = extractRecords(templatesRes)
      .map(normalizeBillingRule)
      .filter(rule => rule.isActive === 1 && isRuleEffective(rule))

    if (currentRule.value && !normalizedTemplates.some(rule => rule.id === currentRule.value.id)) {
      normalizedTemplates.unshift(currentRule.value)
    }

    ruleTemplates.value = dedupeById(normalizedTemplates)
  } catch (error) {
    console.error('加载计费规则绑定数据失败:', error)
    ruleTemplates.value = []
    activeParkingRules.value = []
    currentRule.value = null
  } finally {
    loading.value = false
  }
}

async function bindSelectedRule() {
  if (!props.parking?.id) {
    ElMessage.warning('请先选择停车场')
    return
  }
  if (!selectedRule.value) {
    ElMessage.warning('请选择要绑定的规则')
    return
  }
  if (!canBindSelectedRule.value) {
    ElMessage.warning(bindingHint.value)
    return
  }

  const parkingName = props.parking?.name || `停车场 #${props.parking.id}`
  const hasDedicatedRule = activeParkingRules.value.length > 0

  try {
    if (hasDedicatedRule) {
      await ElMessageBox.confirm(
        `“${parkingName}”当前已经有专属计费规则。继续后会先停用现有专属规则，再复制所选规则作为新的停车场专属规则。`,
        '切换计费规则',
        {
          type: 'warning',
          confirmButtonText: '继续绑定',
          cancelButtonText: '取消'
        }
      )
    }

    binding.value = true

    for (const rule of activeParkingRules.value) {
      await disableBillingRule(rule.id)
    }

    const payload = buildParkingRulePayload(selectedRule.value, props.parking)
    const res = await createBillingRule(payload)

    if (res.code === 200) {
      ElMessage.success('已为当前停车场绑定专属计费规则')
      emit('bound', {
        parkingId: props.parking.id,
        ruleId: res.data,
        ruleName: selectedRule.value.ruleName
      })
      closeDialog()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('绑定计费规则失败:', error)
    }
  } finally {
    binding.value = false
  }
}
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    title="绑定计费规则"
    width="680px"
    destroy-on-close
    class="parking-billing-rule-dialog"
  >
    <div class="billing-rule-dialog">
      <section class="dialog-hero">
        <div class="hero-copy">
          <p class="hero-eyebrow">停车场规则绑定</p>
          <h3 class="hero-title">{{ parking?.name || '未选择停车场' }}</h3>
          <p class="hero-desc">为当前停车场复制一条专属计费规则；没有专属规则时，系统会回退到通用规则。</p>
        </div>
        <el-tag size="large" effect="dark" :type="currentRule?.parkingId === parking?.id ? 'success' : 'info'">
          {{ currentRuleScopeLabel }}
        </el-tag>
      </section>

      <div v-loading="loading" class="dialog-body">
        <section class="rule-card">
          <div class="section-head">
            <div>
              <h4 class="section-title">当前生效规则</h4>
              <p class="section-subtitle">这里只展示当前停车场实际命中的规则。</p>
            </div>
            <button v-if="canViewRuleCenter" class="section-link" @click="navigateToRuleCenter">
              打开规则管理
            </button>
          </div>

          <template v-if="currentRule">
            <div class="current-rule-name">{{ currentRule.ruleName }}</div>
            <div class="rule-meta-list">
              <span class="rule-meta-chip">{{ getRuleScopeLabel(currentRule) }}</span>
              <span class="rule-meta-chip">{{ getRuleTypeText(currentRule.ruleType) }}</span>
              <span class="rule-meta-chip">免费 {{ currentRule.freeMinutes || 0 }} 分钟</span>
              <span class="rule-meta-chip">基础 {{ formatCurrency(currentRule.baseFee) }}</span>
              <span class="rule-meta-chip">续费 {{ formatCurrency(currentRule.unitFee) }}</span>
            </div>
            <p class="rule-remark">
              {{ currentRule.remark || '当前规则未填写补充说明。' }}
            </p>
          </template>
          <el-empty
            v-else
            description="当前停车场没有命中有效计费规则，请先在计费规则管理中创建并启用规则。"
            :image-size="80"
          />
        </section>

        <section class="rule-card">
          <div class="section-head">
            <div>
              <h4 class="section-title">选择绑定模板</h4>
              <p class="section-subtitle">绑定时会复制模板规则，不会直接修改原规则。</p>
            </div>
          </div>

          <el-empty
            v-if="!ruleTemplates.length"
            description="暂无可绑定的已启用规则，请先到计费规则管理新增并启用规则。"
            :image-size="84"
          />

          <template v-else>
            <el-form label-width="96px" class="bind-form">
              <el-form-item label="规则模板">
                <el-select
                  v-model="selectedRuleId"
                  clearable
                  filterable
                  placeholder="请选择要绑定的规则"
                  style="width: 100%"
                >
                  <el-option
                    v-for="rule in ruleTemplates"
                    :key="rule.id"
                    :label="rule.ruleName"
                    :value="rule.id"
                  >
                    <div class="rule-option">
                      <span class="rule-option-name">{{ rule.ruleName }}</span>
                      <span class="rule-option-meta">
                        {{ getRuleScopeLabel(rule) }} · {{ getRuleTypeText(rule.ruleType) }}
                      </span>
                    </div>
                  </el-option>
                </el-select>
              </el-form-item>
            </el-form>

            <div v-if="selectedRule" class="selected-preview">
              <div class="selected-preview-head">
                <span class="selected-preview-title">即将复制的规则</span>
                <span class="selected-preview-badge">{{ getRuleScopeLabel(selectedRule) }}</span>
              </div>
              <div class="selected-preview-name">{{ selectedRule.ruleName }}</div>
              <div class="rule-meta-list">
                <span class="rule-meta-chip">{{ getRuleTypeText(selectedRule.ruleType) }}</span>
                <span class="rule-meta-chip">免费 {{ selectedRule.freeMinutes || 0 }} 分钟</span>
                <span class="rule-meta-chip">基础 {{ formatCurrency(selectedRule.baseFee) }}</span>
                <span class="rule-meta-chip">续费 {{ formatCurrency(selectedRule.unitFee) }}</span>
              </div>
            </div>
          </template>

          <el-alert
            class="binding-alert"
            type="info"
            show-icon
            :closable="false"
            :title="bindingHint"
          />
        </section>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="closeDialog">关闭</el-button>
        <el-button v-if="canViewRuleCenter" @click="navigateToRuleCenter">规则管理</el-button>
        <el-button
          type="primary"
          :loading="binding"
          :disabled="!canBindSelectedRule"
          @click="bindSelectedRule"
        >
          绑定到当前停车场
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.billing-rule-dialog {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.dialog-hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 20px;
  border-radius: 20px;
  background:
    radial-gradient(circle at top right, rgba(16, 185, 129, 0.18), transparent 40%),
    linear-gradient(140deg, rgba(15, 23, 42, 0.94), rgba(30, 41, 59, 0.92));
  color: #f8fafc;
}

.hero-copy {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.hero-eyebrow {
  margin: 0;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(226, 232, 240, 0.76);
}

.hero-title {
  margin: 0;
  font-size: 24px;
  line-height: 1.2;
  color: #ffffff;
}

.hero-desc {
  margin: 0;
  max-width: 460px;
  font-size: 14px;
  line-height: 1.7;
  color: rgba(226, 232, 240, 0.9);
}

.dialog-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 220px;
}

.rule-card {
  padding: 18px;
  border-radius: 18px;
  background: var(--glass-bg, rgba(255, 255, 255, 0.88));
  border: 1px solid var(--glass-border, rgba(148, 163, 184, 0.2));
}

.section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.section-title {
  margin: 0;
  font-size: 15px;
  color: var(--text-primary);
}

.section-subtitle {
  margin: 6px 0 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--text-tertiary);
}

.section-link {
  padding: 0;
  background: none;
  border: none;
  color: var(--primary-500);
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
}

.current-rule-name,
.selected-preview-name {
  margin: 0 0 12px;
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

.rule-meta-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.rule-meta-chip {
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(15, 118, 110, 0.08);
  color: #0f766e;
  font-size: 12px;
  font-weight: 600;
}

.rule-remark {
  margin: 14px 0 0;
  font-size: 13px;
  line-height: 1.7;
  color: var(--text-secondary);
}

.bind-form {
  margin-bottom: 12px;
}

.rule-option {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 3px 0;
}

.rule-option-name {
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 600;
}

.rule-option-meta {
  color: var(--text-tertiary);
  font-size: 12px;
}

.selected-preview {
  margin-top: 12px;
  padding: 14px;
  border-radius: 16px;
  background: rgba(15, 23, 42, 0.04);
  border: 1px solid rgba(148, 163, 184, 0.18);
}

.selected-preview-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.selected-preview-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-secondary);
}

.selected-preview-badge {
  font-size: 12px;
  color: var(--text-tertiary);
}

.binding-alert {
  margin-top: 14px;
}

.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}

@media (max-width: 768px) {
  .dialog-hero {
    flex-direction: column;
  }

  .section-head,
  .selected-preview-head,
  .dialog-footer {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
