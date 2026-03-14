import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { useHealthStore } from '../store/healthStore'
import { calculateReadiness } from '../lib/readinessEngine'
import { getRecommendations } from '../lib/workoutRecommendations'
import ReadinessGauge from '../components/health/ReadinessGauge'

export default function ReadinessScreen() {
  const navigation = useNavigation<any>()
  const todayMetrics = useHealthStore((s) => s.getTodayMetrics())
  const readiness = calculateReadiness(todayMetrics ?? {})
  const suggestions = getRecommendations(readiness.tier)

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Back header */}
        <View className="flex-row items-center px-5 pt-4 pb-2">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="mr-3 p-1"
          >
            <Text className="text-2xl text-gray-400">‹</Text>
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-gray-900">
            Readiness Detail
          </Text>
        </View>

        {/* Big gauge */}
        <View className="items-center py-6">
          <ReadinessGauge score={readiness.score} color={readiness.color} size={200} />
          <Text
            className="text-xl font-bold mt-4"
            style={{ color: readiness.color }}
          >
            {readiness.label}
          </Text>
          <Text className="text-sm text-gray-500 mt-2 text-center px-8 leading-6">
            {readiness.description}
          </Text>
        </View>

        {/* Component scores */}
        <View className="mx-5 bg-white rounded-2xl p-5 mb-5 border border-gray-100 shadow-sm">
          <Text className="text-xs text-gray-400 uppercase tracking-widest mb-4">
            Score Breakdown
          </Text>

          {(
            [
              {
                label: 'HRV',
                score: readiness.components.hrv,
                value: todayMetrics?.hrv ? `${todayMetrics.hrv} ms` : 'No data',
                color: '#A78BFA',
                weight: '40%',
              },
              {
                label: 'Sleep',
                score: readiness.components.sleep,
                value: todayMetrics?.sleepHours
                  ? `${todayMetrics.sleepHours} hrs`
                  : 'No data',
                color: '#60A5FA',
                weight: '40%',
              },
              {
                label: 'Activity',
                score: readiness.components.activity,
                value: todayMetrics?.steps
                  ? `${todayMetrics.steps.toLocaleString()} steps`
                  : 'No data',
                color: '#4ADE80',
                weight: '20%',
              },
            ] as const
          ).map((item) => (
            <View key={item.label} className="mb-4">
              <View className="flex-row justify-between items-baseline mb-1.5">
                <View className="flex-row items-center gap-2">
                  <Text className="text-sm font-semibold text-gray-800">
                    {item.label}
                  </Text>
                  <Text className="text-xs text-gray-400">({item.weight})</Text>
                </View>
                <View className="flex-row items-center gap-3">
                  <Text className="text-xs text-gray-400">{item.value}</Text>
                  <Text
                    className="text-sm font-bold"
                    style={{ color: item.color }}
                  >
                    {item.score}
                  </Text>
                </View>
              </View>
              <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
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

        {/* Workout Suggestions */}
        <View className="mx-5">
          <Text className="text-xs text-gray-400 uppercase tracking-widest mb-3">
            Recommended Workouts
          </Text>

          {suggestions.map((s, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => navigation.navigate('Workouts')}
              className="flex-row items-center bg-white rounded-2xl p-4 mb-2.5 border border-gray-100 shadow-sm"
              activeOpacity={0.8}
            >
              <View
                className="w-10 h-10 rounded-full items-center justify-center mr-4"
                style={{ backgroundColor: readiness.color + '20' }}
              >
                <Text style={{ fontSize: 18 }}>{s.emoji}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-gray-900">
                  {s.name}
                </Text>
                <Text className="text-xs text-gray-400 mt-0.5">
                  {s.duration} · {s.intensity} intensity
                </Text>
              </View>
              <Text className="text-gray-300 text-lg">›</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
