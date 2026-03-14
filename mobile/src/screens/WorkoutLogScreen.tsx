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
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native'
import { useWorkoutStore, type WorkoutSet } from '../store/workoutStore'
import { useHealthStore } from '../store/healthStore'
import { calculateReadiness } from '../lib/readinessEngine'
import ExerciseRow from '../components/workout/ExerciseRow'

type RouteParams = { WorkoutLog: { workoutId: string } }

export default function WorkoutLogScreen() {
  const navigation = useNavigation<any>()
  const route = useRoute<RouteProp<RouteParams, 'WorkoutLog'>>()
  const { workoutId } = route.params

  const {
    getWorkout,
    finishWorkout,
    addExercise,
    deleteExercise,
    addSet,
    updateSet,
    deleteSet,
  } = useWorkoutStore()

  const workout = getWorkout(workoutId)
  const todayMetrics = useHealthStore((s) => s.getTodayMetrics())
  const { color: accentColor } = calculateReadiness(todayMetrics ?? {})

  const [showAddExercise, setShowAddExercise] = useState(false)
  const [exerciseName, setExerciseName] = useState('')

  if (!workout) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <Text className="text-gray-400">Workout not found.</Text>
      </SafeAreaView>
    )
  }

  function handleAddExercise() {
    if (!exerciseName.trim()) return
    addExercise(workoutId, exerciseName.trim())
    setExerciseName('')
    setShowAddExercise(false)
  }

  function handleAddSet(exerciseId: string) {
    const defaultSet: WorkoutSet = { reps: 0, weight: 0, unit: 'lbs' }
    addSet(workoutId, exerciseId, defaultSet)
  }

  function handleFinish() {
    Alert.alert('Finish Workout', 'Mark this workout as complete?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Finish',
        onPress: () => {
          finishWorkout(workoutId)
          navigation.goBack()
        },
      },
    ])
  }

  const totalSets = workout.exercises.reduce(
    (sum, e) => sum + e.sets.length,
    0
  )

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View
        className="flex-row items-center px-5 pt-4 pb-3 border-b border-gray-100"
        style={{ backgroundColor: '#FAFAFA' }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="mr-3"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text className="text-2xl text-gray-400">‹</Text>
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-base font-bold text-gray-900" numberOfLines={1}>
            {workout.name}
          </Text>
          <Text className="text-xs text-gray-400 mt-0.5">
            {workout.exercises.length} exercises · {totalSets} sets
          </Text>
        </View>
        {!workout.finishedAt && (
          <TouchableOpacity
            onPress={handleFinish}
            className="rounded-xl px-4 py-2"
            style={{ backgroundColor: accentColor }}
          >
            <Text className="text-white text-xs font-semibold">Finish</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        className="flex-1 px-5 pt-4"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {workout.exercises.length === 0 ? (
          <View className="items-center py-16">
            <Text className="text-4xl mb-3">💪</Text>
            <Text className="text-gray-400 text-sm text-center">
              No exercises yet.{'\n'}Tap "+ Add Exercise" to get started.
            </Text>
          </View>
        ) : (
          workout.exercises.map((exercise) => (
            <ExerciseRow
              key={exercise.id}
              exercise={exercise}
              onAddSet={() => handleAddSet(exercise.id)}
              onUpdateSet={(setIdx, updated) =>
                updateSet(workoutId, exercise.id, setIdx, updated)
              }
              onDeleteSet={(setIdx) =>
                deleteSet(workoutId, exercise.id, setIdx)
              }
              onDelete={() => deleteExercise(workoutId, exercise.id)}
            />
          ))
        )}

        {/* Add Exercise Button */}
        <TouchableOpacity
          onPress={() => setShowAddExercise(true)}
          className="flex-row items-center justify-center py-3.5 rounded-2xl border border-dashed"
          style={{ borderColor: accentColor + '60' }}
        >
          <Text className="text-sm font-medium" style={{ color: accentColor }}>
            + Add Exercise
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Add Exercise Modal */}
      <Modal
        visible={showAddExercise}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddExercise(false)}
      >
        <View className="flex-1 justify-end">
          <TouchableOpacity
            className="flex-1"
            onPress={() => setShowAddExercise(false)}
            activeOpacity={1}
          />
          <View className="bg-white rounded-t-3xl px-6 pt-5 pb-10">
            <View className="w-10 h-1 bg-gray-200 rounded-full self-center mb-5" />
            <Text className="text-base font-bold text-gray-900 mb-4">
              Add Exercise
            </Text>
            <TextInput
              className="border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 mb-4"
              placeholder="e.g. Bench Press, Squat, Deadlift…"
              placeholderTextColor="#9CA3AF"
              value={exerciseName}
              onChangeText={setExerciseName}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleAddExercise}
            />
            <TouchableOpacity
              onPress={handleAddExercise}
              className="rounded-xl py-3.5 items-center"
              style={{ backgroundColor: accentColor }}
            >
              <Text className="text-white font-semibold text-sm">
                Add Exercise
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}
