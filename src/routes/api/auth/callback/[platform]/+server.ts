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
