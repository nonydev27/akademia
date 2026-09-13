const http = require('http');
const req = http.get('http://localhost:5000/api/v1/subscriptions/status', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Body:', data.slice(0, 300));
  });
});
req.on('error', (e) => console.log('Error:', e.message));
req.setTimeout(5000, () => { console.log('Timeout'); req.destroy(); });
