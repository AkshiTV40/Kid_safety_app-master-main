# Firebase Cloud Function - Send FCM on Help Request

This is a minimal example showing how to send FCM when a help request is written to Realtime Database.

index.js (Cloud Functions)

```js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.notifyGuardiansOnHelpRequest = functions.database.ref('/help_requests/{childId}/{pushId}').onCreate(async (snap, ctx) => {
  const help = snap.val();
  const childId = ctx.params.childId;

  // Load relevant guardians or tokens
  const tokensSnapshot = await admin.database().ref(`/fcm_tokens/guardians`).once('value'); // adapt to your structure
  const tokens = [];
  tokensSnapshot.forEach(ts => { tokens.push(ts.key); });

  const message = {
    notification: {
      title: 'Help requested',
      body: help.message || 'A guardian requested help',
    }
  };

  if(tokens.length) {
    const resp = await admin.messaging().sendToDevice(tokens, message);
    console.log('FCM result', resp);
  }
});
```

Notes:
- Adapt token discovery to your data model (e.g., store tokens under `fcm_tokens/{guardianId}/{token}`).
- Secure functions with proper auth checks and rate limiting.
