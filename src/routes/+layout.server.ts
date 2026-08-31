import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	// Pass user data from server to client
	// If user is authenticated, they'll have a user object from the session
	return {
		user: locals.user || null
	};
};
