import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getConversationById, updateConversation } from '$lib/server/db';

// PATCH /api/conversations/[id]/urgent - Toggle time-sensitive/urgent status
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
		let isTimeSensitive: boolean;
		try {
			const body = (await request.json()) as { isTimeSensitive?: boolean };
			isTimeSensitive =
				typeof body.isTimeSensitive === 'boolean'
					? body.isTimeSensitive
					: !conversation.is_time_sensitive;
		} catch {
			// No body or invalid JSON - toggle current state
			isTimeSensitive = !conversation.is_time_sensitive;
		}

		await updateConversation(db, params.id, { is_time_sensitive: isTimeSensitive });

		return json({ success: true, isTimeSensitive });
	} catch (e) {
		if ((e as { status?: number }).status) throw e;
		console.error('Error updating conversation urgent status:', e);
		throw error(500, 'Failed to update conversation');
	}
};
