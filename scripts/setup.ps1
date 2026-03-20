Write-Host "Setting up RakshaSphere..."

$root = Split-Path -Parent $PSScriptRoot

# FRONTEND SETUP
Write-Host "Setting up frontend..."
Set-Location "$root\frontend"
npm init -y
npm install react react-native react-native-maps axios

# BACKEND SETUP
Write-Host "Setting up backend..."
Set-Location "$root\backend"
npm init -y
npm install express aws-sdk multer cors

Set-Location $root

Write-Host "Setup complete!"
