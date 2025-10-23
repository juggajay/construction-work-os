import pkg from 'pg'
const { Client } = pkg
import * as dotenv from 'dotenv'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { readFileSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env.local') })

const DATABASE_URL = process.env.DATABASE_URL!

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found')
  process.exit(1)
}

async function runMigration() {
  const client = new Client({ connectionString: DATABASE_URL })

  try {
    console.log('🔌 Connecting to database...')
    await client.connect()
    console.log('✅ Connected!\n')

    // Read migration file
    const migrationPath = join(__dirname, '../supabase/migrations/20250123000000_auto_create_profile.sql')
    const sql = readFileSync(migrationPath, 'utf-8')

    console.log('📄 Executing migration...\n')

    // Execute the migration
    await client.query(sql)

    console.log('✅ Migration executed successfully!\n')

    // Verify
    console.log('🔍 Verifying...')

    const result = await client.query(`
      SELECT COUNT(*) as count
      FROM auth.users u
      LEFT JOIN public.profiles p ON u.id = p.id
      WHERE p.id IS NULL
    `)

    console.log(`Users without profiles: ${result.rows[0].count}`)

    if (result.rows[0].count === '0') {
      console.log('✅ All users have profiles!')
    }

  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await client.end()
  }
}

runMigration()
