import { getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, Timestamp, getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

if (!getApps().length) {
  initializeApp();
}

export const db = getFirestore();
export const authAdmin = getAuth();

// Re-exported from the modular entrypoints rather than the `admin.firestore`
// namespace: the Functions emulator proxies the legacy namespace and its static
// members (Timestamp, FieldValue) come back undefined there.
export { FieldValue, Timestamp };
