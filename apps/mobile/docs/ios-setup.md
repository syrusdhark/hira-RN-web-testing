# iOS setup (Hira mobile)

## Why “LLVM” appears when installing CocoaPods

- **CocoaPods** is a Ruby gem. Building the iOS app needs `pod` in your PATH.
- On **macOS 12 (Monterey)** with **Intel**, Homebrew has **no prebuilt bottles** for `cocoapods` or its dependency **Ruby**. So `brew install cocoapods` triggers:
  - install **Ruby** (from source) → which pulls in **LLVM** and **Rust** for the build
  - then install CocoaPods
- That’s why you see a long **LLVM** compile: it’s coming from Homebrew’s **Ruby** build, not from CocoaPods itself. CocoaPods’ own formula only depends on `ruby`, `pkgconf`, and `libffi`.

## Ways to get CocoaPods without building LLVM

1. **System Ruby + user-install (no sudo)**  
   If your system Ruby is 2.6, you can use an older CocoaPods that supports it:
   ```bash
   gem install cocoapods -v 1.11.3 --no-document --user-install
   ```
   Then add the gem bin path to your shell (e.g. in `~/.zshrc`):
   ```bash
   export PATH="$HOME/.gem/ruby/2.6.0/bin:$PATH"
   ```
   Reload: `source ~/.zshrc`, then run `pod --version`.

2. **Ruby 3 + CocoaPods (recommended long-term)**  
   Install Ruby 3 without using Homebrew’s Ruby (so no LLVM):
   ```bash
   brew install ruby-install   # small formula, only needs xz
   ruby-install ruby-3.2.0     # builds Ruby with system clang (no LLVM)
   export PATH="$HOME/.rubies/ruby-3.2.0/bin:$PATH"   # or the path ruby-install printed
   gem install cocoapods --no-document
   ```
   Put the `PATH` line in `~/.zshrc` so it’s set in every terminal.

3. **Let Homebrew build everything**  
   `brew install cocoapods` will install Ruby + LLVM + Rust + CocoaPods. It works but the first run can take a long time (e.g. 30–60 minutes) because of the LLVM compile.

## Xcode (required for running on simulator/device)

- Building and running the app on **simulator or device** needs the **full Xcode app**, not only “Command Line Tools”.
- Check:
  ```bash
  xcode-select -p
  ls /Applications/Xcode.app
  ```
- If you only have Command Line Tools (`/Library/Developer/CommandLineTools`), install **Xcode** from the App Store and then:
  ```bash
  sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
  sudo xcodebuild -runFirstLaunch
  ```
- Accept the Xcode license if prompted.

## "certificate verify failed" when running `pod install`

If you see:
```text
Couldn't determine repo type for URL: `https://cdn.cocoapods.org/`: ... certificate verify failed (unable to get local issuer certificate)
```
then Ruby/CocoaPods isn’t using a CA bundle to verify HTTPS. The project fixes this by setting `SSL_CERT_FILE` before running `pod install`:

- **`npm run ios`** and **`npm run ios:pod`** both source **`scripts/ensure-ssl-cert.sh`**, which sets `SSL_CERT_FILE` to a known good path on macOS (e.g. `/private/etc/ssl/cert.pem` or Homebrew’s OpenSSL certs) when it’s not already set. Use these scripts and the error should go away.

- If you run **`pod install`** by hand inside `ios/`, either run it from the app root as **`npm run ios:pod`**, or set the cert yourself first:
  ```bash
  export SSL_CERT_FILE=/private/etc/ssl/cert.pem
  cd ios && pod install
  ```

## Run the app on iOS

From the **monorepo root** or from **apps/mobile**:

```bash
cd apps/mobile
npx expo run:ios
```

- First time: this will run `pod install` in `apps/mobile/ios` (if `pod` is in your PATH) and then build and open the simulator.
- To use a specific device/simulator: `npx expo run:ios --device` or pick from the list Expo prints.

## If `pod` is not found

- Ensure `pod` is in your PATH (see the PATH lines above for gem or Ruby 3).
- Or run `pod install` yourself, then start the app:
  ```bash
  cd apps/mobile/ios
  pod install
  cd ..
  npx expo run:ios
  ```

## Summary

| Step | What to do |
|------|------------|
| CocoaPods | Use gem (user-install or Ruby 3) or wait for `brew install cocoapods` to finish. |
| Xcode | Install full Xcode from App Store and select it with `xcode-select`. |
| Run | `cd apps/mobile && npx expo run:ios`. |
