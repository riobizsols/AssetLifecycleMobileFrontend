# Build & Share Android APK — Asset Lifecycle Mobile

React Native app (`AssetLifecycleMobileFrontend`). Release builds call the **tenant** API at `https://rioassetmanagement.net` (configured in `config/api.js`).

---

## Prerequisites

| Requirement | Notes |
|-------------|--------|
| **Node.js** | v18+ (`node -v`) |
| **npm** | Comes with Node |
| **JDK** | 17 recommended (Android Gradle Plugin) |
| **Android SDK** | Via [Android Studio](https://developer.android.com/studio) |
| **ANDROID_HOME** | SDK path set in shell profile |

**macOS — typical env (add to `~/.zshrc` if missing):**

```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

Verify:

```bash
java -version
echo $ANDROID_HOME
```

---

## One-time setup

```bash
cd AssetLifecycleMobileFrontend

npm install
```

Ensure `android/app/google-services.json` exists (Firebase / push notifications).

---

## Before each release build

1. **API URL** — Release APK uses production tenant API (not dev):

   ```text
   config/api.js → TENANT_PROD_BASE_URL = 'https://rioassetmanagement.net'
   ```

   Release builds set `__DEV__ = false`, so this URL is baked into the APK.

2. **Version** (optional) — Bump in `android/app/build.gradle`:

   ```gradle
   versionCode 2        // integer, must increase for Play Store
   versionName "1.0.1"  // user-visible version
   ```

3. **Pull latest code** and confirm backend tenant deploy is live.

---

## Build release APK

From the project root:

```bash
cd AssetLifecycleMobileFrontend

# Clean (recommended after dependency or native changes)
cd android && ./gradlew clean && cd ..

# Build release APK
npm run build:android
```

Equivalent manual command:

```bash
cd android
./gradlew assembleRelease
cd ..
```

**Build time:** first build can take 5–15 minutes.

---

## APK output location

After a successful build:

```text
android/app/build/outputs/apk/release/app-release.apk
```

### Phone shows “BIN” or “problem parsing the package”

**“BIN” under the filename** usually means the file **lost the `.apk` extension** during share (WhatsApp, email, etc.). Android then treats it as a generic binary file.

**Fix:**
- Rename on the phone to end with **`.apk`** (e.g. `AssetLifecycle.apk`), then tap to install.
- Or share via **Google Drive** / **USB** and keep the `.apk` name.
- Or install from a computer: `adb install -r AssetLifecycle-tenant-prod.apk`

**“Problem parsing the package”** common causes:

| Cause | Fix |
|-------|-----|
| Wrong extension (`.bin`, no extension) | Rename to `.apk` |
| Corrupted / incomplete download | Re-download; prefer Drive or USB over chat apps |
| **32-bit-only phone** | Build must include `armeabi-v7a` (see `android/gradle.properties`) |
| Android version below 7.0 | App requires API 24+ (`minSdkVersion 24`) |

Verify architectures inside the APK:

```bash
unzip -l android/app/build/outputs/apk/release/app-release.apk | grep 'lib/' | cut -d/ -f2 | sort -u
# Should include arm64-v8a and (for wide support) armeabi-v7a
```

### Is it “bin” or APK?

**It is a real APK.** Android APK files are **binary ZIP archives** — opening them in a text editor shows unreadable bytes. That is normal.

Verify on Mac:

```bash
file android/app/build/outputs/apk/release/app-release.apk
# Expected: Zip archive data ... app-release.apk
```

Do **not** rename to `.bin`. Keep the `.apk` extension so Android can install it.

Copy to a friendly name (optional):

```bash
cp android/app/build/outputs/apk/release/app-release.apk \
   ~/Desktop/AssetLifecycle-tenant-prod.apk
```

---

## Share the APK

### Option A — USB / file transfer

Copy `app-release.apk` to the phone (USB, AirDrop, email, Drive, WhatsApp, etc.).

On the phone:

1. Open the APK file.
2. Allow **Install from unknown sources** if prompted.
3. Install and open the app.

### Option B — `adb` install (device connected)

```bash
adb devices
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

`-r` replaces an existing install.

### Option C — Share link

Upload the APK to Google Drive / Dropbox / internal server and share the download link.

---

## Quick copy-paste (full build)

```bash
cd AssetLifecycleMobileFrontend
npm install
cd android && ./gradlew clean && cd ..
npm run build:android
ls -lh android/app/build/outputs/apk/release/app-release.apk
cp android/app/build/outputs/apk/release/app-release.apk ~/Desktop/AssetLifecycle.apk
```

---

## Signing note

Current `android/app/build.gradle` signs **release** with the **debug keystore** (fine for internal / UAT sharing).

For **Google Play Store**, create a release keystore and configure `signingConfigs.release` — see [React Native signed APK](https://reactnative.dev/docs/signed-apk-android).

---

## Troubleshooting

### `ANDROID_HOME` not set

```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

### Gradle out of memory

Already tuned in `android/gradle.properties`. If builds fail, close emulator and retry, or run:

```bash
cd android && ./gradlew assembleRelease --no-daemon
```

### `SDK location not found`

Create `android/local.properties`:

```properties
sdk.dir=/Users/YOUR_USER/Library/Android/sdk
```

(Use your actual SDK path.)

### Build succeeds but app cannot login

- Confirm tenant backend is up: `https://rioassetmanagement.net/api/`
- User must use tenant login (email registry or subdomain URL).
- Rebuild APK after any `config/api.js` change.

### Clean rebuild

```bash
cd android
./gradlew clean
./gradlew assembleRelease
```

---

## Debug vs release

| Build | Command | API |
|-------|---------|-----|
| **Debug** (dev) | `npm run android` | Local / emulator (`10.0.2.2:5001`) |
| **Release** (APK) | `npm run build:android` | `https://rioassetmanagement.net` |

---

## Related docs

| File | Purpose |
|------|---------|
| `build.md` | This file — APK build & share |
| `config/api.js` | Production API base URL |
| `../deploy-tenant.md` | Tenant backend deploy on server |
