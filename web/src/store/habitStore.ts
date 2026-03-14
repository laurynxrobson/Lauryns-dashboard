import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { format } from 'date-fns'

export interface Habit {
  id: string
  name: string
  icon: string
  color: string
  order: number
  completions: Record<string, boolean> // "YYYY-MM-DD" → true
  createdAt: string
}

interface HabitStore {
  habits: Habit[]
  addHabit: (name: string, icon?: string, color?: string) => void
  deleteHabit: (id: string) => void
  reorderHabits: (orderedIds: string[]) => void
  toggleCompletion: (id: string, date?: string) => void
}

const DEFAULT_COLORS = ['#4ADE80', '#60A5FA', '#A78BFA', '#FB923C', '#F472B6', '#34D399']
const DEFAULT_ICONS = ['✦', '◆', '▲', '●', '★', '❋']

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export const useHabitStore = create<HabitStore>()(
  persist(
    (set, get) => ({
      habits: [],

      addHabit: (name, icon, color) => {
        const habits = get().habits
        const idx = habits.length % DEFAULT_COLORS.length
        set({
          habits: [
            ...habits,
            {
              id: generateId(),
              name,
              icon: icon ?? DEFAULT_ICONS[idx],
              color: color ?? DEFAULT_COLORS[idx],
              order: habits.length,
              completions: {},
              createdAt: new Date().toISOString(),
            },
          ],
        })
      },

      deleteHabit: (id) =>
        set({ habits: get().habits.filter((h) => h.id !== id) }),

      reorderHabits: (orderedIds) => {
        const map = new Map(get().habits.map((h) => [h.id, h]))
        const reordered = orderedIds
          .map((id, idx) => {
            const h = map.get(id)
            return h ? { ...h, order: idx } : null
          })
          .filter(Boolean) as Habit[]
        set({ habits: reordered })
      },

      toggleCompletion: (id, date) => {
        const today = date ?? format(new Date(), 'yyyy-MM-dd')
        set({
          habits: get().habits.map((h) =>
            h.id === id
              ? {
                  ...h,
                  completions: {
                    ...h.completions,
                    [today]: !h.completions[today],
                  },
                }
              : h
          ),
        })
      },
    }),
    { name: 'habit-store' }
  )
)
