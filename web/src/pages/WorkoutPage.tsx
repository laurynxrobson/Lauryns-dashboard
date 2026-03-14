import { useState, useRef } from 'react'
import { format } from 'date-fns'
import DashboardLayout from '../components/layout/DashboardLayout'
import WorkoutBlock from '../components/workout/WorkoutBlock'
import { useWorkoutStore } from '../store/workoutStore'
import { useHealthStore } from '../store/healthStore'
import { calculateReadiness } from '../lib/readinessEngine'
import { getTopRecommendation, getRecommendations } from '../lib/workoutRecommendations'
import type { ReadinessTier } from '../lib/readinessEngine'

// ─── inline workout recommendations (web copy) ──────────────────────────────
function getTopRec(tier: ReadinessTier) {
  const recs: Record<ReadinessTier, { name: string; duration: string; emoji: string }> = {
    high:     { name: 'Heavy Compound Lifts', duration: '60–75 min', emoji: '🏋️' },
    moderate: { name: 'Full-Body Circuit',    duration: '40–50 min', emoji: '🔄' },
    light:    { name: 'Yoga Flow',            duration: '30–45 min', emoji: '🧘' },
    rest:     { name: 'Foam Rolling',         duration: '15–20 min', emoji: '🫧' },
  }
  return recs[tier]
}

// ─── Active Workout Modal ────────────────────────────────────────────────────

type ModalState =
  | { mode: 'none' }
  | { mode: 'new' }
  | { mode: 'log'; workoutId: string }

