import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getConversationsByUser, getContactsByUser } from '$lib/server/db';

// GET /api/conversations - List all conversations for current user
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
		const conversations = await getConversationsByUser(db, user.id);
		const contacts = await getContactsByUser(db, user.id);

		// Transform to API format
		const result = conversations.map((conv) => ({
			id: conv.id,
			contactId: conv.contact_id,
			platform: conv.platform,
			isRead: Boolean(conv.is_read),
			isResponded: Boolean(conv.is_responded),
			importance: conv.importance,
			timeSensitive: Boolean(conv.is_time_sensitive),
			lastMessageAt: conv.last_message_at * 1000, // Convert to milliseconds
			lastMessagePreview: conv.last_message_preview
		}));

		return json({
			conversations: result,
			contacts: contacts.map((c) => ({
				id: c.id,
				name: c.name,
				type: c.contact_type,
				connection: c.connection_strength
			}))
		});
	} catch (e) {
		console.error('Error fetching conversations:', e);
		throw error(500, 'Failed to fetch conversations');
	}
};
