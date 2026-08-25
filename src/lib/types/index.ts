// Core application types for Coms

export type Platform = 'email' | 'slack' | 'whatsapp' | 'instagram' | 'imessage' | 'teams' | 'discord';

export interface PlatformInfo {
	label: string;
	color: string;
}

export const PLATFORMS: Record<Platform, PlatformInfo> = {
	email: { label: 'Email', color: '#6d92e0' },
	slack: { label: 'Slack', color: '#b478e8' },
	whatsapp: { label: 'WhatsApp', color: '#5cc389' },
	instagram: { label: 'Instagram', color: '#e07ba0' },
	imessage: { label: 'iMessage', color: '#5cb4ec' },
	teams: { label: 'Teams', color: '#7d84f0' },
	discord: { label: 'Discord', color: '#5865f2' }
};

export type ContactType = 'Client' | 'Subcontractor' | 'Vendor' | 'Personal';
export type ConnectionStrength = 'Close' | 'Regular' | 'Occasional' | 'New';
export type Importance = 'low' | 'normal' | 'high';
export type MessageDirection = 'inbound' | 'outbound';
export type TabId = 'all' | 'unread' | 'needs' | 'done' | 'urgent';
export type Theme = 'light' | 'dark' | 'system';

export interface Contact {
	id: string;
	name: string;
	type: ContactType;
	connection: ConnectionStrength;
}

export interface Message {
	id: string;
	conversationId: string;
	platform: Platform;
	platformMessageId?: string;
	content: string;
	senderName: string;
	direction: MessageDirection;
	timestamp: number;
	isRead: boolean;
}

export interface Conversation {
	id: string;
	contactId: string;
	platform: Platform;
	platformThreadId?: string;
	isRead: boolean;
	isResponded: boolean;
	importance: Importance;
	timeSensitive: boolean;
	lastMessageAt: number;
	lastMessagePreview: string;
	messages: Message[];
}

export interface User {
	id: string;
	email: string;
	name?: string;
}

export interface PlatformConnection {
	id: string;
	userId: string;
	platform: Platform;
	status: 'active' | 'expired' | 'revoked';
	platformEmail?: string;
	lastSyncAt?: number;
}

export interface UserPreferences {
	theme: Theme;
	defaultTab: TabId;
	notify: boolean;
	notifyDeadlines: boolean;
	notifyFlagged: boolean;
	notifyUnread: boolean;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
	theme: 'system',
	defaultTab: 'all',
	notify: true,
	notifyDeadlines: true,
	notifyFlagged: true,
	notifyUnread: false
};

export const TABS: Array<[TabId, string]> = [
	['all', 'All'],
	['unread', 'Unread'],
	['needs', 'Needs Response'],
	['done', 'Done'],
	['urgent', 'Urgent']
];

// Utility type for conversation status
export type ConversationStatus = 'unread' | 'needs' | 'done';

export function getConversationStatus(conv: Conversation): ConversationStatus {
	if (!conv.isRead) return 'unread';
	if (!conv.isResponded) return 'needs';
	return 'done';
}

export function getInitials(name: string): string {
	return name
		.split(/[\s(]+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((w) => w[0])
		.join('')
		.toUpperCase();
}

export function relativeTime(timestamp: number): string {
	const d = Date.now() - timestamp;
	if (d < 60000) return 'just now';
	if (d < 3600000) return Math.round(d / 60000) + ' min ago';
	if (d < 86400000) return Math.round(d / 3600000) + ' hr ago';
	const days = Math.round(d / 86400000);
	return days === 1 ? 'yesterday' : days + ' days ago';
}

export function formatTime(timestamp: number): string {
	return new Date(timestamp).toLocaleString([], {
		weekday: 'short',
		hour: 'numeric',
		minute: '2-digit'
	});
}
