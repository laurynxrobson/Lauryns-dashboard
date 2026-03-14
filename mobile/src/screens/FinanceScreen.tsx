import { useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { format, parseISO } from 'date-fns'
import { useFinanceStore, type PlaidTransaction } from '../store/financeStore'

// ── Category helpers ──────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<string, string> = {
  FOOD_AND_DRINK: '🍽️',
  TRANSPORTATION: '🚗',
  ENTERTAINMENT: '🎬',
  GENERAL_MERCHANDISE: '🛍️',
  PERSONAL_CARE: '💪',
  RENT_AND_UTILITIES: '🏠',
  INCOME: '💵',
  TRAVEL: '✈️',
}

function txIcon(tx: PlaidTransaction) {
  return CATEGORY_ICONS[tx.personal_finance_category?.primary ?? ''] ?? '💳'
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function FinanceScreen() {
  const { accounts, transactions, goals, connected, isMock, isLoading, lastSynced, error, checkConnection, syncFinanceData } =
    useFinanceStore()

  useEffect(() => {
    checkConnection()
  }, [])

  const netWorth = accounts.reduce((s, a) => s + (a.balances.current ?? 0), 0)
  const thisMonth = format(new Date(), 'yyyy-MM')
  const monthlySpending = transactions
    .filter((tx) => tx.date.startsWith(thisMonth) && tx.amount > 0 && tx.personal_finance_category?.primary !== 'INCOME')
    .reduce((s, tx) => s + tx.amount, 0)

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-5 pt-6 pb-4 flex-row items-center justify-between">
          <View>
            <Text className="text-xs text-gray-400 uppercase tracking-widest mb-1">
              {format(new Date(), 'EEEE, MMMM d')}
            </Text>
            <Text className="text-2xl font-bold text-gray-900">Finance</Text>
            {lastSynced && (
              <Text className="text-xs text-gray-400 mt-0.5">
                {isMock ? 'Demo · ' : ''}Synced {format(parseISO(lastSynced), 'h:mm a')}
              </Text>
            )}
          </View>
          <TouchableOpacity
            onPress={syncFinanceData}
            disabled={isLoading}
            className="w-9 h-9 rounded-full bg-white border border-gray-200 items-center justify-center"
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#60A5FA" />
            ) : (
              <Text className="text-base">↻</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Error / Mock banner */}
        {error ? (
          <View className="mx-5 mb-4 bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
            <Text className="text-sm text-red-700">{error}</Text>
            <Text className="text-xs text-red-500 mt-1">
              Start the server: cd server && npm run dev
            </Text>
          </View>
        ) : isMock ? (
          <View className="mx-5 mb-4 bg-blue-50 border border-blue-200 rounded-2xl px-4 py-2.5">
            <Text className="text-xs text-blue-700">
              <Text className="font-semibold">Demo data</Text> — connect your bank via the web app.
            </Text>
          </View>
        ) : null}

        {/* Net Worth */}
        {accounts.length > 0 && (
          <View className="mx-5 bg-white rounded-2xl p-5 mb-5 shadow-sm border border-gray-100">
            <Text className="text-xs text-gray-400 uppercase tracking-widest mb-1">Net Worth</Text>
            <Text className="text-4xl font-bold text-gray-900">
              ${netWorth.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </Text>
            <Text className="text-sm text-gray-400 mt-1">
              Spent this month: ${monthlySpending.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </Text>
          </View>
        )}

        {/* Accounts */}
        {accounts.length > 0 && (
          <View className="px-5 mb-5">
            <SectionLabel>Accounts</SectionLabel>
            {accounts.map((a) => {
              const balance = a.balances.available ?? a.balances.current ?? 0
              return (
                <View
                  key={a.account_id}
                  className="bg-white rounded-2xl px-4 py-3.5 mb-2 border border-gray-100 shadow-sm flex-row items-center justify-between"
                >
                  <View>
                    <Text className="text-sm font-semibold text-gray-900">{a.name}</Text>
                    <Text className="text-xs text-gray-400 capitalize">
                      {a.subtype ?? a.type}{a.mask ? ` ···· ${a.mask}` : ''}
                    </Text>
                  </View>
                  <Text className={`text-base font-bold ${balance < 0 ? 'text-red-500' : 'text-gray-900'}`}>
                    {balance < 0 ? '−' : ''}${Math.abs(balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </Text>
                </View>
              )
            })}
          </View>
        )}

        {/* Savings Goals */}
        <View className="px-5 mb-5">
          <SectionLabel>Savings Goals</SectionLabel>
          {goals.map((g) => {
            const pct = Math.min(100, (g.currentAmount / g.targetAmount) * 100)
            return (
              <View key={g.id} className="bg-white rounded-2xl px-4 py-3.5 mb-2 border border-gray-100 shadow-sm">
                <View className="flex-row justify-between mb-2">
                  <Text className="text-sm font-semibold text-gray-900">{g.name}</Text>
                  <Text className="text-xs text-gray-400">{pct.toFixed(0)}%</Text>
                </View>
                <View className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
                  <View
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, backgroundColor: g.color }}
                  />
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-xs font-bold" style={{ color: g.color }}>
                    ${g.currentAmount.toLocaleString('en-US', { minimumFractionDigits: 0 })} saved
                  </Text>
                  <Text className="text-xs text-gray-400">
                    of ${g.targetAmount.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                  </Text>
                </View>
              </View>
            )
          })}
        </View>

        {/* Recent Transactions */}
        {transactions.length > 0 && (
          <View className="px-5">
            <SectionLabel>Recent Transactions</SectionLabel>
            <View className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {transactions.slice(0, 10).map((tx, i) => {
                const isIncome = tx.personal_finance_category?.primary === 'INCOME' || tx.amount < 0
                return (
                  <View
                    key={tx.transaction_id}
                    className={`flex-row items-center px-4 py-3 ${i > 0 ? 'border-t border-gray-50' : ''}`}
                  >
                    <Text className="text-xl mr-3">{txIcon(tx)}</Text>
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-gray-900 truncate">
                        {tx.merchant_name ?? tx.name}
                      </Text>
                      <Text className="text-xs text-gray-400">
                        {format(parseISO(tx.date), 'MMM d')}
                      </Text>
                    </View>
                    <Text
                      className={`text-sm font-semibold ${isIncome ? 'text-green-600' : 'text-gray-900'}`}
                    >
                      {isIncome ? '+' : '−'}${Math.abs(tx.amount).toFixed(2)}
                    </Text>
                  </View>
                )
              })}
            </View>
          </View>
        )}

        {/* Empty state */}
        {!connected && !isLoading && accounts.length === 0 && !error && (
          <View className="items-center py-16 px-10">
            <Text className="text-5xl mb-4">🏦</Text>
            <Text className="text-base font-semibold text-gray-900 mb-2 text-center">
              Connect Your Bank
            </Text>
            <Text className="text-sm text-gray-400 text-center leading-5">
              Open the web app and navigate to Finance to connect your bank via Plaid. Data will appear here automatically.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text className="text-xs text-gray-400 uppercase tracking-widest mb-3">
      {children}
    </Text>
  )
}
