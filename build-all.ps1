# Build script: Build both App and Web and nest them
# Usage: .\build-all.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Building Mobile App + Web Dashboard" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 1. Build app (React - Mobile)
Write-Host "`n[1/3] Building Mobile App (app/)..." -ForegroundColor Yellow
$currentDir = Get-Location
Set-Location -Path "$PSScriptRoot\app"
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Mobile build failed!" -ForegroundColor Red
    Set-Location -Path $currentDir
    exit 1
}
Write-Host "Mobile build complete" -ForegroundColor Green

# 2. Build frontend (Vue - Desktop)
Write-Host "`n[2/3] Building Desktop Web (frontend/)..." -ForegroundColor Yellow
Set-Location -Path "$PSScriptRoot\frontend"
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Desktop build failed!" -ForegroundColor Red
    Set-Location -Path $currentDir
    exit 1
}
Write-Host "Desktop build complete" -ForegroundColor Green

# 3. Copy app/dist to frontend/dist/mobile/
Write-Host "`n[3/3] Nesting App into Web/dist/mobile..." -ForegroundColor Yellow
$mobileDist = "$PSScriptRoot\frontend\dist\mobile"
if (Test-Path $mobileDist) {
    Remove-Item -Recurse -Force $mobileDist
}
New-Item -ItemType Directory -Force -Path $mobileDist | Out-Null
Copy-Item -Recurse -Path "$PSScriptRoot\app\dist\*" -Destination $mobileDist

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Build Complete!" -ForegroundColor Green
Write-Host "  Desktop: frontend/dist/index.html" -ForegroundColor Cyan
Write-Host "  Mobile:  frontend/dist/mobile/index.html" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Set-Location -Path $currentDir
