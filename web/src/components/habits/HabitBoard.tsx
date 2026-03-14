import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { useHabitStore } from '../../store/habitStore'
import HabitBlock from './HabitBlock'
import SlashCommandMenu from './SlashCommandMenu'

export default function HabitBoard() {
  const { habits, reorderHabits, addHabit } = useHabitStore()
  const [showSlash, setShowSlash] = useState(false)
  const sorted = [...habits].sort((a, b) => a.order - b.order)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = sorted.findIndex((h) => h.id === active.id)
    const newIndex = sorted.findIndex((h) => h.id === over.id)
    const newOrder = arrayMove(sorted, oldIndex, newIndex)
    reorderHabits(newOrder.map((h) => h.id))
  }

  function handleAddHabit(name: string, icon?: string, color?: string) {
    addHabit(name, icon, color)
    setShowSlash(false)
  }

  return (
    <div className="relative">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sorted.map((h) => h.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-3">
            {sorted.map((habit) => (
              <HabitBlock key={habit.id} habit={habit} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Empty state */}
      {sorted.length === 0 && (
        <div className="text-center py-16 text-text-secondary">
          <p className="text-4xl mb-3">◎</p>
          <p className="text-sm">No habits yet.</p>
          <p className="text-sm mt-1">
            Type <kbd className="px-1 py-0.5 bg-muted border border-border rounded text-xs">/</kbd> to add your first habit.
          </p>
        </div>
      )}

      {/* Add habit button */}
      <div className="mt-4 relative">
        <button
          onClick={() => setShowSlash(true)}
          className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors group"
        >
          <span className="w-5 h-5 rounded border border-border group-hover:border-text-secondary flex items-center justify-center text-xs">+</span>
          <span>Add habit</span>
          <kbd className="px-1 py-0.5 bg-muted border border-border rounded text-xs opacity-60">/</kbd>
        </button>

        {showSlash && (
          <SlashCommandMenu
            onAdd={handleAddHabit}
            onClose={() => setShowSlash(false)}
          />
        )}
      </div>
    </div>
  )
}
