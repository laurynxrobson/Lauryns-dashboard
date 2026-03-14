import type { BankAccount } from '../../lib/api'

const BANK_ICONS: Record<string, string> = {
  Investec:        '🏦',
  'Discovery Bank':'💙',
  Capitec:         '🟢',
  FNB:             '🔴',
  'Standard Bank': '🔵',
  Nedbank:         '🟩',
  Absa:            '🔴',
  TymeBank:        '🟡',
}

const SUBTYPE_ICONS: Record<string, string> = {
  current:    '🏦',
  cheque:     '🏦',
  savings:    '💰',
  credit:     '💳',
  investment: '📈',
}

interface Props {
  account: BankAccount
}

function zarFormat(amount: number): string {
  return `R${Math.abs(amount).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`
}

export default function AccountCard({ account }: Props) {
  const icon = (account.bank && BANK_ICONS[account.bank]) ?? SUBTYPE_ICONS[account.subtype ?? ''] ?? '🏦'
  const balance = account.balances.available ?? account.balances.current ?? 0
  const isNegative = balance < 0

  return (
    <div className="bg-card rounded-xl border border-border p-4 flex-1 min-w-[160px]">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xl">{icon}</span>
        <span className="text-xs text-text-secondary bg-muted rounded px-1.5 py-0.5 capitalize">
          {account.bank ?? account.subtype ?? account.type}
        </span>
      </div>
      <div
        className={`text-2xl font-bold mb-1 ${isNegative ? 'text-red-500' : 'text-text-primary'}`}
      >
        {isNegative ? '−' : ''}{zarFormat(balance)}
      </div>
      <div className="text-xs text-text-secondary truncate">{account.name}</div>
      {account.mask && (
        <div className="text-xs text-text-secondary opacity-60">···· {account.mask}</div>
      )}
    </div>
  )
}
