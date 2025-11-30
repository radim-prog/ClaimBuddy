#!/usr/bin/env node
/**
 * Supabase Migration Script
 * Nahraje schema.sql do Supabase databáze
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load env
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Chybí Supabase credentials v .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function runSQL(filePath) {
  const sql = fs.readFileSync(filePath, 'utf-8')

  console.log(`📄 Spouštím: ${path.basename(filePath)}`)

  // Supabase JS client nemá přímý SQL execution
  // Potřebujeme použít REST API
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    },
    body: JSON.stringify({ query: sql })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`SQL execution failed: ${error}`)
  }

  console.log(`✅ ${path.basename(filePath)} hotovo`)
}

async function main() {
  console.log('🚀 Supabase Migration')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  try {
    // Test connection
    const { data, error } = await supabase.from('users').select('count').limit(1)

    if (error && error.code === '42P01') {
      // Table doesn't exist - good, we'll create it
      console.log('📦 Databáze je prázdná, vytváříme schema...')
    } else if (error) {
      console.error('❌ Chyba připojení:', error.message)
      console.log('\n💡 ALTERNATIVA: Ruční nahrání')
      console.log('1. Otevři: https://supabase.com/dashboard/project/ybcubkuskirbspyoxpak/sql/new')
      console.log('2. Zkopíruj obsah: supabase/schema.sql')
      console.log('3. Klikni RUN')
      console.log('4. Opakuj pro: supabase/seed.sql')
      process.exit(1)
    }

    console.log('\n⚠️  UPOZORNĚNÍ:')
    console.log('Supabase JS client neumožňuje přímé spuštění SQL.')
    console.log('Schema musíš nahrát RUČNĚ přes SQL Editor.')
    console.log('\n📋 NÁVOD:')
    console.log('1. Otevři: https://supabase.com/dashboard/project/ybcubkuskirbspyoxpak/sql/new')
    console.log('2. Zkopíruj CELÝ obsah souboru: supabase/schema.sql')
    console.log('3. Vlož do SQL Editoru a klikni "RUN"')
    console.log('4. Počkej 5-10 sekund')
    console.log('5. Opakuj pro: supabase/seed.sql (s UUID úpravou)')

  } catch (err) {
    console.error('❌ Chyba:', err.message)
    process.exit(1)
  }
}

main()
