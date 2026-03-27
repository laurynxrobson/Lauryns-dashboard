/**
 * server/src/routes/plaid.ts
 *
 * Plaid integration endpoints:
 *   GET  /api/plaid/link-token        — create a Plaid Link token
 *   POST /api/plaid/exchange-token    — exchange public_token → access_token
 *   GET  /api/plaid/accounts          — fetch account balances
 *   GET  /api/plaid/transactions      — fetch last 90 days of transactions
 *
 * If PLAID_CLIENT_ID is not set the router returns realistic mock data so
 * the UI stays usable without a Plaid developer account.
 */

import { Router, type Request, type Response } from 'express'
import {
  Configuration,
  PlaidApi,
  PlaidEnvironments,
  Products,
  CountryCode,
  type AccountBase,
  type Transaction,
} from 'plaid'

const router = Router()

// ── Plaid client setup ────────────────────────────────────────────────────────

const MOCK_MODE = !process.env.PLAID_CLIENT_ID

let plaid: PlaidApi | null = null

if (!MOCK_MODE) {
  const envKey = (process.env.PLAID_ENV ?? 'sandbox') as keyof typeof PlaidEnvironments
  const config = new Configuration({
    basePath: PlaidEnvironments[envKey],
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID!,
        'PLAID-SECRET': process.env.PLAID_SECRET!,
      },
    },
  })
  plaid = new PlaidApi(config)
}

// In-memory access-token store (single user — fine for this personal dashboard)
let storedAccessToken: string | null = null

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_ACCOUNTS: AccountBase[] = ([
  {
    account_id: 'mock_checking_1',
    balances: { available: 4823.17, current: 4823.17, iso_currency_code: 'USD', unofficial_currency_code: null, limit: null },
    mask: '0042',
    name: 'Chase Checking',
    official_name: 'Chase Total Checking',
    type: 'depository' as any,
    subtype: 'checking' as any,
    verification_status: null,
    persistent_account_id: null,
  },
  {
    account_id: 'mock_savings_1',
    balances: { available: 12350.00, current: 12350.00, iso_currency_code: 'USD', unofficial_currency_code: null, limit: null },
    mask: '1108',
    name: 'Chase Savings',
    official_name: 'Chase Savings',
    type: 'depository' as any,
    subtype: 'savings' as any,
    verification_status: null,
    persistent_account_id: null,
  },
] as unknown) as AccountBase[]

function isoDate(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString().slice(0, 10)
}

