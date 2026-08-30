# ============================================================
#  sync.ps1  -  One-command sync: commit local changes & push
#
#  Usage (run from the repo root):
#    .\sync.ps1 "update: add xxx"     # custom commit message
#    .\sync.ps1                       # auto timestamp message
#
#  What it does:  git add -A  ->  git commit  ->  git push
#  Safe: nothing is pushed until changes are committed locally.
# ============================================================
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if ($args.Count -gt 0) {
    $msg = $args -join " "
} else {
    $msg = "update: {0:yyyy-MM-dd HH:mm:ss}" -f (Get-Date)
}

git add -A
if ($LASTEXITCODE -ne 0) { Write-Host "FAILED: git add"; exit 1 }

$changed = git status --porcelain
if ([string]::IsNullOrWhiteSpace($changed)) {
    Write-Host "Nothing to commit - local is already in sync with GitHub."
    exit 0
}

git commit -m $msg
if ($LASTEXITCODE -ne 0) { Write-Host "FAILED: git commit"; exit 1 }

git push
if ($LASTEXITCODE -ne 0) { Write-Host "FAILED: git push (check network / proxy)"; exit 1 }

Write-Host "OK: committed and pushed. Latest commit:"
git log --oneline -1
