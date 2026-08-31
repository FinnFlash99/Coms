/**
 * OpenChannels API client for Coms frontend
 *
 * This module provides a typed interface to the OpenChannels backend,
 * transforming API responses to match Coms application types.
 */

import type {
	Conversation,
	Contact,
	Message,
	Note,
	Platform,
	Importance,
	MessageDirection
} from '$lib/types';

// Configuration
const API_BASE_URL = import.meta.env.VITE_OPENCHANNELS_URL || 'http://localhost:8787';

// --- API Response Types (what OpenChannels returns) ---

interface ApiContact {
	id: string;
	channel: string;
	handle: string;
	name: string | null;
	profileName: string | null;
	avatarUrl: string | null;
	contactType: string | null;
	connectionStrength: string | null;
}

interface ApiConversation {
	id: string;
	channel: string;
	subject: string | null;
	status: string;
	unread: number;
	lastMessageAt: string;
	lastMessagePreview: string;
	isRead: boolean;
	isResponded: boolean;
	importance: string | null;
	isTimeSensitive: boolean;
	dueTs: number | null;
	contact: ApiContact;
}

interface ApiMessage {
	id: string;
	conversationId: string;
	kind: string;
	body: string;
	authorName: string | null;
	status: string | null;
	error: string | null;
	createdAt: string;
	templateName: string | null;
}

interface ApiNote {
	id: string;
	text: string;
	kind: string;
	done: boolean;
	ts: number;
}

interface ApiListResponse<T> {
	items: T[];
	total?: number;
}

// --- Type Transformers ---

/**
 * Map OpenChannels channel names to Coms Platform type
 */
function toComsChannel(channel: string): Platform {
	const mapping: Record<string, Platform> = {
		gmail: 'email',
		email: 'email',
		slack: 'slack',
		discord: 'discord',
		whatsapp: 'whatsapp',
		telegram: 'telegram',
		sms: 'whatsapp', // Map SMS to WhatsApp for now
		other: 'email'
	};
	return mapping[channel.toLowerCase()] || 'email';
}

/**
 * Map Coms Platform to OpenChannels channel
 */
function toApiChannel(platform: Platform): string {
	const mapping: Record<Platform, string> = {
		email: 'gmail',
		slack: 'slack',
		discord: 'discord',
		whatsapp: 'whatsapp',
		telegram: 'telegram',
		instagram: 'other',
		teams: 'slack' // Map Teams to Slack for now
	};
	return mapping[platform] || 'other';
}

function toComsContact(api: ApiContact): Contact {
	return {
		id: api.id,
		name: api.name || api.profileName || api.handle,
		type: api.contactType || 'Client',
		connection: (api.connectionStrength as Contact['connection']) || 'Regular'
	};
}

function toComsConversation(api: ApiConversation): Conversation {
	return {
		id: api.id,
		contactId: api.contact.id,
		platform: toComsChannel(api.channel),
		platformThreadId: undefined,
		isRead: api.isRead,
		isResponded: api.isResponded,
		importance: (api.importance as Importance) || 'normal',
		timeSensitive: api.isTimeSensitive,
		dueTs: api.dueTs,
		lastMessageAt: new Date(api.lastMessageAt).getTime(),
		lastMessagePreview: api.lastMessagePreview,
		messages: [] // Messages are loaded separately
	};
}

function toComsMessage(api: ApiMessage, platform: Platform): Message {
	const direction: MessageDirection = api.kind === 'inbound' ? 'inbound' : 'outbound';
	return {
		id: api.id,
		conversationId: api.conversationId,
		platform,
		platformMessageId: undefined,
		content: api.body,
		subject: undefined,
		senderName: api.authorName || 'Unknown',
		direction,
		timestamp: new Date(api.createdAt).getTime(),
		isRead: true // Messages in a viewed conversation are read
	};
}

function toComsNote(api: ApiNote): Note {
	return {
		id: api.id,
		text: api.text,
		kind: api.kind === 'task' ? 'task' : 'note',
		done: api.done,
		ts: api.ts
	};
}

// --- API Client ---

async function fetchApi<T>(
	endpoint: string,
	options: RequestInit = {}
): Promise<T> {
	const url = `${API_BASE_URL}${endpoint}`;
	const response = await fetch(url, {
		...options,
		headers: {
			'Content-Type': 'application/json',
			...options.headers
		},
		credentials: 'include'
	});

	if (!response.ok) {
		const errorBody = await response.json().catch(() => ({ error: 'Request failed' })) as { error?: string };
		throw new Error(errorBody.error || `API error: ${response.status}`);
	}

	return response.json();
}

// --- Conversations API ---

export interface ListConversationsParams {
	channel?: Platform;
	status?: 'open' | 'closed' | 'all';
	search?: string;
	limit?: number;
	offset?: number;
}