const MOCK_TRANSACTIONS: Transaction[] = ([
  { transaction_id: 't1',  account_id: 'mock_checking_1', amount: 67.42,  date: isoDate(1),  name: 'Whole Foods Market',  merchant_name: 'Whole Foods', category: ['Food and Drink', 'Groceries'], category_id: '19047000', iso_currency_code: 'USD', pending: false, payment_channel: 'in store' as any, personal_finance_category: { primary: 'FOOD_AND_DRINK', detailed: 'FOOD_AND_DRINK_GROCERY', confidence_level: 'HIGH' }, personal_finance_category_icon_url: null, logo_url: null, authorized_date: isoDate(1), authorized_datetime: null, datetime: null, location: null as any, payment_meta: null as any, pending_transaction_id: null, transaction_code: null, transaction_type: 'place' as any, unofficial_currency_code: null, check_number: null, counterparties: [], merchant_entity_id: null, website: null },
  { transaction_id: 't2',  account_id: 'mock_checking_1', amount: 4.50,   date: isoDate(1),  name: 'Starbucks',             merchant_name: 'Starbucks',   category: ['Food and Drink', 'Coffee Shop'], category_id: '13005043', iso_currency_code: 'USD', pending: false, payment_channel: 'in store' as any, personal_finance_category: { primary: 'FOOD_AND_DRINK', detailed: 'FOOD_AND_DRINK_COFFEE', confidence_level: 'HIGH' }, personal_finance_category_icon_url: null, logo_url: null, authorized_date: isoDate(1), authorized_datetime: null, datetime: null, location: null as any, payment_meta: null as any, pending_transaction_id: null, transaction_code: null, transaction_type: 'place' as any, unofficial_currency_code: null, check_number: null, counterparties: [], merchant_entity_id: null, website: null },
  { transaction_id: 't3',  account_id: 'mock_checking_1', amount: 12.99,  date: isoDate(2),  name: 'Netflix',               merchant_name: 'Netflix',     category: ['Recreation', 'Gyms and Fitness Centers'], category_id: '17018000', iso_currency_code: 'USD', pending: false, payment_channel: 'online' as any, personal_finance_category: { primary: 'ENTERTAINMENT', detailed: 'ENTERTAINMENT_STREAMING', confidence_level: 'HIGH' }, personal_finance_category_icon_url: null, logo_url: null, authorized_date: isoDate(2), authorized_datetime: null, datetime: null, location: null as any, payment_meta: null as any, pending_transaction_id: null, transaction_code: null, transaction_type: 'digital' as any, unofficial_currency_code: null, check_number: null, counterparties: [], merchant_entity_id: null, website: null },
  { transaction_id: 't4',  account_id: 'mock_checking_1', amount: 38.00,  date: isoDate(3),  name: 'Uber',                  merchant_name: 'Uber',        category: ['Travel', 'Ride Share'], category_id: '22016000', iso_currency_code: 'USD', pending: false, payment_channel: 'online' as any, personal_finance_category: { primary: 'TRANSPORTATION', detailed: 'TRANSPORTATION_TAXIS_AND_RIDE_SHARES', confidence_level: 'HIGH' }, personal_finance_category_icon_url: null, logo_url: null, authorized_date: isoDate(3), authorized_datetime: null, datetime: null, location: null as any, payment_meta: null as any, pending_transaction_id: null, transaction_code: null, transaction_type: 'special' as any, unofficial_currency_code: null, check_number: null, counterparties: [], merchant_entity_id: null, website: null },
  { transaction_id: 't5',  account_id: 'mock_checking_1', amount: 89.95,  date: isoDate(4),  name: 'Lululemon',             merchant_name: 'Lululemon',   category: ['Shops', 'Clothing and Accessories'], category_id: '19012000', iso_currency_code: 'USD', pending: false, payment_channel: 'in store' as any, personal_finance_category: { primary: 'GENERAL_MERCHANDISE', detailed: 'GENERAL_MERCHANDISE_CLOTHING', confidence_level: 'HIGH' }, personal_finance_category_icon_url: null, logo_url: null, authorized_date: isoDate(4), authorized_datetime: null, datetime: null, location: null as any, payment_meta: null as any, pending_transaction_id: null, transaction_code: null, transaction_type: 'place' as any, unofficial_currency_code: null, check_number: null, counterparties: [], merchant_entity_id: null, website: null },
  { transaction_id: 't6',  account_id: 'mock_checking_1', amount: 54.20,  date: isoDate(5),  name: 'Chipotle',              merchant_name: 'Chipotle',    category: ['Food and Drink', 'Restaurants'], category_id: '13005032', iso_currency_code: 'USD', pending: false, payment_channel: 'in store' as any, personal_finance_category: { primary: 'FOOD_AND_DRINK', detailed: 'FOOD_AND_DRINK_RESTAURANTS', confidence_level: 'HIGH' }, personal_finance_category_icon_url: null, logo_url: null, authorized_date: isoDate(5), authorized_datetime: null, datetime: null, location: null as any, payment_meta: null as any, pending_transaction_id: null, transaction_code: null, transaction_type: 'place' as any, unofficial_currency_code: null, check_number: null, counterparties: [], merchant_entity_id: null, website: null },
  { transaction_id: 't7',  account_id: 'mock_checking_1', amount: 120.00, date: isoDate(6),  name: 'Planet Fitness',        merchant_name: 'Planet Fitness', category: ['Recreation', 'Gyms and Fitness Centers'], category_id: '18029000', iso_currency_code: 'USD', pending: false, payment_channel: 'online' as any, personal_finance_category: { primary: 'PERSONAL_CARE', detailed: 'PERSONAL_CARE_GYMS_AND_FITNESS', confidence_level: 'HIGH' }, personal_finance_category_icon_url: null, logo_url: null, authorized_date: isoDate(6), authorized_datetime: null, datetime: null, location: null as any, payment_meta: null as any, pending_transaction_id: null, transaction_code: null, transaction_type: 'digital' as any, unofficial_currency_code: null, check_number: null, counterparties: [], merchant_entity_id: null, website: null },
  { transaction_id: 't8',  account_id: 'mock_checking_1', amount: 1450.00,date: isoDate(7),  name: 'ACH Rent Payment',       merchant_name: null,          category: ['Payment', 'Rent'], category_id: '16001000', iso_currency_code: 'USD', pending: false, payment_channel: 'online' as any, personal_finance_category: { primary: 'RENT_AND_UTILITIES', detailed: 'RENT_AND_UTILITIES_RENT', confidence_level: 'HIGH' }, personal_finance_category_icon_url: null, logo_url: null, authorized_date: isoDate(7), authorized_datetime: null, datetime: null, location: null as any, payment_meta: null as any, pending_transaction_id: null, transaction_code: null, transaction_type: 'special' as any, unofficial_currency_code: null, check_number: null, counterparties: [], merchant_entity_id: null, website: null },
  { transaction_id: 't9',  account_id: 'mock_checking_1', amount: 23.11,  date: isoDate(8),  name: 'Trader Joe\'s',         merchant_name: 'Trader Joe\'s', category: ['Food and Drink', 'Groceries'], category_id: '19047000', iso_currency_code: 'USD', pending: false, payment_channel: 'in store' as any, personal_finance_category: { primary: 'FOOD_AND_DRINK', detailed: 'FOOD_AND_DRINK_GROCERY', confidence_level: 'HIGH' }, personal_finance_category_icon_url: null, logo_url: null, authorized_date: isoDate(8), authorized_datetime: null, datetime: null, location: null as any, payment_meta: null as any, pending_transaction_id: null, transaction_code: null, transaction_type: 'place' as any, unofficial_currency_code: null, check_number: null, counterparties: [], merchant_entity_id: null, website: null },
  { transaction_id: 't10', account_id: 'mock_checking_1', amount: 15.99,  date: isoDate(9),  name: 'Spotify',               merchant_name: 'Spotify',     category: ['Service', 'Subscription'], category_id: '22015000', iso_currency_code: 'USD', pending: false, payment_channel: 'online' as any, personal_finance_category: { primary: 'ENTERTAINMENT', detailed: 'ENTERTAINMENT_MUSIC', confidence_level: 'HIGH' }, personal_finance_category_icon_url: null, logo_url: null, authorized_date: isoDate(9), authorized_datetime: null, datetime: null, location: null as any, payment_meta: null as any, pending_transaction_id: null, transaction_code: null, transaction_type: 'digital' as any, unofficial_currency_code: null, check_number: null, counterparties: [], merchant_entity_id: null, website: null },
  { transaction_id: 't11', account_id: 'mock_checking_1', amount: 9.99,   date: isoDate(10), name: 'Amazon Prime',           merchant_name: 'Amazon',      category: ['Shops', 'Digital Purchase'], category_id: '19002000', iso_currency_code: 'USD', pending: false, payment_channel: 'online' as any, personal_finance_category: { primary: 'GENERAL_MERCHANDISE', detailed: 'GENERAL_MERCHANDISE_ONLINE', confidence_level: 'HIGH' }, personal_finance_category_icon_url: null, logo_url: null, authorized_date: isoDate(10), authorized_datetime: null, datetime: null, location: null as any, payment_meta: null as any, pending_transaction_id: null, transaction_code: null, transaction_type: 'digital' as any, unofficial_currency_code: null, check_number: null, counterparties: [], merchant_entity_id: null, website: null },
  { transaction_id: 't12', account_id: 'mock_checking_1', amount: 3500.00,date: isoDate(14), name: 'Direct Deposit',          merchant_name: null,          category: ['Transfer', 'Payroll'], category_id: '21012000', iso_currency_code: 'USD', pending: false, payment_channel: 'online' as any, personal_finance_category: { primary: 'INCOME', detailed: 'INCOME_WAGES', confidence_level: 'HIGH' }, personal_finance_category_icon_url: null, logo_url: null, authorized_date: isoDate(14), authorized_datetime: null, datetime: null, location: null as any, payment_meta: null as any, pending_transaction_id: null, transaction_code: null, transaction_type: 'special' as any, unofficial_currency_code: null, check_number: null, counterparties: [], merchant_entity_id: null, website: null },
] as unknown) as Transaction[]

