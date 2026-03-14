import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { format } from 'date-fns'
import DashboardLayout from '../components/layout/DashboardLayout'
import AccountCard from '../components/finance/AccountCard'
import TransactionRow from '../components/finance/TransactionRow'
import SpendingBreakdown from '../components/finance/SpendingBreakdown'
import SavingsGoalCard from '../components/finance/SavingsGoalCard'
import { useFinanceStore, type SavingsGoal } from '../store/financeStore'
import { stitchApi } from '../lib/api'

export default function FinancePage() {
  const {
    accounts,
    transactions,
    goals,
    connected,
    isMock,
    isLoading,
    lastSynced,
    error,
    checkConnection,
    connectWithCode,
    syncFinanceData,
    addGoal,
  } = useFinanceStore()

  // Stitch OAuth callback — detect ?code= in the URL after redirect
  const [searchParams, setSearchParams] = useSearchParams()
  const oauthCode = searchParams.get('code')

  const [showGoalModal, setShowGoalModal] = useState(false)
  const [goalDraft, setGoalDraft] = useState({
    name: '', targetAmount: '', currentAmount: '', deadline: '', color: '#4ADE80',
  })
  const [txFilter, setTxFilter] = useState<'all' | 'spending' | 'income'>('all')

  // Handle Stitch OAuth redirect callback
  useEffect(() => {
    if (oauthCode) {
      // Remove code from URL immediately so it's not re-processed on refresh
      setSearchParams({}, { replace: true })
      connectWithCode(oauthCode)
    } else {
      checkConnection()
    }
  }, [])

  async function handleConnectBank() {
    try {
      const { url, mock } = await stitchApi.getLinkUrl()
      if (mock || !url) {
        // Mock mode — just sync immediately with demo data
        await syncFinanceData()
        return
      }
      // Real Stitch Link — redirect user to OAuth consent screen
      window.location.href = url
    } catch {
      alert('Could not reach server. Run: cd server && npm run dev')
    }
  }

  function handleAddGoal() {
    const target = parseFloat(goalDraft.targetAmount)
    const current = parseFloat(goalDraft.currentAmount || '0')
    if (!goalDraft.name.trim() || isNaN(target)) return
    const newGoal: Omit<SavingsGoal, 'id'> = {
      name: goalDraft.name.trim(),
      targetAmount: target,
      currentAmount: current,
      color: goalDraft.color,
    }
    if (goalDraft.deadline) newGoal.deadline = goalDraft.deadline
    addGoal(newGoal)
    setGoalDraft({ name: '', targetAmount: '', currentAmount: '', deadline: '', color: '#4ADE80' })
    setShowGoalModal(false)
  }

  // Summary numbers
  const netWorth = accounts.reduce((s, a) => s + (a.balances.current ?? 0), 0)
  const thisMonth = format(new Date(), 'yyyy-MM')
  const monthlySpending = transactions
    .filter((tx) => tx.date.startsWith(thisMonth) && tx.amount > 0 && tx.personal_finance_category?.primary !== 'INCOME')
    .reduce((s, tx) => s + tx.amount, 0)

  const filteredTx = transactions.filter((tx) => {
    if (txFilter === 'income') return tx.personal_finance_category?.primary === 'INCOME' || tx.amount < 0
    if (txFilter === 'spending') return tx.amount > 0 && tx.personal_finance_category?.primary !== 'INCOME'
    return true
  })

  const GOAL_COLORS = ['#4ADE80', '#60A5FA', '#A78BFA', '#FB923C', '#F472B6', '#34D399']

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs text-text-secondary mb-1">
              {format(new Date(), 'EEEE, MMMM d')}
            </p>
            <h1 className="text-2xl font-semibold text-text-primary">Finance</h1>
            {lastSynced && (
              <p className="text-xs text-text-secondary mt-0.5">
                {isMock ? 'Demo data · ' : 'Stitch · '}
                Synced {format(new Date(lastSynced), 'h:mm a')}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {!connected && (
              <button
                onClick={handleConnectBank}
                disabled={isLoading}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-text-primary text-surface hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {isLoading ? 'Connecting…' : 'Connect Bank'}
              </button>
            )}
            {connected && (
              <button
                onClick={syncFinanceData}
                disabled={isLoading}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-border text-text-secondary hover:bg-muted transition-colors"
              >
                {isLoading ? '↻' : '↻ Sync'}
              </button>
            )}
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Demo mode banner */}
        {isMock && !error && (
          <div className="mb-6 bg-blue-500/10 border border-blue-500/30 rounded-xl px-4 py-3 text-sm text-blue-600 dark:text-blue-400">
            <span className="font-semibold">Demo mode</span> — showing sample data for Investec,
            Discovery Bank &amp; Capitec. Add{' '}
            <code className="text-xs bg-blue-500/10 px-1 rounded">STITCH_CLIENT_ID</code> to{' '}
            <code className="text-xs bg-blue-500/10 px-1 rounded">server/.env</code> to connect your real
            accounts via{' '}
            <a
              href="https://docs.stitch.money/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Stitch
            </a>
            .
          </div>
        )}

        {/* Net Worth */}
        {accounts.length > 0 && (
          <div className="bg-card rounded-xl border border-border p-5 mb-6">
            <p className="text-xs text-text-secondary uppercase tracking-wide mb-1">Net Worth</p>
            <p className="text-4xl font-bold text-text-primary">
              R{netWorth.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-sm text-text-secondary mt-1">
              Spent this month: R{monthlySpending.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
            </p>
          </div>
        )}

        {/* Accounts */}
        {accounts.length > 0 && (
          <div className="mb-6">
            <SectionTitle icon="🏦" title="Accounts" count={accounts.length} />
            <div className="flex gap-3 flex-wrap">
              {accounts.map((a) => (
                <AccountCard key={a.account_id} account={a} />
              ))}
            </div>
          </div>
        )}

        {/* Spending Breakdown */}
        {transactions.length > 0 && (
          <div className="mb-6">
            <SectionTitle icon="📊" title="Spending Breakdown" />
            <div className="bg-card rounded-xl border border-border p-4">
              <SpendingBreakdown transactions={transactions} />
            </div>
          </div>
        )}

        {/* Savings Goals */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <SectionTitle icon="🎯" title="Savings Goals" count={goals.length} />
            <button
              onClick={() => setShowGoalModal(true)}
              className="text-xs text-text-secondary hover:text-text-primary px-2 py-1 rounded hover:bg-muted transition-colors"
            >
              + Add Goal
            </button>
          </div>
          <div className="space-y-3">
            {goals.map((g) => (
              <SavingsGoalCard key={g.id} goal={g} />
            ))}
            {goals.length === 0 && (
              <p className="text-sm text-text-secondary text-center py-6">
                No savings goals yet.
              </p>
            )}
          </div>
        </div>

        {/* Transactions */}
        {transactions.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <SectionTitle icon="📋" title="Recent Transactions" />
              <div className="flex gap-1">
                {(['all', 'spending', 'income'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setTxFilter(f)}
                    className={`text-xs px-2.5 py-1 rounded-full capitalize transition-colors ${
                      txFilter === f
                        ? 'bg-text-primary text-surface'
                        : 'text-text-secondary hover:bg-muted'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-card rounded-xl border border-border px-4 py-1">
              {filteredTx.slice(0, 20).map((tx) => (
                <TransactionRow key={tx.transaction_id} transaction={tx} />
              ))}
              {filteredTx.length === 0 && (
                <p className="text-sm text-text-secondary text-center py-6">No transactions found.</p>
              )}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!connected && !isLoading && accounts.length === 0 && !error && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🏦</div>
            <h2 className="text-lg font-semibold text-text-primary mb-2">
              Connect Investec, Discovery or Capitec
            </h2>
            <p className="text-sm text-text-secondary max-w-xs mx-auto mb-6">
              Link your South African bank accounts via Stitch Open Finance to see live
              balances, transactions, and savings insights.
            </p>
            <button
              onClick={handleConnectBank}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-text-primary text-surface hover:opacity-90 transition-opacity"
            >
              Connect Bank Account
            </button>
            <p className="text-xs text-text-secondary mt-3">
              Powered by{' '}
              <a
                href="https://stitch.money"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Stitch
              </a>{' '}
              · No credentials stored · Read-only
            </p>
          </div>
        )}
      </div>

      {/* Add Goal Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl p-6 w-full max-w-sm">
            <h2 className="text-base font-bold text-text-primary mb-4">New Savings Goal</h2>
            <div className="space-y-3 mb-5">
              <input
                autoFocus
                type="text"
                placeholder="Goal name (e.g. Emergency Fund)"
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none bg-surface text-text-primary"
                value={goalDraft.name}
                onChange={(e) => setGoalDraft((d) => ({ ...d, name: e.target.value }))}
              />
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-text-secondary mb-1 block">Target (R)</label>
                  <input
                    type="number"
                    min={1}
                    placeholder="50000"
                    className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none bg-surface text-text-primary"
                    value={goalDraft.targetAmount}
                    onChange={(e) => setGoalDraft((d) => ({ ...d, targetAmount: e.target.value }))}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-text-secondary mb-1 block">Saved (R)</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="0"
                    className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none bg-surface text-text-primary"
                    value={goalDraft.currentAmount}
                    onChange={(e) => setGoalDraft((d) => ({ ...d, currentAmount: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-text-secondary mb-1 block">Deadline (optional)</label>
                <input
                  type="date"
                  className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none bg-surface text-text-primary"
                  value={goalDraft.deadline}
                  onChange={(e) => setGoalDraft((d) => ({ ...d, deadline: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-text-secondary mb-1.5 block">Colour</label>
                <div className="flex gap-2">
                  {GOAL_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setGoalDraft((d) => ({ ...d, color: c }))}
                      className={`w-6 h-6 rounded-full transition-transform ${
                        goalDraft.color === c ? 'scale-125 ring-2 ring-offset-1 ring-border' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowGoalModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm text-text-secondary border border-border hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleAddGoal}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-text-primary text-surface hover:opacity-90"
              >
                Add Goal
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

function SectionTitle({ icon, title, count }: { icon: string; title: string; count?: number }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-sm">{icon}</span>
      <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wide">{title}</h2>
      {count !== undefined && (
        <span className="text-xs text-text-secondary bg-muted border border-border rounded px-1.5 py-0.5">
          {count}
        </span>
      )}
    </div>
  )
}
