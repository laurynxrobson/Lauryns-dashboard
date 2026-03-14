import { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { format, parseISO } from 'date-fns'
import { useWorkoutStore, type Workout } from '../store/workoutStore'
import { useHealthStore } from '../store/healthStore'
import { calculateReadiness } from '../lib/readinessEngine'
import { getTopRecommendation } from '../lib/workoutRecommendations'

export default function WorkoutScreen() {
  const navigation = useNavigation<any>()
  const { workouts, startWorkout, deleteWorkout } = useWorkoutStore()
  const todayMetrics = useHealthStore((s) => s.getTodayMetrics())
  const readiness = calculateReadiness(todayMetrics ?? {})
  const topRec = getTopRecommendation(readiness.tier)

  const [showNewModal, setShowNewModal] = useState(false)
  const [newName, setNewName] = useState('')

  function handleStart() {
    const name = newName.trim() || topRec.name
    const id = startWorkout(name)
    setNewName('')
    setShowNewModal(false)
    navigation.navigate('WorkoutLog', { workoutId: id })
  }

  function handleDelete(w: Workout) {
    Alert.alert('Delete Workout', `Delete "${w.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteWorkout(w.id),
      },
    ])
  }

  const finished = workouts.filter((w) => w.finishedAt !== null)
  const inProgress = workouts.filter((w) => w.finishedAt === null)

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
            <Text className="text-2xl font-bold text-gray-900">Workouts</Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowNewModal(true)}
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: readiness.color }}
          >
            <Text className="text-white text-2xl font-light">+</Text>
          </TouchableOpacity>
        </View>

        {/* Readiness Banner */}
        <TouchableOpacity
          onPress={() => navigation.navigate('Health')}
          className="mx-5 rounded-2xl p-4 mb-5 flex-row items-center"
          style={{ backgroundColor: readiness.color + '18' }}
          activeOpacity={0.8}
        >
          <Text style={{ fontSize: 28 }}>{topRec.emoji}</Text>
          <View className="ml-3 flex-1">
            <Text
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: readiness.color }}
            >
              Readiness {readiness.score} · {readiness.label}
            </Text>
            <Text className="text-sm text-gray-700 font-medium mt-0.5">
              {topRec.name}
            </Text>
            <Text className="text-xs text-gray-400">{topRec.duration}</Text>
          </View>
          <Text className="text-gray-400 ml-2">›</Text>
        </TouchableOpacity>

        {/* In-progress workouts */}
        {inProgress.length > 0 && (
          <View className="px-5 mb-4">
            <Text className="text-xs text-gray-400 uppercase tracking-widest mb-3">
              In Progress
            </Text>
            {inProgress.map((w) => (
              <WorkoutCard
                key={w.id}
                workout={w}
                accent={readiness.color}
                onResume={() =>
                  navigation.navigate('WorkoutLog', { workoutId: w.id })
                }
                onDelete={() => handleDelete(w)}
              />
            ))}
          </View>
        )}

        {/* Past workouts */}
        <View className="px-5">
          <Text className="text-xs text-gray-400 uppercase tracking-widest mb-3">
            History
          </Text>
          {finished.length === 0 ? (
            <View className="items-center py-12">
              <Text className="text-4xl mb-3">🏋️</Text>
              <Text className="text-gray-400 text-sm text-center">
                No completed workouts yet.{'\n'}Tap + to log your first session.
              </Text>
            </View>
          ) : (
            finished.map((w) => (
              <WorkoutCard
                key={w.id}
                workout={w}
                accent={readiness.color}
                onResume={() =>
                  navigation.navigate('WorkoutLog', { workoutId: w.id })
                }
                onDelete={() => handleDelete(w)}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* New Workout Modal */}
      <Modal
        visible={showNewModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNewModal(false)}
      >
        <View className="flex-1 justify-end">
          <TouchableOpacity
            className="flex-1"
            onPress={() => setShowNewModal(false)}
            activeOpacity={1}
          />
          <View className="bg-white rounded-t-3xl px-6 pt-5 pb-10">
            <View className="w-10 h-1 bg-gray-200 rounded-full self-center mb-5" />
            <Text className="text-lg font-bold text-gray-900 mb-1">
              Start a Workout
            </Text>
            <Text className="text-sm text-gray-400 mb-5">
              Recommended: {topRec.emoji} {topRec.name}
            </Text>
            <TextInput
              className="border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 mb-5"
              placeholder={topRec.name}
              placeholderTextColor="#9CA3AF"
              value={newName}
              onChangeText={setNewName}
              autoFocus
              returnKeyType="go"
              onSubmitEditing={handleStart}
            />
            <TouchableOpacity
              onPress={handleStart}
              className="rounded-xl py-3.5 items-center"
              style={{ backgroundColor: readiness.color }}
            >
              <Text className="text-white font-semibold text-sm">
                Start Session
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

// ─── sub-component ────────────────────────────────────────────────────────────

function WorkoutCard({
  workout,
  accent,
  onResume,
  onDelete,
}: {
  workout: Workout
  accent: string
  onResume: () => void
  onDelete: () => void
}) {
  const totalSets = workout.exercises.reduce(
    (sum, e) => sum + e.sets.length,
    0
  )

  return (
    <TouchableOpacity
      onPress={onResume}
      className="bg-white rounded-2xl p-4 mb-3 border border-gray-100 shadow-sm"
      activeOpacity={0.85}
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="text-sm font-semibold text-gray-900">
            {workout.name}
          </Text>
          <Text className="text-xs text-gray-400 mt-0.5">
            {format(parseISO(workout.startedAt), 'MMM d · h:mm a')}
            {workout.durationMinutes ? ` · ${workout.durationMinutes} min` : ' · In progress'}
          </Text>
        </View>
        <TouchableOpacity
          onPress={onDelete}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text className="text-gray-300">🗑</Text>
        </TouchableOpacity>
      </View>

      <View className="flex-row items-center mt-3 gap-4">
        <Pill
          label={`${workout.exercises.length} exercise${workout.exercises.length !== 1 ? 's' : ''}`}
          color={accent}
        />
        <Pill label={`${totalSets} sets`} color={accent} />
        {!workout.finishedAt && (
          <Pill label="In progress" color="#FB923C" />
        )}
      </View>
    </TouchableOpacity>
  )
}

function Pill({ label, color }: { label: string; color: string }) {
  return (
    <View
      className="rounded-full px-2.5 py-1"
      style={{ backgroundColor: color + '18' }}
    >
      <Text className="text-xs font-medium" style={{ color }}>
        {label}
      </Text>
    </View>
  )
}
