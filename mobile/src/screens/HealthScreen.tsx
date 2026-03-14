import { useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { format } from 'date-fns'
import { useHealthStore } from '../store/healthStore'
import { calculateReadiness } from '../lib/readinessEngine'
import { isHealthKitAvailable } from '../lib/healthKit'
import MetricCard from '../components/health/MetricCard'
import ReadinessGauge from '../components/health/ReadinessGauge'

export default function HealthScreen() {
  const navigation = useNavigation<any>()
  const {
    getTodayMetrics,
    requestPermissions,
    syncHealthData,
    permissionGranted,
    isSyncing,
    lastSynced,
  } = useHealthStore()

  const todayMetrics = getTodayMetrics()
  const readiness = calculateReadiness(todayMetrics ?? {})

  // Auto-request permissions on first load
  useEffect(() => {
    if (!permissionGranted) {
      requestPermissions()
    } else if (!todayMetrics) {
      syncHealthData()
    }
  }, [])

  const lastSyncedLabel = lastSynced
    ? `Synced ${format(new Date(lastSynced), 'h:mm a')}`
    : isHealthKitAvailable()
    ? 'Not yet synced'
    : 'Showing demo data'

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-5 pt-6 pb-4">
          <Text className="text-xs text-gray-400 uppercase tracking-widest mb-1">
            {format(new Date(), 'EEEE, MMMM d')}
          </Text>
          <View className="flex-row items-center justify-between">
            <Text className="text-2xl font-bold text-gray-900">Health</Text>
            <TouchableOpacity
              onPress={syncHealthData}
              disabled={isSyncing}
              className="flex-row items-center gap-1 px-3 py-1.5 rounded-full bg-white border border-gray-200"
            >
              {isSyncing ? (
                <ActivityIndicator size="small" color="#60A5FA" />
              ) : (
                <Text className="text-lg">↻</Text>
              )}
              <Text className="text-xs text-gray-500 ml-1">{lastSyncedLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Readiness Card */}
        <TouchableOpacity
          onPress={() => navigation.navigate('Readiness')}
          className="mx-5 bg-white rounded-2xl p-5 mb-5 shadow-sm border border-gray-100"
          activeOpacity={0.85}
        >
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-lg font-bold text-gray-900">
                Today's Readiness
              </Text>
              <Text
                className="text-sm font-medium mt-0.5"
                style={{ color: readiness.color }}
              >
                {readiness.label}
              </Text>
            </View>
            <Text className="text-gray-400 text-lg">›</Text>
          </View>

          <View className="items-center py-2">
            <ReadinessGauge score={readiness.score} color={readiness.color} size={160} />
          </View>

          <Text className="text-sm text-gray-500 text-center mt-3 leading-5">
            {readiness.description}
          </Text>
        </TouchableOpacity>

        {/* Metric Grid */}
        <View className="px-3.5">
          <Text className="text-xs text-gray-400 uppercase tracking-widest mb-3 px-1.5">
            Today's Metrics
          </Text>

          <View className="flex-row mb-3">
            <MetricCard
              icon="👟"
              label="Steps"
              value={todayMetrics ? todayMetrics.steps.toLocaleString() : '—'}
              color="#4ADE80"
            />
            <MetricCard
              icon="🔥"
              label="Active Cal"
              value={todayMetrics ? String(todayMetrics.activeCalories) : '—'}
              unit="kcal"
              color="#FB923C"
            />
          </View>

          <View className="flex-row mb-3">
            <MetricCard
              icon="💓"
              label="Resting HR"
              value={todayMetrics ? String(todayMetrics.restingHeartRate) : '—'}
              unit="bpm"
              color="#F472B6"
            />
            <MetricCard
              icon="〰️"
              label="HRV"
              value={todayMetrics ? String(todayMetrics.hrv) : '—'}
              unit="ms"
              color="#A78BFA"
            />
          </View>

          <View className="flex-row mb-3">
            <MetricCard
              icon="🌙"
              label="Sleep"
              value={todayMetrics ? String(todayMetrics.sleepHours) : '—'}
              unit="hrs"
              color="#60A5FA"
            />
            <View className="flex-1 mx-1.5" />
          </View>
        </View>

        {/* Component Breakdown */}
        <View className="mx-5 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <Text className="text-xs text-gray-400 uppercase tracking-widest mb-3">
            Score Breakdown
          </Text>
          {(
            [
              { label: 'HRV', score: readiness.components.hrv, color: '#A78BFA' },
              { label: 'Sleep', score: readiness.components.sleep, color: '#60A5FA' },
              { label: 'Activity', score: readiness.components.activity, color: '#4ADE80' },
            ] as const
          ).map((item) => (
            <View key={item.label} className="mb-3">
              <View className="flex-row justify-between mb-1">
                <Text className="text-sm text-gray-600">{item.label}</Text>
                <Text className="text-sm font-semibold text-gray-800">
                  {item.score}
                </Text>
              </View>
              <View className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <View
                  className="h-full rounded-full"
                  style={{
                    width: `${item.score}%`,
                    backgroundColor: item.color,
                  }}
                />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
