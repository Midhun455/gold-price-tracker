const OZ_TO_GRAM = 31.1035
const DUTY_GOLD = 0.06 // 6% import duty
const DUTY_SILVER = 0.06
const MAKING_CHARGES = 0.08 // 8% making charges

export function calculateGoldRates(goldINRPerGram) {
  const landedPrice = goldINRPerGram * (1 + DUTY_GOLD)
  const withMaking = landedPrice * (1 + MAKING_CHARGES)
  
  return {
    '24K': Math.round(landedPrice),
    '22K': Math.round(landedPrice * (22/24)),
    '18K': Math.round(landedPrice * (18/24)),
    withMaking: Math.round(withMaking)
  }
}

export function calculateSilverRates(silverINRPerGram) {
  const landedPrice = silverINRPerGram * (1 + DUTY_SILVER)
  const withMaking = landedPrice * (1 + MAKING_CHARGES)
  
  return {
    perGram: Math.round(landedPrice),
    perKg: Math.round(landedPrice * 1000),
    withMaking: Math.round(withMaking)
  }
}

export function formatCurrency(value, currency = '₹') {
  if (!value) return '—'
  return `${currency}${value.toLocaleString('en-IN')}`
}
