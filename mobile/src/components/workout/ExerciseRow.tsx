import { useState } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import type { Exercise, WorkoutSet } from '../../store/workoutStore'
import SetRow from './SetRow'

interface Props {
  exercise: Exercise
  onAddSet: () => void
  onUpdateSet: (setIndex: number, updated: WorkoutSet) => void
  onDeleteSet: (setIndex: number) => void
  onDelete: () => void
}

export default function ExerciseRow({
  exercise,
  onAddSet,
  onUpdateSet,
  onDeleteSet,
  onDelete,
}: Props) {
  const [expanded, setExpanded] = useState(true)

  return (
    <View className="bg-white rounded-2xl mb-3 overflow-hidden border border-gray-100 shadow-sm">
      {/* Exercise header */}
      <TouchableOpacity
        onPress={() => setExpanded((e) => !e)}
        className="flex-row items-center justify-between px-4 py-3"
        activeOpacity={0.7}
      >
        <View className="flex-row items-center gap-2 flex-1">
          <Text className="text-sm font-semibold text-gray-900 flex-1">
            {exercise.name}
          </Text>
          <Text className="text-xs text-gray-400">
            {exercise.sets.length} {exercise.sets.length === 1 ? 'set' : 'sets'}
          </Text>
        </View>
        <View className="flex-row items-center gap-3 ml-2">
          <TouchableOpacity
            onPress={onDelete}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text className="text-gray-300 text-base">🗑</Text>
          </TouchableOpacity>
          <Text className="text-gray-400">{expanded ? '▲' : '▼'}</Text>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View className="px-4 pb-3">
          {/* Column headers */}
          {exercise.sets.length > 0 && (
            <View className="flex-row items-center pb-1 border-b border-gray-100 mb-1">
              <View className="w-8" />
              <Text className="flex-1 text-xs text-gray-400 text-center mx-2">
                Reps
              </Text>
              <Text className="flex-1 text-xs text-gray-400 text-center mx-2">
                Weight
              </Text>
              <View className="w-10" />
              <View className="w-8" />
            </View>
          )}

          {exercise.sets.map((set, i) => (
            <SetRow
              key={i}
              setNumber={i + 1}
              set={set}
              onChange={(updated) => onUpdateSet(i, updated)}
              onDelete={() => onDeleteSet(i)}
            />
          ))}

          {/* Add set */}
          <TouchableOpacity
            onPress={onAddSet}
            className="flex-row items-center justify-center mt-2 py-2 rounded-xl border border-dashed border-gray-200"
          >
            <Text className="text-xs text-gray-400 font-medium">+ Add Set</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}
