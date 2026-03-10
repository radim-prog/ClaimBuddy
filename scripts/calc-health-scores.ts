import { readFileSync } from 'fs'

// Load env BEFORE any other imports
const envLocal = readFileSync('.env.local', 'utf-8')
for (const line of envLocal.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/)
  if (match) process.env[match[1].trim()] = match[2].trim()
}

async function main() {
  const { calculateAllHealthScores } = await import('../lib/health-score-engine')
  console.log('Starting health score calculation...')
  const result = await calculateAllHealthScores()
  console.log('Result:', JSON.stringify(result, null, 2))
  process.exit(0)
}

main().catch(e => {
  console.error('Error:', e)
  process.exit(1)
})
