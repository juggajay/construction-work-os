/**
 * Generate TypeScript types from remote Supabase database
 */

const { execSync } = require('child_process')

// Set environment variable
process.env.SUPABASE_ACCESS_TOKEN = 'sbp_d8294d5b91c7bcd7d7229e014ada14ca6779d6d2'

try {
  console.log('📤 Generating TypeScript types from production database...\n')

  const output = execSync('npx supabase gen types typescript --linked --project-id tokjmeqjvexnmtampyjm', {
    encoding: 'utf-8',
    stdio: 'pipe'
  })

  const fs = require('fs')
  const path = require('path')

  const outputPath = path.join(__dirname, '..', 'lib', 'types', 'supabase.ts')
  fs.writeFileSync(outputPath, output, 'utf-8')

  console.log('✅ TypeScript types generated successfully!')
  console.log(`📝 Output: lib/types/supabase.ts`)
  console.log(`\nNew types include:`)
  console.log('  ✓ project_quotes table')
  console.log('  ✓ budget_line_items table')
  console.log('  ✓ budget_with_line_items view')

} catch (error) {
  console.error('❌ Failed to generate types:', error.message)

  if (error.stdout) {
    console.error('\nStdout:', error.stdout.toString())
  }
  if (error.stderr) {
    console.error('\nStderr:', error.stderr.toString())
  }

  process.exit(1)
}
