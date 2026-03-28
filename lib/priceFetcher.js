const OZ_TO_GRAM = 31.1035
const DUTY_GOLD = 0.06 // 6% import duty (5% BCD + 1% AIDC)
const DUTY_SILVER = 0.06
const MAKING_CHARGES_GOLD = 0.08 // 8% making charges
const MAKING_CHARGES_SILVER = 0.10 // 10% making charges for silver
const GST = 0.03 // 3% GST on making charges

function toFiniteNumber(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function calculateGoldRates(goldINRPerGram) {
  const landedPrice = goldINRPerGram * (1 + DUTY_GOLD)
  const withMaking = landedPrice * (1 + MAKING_CHARGES_GOLD)
  const withGST = withMaking * (1 + GST)

  return {
    '24K': Math.round(landedPrice),
    '22K': Math.round(landedPrice * (22 / 24)),
    '18K': Math.round(landedPrice * (18 / 24)),
    withMaking: Math.round(withMaking),
    finalWithGST: Math.round(withGST),
  }
}

export function calculateSilverRates(silverINRPerGram) {
  const landedPrice = silverINRPerGram * (1 + DUTY_SILVER)
  const withMaking = landedPrice * (1 + MAKING_CHARGES_SILVER)
  const withGST = withMaking * (1 + GST)

  return {
    perGram: Math.round(landedPrice),
    per10Gram: Math.round(landedPrice * 10),
    perKg: Math.round(landedPrice * 1000),
    withMaking: Math.round(withMaking),
    finalWithGST: Math.round(withGST),
  }
}

export function formatCurrency(value, currency = 'Rs. ') {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '--'
  return `${currency}${Number(value).toLocaleString('en-IN')}`
}

export function getPriceChange(current, previous) {
  const currentValue = toFiniteNumber(current)
  const previousValue = toFiniteNumber(previous)

  if (currentValue === null || previousValue === null || previousValue === 0) {
    return { change: 0, percentage: 0, direction: 'neutral' }
  }

  const change = currentValue - previousValue
  const percentage = (change / previousValue) * 100

  return {
    change: change.toFixed(2),
    percentage: percentage.toFixed(2),
    direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
  }
}
