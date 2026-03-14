import type { PlaidAccount } from '../../lib/api'

const SUBTYPE_ICONS: Record<string, string> = {
  checking: '🏦',
  savings: '💰',
  credit: '💳',
  investment: '📈',
}

interface Props {
  account: PlaidAccount
}

export default function AccountCard({ account }: Props) {
  const icon = SUBTYPE_ICONS[account.subtype ?? ''] ?? '🏦'
  const balance = account.balances.available ?? account.balances.current ?? 0
  const isNegative = balance < 0

  return (
    <div className="bg-white rounded-xl border border-border p-4 flex-1 min-w-[160px]">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xl">{icon}</span>
        <span className="text-xs text-text-secondary bg-muted rounded px-1.5 py-0.5 capitalize">
          {account.subtype ?? account.type}
        </span>
      </div>
      <div
        className={`text-2xl font-bold mb-1 ${isNegative ? 'text-red-500' : 'text-text-primary'}`}
      >
        {isNegative ? '−' : ''}${Math.abs(balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
      </div>
      <div className="text-xs text-text-secondary truncate">{account.name}</div>
      {account.mask && (
        <div className="text-xs text-text-secondary opacity-60">···· {account.mask}</div>
      )}
    </div>
  )
}
