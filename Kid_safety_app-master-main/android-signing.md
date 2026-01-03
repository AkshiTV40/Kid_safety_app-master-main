# Android CI Signing & Keystore Setup

To build a signed AAB in CI you must provide the keystore and signing passwords as secrets in GitHub.

Required Secrets:
- KEYSTORE_BASE64: base64-encoded contents of your .jks/.keystore file
- KEYSTORE_PASSWORD
- KEY_ALIAS
- KEY_PASSWORD

CI will decode the keystore and write `android/app/upload-keystore.jks` then append signing properties to `android/gradle.properties` at build time (the workflow template handles this). Do NOT commit your keystore or secrets to the repo.

How to generate base64 (mac/linux):
  base64 -i upload-keystore.jks | pbcopy
For Windows (PowerShell):
  [Convert]::ToBase64String([IO.File]::ReadAllBytes("upload-keystore.jks")) | Set-Clipboard

After adding secrets, enable Android build in GitHub Actions and CI will produce a signed AAB if `android/` is present.
