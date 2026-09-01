import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getConversationById, updateConversation } from '$lib/server/db';

// PATCH /api/conversations/[id]/status - Set conversation status (open/closed)
export const PATCH: RequestHandler = async ({ params, request, locals, platform }) => {
	const user = locals.user;
	if (!user) {
		throw error(401, 'Unauthorized');
	}

	const db = platform?.env.DB;
	if (!db) {
		throw error(500, 'Database not available');
	}

	try {
		const conversation = await getConversationById(db, params.id);

		if (!conversation) {
			throw error(404, 'Conversation not found');
		}

		if (conversation.user_id !== user.id) {
			throw error(403, 'Forbidden');
		}

		const body = (await request.json()) as { status?: 'open' | 'closed' };
		const status = body.status;

		if (!status || !['open', 'closed'].includes(status)) {
			throw error(400, 'Invalid status. Must be "open" or "closed"');
		}

		await updateConversation(db, params.id, { status });

		return json({ success: true, status });
	} catch (e) {
		if ((e as { status?: number }).status) throw e;
		console.error('Error updating conversation status:', e);
		throw error(500, 'Failed to update conversation');
	}
};
