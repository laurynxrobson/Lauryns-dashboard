interface StreakBadgeProps {
  current: number
  longest: number
}

export default function StreakBadge({ current, longest }: StreakBadgeProps) {
  return (
    <div className="flex items-center gap-3 text-xs text-text-secondary">
      <span className="flex items-center gap-1">
        <span className="text-orange-400">🔥</span>
        <span className="font-medium text-text-primary">{current}</span>
        <span>streak</span>
      </span>
      <span className="text-border">·</span>
      <span className="flex items-center gap-1">
        <span>best</span>
        <span className="font-medium text-text-primary">{longest}</span>
      </span>
    </div>
  )
}
