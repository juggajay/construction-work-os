/**
 * Create project-invoices bucket via Supabase Management API
 */

const https = require('https')

const accessToken = 'sbp_d8294d5b91c7bcd7d7229e014ada14ca6779d6d2'
const projectRef = 'tokjmeqjvexnmtampyjm'

async function createBucket() {
  const data = JSON.stringify({
    name: 'project-invoices',
    id: 'project-invoices',
    public: false,
    file_size_limit: 26214400, // 25MB
    allowed_mime_types: ['application/pdf', 'image/jpeg', 'image/png', 'image/heic']
  })

  const options = {
    hostname: 'api.supabase.com',
    port: 443,
    path: `/v1/projects/${projectRef}/buckets`,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
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
          resolve(JSON.parse(body))
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

console.log('📤 Creating project-invoices bucket via Management API...\n')
createBucket()
  .then(() => {
    console.log('\n🎉 Now adding RLS policies...')
    process.exit(0)
  })
  .catch((err) => {
    console.error('Error:', err.message)
    process.exit(1)
  })
