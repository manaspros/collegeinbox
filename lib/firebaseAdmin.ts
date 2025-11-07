import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";

let adminApp: App;
let adminDb: Firestore;

// Initialize Firebase Admin (server-side only)
export function getAdminApp() {
  if (!adminApp) {
    if (getApps().length === 0) {
      // Check for service account JSON in environment variable
      if (process.env.FIREBASE_ADMIN_SDK_JSON) {
        try {
          const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SDK_JSON);
          adminApp = initializeApp({
            credential: cert(serviceAccount),
          });
        } catch (error) {
          console.error("Failed to parse FIREBASE_ADMIN_SDK_JSON:", error);
          throw error;
        }
      } else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        // Alternative env var name
        try {
          const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
          adminApp = initializeApp({
            credential: cert(serviceAccount),
          });
        } catch (error) {
          console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:", error);
          throw error;
        }
      } else {
        // Development mode: Use application default credentials
        // This works if you've run: gcloud auth application-default login
        // OR if GOOGLE_APPLICATION_CREDENTIALS env var points to a service account key file
        throw new Error(
          "Firebase Admin credentials not configured. Please set one of:\n" +
          "1. FIREBASE_ADMIN_SDK_JSON environment variable with service account JSON\n" +
          "2. FIREBASE_SERVICE_ACCOUNT_KEY environment variable with service account JSON\n" +
          "3. Download service account key from Firebase Console > Project Settings > Service Accounts"
        );
      }
    } else {
      adminApp = getApps()[0];
    }
  }
  return adminApp;
}

export function getAdminDb() {
  if (!adminDb) {
    adminDb = getFirestore(getAdminApp());
  }
  return adminDb;
}
