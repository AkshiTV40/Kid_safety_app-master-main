TWA (Trusted Web Activity) — Local & CI build guide

Local build (recommended for first-time packaging):

1. Ensure site is live and accessible via HTTPS (e.g., https://your-project.vercel.app).
2. Install Bubblewrap CLI:
   - `npm i -g @bubblewrap/cli`
3. Run init:
   - `npx @bubblewrap/cli init --manifest-url https://your-project.vercel.app/manifest.json`
   - Follow the interactive prompts. Generate a keystore if you don't have one:
     - `keytool -genkey -v -keystore my-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias my-alias`
4. Build:
   - `npx @bubblewrap/cli build` (this generates an `.aab` file in `build/`)

CI build with GitHub Actions (template):

- Use the provided workflow `.github/workflows/build-twa.yml` to run the TWA build in CI.
- Required repository secrets:
  - `SITE_URL` (e.g., https://your-project.vercel.app)
  - `PACKAGE_ID` (e.g., com.example.guardianportal)
  - `APP_NAME`, `APP_SHORT_NAME`, `APP_VERSION_CODE`, `APP_VERSION_NAME`
  - `KEYSTORE_JKS` (base64-encoded keystore file)
  - `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD`
  - `GOOGLE_PLAY_SERVICE_ACCOUNT` (optional; base64 encoded) — used if you want to automatically publish to Play Store.

Notes:
- The workflow is a template and may need adjustments for your specific Play Console / keystore settings.
- I can run the TWA build for you in CI once you provide secrets and `SITE_URL`, or help you execute locally and verify the generated AAB.