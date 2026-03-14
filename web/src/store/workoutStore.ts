import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { format } from 'date-fns'

export interface WorkoutSet {
  reps: number
  weight: number
  unit: 'lbs' | 'kg'
}

export interface Exercise {
  id: string
  name: string
  sets: WorkoutSet[]
}

export interface Workout {
  id: string
  name: string
  date: string
  startedAt: string
  finishedAt: string | null
  durationMinutes: number | null
  exercises: Exercise[]
  notes?: string
}

interface WorkoutStore {
  workouts: Workout[]

  startWorkout: (name: string) => string
  finishWorkout: (id: string) => void
  deleteWorkout: (id: string) => void
  addExercise: (workoutId: string, name: string) => void
  deleteExercise: (workoutId: string, exerciseId: string) => void
  addSet: (workoutId: string, exerciseId: string, set: WorkoutSet) => void
  updateSet: (
    workoutId: string,
    exerciseId: string,
    setIndex: number,
    set: WorkoutSet
  ) => void
  deleteSet: (workoutId: string, exerciseId: string, setIndex: number) => void
  getWorkout: (id: string) => Workout | undefined
}

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

export const useWorkoutStore = create<WorkoutStore>()(
  persist(
    (set, get) => ({
      workouts: [],

      startWorkout: (name) => {
        const id = uid()
        set((s) => ({
          workouts: [
            {
              id,
              name: name.trim() || 'Workout',
              date: format(new Date(), 'yyyy-MM-dd'),
              startedAt: new Date().toISOString(),
              finishedAt: null,
              durationMinutes: null,
              exercises: [],
            },
            ...s.workouts,
          ],
        }))
        return id
      },

      finishWorkout: (id) => {
        set((s) => ({
          workouts: s.workouts.map((w) => {
            if (w.id !== id) return w
            const started = new Date(w.startedAt).getTime()
            return {
              ...w,
              finishedAt: new Date().toISOString(),
              durationMinutes: Math.round((Date.now() - started) / 60_000),
            }
          }),
        }))
      },

      deleteWorkout: (id) =>
        set((s) => ({ workouts: s.workouts.filter((w) => w.id !== id) })),

      addExercise: (workoutId, name) =>
        set((s) => ({
          workouts: s.workouts.map((w) =>
            w.id !== workoutId
              ? w
              : {
                  ...w,
                  exercises: [
                    ...w.exercises,
                    { id: uid(), name: name.trim(), sets: [] },
                  ],
                }
          ),
        })),

      deleteExercise: (workoutId, exerciseId) =>
        set((s) => ({
          workouts: s.workouts.map((w) =>
            w.id !== workoutId
              ? w
              : {
                  ...w,
                  exercises: w.exercises.filter((e) => e.id !== exerciseId),
                }
          ),
        })),

      addSet: (workoutId, exerciseId, newSet) =>
        set((s) => ({
          workouts: s.workouts.map((w) =>
            w.id !== workoutId
              ? w
              : {
                  ...w,
                  exercises: w.exercises.map((e) =>
                    e.id !== exerciseId
                      ? e
                      : { ...e, sets: [...e.sets, newSet] }
                  ),
                }
          ),
        })),

      updateSet: (workoutId, exerciseId, setIndex, updatedSet) =>
        set((s) => ({
          workouts: s.workouts.map((w) =>
            w.id !== workoutId
              ? w
              : {
                  ...w,
                  exercises: w.exercises.map((e) => {
                    if (e.id !== exerciseId) return e
                    const sets = [...e.sets]
                    sets[setIndex] = updatedSet
                    return { ...e, sets }
                  }),
                }
          ),
        })),

      deleteSet: (workoutId, exerciseId, setIndex) =>
        set((s) => ({
          workouts: s.workouts.map((w) =>
            w.id !== workoutId
              ? w
              : {
                  ...w,
                  exercises: w.exercises.map((e) =>
                    e.id !== exerciseId
                      ? e
                      : { ...e, sets: e.sets.filter((_, i) => i !== setIndex) }
                  ),
                }
          ),
        })),

      getWorkout: (id) => get().workouts.find((w) => w.id === id),
    }),
    { name: 'workout-store' }
  )
)
