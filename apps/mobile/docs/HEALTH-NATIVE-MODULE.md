# Health native module – "native_module_unavailable" fix

The **HealthModule** is custom native code. It is **not** included in **Expo Go**.

## You must use a development build

1. **Do not** open this project in the Expo Go app.
2. **Build and run** the app so the native Android code (including HealthModule) is compiled and installed:

   ```bash
   cd apps/mobile
   npx expo run:android
   ```

3. Use the **app that gets installed** by that command (same app icon; it’s your dev build with the native module).
4. If a device/emulator isn’t connected, connect one or start an emulator, then run the command again.

## If you already ran `expo run:android` and still see the error

1. **Clean and rebuild:**
   ```bash
   cd apps/mobile/android
   ./gradlew.bat clean
   cd ..
   npx expo run:android
   ```
2. **Uninstall the app** from the device/emulator, then run `npx expo run:android` again so a fresh build is installed.

## Summary

| Run with | HealthModule works? |
|----------|---------------------|
| Expo Go (scan QR / "Open in Expo Go") | No |
| `npx expo run:android` (dev build)      | Yes |
