import { Link } from 'react-router-dom'
import { calculateReadiness } from '../../lib/readinessEngine'
import { useHealthStore } from '../../store/healthStore'

export default function ReadinessCard() {
  const todayMetrics = useHealthStore((s) => s.getTodayMetrics())
  const readiness = calculateReadiness(todayMetrics ?? {})

  return (
    <Link to="/health" className="block no-underline">
      <div className="rounded-xl border border-border bg-card p-4 hover:border-gray-300 transition-colors cursor-pointer">
        {/* Header row */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-text-secondary uppercase tracking-wide">
            Today's Readiness
          </span>
          <span className="text-text-secondary text-xs">›</span>
        </div>

        {/* Score + tier */}
        <div className="flex items-end gap-3 mb-3">
          <span
            className="text-4xl font-bold leading-none"
            style={{ color: readiness.color }}
          >
            {readiness.score}
          </span>
          <span
            className="text-sm font-semibold mb-0.5"
            style={{ color: readiness.color }}
          >
            {readiness.label}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-3">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${readiness.score}%`, backgroundColor: readiness.color }}
          />
        </div>

        <p className="text-xs text-text-secondary leading-relaxed">
          {readiness.description}
        </p>

        {/* Component mini-bars */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          {(
            [
              { label: 'HRV',      score: readiness.components.hrv,      color: '#A78BFA' },
              { label: 'Sleep',    score: readiness.components.sleep,    color: '#60A5FA' },
              { label: 'Activity', score: readiness.components.activity, color: '#4ADE80' },
            ] as const
          ).map((item) => (
            <div key={item.label}>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-xs text-text-secondary">{item.label}</span>
                <span className="text-xs font-semibold text-text-primary">{item.score}</span>
              </div>
              <div className="h-1 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${item.score}%`, backgroundColor: item.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Link>
  )
}