// ── Routes ────────────────────────────────────────────────────────────────────

// GET /api/plaid/link-token
router.get('/link-token', async (_req: Request, res: Response) => {
  if (MOCK_MODE) {
    return res.json({ link_token: 'mock-link-token', expiration: new Date(Date.now() + 3_600_000).toISOString() })
  }
  try {
    const { data } = await plaid!.linkTokenCreate({
      user: { client_user_id: 'lauryn-user' },
      client_name: "Lauryn's Dashboard",
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: 'en',
    })
    res.json({ link_token: data.link_token, expiration: data.expiration })
  } catch (err: any) {
    console.error('[Plaid] link-token error:', err?.response?.data ?? err.message)
    res.status(500).json({ error: 'Failed to create link token' })
  }
})

// POST /api/plaid/exchange-token  body: { public_token }
router.post('/exchange-token', async (req: Request, res: Response) => {
  const { public_token } = req.body as { public_token?: string }
  if (!public_token) return res.status(400).json({ error: 'Missing public_token' })
  if (MOCK_MODE) {
    storedAccessToken = 'mock-access-token'
    return res.json({ connected: true })
  }
  try {
    const { data } = await plaid!.itemPublicTokenExchange({ public_token })
    storedAccessToken = data.access_token
    res.json({ connected: true })
  } catch (err: any) {
    console.error('[Plaid] exchange error:', err?.response?.data ?? err.message)
    res.status(500).json({ error: 'Failed to exchange token' })
  }
})

