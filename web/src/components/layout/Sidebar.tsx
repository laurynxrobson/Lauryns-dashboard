import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

const NAV_ITEMS = [
  { label: 'Dashboard', icon: '⊞', path: '/dashboard' },
  { label: 'Habits', icon: '◎', path: '/dashboard' },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/auth')
  }

  return (
    <aside
      className={`flex flex-col h-screen border-r border-border bg-muted transition-all duration-200 ${
        collapsed ? 'w-14' : 'w-56'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-4 border-b border-border">
        {!collapsed && (
          <span className="text-sm font-semibold text-text-primary truncate">
            {user?.name ?? 'Dashboard'}
          </span>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="p-1 rounded hover:bg-border text-text-secondary text-xs"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? '›' : '‹'}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-2">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path + item.label}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 mx-1 rounded text-sm transition-colors ${
                isActive
                  ? 'bg-border text-text-primary font-medium'
                  : 'text-text-secondary hover:bg-border hover:text-text-primary'
              }`
            }
          >
            <span className="text-base leading-none">{item.icon}</span>
            {!collapsed && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-3">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-2 py-1.5 rounded text-sm text-text-secondary hover:bg-border hover:text-text-primary transition-colors"
        >
          <span>⎋</span>
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  )
}
