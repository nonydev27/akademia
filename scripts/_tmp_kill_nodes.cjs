const { execSync } = require('child_process');
try {
  const result = execSync('tasklist /FI "IMAGENAME eq node.exe" /FO CSV', { encoding: 'utf8' });
  const lines = result.trim().split('\n');
  console.log('Node processes found:', lines.length - 1);
  lines.slice(1).forEach((line) => {
    try {
      const parts = line.split('","').map(p => p.replace(/^"|"$/g, ''));
      const pid = parts[1];
      if (pid && /^\d+$/.test(pid)) {
        console.log('PID:', pid);
      }
    } catch (e) {}
  });
} catch (e) {
  console.log('Error:', e.message.slice(0, 200));
}
