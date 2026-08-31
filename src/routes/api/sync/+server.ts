import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getPlatformConnection, queryOne, execute } from '$lib/server/db';
import { decryptToken } from '$lib/server/crypto';
import { refreshAccessToken } from '$lib/server/oauth';

/**
 * Decode HTML entities in a string
 */
function decodeHtmlEntities(text: string): string {
	return text
		.replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)))
		.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&apos;/g, "'")
		.replace(/&nbsp;/g, ' ');
}

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

	const userEmail = connection.platform_email || 'unknown';

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

	// Check if refresh needed (within 60 seconds of expiry)
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
			console.error(`Token refresh failed for user ${userEmail}:`, e);
		}
	}

	return accessToken;
}

function generateId(): string {
	return crypto.randomUUID();
}

/**
 * Find or create a contact for an email sender
 */
async function findOrCreateContact(
	db: D1Database,
	userId: string,
	senderEmail: string,
	senderName: string
): Promise<string> {
	// First check if contact exists via contact_identities
	const existingIdentity = await queryOne<{ contact_id: string }>(
		db,
		`SELECT ci.contact_id FROM contact_identities ci
		 JOIN contacts c ON c.id = ci.contact_id
		 WHERE c.user_id = ? AND ci.email = ?`,
		[userId, senderEmail]
	);

	if (existingIdentity) {
		return existingIdentity.contact_id;
	}

	// Also check contacts directly by handle (the unique constraint is on org_id, channel, handle)
	const existingContact = await queryOne<{ id: string }>(
		db,
		`SELECT id FROM contacts WHERE channel = 'gmail' AND handle = ?`,
		[senderEmail]
	);

	if (existingContact) {
		// Contact exists but may be missing identity - ensure identity exists
		const hasIdentity = await queryOne<{ id: string }>(
			db,
			`SELECT id FROM contact_identities WHERE contact_id = ? AND platform = 'gmail'`,
			[existingContact.id]
		);

		if (!hasIdentity) {
			const identityId = generateId();
			await execute(
				db,
				`INSERT OR IGNORE INTO contact_identities (id, contact_id, platform, platform_user_id, display_name, email)
				 VALUES (?, ?, 'gmail', ?, ?, ?)`,
				[identityId, existingContact.id, senderEmail, senderName, senderEmail]
			);
		}

		return existingContact.id;
	}

	// Create new contact
	const contactId = generateId();
	await execute(
		db,
		`INSERT OR IGNORE INTO contacts (id, user_id, name, channel, handle, contact_type, connection_strength, created_at)
		 VALUES (?, ?, ?, 'gmail', ?, 'other', 'New', datetime('now'))`,
		[contactId, userId, senderName, senderEmail]
	);

	// Check if our insert succeeded or if another concurrent insert won
	const actualContact = await queryOne<{ id: string }>(
		db,
		`SELECT id FROM contacts WHERE channel = 'gmail' AND handle = ?`,
		[senderEmail]
	);

	const finalContactId = actualContact?.id ?? contactId;

	// Create contact identity (use INSERT OR IGNORE for safety)
	const identityId = generateId();
	await execute(
		db,
		`INSERT OR IGNORE INTO contact_identities (id, contact_id, platform, platform_user_id, display_name, email)
		 VALUES (?, ?, 'gmail', ?, ?, ?)`,
		[identityId, finalContactId, senderEmail, senderName, senderEmail]
	);

	return finalContactId;
}

/**
 * Find or create a conversation for a Gmail thread
 */
async function findOrCreateConversation(
	db: D1Database,
	userId: string,
	contactId: string,
	threadId: string,
	subject: string,
	timestamp: number,
	preview: string
): Promise<string> {
	// Check if conversation exists
	const existing = await queryOne<{ id: string }>(
		db,
		`SELECT id FROM conversations
		 WHERE user_id = ? AND platform = 'gmail' AND contact_id = ?`,
		[userId, contactId]
	);

	if (existing) {
		// Update last message time and preview if this is newer
		await execute(
			db,
			`UPDATE conversations SET last_message_at = ?, subject = ?, last_message_preview = ?
			 WHERE id = ? AND (last_message_at IS NULL OR last_message_at < ?)`,
			[timestamp, subject, preview, existing.id, timestamp]
		);
		return existing.id;
	}

	// Create new conversation
	const convId = generateId();
	await execute(
		db,
		`INSERT INTO conversations (id, user_id, contact_id, platform, channel, subject, last_message_at, last_message_preview, created_at, is_read, is_responded, importance, is_time_sensitive)
		 VALUES (?, ?, ?, 'gmail', 'gmail', ?, ?, ?, datetime('now'), 0, 0, 'normal', 0)`,
		[convId, userId, contactId, subject, timestamp, preview]
	);

	return convId;
}

/**
 * Create a message record if it doesn't exist
 */
