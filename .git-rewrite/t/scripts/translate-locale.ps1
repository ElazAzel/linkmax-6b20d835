# PowerShell script to translate locale files using Supabase Edge Function
# Usage: .\translate-locale.ps1 -Lang "es" -LangName "Spanish"

param(
    [Parameter(Mandatory = $true)]
    [string]$Lang,
    
    [Parameter(Mandatory = $true)]
    [string]$LangName
)

# Load environment variables from .env.local
$envFile = Join-Path $PSScriptRoot "..\..\.env.local"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            [System.Environment]::SetEnvironmentVariable($matches[1], $matches[2], 'Process')
        }
    }
}

$SUPABASE_URL = $env:VITE_SUPABASE_URL
$SUPABASE_ANON_KEY = $env:VITE_SUPABASE_ANON_KEY

if (-not $SUPABASE_URL -or -not $SUPABASE_ANON_KEY) {
    Write-Host "Error: SUPABASE_URL or SUPABASE_ANON_KEY not found in .env.local" -ForegroundColor Red
    exit 1
}

Write-Host "`n🌍 Translating to $LangName ($Lang)..." -ForegroundColor Cyan

# Load English locale
$enPath = Join-Path $PSScriptRoot "..\src\i18n\locales\en.json"
$enContent = Get-Content $enPath -Raw | ConvertFrom-Json

# Flatten function
function ConvertTo-FlatObject {
    param($obj, $prefix = "")
    
    $result = @{}
    foreach ($key in $obj.PSObject.Properties.Name) {
        $value = $obj.$key
        $newKey = if ($prefix) { "$prefix.$key" } else { $key }
        
        if ($value -is [PSCustomObject]) {
            $nested = ConvertTo-FlatObject -obj $value -prefix $newKey
            foreach ($nKey in $nested.Keys) {
                $result[$nKey] = $nested[$nKey]
            }
        }
        else {
            $result[$newKey] = $value
        }
    }
    return $result
}

# Unflatten function
function ConvertFrom-FlatObject {
    param($flat)
    
    $result = @{}
    foreach ($key in $flat.Keys) {
        $parts = $key.Split('.')
        $current = $result
        
        for ($i = 0; $i -lt $parts.Length - 1; $i++) {
            if (-not $current.ContainsKey($parts[$i])) {
                $current[$parts[$i]] = @{}
            }
            $current = $current[$parts[$i]]
        }
        
        $current[$parts[$parts.Length - 1]] = $flat[$key]
    }
    
    return $result
}

# Translate function
function Get-TranslatedText {
    param($text, $targetLang)
    
    $body = @{
        text            = $text
        sourceLanguage  = "en"
        targetLanguages = @($targetLang)
    } | ConvertTo-Json -Depth 10
    
    $headers = @{
        "apikey"        = $SUPABASE_ANON_KEY
        "Authorization" = "Bearer $SUPABASE_ANON_KEY"
        "Content-Type"  = "application/json"
    }
    
    try {
        $response = Invoke-RestMethod -Uri "$SUPABASE_URL/functions/v1/translate-content" `
            -Method Post `
            -Headers $headers `
            -Body $body `
            -TimeoutSec 30
        
        return $response.translations.$targetLang
    }
    catch {
        Write-Host "    Error: $_" -ForegroundColor Red
        return $text
    }
}

# Flatten English locale
$flatEn = ConvertTo-FlatObject -obj $enContent
$totalKeys = $flatEn.Count
Write-Host "  📊 Total keys: $totalKeys"

# Translate
$translated = @{}
$count = 0

foreach ($key in $flatEn.Keys) {
    $value = $flatEn[$key]
    
    if ($value -is [string] -and $value.Trim()) {
        $count++
        Write-Host "`r  ⏳ Progress: $count/$totalKeys keys" -NoNewline
        
        $translatedValue = Get-TranslatedText -text $value -targetLang $Lang
        $translated[$key] = $translatedValue
        
        # Small delay
        Start-Sleep -Milliseconds 200
        
        # Larger delay every 30 keys
        if ($count % 30 -eq 0) {
            Write-Host "`n  ⏸️  Waiting 3s (rate limit)..." -ForegroundColor Yellow
            Start-Sleep -Seconds 3
        }
    }
    else {
        $translated[$key] = $value
        $count++
    }
}

Write-Host "`n  ✅ Translation complete!" -ForegroundColor Green

# Unflatten and save
$unflattened = ConvertFrom-FlatObject -flat $translated
$targetPath = Join-Path $PSScriptRoot "..\src\i18n\locales\$Lang.json"

# Convert to JSON with proper formatting
$json = $unflattened | ConvertTo-Json -Depth 100
$json | Out-File -FilePath $targetPath -Encoding UTF8

Write-Host "  💾 Saved to $Lang.json`n" -ForegroundColor Green
