# 一键构建脚本：构建两个前端并整合
# 使用方法: 在项目根目录执行 .\build-all.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  构建前端 - 移动端 + 桌面端" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 1. 构建 app (React - 移动端)
Write-Host "`n[1/3] 构建移动端 (app/)..." -ForegroundColor Yellow
Set-Location -Path "$PSScriptRoot\app"
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "移动端构建失败!" -ForegroundColor Red
    exit 1
}
Write-Host "移动端构建完成" -ForegroundColor Green

# 2. 构建 frontend (Vue - 桌面端)
Write-Host "`n[2/3] 构建桌面端 (frontend/)..." -ForegroundColor Yellow
Set-Location -Path "$PSScriptRoot\frontend"
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "桌面端构建失败!" -ForegroundColor Red
    exit 1
}
Write-Host "桌面端构建完成" -ForegroundColor Green

# 3. 将 app 构建产物复制到 frontend/dist/mobile/
Write-Host "`n[3/3] 整合构建产物..." -ForegroundColor Yellow
$mobileDist = "$PSScriptRoot\frontend\dist\mobile"
if (Test-Path $mobileDist) {
    Remove-Item -Recurse -Force $mobileDist
}
Copy-Item -Recurse -Path "$PSScriptRoot\app\dist" -Destination $mobileDist

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  构建完成!" -ForegroundColor Green
Write-Host "  产物目录: frontend/dist/" -ForegroundColor Cyan
Write-Host "  桌面端: frontend/dist/index.html" -ForegroundColor Cyan
Write-Host "  移动端: frontend/dist/mobile/index.html" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Set-Location -Path $PSScriptRoot
