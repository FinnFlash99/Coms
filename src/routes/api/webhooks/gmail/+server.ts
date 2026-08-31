import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { queryOne, execute } from '$lib/server/db';
import { decryptToken } from '$lib/server/crypto';
import { refreshAccessToken } from '$lib/server/oauth';

const OPENCHANNELS_URL =
	import.meta.env.VITE_OPENCHANNELS_URL || 'https://openchannels-api.rwb89mvwwg.workers.dev';

// Google Pub/Sub notification format
interface PubSubMessage {
	message: {
		data: string; // Base64-encoded JSON
		messageId: string;
		publishTime: string;
	};
	subscription: string;
}

interface GmailNotification {
	emailAddress: string;
	historyId: string;
}

interface GmailMessage {
	id: string;
	threadId: string;
	snippet: string;
	payload?: {
		headers?: Array<{ name: string; value: string }>;
		body?: { data?: string };
		parts?: Array<{ mimeType: string; body?: { data?: string } }>;
	};
	internalDate?: string;
}

interface GmailHistoryResponse {
	history?: Array<{
		messagesAdded?: Array<{ message: { id: string; threadId: string } }>;
	}>;
	historyId: string;
}

/**
 * Get decrypted access token for a user's Gmail connection
 */
async function getAccessToken(
	db: D1Database,
	userId: string,
	encryptionKey: string,
	userEmail: string
): Promise<{ token: string; needsRefresh: boolean } | null> {
	const connection = await queryOne<{
		access_token_encrypted: string;
		refresh_token_encrypted: string | null;
		token_iv: string;
		token_expires_at: number | null;
	}>(
		db,
		'SELECT access_token_encrypted, refresh_token_encrypted, token_iv, token_expires_at FROM platform_connections WHERE user_id = ? AND platform = ?',
		[userId, 'gmail']
	);

	if (!connection) return null;

	let token: string;
	try {
		token = await decryptToken(
			connection.access_token_encrypted,
			connection.token_iv,
			encryptionKey
		);
	} catch (e) {
		console.error(`Token decryption failed for user ${userEmail}:`, e);
		return null;
	}

	const needsRefresh = connection.token_expires_at
		? connection.token_expires_at < Math.floor(Date.now() / 1000) + 60
		: false;

	return { token, needsRefresh };
}

/**
 * Refresh and update access token
 */
async function refreshAndUpdateToken(
	db: D1Database,
	userId: string,
	encryptionKey: string,
	clientId: string,
	clientSecret: string,
	userEmail: string
): Promise<string | null> {
	const connection = await queryOne<{
		refresh_token_encrypted: string | null;
		token_iv: string;
	}>(
		db,
		'SELECT refresh_token_encrypted, token_iv FROM platform_connections WHERE user_id = ? AND platform = ?',
		[userId, 'gmail']
	);

	if (!connection?.refresh_token_encrypted) return null;

	let refreshToken: string;
	try {
		refreshToken = await decryptToken(
			connection.refresh_token_encrypted,
			connection.token_iv,
			encryptionKey
		);
	} catch (e) {
		console.error(`Refresh token decryption failed for user ${userEmail}:`, e);
		return null;
	}

	try {
		const { accessToken, expiresIn } = await refreshAccessToken(
			'gmail',
			refreshToken,
			clientId,
			clientSecret
		);

		// Update the token in DB (re-encrypt with same IV for simplicity)
		const encoder = new TextEncoder();
		const key = await crypto.subtle.importKey(
			'raw',
			hexToBytes(encryptionKey),
			{ name: 'AES-GCM' },
			false,
			['encrypt']
		);
		const iv = hexToBytes(connection.token_iv);
		const encryptedBytes = await crypto.subtle.encrypt(
			{ name: 'AES-GCM', iv },
			key,
			encoder.encode(accessToken)
		);
		const encryptedHex = bytesToHex(encryptedBytes);

		const expiresAt = expiresIn
			? Math.floor(Date.now() / 1000) + expiresIn
			: null;

		await execute(
			db,
			`UPDATE platform_connections
			 SET access_token_encrypted = ?, token_expires_at = ?, updated_at = ?
			 WHERE user_id = ? AND platform = ?`,
			[encryptedHex, expiresAt, Math.floor(Date.now() / 1000), userId, 'gmail']
		);

		return accessToken;
	} catch (e) {
		console.error(`Token refresh failed for user ${userEmail}:`, e);
		return null;
	}
}

