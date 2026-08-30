# STEAM Foundry Monorepo Migration Script
# Automates: file copying, import updates, verification

param(
    [switch]$DryRun = $false,
    [switch]$Verbose = $false
)

$ErrorActionPreference = "Stop"
$RepoRoot = Get-Location
$LabRoot = Join-Path $RepoRoot "packages\lab"
$SharedRoot = Join-Path $RepoRoot "packages\shared"

function Write-Header {
    param([string]$Message)
    Write-Host "`n================================" -ForegroundColor Cyan
    Write-Host $Message -ForegroundColor Cyan
    Write-Host "================================`n" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Blue
}

# Step 1: Backup original src/
Write-Header "Step 1: Backup Original src/"
$BackupPath = Join-Path $RepoRoot "src.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss')"
if ($DryRun) {
    Write-Info "[DRY RUN] Would backup src/ to $BackupPath"
} else {
    if (Test-Path (Join-Path $RepoRoot "src")) {
        Copy-Item -Path (Join-Path $RepoRoot "src") -Destination $BackupPath -Recurse -Force
        Write-Success "Backup created: $BackupPath"
    }
}

# Step 2: Copy src/ to packages/lab/src/
Write-Header "Step 2: Copy src/ to packages/lab/src/"
$SourcePath = Join-Path $RepoRoot "src"
$DestPath = Join-Path $LabRoot "src"

if (Test-Path $SourcePath) {
    if ($DryRun) {
        Write-Info "DRY RUN: Would copy $SourcePath to $DestPath"
    } else {
        if (Test-Path $DestPath) {
            Remove-Item $DestPath -Recurse -Force
        }
        Copy-Item -Path $SourcePath -Destination $DestPath -Recurse -Force
        Write-Success "Copied src/ to packages/lab/src/"
    }
} else {
    Write-Error "src/ directory not found at $SourcePath"
}

# Step 3: Copy root config files
Write-Header "Step 3: Copy Root Config Files"
$FilesToCopy = @(
    "index.html",
    "tailwind.config.ts",
    "components.json"
)

foreach ($file in $FilesToCopy) {
    $Source = Join-Path $RepoRoot $file
    $Dest = Join-Path $LabRoot $file

    if (Test-Path $Source) {
        if ($DryRun) {
            Write-Info "DRY RUN: Would copy $file"
        } else {
            Copy-Item -Path $Source -Destination $Dest -Force
            Write-Success "Copied $file"
        }
    } else {
        Write-Info "Skipped $file (not found)"
    }
}

# Step 4: Copy public directory
Write-Header "Step 4: Copy public/ Directory"
$PublicSource = Join-Path $RepoRoot "public"
$PublicDest = Join-Path $LabRoot "public"

if (Test-Path $PublicSource) {
    if ($DryRun) {
        Write-Info "DRY RUN: Would copy public/ directory"
    } else {
        if (Test-Path $PublicDest) {
            Remove-Item $PublicDest -Recurse -Force
        }
        Copy-Item -Path $PublicSource -Destination $PublicDest -Recurse -Force
        Write-Success "Copied public/ directory"
    }
}

# Step 5: Update imports in all .tsx and .ts files
Write-Header "Step 5: Update Imports in TypeScript Files"

$ImportRules = @(
    @{
        Pattern = "@/integrations/supabase/client"
        Replacement = "@steam-foundry/shared/api"
        Description = "Supabase client"
    },
    @{
        Pattern = "from '@/contexts/ThemeContext'"
        Replacement = "from '@steam-foundry/shared' /* ThemeContext moved to shared */"
        Description = "ThemeContext import"
    }
)

$TypeScriptFiles = Get-ChildItem -Path $DestPath -Recurse -Include "*.tsx", "*.ts" -ErrorAction SilentlyContinue

Write-Info "Found $($TypeScriptFiles.Count) TypeScript files to process"

$UpdateCount = 0
foreach ($file in $TypeScriptFiles) {
    $Content = Get-Content -Path $file.FullName -Raw
    $OriginalContent = $Content

    foreach ($rule in $ImportRules) {
        if ($Content -match [regex]::Escape($rule.Pattern)) {
            $Content = $Content -replace [regex]::Escape($rule.Pattern), $rule.Replacement

            if ($DryRun) {
                Write-Info "DRY RUN: Would update $($file.Name) - $($rule.Description)"
            } else {
                Write-Info "Updating: $($file.Name) - $($rule.Description)"
                $UpdateCount++
            }
        }
    }

    if ($Content -ne $OriginalContent -and -not $DryRun) {
        Set-Content -Path $file.FullName -Value $Content -Encoding UTF8
    }
}

if ($DryRun) {
    Write-Success "DRY RUN: Would update approximately $($UpdateCount) files"
} else {
    Write-Success "Updated $($UpdateCount) files with new imports"
}

# Step 6: Verify structure
Write-Header "Step 6: Verify Directory Structure"

$RequiredDirs = @(
    "packages\lab\src\pages",
    "packages\lab\src\components",
    "packages\lab\public",
    "packages\shared\src\lib",
    "packages\shared\src\hooks",
    "packages\shared\src\types"
)

$AllExist = $true
foreach ($dir in $RequiredDirs) {
    $FullPath = Join-Path $RepoRoot $dir
    if (Test-Path $FullPath) {
        Write-Success "✓ $dir"
    } else {
        Write-Error "✗ $dir (missing)"
        $AllExist = $false
    }
}

# Step 7: Summary
Write-Header "Migration Summary"

if ($DryRun) {
    Write-Info "DRY RUN MODE - No changes were made"
    Write-Info "Run again without -DryRun to apply changes"
} else {
    if ($AllExist) {
        Write-Success "All directories verified!"
        Write-Info "`nNext steps:"
        Write-Info "1. Run: pnpm install"
        Write-Info "2. Run: pnpm --filter=lab build"
        Write-Info "3. Verify build output has route chunks"
        Write-Info "4. Run: pnpm --filter=lab dev"
    } else {
        Write-Error "Some directories are missing. Migration may be incomplete."
    }
}

Write-Info "`nBackup of original src/ saved to: $BackupPath"
Write-Info "You can restore it if needed with: copy-item -path '$BackupPath' -destination '$(Join-Path $RepoRoot src)' -recurse -force"
