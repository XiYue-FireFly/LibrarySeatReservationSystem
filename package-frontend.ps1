# Nested Packaging Script (App inside Web/dist/mobile)
Write-Host "Cleaning target..." -ForegroundColor Gray
if (Test-Path "frontend/dist") { Remove-Item -Recurse -Force "frontend/dist" }

# 1. Build Web Frontend
Write-Host "Building Web Frontend..." -ForegroundColor Cyan
cd frontend
npm run build
cd ..

# 2. Build Mobile App
Write-Host "Building Mobile App (Target BASE: /mobile/)..." -ForegroundColor Cyan
cd app
npm run build
cd ..

# 3. Nest App into Web
Write-Host "Nesting App into Web/dist/mobile..." -ForegroundColor Cyan
New-Item -ItemType Directory -Path "frontend/dist/mobile" -Force
Copy-Item -Recurse -Force "app/dist/*" "frontend/dist/mobile/"

Write-Host "Packaging Complete!" -ForegroundColor Green
Write-Host "Structure matches your screenshot (mobile folder inside dist)." -ForegroundColor White
Write-Host "The final package is in 'frontend/dist'." -ForegroundColor Yellow
Write-Host "Upload the contents of 'frontend/dist' to your website root." -ForegroundColor White
Write-Host "Access Web: https://www.xilian.icu/" -ForegroundColor Green
Write-Host "Access App: https://www.xilian.icu/mobile/" -ForegroundColor Green
