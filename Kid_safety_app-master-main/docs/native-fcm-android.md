# Native FCM (Capacitor) - Android Integration Guide

This document explains the steps to add native Firebase Cloud Messaging (FCM) to the Android app using Capacitor.

1) Install the plugin

```bash
# from project root
npm install @capacitor-firebase/messaging
npx cap sync android
```

2) Add `google-services.json`
- In the Firebase console create an Android app with package `com.akshitv.kidsafety` (or your app id).
- Download `google-services.json` and place it at `android/app/google-services.json` (do NOT commit it to git).

3) Update `android/build.gradle` (project-level) and `android/app/build.gradle` (module-level)
- Apply Google Services plugin per plugin docs (usually `com.google.gms:google-services`), and add `classpath` to buildscript dependencies.
- Follow plugin docs for any additional Gradle changes.

4) Add the messaging service & permissions (if needed)
- The plugin will add required services, but ensure AndroidManifest includes necessary permissions and service entries as instructed by the plugin docs.

5) Run on device / emulator
- Open Android Studio: `npm run cap:open:android`
- Build and run on a device. For push testing use Firebase Console send or Cloud Function.

6) Notes about tokens
- The app stores native tokens in Realtime Database under `fcm_tokens/{userId}/{token}` (see `src/lib/native-fcm.ts`).
- When migrating to production, consider rotating/cleaning tokens for users who uninstall.

7) CI / signing notes
- Add `google-services.json` locally; CI expects keystore secrets to sign the AAB (see `android-signing.md`).

If you want, I can open a feature branch and add a short test integration that shows a sample notification flow (no production secrets committed).