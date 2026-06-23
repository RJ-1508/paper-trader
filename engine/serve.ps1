# engine\serve.ps1 -- run engine.exe and probe its health endpoint
Set-Location $PSScriptRoot

if (-not (Test-Path .\engine.exe)) {
    Write-Host "engine.exe not found - run .\build.ps1 first." -ForegroundColor Red
    return
}

Start-Process -FilePath .\engine.exe   # runs in a separate window and keeps serving
Start-Sleep -Seconds 1                  # give it a moment to bind the port

try {
    $health = Invoke-RestMethod "http://localhost:8000/health" -TimeoutSec 3
    Write-Host "ENGINE UP on http://localhost:8000" -ForegroundColor Green
    "health: $health"
} catch {
    Write-Host "Could not reach :8000 - the build may have silently failed. Re-run .\build.ps1 and read its output." -ForegroundColor Red
}
