import type { Handle } from '@sveltejs/kit';

// Session cookie name
const SESSION_COOKIE = 'coms_session';

export const handle: Handle = async ({ event, resolve }) => {
	// Get session from cookie
	const sessionId = event.cookies.get(SESSION_COOKIE);

	if (sessionId && event.platform?.env.SESSIONS) {
		// Try to get user from session store
		const sessionData = await event.platform.env.SESSIONS.get(sessionId);
		if (sessionData) {
			try {
				const user = JSON.parse(sessionData);
				event.locals.user = user;
			} catch {
				// Invalid session data, clear it
				event.cookies.delete(SESSION_COOKIE, { path: '/' });
			}
		}
	}

	return resolve(event);
};
