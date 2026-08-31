import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getPlatformConnection, queryAll } from '$lib/server/db';
import { decryptToken } from '$lib/server/crypto';
import { refreshAccessToken } from '$lib/server/oauth';
import { fetchGoogleCalendarEvent, toComsCalendarEvent } from '$lib/server/google-calendar';
import type { Contact } from '$lib/types';

/**
 * Get decrypted access token, refreshing if needed
 */
async function getAccessToken(
	db: D1Database,
	userId: string,
	encryptionKey: string,
	clientId: string,
	clientSecret: string
): Promise<string | null> {
	const connection = await getPlatformConnection(db, userId, 'gmail');
	if (!connection) return null;

	let accessToken = await decryptToken(
		connection.access_token_encrypted,
		connection.token_iv,
		encryptionKey
	);

	const needsRefresh = connection.token_expires_at
		? connection.token_expires_at < Math.floor(Date.now() / 1000) + 60
		: false;

	if (needsRefresh && connection.refresh_token_encrypted) {
		try {
			const refreshToken = await decryptToken(
				connection.refresh_token_encrypted,
				connection.token_iv,
				encryptionKey
			);

			const { accessToken: newToken } = await refreshAccessToken(
				'gmail',
				refreshToken,
				clientId,
				clientSecret
			);

			accessToken = newToken;
		} catch (e) {
			console.error('Token refresh failed:', e);
		}
	}

	return accessToken;
}

interface ContactIdentity {
	contact_id: string;
	email: string | null;
}

interface ContactRow {
	id: string;
	name: string;
	contact_type: string;
	connection_strength: string;
}

interface ConversationInfo {
	id: string;
	contact_id: string;
	last_message_at: number;
	last_message_preview: string;
}

/**
 * Enrich attendees with contact info and recent conversation context
 */
async function enrichAttendees(
	db: D1Database,
	userId: string,
	attendeeEmails: string[]
): Promise<{
	matchedContacts: Contact[];
	unmatchedEmails: string[];
	recentConversations: Record<string, ConversationInfo>;
}> {
	if (attendeeEmails.length === 0) {
		return { matchedContacts: [], unmatchedEmails: [], recentConversations: {} };
	}

	// Get contact identities for these emails
	const placeholders = attendeeEmails.map(() => '?').join(',');
	const identities = await queryAll<ContactIdentity>(
		db,
		`SELECT ci.contact_id, ci.email
		 FROM contact_identities ci
		 JOIN contacts c ON c.id = ci.contact_id
		 WHERE c.user_id = ? AND LOWER(ci.email) IN (${placeholders})`,
		[userId, ...attendeeEmails.map((e) => e.toLowerCase())]
	);

	const emailToContactId = new Map<string, string>();
	for (const identity of identities) {
		if (identity.email) {
			emailToContactId.set(identity.email.toLowerCase(), identity.contact_id);
		}
	}

	// Get contact details
	const contactIds = [...new Set(identities.map((i) => i.contact_id))];
	const matchedContacts: Contact[] = [];

	if (contactIds.length > 0) {
		const contactPlaceholders = contactIds.map(() => '?').join(',');
		const contacts = await queryAll<ContactRow>(
			db,
			`SELECT id, name, contact_type, connection_strength
			 FROM contacts
			 WHERE id IN (${contactPlaceholders})`,
			contactIds
		);

		for (const c of contacts) {
			matchedContacts.push({
				id: c.id,
				name: c.name,
				type: c.contact_type || 'Client',
				connection: (c.connection_strength as Contact['connection']) || 'Regular'
			});
		}
	}

	// Get recent conversations for matched contacts
	const recentConversations: Record<string, ConversationInfo> = {};

	if (contactIds.length > 0) {
		const convPlaceholders = contactIds.map(() => '?').join(',');
		const conversations = await queryAll<ConversationInfo>(
			db,
			`SELECT id, contact_id, last_message_at, last_message_preview
			 FROM conversations
			 WHERE user_id = ? AND contact_id IN (${convPlaceholders})
			 ORDER BY last_message_at DESC`,
			[userId, ...contactIds]
		);

		// Keep only most recent per contact
		for (const conv of conversations) {
			if (!recentConversations[conv.contact_id]) {
				recentConversations[conv.contact_id] = conv;
			}
		}
	}

	// Find unmatched emails
	const unmatchedEmails = attendeeEmails.filter(
		(email) => !emailToContactId.has(email.toLowerCase())
	);

	return { matchedContacts, unmatchedEmails, recentConversations };
}

// GET /api/calendar/events/[id] - Fetch single event with enriched attendee info
export const GET: RequestHandler = async ({ params, locals, platform }) => {
	const user = locals.user;
	if (!user) {
		throw error(401, 'Unauthorized');
	}

	const db = platform?.env?.DB;
	const encryptionKey = (platform?.env as unknown as Record<string, string>)?.ENCRYPTION_KEY;
	const clientId = (platform?.env as unknown as Record<string, string>)?.GOOGLE_CLIENT_ID;
	const clientSecret = (platform?.env as unknown as Record<string, string>)?.GOOGLE_CLIENT_SECRET;

	if (!db || !encryptionKey || !clientId || !clientSecret) {
		throw error(500, 'Service not configured');
	}

	const eventId = params.id;
	if (!eventId) {
		throw error(400, 'Event ID required');
	}

	try {
		const accessToken = await getAccessToken(
			db,
			user.id,
			encryptionKey,
			clientId,
			clientSecret
		);

		if (!accessToken) {
			throw error(400, 'Google Calendar not connected');
		}

		// Fetch event from Google Calendar
		const googleEvent = await fetchGoogleCalendarEvent(accessToken, eventId);

		if (!googleEvent) {
			throw error(404, 'Event not found');
		}

		// Extract attendee emails (excluding self)
		const attendeeEmails = googleEvent.attendees
			?.filter((a) => !a.self)
			.map((a) => a.email) || [];

		// Enrich attendees with contact info
		const enrichment = await enrichAttendees(db, user.id, attendeeEmails);

		// Transform to Coms event with matched contact IDs
		const event = toComsCalendarEvent(
			googleEvent,
			enrichment.matchedContacts.map((c) => c.id)
		);

		return json({
			event,
			attendees: {
				matched: enrichment.matchedContacts,
				unmatched: enrichment.unmatchedEmails,
				conversations: enrichment.recentConversations
			}
		});
	} catch (e) {
		if ((e as { status?: number }).status) throw e;
		console.error('Error fetching calendar event:', e);
		throw error(500, 'Failed to fetch calendar event');
	}
};
