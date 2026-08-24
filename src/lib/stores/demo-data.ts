import type { Contact, Conversation, Message, Platform } from '$lib/types';

const now = Date.now();
const M = 60000; // minute
const H = 3600000; // hour
const D = 86400000; // day

export const DEMO_CONTACTS: Contact[] = [
	{ id: 'c1', name: 'Sarah Chen', type: 'Client', connection: 'Close' },
	{ id: 'c2', name: 'James (TechCo)', type: 'Client', connection: 'Regular' },
	{ id: 'c3', name: 'Ravi Sharma', type: 'Subcontractor', connection: 'Close' },
	{ id: 'c4', name: 'Studio Collective', type: 'Client', connection: 'Occasional' },
	{ id: 'c5', name: 'Anna K.', type: 'Client', connection: 'New' },
	{ id: 'c6', name: 'Brand Co.', type: 'Client', connection: 'Occasional' }
];

function createMessage(
	id: string,
	conversationId: string,
	platform: Platform,
	direction: 'inbound' | 'outbound',
	senderName: string,
	content: string,
	timestamp: number
): Message {
	return {
		id,
		conversationId,
		platform,
		direction,
		senderName,
		content,
		timestamp,
		isRead: direction === 'outbound'
	};
}

export const DEMO_CONVERSATIONS: Conversation[] = [
	{
		id: 'v1',
		contactId: 'c1',
		platform: 'slack',
		isRead: false,
		isResponded: false,
		importance: 'high',
		timeSensitive: true,
		lastMessageAt: now - 25 * M,
		lastMessagePreview: "Can we move tomorrow's meeting to 3pm?",
		messages: [
			createMessage('m1a', 'v1', 'slack', 'outbound', 'You', 'Sent over the homepage concepts — let me know your thoughts before our sync.', now - 3 * H),
			createMessage('m1b', 'v1', 'slack', 'inbound', 'Sarah Chen', 'These look great. A few small notes on the hero section coming your way.', now - 90 * M),
			createMessage('m1c', 'v1', 'slack', 'inbound', 'Sarah Chen', "Can we move tomorrow's meeting to 3pm?", now - 25 * M)
		]
	},
	{
		id: 'v2',
		contactId: 'c2',
		platform: 'whatsapp',
		isRead: false,
		isResponded: false,
		importance: 'normal',
		timeSensitive: false,
		lastMessageAt: now - 2 * H,
		lastMessagePreview: 'Just checking in — did you get my message?',
		messages: [
			createMessage('m2a', 'v2', 'whatsapp', 'inbound', 'James', 'Just checking in — did you get my message?', now - 2 * H)
		]
	},
	{
		id: 'v3',
		contactId: 'c2',
		platform: 'slack',
		isRead: true,
		isResponded: true,
		importance: 'normal',
		timeSensitive: false,
		lastMessageAt: now - 25 * H,
		lastMessagePreview: 'Got it — will review tonight and send comments.',
		messages: [
			createMessage('m3a', 'v3', 'slack', 'inbound', 'James', 'Contract draft is in your inbox whenever you have a sec.', now - 26 * H),
			createMessage('m3b', 'v3', 'slack', 'outbound', 'You', 'Got it — will review tonight and send comments.', now - 25 * H)
		]
	},
	{
		id: 'v4',
		contactId: 'c2',
		platform: 'email',
		isRead: true,
		isResponded: true,
		importance: 'normal',
		timeSensitive: false,
		lastMessageAt: now - 3 * D + 2 * H,
		lastMessagePreview: 'Thanks James, scope looks right. Signed copy attached.',
		messages: [
			createMessage('m4a', 'v4', 'email', 'inbound', 'James', 'Re: Q3 retainer — attached the updated scope document.', now - 3 * D),
			createMessage('m4b', 'v4', 'email', 'outbound', 'You', 'Thanks James, scope looks right. Signed copy attached.', now - 3 * D + 2 * H)
		]
	},
	{
		id: 'v5',
		contactId: 'c3',
		platform: 'email',
		isRead: true,
		isResponded: false,
		importance: 'normal',
		timeSensitive: false,
		lastMessageAt: now - 4 * H,
		lastMessagePreview: "I've sent over the revised files. Let me know what you think.",
		messages: [
			createMessage('m5a', 'v5', 'email', 'outbound', 'You', 'Ravi — any update on the revised illustrations?', now - 8 * H),
			createMessage('m5b', 'v5', 'email', 'inbound', 'Ravi Sharma', "I've sent over the revised files. Let me know what you think.", now - 4 * H)
		]
	},
	{
		id: 'v6',
		contactId: 'c3',
		platform: 'slack',
		isRead: true,
		isResponded: true,
		importance: 'normal',
		timeSensitive: false,
		lastMessageAt: now - 2 * D + H,
		lastMessagePreview: 'Great — reference board is in the shared folder 👍',
		messages: [
			createMessage('m6a', 'v6', 'slack', 'inbound', 'Ravi Sharma', 'Kicking off the icon set today.', now - 2 * D),
			createMessage('m6b', 'v6', 'slack', 'outbound', 'You', 'Great — reference board is in the shared folder 👍', now - 2 * D + H)
		]
	},
	{
		id: 'v7',
		contactId: 'c4',
		platform: 'slack',
		isRead: true,
		isResponded: true,
		importance: 'normal',
		timeSensitive: false,
		lastMessageAt: now - 24 * H,
		lastMessagePreview: "Thanks! We'll review the timeline and get back to you.",
		messages: [
			createMessage('m7a', 'v7', 'slack', 'outbound', 'You', "Here's the delivery timeline for the rebrand — phased over six weeks.", now - 26 * H),
			createMessage('m7b', 'v7', 'slack', 'inbound', 'Studio Collective', "Thanks! We'll review the timeline and get back to you.", now - 24 * H)
		]
	},
	{
		id: 'v8',
		contactId: 'c5',
		platform: 'email',
		isRead: true,
		isResponded: true,
		importance: 'low',
		timeSensitive: false,
		lastMessageAt: now - 2 * D,
		lastMessagePreview: 'Perfect, thank you!',
		messages: [
			createMessage('m8a', 'v8', 'email', 'outbound', 'You', 'Final invoice attached — thanks for a smooth project!', now - 2 * D - H),
			createMessage('m8b', 'v8', 'email', 'inbound', 'Anna K.', 'Perfect, thank you!', now - 2 * D)
		]
	},
	{
		id: 'v9',
		contactId: 'c6',
		platform: 'whatsapp',
		isRead: true,
		isResponded: false,
		importance: 'normal',
		timeSensitive: false,
		lastMessageAt: now - 3 * D,
		lastMessagePreview: 'Could you send us a revised quote?',
		messages: [
			createMessage('m9a', 'v9', 'whatsapp', 'inbound', 'Brand Co.', 'Could you send us a revised quote?', now - 3 * D)
		]
	}
];

export function generateDemoMessage(contact: Contact, content: string): Message {
	const timestamp = Date.now();
	return {
		id: 'm' + (timestamp % 10000000),
		conversationId: '',
		platform: 'slack',
		direction: 'inbound',
		senderName: contact.name.split(' (')[0],
		content: content.trim() || 'Hey — quick question when you have a minute.',
		timestamp,
		isRead: false
	};
}
