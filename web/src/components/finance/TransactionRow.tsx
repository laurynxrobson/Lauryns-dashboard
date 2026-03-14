import { format, parseISO } from 'date-fns'
import type { BankTransaction } from '../../lib/api'

const CATEGORY_ICONS: Record<string, string> = {
  FOOD_AND_DRINK:      '🍽️',
  TRANSPORTATION:      '🚗',
  ENTERTAINMENT:       '🎬',
  GENERAL_MERCHANDISE: '🛍️',
  PERSONAL_CARE:       '💪',
  RENT_AND_UTILITIES:  '🏠',
  INCOME:              '💵',
  BANK_FEES:           '🏦',
  TRANSFER_IN:         '↩️',
  TRANSFER_OUT:        '↪️',
  MEDICAL:             '⚕️',
  TRAVEL:              '✈️',
}

function categoryIcon(tx: BankTransaction): string {
  const primary = tx.personal_finance_category?.primary ?? ''
  return CATEGORY_ICONS[primary] ?? '💳'
}

function categoryLabel(tx: BankTransaction): string {
  const raw = tx.personal_finance_category?.detailed ?? tx.personal_finance_category?.primary ?? ''
  return raw
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .split(' ')
    .slice(1)
    .join(' ') || 'Other'
}

interface Props {
  transaction: BankTransaction
}

export default function TransactionRow({ transaction: tx }: Props) {
  const isIncome = (tx.personal_finance_category?.primary ?? '') === 'INCOME' || tx.amount < 0
  const displayAmount = Math.abs(tx.amount)

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">
      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-base flex-shrink-0">
        {categoryIcon(tx)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-text-primary font-medium truncate">
          {tx.merchant_name ?? tx.name}
        </div>
        <div className="text-xs text-text-secondary">
          {categoryLabel(tx)} · {format(parseISO(tx.date), 'MMM d')}
        </div>
      </div>
      <div className={`text-sm font-semibold flex-shrink-0 ${isIncome ? 'text-green-600 dark:text-green-400' : 'text-text-primary'}`}>
        {isIncome ? '+' : '−'}R{displayAmount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
      </div>
    </div>
  )
}
