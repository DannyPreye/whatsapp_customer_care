# Baileys Reconnection Fix

## Problem
When an organization's WhatsApp connection was disconnected, it was almost impossible to reconnect using the Baileys method. Attempting to generate a QR code for reconnection would fail with the error: **"QR code not available"**.

## Root Causes

### 1. **Auth Session Persistence** 🔐
When disconnecting, the authentication session files in `auth_sessions/{organizationId}/` were not being deleted. On reconnection attempts, Baileys would try to auto-login using these old credentials instead of generating a fresh QR code.

### 2. **Client State Validation** ❌
The `connectWhatsApp()` function checked if a client existed and threw an error without distinguishing between:
- A **connected** client (should block)
- A **disconnected** client (should allow reconnection)

### 3. **No Explicit Reconnect Flow** 🔄
There was no dedicated endpoint for reconnecting disconnected organizations, making it unclear how to properly handle reconnection scenarios.

## Solutions Implemented

### 1. **Clean Auth Session on Disconnect** ✅
Modified `disconnectClient()` in [baileysManager.service.ts](src/services/baileysManager.service.ts) to:
- Delete the entire `auth_sessions/{organizationId}/` folder
- Clear heartbeat intervals
- Properly cleanup socket connections

```typescript
// Delete auth session folder to force fresh QR code on reconnect
const sessionPath = path.join(process.cwd(), 'auth_sessions', organizationId);
if (fs.existsSync(sessionPath)) {
    fs.rmSync(sessionPath, { recursive: true, force: true });
    console.log(`[Baileys] Auth session deleted for org: ${organizationId}`);
}
```

### 2. **Smart Client State Checking** ✅
Updated `connectWhatsApp()` in [organizations.service.ts](src/services/organizations.service.ts) to:
- Check if client is **actually connected** (not just exists)
- Remove disconnected clients automatically before creating new ones

```typescript
const existingClient = baileysManager.getClient(organizationId);
if (existingClient) {
    // Only throw error if client is actually connected
    if (existingClient.isReady) {
        throw new Error('WhatsApp client already connected for this organization');
    }
    // If client exists but is not ready, remove it to allow fresh connection
    await baileysManager.removeClient(organizationId);
}
```

### 3. **New Reconnect Endpoint** ✅
Added dedicated `/api/v1/organizations/:id/whatsapp/reconnect` endpoint:
- Checks current connection status
- Cleans up disconnected clients
- Initializes fresh connection
- Returns new QR code

### 4. **Added removeClient() Method** ✅
New method in [baileysManager.service.ts](src/services/baileysManager.service.ts) for cleanup without logout:
```typescript
async removeClient(organizationId: string): Promise<void>
{
    const clientInfo = this.clients.get(organizationId);
    if (clientInfo?.heartbeatInterval) {
        clearInterval(clientInfo.heartbeatInterval);
    }
    this.clients.delete(organizationId);
}
```

### 5. **Improved Error Messages** ✅
More descriptive error messages in `getQRCode()`:
- "WhatsApp client not found for this organization. Please initialize connection first."
- "QR code not available. Please wait a few seconds and try again."

## API Usage

### Reconnecting a Disconnected Organization

**Endpoint:** `POST /api/v1/organizations/:id/whatsapp/reconnect`

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/v1/organizations/123/whatsapp/reconnect \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Reconnection successful. Scan the QR code to reconnect.",
  "qrCode": "data:image/png;base64,..."
}
```

**QR Code Pending (202):**
```json
{
  "message": "Reconnection initialized. QR code will be available shortly.",
  "retryIn": 3000
}
```

### Checking Connection Status

**Endpoint:** `GET /api/v1/organizations/:id/whatsapp/status`

**Response:**
```json
{
  "success": true,
  "authType": "baileys",
  "connectionStatus": "disconnected",
  "isConnected": false,
  "isDisconnected": true,
  "hasQRCode": false,
  "canReconnect": true
}
```

### Getting QR Code (After Init/Reconnect)

**Endpoint:** `GET /api/v1/organizations/:id/whatsapp/qrcode`

**Response:**
```json
{
  "success": true,
  "qrCode": "data:image/png;base64,...",
  "message": "Scan this QR code with WhatsApp to connect"
}
```

## Reconnection Flow

### Method 1: Using Reconnect Endpoint (Recommended)
```
1. POST /organizations/:id/whatsapp/reconnect
   ↓
2. Receive QR code in response (or 202 if not ready yet)
   ↓
3. If 202, wait 3 seconds and GET /organizations/:id/whatsapp/qrcode
   ↓
4. Display QR code to user
   ↓
5. User scans with WhatsApp
   ↓
6. Connection established
```

### Method 2: Using Init Endpoint
```
1. POST /organizations/:id/whatsapp/init-baileys
   ↓
   (Same flow as above)
```

Both methods now work for reconnection because they:
- Automatically detect and remove disconnected clients
- Generate fresh QR codes
- Clean up old session data

## Testing the Fix

### Test 1: Disconnect and Reconnect
```bash
# 1. Disconnect organization
curl -X DELETE http://localhost:3000/api/v1/organizations/:id/whatsapp/disconnect

# 2. Verify disconnected
curl http://localhost:3000/api/v1/organizations/:id/whatsapp/status

# 3. Reconnect
curl -X POST http://localhost:3000/api/v1/organizations/:id/whatsapp/reconnect

# 4. Should receive QR code successfully
```

### Test 2: Multiple Reconnect Attempts
```bash
# Try reconnecting multiple times - should work every time
curl -X POST http://localhost:3000/api/v1/organizations/:id/whatsapp/reconnect
# Wait and try again
curl -X POST http://localhost:3000/api/v1/organizations/:id/whatsapp/reconnect
```

### Test 3: Prevent Double Connection
```bash
# When already connected, should get error
curl -X POST http://localhost:3000/api/v1/organizations/:id/whatsapp/reconnect
# Response: "WhatsApp is already connected"
```

## What Changed

### Files Modified
1. [src/services/baileysManager.service.ts](src/services/baileysManager.service.ts)
   - Enhanced `disconnectClient()` to delete auth sessions
   - Added `removeClient()` method
   - Improved cleanup logic

2. [src/services/organizations.service.ts](src/services/organizations.service.ts)
   - Smart client state checking in `connectWhatsApp()`
   - Better error messages in `getQRCode()`

3. [src/controllers/organizations.controller.ts](src/controllers/organizations.controller.ts)
   - Added `reconnectBaileys()` controller
   - Improved `initBaileysConnection()` to handle disconnected state
   - Enhanced `checkWhatsAppStatus()` with more status info

4. [src/routes/organizations.ts](src/routes/organizations.ts)
   - Added `POST /:id/whatsapp/reconnect` route

## Benefits

✅ **Reliable Reconnection**: Organizations can now reconnect after being disconnected
✅ **Clean State**: Auth sessions are properly cleaned up
✅ **Better UX**: Clear error messages guide users
✅ **Dedicated Endpoint**: Explicit reconnect endpoint for clarity
✅ **Idempotent**: Reconnect can be called multiple times safely
✅ **Backward Compatible**: Existing init endpoint still works

## Notes

- The auth session folder is only deleted on **explicit disconnect**, not on connection failures
- If reconnection fails, check:
  1. Server logs for detailed error messages
  2. That the organization exists
  3. Network connectivity
  4. That Baileys dependencies are properly installed
