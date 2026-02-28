# Install npm dependencies for the project.
# Run from project root in PowerShell (Node.js must be in PATH).
# Example: .\scripts\install-deps.ps1

Set-Location $PSScriptRoot\..

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "Node.js not found in PATH. Install from https://nodejs.org/ or run 'nvm use' if using nvm." -ForegroundColor Red
    exit 1
}

Write-Host "Running npm install..." -ForegroundColor Cyan
& npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "npm install failed." -ForegroundColor Red
    exit 1
}
Write-Host "Done. You can run npm run dev, npm run i18n:fill, etc." -ForegroundColor Green
