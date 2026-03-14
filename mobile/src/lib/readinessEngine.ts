/**
 * readinessEngine.ts
 * Pure, side-effect-free algorithm that converts daily health metrics
 * into a 0–100 Readiness Score.
 *
 * Weights
 *   HRV    40%  — best proxy for autonomic nervous system recovery
 *   Sleep  40%  — duration-based (quality tiers if more data available)
 *   Steps  20%  — yesterday's activity load (inverse contributor)
 */

import type { DailyHealthData } from './healthKit'

export interface ReadinessResult {
  score: number        // 0–100 integer
  tier: ReadinessTier
  label: string
  description: string
  color: string        // hex
  components: {
    hrv: number        // component score 0–100
    sleep: number
    activity: number
  }
}

export type ReadinessTier = 'high' | 'moderate' | 'light' | 'rest'

// ─── component scorers ───────────────────────────────────────────────────────

function scoreHRV(ms: number): number {
  if (ms >= 70) return 100
  if (ms >= 55) return 85
  if (ms >= 40) return 65
  if (ms >= 25) return 45
  if (ms > 0)   return 25
  return 50 // no data — neutral
}

function scoreSleep(hours: number): number {
  if (hours >= 8.0) return 100
  if (hours >= 7.0) return 85
  if (hours >= 6.0) return 65
  if (hours >= 5.0) return 45
  if (hours > 0)    return 30
  return 50 // no data — neutral
}

function scoreActivity(steps: number): number {
  // Higher steps = good baseline activity, not penalised unless very low
  if (steps >= 10_000) return 100
  if (steps >= 7_500)  return 80
  if (steps >= 5_000)  return 60
  if (steps >= 2_500)  return 40
  if (steps > 0)       return 25
  return 50 // no data — neutral
}

// ─── tier classifier ─────────────────────────────────────────────────────────

function classifyTier(score: number): Omit<ReadinessResult, 'score' | 'components'> {
  if (score >= 80) {
    return {
      tier: 'high',
      label: 'High Intensity',
      description: 'Your body is primed. Push hard today — heavy lifts, HIIT, or a long run.',
      color: '#4ADE80',
    }
  }
  if (score >= 60) {
    return {
      tier: 'moderate',
      label: 'Moderate',
      description: 'Good energy. Go for moderate cardio, compound lifts, or a full-body circuit.',
      color: '#60A5FA',
    }
  }
  if (score >= 40) {
    return {
      tier: 'light',
      label: 'Light',
      description: 'Keep it easy. Yoga, a brisk walk, or a mobility session will serve you well.',
      color: '#FB923C',
    }
  }
  return {
    tier: 'rest',
    label: 'Rest Day',
    description: 'Your body needs to recover. Prioritise sleep, hydration, and gentle stretching.',
    color: '#F472B6',
  }
}

// ─── public API ──────────────────────────────────────────────────────────────

/**
 * Calculate a Readiness Score from one day's health metrics.
 * All inputs are optional — missing values fall back to neutral 50.
 */
export function calculateReadiness(metrics: Partial<DailyHealthData>): ReadinessResult {
  const hrvScore      = scoreHRV(metrics.hrv ?? 0)
  const sleepScore    = scoreSleep(metrics.sleepHours ?? 0)
  const activityScore = scoreActivity(metrics.steps ?? 0)

  const raw = hrvScore * 0.4 + sleepScore * 0.4 + activityScore * 0.2
  const score = Math.round(Math.min(100, Math.max(0, raw)))

  return {
    score,
    ...classifyTier(score),
    components: {
      hrv: hrvScore,
      sleep: sleepScore,
      activity: activityScore,
    },
  }
}
