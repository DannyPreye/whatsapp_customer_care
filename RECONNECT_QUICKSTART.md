# Quick Start: Reconnecting Disconnected Organizations

## Problem Fixed ✅
Organizations that were disconnected could not reconnect via Baileys - attempting to generate a QR code would fail with **"QR code not available"** error.

## Solution
The issue has been fixed with the following changes:

1. **Auth sessions are now properly cleaned** when disconnecting
2. **Disconnected clients are automatically removed** before reconnecting
3. **New dedicated reconnect endpoint** added for clarity

## How to Reconnect a Disconnected Organization

### Option 1: Use the Reconnect Endpoint (Recommended)
```bash
POST /api/v1/organizations/{organizationId}/whatsapp/reconnect
```

### Option 2: Use the Init Endpoint
```bash
POST /api/v1/organizations/{organizationId}/whatsapp/init-baileys
```

Both now work for reconnection!

## API Example

```bash
# Step 1: Reconnect
curl -X POST http://localhost:3000/api/v1/organizations/your-org-id/whatsapp/reconnect \
  -H "Authorization: Bearer YOUR_TOKEN"

# Response includes QR code:
{
  "success": true,
  "message": "Reconnection successful. Scan the QR code to reconnect.",
  "qrCode": "data:image/png;base64,..."
}

# If QR not ready yet (202 response):
{
  "message": "Reconnection initialized. QR code will be available shortly.",
  "retryIn": 3000
}

# Step 2 (if needed): Get QR code
curl http://localhost:3000/api/v1/organizations/your-org-id/whatsapp/qrcode \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## What Was Changed

### 1. [baileysManager.service.ts](src/services/baileysManager.service.ts)
- `disconnectClient()` now deletes auth session folder
- Added `removeClient()` for cleanup without logout

### 2. [organizations.service.ts](src/services/organizations.service.ts)
- `connectWhatsApp()` now allows reconnection of disconnected clients
- Improved error messages in `getQRCode()`

### 3. [organizations.controller.ts](src/controllers/organizations.controller.ts)
- Added `reconnectBaileys()` endpoint
- Enhanced status checking with `canReconnect` flag

### 4. [organizations.ts routes](src/routes/organizations.ts)
- Added `POST /:id/whatsapp/reconnect` route

## Testing

```bash
# 1. Disconnect
curl -X DELETE http://localhost:3000/api/v1/organizations/:id/whatsapp/disconnect

# 2. Check status (should show disconnected)
curl http://localhost:3000/api/v1/organizations/:id/whatsapp/status

# 3. Reconnect (should work now!)
curl -X POST http://localhost:3000/api/v1/organizations/:id/whatsapp/reconnect

# 4. Scan the QR code and you're back online! 🎉
```

## See Full Details
Check [BAILEYS_RECONNECTION_FIX.md](BAILEYS_RECONNECTION_FIX.md) for complete technical documentation.
