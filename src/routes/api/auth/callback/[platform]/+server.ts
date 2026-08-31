import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	OAUTH_CONFIGS,
	exchangeCodeForTokens,
	type OAuthPlatform
} from '$lib/server/oauth';
import { encryptToken } from '$lib/server/crypto';
import { upsertPlatformConnection, getUserByEmail, createUser } from '$lib/server/db';

const VALID_PLATFORMS: OAuthPlatform[] = ['gmail', 'outlook', 'slack', 'whatsapp'];
const SESSION_COOKIE = 'coms_session';
const SESSION_TTL = 60 * 60 * 24 * 30; // 30 days

interface GoogleUserInfo {
	email: string;
	name?: string;
	picture?: string;
}

/**
 * Fetch Google user info using access token
 */
async function fetchGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
	const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
		headers: { Authorization: `Bearer ${accessToken}` }
	});

	if (!response.ok) {
		throw new Error('Failed to fetch user info from Google');
	}

	return response.json();
}

/**
 * Create a session for the user
 */
async function createSession(
	kv: KVNamespace,
	userId: string,
	email: string,
	name?: string
): Promise<string> {
	const sessionId = crypto.randomUUID();
	const sessionData = JSON.stringify({ id: userId, email, name });

	await kv.put(sessionId, sessionData, { expirationTtl: SESSION_TTL });

	return sessionId;
}

/**
 * Set up Gmail push notifications by calling watch() API
 */
async function setupGmailWatch(accessToken: string, topicName: string): Promise<void> {
	const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/watch', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${accessToken}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			topicName,
			labelIds: ['INBOX']
		})
	});

	if (!response.ok) {
		const errorText = await response.text();
		console.error('Gmail watch setup failed:', errorText);
		// Don't throw - watch setup failure shouldn't block sign-in
	} else {
		const result = await response.json() as { historyId?: string };
		console.log('Gmail watch setup successful, historyId:', result.historyId);
	}
}

/**
 * Fetch recent emails and sync them to the database
 */
