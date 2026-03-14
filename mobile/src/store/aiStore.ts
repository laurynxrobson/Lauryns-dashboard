import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface AIStore {
  messages: ChatMessage[]
  isLoading: boolean

  sendMessage: (
    userText: string,
    context: object,
    onDelta: (id: string, delta: string) => void,
    onDone: (id: string) => void
  ) => void
  clearConversation: () => void
}

function uid() { return Math.random().toString(36).slice(2, 10) }

export const useAIStore = create<AIStore>()(
  persist(
    (set, get) => ({
      messages: [],
      isLoading: false,

      sendMessage: (userText, context, onDelta, onDone) => {
        const userMsg: ChatMessage = {
          id: uid(),
          role: 'user',
          content: userText,
          timestamp: new Date().toISOString(),
        }
        const assistantMsg: ChatMessage = {
          id: uid(),
          role: 'assistant',
          content: '',
          timestamp: new Date().toISOString(),
        }

        set((s) => ({ messages: [...s.messages, userMsg, assistantMsg], isLoading: true }))

        const apiMessages = get()
          .messages.filter((m) => m.id !== assistantMsg.id)
          .slice(-10)
          .map((m) => ({ role: m.role, content: m.content }))

        fetch(`${API_BASE}/api/ai/recommend`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: apiMessages, context }),
        })
          .then(async (res) => {
            if (!res.ok || !res.body) throw new Error(`${res.status}`)
            const reader = res.body.getReader()
            const decoder = new TextDecoder()
            let buf = ''
            while (true) {
              const { done, value } = await reader.read()
              if (done) break
              buf += decoder.decode(value, { stream: true })
              const lines = buf.split('\n')
              buf = lines.pop() ?? ''
              for (const line of lines) {
                if (!line.startsWith('data: ')) continue
                try {
                  const event = JSON.parse(line.slice(6)) as { type: string; text?: string }
                  if (event.type === 'delta' && event.text) {
                    set((s) => ({
                      messages: s.messages.map((m) =>
                        m.id === assistantMsg.id
                          ? { ...m, content: m.content + event.text }
                          : m
                      ),
                    }))
                    onDelta(assistantMsg.id, event.text)
                  } else if (event.type === 'done') {
                    set({ isLoading: false })
                    onDone(assistantMsg.id)
                  }
                } catch { /* skip */ }
              }
            }
          })
          .catch((err) => {
            const errorMsg = err.name === 'AbortError'
              ? ''
              : `\n\n*Could not reach server. Is it running on port 3001?*`
            set((s) => ({
              isLoading: false,
              messages: s.messages.map((m) =>
                m.id === assistantMsg.id
                  ? { ...m, content: (m.content || 'Sorry, something went wrong.') + errorMsg }
                  : m
              ),
            }))
            onDone(assistantMsg.id)
          })
      },

      clearConversation: () => set({ messages: [], isLoading: false }),
    }),
    {
      name: 'mobile-ai-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ messages: s.messages }),
    }
  )
)
