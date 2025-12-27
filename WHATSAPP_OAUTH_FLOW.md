# WhatsApp OAuth Integration Flow (Option 2)

## Overview
This is a guided OAuth integration that happens AFTER organization creation. The flow is:

1. **User Registration** → Create Organization (basic info only)
2. **In Organization Dashboard** → User connects WhatsApp via OAuth flow
3. **OAuth Redirect** → User selects Business Account & Phone Number
4. **Auto-Configuration** → WhatsApp fields populated automatically

## Complete User Journey

```
┌─────────────────────────────────────────────────────────────┐
│ 1. USER REGISTRATION                                         │
│    - Create account with email/password                      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. ORGANIZATION CREATION                                     │
│    Fields provided: name, description, industry, ownerId     │
│                                                               │
│    ❌ NOT provided yet:                                      │
│    - whatsappPhoneId                                         │
│    - whatsappToken                                           │
│    - whatsappBusinessId                                      │
│    - website                                                 │
│    - settings                                                │
│    - agentSettings                                           │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. WHATSAPP OAUTH CONNECTION (This Guide)                   │
│    - Step 1: Init OAuth → Get Auth URL                      │
│    - Step 2: User authorizes at Meta → Get code             │
│    - Step 3: Fetch available Business Accounts              │
│    - Step 4: Fetch available Phone Numbers                  │
│    - Step 5: Save configuration                             │
│                                                               │
│    ✅ Auto-populated after:                                 │
│    - whatsappPhoneId                                         │
│    - whatsappToken                                           │
│    - whatsappBusinessId                                      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. LATER: UPDATE OTHER SETTINGS                             │
│    - Update website via PUT /organizations/:id               │
│    - Update agent settings via PUT /:id/agent-settings       │
│    - Update general settings via PUT /:id/settings           │
└─────────────────────────────────────────────────────────────┘
```

## API Endpoints

### 1. **Initiate OAuth Flow**
**Endpoint:** `GET /api/v1/organizations/:organizationId/whatsapp/init-oauth`

**What it does:** Generates an OAuth authorization URL

**Response:**
```json
{
  "authUrl": "https://www.facebook.com/v21.0/dialog/oauth?...",
  "message": "Redirect user to this URL to authorize WhatsApp access"
}
```

**Frontend:** Redirect user to the `authUrl` (opens WhatsApp/Facebook login)

---

### 2. **OAuth Callback Handler**
**Endpoint:** `GET /api/v1/organizations/whatsapp/callback`

**Query Parameters:**
- `code` - Authorization code from Meta
- `state` - State token for verification

**What it does:**
- Exchanges code for short-lived token
- Exchanges for long-lived token
- Stores token temporarily in state

**Response:**
```json
{
  "success": true,
  "state": "abc123...",
  "message": "Authorization successful. Please select your WhatsApp Business Account and phone number."
}
```

**Frontend:** Store the `state` value for next steps

---

### 3. **Get Available Business Accounts**
**Endpoint:** `GET /api/v1/organizations/whatsapp/accounts`

**Query Parameters:**
- `state` - State token from callback

**What it does:** Fetches all WhatsApp Business Accounts linked to the authenticated user

**Response:**
```json
{
  "wabaOptions": [
    {
      "id": "123456789",
      "name": "My Business",
      "timezone_id": "America/New_York"
    }
  ]
}
```

**Frontend:** Display dropdown/list for user to select account

---

### 4. **Get Available Phone Numbers**
**Endpoint:** `GET /api/v1/organizations/whatsapp/phone-numbers`

**Query Parameters:**
- `state` - State token from callback
- `wabaId` - Selected Business Account ID

**What it does:** Fetches all phone numbers linked to the selected WABA

**Response:**
```json
{
  "phoneOptions": [
    {
      "id": "108234567890",
      "displayPhoneNumber": "+1 (555) 123-4567",
      "verifiedName": "My Company",
      "qualityRating": "GREEN"
    }
  ]
}
```

**Frontend:** Display dropdown/list for user to select phone number

---

### 5. **Save WhatsApp Configuration**
**Endpoint:** `POST /api/v1/organizations/:organizationId/whatsapp/save-config`

**Request Body:**
```json
{
  "state": "abc123...",
  "wabaId": "123456789",
  "phoneNumberId": "108234567890"
}
```

**What it does:**
- Validates all credentials
- Saves WhatsApp configuration to organization
- Cleans up OAuth state

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "org123",
    "name": "My Organization",
    "whatsappPhoneId": "108234567890",
    "whatsappBusinessId": "123456789",
    "whatsappToken": "EAABsZA...",
    "isActive": true
  },
  "message": "WhatsApp configuration saved successfully"
}
```

---

## Frontend Flow Example

```typescript
// Step 1: Initialize OAuth
const response = await fetch(`/api/v1/organizations/${orgId}/whatsapp/init-oauth`);
const { authUrl } = await response.json();
window.location.href = authUrl;  // Redirect to Meta login

// Step 2: After user returns from Meta OAuth (callback URL)
// Extract state from URL query parameter
const urlParams = new URLSearchParams(window.location.search);
const state = urlParams.get('state');

// Step 3: Fetch available accounts
const accountsRes = await fetch(`/api/v1/organizations/whatsapp/accounts?state=${state}`);
const { wabaOptions } = await accountsRes.json();
// Display wabaOptions to user for selection

// Step 4: When user selects account, fetch phone numbers
const selectedWabaId = userSelectedOption.id;
const phonesRes = await fetch(
  `/api/v1/organizations/whatsapp/phone-numbers?state=${state}&wabaId=${selectedWabaId}`
);
const { phoneOptions } = await phonesRes.json();
// Display phoneOptions to user for selection

// Step 5: Save configuration
const saveRes = await fetch(`/api/v1/organizations/${orgId}/whatsapp/save-config`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    state,
    wabaId: selectedWabaId,
    phoneNumberId: selectedPhoneId
  })
});
const result = await saveRes.json();
// Configuration saved! Show success message
```

---

## Advantages of This Approach

✅ **Secure** - Uses OAuth for credential handling, no manual token entry
✅ **User-Friendly** - Simple selection flow instead of technical credential input
✅ **No Token Storage** - Tokens managed server-side only
✅ **Error Handling** - Validates at each step
✅ **Automatic Discovery** - Users can only select from their actual accounts
✅ **Audit Trail** - Clear logging of who configured what

---

## Error Handling

Common errors to handle:

| Error | Cause | Solution |
|-------|-------|----------|
| `Invalid or expired state` | State token expired (>10 min) | Restart OAuth flow |
| `No WhatsApp Business Accounts found` | User's account not linked to any WABA | Direct to Meta Business setup |
| `No phone numbers found` | Selected WABA has no phone numbers | Add phone number in Meta |
| `State expired` | Too much time between steps | Restart flow |

---

## Security Considerations

1. **State Token Validation** - Prevents CSRF attacks
2. **10-Minute Expiry** - Limits window for token theft
3. **Long-Lived Tokens** - Uses Meta's 60-day tokens, not short-lived ones
4. **Server-Side Storage** - Tokens never exposed to frontend
5. **Automatic Cleanup** - States deleted after use or expiry

---

## Configuration Requirements

Ensure these environment variables are set:

```env
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
META_REDIRECT_URI=https://yourdomain.com/callback
```

The `META_REDIRECT_URI` should point to `/api/v1/organizations/whatsapp/callback`
