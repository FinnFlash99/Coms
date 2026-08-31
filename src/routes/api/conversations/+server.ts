import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { queryAll } from '$lib/server/db';

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
		// Join conversations with contacts to get all needed data
		const rows = await queryAll<{
			id: string;
			contact_id: string;
			channel: string;
			subject: string | null;
			status: string;
			unread: number;
			last_message_at: string;
			last_message_preview: string;
			is_read: number;
			is_responded: number;
			importance: string | null;
			is_time_sensitive: number;
			due_ts: number | null;
			// Contact fields
			contact_name: string | null;
			contact_handle: string;
			contact_profile_name: string | null;
			contact_avatar_url: string | null;
			contact_type: string | null;
			connection_strength: string | null;
		}>(
			db,
			`SELECT
				conv.id,
				conv.contact_id,
				conv.channel,
				conv.subject,
				conv.status,
				conv.unread,
				conv.last_message_at,
				conv.last_message_preview,
				conv.is_read,
				conv.is_responded,
				conv.importance,
				conv.is_time_sensitive,
				conv.due_ts,
				c.name as contact_name,
				c.handle as contact_handle,
				c.profile_name as contact_profile_name,
				c.avatar_url as contact_avatar_url,
				c.contact_type,
				c.connection_strength
			FROM conversations conv
			LEFT JOIN contacts c ON c.id = conv.contact_id
			WHERE conv.user_id = ?
			ORDER BY conv.last_message_at DESC`,
			[user.id]
		);

		// Transform to API format expected by frontend
		const items = rows.map((row) => {
			// Parse last_message_at - could be ISO string or timestamp
			let lastMessageAt: string;
			if (row.last_message_at) {
				const parsed = parseFloat(row.last_message_at);
				if (!isNaN(parsed)) {
					// It's a timestamp (milliseconds)
					lastMessageAt = new Date(parsed).toISOString();
				} else {
					// It's already an ISO string
					lastMessageAt = row.last_message_at;
				}
			} else {
				lastMessageAt = new Date().toISOString();
			}

			return {
				id: row.id,
				channel: row.channel || 'gmail',
				subject: row.subject,
				status: row.status || 'open',
				unread: row.unread || 0,
				lastMessageAt,
				lastMessagePreview: row.last_message_preview || '',
				isRead: Boolean(row.is_read),
				isResponded: Boolean(row.is_responded),
				importance: row.importance || 'normal',
				isTimeSensitive: Boolean(row.is_time_sensitive),
				dueTs: row.due_ts,
				contact: {
					id: row.contact_id,
					channel: row.channel || 'gmail',
					handle: row.contact_handle || '',
					name: row.contact_name,
					profileName: row.contact_profile_name,
					avatarUrl: row.contact_avatar_url,
					contactType: row.contact_type || 'other',
					connectionStrength: row.connection_strength || 'New'
				}
			};
		});

		return json({
			items,
			total: items.length
		});
	} catch (e) {
		console.error('Error fetching conversations:', e);
		throw error(500, 'Failed to fetch conversations');
	}
};
