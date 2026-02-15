# iOS HealthKit native module

After generating the iOS project with `npx expo prebuild --platform ios`:

1. **Open the workspace**  
   Open `ios/*.xcworkspace` in Xcode.

2. **Enable HealthKit**  
   Select the app target → Signing & Capabilities → + Capability → HealthKit.

3. **Info.plist**  
   Add the following keys (e.g. under `ios/<YourAppName>/Info.plist` or via Xcode’s Info tab):

   - `NSHealthShareUsageDescription`: e.g. "We use your health data to provide personalized recovery insights and track your daily activity."
   - `NSHealthUpdateUsageDescription`: e.g. "We do not write any health data."

4. **Add the native module files**  
   - Add the `HealthModule` group to your app target (e.g. right‑click the app target’s folder in the Project Navigator → Add Files to "<YourTarget>").
   - Select both `HealthModule.m` and `HealthModule.swift` from this `native-ios` folder.
   - Ensure "Copy items if needed" is unchecked if you prefer to reference the folder, or copy them into `ios/<YourAppName>/` and add those copies.
   - In Build Phases → Compile Sources, ensure both `HealthModule.m` and `HealthModule.swift` are listed.

5. **Bridging**  
   If the project has no Swift code yet, Xcode may prompt to create a Bridging Header; you can accept. The React Native bridge uses `RCT_EXTERN_MODULE`, so no bridging header is required for HealthModule.

6. **Build**  
   Build and run on a device (HealthKit is not available in the simulator).
