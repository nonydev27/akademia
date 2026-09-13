$conn = Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue
if ($conn) {
    $procId = $conn.OwningProcess
    Write-Output "Found PID: $procId"
    Stop-Process -Id $procId -Force
    Write-Output "Killed $procId"
} else {
    Write-Output "Nothing on port 5000"
}
