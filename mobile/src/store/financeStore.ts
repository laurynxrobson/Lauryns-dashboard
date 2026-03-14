import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001'

export interface BankAccount {
  account_id: string
  name: string
  official_name: string | null
  bank?: string
  mask: string | null
  type: string
  subtype: string | null
  balances: {
    available: number | null
    current: number | null
    iso_currency_code: string | null
  }
}

export interface BankTransaction {
  transaction_id: string
  account_id: string
  name: string
  merchant_name: string | null
  amount: number
  date: string
  personal_finance_category: {
    primary: string
    detailed: string
  } | null
  pending: boolean
}

export interface SavingsGoal {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  deadline?: string
  color: string
}

interface FinanceStore {
  accounts: BankAccount[]
  transactions: BankTransaction[]
  goals: SavingsGoal[]
  connected: boolean
  isMock: boolean
  isLoading: boolean
  lastSynced: string | null
  error: string | null

  checkConnection: () => Promise<void>
  syncFinanceData: () => Promise<void>
}

const DEFAULT_GOALS: SavingsGoal[] = [
  { id: 'g1', name: 'Emergency Fund', targetAmount: 50000, currentAmount: 18200, color: '#4ADE80' },
  { id: 'g2', name: 'Holiday — Bali', targetAmount: 25000, currentAmount: 7500, deadline: '2026-09-01', color: '#60A5FA' },
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
          const res = await fetch(`${API_BASE}/api/stitch/connection-status`)
          if (!res.ok) throw new Error('Server unreachable')
          const { connected, mock } = await res.json()
          set({ connected, isMock: mock, error: null })
          if (connected && get().accounts.length === 0) {
            await get().syncFinanceData()
          }
        } catch {
          set({ error: 'Server offline. Start the backend to load financial data.' })
        }
      },

      syncFinanceData: async () => {
        set({ isLoading: true, error: null })
        try {
          const [accRes, txRes] = await Promise.all([
            fetch(`${API_BASE}/api/stitch/accounts`),
            fetch(`${API_BASE}/api/stitch/transactions`),
          ])
          if (!accRes.ok || !txRes.ok) throw new Error('Fetch failed')
          const { accounts } = await accRes.json()
          const { transactions } = await txRes.json()
          set({ accounts, transactions, lastSynced: new Date().toISOString() })
        } catch {
          set({ error: 'Failed to sync financial data.' })
        } finally {
          set({ isLoading: false })
        }
      },
    }),
    {
      name: 'mobile-finance-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
