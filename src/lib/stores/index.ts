import { goto } from '$app/navigation';
import { writable, derived, get } from 'svelte/store';
import {
	type Contact,
	type Conversation,
	type Message,
	type UserPreferences,
	type TabId,
	type Theme,
	type Platform,
	type Importance,
	type CalendarEvent,
	type FollowUp,
	DEFAULT_PREFERENCES,
	PLATFORMS,
	getConversationStatus,
	isMailPlatform,
	dueLabel
} from '$lib/types';
import { DEMO_CONTACTS, DEMO_CONVERSATIONS, DEMO_EVENTS, DEMO_FOLLOWUPS } from './demo-data';

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

// Calendar events and follow-up reminders
export const events = writable<CalendarEvent[]>(DEMO_EVENTS);
export const followUps = writable<FollowUp[]>(DEMO_FOLLOWUPS);

// Current tab store
export const activeTab = writable<TabId>('all');

// Category filter store
export const categoryFilter = writable<string>('all');

// Group filter store (by contact type)
export const groupFilter = writable<string>('all');

// Free-text search across contact name, platform, and message content/subject
export const searchQuery = writable<string>('');

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
	[conversations, activeTab, categoryFilter, groupFilter, searchQuery, contacts, preferences],
	([$conversations, $activeTab, $categoryFilter, $groupFilter, $searchQuery, $contacts, $preferences]) => {
		const contactById = (id: string) => $contacts.find((c) => c.id === id);
		const priority = $preferences.priority || [];

		let entries = $conversations.map((conv) => {
			const contact = contactById(conv.contactId);
			const status = getConversationStatus(conv);
			const urgent = conv.timeSensitive && !(conv.isRead && conv.isResponded);
			const last = conv.messages[conv.messages.length - 1];
			const preview = isMailPlatform(conv.platform) ? last?.subject || last?.content || '' : last?.content || '';

			return {
				...conv,
				contact,
				status,
				urgent,
				preview,
				isPriority: priority.includes(conv.contactId)
			};
		});

		// Apply search — matches contact name, platform, or a message's content/subject
		const q = $searchQuery.trim().toLowerCase();
		if (q) {
			entries = entries.filter(
				(e) =>
					(e.contact?.name.toLowerCase().includes(q) ?? false) ||
					PLATFORMS[e.platform].label.toLowerCase().includes(q) ||
					e.messages.some(
						(m) => m.content.toLowerCase().includes(q) || (m.subject || '').toLowerCase().includes(q)
					)
			);
		}

		// Apply group filter (contact type)
		if ($groupFilter !== 'all') {
			const val = $groupFilter.split(':')[1];
			entries = entries.filter((e) => e.contact?.type === val);
		}

		// Apply category filter (priority senders, or a specific platform)
		if ($categoryFilter !== 'all') {
			const [kind, val] = $categoryFilter.split(':');
			entries = entries.filter((e) => {
				if (kind === 'prio') return e.contact ? priority.includes(e.contact.id) : false;
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

export function updateConversationImportance(id: string, importance: Importance) {
	conversations.update((convs) =>
		convs.map((c) => (c.id === id ? { ...c, importance } : c))
	);
}

export function updateContact(id: string, updates: Partial<Contact>) {
	contacts.update((cs) => cs.map((c) => (c.id === id ? { ...c, ...updates } : c)));
}

// <input type="date"> gives a Y-M-D string; anchor it at 9am local so it lands on the intended day.
export function setDue(conversationId: string, value: string) {
	if (!value) {
		conversations.update((convs) => convs.map((c) => (c.id === conversationId ? { ...c, dueTs: null } : c)));
		return;
	}
	const [y, m, d] = value.split('-').map(Number);
	const dueTs = new Date(y, m - 1, d, 9, 0).getTime();
	conversations.update((convs) => convs.map((c) => (c.id === conversationId ? { ...c, dueTs } : c)));
	toast.show('Due ' + new Date(y, m - 1, d).toLocaleDateString([], { month: 'short', day: 'numeric' }));
}

export function togglePriority(contactId: string) {
	const list = get(preferences).priority || [];
	const on = !list.includes(contactId);
	preferences.update((p) => ({
		...p,
		priority: on ? [...list, contactId] : list.filter((id) => id !== contactId)
	}));
	const c = get(contacts).find((x) => x.id === contactId);
	if (c) toast.show(c.name.split(' (')[0] + (on ? ' added to priority senders' : ' removed from priority'));
}

export function addFollowUp(eventId: string, text: string, dateValue: string) {
	if (!text.trim()) return;
	let dueTs = Date.now() + 86400000;
	if (dateValue) {
		const [y, m, d] = dateValue.split('-').map(Number);
		dueTs = new Date(y, m - 1, d, 9, 0).getTime();
	}
	followUps.update((list) => [...list, { id: 'f' + Date.now(), eventId, text: text.trim(), dueTs, done: false }]);
	toast.show('Follow-up set for ' + dueLabel(dueTs));
}

export function completeFollowUp(id: string) {
	followUps.update((list) => list.map((f) => (f.id === id ? { ...f, done: true } : f)));
	toast.show('Follow-up done');
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

// Shared "New message" compose dialog state — lives here (not dialog-local state) so
// other flows (e.g. the calendar's "Message attendees") can open it pre-filled.
export interface ComposeState {
	contactId: string;
	platform: Platform;
	content: string;
}

export const showCompose = writable(false);
export const composeState = writable<ComposeState>({ contactId: 'c1', platform: 'slack', content: '' });

export function openComposeDialog(prefill?: Partial<ComposeState>) {
	if (prefill) composeState.update((c) => ({ ...c, ...prefill }));
	showCompose.set(true);
}

export function closeComposeDialog() {
	showCompose.set(false);
}

export function sendComposeAndNavigate() {
	const cmp = get(composeState);
	const result = sendNewMessage(cmp.contactId, cmp.platform, cmp.content);
	if (!result) return;
	const contact = get(contacts).find((c) => c.id === cmp.contactId);
	showCompose.set(false);
	composeState.update((c) => ({ ...c, content: '' }));
	if (contact) toast.show(`Sent to ${contact.name.split(' (')[0]} on ${PLATFORMS[cmp.platform].label}`);
	goto(`/conversation/${cmp.contactId}`);
}

// Simulate an incoming message -- a demo-only tool, distinct from composing an
// outbound message. Marks the thread unread/needs-response, matching a real
// inbound message arriving.
export interface SimulateState {
	contactId: string;
	platform: Platform;
	content: string;
	importance: Importance;
	ts: boolean;
}

export const showSimulate = writable(false);
export const simulateState = writable<SimulateState>({
	contactId: 'c1',
	platform: 'slack',
	content: '',
	importance: 'normal',
	ts: false
});

export function openSimulateDialog() {
	showSimulate.set(true);
}

export function closeSimulateDialog() {
	showSimulate.set(false);
}

const AUTO_TIME_SENSITIVE_RE =
	/\b(today|tomorrow|tonight|asap|urgent|deadline|by (mon|tue|wed|thu|fri|sat|sun|end)|\d{1,2}\s?(am|pm))\b/i;

export function simulateMessage() {
	const sim = get(simulateState);
	const content = sim.content.trim() || 'Hey — quick question when you have a minute.';
	const autoTs = AUTO_TIME_SENSITIVE_RE.test(content);
	const contact = get(contacts).find((c) => c.id === sim.contactId);
	if (!contact) return;

	const now = Date.now();
	const mail = isMailPlatform(sim.platform);
	const msg: Message = {
		id: 'm' + (now % 10000000),
		conversationId: '',
		platform: sim.platform,
		direction: 'inbound',
		senderName: contact.name.split(' (')[0],
		content,
		subject: mail ? content.split(/[.!?]/)[0].slice(0, 60) : undefined,
		timestamp: now,
		isRead: false
	};

	conversations.update((convs) => {
		const existing = convs.find((v) => v.contactId === sim.contactId && v.platform === sim.platform);
		if (existing) {
			return convs.map((v) =>
				v === existing
					? {
							...v,
							isRead: false,
							isResponded: false,
							importance: sim.importance !== 'normal' ? sim.importance : v.importance,
							timeSensitive: v.timeSensitive || sim.ts || autoTs,
							lastMessageAt: now,
							lastMessagePreview: mail ? msg.subject || content : content,
							messages: [...v.messages, { ...msg, conversationId: v.id }]
						}
					: v
			);
		}
		const conversationId = 'v' + (now % 10000000);
		return [
			...convs,
			{
				id: conversationId,
				contactId: sim.contactId,
				platform: sim.platform,
				isRead: false,
				isResponded: false,
				importance: sim.importance,
				timeSensitive: sim.ts || autoTs,
				lastMessageAt: now,
				lastMessagePreview: mail ? msg.subject || content : content,
				messages: [{ ...msg, conversationId }]
			}
		];
	});

	showSimulate.set(false);
	simulateState.update((s) => ({ ...s, content: '', ts: false, importance: 'normal' }));
	toast.show('Message delivered' + (sim.ts || autoTs ? ' — flagged time-sensitive' : ''));
}