function hexToBytes(hex: string): ArrayBuffer {
	const bytes = new Uint8Array(hex.length / 2);
	for (let i = 0; i < hex.length; i += 2) {
		bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
	}
	return bytes.buffer;
}

function bytesToHex(buffer: ArrayBuffer): string {
	return Array.from(new Uint8Array(buffer))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}

/**
 * Fetch new messages from Gmail API using history
 */
async function fetchNewMessages(
	accessToken: string,
	historyId: string,
	startHistoryId: string | null
): Promise<GmailMessage[]> {
	// If we don't have a previous historyId, just get recent messages
	if (!startHistoryId) {
		const response = await fetch(
			`https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10`,
			{ headers: { Authorization: `Bearer ${accessToken}` } }
		);
		if (!response.ok) {
			console.error('Gmail API error:', await response.text());
			return [];
		}
		const data = await response.json() as { messages?: Array<{ id: string }> };
		if (!data.messages) return [];

		// Fetch full message details
		const messages: GmailMessage[] = [];
		for (const msg of data.messages.slice(0, 5)) {
			const msgResponse = await fetch(
				`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
				{ headers: { Authorization: `Bearer ${accessToken}` } }
			);
			if (msgResponse.ok) {
				messages.push(await msgResponse.json());
			}
		}
		return messages;
	}

	// Get history since last sync
	const historyResponse = await fetch(
		`https://gmail.googleapis.com/gmail/v1/users/me/history?startHistoryId=${startHistoryId}`,
		{ headers: { Authorization: `Bearer ${accessToken}` } }
	);

	if (!historyResponse.ok) {
		console.error('Gmail history API error:', await historyResponse.text());
		return [];
	}

	const historyData: GmailHistoryResponse = await historyResponse.json();
	if (!historyData.history) return [];

	// Get message IDs from history
	const messageIds = new Set<string>();
	for (const entry of historyData.history) {
		if (entry.messagesAdded) {
			for (const added of entry.messagesAdded) {
				messageIds.add(added.message.id);
			}
		}
	}

	// Fetch full message details
	const messages: GmailMessage[] = [];
	for (const id of messageIds) {
		const msgResponse = await fetch(
			`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`,
			{ headers: { Authorization: `Bearer ${accessToken}` } }
		);
		if (msgResponse.ok) {
			messages.push(await msgResponse.json());
		}
	}

	return messages;
}

/**
 * Extract header value from Gmail message
 */
function getHeader(message: GmailMessage, name: string): string | undefined {
	return message.payload?.headers?.find(
		(h) => h.name.toLowerCase() === name.toLowerCase()
	)?.value;
}

/**
 * Extract plain text body from Gmail message
 */
function getMessageBody(message: GmailMessage): string {
	// Try to get body from parts
	if (message.payload?.parts) {
		const textPart = message.payload.parts.find(
			(p) => p.mimeType === 'text/plain'
		);
		if (textPart?.body?.data) {
			return atob(textPart.body.data.replace(/-/g, '+').replace(/_/g, '/'));
		}
	}

	// Try direct body
	if (message.payload?.body?.data) {
		return atob(message.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
	}

	// Fall back to snippet
	return message.snippet || '';
}

/**
 * Forward message to OpenChannels ingest API
 */
async function ingestMessage(params: {
	contactHandle: string;
	contactName?: string;
	messageBody: string;
	subject?: string;
	externalId: string;
	timestamp: string;
}): Promise<void> {
	const response = await fetch(`${OPENCHANNELS_URL}/api/ingest`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			channel: 'gmail',
			contact: {
				handle: params.contactHandle,
				name: params.contactName
			},
			message: {
				kind: 'inbound',
				body: params.messageBody,
				externalId: params.externalId,
				at: params.timestamp
			},
			subject: params.subject
		})
	});

	if (!response.ok) {
		console.error('Failed to ingest Gmail message:', await response.text());
	}
}

