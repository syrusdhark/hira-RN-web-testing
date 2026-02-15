# Run in a separate terminal. Launch the app, let it crash, then Ctrl+C and share the output.
$adb = $env:ANDROID_HOME
if (-not $adb) { $adb = "$env:LOCALAPPDATA\Android\Sdk" }
$adbExe = Join-Path $adb "platform-tools\adb.exe"
if (-not (Test-Path $adbExe)) {
    Write-Host "adb not found. Set ANDROID_HOME to your Android SDK path, or install platform-tools." -ForegroundColor Red
    Write-Host "Example: `$env:ANDROID_HOME = 'C:\Users\YourName\AppData\Local\Android\Sdk'" -ForegroundColor Yellow
    exit 1
}
Write-Host "Watching logcat. Open the app on the device, let it crash, then press Ctrl+C." -ForegroundColor Yellow
& $adbExe logcat -c
& $adbExe logcat *:E ReactNative:V ReactNativeJS:V AndroidRuntime:E
