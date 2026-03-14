import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ThemeStore {
  isDark: boolean
  toggleDark: () => void
  initTheme: () => void
}

function applyClass(isDark: boolean) {
  document.documentElement.classList.toggle('dark', isDark)
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      isDark: false,

      toggleDark: () => {
        const next = !get().isDark
        set({ isDark: next })
        applyClass(next)
      },

      initTheme: () => {
        applyClass(get().isDark)
      },
    }),
    {
      name: 'theme',
      onRehydrateStorage: () => (state) => {
        if (state) applyClass(state.isDark)
      },
    }
  )
)
