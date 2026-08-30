# ============================================================
#  watch.ps1  -  Fully automatic sync (watch mode)
#
#  Usage:
#    .\watch.ps1          # check every 3 seconds
#    .\watch.ps1 10       # check every 10 seconds
#
#  Stop with Ctrl+C.
#
#  Behavior: every N seconds it stages changes, commits them
#  and pushes to GitHub automatically. If a push fails (e.g.
#  network), it keeps retrying on later cycles.
#
#  NOTE: this commits EVERYTHING (including small debugging
#  edits). If you want to decide when to save a snapshot,
#  use .\sync.ps1 instead.
# ============================================================
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$interval = 3
if ($args.Count -gt 0) {
    $n = 0
    if ([int]::TryParse($args[0], [ref]$n) -and $n -gt 0) { $interval = $n }
}

$pendingPush = $false

Write-Host "Auto-sync started: checking every ${interval}s (Ctrl+C to stop)..."

while ($true) {
    git add -A
    $changed = git status --porcelain
    if (-not [string]::IsNullOrWhiteSpace($changed)) {
        $msg = "auto: {0:yyyy-MM-dd HH:mm:ss}" -f (Get-Date)
        git commit -m $msg | Out-Null
        $pendingPush = $true
    }

    if ($pendingPush) {
        git push 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            $pendingPush = $false
            Write-Host ("[{0}] auto-committed and pushed: " -f (Get-Date -Format 'HH:mm:ss')) $msg
        } else {
            Write-Host ("[{0}] push failed, will retry next cycle..." -f (Get-Date -Format 'HH:mm:ss'))
        }
    }

    Start-Sleep -Seconds $interval
}
