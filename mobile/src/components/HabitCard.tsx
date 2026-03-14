import { View, Text, TouchableOpacity } from 'react-native'
import { type Habit } from '../store/habitStore'
import { format } from 'date-fns'
import { calculateStreak } from '../lib/habitUtils'

interface HabitCardProps {
  habit: Habit
  onToggle: () => void
  onDelete: () => void
}

export default function HabitCard({ habit, onToggle, onDelete }: HabitCardProps) {
  const today = format(new Date(), 'yyyy-MM-dd')
  const completedToday = Boolean(habit.completions[today])
  const streak = calculateStreak(habit.completions)

  return (
    <View className="bg-surface border border-border rounded-xl p-4 mb-3">
      <View className="flex-row items-center gap-3">
        {/* Icon */}
        <View
          className="w-9 h-9 rounded-lg items-center justify-center"
          style={{ backgroundColor: habit.color + '22' }}
        >
          <Text style={{ color: habit.color, fontSize: 16 }}>{habit.icon}</Text>
        </View>

        {/* Name + streak */}
        <View className="flex-1">
          <Text className="text-sm font-medium text-text-primary">{habit.name}</Text>
          <Text className="text-xs text-text-secondary mt-0.5">
            🔥 {streak.current} streak · best {streak.longest}
          </Text>
        </View>

        {/* Check button */}
        <TouchableOpacity
          onPress={onToggle}
          className="w-8 h-8 rounded-lg border-2 items-center justify-center"
          style={
            completedToday
              ? { backgroundColor: habit.color, borderColor: habit.color }
              : { borderColor: '#E5E5E5' }
          }
          activeOpacity={0.7}
        >
          {completedToday && <Text className="text-surface text-xs font-bold">✓</Text>}
        </TouchableOpacity>

        {/* Delete */}
        <TouchableOpacity onPress={onDelete} className="p-1 ml-1" activeOpacity={0.6}>
          <Text className="text-text-secondary text-xs">✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}
