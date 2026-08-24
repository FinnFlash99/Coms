import { writable, derived, get } from 'svelte/store';
import {
	type Contact,
	type Conversation,
	type UserPreferences,
	type TabId,
	type Theme,
	DEFAULT_PREFERENCES,
	getConversationStatus
} from '$lib/types';
import { DEMO_CONTACTS, DEMO_CONVERSATIONS, generateDemoMessage } from './demo-data';

// Theme store
function createThemeStore() {
	const { subscribe, set, update } = writable<Theme>('system');

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
export const conversationCounts = derived([conversations, contacts], ([$conversations, $contacts]) => {
	const contactById = (id: string) => $contacts.find((c) => c.id === id);

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

export function simulateMessage(
	contactId: string,
	platform: string,
	content: string,
	importance: 'low' | 'normal' | 'high',
	timeSensitive: boolean
) {
	const contact = get(contacts).find((c) => c.id === contactId);
	if (!contact) return;

	const message = generateDemoMessage(contact, content);
	const autoTs =
		/\b(today|tomorrow|tonight|asap|urgent|deadline|by (mon|tue|wed|thu|fri|sat|sun|end)|\d{1,2}\s?(am|pm))\b/i.test(
			content
		);

	conversations.update((convs) => {
		const existing = convs.find((v) => v.contactId === contactId && v.platform === platform);

		if (existing) {
			return convs.map((v) =>
				v === existing
					? {
							...v,
							isRead: false,
							isResponded: false,
							importance: importance !== 'normal' ? importance : v.importance,
							timeSensitive: v.timeSensitive || timeSensitive || autoTs,
							lastMessageAt: message.timestamp,
							lastMessagePreview: message.content,
							messages: [...v.messages, message]
						}
					: v
			);
		} else {
			return [
				...convs,
				{
					id: 'v' + (Date.now() % 10000000),
					contactId,
					platform: platform as any,
					isRead: false,
					isResponded: false,
					importance,
					timeSensitive: timeSensitive || autoTs,
					lastMessageAt: message.timestamp,
					lastMessagePreview: message.content,
					messages: [message]
				}
			];
		}
	});

	return timeSensitive || autoTs;
}
