import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getConversationById, updateConversation } from '$lib/server/db';

// PATCH /api/conversations/[id]/read - Toggle read status
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

		// Toggle or set based on request body
		let isRead: boolean;
		try {
			const body = await request.json() as { isRead?: boolean };
			isRead = typeof body.isRead === 'boolean' ? body.isRead : !conversation.is_read;
		} catch {
			// No body or invalid JSON - toggle current state
			isRead = !conversation.is_read;
		}

		await updateConversation(db, params.id, { is_read: isRead });

		return json({ success: true, isRead });
	} catch (e) {
		if ((e as { status?: number }).status) throw e;
		console.error('Error updating conversation read status:', e);
		throw error(500, 'Failed to update conversation');
	}
};
