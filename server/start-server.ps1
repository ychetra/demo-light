Write-Host "Starting Node.js WebSocket Server..."

# Kill any existing processes on port 8765
$processId = (Get-NetTCPConnection -LocalPort 8765 -ErrorAction SilentlyContinue).OwningProcess
if ($processId) {
    if (Get-Process -Id $processId -ErrorAction SilentlyContinue) {
        Stop-Process -Id $processId -Force
        Write-Host "Killed existing process on port 8765"
    } else {
        Write-Host "No process found with ID $processId"
    }
}

# Install dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..."
    npm install
}

# Start the Node.js server
Write-Host "Starting server..."
node start.js 