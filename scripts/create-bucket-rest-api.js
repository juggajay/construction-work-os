/**
 * Create project-invoices bucket via Storage REST API
 */

const https = require('https')

const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRva2ptZXFqdmV4bm10YW1weWptIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDQ5MjI2NiwiZXhwIjoyMDUwMDY4MjY2fQ.RBWFqZE6pRa1Qgs0RMJLDpgTEW8kJKgPl1j33nLPz7U'
const supabaseUrl = 'https://tokjmeqjvexnmtampyjm.supabase.co'

async function createBucket() {
  const data = JSON.stringify({
    name: 'project-invoices',
    id: 'project-invoices',
    public: false,
    file_size_limit: 26214400,
    allowed_mime_types: ['application/pdf', 'image/jpeg', 'image/png', 'image/heic']
  })

  const options = {
    hostname: 'tokjmeqjvexnmtampyjm.supabase.co',
    port: 443,
    path: '/storage/v1/bucket',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      'apikey': serviceRoleKey,
      'Content-Length': data.length
    }
  }

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = ''

      res.on('data', (chunk) => {
        body += chunk
      })

      res.on('end', () => {
        console.log('Status:', res.statusCode)
        console.log('Response:', body)

        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log('\n✅ Bucket created successfully!')
          resolve(body ? JSON.parse(body) : {})
        } else {
          console.log('\n❌ Failed to create bucket')
          reject(new Error(body))
        }
      })
    })

    req.on('error', (error) => {
      console.error('Request error:', error)
      reject(error)
    })

    req.write(data)
    req.end()
  })
}

console.log('📤 Creating project-invoices bucket via Storage REST API...\n')
createBucket()
  .then(() => {
    console.log('\n🎉 Bucket created! Now we need to add RLS policies.')
    process.exit(0)
  })
  .catch((err) => {
    console.error('Error:', err.message)
    process.exit(1)
  })
