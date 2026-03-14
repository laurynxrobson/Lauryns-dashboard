/**
 * server/src/routes/stitch.ts
 *
 * Stitch Open Finance API — South African bank integration
 * Supports: Investec, Discovery Bank, Capitec, FNB, Standard Bank,
 *           Nedbank, Absa, TymeBank, African Bank
 *
 * Endpoints:
 *   GET  /api/stitch/link-url          — return OAuth URL for Stitch Link
 *   POST /api/stitch/callback          — exchange auth code for access token
 *   GET  /api/stitch/connection-status — check if a token is stored
 *   GET  /api/stitch/accounts          — account balances (GraphQL)
 *   GET  /api/stitch/transactions      — transaction history (GraphQL)
 *
 * OAuth flow:
 *   1. Client fetches link-url → redirects user to Stitch Link
 *   2. Stitch redirects to STITCH_REDIRECT_URI with ?code=xxx&state=xxx
 *   3. Client POSTs code to /callback → server exchanges for access_token
 *   4. Subsequent requests use stored access_token
 *
 * Sign up: https://stitch.money/developers
 * Sandbox docs: https://docs.stitch.money
 */

import { Router, type Request, type Response } from 'express'

const router = Router()

// ── Config ────────────────────────────────────────────────────────────────────

const MOCK_MODE = !process.env.STITCH_CLIENT_ID

const STITCH_TOKEN_URL = 'https://secure.stitch.money/connect/token'
const STITCH_AUTH_URL  = 'https://secure.stitch.money/connect/authorize'
const STITCH_API_URL   = 'https://api.stitch.money/graphql'
const REDIRECT_URI     = process.env.STITCH_REDIRECT_URI ?? 'http://localhost:5173/finance'

/** In-memory token store (single user). Use a DB in production. */
let storedToken: { access_token: string; token_type: string; expires_at: number } | null = null

// ── Client credentials token (server-to-server) ───────────────────────────────

async function getClientToken(): Promise<string> {
  const params = new URLSearchParams({
    grant_type:    'client_credentials',
    client_id:     process.env.STITCH_CLIENT_ID!,
    client_secret: process.env.STITCH_CLIENT_SECRET!,
    scope:         'openid accounts transactions',
    audience:      'https://api.stitch.money',
  })
  const res = await fetch(STITCH_TOKEN_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    params,
  })
  if (!res.ok) throw new Error(`Stitch token error ${res.status}: ${await res.text()}`)
  const data = await res.json() as { access_token: string; token_type: string; expires_in: number }
  return data.access_token
}

// ── GraphQL helper ────────────────────────────────────────────────────────────

async function graphql<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const token = storedToken?.access_token
  if (!token) throw new Error('Not authenticated')
  const res = await fetch(STITCH_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  })
  if (!res.ok) throw new Error(`GraphQL error ${res.status}: ${await res.text()}`)
  const json = await res.json() as { data?: T; errors?: unknown[] }
  if (json.errors?.length) throw new Error(JSON.stringify(json.errors))
  return json.data!
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_ACCOUNTS = [
  {
    account_id:    'inv_001',
    name:          'Investec Private Bank Account',
    official_name: 'Investec Pay & Transact',
    bank:          'Investec',
    accountNumber: '10012345678',
    mask:          '5678',
    type:          'bank',
    subtype:       'current',
    balances: { available: 45231.17, current: 45231.17, iso_currency_code: 'ZAR' },
  },
  {
    account_id:    'disc_001',
    name:          'Discovery Bank Gold Account',
    official_name: 'Discovery Bank Gold Cheque',
    bank:          'Discovery Bank',
    accountNumber: '20087654321',
    mask:          '4321',
    type:          'bank',
    subtype:       'cheque',
    balances: { available: 12890.00, current: 12890.00, iso_currency_code: 'ZAR' },
  },
  {
    account_id:    'cap_001',
    name:          'Capitec Global One',
    official_name: 'Capitec Global One',
    bank:          'Capitec',
    accountNumber: '30011223344',
    mask:          '3344',
    type:          'bank',
    subtype:       'savings',
    balances: { available: 8456.33, current: 8456.33, iso_currency_code: 'ZAR' },
  },
]

function isoDate(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString().slice(0, 10)
}

