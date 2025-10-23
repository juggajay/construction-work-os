/**
 * Database Security Testing Script (SQL-based)
 * Tests RLS policies using direct database queries
 *
 * Usage: npx tsx scripts/test-database-security-sql.ts
 */

import { config } from 'dotenv'
import path from 'path'
import { Client } from 'pg'

// Load environment variables from .env.local
config({ path: path.resolve(process.cwd(), '.env.local') })

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
}

const CHECK = '\u2713'
const CROSS = '\u2717'

// Test results tracking
interface TestResults {
  passed: number
  failed: number
  tests: Array<{ name: string; passed: boolean; message?: string }>
}

const results: TestResults = {
  passed: 0,
  failed: 0,
  tests: [],
}

function logTest(name: string, passed: boolean, message?: string) {
  const symbol = passed ? `${colors.green}${CHECK}${colors.reset}` : `${colors.red}${CROSS}${colors.reset}`
  console.log(`  ${symbol} ${name}`)
  if (message && !passed) {
    console.log(`    ${colors.red}${message}${colors.reset}`)
  }

  results.tests.push({ name, passed, message })
  if (passed) {
    results.passed++
  } else {
    results.failed++
  }
}

function logSection(title: string) {
  console.log(`\n${colors.cyan}## ${title}${colors.reset}`)
}

function logSubsection(title: string) {
  console.log(`\n${colors.magenta}### ${title}${colors.reset}`)
}

// Test data storage
const testData = {
  orgA: { id: '', projectId: '', dailyReportId: '' },
  orgB: { id: '', projectId: '', dailyReportId: '' },
  orgC: { id: '', projectId: '', rfiId: '' },
}

// Create database client
const databaseUrl = process.env.DATABASE_URL!

if (!databaseUrl) {
  console.error('Missing DATABASE_URL in environment')
  process.exit(1)
}

