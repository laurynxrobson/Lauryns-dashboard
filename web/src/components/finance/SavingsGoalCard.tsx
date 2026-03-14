import { useState } from 'react'
import { format, parseISO, differenceInDays } from 'date-fns'
import type { SavingsGoal } from '../../store/financeStore'
import { useFinanceStore } from '../../store/financeStore'

interface Props {
  goal: SavingsGoal
}

export default function SavingsGoalCard({ goal }: Props) {
  const { updateGoal, deleteGoal } = useFinanceStore()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(goal.currentAmount))

  const pct = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)
  const remaining = goal.targetAmount - goal.currentAmount
  const daysLeft = goal.deadline
    ? differenceInDays(parseISO(goal.deadline), new Date())
    : null

  function handleSave() {
    const val = parseFloat(draft)
    if (!isNaN(val)) updateGoal(goal.id, { currentAmount: Math.max(0, val) })
    setEditing(false)
  }

  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="text-sm font-semibold text-text-primary">{goal.name}</div>
          {goal.deadline && (
            <div className="text-xs text-text-secondary mt-0.5">
              {daysLeft !== null && daysLeft >= 0
                ? `${daysLeft} days left · `
                : daysLeft !== null
                ? 'Overdue · '
                : ''}
              Due {format(parseISO(goal.deadline), 'MMM d, yyyy')}
            </div>
          )}
        </div>
        <button
          onClick={() => deleteGoal(goal.id)}
          className="text-text-secondary hover:text-red-400 transition-colors text-xs p-1"
          title="Remove goal"
        >
          ✕
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: goal.color }}
        />
      </div>

      {/* Amounts */}
      <div className="flex items-center justify-between">
        <div>
          {editing ? (
            <div className="flex items-center gap-1">
              <span className="text-xs text-text-secondary">R</span>
              <input
                autoFocus
                type="number"
                min={0}
                className="w-24 text-sm font-semibold text-text-primary border border-border rounded px-2 py-0.5 focus:outline-none"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={handleSave}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              />
            </div>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="text-sm font-bold hover:opacity-70 transition-opacity"
              style={{ color: goal.color }}
              title="Click to update saved amount"
            >
              R{goal.currentAmount.toLocaleString('en-ZA', { minimumFractionDigits: 0 })}
            </button>
          )}
          <span className="text-xs text-text-secondary"> saved</span>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold text-text-primary">
            R{goal.targetAmount.toLocaleString('en-ZA', { minimumFractionDigits: 0 })}
          </div>
          <div className="text-xs text-text-secondary">
            R{remaining.toLocaleString('en-ZA', { minimumFractionDigits: 0 })} to go · {pct.toFixed(0)}%
          </div>
        </div>
      </div>
    </div>
  )
}