// GET /api/plaid/connection-status
router.get('/connection-status', (_req: Request, res: Response) => {
  res.json({ connected: MOCK_MODE || storedAccessToken !== null, mock: MOCK_MODE })
})

// GET /api/plaid/accounts
router.get('/accounts', async (_req: Request, res: Response) => {
  if (MOCK_MODE) return res.json({ accounts: MOCK_ACCOUNTS })
  if (!storedAccessToken) return res.status(401).json({ error: 'Not connected' })
  try {
    const { data } = await plaid!.accountsGet({ access_token: storedAccessToken })
    res.json({ accounts: data.accounts })
  } catch (err: any) {
    console.error('[Plaid] accounts error:', err?.response?.data ?? err.message)
    res.status(500).json({ error: 'Failed to fetch accounts' })
  }
})

// GET /api/plaid/transactions
router.get('/transactions', async (_req: Request, res: Response) => {
  if (MOCK_MODE) return res.json({ transactions: MOCK_TRANSACTIONS, total_transactions: MOCK_TRANSACTIONS.length })
  if (!storedAccessToken) return res.status(401).json({ error: 'Not connected' })
  try {
    const end = new Date().toISOString().slice(0, 10)
    const start = new Date(Date.now() - 90 * 24 * 3_600_000).toISOString().slice(0, 10)
    const { data } = await plaid!.transactionsGet({
      access_token: storedAccessToken,
      start_date: start,
      end_date: end,
      options: { count: 100, offset: 0 },
    })
    res.json({ transactions: data.transactions, total_transactions: data.total_transactions })
  } catch (err: any) {
    console.error('[Plaid] transactions error:', err?.response?.data ?? err.message)
    res.status(500).json({ error: 'Failed to fetch transactions' })
  }
})

export default router
