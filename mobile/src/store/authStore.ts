import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface AuthStore {
  isAuthenticated: boolean
  user: { name: string; email: string } | null
  login: (name: string, email: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      login: (name, email) => set({ isAuthenticated: true, user: { name, email } }),
      logout: () => set({ isAuthenticated: false, user: null }),
    }),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
