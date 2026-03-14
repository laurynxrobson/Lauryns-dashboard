import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { useWorkoutStore, type Workout, type WorkoutSet } from '../../store/workoutStore'

interface Props {
  workout: Workout
  accentColor: string
  onOpen: () => void
  onDelete: () => void
}

export default function WorkoutBlock({ workout, accentColor, onOpen, onDelete }: Props) {
  const [expanded, setExpanded] = useState(false)

  const totalSets = workout.exercises.reduce((s, e) => s + e.sets.length, 0)

  return (
    <div className="bg-card rounded-xl border border-border mb-3 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={() => setExpanded((e) => !e)}
          className="flex-1 text-left"
        >
          <div className="font-semibold text-sm text-text-primary">
            {workout.name}
          </div>
          <div className="text-xs text-text-secondary mt-0.5">
            {format(parseISO(workout.startedAt), 'MMM d, yyyy · h:mm a')}
            {workout.durationMinutes ? ` · ${workout.durationMinutes} min` : ' · In progress'}
          </div>
        </button>

        <div className="flex items-center gap-3 ml-4">
          {/* Badges */}
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ backgroundColor: accentColor + '18', color: accentColor }}
          >
            {workout.exercises.length} ex
          </span>
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ backgroundColor: accentColor + '18', color: accentColor }}
          >
            {totalSets} sets
          </span>

          {/* Actions */}
          <button
            onClick={onOpen}
            className="text-xs text-text-secondary hover:text-text-primary px-2 py-1 rounded hover:bg-muted transition-colors"
          >
            {workout.finishedAt ? 'View' : 'Resume'}
          </button>
          <button
            onClick={onDelete}
            className="text-text-secondary hover:text-red-400 transition-colors p-1"
            title="Delete workout"
          >
            ✕
          </button>
          <button
            onClick={() => setExpanded((e) => !e)}
            className="text-text-secondary text-xs"
          >
            {expanded ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {/* Expanded exercise list */}
      {expanded && (
        <div className="border-t border-border px-4 pb-3 pt-3 space-y-3">
          {workout.exercises.length === 0 ? (
            <p className="text-xs text-text-secondary italic">No exercises logged.</p>
          ) : (
            workout.exercises.map((exercise) => (
              <ExerciseTable key={exercise.id} name={exercise.name} sets={exercise.sets} />
            ))
          )}
        </div>
      )}
    </div>
  )
}

function ExerciseTable({ name, sets }: { name: string; sets: WorkoutSet[] }) {
  return (
    <div>
      <div className="text-xs font-semibold text-text-primary mb-1.5">{name}</div>
      {sets.length === 0 ? (
        <p className="text-xs text-text-secondary italic">No sets.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-text-secondary">
                <th className="text-left pb-1 pr-4 font-medium">Set</th>
                <th className="text-right pb-1 pr-4 font-medium">Reps</th>
                <th className="text-right pb-1 font-medium">Weight</th>
              </tr>
            </thead>
            <tbody>
              {sets.map((set, i) => (
                <tr key={i} className="text-text-primary border-t border-border">
                  <td className="py-1 pr-4 text-text-secondary">{i + 1}</td>
                  <td className="py-1 pr-4 text-right">{set.reps}</td>
                  <td className="py-1 text-right">
                    {set.weight} {set.unit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
