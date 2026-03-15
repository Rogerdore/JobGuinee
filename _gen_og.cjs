const https = require('https');
const jobId = 'b8a900b6-0ff6-44ca-b610-e2d4a3f941fa';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoaGp6Z2VpZGpxY3R1dmVvcHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NDc5NjUsImV4cCI6MjA4MDMyMzk2NX0.kaxpdgyYyGXiN93bThIceJ_p0j6hZQr5yz7obTtRSqA';

const options = {
  hostname: 'hhhjzgeidjqctuveopso.supabase.co',
  path: `/functions/v1/generate-job-og-image?job_id=${jobId}`,
  headers: { 
    'Authorization': `Bearer ${anonKey}`
  }
};

console.log('Generating OG image...');
https.get(options, (r) => {
  let d = '';
  r.on('data', (c) => { d += c });
  r.on('end', () => {
    console.log('STATUS:', r.statusCode);
    console.log('RESPONSE:', d);
  });
}).on('error', (e) => { console.log('ERR:', e.message) });
