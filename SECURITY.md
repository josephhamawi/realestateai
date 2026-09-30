# Security

## Reporting a vulnerability

Report privately through GitHub's
[security advisories](https://github.com/josephhamawi/realestateai/security/advisories/new)
rather than opening a public issue. Please include what you did, what happened,
and what you expected.

## What this software does and does not protect

Each deployment is independent. There is no shared backend, no telemetry, and no
connection between instances, so a vulnerability report affects the code rather
than a service someone else is running.

The code enforces:

- **Tenant isolation.** `firestore.rules` restricts every collection to the
  account that owns it. Callable Cloud Functions repeat the same check server
  side (`functions/src/utils/auth.ts`), because callable endpoints are public.
- **Instance ownership.** API keys live in `platform_config` and are readable
  only by the uids listed in `platform_config/admins`. That document is created
  once, by the first signed-in account to claim the instance.
- **Webhook authenticity.** The Meta WhatsApp path verifies the HMAC signature;
  360dialog and Baileys require a shared token on the URL; Telegram requires the
  secret token it echoes on every delivery. Each of these fails closed when the
  corresponding secret is not configured.
- **OAuth binding.** Calendar connect flows authenticate the caller with a
  Firebase ID token and pass a single-use, server-stored state value, so a
  callback cannot attach one person's calendar to another person's tenant.

The code does not protect against:

- A misconfigured deployment. If you do not deploy `firestore.rules`, or you
  leave the instance unclaimed on a public URL, the guarantees above do not
  hold.
- Whatever the AI and messaging providers do with the traffic you send them.
  Their terms govern that, not this repository.
- A compromised provider key. Keys are stored in your Firestore and sent only to
  the provider they belong to, but anyone with instance-owner access can read
  them.

## Deployment checklist

1. Deploy `firestore.rules` before opening the app to anyone.
2. Claim the instance at `/setup` immediately after the first deploy.
3. Set a WhatsApp verify token if you use 360dialog or Baileys, and append it to
   the webhook URL as `?token=<value>`.
4. Run `registerTelegramWebhook` once after saving the bot token, so the webhook
   secret is provisioned.
5. Keep `.env.local`, `functions/.env.local`, and `.firebaserc` out of version
   control. They are gitignored; leave them that way.
6. Set a budget alert on the Firebase project and on each AI provider account.
