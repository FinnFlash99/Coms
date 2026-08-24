import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	OAUTH_CONFIGS,
	generateStateToken,
	buildAuthUrl,
	type OAuthPlatform
} from '$lib/server/oauth';
import { deletePlatformConnection } from '$lib/server/db';

const VALID_PLATFORMS: OAuthPlatform[] = ['gmail', 'outlook', 'slack', 'discord'];

// POST /api/connections/[platform] - Start OAuth flow
export const POST: RequestHandler = async ({ params, url, locals, platform }) => {
	const user = locals.user;
	if (!user) {
		throw error(401, 'Unauthorized');
	}

	const platformName = params.platform as OAuthPlatform;
	if (!VALID_PLATFORMS.includes(platformName)) {
		throw error(400, 'Invalid platform');
	}

	const kv = platform?.env.OAUTH_STATE;
	if (!kv) {
		throw error(500, 'OAuth state storage not available');
	}

	const config = OAUTH_CONFIGS[platformName];

	// Get client ID from environment
	// In production, these would come from platform.env
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const clientId = (platform?.env as any)?.[config.clientIdEnvKey] as string | undefined;
	if (!clientId) {
		throw error(500, `${platformName} OAuth not configured`);
	}

	// Generate state token for CSRF protection
	const state = await generateStateToken(kv, user.id);

	// Build redirect URI
	const redirectUri = `${url.origin}/api/auth/callback/${platformName}`;

	// Build authorization URL
	const authUrl = buildAuthUrl(platformName, clientId, redirectUri, state);

	return json({ authUrl });
};

// DELETE /api/connections/[platform] - Disconnect platform
export const DELETE: RequestHandler = async ({ params, locals, platform }) => {
	const user = locals.user;
	if (!user) {
		throw error(401, 'Unauthorized');
	}

	const platformName = params.platform as OAuthPlatform;
	if (!VALID_PLATFORMS.includes(platformName)) {
		throw error(400, 'Invalid platform');
	}

	const db = platform?.env.DB;
	if (!db) {
		throw error(500, 'Database not available');
	}

	try {
		await deletePlatformConnection(db, user.id, platformName);
		return json({ success: true });
	} catch (e) {
		console.error('Error disconnecting platform:', e);
		throw error(500, 'Failed to disconnect platform');
	}
};
