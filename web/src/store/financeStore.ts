import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { plaidApi, type PlaidAccount, type PlaidTransaction } from '../lib/api'

export interface SavingsGoal {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  deadline?: string  // "YYYY-MM-DD"
  color: string
}

interface FinanceStore {
  accounts: PlaidAccount[]
  transactions: PlaidTransaction[]
  goals: SavingsGoal[]
  connected: boolean
  isMock: boolean
  isLoading: boolean
  lastSynced: string | null
  error: string | null

  // Plaid
  checkConnection: () => Promise<void>
  connectPlaid: (publicToken: string) => Promise<void>
  syncFinanceData: () => Promise<void>

  // Goals (client-side only)
  addGoal: (goal: Omit<SavingsGoal, 'id'>) => void
  updateGoal: (id: string, patch: Partial<SavingsGoal>) => void
  deleteGoal: (id: string) => void
}

function uid() { return Math.random().toString(36).slice(2, 10) }

const DEFAULT_GOALS: SavingsGoal[] = [
  { id: 'g1', name: 'Emergency Fund', targetAmount: 10000, currentAmount: 3200, color: '#4ADE80' },
  { id: 'g2', name: 'Vacation',        targetAmount: 3000,  currentAmount: 850,  deadline: '2026-08-01', color: '#60A5FA' },
]

export const useFinanceStore = create<FinanceStore>()(
  persist(
    (set, get) => ({
      accounts: [],
      transactions: [],
      goals: DEFAULT_GOALS,
      connected: false,
      isMock: false,
      isLoading: false,
      lastSynced: null,
      error: null,

      checkConnection: async () => {
        try {
          const { connected, mock } = await plaidApi.getConnectionStatus()
          set({ connected, isMock: mock })
          if (connected && get().accounts.length === 0) {
            await get().syncFinanceData()
          }
        } catch {
          set({ error: 'Server offline — start the backend with: cd server && npm run dev' })
        }
      },

      connectPlaid: async (publicToken) => {
        set({ isLoading: true, error: null })
        try {
          await plaidApi.exchangeToken(publicToken)
          set({ connected: true })
          await get().syncFinanceData()
        } catch (err) {
          set({ error: 'Failed to connect bank account.' })
        } finally {
          set({ isLoading: false })
        }
      },

      syncFinanceData: async () => {
        set({ isLoading: true, error: null })
        try {
          const [{ accounts }, { transactions }] = await Promise.all([
            plaidApi.getAccounts(),
            plaidApi.getTransactions(),
          ])
          set({ accounts, transactions, lastSynced: new Date().toISOString() })
        } catch (err) {
          set({ error: 'Failed to sync financial data.' })
        } finally {
          set({ isLoading: false })
        }
      },

      addGoal: (goal) =>
        set((s) => ({ goals: [...s.goals, { ...goal, id: uid() }] })),

      updateGoal: (id, patch) =>
        set((s) => ({ goals: s.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)) })),

      deleteGoal: (id) =>
        set((s) => ({ goals: s.goals.filter((g) => g.id !== id) })),
    }),
    { name: 'finance-store' }
  )
)
