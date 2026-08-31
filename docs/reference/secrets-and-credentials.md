# Secrets and Credentials Reference

Complete lifecycle documentation for all secrets, API keys, and credentials used by Coms.

## Overview

Coms uses secrets for three purposes:
1. **OAuth authentication** — Connecting to Gmail, Slack, etc.
2. **Token encryption** — Protecting stored OAuth tokens at rest in D1
3. **Webhook verification** — Validating incoming webhooks from external services

## Deployment Architecture

This project deploys as a **Cloudflare Worker** via `wrangler deploy` (triggered by Cloudflare's Git integration).

- **Runtime URL:** `coms.rwb89mvwwg.workers.dev`
- **Configuration:** `wrangler.toml`
- **Secrets:** Set via `npx wrangler secret put <NAME>`

## Secret Inventory

### Secrets We Generate

| Secret | Purpose | Format | Rotation |
|--------|---------|--------|----------|
| `ENCRYPTION_KEY` | AES-256-GCM encryption of OAuth tokens stored in D1 | 64-char hex string (32 bytes) | **Never auto-rotates**. Changing this invalidates all stored tokens—users must reconnect. |

### Google OAuth Credentials

Source: [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials

| Secret | Purpose | Rotation |
|--------|---------|----------|
| `GOOGLE_CLIENT_ID` | Identifies the app to Google | **Never**. Permanent unless OAuth app is deleted. |
| `GOOGLE_CLIENT_SECRET` | Authenticates the app to Google | **Never**. Can be manually regenerated (invalidates immediately). |

### Slack OAuth Credentials

Source: [Slack API Dashboard](https://api.slack.com/apps) → Your App → Basic Information

| Secret | Purpose | Rotation |
|--------|---------|----------|
| `SLACK_CLIENT_ID` | Identifies the app to Slack | **Never**. Permanent unless app is deleted. |
| `SLACK_CLIENT_SECRET` | Authenticates the app to Slack | **Never**. Can be manually regenerated. |
| `SLACK_SIGNING_SECRET` | Verifies webhook requests from Slack | **Never**. Can be manually regenerated. |

## Setting Secrets

Secrets are set using wrangler CLI and stored in Cloudflare's secret store:

```bash
# Set each secret (you'll be prompted to enter the value)
npx wrangler secret put ENCRYPTION_KEY
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put SLACK_CLIENT_ID
npx wrangler secret put SLACK_CLIENT_SECRET
npx wrangler secret put SLACK_SIGNING_SECRET
```

To verify secrets are set:
```bash
npx wrangler secret list
```

### Generating the Encryption Key

Generate once. Store securely. Never regenerate unless you accept that all users must reconnect.

```bash
openssl rand -hex 32
```

This produces a 64-character hexadecimal string (256 bits).

## Token Lifecycle

### How Tokens Are Stored

When a user connects Gmail or Slack:
1. OAuth flow returns access token (and refresh token for Google)
2. Tokens are encrypted with AES-256-GCM using `ENCRYPTION_KEY`
3. Encrypted tokens and IV are stored in the `platform_connections` table in D1

### Token Encryption Details

- **Algorithm:** AES-256-GCM
- **Key:** `ENCRYPTION_KEY` (from environment)
- **IV:** Random 12 bytes, generated per connection, stored alongside encrypted tokens
- **Storage:** `platform_connections.access_token_encrypted`, `refresh_token_encrypted`, `token_iv`

Both access and refresh tokens use the same IV (generated when the connection is created).

### OAuth Token Expiration

| Platform | Access Token | Refresh Token |
|----------|--------------|---------------|
| Google | ~1 hour (auto-refreshed) | Never* |
| Slack | Never | N/A (Slack doesn't use refresh tokens) |

*Google refresh tokens expire after 7 days of non-use if the OAuth app is in "Testing" mode (not published). Published apps have no expiration.

### Session Tokens

| Storage | Key Format | TTL |
|---------|------------|-----|
| `SESSIONS` KV | `session:{uuid}` | 7 days |
| `OAUTH_STATE` KV | `oauth:state:{uuid}` | 10 minutes |

## Bindings (Non-Secret Configuration)

Configured in `wrangler.toml`, available at runtime via `platform.env`:

| Binding | Type | Code Access | Purpose |
|---------|------|-------------|---------|
| `DB` | D1 Database | `platform.env.DB` | Users, contacts, conversations, messages |
| `SESSIONS` | KV Namespace | `platform.env.SESSIONS` | User session storage |
| `OAUTH_STATE` | KV Namespace | `platform.env.OAUTH_STATE` | Temporary OAuth state |

## Code Paths

### Where Secrets Are Read

All secrets are accessed via `platform.env` in server-side code:

```typescript
const env = platform.env as Record<string, string>;
const encryptionKey = env.ENCRYPTION_KEY;
const clientId = env.GOOGLE_CLIENT_ID;
const clientSecret = env.GOOGLE_CLIENT_SECRET;
```

### Encryption/Decryption

- **Encrypt:** `src/lib/server/crypto.ts` → `encryptToken()`
- **Decrypt:** `src/lib/server/crypto.ts` → `decryptToken()`
- **Used in:** OAuth callback (encrypt), sync/calendar/webhooks (decrypt)

## Troubleshooting

### "Decryption failed" Error

```
OperationError: Decryption failed. This could be due to a ciphertext authentication failure,
bad padding, incorrect CryptoKey, or another algorithm-specific reason.
```

**Causes:**
1. `ENCRYPTION_KEY` changed after tokens were encrypted
2. IV mismatch (bug fixed in commit: "fix: Use same IV for access and refresh token encryption")

**Resolution:**
- If key changed: Restore original key, or have users reconnect
- If IV bug (pre-fix connections): Users must disconnect and reconnect

### "401 UNAUTHENTICATED" from Google

**Causes:**
1. Access token expired and refresh failed
2. User revoked access in Google account settings
3. Google app in "Testing" mode and refresh token expired (7-day limit)
4. `GOOGLE_CLIENT_SECRET` was regenerated

**Resolution:** User must reconnect Gmail.

### "Service not configured" Error

**Cause:** Required secret is missing from environment.

**Resolution:**
```bash
npx wrangler secret list  # Check what's set
npx wrangler secret put MISSING_SECRET_NAME
```

## Security Model

1. **Secrets never in code** — All secrets via environment variables
2. **Encryption at rest** — OAuth tokens AES-256-GCM encrypted in D1
3. **Minimal OAuth scopes** — Only request necessary permissions
4. **Secure session cookies** — httpOnly, secure, sameSite=lax
5. **CSRF protection** — OAuth state tokens prevent cross-site attacks
6. **Webhook verification** — Slack requests validated via signing secret

## New Deployment Checklist

1. Generate `ENCRYPTION_KEY`: `openssl rand -hex 32`
2. Create Google OAuth app in Cloud Console (get client ID/secret)
3. Create Slack app at api.slack.com (get client ID/secret/signing secret)
4. Set all secrets:
   ```bash
   npx wrangler secret put ENCRYPTION_KEY
   npx wrangler secret put GOOGLE_CLIENT_ID
   npx wrangler secret put GOOGLE_CLIENT_SECRET
   npx wrangler secret put SLACK_CLIENT_ID
   npx wrangler secret put SLACK_CLIENT_SECRET
   npx wrangler secret put SLACK_SIGNING_SECRET
   ```
5. Run database migrations: `npx wrangler d1 migrations apply coms-db --remote`
6. Deploy: `git push` (triggers Cloudflare Git integration)
7. Test OAuth flow for each platform
