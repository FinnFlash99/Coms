import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { buildAuthUrl } from '$lib/server/oauth';

/**
 * POST /api/auth/signin - Start OAuth sign-in flow
 *
 * Unlike /api/connections/[platform], this doesn't require an existing user.
 * The state token stores a temporary ID that the callback will use to identify
 * this as a sign-in flow (not a platform connection flow).
 */
export const POST: RequestHandler = async ({ url, platform }) => {
	const kv = platform?.env.OAUTH_STATE;
	if (!kv) {
		throw error(500, 'OAuth state storage not available');
	}

	// Get client ID from environment
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const clientId = (platform?.env as any)?.GOOGLE_CLIENT_ID as string | undefined;
	if (!clientId) {
		throw error(500, 'Google OAuth not configured');
	}

	// Generate a unique state token for sign-in
	// Use a special prefix to distinguish sign-in from platform connection
	const stateId = crypto.randomUUID();
	const state = `signin:${stateId}`;

	// Store state with a marker indicating this is a sign-in flow
	await kv.put(`oauth:state:${state}`, 'signin', { expirationTtl: 600 }); // 10 minutes

	// Build redirect URI
	const redirectUri = `${url.origin}/api/auth/callback/gmail`;

	// Build authorization URL
	const authUrl = buildAuthUrl('gmail', clientId, redirectUri, state);

	return json({ authUrl });
};
