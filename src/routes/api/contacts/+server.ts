import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { queryAll } from '$lib/server/db';

// GET /api/contacts - List all contacts for current user
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
		const rows = await queryAll<{
			id: string;
			channel: string;
			handle: string;
			name: string | null;
			profile_name: string | null;
			avatar_url: string | null;
			contact_type: string | null;
			connection_strength: string | null;
		}>(
			db,
			`SELECT id, channel, handle, name, profile_name, avatar_url, contact_type, connection_strength
			 FROM contacts
			 WHERE user_id = ?
			 ORDER BY name ASC`,
			[user.id]
		);

		const items = rows.map((row) => ({
			id: row.id,
			channel: row.channel || 'gmail',
			handle: row.handle || '',
			name: row.name,
			profileName: row.profile_name,
			avatarUrl: row.avatar_url,
			contactType: row.contact_type || 'other',
			connectionStrength: row.connection_strength || 'New'
		}));

		return json({ items, total: items.length });
	} catch (e) {
		console.error('Error fetching contacts:', e);
		throw error(500, 'Failed to fetch contacts');
	}
};
