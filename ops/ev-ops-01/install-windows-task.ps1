# EV-OPS-01 — Register a Windows Scheduled Task (LEGACY — prefer cloud hourly).
# EVS-24: GitHub Actions on main is the sole Production monitor (hourly).
# Prefer ops/ev-ops-01/disable-windows-task.ps1 so this host does not duplicate.
# Does not modify Production application or Vercel config.
param(
  [string]$TaskName = "EV-OPS-01-Production-Monitor",
  [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
)

$node = (Get-Command node -ErrorAction Stop).Source
$script = Join-Path $RepoRoot "ops\ev-ops-01\run-check.mjs"
$varDir = Join-Path $RepoRoot "ops\ev-ops-01\var"
New-Item -ItemType Directory -Force -Path $varDir | Out-Null

# Host runner is evidence-only for live mail unless Director sets
# MONITORING_ALERT_EMITTER=host (cloud is the default EV-OPS-02 live emitter).
$action = New-ScheduledTaskAction -Execute $node -Argument "`"$script`"" -WorkingDirectory $RepoRoot
# Environment for the task is inherited from the user session; document expected:
# MONITORING_RUNNER=host, MONITORING_ALERT_EMITTER=none (or omit).
# RepetitionDuration must be finite for schtasks; 10 years is effectively persistent.
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval (New-TimeSpan -Minutes 5) -RepetitionDuration (New-TimeSpan -Days 3650)
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -MultipleInstances IgnoreNew
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Force | Out-Null
Get-ScheduledTask -TaskName $TaskName | Select-Object TaskName, State | Format-List
Get-ScheduledTaskInfo -TaskName $TaskName | Select-Object LastRunTime, NextRunTime | Format-List
Write-Host "Registered $TaskName -> $script (every 5 minutes)"
