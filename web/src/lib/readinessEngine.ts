/**
 * readinessEngine.ts (web)
 * Pure algorithm — identical logic to the mobile version but no React Native imports.
 */

export interface HealthMetrics {
  hrv?: number         // ms
  sleepHours?: number
  steps?: number
}

export interface ReadinessResult {
  score: number
  tier: ReadinessTier
  label: string
  description: string
  color: string
  components: { hrv: number; sleep: number; activity: number }
}

export type ReadinessTier = 'high' | 'moderate' | 'light' | 'rest'

function scoreHRV(ms: number): number {
  if (ms >= 70) return 100
  if (ms >= 55) return 85
  if (ms >= 40) return 65
  if (ms >= 25) return 45
  if (ms > 0)   return 25
  return 50
}

function scoreSleep(hours: number): number {
  if (hours >= 8.0) return 100
  if (hours >= 7.0) return 85
  if (hours >= 6.0) return 65
  if (hours >= 5.0) return 45
  if (hours > 0)    return 30
  return 50
}

function scoreActivity(steps: number): number {
  if (steps >= 10_000) return 100
  if (steps >= 7_500)  return 80
  if (steps >= 5_000)  return 60
  if (steps >= 2_500)  return 40
  if (steps > 0)       return 25
  return 50
}

function classifyTier(score: number): Omit<ReadinessResult, 'score' | 'components'> {
  if (score >= 80)
    return { tier: 'high',     label: 'High Intensity', description: 'Your body is primed. Push hard today.', color: '#4ADE80' }
  if (score >= 60)
    return { tier: 'moderate', label: 'Moderate',       description: 'Good energy — moderate lifts or cardio.', color: '#60A5FA' }
  if (score >= 40)
    return { tier: 'light',    label: 'Light',          description: 'Keep it easy — yoga or a brisk walk.', color: '#FB923C' }
  return   { tier: 'rest',     label: 'Rest Day',       description: 'Prioritise sleep, hydration, and gentle stretching.', color: '#F472B6' }
}

export function calculateReadiness(metrics: HealthMetrics): ReadinessResult {
  const hrvScore      = scoreHRV(metrics.hrv ?? 0)
  const sleepScore    = scoreSleep(metrics.sleepHours ?? 0)
  const activityScore = scoreActivity(metrics.steps ?? 0)
  const raw = hrvScore * 0.4 + sleepScore * 0.4 + activityScore * 0.2
  const score = Math.round(Math.min(100, Math.max(0, raw)))
  return { score, ...classifyTier(score), components: { hrv: hrvScore, sleep: sleepScore, activity: activityScore } }
}

export type { ReadinessTier as ReadinessTierType }
