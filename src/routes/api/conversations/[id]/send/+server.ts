import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getConversationById, queryOne, updateConversation, getPlatformConnection } from '$lib/server/db';
import { decryptToken } from '$lib/server/crypto';
import { refreshAccessToken } from '$lib/server/oauth';

const OPENCHANNELS_URL =
	import.meta.env.VITE_OPENCHANNELS_URL || 'https://openchannels-api.rwb89mvwwg.workers.dev';

/**
 * Send email via Gmail API
 */
async function sendGmail(
	accessToken: string,
	to: string,
	subject: string,
	body: string,
	threadId?: string
): Promise<{ messageId: string }> {
	// Construct raw email
	const emailLines = [
		`To: ${to}`,
		`Subject: ${subject}`,
		'Content-Type: text/plain; charset=utf-8',
		'',
		body
	];
	const rawEmail = btoa(emailLines.join('\r\n'))
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=+$/, '');

	const requestBody: { raw: string; threadId?: string } = { raw: rawEmail };
	if (threadId) {
		requestBody.threadId = threadId;
	}

	const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${accessToken}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(requestBody)
	});

	if (!response.ok) {
		const errorText = await response.text();
		console.error('Gmail send error:', errorText);
		throw new Error(`Gmail API error: ${response.status}`);
	}

	const result = await response.json() as { id: string };
	return { messageId: result.id };
}

/**
 * Send message via Slack API
 */
async function sendSlack(
	accessToken: string,
	channel: string,
	text: string,
	threadTs?: string
): Promise<{ messageId: string }> {
	const requestBody: { channel: string; text: string; thread_ts?: string } = {
		channel,
		text
	};
	if (threadTs) {
		requestBody.thread_ts = threadTs;
	}

	const response = await fetch('https://slack.com/api/chat.postMessage', {
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${accessToken}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(requestBody)
	});

	if (!response.ok) {
		const errorText = await response.text();
		console.error('Slack send error:', errorText);
		throw new Error(`Slack API error: ${response.status}`);
	}

	const result = await response.json() as { ok: boolean; ts?: string; error?: string };
	if (!result.ok) {
		throw new Error(`Slack error: ${result.error}`);
	}

	return { messageId: result.ts || '' };
}

/**
 * Get decrypted access token, refreshing if needed
 */
async function getAccessToken(
	db: D1Database,
	userId: string,
	platform: string,
	encryptionKey: string,
	clientId: string,
	clientSecret: string
): Promise<string | null> {
	const connection = await getPlatformConnection(db, userId, platform);
	if (!connection) return null;

	// Decrypt current token
	let accessToken = await decryptToken(
		connection.access_token_encrypted,
		connection.token_iv,
		encryptionKey
	);

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

			const oauthPlatform = platform === 'gmail' ? 'gmail' : 'slack';
			const { accessToken: newToken } = await refreshAccessToken(
				oauthPlatform,
				refreshToken,
				clientId,
				clientSecret
			);

			// TODO: Store refreshed token in DB
			accessToken = newToken;
		} catch (e) {
			console.error('Token refresh failed:', e);
			// Continue with existing token, may still work
		}
	}

	return accessToken;
}

/**
 * Store outbound message in OpenChannels
 */
async function storeOutboundMessage(
	conversationId: string,
	content: string,
	platform: string,
	externalId: string
): Promise<void> {
	// Use OpenChannels internal API or direct DB insert
	// For now, we'll call the ingest endpoint with outbound kind
	const response = await fetch(`${OPENCHANNELS_URL}/api/conversations/${conversationId}/messages`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			kind: 'outbound',
			body: content,
			externalId,
			authorName: 'Me'
		})
	});

	if (!response.ok) {
		console.error('Failed to store outbound message:', await response.text());
	}
}

// POST /api/conversations/[id]/send - Send a message in a conversation
export const POST: RequestHandler = async ({ params, request, locals, platform }) => {
	const user = locals.user;
	if (!user) {
		throw error(401, 'Unauthorized');
	}

	const db = platform?.env?.DB;
	const encryptionKey = (platform?.env as unknown as Record<string, string>)?.ENCRYPTION_KEY;

	if (!db || !encryptionKey) {
		throw error(500, 'Service not configured');
	}

	// Get request body
	const body = await request.json() as { content: string; subject?: string };
	if (!body.content?.trim()) {
		throw error(400, 'Message content is required');
	}

	try {
		// Get conversation
		const conversation = await getConversationById(db, params.id);
		if (!conversation) {
			throw error(404, 'Conversation not found');
		}
		if (conversation.user_id !== user.id) {
			throw error(403, 'Forbidden');
		}

		// Get contact for recipient info
		const contact = await queryOne<{ handle?: string; platform_user_id?: string }>(
			db,
			'SELECT handle, platform_user_id FROM contacts WHERE id = ?',
			[conversation.contact_id]
		);
		if (!contact) {
			throw error(404, 'Contact not found');
		}

		// Determine platform and get credentials
		const convPlatform = conversation.platform;
		const oauthPlatform = convPlatform === 'email' ? 'gmail' : convPlatform;

		// Get OAuth credentials from environment
		const env = platform?.env as unknown as Record<string, string>;
		let clientId: string | undefined;
		let clientSecret: string | undefined;

		if (oauthPlatform === 'gmail') {
			clientId = env?.GOOGLE_CLIENT_ID;
			clientSecret = env?.GOOGLE_CLIENT_SECRET;
		} else if (oauthPlatform === 'slack') {
			clientId = env?.SLACK_CLIENT_ID;
			clientSecret = env?.SLACK_CLIENT_SECRET;
		}

		if (!clientId || !clientSecret) {
			throw error(500, `${oauthPlatform} not configured`);
		}

		// Get access token
		const accessToken = await getAccessToken(
			db,
			user.id,
			oauthPlatform,
			encryptionKey,
			clientId,
			clientSecret
		);

		if (!accessToken) {
			throw error(400, `Not connected to ${oauthPlatform}`);
		}

		// Send via platform
		let messageId: string;

		if (oauthPlatform === 'gmail') {
			const recipient = contact.handle || '';
			const subject = body.subject || 'Re: Conversation';
			const result = await sendGmail(accessToken, recipient, subject, body.content);
			messageId = result.messageId;
		} else if (oauthPlatform === 'slack') {
			const channel = contact.platform_user_id || contact.handle || '';
			const result = await sendSlack(accessToken, channel, body.content);
			messageId = result.messageId;
		} else {
			throw error(400, `Unsupported platform: ${convPlatform}`);
		}

		// Store outbound message
		await storeOutboundMessage(params.id, body.content, convPlatform, messageId);

		// Mark conversation as responded
		await updateConversation(db, params.id, { is_responded: true, is_read: true });

		return json({ success: true, messageId });
	} catch (e) {
		if ((e as { status?: number }).status) throw e;
		console.error('Error sending message:', e);
		throw error(500, 'Failed to send message');
	}
};
