import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getConversationById, updateConversation } from '$lib/server/db';

// PATCH /api/conversations/[id]/responded - Toggle responded status
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
		let isResponded: boolean;
		try {
			const body = await request.json() as { isResponded?: boolean };
			isResponded = typeof body.isResponded === 'boolean' ? body.isResponded : !conversation.is_responded;
		} catch {
			// No body or invalid JSON - toggle current state
			isResponded = !conversation.is_responded;
		}

		// Responding implies read
		const updates: { is_responded: boolean; is_read?: boolean } = { is_responded: isResponded };
		if (isResponded) {
			updates.is_read = true;
		}

		await updateConversation(db, params.id, updates);

		return json({ success: true, isResponded });
	} catch (e) {
		if ((e as { status?: number }).status) throw e;
		console.error('Error updating conversation responded status:', e);
		throw error(500, 'Failed to update conversation');
	}
};
