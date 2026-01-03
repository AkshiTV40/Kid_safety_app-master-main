@echo off
rem Simple shim to run the PowerShell wrapper from cmd
set SCRIPT_DIR=%~dp0
powershell -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_DIR%\run_checks.ps1" %*
