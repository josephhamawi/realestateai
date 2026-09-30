import * as functions from "firebase-functions";
import { db } from "../config/firebase";

type CallableContext = { auth?: { uid: string; token?: Record<string, unknown> } | null };

/**
 * Callable functions are invocable by anyone on the internet, so every one of
 * them has to check the caller itself. These helpers are that check.
 */

export function requireAuth(context: CallableContext): string {
  if (!context.auth?.uid) {
    throw new functions.https.HttpsError("unauthenticated", "Login required");
  }
  return context.auth.uid;
}

/**
 * A caller may act on a tenant only if they are that tenant, or a team member
 * carrying a matching tenantId claim. Mirrors isTenantMember() in
 * firestore.rules so the two layers cannot drift apart.
 */
export function requireTenantAccess(
  context: CallableContext,
  tenantId: string
): string {
  const uid = requireAuth(context);
  if (!tenantId || typeof tenantId !== "string") {
    throw new functions.https.HttpsError("invalid-argument", "tenantId required");
  }
  const claimTenantId = context.auth?.token?.tenantId;
  if (uid === tenantId || claimTenantId === tenantId) {
    return uid;
  }
  throw new functions.https.HttpsError(
    "permission-denied",
    "Not a member of this tenant"
  );
}

/**
 * Instance owners are the uids listed in platform_config/admins, the same
 * document the Setup screen writes when the instance is claimed.
 */
export async function requireInstanceAdmin(
  context: CallableContext
): Promise<string> {
  const uid = requireAuth(context);
  const snap = await db.doc("platform_config/admins").get();
  const uids = (snap.data()?.uids as string[] | undefined) || [];
  if (!uids.includes(uid)) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Instance owners only"
    );
  }
  return uid;
}
