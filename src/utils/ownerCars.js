const STORAGE_PREFIX = 'parking_owner_cars'

function normalizeCarNo(carNo) {
  return String(carNo || '').trim().toUpperCase()
}

function getStorageKey(userId) {
  return `${STORAGE_PREFIX}:${userId || 'anonymous'}`
}

function dedupeCars(cars = []) {
  const result = []
  const seen = new Set()

  cars.forEach((carNo) => {
    const normalized = normalizeCarNo(carNo)
    if (!normalized || seen.has(normalized)) {
      return
    }
    seen.add(normalized)
    result.push(normalized)
  })

  return result
}

export function getOwnerCars(userId) {
  if (!userId) return []

  try {
    const raw = localStorage.getItem(getStorageKey(userId))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? dedupeCars(parsed) : []
  } catch (error) {
    console.warn('读取车主车牌缓存失败:', error)
    return []
  }
}

export function rememberOwnerCars(userId, cars = []) {
  if (!userId) return []

  const mergedCars = dedupeCars([...getOwnerCars(userId), ...cars])
  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(mergedCars.slice(0, 12)))
  } catch (error) {
    console.warn('保存车主车牌缓存失败:', error)
  }
  return mergedCars
}

export function rememberOwnerCar(userId, carNo) {
  return rememberOwnerCars(userId, [carNo])
}
