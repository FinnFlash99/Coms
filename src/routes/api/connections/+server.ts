import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getPlatformConnectionsByUser } from '$lib/server/db';

// GET /api/connections - List all platform connections for current user
export const GET: RequestHandler = async ({ locals, platform }) => {
	const user = locals.user;
	if (!user) {
		throw error(401, 'Unauthorized');
	}

	const db = platform?.env.DB;
	if (!db) {
		throw error(500, 'Database not available');
	}

	try {
		const connections = await getPlatformConnectionsByUser(db, user.id);

		return json({
			connections: connections.map((c) => ({
				id: c.id,
				platform: c.platform,
				status: c.status,
				email: c.platform_email,
				lastSyncAt: c.last_sync_at ? c.last_sync_at * 1000 : null
			}))
		});
	} catch (e) {
		console.error('Error fetching connections:', e);
		throw error(500, 'Failed to fetch connections');
	}
};
