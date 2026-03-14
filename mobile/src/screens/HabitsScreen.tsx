import { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  SafeAreaView,
  Alert,
} from 'react-native'
import { useHabitStore } from '../store/habitStore'
import { useAuthStore } from '../store/authStore'
import HabitCard from '../components/HabitCard'
import { format } from 'date-fns'

const PRESET_ICONS = ['✦', '◆', '▲', '●', '★', '❋', '⚡', '🧘', '📚', '🏃']
const PRESET_COLORS = ['#4ADE80', '#60A5FA', '#A78BFA', '#FB923C', '#F472B6', '#34D399']

export default function HabitsScreen() {
  const { habits, addHabit, deleteHabit, toggleCompletion } = useHabitStore()
  const { user, logout } = useAuthStore()
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newIcon, setNewIcon] = useState(PRESET_ICONS[0])
  const [newColor, setNewColor] = useState(PRESET_COLORS[0])

  const sorted = [...habits].sort((a, b) => a.order - b.order)
  const today = format(new Date(), 'yyyy-MM-dd')
  const completedToday = habits.filter((h) => h.completions[today]).length

  function handleAdd() {
    if (!newName.trim()) return
    addHabit(newName.trim(), newIcon, newColor)
    setNewName('')
    setNewIcon(PRESET_ICONS[0])
    setNewColor(PRESET_COLORS[0])
    setShowAdd(false)
  }

  function handleDelete(id: string) {
    Alert.alert('Delete habit', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteHabit(id) },
    ])
  }

  return (
    <SafeAreaView className="flex-1 bg-muted">
      {/* Header */}
      <View className="px-5 pt-4 pb-3 bg-surface border-b border-border">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-xs text-text-secondary">
              {format(new Date(), 'EEEE, MMMM d')}
            </Text>
            <Text className="text-lg font-semibold text-text-primary mt-0.5">
              {getGreeting()}, {user?.name?.split(' ')[0] ?? 'Lauryn'} 👋
            </Text>
          </View>
          <TouchableOpacity
            onPress={logout}
            className="px-3 py-1.5 border border-border rounded-lg"
            activeOpacity={0.7}
          >
            <Text className="text-xs text-text-secondary">Sign out</Text>
          </TouchableOpacity>
        </View>
        {habits.length > 0 && (
          <Text className="text-xs text-text-secondary mt-2">
            {completedToday} of {habits.length} habits done today
          </Text>
        )}
      </View>

      {/* Habit list */}
      <ScrollView className="flex-1 px-4 pt-4">
        {/* Section header */}
        <View className="flex-row items-center gap-2 mb-3">
          <Text className="text-text-secondary text-sm">◎</Text>
          <Text className="text-xs font-semibold text-text-primary uppercase tracking-widest">
            Habits
          </Text>
          <View className="px-1.5 py-0.5 bg-surface border border-border rounded">
            <Text className="text-xs text-text-secondary">{habits.length}</Text>
          </View>
        </View>

        {sorted.map((habit) => (
          <HabitCard
            key={habit.id}
            habit={habit}
            onToggle={() => toggleCompletion(habit.id)}
            onDelete={() => handleDelete(habit.id)}
          />
        ))}

        {sorted.length === 0 && (
          <View className="items-center py-16">
            <Text className="text-4xl mb-3">◎</Text>
            <Text className="text-sm text-text-secondary">No habits yet.</Text>
            <Text className="text-sm text-text-secondary mt-1">Tap + to add your first habit.</Text>
          </View>
        )}

        <View className="h-20" />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        onPress={() => setShowAdd(true)}
        className="absolute bottom-8 right-5 w-14 h-14 bg-text-primary rounded-full items-center justify-center shadow-lg"
        activeOpacity={0.85}
      >
        <Text className="text-surface text-2xl font-light">+</Text>
      </TouchableOpacity>

      {/* Add habit modal */}
      <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView className="flex-1 bg-surface">
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-border">
            <Text className="text-base font-semibold text-text-primary">Add Habit</Text>
            <TouchableOpacity onPress={() => setShowAdd(false)}>
              <Text className="text-text-secondary">✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-5 pt-5">
            <Text className="text-xs text-text-secondary mb-2 uppercase tracking-wide">Name</Text>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              placeholder="e.g. Meditation, Deep Work…"
              placeholderTextColor="#6B6B6B"
              className="border border-border rounded-xl px-4 py-3 text-sm text-text-primary mb-5"
              autoFocus
            />

            <Text className="text-xs text-text-secondary mb-2 uppercase tracking-wide">Icon</Text>
            <View className="flex-row flex-wrap gap-2 mb-5">
              {PRESET_ICONS.map((ic) => (
                <TouchableOpacity
                  key={ic}
                  onPress={() => setNewIcon(ic)}
                  className={`w-10 h-10 rounded-lg border items-center justify-center ${
                    newIcon === ic ? 'border-text-primary bg-muted' : 'border-border'
                  }`}
                >
                  <Text className="text-base">{ic}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text className="text-xs text-text-secondary mb-2 uppercase tracking-wide">Color</Text>
            <View className="flex-row gap-3 mb-8">
              {PRESET_COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setNewColor(c)}
                  className={`w-8 h-8 rounded-full border-2 ${
                    newColor === c ? 'border-text-primary' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </View>
          </ScrollView>

          <View className="px-5 pb-4">
            <TouchableOpacity
              onPress={handleAdd}
              disabled={!newName.trim()}
              className="w-full py-3.5 bg-text-primary rounded-xl items-center"
              style={{ opacity: newName.trim() ? 1 : 0.4 }}
              activeOpacity={0.85}
            >
              <Text className="text-surface font-medium text-sm">Add Habit</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  )
}

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}
