const FALLBACKS = {
  primary: '#6366F1',
  primarySoft: '#818CF8',
  secondary: '#10B981',
  secondarySoft: '#34D399',
  warning: '#F59E0B',
  warningSoft: '#FBBF24',
  accent: '#F43F5E',
  accentSoft: '#FB7185',
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.85)',
  textMuted: 'rgba(255, 255, 255, 0.4)',
  inverse: '#FFFFFF',
  surface: 'rgba(255, 255, 255, 0.08)',
  panel: '#1A1A2E',
  border: 'rgba(255, 255, 255, 0.1)',
  subtle: 'rgba(255, 255, 255, 0.06)'
}

function readCssVar(name, fallback) {
  if (typeof window === 'undefined') return fallback
  const value = window.getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value || fallback
}

function parseColor(color) {
  if (!color) return null

  const normalized = color.trim()

  if (normalized.startsWith('#')) {
    const hex = normalized.slice(1)
    const chunkSize = hex.length === 3 ? 1 : 2
    const values = hex.match(new RegExp(`.{1,${chunkSize}}`, 'g'))
    if (!values || values.length < 3) return null
    const [r, g, b] = values.map((value) => {
      const expanded = chunkSize === 1 ? value.repeat(2) : value
      return Number.parseInt(expanded, 16)
    })
    return [r, g, b]
  }

  const rgbMatch = normalized.match(/rgba?\(([^)]+)\)/)
  if (!rgbMatch) return null

  const [r, g, b] = rgbMatch[1]
    .split(',')
    .slice(0, 3)
    .map((value) => Number.parseFloat(value.trim()))

  return [r, g, b]
}

export function withAlpha(color, alpha) {
  const channels = parseColor(color)
  if (!channels) return color
  return `rgba(${channels[0]}, ${channels[1]}, ${channels[2]}, ${alpha})`
}

export function createVerticalGradient(start, end) {
  return {
    type: 'linear',
    x: 0,
    y: 0,
    x2: 0,
    y2: 1,
    colorStops: [
      { offset: 0, color: start },
      { offset: 1, color: end }
    ]
  }
}

export function createAreaGradient(color, startAlpha = 0.35, endAlpha = 0.06) {
  return createVerticalGradient(withAlpha(color, startAlpha), withAlpha(color, endAlpha))
}

export function ensureChartInstance(echartsLib, dom, instance) {
  if (!dom) return instance
  return instance || echartsLib.getInstanceByDom(dom) || echartsLib.init(dom)
}

export function observeThemeChange(callback) {
  if (typeof window === 'undefined' || typeof MutationObserver === 'undefined') {
    return () => {}
  }

  const observer = new MutationObserver(() => callback())
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class']
  })

  return () => observer.disconnect()
}

export function getAnalyticsTheme() {
  const primary = readCssVar('--primary-500', FALLBACKS.primary)
  const primarySoft = readCssVar('--primary-400', FALLBACKS.primarySoft)
  const secondary = readCssVar('--secondary-500', FALLBACKS.secondary)
  const secondarySoft = readCssVar('--secondary-400', FALLBACKS.secondarySoft)
  const warning = readCssVar('--warning-500', FALLBACKS.warning)
  const warningSoft = readCssVar('--warning-400', FALLBACKS.warningSoft)
  const accent = readCssVar('--accent-500', FALLBACKS.accent)
  const accentSoft = readCssVar('--accent-400', FALLBACKS.accentSoft)
  const textPrimary = readCssVar('--text-primary', FALLBACKS.textPrimary)
  const textSecondary = readCssVar('--text-secondary', FALLBACKS.textSecondary)
  const textMuted = readCssVar('--text-muted', FALLBACKS.textMuted)

  return {
    primary,
    primarySoft,
    secondary,
    secondarySoft,
    warning,
    warningSoft,
    accent,
    accentSoft,
    textPrimary,
    textSecondary,
    textMuted,
    inverse: readCssVar('--text-inverse', FALLBACKS.inverse),
    surface: readCssVar('--glass-bg', FALLBACKS.surface),
    panel: readCssVar('--bg-secondary', FALLBACKS.panel),
    border: readCssVar('--glass-border', FALLBACKS.border),
    subtle: readCssVar('--border-subtle', FALLBACKS.subtle),
    axisLine: withAlpha(textSecondary, 0.32),
    splitLine: withAlpha(textSecondary, 0.12)
  }
}
