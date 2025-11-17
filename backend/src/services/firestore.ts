import { Firestore } from '@google-cloud/firestore';

// Initialize Firestore
export const db = new Firestore({
  projectId: 'pixelparken',
  // When running locally, uses Application Default Credentials
  // When deployed to App Engine, automatically uses the service account
});

// Collection names
export const Collections = {
  USERS: 'users',
  PROGRESS: 'progress',
  GUESTBOOK: 'guestbook',
} as const;
