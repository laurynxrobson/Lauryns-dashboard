/**
 * workoutRecommendations.ts
 * Rule-based workout suggestions keyed on Readiness tier.
 */

import type { ReadinessTier } from './readinessEngine'

export interface WorkoutSuggestion {
  name: string
  duration: string   // e.g. "45–60 min"
  intensity: string
  emoji: string
}

const SUGGESTIONS: Record<ReadinessTier, WorkoutSuggestion[]> = {
  high: [
    { name: 'Heavy Compound Lifts',  duration: '60–75 min', intensity: 'High',     emoji: '🏋️' },
    { name: 'HIIT Intervals',        duration: '30–40 min', intensity: 'Very High', emoji: '⚡' },
    { name: 'Long Run',              duration: '45–60 min', intensity: 'High',     emoji: '🏃' },
    { name: 'Sprint Training',       duration: '30–45 min', intensity: 'Very High', emoji: '💨' },
  ],
  moderate: [
    { name: 'Full-Body Circuit',     duration: '40–50 min', intensity: 'Moderate', emoji: '🔄' },
    { name: 'Tempo Run',             duration: '30–40 min', intensity: 'Moderate', emoji: '🏃' },
    { name: 'Moderate Cardio',       duration: '35–45 min', intensity: 'Moderate', emoji: '🚴' },
    { name: 'Upper / Lower Split',   duration: '50–60 min', intensity: 'Moderate', emoji: '💪' },
  ],
  light: [
    { name: 'Yoga Flow',             duration: '30–45 min', intensity: 'Low',      emoji: '🧘' },
    { name: 'Brisk Walk',            duration: '30–45 min', intensity: 'Low',      emoji: '🚶' },
    { name: 'Mobility & Stretching', duration: '20–30 min', intensity: 'Very Low', emoji: '🤸' },
    { name: 'Easy Swim',             duration: '30–40 min', intensity: 'Low',      emoji: '🏊' },
  ],
  rest: [
    { name: 'Foam Rolling',          duration: '15–20 min', intensity: 'Very Low', emoji: '🫧' },
    { name: 'Gentle Stretching',     duration: '15–20 min', intensity: 'Very Low', emoji: '🧘' },
    { name: 'Leisure Walk',          duration: '20–30 min', intensity: 'Very Low', emoji: '🌿' },
  ],
}

/** Return the curated workout list for a given readiness tier. */
export function getRecommendations(tier: ReadinessTier): WorkoutSuggestion[] {
  return SUGGESTIONS[tier]
}

/** Return the single top recommendation for quick display. */
export function getTopRecommendation(tier: ReadinessTier): WorkoutSuggestion {
  return SUGGESTIONS[tier][0]
}
