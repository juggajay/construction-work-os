# Security Credentials Update Status

## ✅ Completed

The following files have been updated to use environment variables:

1. **Documentation:**
   - `SUPABASE_MIGRATION_GUIDE.md` - Removed all exposed credentials
   - `CLAUDE.md` - Removed credential references

2. **Main Migration Scripts:**
   - `scripts/apply-migrations-mgmt-api.js` - ✅ Updated
   - `scripts/apply-migrations-api.js` - ✅ Updated
   - `scripts/create-bucket-via-api.js` - ✅ Updated

3. **Environment Templates:**
   - `.env.local.example` - ✅ Added migration variables
   - `.env.production.example` - ✅ Added migration variables with security notes

## ⚠️ Scripts That Still Need Manual Review

The following scripts may contain hardcoded credentials and should be updated manually:

```bash
scripts/apply-budget-quote-migrations.js
scripts/apply-migrations-pg.js
scripts/apply-rfi-migration.js
scripts/check-bucket-schema.js
scripts/check-storage-bucket.js
scripts/check-storage-config.js
scripts/check-upload-policy.js
scripts/create-bucket-rest-api.js
scripts/delete-invoice-bucket.js
scripts/fix-storage-bucket-schema.js
scripts/refresh-cost-summary.js
scripts/restore-storage-rls-policies.js
scripts/run-budget-quote-migration.js
scripts/run-migration-simple.js
scripts/run-quotes-storage-migration.js
scripts/run-quotes-storage-simple.js
scripts/run-storage-migration.js
scripts/update-bucket-via-api.js
scripts/verify-quote-tables.js
scripts/verify-storage-rls-policies.js
```

## 🔄 Update Pattern

For each remaining script, apply this pattern:

```javascript
// OLD (INSECURE):
const accessToken = 'sbp_d8294d5b91c7bcd7d7229e014ada14ca6779d6d2'
const projectRef = 'tokjmeqjvexnmtampyjm'

// NEW (SECURE):
require('dotenv').config({ path: '.env.local' })
const accessToken = process.env.SUPABASE_ACCESS_TOKEN
const projectRef = process.env.SUPABASE_PROJECT_REF

if (!accessToken || !projectRef) {
  console.error('❌ Error: Missing required environment variables')
  console.error('   Please set SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_REF in .env.local')
  process.exit(1)
}
```

## 🚨 CRITICAL NEXT STEPS

1. **Rotate All Credentials Immediately:**
   - Go to Supabase Dashboard → Account → Access Tokens
   - Revoke token: `sbp_d8294d5b91c7bcd7d7229e014ada14ca6779d6d2`
   - Create new access token
   - Go to Supabase Dashboard → Settings → Database
   - Rotate database password

2. **Update .env.local:**
   ```env
   SUPABASE_ACCESS_TOKEN=your-new-token
   SUPABASE_PROJECT_REF=tokjmeqjvexnmtampyjm
   DATABASE_URL=postgresql://postgres.tokjmeqjvexnmtampyjm:[NEW_PASSWORD]@aws-1-us-east-1.pooler.supabase.com:5432/postgres
   ```

3. **Remove Credentials from Git History:**
   ```bash
   # Using BFG Repo-Cleaner (recommended)
   java -jar bfg.jar --replace-text passwords.txt

   # Or using git-filter-branch
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch SUPABASE_MIGRATION_GUIDE.md CLAUDE.md" \
     --prune-empty --tag-name-filter cat -- --all
   ```

4. **Force Push (if necessary):**
   ```bash
   git push origin --force --all
   git push origin --force --tags
   ```

## 📋 Security Checklist

- [x] Update documentation files
- [x] Update main migration scripts
- [x] Update environment variable templates
- [ ] Update remaining utility scripts
- [ ] Rotate all exposed credentials
- [ ] Remove credentials from git history
- [ ] Verify no credentials in committed files
- [ ] Update team documentation
- [ ] Set up credential rotation schedule (90 days)

## 📚 References

- [SUPABASE_MIGRATION_GUIDE.md](./SUPABASE_MIGRATION_GUIDE.md) - Complete setup instructions
- [.env.local.example](./.env.local.example) - Required environment variables
- [.env.production.example](./.env.production.example) - Production configuration
