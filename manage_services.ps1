# =========================================================
# SCRIPT UTAMA: TOGGLE START/STOP SERVICES WEB-STORE (AMAN & TERSEMBUNYI)
# =========================================================

# --- KONFIGURASI PATH ---
$ProjectDir  = "C:\web-store\web-store-backup"
$FrontendDir = "$ProjectDir\frontend"
$BackendDir  = "$ProjectDir\backend"
$XamppDir    = "C:\xampp"

# --- DETEKSI PROSES KHUSUS WEB-STORE ---
# Hanya mencari proses yang command line-nya mengandung path web-store
$nodeWebStore = Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" | Where-Object { $_.CommandLine -like "*$ProjectDir*" }

$isWebStoreRunning = $nodeWebStore

if ($isWebStoreRunning) {
    Write-Host "Mematikan service Web Store..." -ForegroundColor Yellow
    
    if ($nodeWebStore) {
        foreach ($proc in $nodeWebStore) { Stop-Process -Id $proc.ProcessId -Force -ErrorAction SilentlyContinue }
    }
    
    Write-Host "INFO: Apache & MySQL dibiarkan TETAP MENYALA agar aplikasi lain (seperti absenin/serendipity) tidak terganggu." -ForegroundColor Cyan
    Write-Host "Service Web Store berhasil dimatikan." -ForegroundColor Green
} else {
    Write-Host "Menjalankan service Web Store di latar belakang (Hidden)..." -ForegroundColor Cyan
    
    # 1. Start Apache (Hanya jika belum jalan)
    if (-not (Get-Process -Name "httpd" -ErrorAction SilentlyContinue)) {
        if (Test-Path "$XamppDir\apache_start.bat") {
            Start-Process -FilePath "$XamppDir\apache_start.bat" -WindowStyle Hidden
        }
    }
    
    # 2. Start MySQL (Hanya jika belum jalan)
    if (-not (Get-Process -Name "mysqld" -ErrorAction SilentlyContinue)) {
        if (Test-Path "$XamppDir\mysql_start.bat") {
            Start-Process -FilePath "$XamppDir\mysql_start.bat" -WindowStyle Hidden
        }
        Start-Sleep -Seconds 5
    }

    # 3. Start Backend (Tanpa cmd.exe, langsung node agar tersembunyi total)
    if (Test-Path $BackendDir) {
        Start-Process -FilePath "cmd.exe" -ArgumentList "/c node `"$BackendDir\server.js`" > `"$BackendDir\backend_log.txt`" 2>&1" -WorkingDirectory $BackendDir -WindowStyle Hidden
    }

    # 4. Start Frontend (Menggunakan shell /c agar tersembunyi tanpa jeda popup)
    if (Test-Path $FrontendDir) {
        # 'npm start' on windows actually spawns a bunch of child node processes.
        # using cmd /c will hide the cmd window, but we need to ensure the spawned processes don't pop up.
        # WindowStyle hidden handles this cleanly.
        Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm start" -WorkingDirectory $FrontendDir -WindowStyle Hidden
    }

    Write-Host "Semua service Web Store telah dieksekusi di latar belakang!" -ForegroundColor Green
}

Start-Sleep -Seconds 3
