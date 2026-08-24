import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getConversationById, getMessagesByConversation, updateConversation } from '$lib/server/db';

// GET /api/conversations/[id] - Get conversation with messages
export const GET: RequestHandler = async ({ params, locals, platform }) => {
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

		const messages = await getMessagesByConversation(db, params.id);

		return json({
			id: conversation.id,
			contactId: conversation.contact_id,
			platform: conversation.platform,
			isRead: Boolean(conversation.is_read),
			isResponded: Boolean(conversation.is_responded),
			importance: conversation.importance,
			timeSensitive: Boolean(conversation.is_time_sensitive),
			lastMessageAt: conversation.last_message_at * 1000,
			lastMessagePreview: conversation.last_message_preview,
			messages: messages.map((m) => ({
				id: m.id,
				platform: m.platform,
				content: m.content,
				senderName: m.sender_name,
				direction: m.direction,
				timestamp: m.timestamp * 1000,
				isRead: Boolean(m.is_read)
			}))
		});
	} catch (e) {
		if ((e as { status?: number }).status) throw e;
		console.error('Error fetching conversation:', e);
		throw error(500, 'Failed to fetch conversation');
	}
};

// PATCH /api/conversations/[id] - Update conversation status
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

		const body = (await request.json()) as {
			isRead?: boolean;
			isResponded?: boolean;
			importance?: string;
			timeSensitive?: boolean;
		};
		const updates: {
			is_read?: boolean;
			is_responded?: boolean;
			importance?: string;
			is_time_sensitive?: boolean;
		} = {};

		if (typeof body.isRead === 'boolean') {
			updates.is_read = body.isRead;
		}
		if (typeof body.isResponded === 'boolean') {
			updates.is_responded = body.isResponded;
			if (body.isResponded) {
				updates.is_read = true; // Responding implies read
			}
		}
		if (body.importance && ['low', 'normal', 'high'].includes(body.importance)) {
			updates.importance = body.importance;
		}
		if (typeof body.timeSensitive === 'boolean') {
			updates.is_time_sensitive = body.timeSensitive;
		}

		await updateConversation(db, params.id, updates);

		return json({ success: true });
	} catch (e) {
		if ((e as { status?: number }).status) throw e;
		console.error('Error updating conversation:', e);
		throw error(500, 'Failed to update conversation');
	}
};
