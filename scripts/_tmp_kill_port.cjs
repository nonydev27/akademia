const net = require('net');
const { execSync } = require('child_process');

// Find process using port 5000 via /proc (not available on Windows)
// Use PowerShell equivalent
try {
  const result = execSync(
    'powershell -NoProfile -Command "' +
    '  $conn = Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue;' +
    '  if ($conn) { $pid = $conn.OwningProcess; Write-Output \"PID: $pid\"; ' +
    '    Stop-Process -Id $pid -Force; Write-Output \"Killed $pid\" } ' +
    '  else { Write-Output \"Nothing on 5000\" }"',
    { encoding: 'utf8', timeout: 10000 }
  );
  console.log(result);
} catch (e) {
  console.log('Error:', e.message.slice(0, 200));
}
