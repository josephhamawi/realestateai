# RealEstateAI WhatsApp Gateway (Baileys)

A standalone, always-on Node service that bridges WhatsApp to RealEstateAI using
[Baileys](https://github.com/WhiskeySockets/Baileys). Baileys talks to WhatsApp
over the multi-device web protocol, which needs a persistent Node process.
Firebase Functions cannot host that, so this gateway runs on a small always-on
VM. The Oracle Cloud Always Free tier is a good fit.

The gateway:

1. Pairs with a phone by QR code (one time).
2. Forwards inbound text messages to the app's Cloud Function in Meta webhook
   format.
3. Accepts outbound sends from the app in the same Meta format used by the meta
   and 360dialog providers.

## Limitations (v1)

- Text only. Inbound media is ignored and outbound templates are sent as plain
  text (their intended body text, or a generic fallback).
- Unofficial. This uses an unofficial WhatsApp client. It can violate WhatsApp's
  Terms of Service and carries a real risk of the number being banned. Use a
  number you are comfortable risking.
- The VM must stay on. If the process or VM stops, messages are not delivered or
  received until it is back and reconnected.

## Deploy on an Oracle Cloud Always Free VM (Ubuntu)

### 1. Create the VM

1. In the Oracle Cloud console, create a Compute instance.
2. Choose an Always Free eligible shape (for example VM.Standard.E2.1.Micro or an
   Ampere A1 shape within the free allowance).
3. Pick the Ubuntu 22.04 image and download the SSH key pair.
4. Note the VM's public IP address.

### 2. Open the port

The gateway listens on a port (default 8080). Open it in two places:

1. VCN security list: in Networking, open your VCN, open the subnet's security
   list, and add an Ingress rule allowing TCP on your port (for example 8080)
   from 0.0.0.0/0 (or restrict to your IP range).
2. Ubuntu firewall on the VM:

   ```bash
   sudo ufw allow 8080/tcp
   sudo ufw reload
   ```

### 3. Install Node 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version
```

### 4. Copy the gateway to the VM

Copy this `whatsapp-gateway` folder to `/opt/whatsapp-gateway` on the VM (for
example with `scp` or `git clone` then move it):

```bash
sudo mkdir -p /opt/whatsapp-gateway
sudo chown ubuntu:ubuntu /opt/whatsapp-gateway
# copy the folder contents into /opt/whatsapp-gateway, then:
cd /opt/whatsapp-gateway
npm install
```

### 5. Create the .env file

```bash
cp .env.example .env
nano .env
```

Set:

- `PORT`: the port you opened (for example 8080).
- `GATEWAY_SECRET`: a long random string. This must match the app's Gateway
  Secret.
- `WEBHOOK_URL`: your Cloud Function URL, for example
  `https://us-central1-<project>.cloudfunctions.net/whatsappWebhook`.
- `VERIFY_TOKEN`: must match the app's WhatsApp Verify Token.
- `PHONE_NUMBER_ID`: a synthetic id this gateway reports, for example
  `baileys-dubai-1`. Used by the app to map the tenant (see phone mappings
  below).
- `AUTH_DIR`: leave as `./auth`. The session persists here.

### 6. Install the systemd service

```bash
sudo cp /opt/whatsapp-gateway/whatsapp-gateway.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now whatsapp-gateway
sudo systemctl status whatsapp-gateway
```

View logs with:

```bash
journalctl -u whatsapp-gateway -f
```

### 7. Pair the phone

Open `http://<vm-ip>:<port>/qr` in a browser. On the phone that will send and
receive messages, open WhatsApp, go to Settings, Linked Devices, Link a Device,
and scan the QR. After pairing, `/health` returns `{ "status": "connected" }`
and `/qr` shows "Already paired". The session persists in `AUTH_DIR`, so you do
not need to scan again after restarts unless you log out.

## Configure the app side

In the RealEstateAI API Keys screen, WhatsApp tab:

1. Set Provider to `Baileys (self-hosted)`.
2. Set Baileys Gateway URL to `http://<vm-ip>:<port>` (no trailing slash).
3. Set Gateway Secret to the same value as `GATEWAY_SECRET` on the VM.
4. Set the WhatsApp Verify Token to the same value as `VERIFY_TOKEN`.

These are also overridable with environment variables on the Functions side:
`WHATSAPP_PROVIDER=baileys`, `BAILEYS_GATEWAY_URL`, `BAILEYS_GATEWAY_SECRET`,
`WHATSAPP_VERIFY_TOKEN`.

## Phone mapping (Firestore)

The app maps an inbound message to a tenant by the `phone_number_id` the gateway
reports. Create a Firestore document at `phone_mappings/<PHONE_NUMBER_ID>` (using
the exact value you set for `PHONE_NUMBER_ID`):

```json
{
  "tenantId": "your-tenant-id",
  "market": "dubai"
}
```

For example, if `PHONE_NUMBER_ID=baileys-dubai-1`, create
`phone_mappings/baileys-dubai-1`.

## Endpoints

- `GET /health`: returns `{ "status": "connected" | "connecting" }`.
- `GET /qr`: pairing page (QR image, "Already paired", or "Waiting for QR...").
- `POST /messages`: outbound send. Requires header
  `x-gateway-secret: <GATEWAY_SECRET>`. Accepts a Meta-format body
  `{ "messaging_product": "whatsapp", "to": "<number>", "type": "text", "text": { "body": "..." } }`
  and responds `{ "messages": [{ "id": "<id>" }] }`.
