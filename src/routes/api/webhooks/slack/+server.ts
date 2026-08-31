import { json, error, text } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { queryAll } from '$lib/server/db';

const OPENCHANNELS_URL =
	import.meta.env.VITE_OPENCHANNELS_URL || 'https://openchannels-api.rwb89mvwwg.workers.dev';

// Slack event types
interface SlackUrlVerification {
	type: 'url_verification';
	challenge: string;
	token: string;
}

interface SlackEventCallback {
	type: 'event_callback';
	team_id: string;
	event: SlackEvent;
}

interface SlackEvent {
	type: string;
	subtype?: string;
	channel: string;
	user: string;
	text?: string;
	ts: string;
	channel_type?: string;
}

type SlackPayload = SlackUrlVerification | SlackEventCallback;

/**
 * Verify Slack request signature using HMAC-SHA256
 * See: https://api.slack.com/authentication/verifying-requests-from-slack
 */
async function verifySlackSignature(
	signingSecret: string,
	signature: string | null,
	timestamp: string | null,
	body: string
): Promise<boolean> {
	if (!signature || !timestamp) {
		return false;
	}

	// Reject requests older than 5 minutes (replay protection)
	const now = Math.floor(Date.now() / 1000);
	if (Math.abs(now - parseInt(timestamp, 10)) > 60 * 5) {
		return false;
	}

	// Compute expected signature
	const sigBaseString = `v0:${timestamp}:${body}`;
	const encoder = new TextEncoder();
	const key = await crypto.subtle.importKey(
		'raw',
		encoder.encode(signingSecret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);
	const signatureBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(sigBaseString));
	const expectedSignature = 'v0=' + Array.from(new Uint8Array(signatureBytes))
		.map(b => b.toString(16).padStart(2, '0'))
		.join('');

	// Constant-time comparison
	if (signature.length !== expectedSignature.length) {
		return false;
	}
	let result = 0;
	for (let i = 0; i < signature.length; i++) {
		result |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
	}
	return result === 0;
}

/**
 * Find user ID by Slack team ID
 * This looks up which user has connected this Slack workspace
 */
async function findUserBySlackTeam(
	db: D1Database,
	teamId: string
): Promise<string | null> {
	// TODO: Query by team_id once stored during OAuth
	// For now, we'll search for any active Slack connection and log the team
	console.log('Looking up user for Slack team:', teamId);
	const connections = await queryAll<{ user_id: string }>(
		db,
		`SELECT user_id FROM platform_connections
		 WHERE platform = 'slack' AND status = 'active'
		 LIMIT 1`
	);
	return connections[0]?.user_id || null;
}

/**
 * Forward message to OpenChannels ingest API
 */
async function ingestMessage(params: {
	channel: string;
	contactHandle: string;
	contactName?: string;
	messageBody: string;
	externalId: string;
	timestamp: string;
}): Promise<void> {
	const response = await fetch(`${OPENCHANNELS_URL}/api/ingest`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			channel: 'slack',
			contact: {
				handle: params.contactHandle,
				name: params.contactName
			},
			message: {
				kind: 'inbound',
				body: params.messageBody,
				externalId: params.externalId,
				at: params.timestamp
			}
		})
	});

	if (!response.ok) {
		console.error('Failed to ingest message:', await response.text());
	}
}

// POST /api/webhooks/slack - Receive Slack events
export const POST: RequestHandler = async ({ request, platform }) => {
	const signingSecret = (platform?.env as unknown as Record<string, string>)?.SLACK_SIGNING_SECRET;

	if (!signingSecret) {
		console.error('SLACK_SIGNING_SECRET not configured');
		throw error(500, 'Webhook not configured');
	}

	// Get raw body for signature verification
	const rawBody = await request.text();

	// Verify signature
	const signature = request.headers.get('x-slack-signature');
	const timestamp = request.headers.get('x-slack-request-timestamp');

	const isValid = await verifySlackSignature(signingSecret, signature, timestamp, rawBody);
	if (!isValid) {
		console.error('Invalid Slack signature');
		throw error(401, 'Invalid signature');
	}

	// Parse the verified body
	const payload: SlackPayload = JSON.parse(rawBody);

	// Handle URL verification challenge
	if (payload.type === 'url_verification') {
		return text(payload.challenge, {
			headers: { 'Content-Type': 'text/plain' }
		});
	}

	// Handle event callbacks
	if (payload.type === 'event_callback') {
		const event = payload.event;

		// Only process message events
		if (event.type === 'message' && event.text && !event.subtype) {
			const db = platform?.env.DB;
			if (!db) {
				console.error('Database not available');
				throw error(500, 'Database not available');
			}

			// Find the user who connected this Slack workspace
			const userId = await findUserBySlackTeam(db, payload.team_id);
			if (!userId) {
				console.log('No user found for Slack team:', payload.team_id);
				// Still return 200 to acknowledge receipt
				return json({ ok: true });
			}

			// Ingest the message
			try {
				await ingestMessage({
					channel: event.channel,
					contactHandle: event.user,
					messageBody: event.text,
					externalId: event.ts,
					timestamp: new Date(parseFloat(event.ts) * 1000).toISOString()
				});
			} catch (e) {
				console.error('Error ingesting Slack message:', e);
			}
		}

		return json({ ok: true });
	}

	return json({ ok: true });
};
