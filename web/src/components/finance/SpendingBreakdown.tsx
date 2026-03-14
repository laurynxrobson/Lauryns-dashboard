import type { BankTransaction } from '../../lib/api'

const CATEGORY_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  FOOD_AND_DRINK:      { label: 'Food & Drink',    icon: '🍽️', color: '#FB923C' },
  TRANSPORTATION:      { label: 'Transport',        icon: '🚗', color: '#60A5FA' },
  ENTERTAINMENT:       { label: 'Entertainment',    icon: '🎬', color: '#A78BFA' },
  GENERAL_MERCHANDISE: { label: 'Shopping',         icon: '🛍️', color: '#F472B6' },
  PERSONAL_CARE:       { label: 'Health & Fitness', icon: '💪', color: '#4ADE80' },
  RENT_AND_UTILITIES:  { label: 'Housing',          icon: '🏠', color: '#34D399' },
  BANK_FEES:           { label: 'Bank Fees',        icon: '🏦', color: '#9CA3AF' },
  TRAVEL:              { label: 'Travel',            icon: '✈️', color: '#FCD34D' },
  MEDICAL:             { label: 'Medical',           icon: '⚕️', color: '#6EE7B7' },
}

interface Props {
  transactions: BankTransaction[]
}

export default function SpendingBreakdown({ transactions }: Props) {
  // Sum spending (positive amounts = debits) by primary category, exclude income
  const totals: Record<string, number> = {}
  for (const tx of transactions) {
    const primary = tx.personal_finance_category?.primary ?? 'OTHER'
    if (primary === 'INCOME' || primary === 'TRANSFER_IN' || tx.amount <= 0) continue
    totals[primary] = (totals[primary] ?? 0) + tx.amount
  }

  const sorted = Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)

  const grandTotal = sorted.reduce((s, [, v]) => s + v, 0)

  if (sorted.length === 0) {
    return (
      <div className="text-center py-8 text-text-secondary text-sm">
        No spending data yet.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {sorted.map(([key, amount]) => {
        const config = CATEGORY_CONFIG[key] ?? { label: key, icon: '💳', color: '#9CA3AF' }
        const pct = grandTotal > 0 ? (amount / grandTotal) * 100 : 0
        return (
          <div key={key}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span>{config.icon}</span>
                <span className="text-sm text-text-primary">{config.label}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-text-secondary">{pct.toFixed(0)}%</span>
                <span className="text-sm font-semibold text-text-primary w-24 text-right">
                  R{amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: config.color }}
              />
            </div>
          </div>
        )
      })}
      <div className="flex justify-between pt-2 border-t border-border">
        <span className="text-xs text-text-secondary font-medium">Total spending</span>
        <span className="text-sm font-bold text-text-primary">
          R{grandTotal.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
        </span>
      </div>
    </div>
  )
}
