# =========================================================
# SCRIPT BACKUP DATABASE (MYSQL) WEB-STORE
# =========================================================

$BackupDir = "C:\web-store\web-store-backup\backup"
$MySqlDump = "C:\xampp\mysql\bin\mysqldump.exe"
$Database  = "web_store_db"
$User      = "root"
# Biarkan password kosong jika root tidak ada password
$Password  = ""

# Buat folder backup jika belum ada
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir | Out-Null
}

$DateStr = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = "$BackupDir\backup_web_store_db_$DateStr.sql"

# Eksekusi mysqldump
if ($Password -eq "") {
    & $MySqlDump -u $User $Database > $BackupFile
} else {
    & $MySqlDump -u $User -p"$Password" $Database > $BackupFile
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "Backup berhasil: $BackupFile" -ForegroundColor Green
} else {
    Write-Host "Backup gagal!" -ForegroundColor Red
}

# --- RETENSI FILE BACKUP (Menyimpan max 20 file terbaru) ---
$MaxBackups = 20
$Backups = Get-ChildItem -Path $BackupDir -Filter "backup_web_store_db_*.sql" | Sort-Object CreationTime -Descending

if ($Backups.Count -gt $MaxBackups) {
    $BackupsToDelete = $Backups | Select-Object -Skip $MaxBackups
    foreach ($File in $BackupsToDelete) {
        Remove-Item $File.FullName -Force
        Write-Host "Menghapus backup lama: $($File.Name)" -ForegroundColor Yellow
    }
}
