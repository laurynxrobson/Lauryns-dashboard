import { useState } from 'react'
import { format } from 'date-fns'
import DashboardLayout from '../components/layout/DashboardLayout'
import { useHealthStore } from '../store/healthStore'
import { calculateReadiness } from '../lib/readinessEngine'
import type { DailyHealthMetrics } from '../store/healthStore'

type MetricKey = keyof Omit<DailyHealthMetrics, 'date'>

const FIELDS: Array<{
  key: MetricKey
  label: string
  unit: string
  icon: string
  color: string
  placeholder: string
}> = [
  { key: 'hrv',              label: 'HRV',              unit: 'ms',   icon: '〰️', color: '#A78BFA', placeholder: 'e.g. 52' },
  { key: 'sleepHours',       label: 'Sleep',            unit: 'hrs',  icon: '🌙', color: '#60A5FA', placeholder: 'e.g. 7.5' },
  { key: 'steps',            label: 'Steps',            unit: '',     icon: '👟', color: '#4ADE80', placeholder: 'e.g. 8000' },
  { key: 'restingHeartRate', label: 'Resting HR',       unit: 'bpm',  icon: '💓', color: '#F472B6', placeholder: 'e.g. 58' },
  { key: 'activeCalories',   label: 'Active Calories',  unit: 'kcal', icon: '🔥', color: '#FB923C', placeholder: 'e.g. 480' },
]

export default function HealthPage() {
  const today = format(new Date(), 'yyyy-MM-dd')
  const { getTodayMetrics, setMetrics } = useHealthStore()
  const todayMetrics = getTodayMetrics()
  const readiness = calculateReadiness(todayMetrics ?? {})

  const [draft, setDraft] = useState<Partial<Omit<DailyHealthMetrics, 'date'>>>(
    todayMetrics ?? {}
  )
  const [saved, setSaved] = useState(false)

  function handleChange(key: MetricKey, value: string) {
    const num = parseFloat(value)
    setDraft((d) => ({ ...d, [key]: isNaN(num) ? 0 : num }))
    setSaved(false)
  }

  function handleSave() {
    setMetrics(today, draft)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs text-text-secondary mb-1">
            {format(new Date(), 'EEEE, MMMM d')}
          </p>
          <h1 className="text-2xl font-semibold text-text-primary">Health</h1>
          <p className="text-sm text-text-secondary mt-1">
            Enter today's metrics to calculate your Readiness Score.
          </p>
        </div>

        {/* Readiness Score Display */}
        <div
          className="rounded-xl p-5 mb-6 border"
          style={{ borderColor: readiness.color + '40', backgroundColor: readiness.color + '0C' }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-text-primary">
              Today's Readiness
            </span>
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ backgroundColor: readiness.color + '20', color: readiness.color }}
            >
              {readiness.label}
            </span>
          </div>

          <div className="flex items-end gap-3 mb-3">
            <span
              className="text-5xl font-bold leading-none"
              style={{ color: readiness.color }}
            >
              {readiness.score}
            </span>
            <span className="text-sm text-text-secondary mb-1 pb-0.5">/ 100</span>
          </div>

          <div className="h-2 bg-muted rounded-full overflow-hidden mb-3">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${readiness.score}%`, backgroundColor: readiness.color }}
            />
          </div>
          <p className="text-sm text-text-secondary">{readiness.description}</p>

          {/* Breakdown */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            {(
              [
                { label: 'HRV',      score: readiness.components.hrv,      color: '#A78BFA', weight: '40%' },
                { label: 'Sleep',    score: readiness.components.sleep,    color: '#60A5FA', weight: '40%' },
                { label: 'Activity', score: readiness.components.activity, color: '#4ADE80', weight: '20%' },
              ] as const
            ).map((item) => (
              <div key={item.label} className="bg-white rounded-lg p-3 border border-border">
                <div className="flex justify-between items-baseline mb-1.5">
                  <span className="text-xs text-text-secondary">{item.label}</span>
                  <span className="text-xs text-text-secondary opacity-60">{item.weight}</span>
                </div>
                <div className="text-lg font-bold mb-2" style={{ color: item.color }}>
                  {item.score}
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

        {/* Manual Input Form */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-text-secondary text-sm">〰️</span>
          <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wide">
            Log Metrics
          </h2>
          <span className="text-xs text-text-secondary">
            — Apple Health is iOS only. Enter manually here.
          </span>
        </div>

        <div className="space-y-3 mb-6">
          {FIELDS.map((field) => (
            <div
              key={field.key}
              className="flex items-center gap-4 bg-white rounded-xl border border-border px-4 py-3"
            >
              <span className="text-lg w-7 text-center">{field.icon}</span>
              <label className="flex-1 text-sm text-text-primary font-medium">
                {field.label}
                {field.unit && (
                  <span className="text-text-secondary font-normal ml-1">
                    ({field.unit})
                  </span>
                )}
              </label>
              <input
                type="number"
                min={0}
                step={field.key === 'sleepHours' ? 0.1 : 1}
                className="w-24 text-right border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary bg-muted focus:outline-none focus:border-gray-400"
                placeholder={field.placeholder}
                value={
                  (draft[field.key] as number | undefined) !== undefined &&
                  (draft[field.key] as number) > 0
                    ? String(draft[field.key])
                    : ''
                }
                onChange={(e) => handleChange(field.key, e.target.value)}
              />
            </div>
          ))}
        </div>

        <button
          onClick={handleSave}
          className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${
            saved
              ? 'bg-green-100 text-green-700 border border-green-200'
              : 'bg-text-primary text-white hover:opacity-90'
          }`}
        >
          {saved ? '✓ Saved' : 'Save Metrics'}
        </button>
      </div>
    </DashboardLayout>
  )
}