async function syncRecentEmails(
	accessToken: string,
	userId: string
): Promise<void> {
	try {
		// Fetch recent messages (last 20)
		const listResponse = await fetch(
			'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=20&labelIds=INBOX',
			{ headers: { Authorization: `Bearer ${accessToken}` } }
		);

		if (!listResponse.ok) {
			console.error('Failed to list Gmail messages');
			return;
		}

		const listData = await listResponse.json() as { messages?: Array<{ id: string; threadId: string }> };
		if (!listData.messages || listData.messages.length === 0) {
			console.log('No messages to sync');
			return;
		}

		console.log(`Syncing ${listData.messages.length} recent emails...`);

		// Fetch each message's details and forward to OpenChannels
		const OPENCHANNELS_URL = 'https://openchannels-api.rwb89mvwwg.workers.dev';

		for (const msg of listData.messages.slice(0, 10)) { // Limit to 10 for initial sync
			const msgResponse = await fetch(
				`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
				{ headers: { Authorization: `Bearer ${accessToken}` } }
			);

			if (!msgResponse.ok) continue;

			const msgData = await msgResponse.json() as {
				id: string;
				threadId: string;
				snippet: string;
				internalDate: string;
				payload?: { headers?: Array<{ name: string; value: string }> };
			};

			const headers = msgData.payload?.headers || [];
			const from = headers.find(h => h.name === 'From')?.value || 'Unknown';
			const subject = headers.find(h => h.name === 'Subject')?.value || '(No subject)';

			// Extract sender name and email
			const fromMatch = from.match(/^(?:"?([^"<]*)"?\s*)?<?([^>]+)>?$/);
			const senderName = fromMatch?.[1]?.trim() || fromMatch?.[2] || from;
			const senderEmail = fromMatch?.[2] || from;

			// Send to OpenChannels for processing
			await fetch(`${OPENCHANNELS_URL}/api/ingest`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					userId,
					platform: 'gmail',
					platformThreadId: msgData.threadId,
					platformMessageId: msgData.id,
					senderName,
					senderEmail,
					subject,
					content: msgData.snippet,
					timestamp: parseInt(msgData.internalDate),
					direction: 'inbound'
				})
			});
		}

		console.log('Initial email sync complete');
	} catch (e) {
		console.error('Email sync error:', e);
		// Don't throw - sync failure shouldn't block sign-in
	}
}

// GET /api/auth/callback/[platform] - OAuth callback
export const GET: RequestHandler = async ({ params, url, cookies, platform }) => {
	const platformName = params.platform as OAuthPlatform;
	if (!VALID_PLATFORMS.includes(platformName)) {
		throw error(400, 'Invalid platform');
	}

	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const errorParam = url.searchParams.get('error');

	if (errorParam) {
		// User denied access or other OAuth error
		throw redirect(302, '/?error=oauth_denied');
	}

	if (!code || !state) {
		throw error(400, 'Missing code or state parameter');
	}

	const kv = platform?.env.OAUTH_STATE;
	const sessions = platform?.env.SESSIONS;
	const db = platform?.env.DB;

	if (!kv || !db) {
		throw error(500, 'Required services not available');
	}

	// Validate state token
	const stateData = await kv.get(`oauth:state:${state}`);
	if (!stateData) {
		throw error(400, 'Invalid or expired state token');
	}

	// Delete used state token
	await kv.delete(`oauth:state:${state}`);

	// Determine if this is a sign-in flow or platform connection flow
	const isSignIn = stateData === 'signin';
	let userId = isSignIn ? null : stateData;

	const config = OAUTH_CONFIGS[platformName];
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const env = platform.env as any;
	const clientId = env[config.clientIdEnvKey] as string | undefined;
	const clientSecret = env[config.clientSecretEnvKey] as string | undefined;
	const encryptionKey = env.ENCRYPTION_KEY as string | undefined;

	if (!clientId || !clientSecret) {
		throw error(500, `${platformName} OAuth not configured`);
	}

	if (!encryptionKey) {
		throw error(500, 'Encryption not configured');
	}

	try {
		// Exchange code for tokens
		const redirectUri = `${url.origin}/api/auth/callback/${platformName}`;
		const tokens = await exchangeCodeForTokens(
			platformName,
			code,
			clientId,
			clientSecret,
			redirectUri
		);

		// For sign-in flow with Gmail, fetch user info and create/find user
		if (isSignIn && platformName === 'gmail') {
			if (!sessions) {
				throw error(500, 'Session storage not available');
			}

			const userInfo = await fetchGoogleUserInfo(tokens.accessToken);

			// Find or create user
			let user = await getUserByEmail(db, userInfo.email);
			if (!user) {
				user = await createUser(db, userInfo.email, userInfo.name);
			}

			// At this point user is guaranteed to exist (either found or created)
			const authenticatedUser = user;
			userId = authenticatedUser.id;

			// Create session
			const sessionId = await createSession(sessions, authenticatedUser.id, authenticatedUser.email, authenticatedUser.name ?? undefined);

			// Set session cookie
			cookies.set(SESSION_COOKIE, sessionId, {
				path: '/',
				httpOnly: true,
				secure: url.protocol === 'https:',
				sameSite: 'lax',
				maxAge: SESSION_TTL
			});
		}

		if (!userId) {
			throw error(400, 'User ID not available');
		}

		// Encrypt tokens
		const { encrypted: accessTokenEncrypted, iv: tokenIv } = await encryptToken(
			tokens.accessToken,
			encryptionKey
		);

		let refreshTokenEncrypted: string | undefined;
		if (tokens.refreshToken) {
			const refreshResult = await encryptToken(tokens.refreshToken, encryptionKey);
			refreshTokenEncrypted = refreshResult.encrypted;
		}

		// Calculate token expiration
		const tokenExpiresAt = tokens.expiresIn
			? Math.floor(Date.now() / 1000) + tokens.expiresIn
			: undefined;

		// Store encrypted tokens in database
		await upsertPlatformConnection(db, userId, platformName, {
			accessTokenEncrypted,
			refreshTokenEncrypted,
			tokenIv,
			tokenExpiresAt
		});

		// For Gmail, set up push notifications and sync recent emails
		if (platformName === 'gmail') {
			const pubsubTopic = env.GMAIL_PUBSUB_TOPIC as string | undefined;

			// Set up Gmail watch for push notifications (if topic configured)
			if (pubsubTopic) {
				await setupGmailWatch(tokens.accessToken, pubsubTopic);
			} else {
				console.log('GMAIL_PUBSUB_TOPIC not configured, skipping watch setup');
			}

			// Sync recent emails in the background
			// Using waitUntil if available, otherwise just await
			const syncPromise = syncRecentEmails(tokens.accessToken, userId);
			if (platform?.context?.waitUntil) {
				platform.context.waitUntil(syncPromise);
			} else {
				await syncPromise;
			}
		}

		// Redirect based on flow type
		if (isSignIn) {
			// Sign-in complete - redirect to home (will show onboarding if needed)
			throw redirect(302, '/?authed=1&connected=' + platformName);
		} else {
			// Platform connection complete
			throw redirect(302, '/?connected=' + platformName);
		}
	} catch (e) {
		if ((e as { status?: number }).status === 302) throw e; // Re-throw redirects
		console.error('OAuth callback error:', e);
		throw redirect(302, '/?error=oauth_failed');
	}
};
