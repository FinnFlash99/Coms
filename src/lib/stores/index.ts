import { writable, derived, get } from 'svelte/store';
import {
	type Contact,
	type Conversation,
	type Message,
	type UserPreferences,
	type TabId,
	type Theme,
	type Platform,
	DEFAULT_PREFERENCES,
	getConversationStatus
} from '$lib/types';
import { DEMO_CONTACTS, DEMO_CONVERSATIONS } from './demo-data';

// Theme store
function createThemeStore() {
	const { subscribe, set } = writable<Theme>('system');

	function applyTheme(theme: Theme) {
		const prefersDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
		const dark = theme === 'dark' || (theme === 'system' && prefersDark);
		if (typeof document !== 'undefined') {
			document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
		}
	}

	return {
		subscribe,
		set: (theme: Theme) => {
			set(theme);
			applyTheme(theme);
		},
		init: () => {
			if (typeof window === 'undefined') return;

			// Listen for system theme changes
			const mq = window.matchMedia('(prefers-color-scheme: dark)');
			mq.addEventListener('change', () => {
				const current = get({ subscribe });
				if (current === 'system') {
					applyTheme('system');
				}
			});
		}
	};
}

export const theme = createThemeStore();

// User preferences store with localStorage persistence
function createPreferencesStore() {
	const initial = { ...DEFAULT_PREFERENCES };

	// Load from localStorage on init
	if (typeof window !== 'undefined') {
		try {
			const stored = localStorage.getItem('coms.prefs');
			if (stored) {
				Object.assign(initial, JSON.parse(stored));
			}
		} catch {
			// Ignore localStorage errors
		}
	}

	const { subscribe, set, update } = writable<UserPreferences>(initial);

	return {
		subscribe,
		set: (prefs: UserPreferences) => {
			set(prefs);
			if (typeof window !== 'undefined') {
				try {
					localStorage.setItem('coms.prefs', JSON.stringify(prefs));
				} catch {
					// Ignore localStorage errors
				}
			}
			theme.set(prefs.theme);
		},
		update: (fn: (prefs: UserPreferences) => UserPreferences) => {
			update((current) => {
				const next = fn(current);
				if (typeof window !== 'undefined') {
					try {
						localStorage.setItem('coms.prefs', JSON.stringify(next));
					} catch {
						// Ignore localStorage errors
					}
				}
				theme.set(next.theme);
				return next;
			});
		}
	};
}

export const preferences = createPreferencesStore();

// Contacts store
export const contacts = writable<Contact[]>(DEMO_CONTACTS);

// Conversations store
export const conversations = writable<Conversation[]>(DEMO_CONVERSATIONS);

// Current tab store
export const activeTab = writable<TabId>('all');

// Category filter store
export const categoryFilter = writable<string>('all');

// Welcome screen dismissed
function createWelcomedStore() {
	let initial = false;
	if (typeof window !== 'undefined') {
		initial = localStorage.getItem('coms.welcomed') === '1';
	}

	const { subscribe, set } = writable<boolean>(initial);

	return {
		subscribe,
		dismiss: () => {
			set(true);
			if (typeof window !== 'undefined') {
				localStorage.setItem('coms.welcomed', '1');
			}
		},
		reset: () => {
			set(false);
			if (typeof window !== 'undefined') {
				localStorage.removeItem('coms.welcomed');
			}
		}
	};
}

export const welcomed = createWelcomedStore();

// Toast notification store
function createToastStore() {
	const { subscribe, set } = writable<string>('');
	let timeout: ReturnType<typeof setTimeout> | null = null;

	return {
		subscribe,
		show: (message: string, duration = 2600) => {
			if (timeout) clearTimeout(timeout);
			set(message);
			timeout = setTimeout(() => set(''), duration);
		},
		clear: () => {
			if (timeout) clearTimeout(timeout);
			set('');
		}
	};
}

export const toast = createToastStore();

// Per-thread reply draft text, keyed by conversation id
export const drafts = writable<Record<string, string>>({});

export function setDraft(conversationId: string, text: string) {
	drafts.update((d) => ({ ...d, [conversationId]: text }));
}