async function createMessageIfNotExists(
	db: D1Database,
	conversationId: string,
	messageId: string,
	content: string,
	senderName: string
): Promise<boolean> {
	// Check if message already exists
	const existing = await queryOne<{ id: string }>(
		db,
		`SELECT id FROM messages WHERE external_id = ?`,
		[messageId]
	);

	if (existing) {
		return false; // Already exists
	}

	// Create message
	const id = generateId();
	await execute(
		db,
		`INSERT INTO messages (id, conversation_id, external_id, body, author_name, kind, created_at)
		 VALUES (?, ?, ?, ?, ?, 'inbound', datetime('now'))`,
		[id, conversationId, messageId, content, senderName]
	);

	return true;
}

/**
 * Sync recent emails from Gmail directly to D1
 */
async function syncGmailEmails(
	db: D1Database,
	accessToken: string,
	userId: string,
	maxResults = 20
): Promise<{ synced: number; skipped: number; errors: number }> {
	let synced = 0;
	let skipped = 0;
	let errors = 0;

	try {
		// Fetch recent messages
		const listResponse = await fetch(
			`https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}&labelIds=INBOX`,
			{ headers: { Authorization: `Bearer ${accessToken}` } }
		);

		if (!listResponse.ok) {
			console.error('Failed to list Gmail messages:', await listResponse.text());
			return { synced: 0, skipped: 0, errors: 1 };
		}

		const listData = await listResponse.json() as {
			messages?: Array<{ id: string; threadId: string }>
		};

		if (!listData.messages || listData.messages.length === 0) {
			return { synced: 0, skipped: 0, errors: 0 };
		}

		console.log(`Syncing ${listData.messages.length} emails...`);

		// Fetch each message's details
		for (const msg of listData.messages) {
			try {
				const msgResponse = await fetch(
					`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
					{ headers: { Authorization: `Bearer ${accessToken}` } }
				);

				if (!msgResponse.ok) {
					errors++;
					continue;
				}

				const msgData = await msgResponse.json() as {
					id: string;
					threadId: string;
					snippet: string;
					internalDate: string;
					payload?: { headers?: Array<{ name: string; value: string }> };
				};

				const headers = msgData.payload?.headers || [];
				const from = headers.find(h => h.name === 'From')?.value || 'Unknown';
				const subject = headers.find(h => h.name === 'Subject')?.value || '(No subject)';
				const timestamp = parseInt(msgData.internalDate);

				// Extract sender name and email
				const fromMatch = from.match(/^(?:"?([^"<]*)"?\s*)?<?([^>]+)>?$/);
				const senderName = fromMatch?.[1]?.trim() || fromMatch?.[2] || from;
				const senderEmail = fromMatch?.[2] || from;

				// Find or create contact
				const contactId = await findOrCreateContact(db, userId, senderEmail, senderName);

				// Decode HTML entities in snippet
				const snippet = decodeHtmlEntities(msgData.snippet);

				// Find or create conversation
				const conversationId = await findOrCreateConversation(
					db, userId, contactId, msgData.threadId, subject, timestamp, snippet
				);

				// Create message if it doesn't exist
				const created = await createMessageIfNotExists(
					db, conversationId, msgData.id, snippet, senderName
				);

				if (created) {
					synced++;
				} else {
					skipped++;
				}
			} catch (e) {
				console.error('Error processing message:', e);
				errors++;
			}
		}

		console.log(`Sync complete: ${synced} new, ${skipped} skipped, ${errors} errors`);
	} catch (e) {
		console.error('Sync error:', e);
		errors++;
	}

	return { synced, skipped, errors };
}

// POST /api/sync - Manually trigger email sync
export const POST: RequestHandler = async ({ locals, platform }) => {
	const user = locals.user;
	if (!user) {
		throw error(401, 'Unauthorized');
	}

	const db = platform?.env?.DB;
	const env = platform?.env as Record<string, string> | undefined;
	const encryptionKey = env?.ENCRYPTION_KEY;
	const clientId = env?.GOOGLE_CLIENT_ID;
	const clientSecret = env?.GOOGLE_CLIENT_SECRET;

	if (!db || !encryptionKey) {
		throw error(500, 'Service not configured');
	}

	if (!clientId || !clientSecret) {
		return json({ success: false, message: 'Gmail not configured', synced: 0 });
	}

	try {
		const accessToken = await getAccessToken(db, user.id, encryptionKey, clientId, clientSecret);

		if (!accessToken) {
			return json({ success: false, message: 'Gmail not connected', synced: 0 });
		}

		const result = await syncGmailEmails(db, accessToken, user.id);

		return json({
			success: true,
			message: result.synced > 0 ? `Synced ${result.synced} new emails` : 'No new emails',
			synced: result.synced,
			skipped: result.skipped,
			errors: result.errors
		});
	} catch (e) {
		console.error('Sync endpoint error:', e);
		throw error(500, 'Sync failed');
	}
};
