/**
 * Web health store — manual entry only (HealthKit is iOS-only).
 * Persists to localStorage via Zustand persist middleware.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { format } from 'date-fns'

export interface DailyHealthMetrics {
  date: string
  hrv: number
  sleepHours: number
  steps: number
  restingHeartRate: number
  activeCalories: number
}

interface HealthStore {
  metrics: Record<string, DailyHealthMetrics>
  setMetrics: (date: string, data: Partial<Omit<DailyHealthMetrics, 'date'>>) => void
  getTodayMetrics: () => DailyHealthMetrics | null
  getMetricsForDate: (date: string) => DailyHealthMetrics | null
}

export const useHealthStore = create<HealthStore>()(
  persist(
    (set, get) => ({
      metrics: {},

      setMetrics: (date, data) =>
        set((s) => ({
          metrics: {
            ...s.metrics,
            [date]: {
              date,
              hrv: 0,
              sleepHours: 0,
              steps: 0,
              restingHeartRate: 0,
              activeCalories: 0,
              ...s.metrics[date],
              ...data,
            },
          },
        })),

      getTodayMetrics: () => {
        const today = format(new Date(), 'yyyy-MM-dd')
        return get().metrics[today] ?? null
      },

      getMetricsForDate: (date) => get().metrics[date] ?? null,
    }),
    { name: 'web-health-store' }
  )
)
