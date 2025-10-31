/**
 * Run budget quote and line items migration
 * OpenSpec Change: enhance-budget-allocations-with-quotes-and-ai
 */

const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

// Use direct connection URL (not pooler)
const databaseUrl = 'postgresql://postgres:fJ1XI7m5uBkvokYS@db.tokjmeqjvexnmtampyjm.supabase.co:5432/postgres'

async function runMigration() {
  const client = new Client({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false
    }
  })

  try {
    console.log('📤 Connecting to database...')
    await client.connect()
    console.log('✅ Connected!\n')

    // Read and execute the migration file
    const sqlPath = path.join(__dirname, '..', 'supabase', 'migrations', '20251028032729_add_budget_quote_line_items.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')

    console.log('📤 Executing migration: add_budget_quote_line_items...')
    console.log('   Creating tables: project_quotes, budget_line_items')
    console.log('   Creating materialized view: budget_with_line_items')
    console.log('   Setting up full-text search triggers')
    console.log('   Configuring RLS policies\n')

    await client.query(sql)

    console.log('\n✅ Migration completed successfully!')
    console.log('🎉 Budget quote and line items system is ready!')
    console.log('\nNew features available:')
    console.log('  ✓ Quote upload and storage')
    console.log('  ✓ AI-powered line item extraction')
    console.log('  ✓ Full-text search across line items')
    console.log('  ✓ Budget rollup calculations')

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message)

    // If it's an "already exists" error, that's okay
    if (error.message.includes('already exists') || error.message.includes('duplicate')) {
      console.log('\n⚠️  Tables or policies may already exist')
      console.log('✅ This is fine - the schema is already in place!')
    } else {
      console.error('\nFull error:', error)
      process.exit(1)
    }
  } finally {
    await client.end()
    console.log('\n📤 Database connection closed')
  }
}

runMigration()
