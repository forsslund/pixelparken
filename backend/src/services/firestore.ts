import { Firestore } from '@google-cloud/firestore';

// Initialize Firestore
export const db = new Firestore({
  projectId: 'pixelparken',
  // When running locally, uses Application Default Credentials
  // When deployed to App Engine, automatically uses the service account
});

// Use Firestore emulator in development
if (process.env.NODE_ENV !== 'production') {
  const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8081';
  process.env.FIRESTORE_EMULATOR_HOST = emulatorHost;
  console.log(`🔥 Using Firestore Emulator at ${emulatorHost}`);
}

// Collection names
export const Collections = {
  USERS: 'users',
  PROGRESS: 'progress',
  GUESTBOOK: 'guestbook',
} as const;
