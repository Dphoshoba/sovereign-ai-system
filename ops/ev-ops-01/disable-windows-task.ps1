# EV-OPS-01 — Disable the duplicate Windows Scheduled Task (EVS-24).
# Cloud GitHub Actions is the sole hourly Production monitor + live emitter.
# Does not modify Production application or Vercel config.
param(
  [string]$TaskName = "EV-OPS-01-Production-Monitor"
)

$ErrorActionPreference = "Stop"
$task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if (-not $task) {
  Write-Host "Task $TaskName not found (already absent)."
  exit 0
}

if ($task.State -eq "Disabled") {
  Write-Host "Task $TaskName already Disabled."
} else {
  Disable-ScheduledTask -TaskName $TaskName | Out-Null
  Write-Host "Disabled $TaskName"
}

Get-ScheduledTask -TaskName $TaskName | Select-Object TaskName, State | Format-List
Get-ScheduledTaskInfo -TaskName $TaskName | Select-Object LastRunTime, NextRunTime | Format-List
