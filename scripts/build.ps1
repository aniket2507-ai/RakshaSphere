Write-Host "Building project..."

$root = Split-Path -Parent $PSScriptRoot

Set-Location "$root\frontend"
npm run build

Set-Location "$root\backend"
Write-Host "Backend ready"

Set-Location $root
Write-Host "Build complete!"
