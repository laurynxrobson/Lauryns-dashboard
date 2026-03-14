/**
 * server/src/routes/ai.ts
 *
 * AI Advisor endpoints:
 *   POST /api/ai/recommend   — stream a personalized workout/wellness recommendation
 *                              using Claude Opus 4.6 with adaptive thinking
 *
 * Request body:
 *   {
 *     messages: [{ role: "user"|"assistant", content: string }],
 *     context: {
 *       healthMetrics?: { date, hrv, sleepHours, steps, restingHeartRate, activeCalories },
 *       readiness?: { score, tier, label },
 *       recentWorkouts?: [{ name, date, exercises: [{ name, sets }] }],
 *       habits?: [{ name, completedToday }],
 *     }
 *   }
 *
 * Response: text/event-stream (SSE)
 *   data: { type: "delta", text: "..." }
 *   data: { type: "done" }
 *   data: { type: "error", message: "..." }
 */

import { Router, type Request, type Response } from 'express'
import Anthropic from '@anthropic-ai/sdk'

const router = Router()

const MOCK_MODE = !process.env.ANTHROPIC_API_KEY

const client = MOCK_MODE ? null : new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ── System prompt builder ──────────────────────────────────────────────────────

interface HealthMetrics {
  date?: string
  hrv?: number
  sleepHours?: number
  steps?: number
  restingHeartRate?: number
  activeCalories?: number
}

interface ReadinessInfo {
  score?: number
  tier?: string
  label?: string
}

interface WorkoutSet {
  reps: number
  weight: number
  unit: string
}

interface WorkoutExercise {
  name: string
  sets: WorkoutSet[]
}

interface RecentWorkout {
  name: string
  date: string
  exercises: WorkoutExercise[]
}

interface HabitInfo {
  name: string
  completedToday: boolean
}

interface AdvisorContext {
  healthMetrics?: HealthMetrics
  readiness?: ReadinessInfo
  recentWorkouts?: RecentWorkout[]
  habits?: HabitInfo[]
}

function buildSystemPrompt(context: AdvisorContext): string {
  const m = context.healthMetrics
  const r = context.readiness
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  const metricsSection = m
    ? `## Today's Health Data (${m.date ?? today})
- HRV: ${m.hrv ? `${m.hrv} ms` : 'no data'}
- Sleep: ${m.sleepHours ? `${m.sleepHours} hrs` : 'no data'}
- Steps: ${m.steps ? m.steps.toLocaleString() : 'no data'}
- Resting Heart Rate: ${m.restingHeartRate ? `${m.restingHeartRate} bpm` : 'no data'}
- Active Calories: ${m.activeCalories ? `${m.activeCalories} kcal` : 'no data'}`
    : "## Today's Health Data\nNo data synced yet."

  const readinessSection = r
    ? `## Readiness Score
- Score: ${r.score}/100 (${r.label ?? r.tier})`
    : ''

  const workoutsSection =
    context.recentWorkouts?.length
      ? `## Recent Workouts (last 7 days)\n` +
        context.recentWorkouts
          .map((w) => {
            const setsSummary = w.exercises
              .map((e) => `  • ${e.name}: ${e.sets.length} sets`)
              .join('\n')
            return `**${w.name}** (${w.date})\n${setsSummary || '  • No exercises logged'}`
          })
          .join('\n\n')
      : '## Recent Workouts\nNo workouts logged yet.'

  const habitsSection =
    context.habits?.length
      ? `## Today's Habits\n` +
        context.habits
          .map((h) => `- ${h.completedToday ? '✅' : '⬜'} ${h.name}`)
          .join('\n')
      : ''

  return `You are Lauryn's personal AI fitness and wellness coach. You have access to her real-time health and activity data. Use this data to provide specific, personalised, and actionable advice.

${metricsSection}

${readinessSection}

${workoutsSection}

${habitsSection}

## Instructions
- Be encouraging, concise, and data-driven — always reference the actual numbers
- When recommending workouts, suggest specific exercises, sets, reps, and rest periods that match today's readiness level
- If readiness is low, prioritise recovery over intensity
- Keep responses focused and practical — aim for 150–300 words unless a detailed plan is requested
- Today is ${today}`
}

// ── Streaming mock ─────────────────────────────────────────────────────────────

const MOCK_RESPONSES = [
  "Based on your readiness score today, you're in a solid position for moderate training. Your HRV of 52ms and 7.2hrs of sleep suggest your nervous system has recovered well overnight. \n\nI'd recommend a **full-body circuit** today:\n\n**Warm-up (5 min):**\n- Dynamic stretching, arm circles, leg swings\n\n**Main circuit (3 rounds):**\n- Squat × 12 reps @ 60% 1RM\n- Push-up × 15 reps\n- Romanian Deadlift × 10 reps @ 65% 1RM\n- Plank hold × 45 seconds\n- Rest 60–90 seconds between rounds\n\n**Cool-down:** 5 minutes of light stretching focusing on hamstrings and hip flexors.\n\nYour steps are looking good at 8,200 — you're already hitting a solid baseline. Keep hydrating and aim for 7.5–8hrs tonight to push that readiness score up tomorrow. 💪",
]

// ── Route ─────────────────────────────────────────────────────────────────────

router.post('/recommend', async (req: Request, res: Response) => {
  const { messages = [], context = {} } = req.body as {
    messages: Anthropic.MessageParam[]
    context: AdvisorContext
  }

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('Access-Control-Allow-Origin', process.env.CLIENT_ORIGIN ?? '*')

  function sendEvent(data: object) {
    res.write(`data: ${JSON.stringify(data)}\n\n`)
  }

  // ── Mock mode ──────────────────────────────────────────────────────────────
  if (MOCK_MODE) {
    const mockText = MOCK_RESPONSES[0]
    // Simulate streaming by sending chunks
    const words = mockText.split(' ')
    for (let i = 0; i < words.length; i++) {
      sendEvent({ type: 'delta', text: (i === 0 ? '' : ' ') + words[i] })
      await new Promise((r) => setTimeout(r, 25))
    }
    sendEvent({ type: 'done' })
    return res.end()
  }

  // ── Real Claude API ────────────────────────────────────────────────────────
  const systemPrompt = buildSystemPrompt(context)

  // Ensure messages alternates correctly (first must be user)
  const apiMessages: Anthropic.MessageParam[] =
    messages.length > 0
      ? messages
      : [{ role: 'user', content: 'Give me personalised advice for today based on my health data.' }]

  try {
    const stream = client!.messages.stream({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      thinking: { type: 'adaptive' },
      system: systemPrompt,
      messages: apiMessages,
    })

    stream.on('text', (delta) => {
      sendEvent({ type: 'delta', text: delta })
    })

    await stream.finalMessage()
    sendEvent({ type: 'done' })
    res.end()
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) {
      sendEvent({ type: 'error', message: 'Rate limit reached — please try again in a moment.' })
    } else if (err instanceof Anthropic.AuthenticationError) {
      sendEvent({ type: 'error', message: 'Invalid API key. Check ANTHROPIC_API_KEY in server/.env' })
    } else {
      sendEvent({ type: 'error', message: 'AI service unavailable. Please try again.' })
    }
    res.end()
  }
})

export default router
