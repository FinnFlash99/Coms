import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getConversationById, updateConversation } from '$lib/server/db';

// PATCH /api/conversations/[id]/importance - Update importance level
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

		const body = await request.json() as { importance?: string };
		const importance = body.importance;

		if (!importance || !['low', 'normal', 'high'].includes(importance)) {
			throw error(400, 'Invalid importance level');
		}

		await updateConversation(db, params.id, { importance });

		return json({ success: true, importance });
	} catch (e) {
		if ((e as { status?: number }).status) throw e;
		console.error('Error updating conversation importance:', e);
		throw error(500, 'Failed to update conversation');
	}
};
