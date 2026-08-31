import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const SESSION_COOKIE = 'coms_session';

// POST /api/auth/logout - Sign out and clear session
export const POST: RequestHandler = async ({ cookies, platform }) => {
	const sessionId = cookies.get(SESSION_COOKIE);

	if (sessionId && platform?.env.SESSIONS) {
		// Delete session from KV
		await platform.env.SESSIONS.delete(sessionId);
	}

	// Clear session cookie
	cookies.delete(SESSION_COOKIE, { path: '/' });

	return json({ success: true });
};
