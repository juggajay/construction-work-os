/**
 * Script to apply database migrations to Supabase
 * Run with: npx tsx scripts/apply-migrations.ts
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in environment variables')
  process.exit(1)
}

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function applyMigrations() {
  const migrationsDir = join(process.cwd(), 'supabase', 'migrations')
  const migrationFiles = readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort()

  console.log(`Found ${migrationFiles.length} migration files\n`)

  for (const file of migrationFiles) {
    console.log(`Applying migration: ${file}`)
    const migrationPath = join(migrationsDir, file)
    const sql = readFileSync(migrationPath, 'utf-8')

    try {
      // Execute the migration SQL
      const { error } = await supabase.rpc('exec_sql', { sql_string: sql })

      if (error) {
        // If exec_sql doesn't exist, try direct execution via REST API
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: supabaseServiceKey!,
            Authorization: `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({ query: sql }),
        })

        if (!response.ok) {
          // As a fallback, we'll need to execute via the SQL editor or CLI
          console.error(`  ❌ Error: Cannot execute via RPC. Please apply manually via SQL editor.`)
          console.error(`  Migration file: ${migrationPath}`)
          throw new Error(error.message || 'Failed to execute migration')
        }
      }

      console.log(`  ✅ Applied successfully\n`)
    } catch (err) {
      console.error(`  ❌ Failed to apply migration: ${file}`)
      console.error(`  Error: ${err}`)
      console.error(`\nPlease apply remaining migrations manually via Supabase SQL Editor:`)
      console.error(`https://supabase.com/dashboard/project/${supabaseUrl!.split('.')[0]!.split('//')[1]}/sql/new`)
      process.exit(1)
    }
  }

  console.log('✅ All migrations applied successfully!')
}

applyMigrations().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
