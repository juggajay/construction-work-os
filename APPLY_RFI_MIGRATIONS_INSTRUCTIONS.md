# 🗄️ APPLY RFI MIGRATIONS TO PRODUCTION

## ⚠️ IMPORTANT: Run This Once Only

Your RFI module code is deployed to Vercel, but the database tables don't exist yet.
You need to run these migrations in your production Supabase database.

## 📋 Step-by-Step Instructions

### 1. Open Supabase SQL Editor

Go to: https://supabase.com/dashboard/project/tokjmeqjvexnmtampyjm/sql/new

### 2. Copy the Migration File

Open the file: `APPLY_RFI_MIGRATIONS.sql`

Copy the ENTIRE contents (498 lines)

### 3. Paste into SQL Editor

Paste into the Supabase SQL Editor

### 4. Run the Migrations

Click the **"Run"** button (or press Ctrl+Enter)

### 5. Verify Success

You should see: **"Success. No rows returned"**

If you see any errors, send them to me and I'll help fix them.

## ✅ What This Creates

- **Enums**: `rfi_status`, `rfi_priority`
- **Tables**: `rfis`, `rfi_responses`, `rfi_attachments`
- **Function**: `next_rfi_number()` (sequential numbering)
- **RLS Policies**: Security policies for all tables
- **Audit Triggers**: Change tracking for compliance
- **Indexes**: Performance optimization

## 🔄 After Running Migrations

1. Refresh your browser at the RFI page
2. The 400 error should be gone
3. You should see "No RFIs found. Create your first RFI to get started."
4. Click "Create RFI" - it should now work!

## 🆘 If You Get Errors

Common issues:

**Error: "type rfi_status already exists"**
- The migrations were already run partially
- Contact me to create a rollback script

**Error: "relation user_project_ids does not exist"**
- The helper function `user_project_ids()` is missing
- Contact me to add this function

**Error: "relation log_changes does not exist"**
- The audit function is missing
- We can skip audit triggers for now

## 📞 Need Help?

Share any error messages you see and I'll help debug!
