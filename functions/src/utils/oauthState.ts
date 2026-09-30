import { randomBytes } from "crypto";
import { authAdmin, db, Timestamp } from "../config/firebase";

/**
 * OAuth state for the calendar connect flows.
 *
 * The uid must never travel in the state parameter on its own: that lets anyone
 * craft a callback URL binding their own Google or Outlook account to somebody
 * else's tenant, and lets a lured victim bind their calendar to the attacker's
 * tenant. Instead the connect endpoint authenticates the caller with a Firebase
 * ID token, stores the resulting uid server-side under an unguessable id, and
 * sends only that id as state. The callback consumes it once.
 */

const STATE_TTL_MS = 10 * 60 * 1000;
const COLLECTION = "oauth_states";

export type CalendarProvider = "google" | "outlook";

/** Verify the Firebase ID token supplied by the browser and return its uid. */
export async function uidFromIdToken(idToken: string): Promise<string> {
  const decoded = await authAdmin.verifyIdToken(idToken);
  return decoded.uid;
}

/** Create a single-use state value bound to this uid and provider. */
export async function createOAuthState(
  uid: string,
  provider: CalendarProvider
): Promise<string> {
  const state = randomBytes(32).toString("hex");
  await db.doc(`${COLLECTION}/${state}`).set({
    uid,
    provider,
    createdAt: Timestamp.now(),
    expiresAt: Timestamp.fromMillis(Date.now() + STATE_TTL_MS),
  });
  return state;
}

/**
 * Consume a state value: returns the uid it was issued for, or null when the
 * state is unknown, expired, already used, or issued for another provider.
 */
export async function consumeOAuthState(
  state: string,
  provider: CalendarProvider
): Promise<string | null> {
  if (!state || typeof state !== "string" || !/^[a-f0-9]{64}$/.test(state)) {
    return null;
  }

  const ref = db.doc(`${COLLECTION}/${state}`);
  const snap = await ref.get();
  if (!snap.exists) return null;

  const data = snap.data()!;
  await ref.delete(); // single use, valid or not

  if (data.provider !== provider) return null;
  const expiresAt = data.expiresAt as FirebaseFirestore.Timestamp | undefined;
  if (!expiresAt || expiresAt.toMillis() < Date.now()) return null;

  return (data.uid as string) || null;
}
