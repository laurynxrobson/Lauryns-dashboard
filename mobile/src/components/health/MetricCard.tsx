import { View, Text } from 'react-native'

interface Props {
  icon: string
  label: string
  value: string
  unit?: string
  color?: string
}

export default function MetricCard({ icon, label, value, unit, color = '#60A5FA' }: Props) {
  return (
    <View className="flex-1 bg-white rounded-2xl p-4 mx-1.5 shadow-sm border border-gray-100">
      <View
        className="w-8 h-8 rounded-full items-center justify-center mb-3"
        style={{ backgroundColor: color + '20' }}
      >
        <Text style={{ fontSize: 16 }}>{icon}</Text>
      </View>
      <Text className="text-2xl font-bold text-gray-900" style={{ color }}>
        {value}
        {unit && (
          <Text className="text-sm font-normal text-gray-400"> {unit}</Text>
        )}
      </Text>
      <Text className="text-xs text-gray-400 mt-1 uppercase tracking-wide">
        {label}
      </Text>
    </View>
  )
}
