# =========================================================
# SCRIPT SETUP TASK SCHEDULER: WEB-STORE AUTOSTART & BACKUP
# =========================================================

# Pastikan script dijalankan sebagai Administrator jika ingin menggunakan trigger AtStartup.
# Karena biasanya berjalan di User level, kita gunakan AtLogOn agar tidak perlu privilege tinggi.

$ActionStart = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-WindowStyle Hidden -ExecutionPolicy Bypass -File `"C:\web-store\web-store-backup\manage_services.ps1`""
$TriggerStart = New-ScheduledTaskTrigger -AtLogOn
Register-ScheduledTask -TaskName "WebStore_AutoStart" -Action $ActionStart -Trigger $TriggerStart -User $env:USERNAME -Force
Write-Host "Task 'WebStore_AutoStart' berhasil didaftarkan (Akan jalan saat PC hidup/Logon)." -ForegroundColor Green

$ActionBackup = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-WindowStyle Hidden -ExecutionPolicy Bypass -File `"C:\web-store\web-store-backup\backup_db.ps1`""

$Trigger12PM = New-ScheduledTaskTrigger -Daily -At 12:00PM
Register-ScheduledTask -TaskName "WebStore_Backup_12PM" -Action $ActionBackup -Trigger $Trigger12PM -User $env:USERNAME -Force
Write-Host "Task 'WebStore_Backup_12PM' berhasil didaftarkan." -ForegroundColor Green

$Trigger3PM = New-ScheduledTaskTrigger -Daily -At 3:00PM
Register-ScheduledTask -TaskName "WebStore_Backup_3PM" -Action $ActionBackup -Trigger $Trigger3PM -User $env:USERNAME -Force
Write-Host "Task 'WebStore_Backup_3PM' berhasil didaftarkan." -ForegroundColor Green

$Trigger7PM = New-ScheduledTaskTrigger -Daily -At 7:00PM
Register-ScheduledTask -TaskName "WebStore_Backup_7PM" -Action $ActionBackup -Trigger $Trigger7PM -User $env:USERNAME -Force
Write-Host "Task 'WebStore_Backup_7PM' berhasil didaftarkan." -ForegroundColor Green

Write-Host "Semua penjadwalan (Task Scheduler) berhasil dibuat!" -ForegroundColor Cyan
Start-Sleep -Seconds 3
