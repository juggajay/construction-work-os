/**
 * Update storage bucket configuration via Management API
 */

const https = require('https')

const projectRef = 'tokjmeqjvexnmtampyjm'
const accessToken = 'sbp_d8294d5b91c7bcd7d7229e014ada14ca6779d6d2'
const bucketId = 'project-invoices'

const bucketConfig = {
  public: false,
  file_size_limit: 26214400, // 25MB
  allowed_mime_types: ['application/pdf', 'image/jpeg', 'image/png', 'image/heic']
}

const options = {
  hostname: 'api.supabase.com',
  port: 443,
  path: `/v1/projects/${projectRef}/storage/buckets/${bucketId}`,
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }
}

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`)

  let data = ''
  res.on('data', (chunk) => {
    data += chunk
  })

  res.on('end', () => {
    console.log('Response:', data)
    if (res.statusCode === 200) {
      console.log('✅ Bucket updated successfully!')
    } else {
      console.error('❌ Failed to update bucket')
    }
  })
})

req.on('error', (error) => {
  console.error('❌ Error:', error)
})

console.log('📤 Updating bucket configuration via Management API...')
console.log('Bucket ID:', bucketId)
console.log('Config:', JSON.stringify(bucketConfig, null, 2))

req.write(JSON.stringify(bucketConfig))
req.end()
