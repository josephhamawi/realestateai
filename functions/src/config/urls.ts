/**
 * Deployment URLs.
 *
 * Nothing here is hardcoded to a specific project: values come from the
 * environment, falling back to what the Firebase runtime reports about the
 * project this code is deployed in.
 *
 * Override with env vars when you serve the app from a custom domain:
 *   APP_BASE_URL=https://app.example.com
 *   FUNCTIONS_BASE_URL=https://api.example.com
 *   FUNCTIONS_REGION=europe-west1
 *   APP_FROM_EMAIL=noreply@example.com
 */

function projectId(): string {
  return (
    process.env.GCLOUD_PROJECT ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.FIREBASE_PROJECT_ID ||
    "unknown-project"
  );
}

export function functionsRegion(): string {
  return process.env.FUNCTIONS_REGION || "us-central1";
}

/** Base URL that serves the Cloud Functions of this deployment. */
export function functionsBaseUrl(): string {
  return (
    process.env.FUNCTIONS_BASE_URL ||
    `https://${functionsRegion()}-${projectId()}.cloudfunctions.net`
  );
}

/** Base URL that serves the web app of this deployment. */
export function appBaseUrl(): string {
  return process.env.APP_BASE_URL || `https://${projectId()}.web.app`;
}

export function functionUrl(name: string): string {
  return `${functionsBaseUrl()}/${name}`;
}

export function appUrl(path: string): string {
  return `${appBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

/** From address used in calendar invites. */
export function fromEmail(): string {
  return process.env.APP_FROM_EMAIL || `noreply@${projectId()}.web.app`;
}
