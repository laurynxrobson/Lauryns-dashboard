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
import { useFinanceStore, type BankTransaction } from '../store/financeStore'

// ── Helpers ───────────────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<string, string> = {
  FOOD_AND_DRINK:      '🍽️',
  TRANSPORTATION:      '🚗',
  ENTERTAINMENT:       '🎬',
  GENERAL_MERCHANDISE: '🛍️',
  PERSONAL_CARE:       '💪',
  RENT_AND_UTILITIES:  '🏠',
  INCOME:              '💵',
  BANK_FEES:           '🏦',
  TRAVEL:              '✈️',
}

const BANK_COLORS: Record<string, string> = {
  Investec:        '#1E3A5F',
  'Discovery Bank':'#0066CC',
  Capitec:         '#01A14A',
  FNB:             '#C8102E',
  'Standard Bank': '#003DA5',
  Nedbank:         '#009A44',
  Absa:            '#DC0028',
}

function txIcon(tx: BankTransaction) {
  return CATEGORY_ICONS[tx.personal_finance_category?.primary ?? ''] ?? '💳'
}

function zarFmt(amount: number, decimals = 2) {
  return `R${Math.abs(amount).toLocaleString('en-ZA', { minimumFractionDigits: decimals })}`
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function FinanceScreen() {
  const {
    accounts, transactions, goals,
    connected, isMock, isLoading, lastSynced, error,
    checkConnection, syncFinanceData,
  } = useFinanceStore()

  useEffect(() => { checkConnection() }, [])

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
                {isMock ? 'Demo · ' : 'Stitch · '}Synced {format(parseISO(lastSynced), 'h:mm a')}
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

        {/* Banners */}
        {error ? (
          <View className="mx-5 mb-4 bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
            <Text className="text-sm text-red-700">{error}</Text>
            <Text className="text-xs text-red-400 mt-1">
              Start: cd server &amp;&amp; npm run dev
            </Text>
          </View>
        ) : isMock ? (
          <View className="mx-5 mb-4 bg-blue-50 border border-blue-200 rounded-2xl px-4 py-2.5">
            <Text className="text-xs text-blue-700">
              <Text className="font-semibold">Demo data</Text> — Investec, Discovery Bank &amp;
              Capitec. Connect via the web app to link real accounts.
            </Text>
          </View>
        ) : null}

        {/* Net Worth */}
        {accounts.length > 0 && (
          <View className="mx-5 bg-white rounded-2xl p-5 mb-5 shadow-sm border border-gray-100">
            <Text className="text-xs text-gray-400 uppercase tracking-widest mb-1">Net Worth</Text>
            <Text className="text-4xl font-bold text-gray-900">
              {zarFmt(netWorth)}
            </Text>
            <Text className="text-sm text-gray-400 mt-1">
              Spent this month: {zarFmt(monthlySpending)}
            </Text>
          </View>
        )}

        {/* Accounts */}
        {accounts.length > 0 && (
          <View className="px-5 mb-5">
            <SectionLabel>Accounts</SectionLabel>
            {accounts.map((a) => {
              const balance = a.balances.available ?? a.balances.current ?? 0
              const bankColor = (a.bank && BANK_COLORS[a.bank]) ?? '#6B7280'
              return (
                <View
                  key={a.account_id}
                  className="bg-white rounded-2xl px-4 py-3.5 mb-2 border border-gray-100 shadow-sm flex-row items-center justify-between"
                >
                  <View className="flex-1 mr-3">
                    <View className="flex-row items-center gap-2 mb-0.5">
                      <View className="w-2 h-2 rounded-full" style={{ backgroundColor: bankColor }} />
                      <Text className="text-sm font-semibold text-gray-900 flex-1" numberOfLines={1}>
                        {a.name}
                      </Text>
                    </View>
                    <Text className="text-xs text-gray-400 capitalize ml-4">
                      {a.bank ? `${a.bank} · ` : ''}{a.subtype ?? a.type}{a.mask ? ` ···· ${a.mask}` : ''}
                    </Text>
                  </View>
                  <Text className={`text-base font-bold ${balance < 0 ? 'text-red-500' : 'text-gray-900'}`}>
                    {zarFmt(balance)}
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
                    {zarFmt(g.currentAmount, 0)} saved
                  </Text>
                  <Text className="text-xs text-gray-400">
                    of {zarFmt(g.targetAmount, 0)}
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
              {transactions.slice(0, 12).map((tx, i) => {
                const isIncome = tx.personal_finance_category?.primary === 'INCOME' || tx.amount < 0
                return (
                  <View
                    key={tx.transaction_id}
                    className={`flex-row items-center px-4 py-3 ${i > 0 ? 'border-t border-gray-50' : ''}`}
                  >
                    <Text className="text-xl mr-3">{txIcon(tx)}</Text>
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-gray-900" numberOfLines={1}>
                        {tx.merchant_name ?? tx.name}
                      </Text>
                      <Text className="text-xs text-gray-400">
                        {format(parseISO(tx.date), 'MMM d')}
                      </Text>
                    </View>
                    <Text className={`text-sm font-semibold ${isIncome ? 'text-green-600' : 'text-gray-900'}`}>
                      {isIncome ? '+' : '−'}{zarFmt(tx.amount)}
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
              Connect Investec, Discovery or Capitec
            </Text>
            <Text className="text-sm text-gray-400 text-center leading-5">
              Open the web app → Finance → Connect Bank. Your accounts will appear here automatically.
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
