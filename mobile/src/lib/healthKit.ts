/**
 * healthKit.ts
 * Thin wrapper around react-native-health.
 * Handles permission requests and typed data fetching.
 * Falls back gracefully to mock data if running in Expo Go
 * (which lacks the native module).
 */

import { Platform } from 'react-native'

// Lazy-require so the app doesn't crash in Expo Go / Android
let AppleHealthKit: any = null
let Permissions: any = null

try {
  const mod = require('react-native-health')
  AppleHealthKit = mod.default
  Permissions = mod.HealthInputOptions
} catch {
  // Native module not available (Expo Go or Android)
}

export interface DailyHealthData {
  date: string             // "YYYY-MM-DD"
  steps: number
  activeCalories: number
  restingHeartRate: number
  hrv: number              // ms — Heart Rate Variability (SDNN)
  sleepHours: number
}

const PERMISSIONS = {
  permissions: {
    read: [
      'StepCount',
      'ActiveEnergyBurned',
      'HeartRate',
      'HeartRateVariability',
      'SleepAnalysis',
      'RestingHeartRate',
    ],
    write: ['Workout'],
  },
}

/** Returns true if HealthKit is available on this device. */
export function isHealthKitAvailable(): boolean {
  return Platform.OS === 'ios' && AppleHealthKit !== null
}

/** Request HealthKit read permissions. Resolves true on success. */
export async function requestHealthPermissions(): Promise<boolean> {
  if (!isHealthKitAvailable()) return false
  return new Promise((resolve) => {
    AppleHealthKit.initHealthKit(PERMISSIONS, (err: string) => {
      resolve(!err)
    })
  })
}

// ─── individual fetchers ─────────────────────────────────────────────────────

function fetchSteps(date: Date): Promise<number> {
  return new Promise((resolve) => {
    const options = {
      date: date.toISOString(),
      includeManuallyAdded: true,
    }
    AppleHealthKit.getStepCount(options, (_err: any, result: any) => {
      resolve(result?.value ?? 0)
    })
  })
}

function fetchActiveCalories(startDate: Date, endDate: Date): Promise<number> {
  return new Promise((resolve) => {
    const options = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    }
    AppleHealthKit.getActiveEnergyBurned(
      options,
      (_err: any, results: any[]) => {
        const total = (results ?? []).reduce(
          (sum, r) => sum + (r.value ?? 0),
          0
        )
        resolve(Math.round(total))
      }
    )
  })
}

function fetchLatestHRV(startDate: Date): Promise<number> {
  return new Promise((resolve) => {
    const options = {
      startDate: startDate.toISOString(),
      limit: 10,
    }
    AppleHealthKit.getHeartRateVariabilitySamples(
      options,
      (_err: any, results: any[]) => {
        if (!results?.length) return resolve(0)
        // Take the most-recent non-zero reading (converted ms → ms)
        const latest = results
          .slice()
          .reverse()
          .find((r) => r.value > 0)
        resolve(latest ? Math.round(latest.value * 1000) : 0)
      }
    )
  })
}

function fetchRestingHR(startDate: Date): Promise<number> {
  return new Promise((resolve) => {
    const options = {
      startDate: startDate.toISOString(),
      limit: 1,
    }
    AppleHealthKit.getRestingHeartRate(
      options,
      (_err: any, result: any) => {
        resolve(result?.value ?? 0)
      }
    )
  })
}

function fetchSleepHours(startDate: Date, endDate: Date): Promise<number> {
  return new Promise((resolve) => {
    const options = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    }
    AppleHealthKit.getSleepSamples(options, (_err: any, results: any[]) => {
      if (!results?.length) return resolve(0)
      // Sum "ASLEEP" durations only
      let totalMs = 0
      for (const r of results) {
        if (r.value === 'ASLEEP' || r.value === 'CORE' || r.value === 'DEEP' || r.value === 'REM') {
          const start = new Date(r.startDate).getTime()
          const end = new Date(r.endDate).getTime()
          totalMs += end - start
        }
      }
      resolve(parseFloat((totalMs / 3_600_000).toFixed(1)))
    })
  })
}

// ─── public API ──────────────────────────────────────────────────────────────

/** Fetch all health metrics for a given calendar date string "YYYY-MM-DD". */
export async function fetchDailyMetrics(
  dateStr: string
): Promise<DailyHealthData> {
  if (!isHealthKitAvailable()) {
    return getMockData(dateStr)
  }

  const [y, m, d] = dateStr.split('-').map(Number)
  const dayStart = new Date(y, m - 1, d, 0, 0, 0)
  const dayEnd = new Date(y, m - 1, d, 23, 59, 59)

  const [steps, activeCalories, hrv, restingHeartRate, sleepHours] =
    await Promise.all([
      fetchSteps(dayEnd),
      fetchActiveCalories(dayStart, dayEnd),
      fetchLatestHRV(dayStart),
      fetchRestingHR(dayStart),
      fetchSleepHours(dayStart, dayEnd),
    ])

  return {
    date: dateStr,
    steps,
    activeCalories,
    restingHeartRate,
    hrv,
    sleepHours,
  }
}

/** Deterministic mock data so the UI is usable without a dev build. */
export function getMockData(dateStr: string): DailyHealthData {
  // Seed a mild variation based on date string so data looks realistic
  const seed = dateStr
    .split('')
    .reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const rand = (base: number, variance: number) =>
    Math.round(base + ((seed % variance) - variance / 2))

  return {
    date: dateStr,
    steps: rand(8200, 4000),
    activeCalories: rand(480, 200),
    restingHeartRate: rand(58, 10),
    hrv: rand(52, 30),
    sleepHours: parseFloat((rand(72, 20) / 10).toFixed(1)),
  }
}
