function pad(value) {
  return String(value).padStart(2, '0')
}

export function formatLocalDate(date = new Date()) {
  const value = date instanceof Date ? new Date(date) : new Date(date)
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`
}

export function shiftDate(date, days) {
  const value = date instanceof Date ? new Date(date) : new Date(date)
  value.setDate(value.getDate() + days)
  return value
}

export function getRecentDateRange(days, endDate = new Date()) {
  const safeDays = Math.max(Number(days) || 1, 1)
  const end = endDate instanceof Date ? new Date(endDate) : new Date(endDate)
  const start = shiftDate(end, -(safeDays - 1))
  return {
    startDate: formatLocalDate(start),
    endDate: formatLocalDate(end)
  }
}

export function getPeriodDateRange(period, endDate = new Date()) {
  const end = endDate instanceof Date ? new Date(endDate) : new Date(endDate)
  const start = new Date(end)

  if (period === 'month') {
    start.setDate(1)
  } else if (period === 'week') {
    const day = end.getDay() || 7
    start.setDate(end.getDate() - day + 1)
  }

  return {
    startDate: formatLocalDate(start),
    endDate: formatLocalDate(end)
  }
}

export function enumerateLocalDates(startDate, endDate) {
  const result = []
  const current = new Date(startDate)
  const end = new Date(endDate)

  while (current <= end) {
    result.push(formatLocalDate(current))
    current.setDate(current.getDate() + 1)
  }

  return result
}
