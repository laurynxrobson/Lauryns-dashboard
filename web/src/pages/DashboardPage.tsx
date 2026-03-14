import { useEffect, useRef } from 'react'
import { useHabitStore } from '../store/habitStore'
import { useAuthStore } from '../store/authStore'
import DashboardLayout from '../components/layout/DashboardLayout'
import HabitBoard from '../components/habits/HabitBoard'
import { format } from 'date-fns'

export default function DashboardPage() {
  const { habits } = useHabitStore()
  const { user } = useAuthStore()
  const boardRef = useRef<HTMLDivElement>(null)

  // Global "/" key opens slash command
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.key === '/') {
        e.preventDefault()
        // Find and click the add button inside HabitBoard
        const btn = boardRef.current?.querySelector<HTMLButtonElement>('[data-slash-trigger]')
        btn?.click()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const completedToday = habits.filter(
    (h) => h.completions[format(new Date(), 'yyyy-MM-dd')]
  ).length

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs text-text-secondary mb-1">
            {format(new Date(), 'EEEE, MMMM d')}
          </p>
          <h1 className="text-2xl font-semibold text-text-primary">
            Good {getGreeting()}, {user?.name?.split(' ')[0] ?? 'Lauryn'} 👋
          </h1>
          {habits.length > 0 && (
            <p className="text-sm text-text-secondary mt-1">
              {completedToday} of {habits.length} habits done today
            </p>
          )}
        </div>

        {/* Section title */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-text-secondary text-sm">◎</span>
          <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wide">
            Habits
          </h2>
          <span className="text-xs text-text-secondary bg-muted border border-border rounded px-1.5 py-0.5">
            {habits.length}
          </span>
        </div>

        {/* Habit board */}
        <div ref={boardRef}>
          <HabitBoard />
        </div>
      </div>
    </DashboardLayout>
  )
}

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}
