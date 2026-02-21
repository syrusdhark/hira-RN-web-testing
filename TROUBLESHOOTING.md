# Troubleshooting Guide - Hira AI

## Android Build Issues

### Issue: react-native-worklets Build Error

**Error Message:**
```
ninja: error: 'C:/Users/.../react-native-worklets/android/build/intermediates/cmake/debug/obj/arm64-v8a/libworklets.so', 
needed by 'libreanimated.so', missing and no known rule to make it
```

**Root Cause:**
- `react-native-reanimated` v4.1.1 requires `react-native-worklets` as a peer dependency
- The worklets library is not being built correctly due to CMake path issues
- This is a known issue with React Native 0.81.5 and Reanimated 4.x

**Solution Options:**

#### Option 1: Add react-native-worklets explicitly (Recommended)

1. Install the worklets package:
```bash
cd apps/mobile
npm install react-native-worklets@latest
```

2. Clean and rebuild:
```bash
cd android
.\gradlew.bat clean
cd ..
npm run android
```

#### Option 2: Downgrade react-native-reanimated

If Option 1 doesn't work, downgrade to a more stable version:

1. Edit `apps/mobile/package.json`:
```json
{
  "dependencies": {
    "react-native-reanimated": "~3.15.0"
  }
}
```

2. Reinstall:
```bash
npm install
cd android
.\gradlew.bat clean
cd ..
npm run android
```

#### Option 3: Clean Everything and Rebuild

If you're still having issues:

1. **Close Android Studio** (if open)
2. **Stop Metro bundler** (Ctrl+C in terminal)
3. **Clean all build artifacts:**

```bash
# In apps/mobile directory
cd android
.\gradlew.bat clean
cd ..

# Remove build folders
Remove-Item -Recurse -Force android\.cxx -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force android\build -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force android\app\build -ErrorAction SilentlyContinue

# Clear Metro cache
npx expo start --clear

# In a new terminal, run Android
npm run android
```

### Issue: Path Too Long / packageDebug FAILED (Windows)

**Symptoms:**
- CMake warns: "The object file directory ... has 189+ characters. The maximum full path to an object file is 250 characters"
- Build fails at `:app:packageDebug` with "IncrementalSplitterRunnable" or similar

**Cause:** On Windows, the combined path to `android/app/.cxx/...` and native module paths (e.g. `node_modules\@react-native-community\datetimepicker\...`) can exceed 250 characters, so the Android native build or packaging step fails.

**Solution (recommended):** Move the project to a **shorter path**. This only changes where the folder lives on disk; it does **not** affect the web app. The web app uses the same source code and the same commands (`npm run web`, `npm run build:web`) from the new location.

- **Current (example):** `C:\Users\saisa\Desktop\hira-ai-app-capacitor\apps\mobile`  
- **Better:** `C:\hira\apps\mobile` or `C:\dev\hira\apps\mobile`

1. Close all terminals and editors using the project.
2. Move the entire repo (e.g. `hira-ai-app-capacitor`) to the shorter path (e.g. `C:\hira` so the app is at `C:\hira\apps\mobile`).
3. Reopen the project from the new location.
4. In `apps/mobile`, run `npm install` (and `npm run android` when ready).

**Optional – enable long paths (Windows 10/11):**  
Enabling long path support can help in some cases (e.g. packaging), but CMake/NDK may still enforce ~250 characters for object paths. To enable:

- **Via PowerShell (Admin):**  
  `New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force`  
  Then restart the terminal (and optionally the PC).

### Issue: Gradle Daemon Issues

**Error Message:**
```
Gradle build daemon disappeared unexpectedly
```

**Solution:**
```bash
cd android
.\gradlew.bat --stop
.\gradlew.bat clean
cd ..
npm run android
```

### Issue: ANDROID_HOME Not Set

**Error Message:**
```
Android SDK location not found
```

**Solution:**

1. **Set environment variable (PowerShell - Admin):**
```powershell
[System.Environment]::SetEnvironmentVariable('ANDROID_HOME', 'C:\Users\<YourUsername>\AppData\Local\Android\Sdk', 'User')
```

2. **Restart your terminal/IDE**

3. **Verify:**
```bash
echo $env:ANDROID_HOME
```

### Issue: Metro Bundler Port Already in Use

**Error Message:**
```
Error: listen EADDRINUSE: address already in use :::8081
```

**Solution:**

**Windows:**
```powershell
# Find process using port 8081
netstat -ano | findstr :8081

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

**Then restart:**
```bash
npm start
```

### Issue: New Architecture Compatibility

**Error Message:**
```
react-native-reanimated requires New Architecture to be enabled
```

**Solution:**
The project already has New Architecture enabled in `android/gradle.properties`:
```properties
newArchEnabled=true
```

If you see this error, verify the setting is present and set to `true`.

## General Tips

### Before Running Any Build:

1. **Ensure Android emulator is running** or device is connected
2. **Check device connection:**
   ```bash
   adb devices
   ```
3. **Ensure you're in the correct directory:**
   ```bash
   cd apps/mobile
   ```

### Clean Build Checklist:

When things go wrong, follow this checklist:

- [ ] Stop Metro bundler (Ctrl+C)
- [ ] Close Android Studio
- [ ] Run `cd android && .\gradlew.bat clean && cd ..`
- [ ] Delete `android\.cxx`, `android\build`, `android\app\build`
- [ ] Run `npx expo start --clear`
- [ ] In new terminal: `npm run android`

### Still Having Issues?

1. **Check the error logs carefully** - they usually point to the exact issue
2. **Google the specific error message** - many React Native issues have known solutions
3. **Check package versions** - ensure they're compatible with each other
4. **Try on a physical device** instead of emulator (or vice versa)
5. **Check disk space** - builds require significant space

## Common Package Compatibility Issues

### React Native 0.81.5 Compatible Versions:

- `react-native-reanimated`: `~3.15.0` (stable) or `~4.1.1` (with worklets)
- `react-native-gesture-handler`: `~2.28.0` ✓
- `expo`: `~54.0.33` ✓
- `react`: `19.1.0` ✓

If you encounter version conflicts, check the [React Native compatibility guide](https://reactnative.dev/docs/upgrading).