// POST /api/webhooks/gmail - Receive Gmail Pub/Sub notifications
export const POST: RequestHandler = async ({ request, platform }) => {
	const db = platform?.env?.DB;
	const encryptionKey = (platform?.env as unknown as Record<string, string>)?.ENCRYPTION_KEY;
	const clientId = (platform?.env as unknown as Record<string, string>)?.GOOGLE_CLIENT_ID;
	const clientSecret = (platform?.env as unknown as Record<string, string>)?.GOOGLE_CLIENT_SECRET;

	if (!db || !encryptionKey || !clientId || !clientSecret) {
		console.error('Gmail webhook: Missing required configuration');
		throw error(500, 'Webhook not configured');
	}

	// Parse Pub/Sub message
	const payload: PubSubMessage = await request.json();

	// Decode the notification data
	let notification: GmailNotification;
	try {
		const decoded = atob(payload.message.data);
		notification = JSON.parse(decoded);
	} catch (e) {
		console.error('Failed to decode Pub/Sub message:', e);
		throw error(400, 'Invalid message format');
	}

	console.log('Gmail notification for:', notification.emailAddress, 'historyId:', notification.historyId);

	// Find user by email
	const user = await queryOne<{ id: string }>(
		db,
		'SELECT u.id FROM users u JOIN platform_connections pc ON u.id = pc.user_id WHERE pc.platform = ? AND pc.platform_email = ?',
		['gmail', notification.emailAddress]
	);

	if (!user) {
		// Also try looking up by email in users table
		const userByEmail = await queryOne<{ id: string }>(
			db,
			'SELECT id FROM users WHERE email = ?',
			[notification.emailAddress]
		);
		if (!userByEmail) {
			console.log('No user found for email:', notification.emailAddress);
			return json({ ok: true }); // Acknowledge but don't process
		}
	}

	const userId = user?.id;
	if (!userId) {
		return json({ ok: true });
	}

	// Get access token
	let tokenResult = await getAccessToken(db, userId, encryptionKey, notification.emailAddress);
	if (!tokenResult) {
		console.error(`No Gmail connection found for user ${notification.emailAddress}`);
		return json({ ok: true });
	}

	// Refresh if needed
	if (tokenResult.needsRefresh) {
		const newToken = await refreshAndUpdateToken(
			db,
			userId,
			encryptionKey,
			clientId,
			clientSecret,
			notification.emailAddress
		);
		if (newToken) {
			tokenResult = { token: newToken, needsRefresh: false };
		} else {
			console.error(`Failed to refresh Gmail token for user ${notification.emailAddress}`);
			return json({ ok: true });
		}
	}

	// Get previous historyId (stored in sync_cursor)
	const connection = await queryOne<{ sync_cursor: string | null }>(
		db,
		'SELECT sync_cursor FROM platform_connections WHERE user_id = ? AND platform = ?',
		[userId, 'gmail']
	);

	// Fetch new messages
	const messages = await fetchNewMessages(
		tokenResult.token,
		notification.historyId,
		connection?.sync_cursor || null
	);

	console.log(`Fetched ${messages.length} new Gmail messages`);

	// Ingest each message
	for (const message of messages) {
		const from = getHeader(message, 'From') || '';
		const subject = getHeader(message, 'Subject');
		const body = getMessageBody(message);

		// Parse sender info (format: "Name <email@example.com>" or just "email@example.com")
		const emailMatch = from.match(/<([^>]+)>/) || from.match(/([^\s]+@[^\s]+)/);
		const email = emailMatch ? emailMatch[1] : from;
		const name = from.replace(/<[^>]+>/, '').trim() || undefined;

		try {
			await ingestMessage({
				contactHandle: email,
				contactName: name,
				messageBody: body.slice(0, 10000), // Limit body size
				subject,
				externalId: message.id,
				timestamp: message.internalDate
					? new Date(parseInt(message.internalDate, 10)).toISOString()
					: new Date().toISOString()
			});
		} catch (e) {
			console.error('Error ingesting Gmail message:', e);
		}
	}

	// Update sync cursor to new historyId
	await execute(
		db,
		'UPDATE platform_connections SET sync_cursor = ?, last_sync_at = ? WHERE user_id = ? AND platform = ?',
		[notification.historyId, Math.floor(Date.now() / 1000), userId, 'gmail']
	);

	return json({ ok: true });
};
