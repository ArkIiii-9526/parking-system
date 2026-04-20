function pickValue(source, keys, fallback = null) {
  for (const key of keys) {
    const value = source?.[key]
    if (value !== undefined && value !== null) {
      return value
    }
  }
  return fallback
}

export function normalizeRole(role = {}) {
  const id = pickValue(role, ['id', 'roleId'])
  const name = pickValue(role, ['name', 'roleName'], '')
  const code = pickValue(role, ['code', 'roleCode'], '')

  return {
    ...role,
    id,
    roleId: id,
    name,
    roleName: name,
    code,
    roleCode: code,
    description: pickValue(role, ['description'], ''),
    status: pickValue(role, ['status'], 1),
    parentId: pickValue(role, ['parentId'], 0),
    dataScope: pickValue(role, ['dataScope'], 'ALL'),
    createTime: pickValue(role, ['createTime'])
  }
}

export function buildRolePayload(role = {}) {
  const normalizedRole = normalizeRole(role)
  const payload = {
    roleName: normalizedRole.name,
    roleCode: normalizedRole.code,
    parentId: normalizedRole.parentId,
    dataScope: normalizedRole.dataScope,
    description: normalizedRole.description,
    status: normalizedRole.status
  }

  if (normalizedRole.id !== undefined && normalizedRole.id !== null) {
    payload.roleId = normalizedRole.id
  }

  return payload
}

export function normalizePermissionType(type) {
  const typeMap = {
    DIR: 'MENU',
    MENU: 'MENU',
    BUTTON: 'BUTTON',
    API: 'API',
    DIRECTORY: 'MENU',
    CATALOG: 'MENU',
    0: 'MENU',
    1: 'MENU',
    2: 'BUTTON'
  }

  return typeMap[type] || type || 'MENU'
}

export function getPermissionTypeText(type) {
  const textMap = {
    MENU: '菜单',
    BUTTON: '按钮',
    API: '接口'
  }

  return textMap[normalizePermissionType(type)] || '未知'
}

export function getPermissionTypeTag(type) {
  const tagMap = {
    MENU: 'primary',
    BUTTON: 'warning',
    API: 'success'
  }

  return tagMap[normalizePermissionType(type)] || 'info'
}

export function normalizePermission(permission = {}) {
  const id = pickValue(permission, ['id', 'permissionId'])
  const name = pickValue(permission, ['name', 'permissionName'], '')
  const code = pickValue(permission, ['code', 'permissionCode'], '')
  const children = Array.isArray(permission.children)
    ? permission.children.map((item) => normalizePermission(item))
    : []

  return {
    ...permission,
    id,
    permissionId: id,
    name,
    permissionName: name,
    code,
    permissionCode: code,
    parentId: pickValue(permission, ['parentId'], 0),
    type: normalizePermissionType(pickValue(permission, ['type'], 'MENU')),
    path: pickValue(permission, ['path', 'url'], ''),
    url: pickValue(permission, ['url', 'path'], ''),
    component: pickValue(permission, ['component'], ''),
    icon: pickValue(permission, ['icon'], ''),
    sort: Number(pickValue(permission, ['sort'], 0) || 0),
    status: pickValue(permission, ['status'], 1),
    method: pickValue(permission, ['method']),
    isMenu: pickValue(permission, ['isMenu']),
    menuId: pickValue(permission, ['menuId']),
    createTime: pickValue(permission, ['createTime']),
    children
  }
}

export function normalizePermissionTree(permissionList = []) {
  if (!Array.isArray(permissionList)) {
    return []
  }

  if (permissionList.some(item => Array.isArray(item?.children) && item.children.length > 0)) {
    return permissionList.map(item => normalizePermission(item))
  }

  const nodeMap = new Map()
  const roots = []

  permissionList.forEach((item) => {
    const normalizedNode = normalizePermission(item)
    normalizedNode.children = []
    nodeMap.set(normalizedNode.id, normalizedNode)
  })

  nodeMap.forEach((node) => {
    if (node.parentId && nodeMap.has(node.parentId)) {
      nodeMap.get(node.parentId).children.push(node)
      return
    }

    roots.push(node)
  })

  return roots
}

export function flattenPermissionTree(permissionTree = [], level = 0) {
  return permissionTree.flatMap((item) => {
    const current = {
      ...item,
      displayName: `${'  '.repeat(level)}${item.name}`
    }

    return [current, ...flattenPermissionTree(item.children || [], level + 1)]
  })
}

export function collectPermissionIds(permissionTree = []) {
  return permissionTree.flatMap((item) => [
    item.id,
    ...collectPermissionIds(item.children || [])
  ]).filter(id => id !== undefined && id !== null)
}

export function buildPermissionPayload(permission = {}) {
  const normalizedPermission = normalizePermission(permission)
  const payload = {
    permissionName: normalizedPermission.name,
    permissionCode: normalizedPermission.code,
    parentId: normalizedPermission.parentId,
    type: normalizedPermission.type,
    url: normalizedPermission.url || normalizedPermission.path || '',
    component: normalizedPermission.component || null,
    icon: normalizedPermission.icon || null,
    sort: normalizedPermission.sort,
    status: normalizedPermission.status
  }

  if (normalizedPermission.method) {
    payload.method = normalizedPermission.method
  }
  if (normalizedPermission.isMenu !== undefined && normalizedPermission.isMenu !== null) {
    payload.isMenu = normalizedPermission.isMenu
  }
  if (normalizedPermission.menuId !== undefined && normalizedPermission.menuId !== null) {
    payload.menuId = normalizedPermission.menuId
  }
  if (normalizedPermission.id !== undefined && normalizedPermission.id !== null) {
    payload.permissionId = normalizedPermission.id
  }

  return payload
}
