import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { queryAll, queryOne } from '$lib/server/db';

// GET /api/conversations/:id/messages - List messages in a conversation
export const GET: RequestHandler = async ({ locals, platform, params }) => {
	const user = locals.user;
	if (!user) {
		throw error(401, 'Unauthorized');
	}

	const db = platform?.env.DB;
	if (!db) {
		throw error(500, 'Database not available');
	}

	const conversationId = params.id;

	try {
		// Verify the conversation belongs to this user
		const conversation = await queryOne<{ id: string; user_id: string }>(
			db,
			'SELECT id, user_id FROM conversations WHERE id = ?',
			[conversationId]
		);

		if (!conversation) {
			throw error(404, 'Conversation not found');
		}

		if (conversation.user_id !== user.id) {
			throw error(403, 'Access denied');
		}

		// Fetch messages
		const rows = await queryAll<{
			id: string;
			conversation_id: string;
			kind: string;
			body: string;
			author_name: string | null;
			created_at: string;
			external_id: string | null;
		}>(
			db,
			`SELECT id, conversation_id, kind, body, author_name, created_at, external_id
			 FROM messages
			 WHERE conversation_id = ?
			 ORDER BY created_at ASC`,
			[conversationId]
		);

		const items = rows.map((row) => ({
			id: row.id,
			conversationId: row.conversation_id,
			kind: row.kind || 'inbound',
			body: row.body || '',
			authorName: row.author_name,
			createdAt: row.created_at,
			externalId: row.external_id
		}));

		return json({ items, total: items.length });
	} catch (e) {
		if ((e as { status?: number }).status) throw e;
		console.error('Error fetching messages:', e);
		throw error(500, 'Failed to fetch messages');
	}
};
