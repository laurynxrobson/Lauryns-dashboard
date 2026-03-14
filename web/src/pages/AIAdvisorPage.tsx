import { useEffect, useRef, useState } from 'react'
import { format } from 'date-fns'
import DashboardLayout from '../components/layout/DashboardLayout'
import ChatBubble from '../components/ai/ChatBubble'
import { useAIStore } from '../store/aiStore'
import { useHealthStore } from '../store/healthStore'
import { useWorkoutStore } from '../store/workoutStore'
import { useHabitStore } from '../store/habitStore'
import { calculateReadiness } from '../lib/readinessEngine'
import { streamAiRecommendation, type AdvisorContext } from '../lib/api'

const SUGGESTED_PROMPTS = [
  'Plan my training week based on my current readiness',
  'Analyse my recovery and suggest tonight\'s sleep target',
  'What should I eat today to maximise my performance?',
  'Review my recent workouts and suggest progressions',
  'How can I improve my HRV over the next 30 days?',
]

export default function AIAdvisorPage() {
  const { messages, isStreaming, addUserMessage, startAssistantMessage, appendToAssistantMessage, finaliseAssistantMessage, clearConversation } =
    useAIStore()
  const todayMetrics = useHealthStore((s) => s.getTodayMetrics())
  const { workouts } = useWorkoutStore()
  const { habits } = useHabitStore()
  const readiness = calculateReadiness(todayMetrics ?? {})

  const [input, setInput] = useState('')
  const abortRef = useRef<AbortController | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function buildContext(): AdvisorContext {
    const today = format(new Date(), 'yyyy-MM-dd')
    return {
      healthMetrics: todayMetrics
        ? {
            date: todayMetrics.date,
            hrv: todayMetrics.hrv,
            sleepHours: todayMetrics.sleepHours,
            steps: todayMetrics.steps,
            restingHeartRate: todayMetrics.restingHeartRate,
            activeCalories: todayMetrics.activeCalories,
          }
        : undefined,
      readiness: { score: readiness.score, tier: readiness.tier, label: readiness.label },
      recentWorkouts: workouts.slice(0, 5).map((w) => ({
        name: w.name,
        date: w.date,
        exercises: w.exercises.map((e) => ({
          name: e.name,
          sets: e.sets,
        })),
      })),
      habits: habits.map((h) => ({
        name: h.name,
        completedToday: !!h.completions[today],
      })),
    }
  }

  async function sendMessage(text: string) {
    if (!text.trim() || isStreaming) return
    setInput('')

    const userText = text.trim()
    addUserMessage(userText)

    // Build API messages array from conversation history (last 10 turns)
    const apiMessages = messages
      .slice(-10)
      .concat([{ id: '', role: 'user', content: userText, timestamp: new Date().toISOString() }])
      .map((m) => ({ role: m.role, content: m.content }))

    const assistantId = startAssistantMessage()

    abortRef.current = streamAiRecommendation(apiMessages, buildContext(), {
      onDelta: (delta) => appendToAssistantMessage(assistantId, delta),
      onDone: () => finaliseAssistantMessage(assistantId),
      onError: (msg) => {
        appendToAssistantMessage(assistantId, `\n\n*Error: ${msg}*`)
        finaliseAssistantMessage(assistantId)
      },
    })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  function handleAbort() {
    abortRef.current?.abort()
    finaliseAssistantMessage('')
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col h-screen">
        {/* Header */}
        <div className="px-6 py-5 border-b border-border bg-surface flex items-center justify-between flex-shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-400 to-blue-500" />
              <h1 className="text-base font-semibold text-text-primary">AI Advisor</h1>
              <span className="text-xs text-text-secondary bg-muted border border-border rounded px-1.5 py-0.5">
                claude-opus-4-6
              </span>
            </div>
            <p className="text-xs text-text-secondary">
              Personalised coaching based on your live health data · Readiness{' '}
              <span className="font-medium" style={{ color: readiness.color }}>
                {readiness.score}
              </span>
            </p>
          </div>
          {messages.length > 0 && (
            <button
              onClick={clearConversation}
              className="text-xs text-text-secondary hover:text-text-primary px-2 py-1 rounded hover:bg-muted transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {messages.length === 0 ? (
            <div className="max-w-lg mx-auto">
              {/* Welcome */}
              <div className="text-center mb-8">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white text-xl font-bold mx-auto mb-3">
                  AI
                </div>
                <h2 className="text-lg font-semibold text-text-primary mb-1">
                  Hey Lauryn 👋
                </h2>
                <p className="text-sm text-text-secondary">
                  I have your health data loaded. Ask me anything about training, recovery, or wellness.
                </p>
              </div>

              {/* Readiness snapshot */}
              <div
                className="rounded-xl p-4 mb-6 border"
                style={{ borderColor: readiness.color + '40', backgroundColor: readiness.color + '0C' }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: readiness.color }}>
                      Today's Readiness · {readiness.label}
                    </p>
                    <p className="text-3xl font-bold mt-1 text-text-primary">{readiness.score}<span className="text-sm font-normal text-text-secondary">/100</span></p>
                  </div>
                  {todayMetrics ? (
                    <div className="text-right text-xs text-text-secondary space-y-0.5">
                      <div>HRV {todayMetrics.hrv ?? '—'} ms</div>
                      <div>Sleep {todayMetrics.sleepHours ?? '—'} hrs</div>
                      <div>Steps {todayMetrics.steps?.toLocaleString() ?? '—'}</div>
                    </div>
                  ) : (
                    <p className="text-xs text-text-secondary">Log metrics on the Health page</p>
                  )}
                </div>
              </div>

              {/* Suggested prompts */}
              <p className="text-xs text-text-secondary uppercase tracking-wide mb-3">Suggested questions</p>
              <div className="space-y-2">
                {SUGGESTED_PROMPTS.map((p) => (
                  <button
                    key={p}
                    onClick={() => sendMessage(p)}
                    className="w-full text-left text-sm text-text-primary bg-card border border-border rounded-xl px-4 py-3 hover:border-gray-300 hover:bg-muted transition-colors"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto">
              {messages.map((m, i) => (
                <ChatBubble
                  key={m.id}
                  message={m}
                  isStreaming={isStreaming && i === messages.length - 1 && m.role === 'assistant'}
                />
              ))}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="flex-shrink-0 border-t border-border bg-surface px-6 py-4">
          <div className="max-w-2xl mx-auto flex gap-3 items-end">
            <textarea
              ref={textareaRef}
              rows={1}
              className="flex-1 border border-border rounded-xl px-4 py-3 text-sm text-text-primary resize-none focus:outline-none focus:border-gray-400 bg-surface leading-relaxed"
              placeholder="Ask about training, recovery, nutrition…"
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                // auto-resize
                e.target.style.height = 'auto'
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
              }}
              onKeyDown={handleKeyDown}
              disabled={isStreaming}
            />
            {isStreaming ? (
              <button
                onClick={handleAbort}
                className="w-10 h-10 rounded-xl bg-red-100 text-red-500 hover:bg-red-200 transition-colors flex items-center justify-center flex-shrink-0"
              >
                ■
              </button>
            ) : (
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim()}
                className="w-10 h-10 rounded-xl bg-text-primary text-white hover:opacity-90 disabled:opacity-30 transition-opacity flex items-center justify-center flex-shrink-0"
              >
                ↑
              </button>
            )}
          </div>
          <p className="text-center text-xs text-text-secondary mt-2">
            AI responses use real health data from your dashboard · Powered by Claude Opus 4.6
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
}
