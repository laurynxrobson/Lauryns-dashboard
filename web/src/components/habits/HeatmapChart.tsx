import { buildHeatmapData } from '../../lib/habitUtils'
import { format, parseISO } from 'date-fns'

interface HeatmapChartProps {
  completions: Record<string, boolean>
  accentColor?: string
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAYS = ['', 'Mon', '', 'Wed', '', 'Fri', '']

export default function HeatmapChart({ completions, accentColor = '#4ADE80' }: HeatmapChartProps) {
  const days = buildHeatmapData(completions)

  // Pad start so first day aligns to correct weekday column
  const firstDay = parseISO(days[0].date)
  const startDayOfWeek = firstDay.getDay() // 0=Sun
  const padded = Array(startDayOfWeek).fill(null).concat(days)

  // Split into weeks (columns of 7)
  const weeks: (typeof days[0] | null)[][] = []
  for (let i = 0; i < padded.length; i += 7) {
    weeks.push(padded.slice(i, i + 7))
  }

  function getCellColor(level: number): string {
    if (level === 0) return 'var(--color-heatmap-empty)'
    // Use accent color at full opacity
    return accentColor
  }

  function getMonthLabels() {
    const labels: { label: string; col: number }[] = []
    let lastMonth = -1
    weeks.forEach((week, colIdx) => {
      const firstReal = week.find(Boolean)
      if (firstReal) {
        const m = parseISO(firstReal.date).getMonth()
        if (m !== lastMonth) {
          labels.push({ label: MONTHS[m], col: colIdx })
          lastMonth = m
        }
      }
    })
    return labels
  }

  const monthLabels = getMonthLabels()

  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: 'max-content' }}>
        {/* Month labels */}
        <div className="flex mb-1 ml-6">
          {weeks.map((_, i) => {
            const label = monthLabels.find((m) => m.col === i)
            return (
              <div key={i} className="w-3 mr-0.5 text-[9px] text-text-secondary leading-none">
                {label?.label ?? ''}
              </div>
            )
          })}
        </div>

        <div className="flex gap-0">
          {/* Day labels */}
          <div className="flex flex-col mr-1">
            {DAYS.map((d, i) => (
              <div key={i} className="h-3 mb-0.5 text-[9px] text-text-secondary leading-none flex items-center w-5">
                {d}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="flex gap-0.5">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-0.5">
                {week.map((day, di) => (
                  <div
                    key={di}
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: day ? getCellColor(day.level) : 'transparent' }}
                    title={
                      day
                        ? `${format(parseISO(day.date), 'MMM d, yyyy')}${day.count ? ' ✓' : ''}`
                        : ''
                    }
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
