// Core application types for Coms

export type Platform = 'email' | 'slack' | 'whatsapp' | 'instagram' | 'telegram' | 'teams' | 'discord';

export interface PlatformInfo {
	label: string;
	color: string;
}

export const PLATFORMS: Record<Platform, PlatformInfo> = {
	email: { label: 'Email', color: '#6d92e0' },
	slack: { label: 'Slack', color: '#b478e8' },
	whatsapp: { label: 'WhatsApp', color: '#5cc389' },
	instagram: { label: 'Instagram', color: '#e07ba0' },
	telegram: { label: 'Telegram', color: '#5cb4ec' },
	teams: { label: 'Teams', color: '#7d84f0' },
	discord: { label: 'Discord', color: '#5865f2' }
};

// Mail-style platforms read as subject lines, not chat bubbles.
export const MAIL_PLATFORMS: Platform[] = ['email'];
export function isMailPlatform(platform: Platform): boolean {
	return MAIL_PLATFORMS.includes(platform);
}

// Platform families -- how a message arrives shapes how you answer it.
export interface PlatformFamily {
	id: string;
	label: string;
	platforms: Platform[];
}

export const PLATFORM_FAMILIES: PlatformFamily[] = [
	{ id: 'mail', label: 'Mail', platforms: ['email'] },
	{ id: 'work', label: 'Work chat', platforms: ['slack', 'teams'] },
	{ id: 'personal', label: 'Messaging', platforms: ['whatsapp', 'telegram'] },
	{ id: 'social', label: 'Social', platforms: ['instagram'] }
];

export function familyOf(platform: Platform): { id: string; label: string } {
	const family = PLATFORM_FAMILIES.find((f) => f.platforms.includes(platform));
	return family ? { id: family.id, label: family.label } : { id: 'other', label: 'Other' };
}

export type EventKind = 'meeting' | 'call' | 'deadline' | 'appointment';

export const EVENT_KINDS: Record<EventKind, { label: string; tagVariant: 'accent' | 'outline' | 'alert' | 'neutral' }> = {
	meeting: { label: 'Meeting', tagVariant: 'accent' },
	call: { label: 'Call', tagVariant: 'outline' },
	deadline: { label: 'Deadline', tagVariant: 'alert' },
	appointment: { label: 'Appointment', tagVariant: 'neutral' }
};

export interface CalendarEvent {
	id: string;
	title: string;
	kind: EventKind;
	startTs: number;
	mins: number;
	where: string;
	attendees: string[];
	convIds: string[];
}

export interface FollowUp {
	id: string;
	eventId: string;
	text: string;
	dueTs: number;
	done: boolean;
}

export type NoteKind = 'task' | 'note';

export interface Note {
	id: string;
	text: string;
	kind: NoteKind;
	done: boolean;
	ts: number;
}

export type ContactType = 'Client' | 'Prospect' | 'Subcontractor' | 'Collaborator' | 'Vendor' | 'Personal';
export const TYPES: ContactType[] = ['Client', 'Prospect', 'Subcontractor', 'Collaborator', 'Vendor', 'Personal'];
export type ConnectionStrength = 'Close' | 'Regular' | 'Occasional' | 'New';
export type Importance = 'low' | 'normal' | 'high';
export type MessageDirection = 'inbound' | 'outbound';
export type TabId = 'all' | 'unread' | 'needs' | 'done' | 'urgent';
export type Theme = 'light' | 'dark' | 'system';

export interface Contact {
	id: string;
	name: string;
	// A built-in ContactType, or a user-defined custom group name (see UserPreferences.customTypes).
	type: string;
	connection: ConnectionStrength;
}

export interface Message {
	id: string;
	conversationId: string;
	platform: Platform;
	platformMessageId?: string;
	content: string;
	subject?: string;
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
	dueTs?: number | null;
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

// Either a status tab, or "pf:<platform>" to open filtered to a single platform.
export type DefaultTabId = TabId | `pf:${Platform}`;

export interface UserPreferences {
	theme: Theme;
	defaultTab: DefaultTabId;
	notify: boolean;
	notifyDeadlines: boolean;
	notifyFlagged: boolean;
	notifyUnread: boolean;
	priorityFirst: boolean;
	priority: string[];
	customTypes: string[];
}

export const DEFAULT_PREFERENCES: UserPreferences = {
	theme: 'system',
	defaultTab: 'all',
	notify: true,
	notifyDeadlines: true,
	notifyFlagged: true,
	notifyUnread: false,
	priorityFirst: true,
	priority: ['c1'],
	customTypes: []
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

export function dueLabel(ts: number): string {
	const days = Math.round((ts - Date.now()) / 86400000);
	if (days === 0) return 'today';
	if (days === 1) return 'tomorrow';
	if (days > 1 && days < 7) return 'in ' + days + ' days';
	return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

// <input type="date"> gives a Y-M-D string; a shared key so calendar cells and
// date inputs agree on what "day" a timestamp belongs to.
export function dateKey(ts: number): string {
	const d = new Date(ts);
	return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

export function hhmm(ts: number): string {
	return new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

// All the ways a timestamp might be typed into search -- relative ("yesterday"),
// short absolute ("Aug 24"), full weekday/date, or a bare time.
export function timeText(ts: number): string {
	const d = new Date(ts);
	return [
		relativeTime(ts),
		formatTime(ts),
		d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
		d.toLocaleDateString([], { month: 'short', day: 'numeric' }),
		d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
	]
		.join(' ')
		.toLowerCase();
}
