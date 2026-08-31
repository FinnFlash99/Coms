import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getPlatformConnection } from '$lib/server/db';
import { decryptToken } from '$lib/server/crypto';
import { refreshAccessToken } from '$lib/server/oauth';

const OPENCHANNELS_URL = 'https://openchannels-api.rwb89mvwwg.workers.dev';

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
			console.error('Token refresh failed:', e);
		}
	}

	return accessToken;
}

/**
 * Sync recent emails from Gmail
 */
async function syncGmailEmails(
	accessToken: string,
	userId: string,
	maxResults = 20
): Promise<{ synced: number; errors: number }> {
	let synced = 0;
	let errors = 0;

	try {
		// Fetch recent messages
		const listResponse = await fetch(
			`https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}&labelIds=INBOX`,
			{ headers: { Authorization: `Bearer ${accessToken}` } }
		);

		if (!listResponse.ok) {
			console.error('Failed to list Gmail messages:', await listResponse.text());
			return { synced: 0, errors: 1 };
		}

		const listData = await listResponse.json() as {
			messages?: Array<{ id: string; threadId: string }>
		};

		if (!listData.messages || listData.messages.length === 0) {
			return { synced: 0, errors: 0 };
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

				// Extract sender name and email
				const fromMatch = from.match(/^(?:"?([^"<]*)"?\s*)?<?([^>]+)>?$/);
				const senderName = fromMatch?.[1]?.trim() || fromMatch?.[2] || from;
				const senderEmail = fromMatch?.[2] || from;

				// Send to OpenChannels for processing
				const ingestResponse = await fetch(`${OPENCHANNELS_URL}/api/ingest`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						userId,
						platform: 'gmail',
						platformThreadId: msgData.threadId,
						platformMessageId: msgData.id,
						senderName,
						senderEmail,
						subject,
						content: msgData.snippet,
						timestamp: parseInt(msgData.internalDate),
						direction: 'inbound'
					})
				});

				if (ingestResponse.ok) {
					synced++;
				} else {
					errors++;
				}
			} catch (e) {
				console.error('Error processing message:', e);
				errors++;
			}
		}

		console.log(`Sync complete: ${synced} synced, ${errors} errors`);
	} catch (e) {
		console.error('Sync error:', e);
		errors++;
	}

	return { synced, errors };
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

		const result = await syncGmailEmails(accessToken, user.id);

		return json({
			success: true,
			message: `Synced ${result.synced} emails`,
			synced: result.synced,
			errors: result.errors
		});
	} catch (e) {
		console.error('Sync endpoint error:', e);
		throw error(500, 'Sync failed');
	}
};
