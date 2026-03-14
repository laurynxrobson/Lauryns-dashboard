import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { format, subDays } from 'date-fns'
import {
  fetchDailyMetrics,
  requestHealthPermissions,
  isHealthKitAvailable,
  getMockData,
  type DailyHealthData,
} from '../lib/healthKit'

interface HealthStore {
  metrics: Record<string, DailyHealthData> // keyed by "YYYY-MM-DD"
  lastSynced: string | null
  permissionGranted: boolean
  isSyncing: boolean

  requestPermissions: () => Promise<boolean>
  syncHealthData: () => Promise<void>
  getMetricsForDate: (date: string) => DailyHealthData | null
  getTodayMetrics: () => DailyHealthData | null
}

export const useHealthStore = create<HealthStore>()(
  persist(
    (set, get) => ({
      metrics: {},
      lastSynced: null,
      permissionGranted: false,
      isSyncing: false,

      requestPermissions: async () => {
        if (!isHealthKitAvailable()) {
          // Populate with mock data so UI works in Expo Go
          set({ permissionGranted: true })
          await get().syncHealthData()
          return true
        }
        const granted = await requestHealthPermissions()
        set({ permissionGranted: granted })
        if (granted) await get().syncHealthData()
        return granted
      },

      syncHealthData: async () => {
        set({ isSyncing: true })
        try {
          // Fetch last 7 days
          const today = new Date()
          const fetches = Array.from({ length: 7 }, (_, i) => {
            const d = subDays(today, i)
            const dateStr = format(d, 'yyyy-MM-dd')
            return isHealthKitAvailable()
              ? fetchDailyMetrics(dateStr)
              : Promise.resolve(getMockData(dateStr))
          })

          const results = await Promise.all(fetches)
          const metricsMap: Record<string, DailyHealthData> = { ...get().metrics }
          for (const m of results) {
            metricsMap[m.date] = m
          }

          set({
            metrics: metricsMap,
            lastSynced: new Date().toISOString(),
          })
        } finally {
          set({ isSyncing: false })
        }
      },

      getMetricsForDate: (date) => get().metrics[date] ?? null,

      getTodayMetrics: () => {
        const today = format(new Date(), 'yyyy-MM-dd')
        return get().metrics[today] ?? null
      },
    }),
    {
      name: 'health-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