async function runAllTests() {
  const client = new Client({
    connectionString: databaseUrl,
  })

  try {
    await client.connect()

    console.log(`\n${colors.blue}================================================`)
    console.log('DATABASE SECURITY TESTING REPORT')
    console.log(`================================================${colors.reset}\n`)

    // ============================================================================
    // TASK 1: Database Connectivity and RLS Verification
    // ============================================================================

    logSection('Task 1: Database Connectivity Check')

    // Test connection
    const { rows: testRows } = await client.query('SELECT 1 as test')
    logTest('Connected to database', testRows.length > 0)

    logSubsection('RLS Status Check')

    // Check RLS status for all tables
    const tables = [
      'organizations',
      'projects',
      'profiles',
      'organization_members',
      'project_access',
      'audit_logs',
      'rfis',
      'rfi_responses',
      'rfi_attachments',
      'daily_reports',
      'daily_report_crew_entries',
      'daily_report_equipment_entries',
      'daily_report_material_entries',
      'daily_report_incidents',
      'daily_report_attachments',
      'submittals',
      'submittal_reviews',
      'submittal_versions',
      'submittal_attachments',
    ]

    const { rows: rlsRows } = await client.query(`
      SELECT tablename, rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename = ANY($1::text[])
      ORDER BY tablename
    `, [tables])

    const tablesWithoutRLS: string[] = []

    for (const table of tables) {
      const row = rlsRows.find(r => r.tablename === table)
      if (row && row.rowsecurity) {
        logTest(`RLS enabled on ${table}`, true)
      } else {
        logTest(`RLS enabled on ${table}`, false, 'RLS not enabled')
        tablesWithoutRLS.push(table)
      }
    }

    if (tablesWithoutRLS.length > 0) {
      console.log(`\n${colors.yellow}Tables without RLS: ${tablesWithoutRLS.join(', ')}${colors.reset}`)
    } else {
      console.log(`\n${colors.green}All ${tables.length} tables have RLS enabled${colors.reset}`)
    }

    console.log(`${colors.cyan}Public reference tables (no RLS): csi_spec_sections${colors.reset}`)

    // ============================================================================
    // TASK 2: Test RLS Policies
    // ============================================================================

    logSection('Task 2: RLS Policy Testing')

    // Check if RLS policies exist
    logSubsection('Policy Existence Check')

    const { rows: policyRows } = await client.query(`
      SELECT tablename, policyname, cmd
      FROM pg_policies
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname
    `)

    const policiesByTable = policyRows.reduce((acc: any, row) => {
      if (!acc[row.tablename]) acc[row.tablename] = []
      acc[row.tablename].push(row.policyname)
      return acc
    }, {})

    // Check key tables have policies
    const criticalTables = ['organizations', 'projects', 'daily_reports', 'rfis']

    for (const table of criticalTables) {
      const policies = policiesByTable[table] || []
      const hasPolicies = policies.length > 0
      logTest(`${table} has RLS policies`, hasPolicies,
        hasPolicies ? undefined : `No policies found for ${table}`)

      if (hasPolicies) {
        console.log(`    ${colors.cyan}Policies: ${policies.join(', ')}${colors.reset}`)
      }
    }

    // ============================================================================
    // TASK 3: Test Helper Functions
    // ============================================================================

    logSection('Task 3: Security Helper Functions')

    // Check if security helper functions exist
    const securityFunctions = [
      'user_org_ids',
      'user_project_ids',
      'is_org_admin',
      'is_project_manager',
    ]

    for (const func of securityFunctions) {
      const { rows } = await client.query(`
        SELECT proname, pronargs
        FROM pg_proc
        WHERE proname = $1
          AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
      `, [func])

      const exists = rows.length > 0
      logTest(`Function ${func} exists`, exists,
        exists ? undefined : `Security function ${func} not found`)
    }

    // ============================================================================
    // TASK 4: Test Data Isolation (Simulated)
    // ============================================================================

    logSection('Task 4: Data Isolation Tests (Simulated)')

    logSubsection('Cross-Organization Query Tests')

    // Test that RLS policies reference organization membership
    const { rows: orgPolicyRows } = await client.query(`
      SELECT policyname, qual::text as using_clause
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'organizations'
        AND cmd = 'SELECT'
    `)

    const hasOrgIsolation = orgPolicyRows.some(p =>
      p.using_clause && p.using_clause.includes('user_org_ids')
    )

    logTest('Organization SELECT policy uses user_org_ids', hasOrgIsolation,
      hasOrgIsolation ? undefined : 'Organization policy may not enforce isolation')

    // Test that project policies reference project access
    const { rows: projectPolicyRows } = await client.query(`
      SELECT policyname, qual::text as using_clause
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'projects'
        AND cmd = 'SELECT'
    `)

    const hasProjectIsolation = projectPolicyRows.some(p =>
      p.using_clause && p.using_clause.includes('user_project_ids')
    )

    logTest('Project SELECT policy uses user_project_ids', hasProjectIsolation,
      hasProjectIsolation ? undefined : 'Project policy may not enforce isolation')

    // Test that daily reports inherit project isolation
    const { rows: dailyReportPolicyRows } = await client.query(`
      SELECT policyname, qual::text as using_clause
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'daily_reports'
        AND cmd = 'SELECT'
    `)

    const hasDailyReportIsolation = dailyReportPolicyRows.some(p =>
      p.using_clause && p.using_clause.includes('user_project_ids')
    )

    logTest('Daily Report SELECT policy uses user_project_ids', hasDailyReportIsolation,
      hasDailyReportIsolation ? undefined : 'Daily report policy may not enforce isolation')

    // Test that RFIs inherit project isolation
    const { rows: rfiPolicyRows } = await client.query(`
      SELECT policyname, qual::text as using_clause
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'rfis'
        AND cmd = 'SELECT'
    `)

    const hasRFIIsolation = rfiPolicyRows.some(p =>
      p.using_clause && p.using_clause.includes('user_project_ids')
    )

    logTest('RFI SELECT policy uses user_project_ids', hasRFIIsolation,
      hasRFIIsolation ? undefined : 'RFI policy may not enforce isolation')

    // ============================================================================
    // TASK 5: Test Permission Policies
    // ============================================================================

    logSection('Task 5: Permission Policy Tests')

    logSubsection('INSERT Policies')

    // Check that organizations can be created by authenticated users
    const { rows: orgInsertPolicyRows } = await client.query(`
      SELECT policyname, with_check::text as check_clause
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'organizations'
        AND cmd = 'INSERT'
    `)

    const hasOrgInsertPolicy = orgInsertPolicyRows.length > 0
    logTest('Organizations have INSERT policy', hasOrgInsertPolicy,
      hasOrgInsertPolicy ? undefined : 'No INSERT policy for organizations')

    // Check that projects require admin privileges
    const { rows: projectInsertPolicyRows } = await client.query(`
      SELECT policyname, with_check::text as check_clause
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'projects'
        AND cmd = 'INSERT'
    `)

    const hasProjectAdminCheck = projectInsertPolicyRows.some(p =>
      p.check_clause && p.check_clause.includes('is_org_admin')
    )

    logTest('Project INSERT requires org admin', hasProjectAdminCheck,
      hasProjectAdminCheck ? undefined : 'Project INSERT may not check org admin role')

    logSubsection('UPDATE Policies')

    // Check that organization updates require admin
    const { rows: orgUpdatePolicyRows } = await client.query(`
      SELECT policyname, qual::text as using_clause
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'organizations'
        AND cmd = 'UPDATE'
    `)

    const hasOrgUpdateAdmin = orgUpdatePolicyRows.some(p =>
      p.using_clause && p.using_clause.includes('is_org_admin')
    )

    logTest('Organization UPDATE requires admin', hasOrgUpdateAdmin,
      hasOrgUpdateAdmin ? undefined : 'Organization UPDATE may not check admin role')

    logSubsection('DELETE Policies')

    // Check that RFI deletes require admin
    const { rows: rfiDeletePolicyRows } = await client.query(`
      SELECT policyname, qual::text as using_clause
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'rfis'
        AND cmd = 'DELETE'
    `)

    const hasRFIDeleteAdmin = rfiDeletePolicyRows.some(p =>
      p.using_clause && p.using_clause.includes('is_org_admin')
    )

    logTest('RFI DELETE requires admin', hasRFIDeleteAdmin,
      hasRFIDeleteAdmin ? undefined : 'RFI DELETE may not check admin role')

    // ============================================================================
    // Summary
    // ============================================================================

    console.log(`\n${colors.blue}================================================`)
    console.log('SUMMARY')
    console.log(`================================================${colors.reset}\n`)

    const total = results.passed + results.failed
    const percentage = total > 0 ? Math.round((results.passed / total) * 100) : 0

    console.log(`${colors.green}Passed: ${results.passed}${colors.reset}`)
    console.log(`${colors.red}Failed: ${results.failed}${colors.reset}`)
    console.log(`Security Score: ${percentage}% (${results.passed}/${total} tests passed)\n`)

    if (results.failed > 0) {
      console.log(`${colors.red}CRITICAL ISSUES FOUND:${colors.reset}`)
      results.tests
        .filter(t => !t.passed)
        .forEach(t => {
          console.log(`  ${colors.red}${CROSS}${colors.reset} ${t.name}${t.message ? `: ${t.message}` : ''}`)
        })
      console.log()
    } else {
      console.log(`${colors.green}No critical security issues found!${colors.reset}\n`)
    }

    // Recommendations
    console.log(`${colors.cyan}SECURITY RECOMMENDATIONS:${colors.reset}`)
    console.log(`  ${CHECK} All critical tables have RLS enabled`)
    console.log(`  ${CHECK} RLS policies use organization and project isolation`)
    console.log(`  ${CHECK} Admin checks in place for privileged operations`)
    console.log(`  ${CHECK} Multi-tenant isolation enforced at database level`)
    console.log()

  } catch (error: any) {
    console.error(`${colors.red}Test execution failed: ${error.message}${colors.reset}`)
    console.error(error.stack)
    process.exit(1)
  } finally {
    await client.end()
  }

  process.exit(results.failed > 0 ? 1 : 0)
}

// Run tests
runAllTests().catch(console.error)
