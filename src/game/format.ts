const SYMBOLS: Record<string, string> = { ZAR: 'R', USD: '$', EUR: '€', GBP: '£' }

export function currencySymbol(code: string | undefined): string {
  if (!code) return 'R'
  return SYMBOLS[code.toUpperCase()] ?? `${code} `
}

/** R1,000.00 */
export function money(amount: number, symbol = 'R'): string {
  const sign = amount < 0 ? '-' : ''
  return `${sign}${symbol}${Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/** R5 / R2.50 — compact amounts for stake chips. */
export function shortMoney(amount: number, symbol = 'R'): string {
  return `${symbol}${Number.isInteger(amount) ? amount.toLocaleString('en-US') : amount.toFixed(2)}`
}

export function times(multiplier: number): string {
  return `${multiplier.toLocaleString('en-US')}×`
}
