import { initializeApp, FirebaseOptions } from 'firebase/app';
import { getDatabase, ref, set, onValue, push } from 'firebase/database';

// TODO: Replace with your Firebase project credentials or set via environment variables
const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'YOUR_API_KEY',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'YOUR_PROJECT.firebaseapp.com',
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || 'https://YOUR_PROJECT.firebaseio.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'YOUR_PROJECT_ID',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'YOUR_PROJECT.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || 'SENDER_ID',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'APP_ID'
};

export const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

export function sendLocation(userId: string, lat: number, lng: number, timestamp = Date.now()) {
  const locationRef = ref(db, `locations/${userId}`);
  return set(locationRef, { lat, lng, timestamp });
}

export function listenToLocation(userId: string, cb: (data: {lat:number,lng:number,timestamp:number}|null) => void) {
  const locationRef = ref(db, `locations/${userId}`);
  return onValue(locationRef, snapshot => {
    const val = snapshot.val();
    if (!val) return cb(null);
    cb({ lat: val.lat, lng: val.lng, timestamp: val.timestamp });
  });
}

export function requestHelp(userId: string, data: { message?: string }) {
  const requestsRef = ref(db, `help_requests/${userId}`);
  return push(requestsRef, { ...data, timestamp: Date.now() });
}
