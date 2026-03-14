import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity } from 'react-native'
import type { WorkoutSet } from '../../store/workoutStore'

interface Props {
  setNumber: number
  set: WorkoutSet
  onChange: (updated: WorkoutSet) => void
  onDelete: () => void
}

export default function SetRow({ setNumber, set, onChange, onDelete }: Props) {
  const [reps, setRepsLocal] = useState(String(set.reps || ''))
  const [weight, setWeightLocal] = useState(String(set.weight || ''))

  function commit() {
    const r = parseInt(reps, 10)
    const w = parseFloat(weight)
    if (!isNaN(r) && !isNaN(w)) {
      onChange({ reps: r, weight: w, unit: set.unit })
    }
  }

  function toggleUnit() {
    onChange({
      ...set,
      unit: set.unit === 'lbs' ? 'kg' : 'lbs',
    })
  }

  return (
    <View className="flex-row items-center py-2 border-b border-gray-50">
      {/* Set number */}
      <View className="w-8 items-center">
        <Text className="text-xs font-semibold text-gray-400">{setNumber}</Text>
      </View>

      {/* Reps */}
      <View className="flex-1 mx-2">
        <TextInput
          className="bg-gray-50 rounded-lg px-3 py-2 text-sm text-center text-gray-800 border border-gray-100"
          placeholder="Reps"
          keyboardType="number-pad"
          value={reps}
          onChangeText={setRepsLocal}
          onBlur={commit}
          placeholderTextColor="#9CA3AF"
        />
      </View>

      {/* Weight */}
      <View className="flex-1 mx-2">
        <TextInput
          className="bg-gray-50 rounded-lg px-3 py-2 text-sm text-center text-gray-800 border border-gray-100"
          placeholder="Weight"
          keyboardType="decimal-pad"
          value={weight}
          onChangeText={setWeightLocal}
          onBlur={commit}
          placeholderTextColor="#9CA3AF"
        />
      </View>

      {/* Unit toggle */}
      <TouchableOpacity
        onPress={toggleUnit}
        className="w-10 items-center py-2 rounded-lg bg-gray-100"
      >
        <Text className="text-xs font-semibold text-gray-500">{set.unit}</Text>
      </TouchableOpacity>

      {/* Delete */}
      <TouchableOpacity
        onPress={onDelete}
        className="w-8 items-center ml-1"
        hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
      >
        <Text className="text-gray-300 text-lg">×</Text>
      </TouchableOpacity>
    </View>
  )
}
