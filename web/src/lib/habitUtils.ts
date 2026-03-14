import { subDays, format, parseISO, differenceInCalendarDays } from 'date-fns'

export interface StreakResult {
  current: number
  longest: number
}

export interface HeatmapDay {
  date: string   // "YYYY-MM-DD"
  count: number  // 0 or 1 for a single habit
  level: 0 | 1 | 2 | 3 | 4  // intensity level for coloring
}

/** Calculate current and longest streaks from a completion map */
export function calculateStreak(completions: Record<string, boolean>): StreakResult {
  const today = new Date()
  let current = 0
  let longest = 0
  let streak = 0

  // Check current streak (backwards from today)
  for (let i = 0; i < 365; i++) {
    const date = format(subDays(today, i), 'yyyy-MM-dd')
    if (completions[date]) {
      current++
    } else {
      // Allow today to be incomplete without breaking streak
      if (i === 0) continue
      break
    }
  }

  // Find longest streak across all completions
  const dates = Object.keys(completions)
    .filter((d) => completions[d])
    .sort()

  for (let i = 0; i < dates.length; i++) {
    if (i === 0) {
      streak = 1
    } else {
      const prev = parseISO(dates[i - 1])
      const curr = parseISO(dates[i])
      const diff = differenceInCalendarDays(curr, prev)
      streak = diff === 1 ? streak + 1 : 1
    }
    longest = Math.max(longest, streak)
  }

  return { current, longest }
}

/** Build a 365-day heatmap data array ending today */
export function buildHeatmapData(completions: Record<string, boolean>): HeatmapDay[] {
  const today = new Date()
  const days: HeatmapDay[] = []

  for (let i = 364; i >= 0; i--) {
    const date = format(subDays(today, i), 'yyyy-MM-dd')
    const count = completions[date] ? 1 : 0
    days.push({ date, count, level: count > 0 ? 4 : 0 })
  }

  return days
}

/** Build aggregate heatmap data for all habits combined */
export function buildAggregateHeatmap(
  allCompletions: Record<string, boolean>[]
): HeatmapDay[] {
  const today = new Date()
  const days: HeatmapDay[] = []
  const total = allCompletions.length || 1

  for (let i = 364; i >= 0; i--) {
    const date = format(subDays(today, i), 'yyyy-MM-dd')
    const count = allCompletions.filter((c) => c[date]).length
    const ratio = count / total
    let level: 0 | 1 | 2 | 3 | 4 = 0
    if (ratio > 0) level = 1
    if (ratio >= 0.25) level = 2
    if (ratio >= 0.5) level = 3
    if (ratio >= 0.75) level = 4
    days.push({ date, count, level })
  }

  return days
}

export function formatDate(date: Date = new Date()): string {
  return format(date, 'yyyy-MM-dd')
}

export function isCompletedToday(completions: Record<string, boolean>): boolean {
  return Boolean(completions[formatDate()])
}
