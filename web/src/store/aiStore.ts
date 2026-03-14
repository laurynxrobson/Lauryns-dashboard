import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface AIStore {
  messages: ChatMessage[]
  isStreaming: boolean

  addUserMessage: (content: string) => string
  startAssistantMessage: () => string
  appendToAssistantMessage: (id: string, delta: string) => void
  finaliseAssistantMessage: (id: string) => void
  clearConversation: () => void
}

function uid() { return Math.random().toString(36).slice(2, 10) }

export const useAIStore = create<AIStore>()(
  persist(
    (set) => ({
      messages: [],
      isStreaming: false,

      addUserMessage: (content) => {
        const id = uid()
        set((s) => ({
          messages: [
            ...s.messages,
            { id, role: 'user', content, timestamp: new Date().toISOString() },
          ],
        }))
        return id
      },

      startAssistantMessage: () => {
        const id = uid()
        set((s) => ({
          isStreaming: true,
          messages: [
            ...s.messages,
            { id, role: 'assistant', content: '', timestamp: new Date().toISOString() },
          ],
        }))
        return id
      },

      appendToAssistantMessage: (id, delta) =>
        set((s) => ({
          messages: s.messages.map((m) =>
            m.id === id ? { ...m, content: m.content + delta } : m
          ),
        })),

      finaliseAssistantMessage: (_id) => set({ isStreaming: false }),

      clearConversation: () => set({ messages: [], isStreaming: false }),
    }),
    {
      name: 'ai-store',
      // Don't persist streaming state
      partialize: (s) => ({ messages: s.messages }),
    }
  )
)