export default function WorkoutPage() {
  const today = format(new Date(), 'yyyy-MM-dd')
  const { workouts, startWorkout, finishWorkout, deleteWorkout, addExercise, addSet, updateSet, deleteSet } =
    useWorkoutStore()
  const todayMetrics = useHealthStore((s) => s.getTodayMetrics())
  const readiness = calculateReadiness(todayMetrics ?? {})
  const topRec = getTopRec(readiness.tier)

  const [modal, setModal] = useState<ModalState>({ mode: 'none' })
  const [newName, setNewName] = useState('')
  const [newExercise, setNewExercise] = useState('')

  // for log modal
  const activeWorkout =
    modal.mode === 'log' ? workouts.find((w) => w.id === modal.workoutId) : null

  function handleStartWorkout() {
    const name = newName.trim() || topRec.name
    const id = startWorkout(name)
    setNewName('')
    setModal({ mode: 'log', workoutId: id })
  }

  function handleAddExercise() {
    if (!activeWorkout || !newExercise.trim()) return
    addExercise(activeWorkout.id, newExercise.trim())
    setNewExercise('')
  }

  const finished = workouts.filter((w) => w.finishedAt !== null)
  const inProgress = workouts.filter((w) => w.finishedAt === null)

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs text-text-secondary mb-1">
              {format(new Date(), 'EEEE, MMMM d')}
            </p>
            <h1 className="text-2xl font-semibold text-text-primary">Workouts</h1>
          </div>
          <button
            onClick={() => setModal({ mode: 'new' })}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: readiness.color }}
          >
            + New Workout
          </button>
        </div>

        {/* Readiness Banner */}
        <div
          className="rounded-xl p-4 mb-6 flex items-center gap-4 border"
          style={{ borderColor: readiness.color + '30', backgroundColor: readiness.color + '0A' }}
        >
          <span className="text-2xl">{topRec.emoji}</span>
          <div className="flex-1">
            <div
              className="text-xs font-semibold uppercase tracking-wide mb-0.5"
              style={{ color: readiness.color }}
            >
              Readiness {readiness.score} · {readiness.label}
            </div>
            <div className="text-sm font-medium text-text-primary">{topRec.name}</div>
            <div className="text-xs text-text-secondary">{topRec.duration}</div>
          </div>
          <button
            onClick={() => setModal({ mode: 'new' })}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white"
            style={{ backgroundColor: readiness.color }}
          >
            Start
          </button>
        </div>

        {/* In-progress */}
        {inProgress.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-semibold text-text-primary uppercase tracking-wide">
                In Progress
              </span>
              <span className="text-xs text-text-secondary bg-muted border border-border rounded px-1.5 py-0.5">
                {inProgress.length}
              </span>
            </div>
            {inProgress.map((w) => (
              <WorkoutBlock
                key={w.id}
                workout={w}
                accentColor={readiness.color}
                onOpen={() => setModal({ mode: 'log', workoutId: w.id })}
                onDelete={() => deleteWorkout(w.id)}
              />
            ))}
          </div>
        )}

        {/* History */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-text-secondary text-sm">🏋️</span>
            <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wide">
              History
            </h2>
            <span className="text-xs text-text-secondary bg-muted border border-border rounded px-1.5 py-0.5">
              {finished.length}
            </span>
          </div>

          {finished.length === 0 ? (
            <div className="text-center py-16 text-text-secondary">
              <div className="text-4xl mb-3">🏋️</div>
              <p className="text-sm">No completed workouts yet.</p>
              <p className="text-xs mt-1">
                Click "+ New Workout" to log your first session.
              </p>
            </div>
          ) : (
            finished.map((w) => (
              <WorkoutBlock
                key={w.id}
                workout={w}
                accentColor={readiness.color}
                onOpen={() => setModal({ mode: 'log', workoutId: w.id })}
                onDelete={() => deleteWorkout(w.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* ── New Workout Modal ─────────────────────────── */}
      {modal.mode === 'new' && (
        <div className="fixed inset-0 bg-black/30 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 mb-4 sm:mb-0">
            <h2 className="text-base font-bold text-text-primary mb-1">
              Start a Workout
            </h2>
            <p className="text-xs text-text-secondary mb-4">
              Recommended: {topRec.emoji} {topRec.name} · {topRec.duration}
            </p>
            <input
              autoFocus
              type="text"
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary mb-4 focus:outline-none focus:border-gray-400"
              placeholder={topRec.name}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleStartWorkout()}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setModal({ mode: 'none' })}
                className="flex-1 py-2.5 rounded-xl text-sm text-text-secondary border border-border hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStartWorkout}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: readiness.color }}
              >
                Start Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Log Modal ────────────────────────────────── */}
      {modal.mode === 'log' && activeWorkout && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <h2 className="text-base font-bold text-text-primary">
                  {activeWorkout.name}
                </h2>
                <p className="text-xs text-text-secondary">
                  {activeWorkout.exercises.length} exercises ·{' '}
                  {activeWorkout.exercises.reduce(
                    (s, e) => s + e.sets.length,
                    0
                  )}{' '}
                  sets
                </p>
              </div>
              <div className="flex items-center gap-2">
                {!activeWorkout.finishedAt && (
                  <button
                    onClick={() => {
                      finishWorkout(activeWorkout.id)
                      setModal({ mode: 'none' })
                    }}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white"
                    style={{ backgroundColor: readiness.color }}
                  >
                    Finish
                  </button>
                )}
                <button
                  onClick={() => setModal({ mode: 'none' })}
                  className="text-text-secondary hover:text-text-primary text-lg px-1"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Exercise list */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {activeWorkout.exercises.map((exercise) => (
                <div
                  key={exercise.id}
                  className="border border-border rounded-xl overflow-hidden"
                >
                  <div className="flex items-center justify-between px-4 py-2.5 bg-muted">
                    <span className="text-sm font-semibold text-text-primary">
                      {exercise.name}
                    </span>
                    <button
                      onClick={() =>
                        useWorkoutStore
                          .getState()
                          .deleteExercise(activeWorkout.id, exercise.id)
                      }
                      className="text-text-secondary hover:text-red-400 text-xs"
                    >
                      ✕
                    </button>
                  </div>

                  {exercise.sets.length > 0 && (
                    <div className="px-4 pt-2 pb-1">
                      <div className="grid grid-cols-4 text-xs text-text-secondary mb-1">
                        <span>#</span>
                        <span className="text-right">Reps</span>
                        <span className="text-right">Weight</span>
                        <span />
                      </div>
                      {exercise.sets.map((set, i) => (
                        <SetRow
                          key={i}
                          setNum={i + 1}
                          set={set}
                          onChange={(updated) =>
                            updateSet(activeWorkout.id, exercise.id, i, updated)
                          }
                          onDelete={() =>
                            deleteSet(activeWorkout.id, exercise.id, i)
                          }
                        />
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() =>
                      addSet(activeWorkout.id, exercise.id, {
                        reps: 0,
                        weight: 0,
                        unit: 'lbs',
                      })
                    }
                    className="w-full text-xs text-text-secondary hover:text-text-primary py-2 border-t border-border"
                  >
                    + Add Set
                  </button>
                </div>
              ))}

              {activeWorkout.exercises.length === 0 && (
                <p className="text-sm text-text-secondary text-center py-8">
                  No exercises yet. Add one below.
                </p>
              )}
            </div>

            {/* Add exercise input */}
            <div className="px-5 py-4 border-t border-border flex gap-2">
              <input
                type="text"
                className="flex-1 border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-gray-400"
                placeholder="Exercise name…"
                value={newExercise}
                onChange={(e) => setNewExercise(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddExercise()}
              />
              <button
                onClick={handleAddExercise}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
                style={{ backgroundColor: readiness.color }}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

// ─── inline SetRow for the web log modal ─────────────────────────────────────
function SetRow({
  setNum,
  set,
  onChange,
  onDelete,
}: {
  setNum: number
  set: { reps: number; weight: number; unit: 'lbs' | 'kg' }
  onChange: (s: { reps: number; weight: number; unit: 'lbs' | 'kg' }) => void
  onDelete: () => void
}) {
  return (
    <div className="grid grid-cols-4 items-center gap-2 py-1">
      <span className="text-xs text-text-secondary">{setNum}</span>
      <input
        type="number"
        min={0}
        className="text-right text-xs border border-border rounded px-2 py-1 w-full focus:outline-none"
        value={set.reps || ''}
        onChange={(e) =>
          onChange({ ...set, reps: parseInt(e.target.value, 10) || 0 })
        }
        placeholder="—"
      />
      <input
        type="number"
        min={0}
        step={0.5}
        className="text-right text-xs border border-border rounded px-2 py-1 w-full focus:outline-none"
        value={set.weight || ''}
        onChange={(e) =>
          onChange({ ...set, weight: parseFloat(e.target.value) || 0 })
        }
        placeholder="—"
      />
      <button
        onClick={onDelete}
        className="text-text-secondary hover:text-red-400 text-xs text-right"
      >
        ✕
      </button>
    </div>
  )
}

// ─── re-export recommendation helpers used in this file ──────────────────────
function getWorkoutRecommendations(tier: ReadinessTier) {
  const map: Record<
    ReadinessTier,
    Array<{ name: string; duration: string; emoji: string; intensity: string }>
  > = {
    high:     [
      { name: 'Heavy Compound Lifts', duration: '60–75 min', emoji: '🏋️', intensity: 'High' },
      { name: 'HIIT Intervals',       duration: '30–40 min', emoji: '⚡', intensity: 'Very High' },
    ],
    moderate: [
      { name: 'Full-Body Circuit', duration: '40–50 min', emoji: '🔄', intensity: 'Moderate' },
      { name: 'Tempo Run',         duration: '30–40 min', emoji: '🏃', intensity: 'Moderate' },
    ],
    light:    [
      { name: 'Yoga Flow',             duration: '30–45 min', emoji: '🧘', intensity: 'Low' },
      { name: 'Mobility & Stretching', duration: '20–30 min', emoji: '🤸', intensity: 'Very Low' },
    ],
    rest:     [
      { name: 'Foam Rolling',    duration: '15–20 min', emoji: '🫧', intensity: 'Very Low' },
      { name: 'Gentle Stretching', duration: '15–20 min', emoji: '🧘', intensity: 'Very Low' },
    ],
  }
  return map[tier]
}
