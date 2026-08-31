import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	OAUTH_CONFIGS,
	validateStateToken,
	exchangeCodeForTokens,
	type OAuthPlatform
} from '$lib/server/oauth';
import { encryptToken } from '$lib/server/crypto';
import { upsertPlatformConnection } from '$lib/server/db';

const VALID_PLATFORMS: OAuthPlatform[] = ['gmail', 'outlook', 'slack', 'whatsapp'];

// GET /api/auth/callback/[platform] - OAuth callback
export const GET: RequestHandler = async ({ params, url, platform }) => {
	const platformName = params.platform as OAuthPlatform;
	if (!VALID_PLATFORMS.includes(platformName)) {
		throw error(400, 'Invalid platform');
	}

	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const errorParam = url.searchParams.get('error');

	if (errorParam) {
		// User denied access or other OAuth error
		throw redirect(302, '/settings?error=oauth_denied');
	}

	if (!code || !state) {
		throw error(400, 'Missing code or state parameter');
	}

	const kv = platform?.env.OAUTH_STATE;
	const db = platform?.env.DB;

	if (!kv || !db) {
		throw error(500, 'Required services not available');
	}

	// Validate state token and get user ID
	const userId = await validateStateToken(kv, state);
	if (!userId) {
		throw error(400, 'Invalid or expired state token');
	}

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

		// Redirect to home - layout will show appropriate screen based on auth state
		throw redirect(302, '/?connected=' + platformName);
	} catch (e) {
		if ((e as { status?: number }).status === 302) throw e; // Re-throw redirects
		console.error('OAuth callback error:', e);
		throw redirect(302, '/?error=oauth_failed');
	}
};