const MOCK_TRANSACTIONS = [
  { transaction_id: 't1',  account_id: 'inv_001', amount: 287.45,  date: isoDate(0),  name: 'Pick n Pay Stores',      merchant_name: 'Pick n Pay',        pending: false, personal_finance_category: { primary: 'FOOD_AND_DRINK', detailed: 'FOOD_AND_DRINK_GROCERY' } },
  { transaction_id: 't2',  account_id: 'inv_001', amount: 75.00,   date: isoDate(0),  name: 'Vida e Caffè',            merchant_name: 'Vida e Caffè',      pending: false, personal_finance_category: { primary: 'FOOD_AND_DRINK', detailed: 'FOOD_AND_DRINK_COFFEE' } },
  { transaction_id: 't3',  account_id: 'inv_001', amount: 219.00,  date: isoDate(1),  name: 'Netflix South Africa',   merchant_name: 'Netflix',           pending: false, personal_finance_category: { primary: 'ENTERTAINMENT', detailed: 'ENTERTAINMENT_STREAMING' } },
  { transaction_id: 't4',  account_id: 'inv_001', amount: 145.00,  date: isoDate(2),  name: 'Uber South Africa',      merchant_name: 'Uber',              pending: false, personal_finance_category: { primary: 'TRANSPORTATION', detailed: 'TRANSPORTATION_TAXIS_AND_RIDE_SHARES' } },
  { transaction_id: 't5',  account_id: 'inv_001', amount: 399.00,  date: isoDate(2),  name: 'Takealot.com',           merchant_name: 'Takealot',          pending: false, personal_finance_category: { primary: 'GENERAL_MERCHANDISE', detailed: 'GENERAL_MERCHANDISE_ONLINE' } },
  { transaction_id: 't6',  account_id: 'inv_001', amount: 89.00,   date: isoDate(3),  name: "Nando's Rosebank",       merchant_name: "Nando's",           pending: false, personal_finance_category: { primary: 'FOOD_AND_DRINK', detailed: 'FOOD_AND_DRINK_RESTAURANTS' } },
  { transaction_id: 't7',  account_id: 'inv_001', amount: 899.00,  date: isoDate(4),  name: 'DStv Premium',           merchant_name: 'DStv',              pending: false, personal_finance_category: { primary: 'ENTERTAINMENT', detailed: 'ENTERTAINMENT_TV' } },
  { transaction_id: 't8',  account_id: 'inv_001', amount: 156.80,  date: isoDate(4),  name: 'Woolworths Food',        merchant_name: 'Woolworths',        pending: false, personal_finance_category: { primary: 'FOOD_AND_DRINK', detailed: 'FOOD_AND_DRINK_GROCERY' } },
  { transaction_id: 't9',  account_id: 'inv_001', amount: 28.50,   date: isoDate(5),  name: 'Gautrain Rapid Rail',    merchant_name: 'Gautrain',          pending: false, personal_finance_category: { primary: 'TRANSPORTATION', detailed: 'TRANSPORTATION_PUBLIC_TRANSIT' } },
  { transaction_id: 't10', account_id: 'inv_001', amount: 195.00,  date: isoDate(6),  name: 'Investec Bank Fees',     merchant_name: 'Investec',          pending: false, personal_finance_category: { primary: 'BANK_FEES', detailed: 'BANK_FEES_SERVICE_CHARGE' } },
  { transaction_id: 't11', account_id: 'cap_001', amount: 445.90,  date: isoDate(7),  name: 'Checkers Hyper',         merchant_name: 'Checkers',          pending: false, personal_finance_category: { primary: 'FOOD_AND_DRINK', detailed: 'FOOD_AND_DRINK_GROCERY' } },
  { transaction_id: 't12', account_id: 'cap_001', amount: 1250.00, date: isoDate(8),  name: 'Planet Fitness SA',      merchant_name: 'Planet Fitness',    pending: false, personal_finance_category: { primary: 'PERSONAL_CARE', detailed: 'PERSONAL_CARE_GYMS_AND_FITNESS' } },
  { transaction_id: 't13', account_id: 'disc_001', amount: 17500.00,date: isoDate(9), name: 'Rent Payment EFT',       merchant_name: null,                pending: false, personal_finance_category: { primary: 'RENT_AND_UTILITIES', detailed: 'RENT_AND_UTILITIES_RENT' } },
  { transaction_id: 't14', account_id: 'inv_001', amount: 320.00,  date: isoDate(10), name: 'Dis-Chem Pharmacy',      merchant_name: 'Dis-Chem',          pending: false, personal_finance_category: { primary: 'PERSONAL_CARE', detailed: 'PERSONAL_CARE_HEALTH' } },
  { transaction_id: 't15', account_id: 'inv_001', amount: -32500.00,date: isoDate(14),'name': 'Salary Credit',        merchant_name: null,                pending: false, personal_finance_category: { primary: 'INCOME', detailed: 'INCOME_WAGES' } },
]

// ── Routes ────────────────────────────────────────────────────────────────────

