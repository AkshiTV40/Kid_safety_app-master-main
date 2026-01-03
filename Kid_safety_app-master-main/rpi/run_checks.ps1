<#
run_checks.ps1 — Windows helper to run `rpi/check_rpi.py`.
Usage examples:
  # Run checks against a running service (no server start):
  .\rpi\run_checks.ps1 -Base http://127.0.0.1:8000

  # Start the app locally, run checks (disables hardware buttons automatically):
  .\rpi\run_checks.ps1 -StartServer

  # Skip camera start/stop (useful on dev machines without a camera):
  .\rpi\run_checks.ps1 -NoCamera

  # Check MJPEG stream briefly (requires camera):
  .\rpi\run_checks.ps1 -CheckStream -StartServer
#>
param(
    [string]$Base = 'http://127.0.0.1:8000',
    [switch]$NoCamera,
    [switch]$CheckStream,
    [switch]$StartServer,
    [int]$ServerWaitSeconds = 10
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path (Join-Path $scriptDir '..')
$venvPython = Join-Path $repoRoot '.venv\Scripts\python.exe'
if (-not (Test-Path $venvPython)) {
    Write-Host "Virtualenv python not found at $venvPython. Falling back to 'python' on PATH." -ForegroundColor Yellow
    $venvPython = 'python'
}

$checkArgs = @('--base', $Base)
if ($NoCamera) { $checkArgs += '--no-camera' }
if ($CheckStream) { $checkArgs += '--check-stream' }

$serverProc = $null
$prevDisableButtons = $env:DISABLE_BUTTONS
if ($StartServer) {
    Write-Host "Starting server (DISABLE_BUTTONS=1)..." -ForegroundColor Cyan
    $env:DISABLE_BUTTONS = '1'
    $serverProc = Start-Process -FilePath $venvPython -ArgumentList 'rpi/app.py' -WorkingDirectory $repoRoot -PassThru -WindowStyle Hidden

    # wait for health endpoint
    $deadline = (Get-Date).AddSeconds($ServerWaitSeconds)
    while ((Get-Date) -lt $deadline) {
        try {
            $r = Invoke-WebRequest -Uri "$Base/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
            if ($r.StatusCode -eq 200) { Write-Host 'Server ready' -ForegroundColor Green; break }
        } catch {}
        Start-Sleep -Milliseconds 500
    }
    if (-not $r -or $r.StatusCode -ne 200) {
        Write-Host "Server did not start within $ServerWaitSeconds seconds" -ForegroundColor Red
        if ($serverProc) { $serverProc.Kill() }
        Exit 1
    }
}

try {
    Write-Host "Running checks against $Base" -ForegroundColor Cyan
    $pinfo = & $venvPython rpi/check_rpi.py @checkArgs
    $exitCode = $LASTEXITCODE
    Write-Host $pinfo
    if ($exitCode -ne 0) {
        Write-Host "Checks failed with exit code $exitCode" -ForegroundColor Red
        Exit $exitCode
    }
    Write-Host "Checks passed" -ForegroundColor Green
} finally {
    if ($serverProc) {
        Write-Host "Stopping server process" -ForegroundColor Cyan
        try { $serverProc.Kill() } catch {}
    }
    if ($null -ne $prevDisableButtons) { $env:DISABLE_BUTTONS = $prevDisableButtons } else { Remove-Item Env:DISABLE_BUTTONS -ErrorAction SilentlyContinue }
}
