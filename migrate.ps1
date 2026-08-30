# STEAM Foundry Monorepo Migration
# Simple script to move files and update imports

$RepoRoot = "C:\Users\DELL\Downloads\innovation-lab-repo"
$LabRoot = "$RepoRoot\packages\lab"

Write-Host "=== STEAM Foundry Monorepo Migration ===" -ForegroundColor Green
Write-Host ""

# Step 1: Backup
Write-Host "Step 1: Creating backup..." -ForegroundColor Cyan
$BackupTime = Get-Date -Format "yyyyMMdd-HHmmss"
$BackupPath = "$RepoRoot\src.backup.$BackupTime"
Copy-Item -Path "$RepoRoot\src" -Destination $BackupPath -Recurse -Force
Write-Host "Backup created: $BackupPath" -ForegroundColor Green
Write-Host ""

# Step 2: Copy src/
Write-Host "Step 2: Copying src/ to packages/lab/src/..." -ForegroundColor Cyan
if (Test-Path "$LabRoot\src") {
    Remove-Item "$LabRoot\src" -Recurse -Force
}
Copy-Item -Path "$RepoRoot\src" -Destination "$LabRoot\src" -Recurse -Force
Write-Host "Done: src/ copied to packages/lab/src/" -ForegroundColor Green
Write-Host ""

# Step 3: Copy config files
Write-Host "Step 3: Copying config files..." -ForegroundColor Cyan
Copy-Item -Path "$RepoRoot\index.html" -Destination "$LabRoot\index.html" -Force
Copy-Item -Path "$RepoRoot\tailwind.config.ts" -Destination "$LabRoot\tailwind.config.ts" -Force
Copy-Item -Path "$RepoRoot\components.json" -Destination "$LabRoot\components.json" -Force
Write-Host "Done: Config files copied" -ForegroundColor Green
Write-Host ""

# Step 4: Copy public/
Write-Host "Step 4: Copying public/ directory..." -ForegroundColor Cyan
if (Test-Path "$LabRoot\public") {
    Remove-Item "$LabRoot\public" -Recurse -Force
}
Copy-Item -Path "$RepoRoot\public" -Destination "$LabRoot\public" -Recurse -Force
Write-Host "Done: public/ copied" -ForegroundColor Green
Write-Host ""

# Step 5: Update imports
Write-Host "Step 5: Updating imports in TypeScript files..." -ForegroundColor Cyan
$Files = Get-ChildItem -Path "$LabRoot\src" -Recurse -Include "*.tsx", "*.ts"
$UpdateCount = 0

foreach ($File in $Files) {
    $Content = Get-Content -Path $File.FullName -Raw

    # Update Supabase client import
    if ($Content -match "@/integrations/supabase/client") {
        $Content = $Content -replace "@/integrations/supabase/client", "@steam-foundry/shared/api"
        $UpdateCount++
        Write-Host "Updated: $($File.Name)" -ForegroundColor Yellow
    }
}

# Write back updated files
foreach ($File in $Files) {
    $Content = Get-Content -Path $File.FullName -Raw

    if ($Content -match "@steam-foundry/shared") {
        Set-Content -Path $File.FullName -Value $Content -Encoding UTF8
    }
}

Write-Host "Done: $UpdateCount files updated" -ForegroundColor Green
Write-Host ""

# Step 6: Verify
Write-Host "Step 6: Verifying structure..." -ForegroundColor Cyan
$Checks = @(
    "packages\lab\src\pages",
    "packages\lab\src\components",
    "packages\lab\public",
    "packages\shared\src"
)

foreach ($Check in $Checks) {
    $Path = "$RepoRoot\$Check"
    if (Test-Path $Path) {
        Write-Host "OK: $Check" -ForegroundColor Green
    } else {
        Write-Host "MISSING: $Check" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== Migration Complete ===" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. cd packages\lab" -ForegroundColor White
Write-Host "2. pnpm install" -ForegroundColor White
Write-Host "3. pnpm build" -ForegroundColor White
Write-Host "4. pnpm dev (to test)" -ForegroundColor White
