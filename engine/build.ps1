# engine\build.ps1 -- compile the engine to engine.exe
Set-Location $PSScriptRoot
$env:PATH = "C:\msys64\ucrt64\bin;C:\msys64\usr\bin;" + $env:PATH

g++ -std=c++20 -O2 -pthread -static -static-libgcc -static-libstdc++ `
    server.cpp -o engine.exe -lws2_32

if ($LASTEXITCODE -eq 0) {
    Write-Host "BUILD OK" -ForegroundColor Green
} else {
    Write-Host "BUILD FAILED - read the g++ errors above." -ForegroundColor Red
}