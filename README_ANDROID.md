# Android Build & Setup (Capacitor)

This file documents how to build the Android app using Capacitor.

Prerequisites:
- Node.js 20+, npm
- Java JDK 17
- Android SDK / Android Studio

Quick steps:
1. Install dependencies: npm ci
2. Export web assets: npm run build:web
3. Initialize Capacitor (only once): npx @capacitor/cli create
4. Add Android platform: npx cap add android
5. Sync web assets: npm run cap:sync
6. Open Android Studio: npm run cap:open:android
7. Create a signing key and configure signing in Android Studio
8. Build a signed AAB (Build > Generate Signed Bundle / APK > Android App Bundle)

CI notes:
- The GitHub Actions workflow will try to run `./gradlew bundleRelease` but you must provide signing keys as secrets and configure `android/gradle.properties` to use them.
- For production builds, configure keystore signing and set the upload key and app signing on Play Console.

Firebase & FCM (Web + Native)
- To enable push notifications (FCM) you must create a Firebase project and add an Android app.
- Add `google-services.json` to `android/app/` (do NOT commit keys to the repo; store them securely).
- For Web FCM (used by the PWA / browser) set `NEXT_PUBLIC_FIREBASE_*` env vars and VAPID key, and host `firebase-messaging-sw.js` at `/firebase-messaging-sw.js`.
- For native Android FCM (recommended for reliability), add the plugin `@capacitor-firebase/messaging` or `capacitor-community/fcm` and follow plugin docs to integrate `google-services.json`.

Asset Links (for TWA / Verified Links)
- To support TWA / link verification you must host an `assetlinks.json` at `https://<your-domain>/.well-known/assetlinks.json` with your app package and SHA-256 fingerprint.
- A template is provided in `public/.well-known/assetlinks.json` — replace `YOUR_SHA256_FINGERPRINT` with the SHA-256 certificate fingerprint of your signing key.

Server-side push (recommended)
- When a help request is created, you should send an FCM push to guardian tokens stored in `fcm_tokens/{guardianId}`.
- Example (Firebase Cloud Function) pseudocode is in docs/firebase-cloud-function.md (create this and add your server key).
