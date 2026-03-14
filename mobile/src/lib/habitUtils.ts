import { subDays, format, parseISO, differenceInCalendarDays } from 'date-fns'

export interface StreakResult {
  current: number
  longest: number
}

export function calculateStreak(completions: Record<string, boolean>): StreakResult {
  const today = new Date()
  let current = 0
  let longest = 0
  let streak = 0

  for (let i = 0; i < 365; i++) {
    const date = format(subDays(today, i), 'yyyy-MM-dd')
    if (completions[date]) {
      current++
    } else {
      if (i === 0) continue
      break
    }
  }

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

export function formatDate(date: Date = new Date()): string {
  return format(date, 'yyyy-MM-dd')
}