// Derived store for filtered conversations
export const filteredConversations = derived(
	[conversations, activeTab, categoryFilter, contacts],
	([$conversations, $activeTab, $categoryFilter, $contacts]) => {
		const contactById = (id: string) => $contacts.find((c) => c.id === id);

		let entries = $conversations.map((conv) => {
			const contact = contactById(conv.contactId);
			const status = getConversationStatus(conv);
			const urgent = conv.timeSensitive && !(conv.isRead && conv.isResponded);

			return {
				...conv,
				contact,
				status,
				urgent
			};
		});

		// Apply category filter
		if ($categoryFilter !== 'all') {
			const [kind, val] = $categoryFilter.split(':');
			entries = entries.filter((e) => {
				if (!e.contact) return false;
				if (kind === 'rel') return e.contact.type === val;
				if (kind === 'con') return e.contact.connection === val;
				return e.platform === val;
			});
		}

		// Apply tab filter
		if ($activeTab === 'urgent') {
			entries = entries.filter((e) => e.urgent);
		} else if ($activeTab !== 'all') {
			entries = entries.filter((e) => e.status === $activeTab);
		}

		// Sort by timestamp
		entries.sort((a, b) => b.lastMessageAt - a.lastMessageAt);

		return entries;
	}
);

// Derived store for counts
export const conversationCounts = derived([conversations, contacts], ([$conversations]) => {
	const counts = { all: 0, unread: 0, needs: 0, done: 0, urgent: 0 };

	$conversations.forEach((conv) => {
		counts.all++;
		const status = getConversationStatus(conv);
		counts[status]++;
		const urgent = conv.timeSensitive && !(conv.isRead && conv.isResponded);
		if (urgent) counts.urgent++;
	});

	return counts;
});

// Action helpers
export function markConversationRead(id: string) {
	conversations.update((convs) =>
		convs.map((c) => (c.id === id ? { ...c, isRead: true } : c))
	);
}

export function markConversationResponded(id: string) {
	conversations.update((convs) =>
		convs.map((c) => (c.id === id ? { ...c, isRead: true, isResponded: true } : c))
	);
}

export function toggleTimeSensitive(id: string) {
	conversations.update((convs) =>
		convs.map((c) => (c.id === id ? { ...c, timeSensitive: !c.timeSensitive } : c))
	);
}

export function updateConversationImportance(id: string, importance: 'low' | 'normal' | 'high') {
	conversations.update((convs) =>
		convs.map((c) => (c.id === id ? { ...c, importance } : c))
	);
}

export function updateContact(id: string, updates: Partial<Contact>) {
	contacts.update((cs) => cs.map((c) => (c.id === id ? { ...c, ...updates } : c)));
}

function outboundMessage(conversationId: string, platform: Platform, content: string, ts: number): Message {
	return {
		id: 'm' + (ts % 10000000),
		conversationId,
		platform,
		direction: 'outbound',
		senderName: 'You',
		content,
		timestamp: ts,
		isRead: true
	};
}

// Replying resolves the thread: read, responded, no longer time-sensitive.
// Returns false if the draft was empty (nothing sent).
export function sendReply(conversationId: string): boolean {
	const text = (get(drafts)[conversationId] || '').trim();
	if (!text) return false;

	const now = Date.now();
	conversations.update((convs) =>
		convs.map((v) =>
			v.id === conversationId
				? {
						...v,
						isRead: true,
						isResponded: true,
						timeSensitive: false,
						lastMessageAt: now,
						lastMessagePreview: text,
						messages: [...v.messages, outboundMessage(v.id, v.platform, text, now)]
					}
				: v
		)
	);
	drafts.update((d) => ({ ...d, [conversationId]: '' }));
	return true;
}

// Sends to a matching contact+platform thread if one exists, else starts a new one.
// Either way it lands read/responded. Returns null if content was empty.
export function sendNewMessage(
	contactId: string,
	platform: Platform,
	content: string
): { conversationId: string } | null {
	const trimmed = content.trim();
	if (!trimmed) return null;

	const now = Date.now();
	let conversationId = '';

	conversations.update((convs) => {
		const existing = convs.find((v) => v.contactId === contactId && v.platform === platform);
		if (existing) {
			conversationId = existing.id;
			return convs.map((v) =>
				v === existing
					? {
							...v,
							isRead: true,
							isResponded: true,
							timeSensitive: false,
							lastMessageAt: now,
							lastMessagePreview: trimmed,
							messages: [...v.messages, outboundMessage(v.id, platform, trimmed, now)]
						}
					: v
			);
		}

		conversationId = 'v' + (now % 10000000);
		return [
			...convs,
			{
				id: conversationId,
				contactId,
				platform,
				isRead: true,
				isResponded: true,
				importance: 'normal' as const,
				timeSensitive: false,
				lastMessageAt: now,
				lastMessagePreview: trimmed,
				messages: [outboundMessage(conversationId, platform, trimmed, now)]
			}
		];
	});

	return { conversationId };
}
