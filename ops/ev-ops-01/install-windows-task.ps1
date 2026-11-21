# EV-OPS-01 — Register a persistent Windows Scheduled Task (every 5 minutes).
# Callers: operator host used for Production monitoring continuity.
# Existing: none. Does not modify Production application or Vercel config.
# User instruction: persistent scheduler independent of Cursor/Grok sessions.
param(
  [string]$TaskName = "EV-OPS-01-Production-Monitor",
  [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
)

$node = (Get-Command node -ErrorAction Stop).Source
$script = Join-Path $RepoRoot "ops\ev-ops-01\run-check.mjs"
$varDir = Join-Path $RepoRoot "ops\ev-ops-01\var"
New-Item -ItemType Directory -Force -Path $varDir | Out-Null

$action = New-ScheduledTaskAction -Execute $node -Argument "`"$script`"" -WorkingDirectory $RepoRoot
# RepetitionDuration must be finite for schtasks; 10 years is effectively persistent.
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval (New-TimeSpan -Minutes 5) -RepetitionDuration (New-TimeSpan -Days 3650)
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -MultipleInstances IgnoreNew
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Force | Out-Null
Get-ScheduledTask -TaskName $TaskName | Select-Object TaskName, State | Format-List
Get-ScheduledTaskInfo -TaskName $TaskName | Select-Object LastRunTime, NextRunTime | Format-List
Write-Host "Registered $TaskName -> $script (every 5 minutes)"
