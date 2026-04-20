const ADMIN_ROLE_CODES = ['SUPER_ADMIN', 'ADMIN', '00', 'admin']

function normalizeCode(value) {
  if (value == null) return ''
  return String(value).trim()
}

function extractUser(source) {
  if (!source) return null
  if (source.user) return source.user
  return source
}

function extractRoles(source) {
  if (!source) return []
  if (Array.isArray(source.roles)) return source.roles.map(normalizeCode).filter(Boolean)
  const user = extractUser(source)
  if (Array.isArray(user?.roles)) return user.roles.map(normalizeCode).filter(Boolean)
  return []
}

export function getCurrentUserId(source) {
  const user = extractUser(source)
  return user?.userId ?? user?.id ?? null
}

export function isAdminUser(source) {
  const user = extractUser(source)
  const type = normalizeCode(user?.userType)
  if (ADMIN_ROLE_CODES.includes(type)) {
    return true
  }

  return extractRoles(source).some(role => ADMIN_ROLE_CODES.includes(role))
}

export function isOwnerUser(source) {
  if (isAdminUser(source)) {
    return false
  }

  const user = extractUser(source)
  const type = normalizeCode(user?.userType).toUpperCase()
  if (type === 'OWNER') {
    return true
  }

  return extractRoles(source).some(role => role.toUpperCase() === 'OWNER')
}

export function getUserRoleLabel(source) {
  const user = extractUser(source)
  const type = normalizeCode(user?.userType)
  const roleMap = {
    '00': '超级管理员',
    admin: '超级管理员',
    SUPER_ADMIN: '超级管理员',
    ADMIN: '管理员',
    INSPECTOR: '巡检员',
    OWNER: '车主'
  }

  if (roleMap[type]) {
    return roleMap[type]
  }

  const roles = extractRoles(source)
  const matchedRole = roles.find(role => roleMap[role])
  return roleMap[matchedRole] || type || '普通用户'
}