// GET /api/stitch/link-url
router.get('/link-url', async (_req: Request, res: Response) => {
  if (MOCK_MODE) {
    return res.json({ url: null, mock: true })
  }
  try {
    // Build the Stitch Link authorization URL
    const params = new URLSearchParams({
      response_type: 'code',
      client_id:     process.env.STITCH_CLIENT_ID!,
      redirect_uri:  REDIRECT_URI,
      scope:         'openid offline_access accounts transactions balances',
      audience:      'https://api.stitch.money',
      state:         Math.random().toString(36).slice(2),
      nonce:         Math.random().toString(36).slice(2),
    })
    res.json({ url: `${STITCH_AUTH_URL}?${params}`, mock: false })
  } catch (err: any) {
    console.error('[Stitch] link-url error:', err.message)
    res.status(500).json({ error: 'Failed to generate link URL' })
  }
})

// POST /api/stitch/callback  body: { code }
router.post('/callback', async (req: Request, res: Response) => {
  const { code } = req.body as { code?: string }
  if (!code) return res.status(400).json({ error: 'Missing code' })
  if (MOCK_MODE) {
    storedToken = { access_token: 'mock-access-token', token_type: 'bearer', expires_at: Date.now() + 3_600_000 }
    return res.json({ connected: true })
  }
  try {
    const params = new URLSearchParams({
      grant_type:    'authorization_code',
      client_id:     process.env.STITCH_CLIENT_ID!,
      client_secret: process.env.STITCH_CLIENT_SECRET!,
      code,
      redirect_uri:  REDIRECT_URI,
    })
    const tokenRes = await fetch(STITCH_TOKEN_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    params,
    })
    if (!tokenRes.ok) throw new Error(`${tokenRes.status}: ${await tokenRes.text()}`)
    const data = await tokenRes.json() as { access_token: string; token_type: string; expires_in: number }
    storedToken = {
      access_token: data.access_token,
      token_type:   data.token_type,
      expires_at:   Date.now() + data.expires_in * 1000,
    }
    res.json({ connected: true })
  } catch (err: any) {
    console.error('[Stitch] callback error:', err.message)
    res.status(500).json({ error: 'Failed to exchange code' })
  }
})

// GET /api/stitch/connection-status
router.get('/connection-status', (_req: Request, res: Response) => {
  const connected = MOCK_MODE || (storedToken !== null && storedToken.expires_at > Date.now())
  res.json({ connected, mock: MOCK_MODE })
})

// GET /api/stitch/accounts
router.get('/accounts', async (_req: Request, res: Response) => {
  if (MOCK_MODE) return res.json({ accounts: MOCK_ACCOUNTS })
  if (!storedToken) return res.status(401).json({ error: 'Not connected' })
  try {
    const data = await graphql<{ user: { accounts: unknown[] } }>(`
      query GetAccounts {
        user {
          accounts {
            id
            name
            accountNumber
            bankId
            availableBalance
            currentBalance
            currency
          }
        }
      }
    `)
    // Normalise to our API shape
    const accounts = data.user.accounts.map((a: any) => ({
      account_id:    a.id,
      name:          a.name,
      official_name: a.name,
      bank:          a.bankId,
      accountNumber: a.accountNumber,
      mask:          a.accountNumber?.slice(-4) ?? null,
      type:          'bank',
      subtype:       'current',
      balances: {
        available:         a.availableBalance,
        current:           a.currentBalance,
        iso_currency_code: a.currency ?? 'ZAR',
      },
    }))
    res.json({ accounts })
  } catch (err: any) {
    console.error('[Stitch] accounts error:', err.message)
    res.status(500).json({ error: 'Failed to fetch accounts' })
  }
})

// GET /api/stitch/transactions
router.get('/transactions', async (_req: Request, res: Response) => {
  if (MOCK_MODE) return res.json({ transactions: MOCK_TRANSACTIONS, total_transactions: MOCK_TRANSACTIONS.length })
  if (!storedToken) return res.status(401).json({ error: 'Not connected' })
  try {
    const data = await graphql<{ user: { transactions: { edges: unknown[] } } }>(`
      query GetTransactions {
        user {
          transactions(first: 50) {
            edges {
              node {
                id
                amount
                date
                description
                type
                account { id name }
              }
            }
          }
        }
      }
    `)
    const transactions = data.user.transactions.edges.map((e: any) => {
      const node = e.node
      const isCredit = node.type === 'credit' || node.amount > 0
      return {
        transaction_id:           node.id,
        account_id:               node.account?.id,
        name:                     node.description,
        merchant_name:            node.description,
        amount:                   isCredit ? -Math.abs(node.amount) : Math.abs(node.amount),
        date:                     node.date?.slice(0, 10),
        pending:                  false,
        personal_finance_category: { primary: 'GENERAL_MERCHANDISE', detailed: 'GENERAL_MERCHANDISE_OTHER' },
      }
    })
    res.json({ transactions, total_transactions: transactions.length })
  } catch (err: any) {
    console.error('[Stitch] transactions error:', err.message)
    res.status(500).json({ error: 'Failed to fetch transactions' })
  }
})

export default router
