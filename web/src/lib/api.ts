/**
 * api.ts — typed client for the Express backend (localhost:3001)
 *
 * Banking: Stitch Open Finance (stitch.money)
 *   Supports Investec, Discovery Bank, Capitec, FNB, Standard Bank,
 *   Nedbank, Absa, TymeBank — all South African banks
 *
 * AI: Claude Opus 4.6 via @anthropic-ai/sdk streaming SSE
 */

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`)
  return res.json() as Promise<T>
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`)
  return res.json() as Promise<T>
}

// ── Stitch Open Finance ───────────────────────────────────────────────────────

export interface BankAccount {
  account_id: string
  name: string
  official_name: string | null
  bank?: string
  mask: string | null
  type: string
  subtype: string | null
  balances: {
    available: number | null
    current: number | null
    iso_currency_code: string | null
  }
}

export interface BankTransaction {
  transaction_id: string
  account_id: string
  name: string
  merchant_name: string | null
  amount: number
  date: string
  personal_finance_category: {
    primary: string
    detailed: string
  } | null
  pending: boolean
}

export const stitchApi = {
  getLinkUrl: () =>
    get<{ url: string | null; mock: boolean }>('/api/stitch/link-url'),
  exchangeCode: (code: string) =>
    post<{ connected: boolean }>('/api/stitch/callback', { code }),
  getConnectionStatus: () =>
    get<{ connected: boolean; mock: boolean }>('/api/stitch/connection-status'),
  getAccounts: () =>
    get<{ accounts: BankAccount[] }>('/api/stitch/accounts'),
  getTransactions: () =>
    get<{ transactions: BankTransaction[]; total_transactions: number }>('/api/stitch/transactions'),
}

// ── AI Advisor ────────────────────────────────────────────────────────────────

export interface AdvisorContext {
  healthMetrics?: {
    date?: string
    hrv?: number
    sleepHours?: number
    steps?: number
    restingHeartRate?: number
    activeCalories?: number
  }
  readiness?: { score?: number; tier?: string; label?: string }
  recentWorkouts?: Array<{
    name: string
    date: string
    exercises: Array<{ name: string; sets: Array<{ reps: number; weight: number; unit: string }> }>
  }>
  habits?: Array<{ name: string; completedToday: boolean }>
}

/**
 * Stream AI advisor SSE events. Calls onDelta for each text chunk,
 * onDone when complete, onError on failure.
 */
export function streamAiRecommendation(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  context: AdvisorContext,
  callbacks: {
    onDelta: (text: string) => void
    onDone: () => void
    onError: (msg: string) => void
  }
): AbortController {
  const controller = new AbortController()

  fetch(`${BASE}/api/ai/recommend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, context }),
    signal: controller.signal,
  })
    .then(async (res) => {
      if (!res.ok || !res.body) {
        callbacks.onError(`Server error ${res.status}`)
        return
      }
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
            const event = JSON.parse(line.slice(6)) as { type: string; text?: string; message?: string }
            if (event.type === 'delta' && event.text) callbacks.onDelta(event.text)
            else if (event.type === 'done') callbacks.onDone()
            else if (event.type === 'error') callbacks.onError(event.message ?? 'Unknown error')
          } catch {
            // malformed line — skip
          }
        }
      }
    })
    .catch((err) => {
      if ((err as Error).name !== 'AbortError') {
        callbacks.onError('Could not reach server. Is it running on port 3001?')
      }
    })

  return controller
}