export async function listConversations(
	params: ListConversationsParams = {}
): Promise<{ conversations: Conversation[]; contacts: Map<string, Contact>; total: number }> {
	const searchParams = new URLSearchParams();
	if (params.channel) searchParams.set('channel', toApiChannel(params.channel));
	if (params.status) searchParams.set('status', params.status);
	if (params.search) searchParams.set('search', params.search);
	if (params.limit) searchParams.set('limit', params.limit.toString());
	if (params.offset) searchParams.set('offset', params.offset.toString());

	const query = searchParams.toString();
	const endpoint = `/api/conversations${query ? `?${query}` : ''}`;

	const response = await fetchApi<ApiListResponse<ApiConversation>>(endpoint);

	const contacts = new Map<string, Contact>();
	const conversations: Conversation[] = [];

	for (const apiConv of response.items) {
		const contact = toComsContact(apiConv.contact);
		contacts.set(contact.id, contact);
		conversations.push(toComsConversation(apiConv));
	}

	return { conversations, contacts, total: response.total || response.items.length };
}

export async function getConversation(id: string): Promise<{ conversation: Conversation; contact: Contact }> {
	const apiConv = await fetchApi<ApiConversation>(`/api/conversations/${id}`);
	return {
		conversation: toComsConversation(apiConv),
		contact: toComsContact(apiConv.contact)
	};
}

export async function getConversationMessages(
	conversationId: string,
	platform: Platform
): Promise<Message[]> {
	const response = await fetchApi<ApiListResponse<ApiMessage>>(
		`/api/conversations/${conversationId}/messages`
	);
	return response.items.map((m) => toComsMessage(m, platform));
}

// --- Conversation Status Updates ---

export async function markConversationRead(id: string): Promise<void> {
	await fetchApi(`/api/conversations/${id}/read`, { method: 'PATCH' });
}

export async function markConversationResponded(id: string): Promise<void> {
	await fetchApi(`/api/conversations/${id}/responded`, { method: 'PATCH' });
}

export async function setConversationImportance(
	id: string,
	importance: Importance
): Promise<void> {
	await fetchApi(`/api/conversations/${id}/importance`, {
		method: 'PATCH',
		body: JSON.stringify({ importance })
	});
}

export async function setConversationUrgent(id: string, urgent: boolean): Promise<void> {
	await fetchApi(`/api/conversations/${id}/urgent`, {
		method: 'PATCH',
		body: JSON.stringify({ urgent })
	});
}

export async function setConversationDue(id: string, dueTs: number | null): Promise<void> {
	await fetchApi(`/api/conversations/${id}/due`, {
		method: 'PATCH',
		body: JSON.stringify({ dueTs })
	});
}

export async function setConversationStatus(
	id: string,
	status: 'open' | 'closed'
): Promise<void> {
	await fetchApi(`/api/conversations/${id}/status`, {
		method: 'PATCH',
		body: JSON.stringify({ status })
	});
}

// --- Notes API ---

export async function listNotes(kind?: 'note' | 'task'): Promise<Note[]> {
	const endpoint = kind ? `/api/notes?kind=${kind}` : '/api/notes';
	const response = await fetchApi<ApiListResponse<ApiNote>>(endpoint);
	return response.items.map(toComsNote);
}

export async function createNote(text: string, kind: 'note' | 'task' = 'note'): Promise<Note> {
	const apiNote = await fetchApi<ApiNote>('/api/notes', {
		method: 'POST',
		body: JSON.stringify({ text, kind })
	});
	return toComsNote(apiNote);
}

export async function updateNote(
	id: string,
	updates: { text?: string; done?: boolean }
): Promise<Note> {
	const apiNote = await fetchApi<ApiNote>(`/api/notes/${id}`, {
		method: 'PATCH',
		body: JSON.stringify(updates)
	});
	return toComsNote(apiNote);
}

export async function deleteNote(id: string): Promise<void> {
	await fetchApi(`/api/notes/${id}`, { method: 'DELETE' });
}

// --- Contacts API ---

export async function listContacts(search?: string): Promise<Contact[]> {
	const endpoint = search ? `/api/contacts?search=${encodeURIComponent(search)}` : '/api/contacts';
	const response = await fetchApi<ApiListResponse<ApiContact>>(endpoint);
	return response.items.map(toComsContact);
}

export async function updateContact(
	id: string,
	updates: { name?: string; contactType?: string; connectionStrength?: string }
): Promise<Contact> {
	const apiContact = await fetchApi<ApiContact>(`/api/contacts/${id}`, {
		method: 'PATCH',
		body: JSON.stringify(updates)
	});
	return toComsContact(apiContact);
}

// --- Ingest API (for sync workers) ---

export interface IngestParams {
	channel: Platform;
	contact: {
		handle: string;
		name?: string;
		avatarUrl?: string;
	};
	message: {
		kind?: 'inbound' | 'outbound';
		body: string;
		externalId?: string;
		at?: string;
		authorName?: string;
	};
	subject?: string;
}

export async function ingestMessage(params: IngestParams): Promise<{
	conversationId: string;
	messageId: string;
	duplicate: boolean;
}> {
	return fetchApi('/api/ingest', {
		method: 'POST',
		body: JSON.stringify({
			...params,
			channel: toApiChannel(params.channel)
		})
	});
}

// --- Health Check ---

export async function healthCheck(): Promise<boolean> {
	try {
		await fetchApi<{ status: string }>('/health');
		return true;
	} catch {
		return false;
	}
}
