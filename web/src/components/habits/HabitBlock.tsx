import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { type Habit, useHabitStore } from '../../store/habitStore'
import { calculateStreak, isCompletedToday, formatDate } from '../../lib/habitUtils'
import StreakBadge from '../ui/StreakBadge'
import HeatmapChart from './HeatmapChart'

interface HabitBlockProps {
  habit: Habit
}

export default function HabitBlock({ habit }: HabitBlockProps) {
  const { toggleCompletion, deleteHabit } = useHabitStore()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: habit.id })

  const streak = calculateStreak(habit.completions)
  const completedToday = isCompletedToday(habit.completions)
  const today = formatDate()

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-surface border border-border rounded-lg p-4 select-none"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        {/* Drag handle */}
        <button
          {...listeners}
          {...attributes}
          className="cursor-grab active:cursor-grabbing text-text-secondary hover:text-text-primary touch-none p-0.5"
          title="Drag to reorder"
        >
          ⠿
        </button>

        {/* Icon + accent */}
        <span
          className="w-7 h-7 rounded flex items-center justify-center text-sm font-bold"
          style={{ backgroundColor: habit.color + '22', color: habit.color }}
        >
          {habit.icon}
        </span>

        <span className="flex-1 font-medium text-text-primary text-sm">{habit.name}</span>

        {/* Complete today */}
        <button
          onClick={() => toggleCompletion(habit.id, today)}
          className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
            completedToday
              ? 'border-transparent text-white'
              : 'border-border hover:border-text-secondary'
          }`}
          style={completedToday ? { backgroundColor: habit.color } : {}}
          title={completedToday ? 'Mark incomplete' : 'Mark complete'}
        >
          {completedToday && <span className="text-xs">✓</span>}
        </button>

        {/* Delete */}
        <button
          onClick={() => deleteHabit(habit.id)}
          className="text-text-secondary hover:text-red-400 transition-colors text-xs p-1"
          title="Delete habit"
        >
          ✕
        </button>
      </div>

      {/* Streak */}
      <div className="mb-3">
        <StreakBadge current={streak.current} longest={streak.longest} />
      </div>

      {/* Heatmap */}
      <HeatmapChart completions={habit.completions} accentColor={habit.color} />
    </div>
  )
}
