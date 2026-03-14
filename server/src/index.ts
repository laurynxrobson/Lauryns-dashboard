import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import stitchRouter from './routes/stitch.js'
import aiRouter from './routes/ai.js'

const app = express()
const PORT = parseInt(process.env.PORT ?? '3001', 10)
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173'

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: [CLIENT_ORIGIN, 'http://localhost:5173', 'exp://'],
  credentials: true,
}))
app.use(express.json())

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/stitch', stitchRouter)
app.use('/api/ai', aiRouter)

app.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }))

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  const bankMode = process.env.STITCH_CLIENT_ID ? 'Stitch (live)' : 'Stitch MOCK (demo data)'
  const aiMode   = process.env.ANTHROPIC_API_KEY ? 'Claude claude-opus-4-6' : 'Claude MOCK'
  console.log(`\n🚀  Server running on http://localhost:${PORT}`)
  console.log(`    ${bankMode} | ${aiMode}`)
  console.log(`    CORS: ${CLIENT_ORIGIN}\n`)
})
