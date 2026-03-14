import { useEffect, useRef, useState } from 'react'

interface SlashCommandMenuProps {
  onAdd: (name: string, icon?: string, color?: string) => void
  onClose: () => void
}

const PRESET_ICONS = ['✦', '◆', '▲', '●', '★', '❋', '⚡', '💧', '🧘', '📚', '🏃', '🎯']
const PRESET_COLORS = ['#4ADE80', '#60A5FA', '#A78BFA', '#FB923C', '#F472B6', '#34D399']

export default function SlashCommandMenu({ onAdd, onClose }: SlashCommandMenuProps) {
  const [name, setName] = useState('')
  const [icon, setIcon] = useState(PRESET_ICONS[0])
  const [color, setColor] = useState(PRESET_COLORS[0])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onAdd(name.trim(), icon, color)
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Menu */}
      <div className="absolute top-8 left-0 z-50 w-80 bg-surface border border-border rounded-lg shadow-lg p-4">
        <p className="text-xs text-text-secondary mb-3 font-medium uppercase tracking-wide">
          Add Habit
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {/* Name */}
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Habit name..."
            className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:border-text-secondary bg-surface"
          />

          {/* Icon picker */}
          <div>
            <p className="text-xs text-text-secondary mb-1.5">Icon</p>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_ICONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setIcon(ic)}
                  className={`w-8 h-8 rounded border text-sm transition-colors ${
                    icon === ic
                      ? 'border-text-secondary bg-muted'
                      : 'border-border hover:border-text-secondary'
                  }`}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          {/* Color picker */}
          <div>
            <p className="text-xs text-text-secondary mb-1.5">Color</p>
            <div className="flex gap-1.5">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full border-2 transition-transform ${
                    color === c ? 'border-text-primary scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 py-1.5 text-sm rounded bg-text-primary text-surface disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
            >
              Add
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-sm rounded border border-border text-text-secondary hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
