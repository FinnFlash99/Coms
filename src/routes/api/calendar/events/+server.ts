import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getPlatformConnection, queryAll } from '$lib/server/db';
import { decryptToken } from '$lib/server/crypto';
import { refreshAccessToken } from '$lib/server/oauth';
import {
	fetchGoogleCalendarEvents,
	toComsCalendarEvents
} from '$lib/server/google-calendar';

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
	// Gmail OAuth includes calendar.readonly scope, so we use 'gmail' platform
	const connection = await getPlatformConnection(db, userId, 'gmail');
	if (!connection) return null;

	const userEmail = connection.platform_email || 'unknown';

	// Decrypt current token
	let accessToken: string;
	try {
		accessToken = await decryptToken(
			connection.access_token_encrypted,
			connection.token_iv,
			encryptionKey
		);
	} catch (e) {
		console.error(`Token decryption failed for user ${userEmail}:`, e);
		return null;
	}

	// Check if refresh needed
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

			// TODO: Store refreshed token in DB
			accessToken = newToken;
		} catch (e) {
			console.error(`Token refresh failed for user ${userEmail}:`, e);
			// Continue with existing token, may still work
		}
	}

	return accessToken;
}

/**
 * Build map of contact ID -> email for attendee matching
 */
async function getContactEmailMap(
	db: D1Database,
	userId: string
): Promise<Map<string, string>> {
	const identities = await queryAll<{ contact_id: string; email: string | null }>(
		db,
		`SELECT ci.contact_id, ci.email
		 FROM contact_identities ci
		 JOIN contacts c ON c.id = ci.contact_id
		 WHERE c.user_id = ? AND ci.email IS NOT NULL`,
		[userId]
	);

	const map = new Map<string, string>();
	for (const row of identities) {
		if (row.email) {
			map.set(row.contact_id, row.email);
		}
	}
	return map;
}

// GET /api/calendar/events - Fetch calendar events for a date range
export const GET: RequestHandler = async ({ url, locals, platform }) => {
	const user = locals.user;
	if (!user) {
		throw error(401, 'Unauthorized');
	}

	const db = platform?.env?.DB;
	const encryptionKey = (platform?.env as unknown as Record<string, string>)?.ENCRYPTION_KEY;
	const clientId = (platform?.env as unknown as Record<string, string>)?.GOOGLE_CLIENT_ID;
	const clientSecret = (platform?.env as unknown as Record<string, string>)?.GOOGLE_CLIENT_SECRET;

	if (!db || !encryptionKey) {
		throw error(500, 'Service not configured');
	}

	// Parse query params for date range
	const startParam = url.searchParams.get('start');
	const endParam = url.searchParams.get('end');

	// Default to current month if no range specified
	const now = new Date();
	const timeMin = startParam
		? new Date(startParam)
		: new Date(now.getFullYear(), now.getMonth(), 1);
	const timeMax = endParam
		? new Date(endParam)
		: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

	// Check if Gmail (which has calendar scope) is connected
	if (!clientId || !clientSecret) {
		// Return empty if Google isn't configured
		return json({ events: [], connected: false });
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
			// User hasn't connected Gmail (which provides calendar access)
			return json({ events: [], connected: false });
		}

		// Fetch events from Google Calendar
		const googleEvents = await fetchGoogleCalendarEvents(accessToken, timeMin, timeMax);

		// Get contact email map for attendee matching
		const contactEmailMap = await getContactEmailMap(db, user.id);

		// Transform to Coms events
		const events = toComsCalendarEvents(googleEvents, contactEmailMap);

		return json({ events, connected: true });
	} catch (e) {
		console.error('Error fetching calendar events:', e);

		// Check if it's an auth error
		if (e instanceof Error && e.message.includes('401')) {
			return json({ events: [], connected: false, error: 'Token expired' });
		}

		throw error(500, 'Failed to fetch calendar events');
	}
};
