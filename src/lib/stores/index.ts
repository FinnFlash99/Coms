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
	type Note,
	type NoteKind,
	type ConnectionId,
	type Connections,
	DEFAULT_PREFERENCES,
	PLATFORMS,
	TYPES,
	getConversationStatus,
	isMailPlatform,
	dueLabel,
	timeText
} from '$lib/types';
import { DEMO_EVENTS, DEMO_FOLLOWUPS } from './demo-data';
import * as api from '$lib/api/openchannels';

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

// Contacts store - wired to OpenChannels API
export const contacts = writable<Contact[]>([]);
export const contactsLoading = writable<boolean>(false);
export const contactsError = writable<string | null>(null);

// Load contacts from API
export async function loadContacts(): Promise<void> {
	if (typeof window === 'undefined') return;
	contactsLoading.set(true);
	contactsError.set(null);
	try {
		const items = await api.listContacts();
		contacts.set(items);
	} catch (e) {
		const msg = e instanceof Error ? e.message : 'Failed to load contacts';
		contactsError.set(msg);
		console.error('Failed to load contacts:', e);
	} finally {
		contactsLoading.set(false);
	}
}

// Conversations store - wired to OpenChannels API
export const conversations = writable<Conversation[]>([]);
export const conversationsLoading = writable<boolean>(false);
export const conversationsError = writable<string | null>(null);

// Load conversations from API (also populates contacts from embedded contact data)
export async function loadConversations(): Promise<void> {
	if (typeof window === 'undefined') return;
	conversationsLoading.set(true);
	conversationsError.set(null);
	try {
		const result = await api.listConversations({ status: 'all' });
		conversations.set(result.conversations);
		// Merge contacts from conversations into contacts store
		if (result.contacts.size > 0) {
			contacts.update((existing) => {
				const byId = new Map(existing.map((c) => [c.id, c]));
				result.contacts.forEach((c, id) => byId.set(id, c));
				return Array.from(byId.values());
			});
		}
	} catch (e) {
		const msg = e instanceof Error ? e.message : 'Failed to load conversations';
		conversationsError.set(msg);
		console.error('Failed to load conversations:', e);
	} finally {
		conversationsLoading.set(false);
	}
}

// Calendar events and follow-up reminders
export const events = writable<CalendarEvent[]>(DEMO_EVENTS);
export const followUps = writable<FollowUp[]>(DEMO_FOLLOWUPS);

// Notes & tasks -- a lightweight scratchpad, separate from conversations/events.
// Wired to OpenChannels API; starts empty and loads asynchronously.
export const notes = writable<Note[]>([]);
export const notesLoading = writable<boolean>(false);
export const notesError = writable<string | null>(null);

// Load notes from API
export async function loadNotes(): Promise<void> {
	if (typeof window === 'undefined') return;
	notesLoading.set(true);
	notesError.set(null);
	try {
		const items = await api.listNotes();
		notes.set(items);
	} catch (e) {
		const msg = e instanceof Error ? e.message : 'Failed to load notes';
		notesError.set(msg);
		console.error('Failed to load notes:', e);
	} finally {
		notesLoading.set(false);
	}
}

// Notes panel UI state -- shared so the header button and the panel itself can both drive it.
export const notesOpen = writable(false);
export const notesSplit = writable(true);

// Current tab store
export const activeTab = writable<TabId>('all');

// Category filter store
export const categoryFilter = writable<string>('all');

// Group filter store (by contact type)
export const groupFilter = writable<string>('all');

// Free-text search across contact name, platform, and message content/subject
export const searchQuery = writable<string>('');

// A boolean flag persisted to localStorage under `key` -- backs the welcome/sign-in/
// onboarding gates, each of which is just "has the user gotten past this screen once".
function createLocalFlagStore(key: string) {
	let initial = false;
	if (typeof window !== 'undefined') {
		initial = localStorage.getItem(key) === '1';
	}

	const { subscribe, set } = writable<boolean>(initial);

	return {
		subscribe,
		enable: () => {
			set(true);
			if (typeof window !== 'undefined') {
				localStorage.setItem(key, '1');
			}
		},
		reset: () => {
			set(false);
			if (typeof window !== 'undefined') {
				localStorage.removeItem(key);
			}
		}
	};
}

export const welcomed = createLocalFlagStore('coms.welcomed');

// Demo-mode sign-in and onboarding gates -- simulated (no real OAuth), but persisted
// the same way `welcomed` is so returning visitors don't see them again.
export const authed = createLocalFlagStore('coms.authed');
export const onboarded = createLocalFlagStore('coms.onboarded');

// "Welcome back" greeting bar on the home page — shown once per app load,
// auto-dismissed after 11s. Not persisted: a fresh load shows it again.
export const greetDismissed = writable(false);

// Demo account connections (Gmail/Slack/WhatsApp). Persisted like preferences so a
// reload can't spuriously "reconnect" something the user disconnected -- the first
// time there's nothing stored yet, it seeds from whether onboarding was completed.
function persistConnections(c: Connections) {
	if (typeof window !== 'undefined') {
		try {
			localStorage.setItem('coms.connections', JSON.stringify(c));
		} catch {
			// Ignore localStorage errors
		}
	}
}

function initialConnections(): Connections {
	if (typeof window !== 'undefined') {
		try {
			const stored = localStorage.getItem('coms.connections');
			if (stored) return JSON.parse(stored);
		} catch {
			// Ignore localStorage errors
		}
	}
	const wasOnboarded = typeof window !== 'undefined' && localStorage.getItem('coms.onboarded') === '1';
	const seed: Connections = { gmail: wasOnboarded, slack: wasOnboarded, whatsapp: false };
	persistConnections(seed);
	return seed;
}

export const connections = writable<Connections>(initialConnections());

export function togglePlatform(id: ConnectionId, name: string) {
	let nowOn = false;
	connections.update((c) => {
		nowOn = !c[id];
		const next = { ...c, [id]: nowOn };
		persistConnections(next);
		return next;
	});
	toast.show(`${name} ${nowOn ? 'connected' : 'disconnected'}`);
}

export function signIn() {
	authed.enable();
}

export function finishOnboarding() {
	onboarded.enable();
}

export function signOut() {
	welcomed.reset();
	authed.reset();
	onboarded.reset();
	const cleared: Connections = { gmail: false, slack: false, whatsapp: false };
	connections.set(cleared);
	if (typeof window !== 'undefined') {
		try {
			localStorage.removeItem('coms.connections');
		} catch {
			// Ignore localStorage errors
		}
	}
	toast.show('Logged out');
}

// Manual "refresh now" sync indicator. There's no real backend to sync with yet, so
// this always succeeds -- it exists to show the interaction, not to model failure.
export const syncState = writable<'idle' | 'syncing'>('idle');
export const lastSync = writable<number>(Date.now());
const SYNC_DELAY_MS = 1300;

export function runSync() {
	if (get(syncState) === 'syncing') return;
	syncState.set('syncing');
	setTimeout(() => {
		syncState.set('idle');
		lastSync.set(Date.now());
	}, SYNC_DELAY_MS);
}

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

		// Apply search — matches contact name, platform, a message's content/subject, a
		// date/time on the thread's due date or any of its messages, or the thread's last activity.
		const q = $searchQuery.trim().toLowerCase();
		if (q) {
			entries = entries.filter(
				(e) =>
					(e.contact?.name.toLowerCase().includes(q) ?? false) ||
					PLATFORMS[e.platform].label.toLowerCase().includes(q) ||
					timeText(e.lastMessageAt).includes(q) ||
					(e.dueTs != null && timeText(e.dueTs).includes(q)) ||
					e.messages.some(
						(m) =>
							m.content.toLowerCase().includes(q) ||
							(m.subject || '').toLowerCase().includes(q) ||
							timeText(m.timestamp).includes(q)
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

// Action helpers - all wired to OpenChannels API with optimistic updates
export async function markConversationRead(id: string): Promise<void> {
	// Optimistic update
	conversations.update((convs) =>
		convs.map((c) => (c.id === id ? { ...c, isRead: true } : c))
	);
	try {
		await api.markConversationRead(id);
	} catch (e) {
		// Revert on error
		conversations.update((convs) =>
			convs.map((c) => (c.id === id ? { ...c, isRead: false } : c))
		);
		const msg = e instanceof Error ? e.message : 'Failed to mark read';
		toast.show(msg);
		console.error('Failed to mark conversation read:', e);
	}
}

export async function markConversationResponded(id: string): Promise<void> {
	// Get previous state for revert
	let prevRead = true;
	let prevResponded = true;
	conversations.update((convs) =>
		convs.map((c) => {
			if (c.id === id) {
				prevRead = c.isRead;
				prevResponded = c.isResponded;
				return { ...c, isRead: true, isResponded: true };
			}
			return c;
		})
	);
	try {
		await api.markConversationResponded(id);
	} catch (e) {
		// Revert on error
		conversations.update((convs) =>
			convs.map((c) => (c.id === id ? { ...c, isRead: prevRead, isResponded: prevResponded } : c))
		);
		const msg = e instanceof Error ? e.message : 'Failed to mark responded';
		toast.show(msg);
		console.error('Failed to mark conversation responded:', e);
	}
}

export async function toggleTimeSensitive(id: string): Promise<void> {
	// Get current state and toggle
	let newValue = false;
	conversations.update((convs) =>
		convs.map((c) => {
			if (c.id === id) {
				newValue = !c.timeSensitive;
				return { ...c, timeSensitive: newValue };
			}
			return c;
		})
	);
	try {
		await api.setConversationUrgent(id, newValue);
	} catch (e) {
		// Revert on error
		conversations.update((convs) =>
			convs.map((c) => (c.id === id ? { ...c, timeSensitive: !newValue } : c))
		);
		const msg = e instanceof Error ? e.message : 'Failed to update';
		toast.show(msg);
		console.error('Failed to toggle time-sensitive:', e);
	}
}

export async function updateConversationImportance(id: string, importance: Importance): Promise<void> {
	// Get previous value for revert
	let prevImportance: Importance = 'normal';
	conversations.update((convs) =>
		convs.map((c) => {
			if (c.id === id) {
				prevImportance = c.importance;
				return { ...c, importance };
			}
			return c;
		})
	);
	try {
		await api.setConversationImportance(id, importance);
	} catch (e) {
		// Revert on error
		conversations.update((convs) =>
			convs.map((c) => (c.id === id ? { ...c, importance: prevImportance } : c))
		);
		const msg = e instanceof Error ? e.message : 'Failed to update importance';
		toast.show(msg);
		console.error('Failed to update importance:', e);
	}
}

export async function updateContact(id: string, updates: Partial<Contact>): Promise<void> {
	// Get previous state for revert
	let prevContact: Contact | undefined;
	contacts.update((cs) =>
		cs.map((c) => {
			if (c.id === id) {
				prevContact = { ...c };
				return { ...c, ...updates };
			}
			return c;
		})
	);
	try {
		await api.updateContact(id, {
			name: updates.name,
			contactType: updates.type,
			connectionStrength: updates.connection
		});
	} catch (e) {
		// Revert on error
		if (prevContact) {
			contacts.update((cs) => cs.map((c) => (c.id === id ? prevContact! : c)));
		}
		const msg = e instanceof Error ? e.message : 'Failed to update contact';
		toast.show(msg);
		console.error('Failed to update contact:', e);
	}
}

// <input type="date"> gives a Y-M-D string; anchor it at 9am local so it lands on the intended day.
export async function setDue(conversationId: string, value: string): Promise<void> {
	// Get previous value for revert
	let prevDueTs: number | null | undefined = null;
	let newDueTs: number | null = null;

	if (value) {
		const [y, m, d] = value.split('-').map(Number);
		newDueTs = new Date(y, m - 1, d, 9, 0).getTime();
	}

	conversations.update((convs) =>
		convs.map((c) => {
			if (c.id === conversationId) {
				prevDueTs = c.dueTs;
				return { ...c, dueTs: newDueTs };
			}
			return c;
		})
	);

	try {
		await api.setConversationDue(conversationId, newDueTs);
		if (newDueTs) {
			toast.show('Due ' + new Date(newDueTs).toLocaleDateString([], { month: 'short', day: 'numeric' }));
		}
	} catch (e) {
		// Revert on error
		conversations.update((convs) =>
			convs.map((c) => (c.id === conversationId ? { ...c, dueTs: prevDueTs } : c))
		);
		const msg = e instanceof Error ? e.message : 'Failed to set due date';
		toast.show(msg);
		console.error('Failed to set due date:', e);
	}
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

export async function addNote(text: string, kind: NoteKind): Promise<void> {
	const trimmed = text.trim();
	if (!trimmed) return;

	// Optimistic update with temp ID
	const tempId = 'temp-' + Date.now();
	const tempNote: Note = { id: tempId, text: trimmed, kind, done: false, ts: Date.now() };
	notes.update((list) => [tempNote, ...list]);

	try {
		const created = await api.createNote(trimmed, kind);
		// Replace temp note with real one
		notes.update((list) => list.map((n) => (n.id === tempId ? created : n)));
	} catch (e) {
		// Revert on error
		notes.update((list) => list.filter((n) => n.id !== tempId));
		const msg = e instanceof Error ? e.message : 'Failed to create note';
		toast.show(msg);
		console.error('Failed to create note:', e);
	}
}

export async function toggleNote(id: string): Promise<void> {
	// Optimistic update
	let previousDone = false;
	notes.update((list) =>
		list.map((n) => {
			if (n.id === id) {
				previousDone = n.done;
				return { ...n, done: !n.done };
			}
			return n;
		})
	);

	try {
		await api.updateNote(id, { done: !previousDone });
	} catch (e) {
		// Revert on error
		notes.update((list) => list.map((n) => (n.id === id ? { ...n, done: previousDone } : n)));
		const msg = e instanceof Error ? e.message : 'Failed to update note';
		toast.show(msg);
		console.error('Failed to toggle note:', e);
	}
}

export async function removeNote(id: string): Promise<void> {
	// Optimistic update - save removed note for potential revert
	let removed: Note | undefined;
	notes.update((list) => {
		removed = list.find((n) => n.id === id);
		return list.filter((n) => n.id !== id);
	});

	try {
		await api.deleteNote(id);
	} catch (e) {
		// Revert on error
		if (removed) {
			notes.update((list) => [...list, removed!].sort((a, b) => b.ts - a.ts));
		}
		const msg = e instanceof Error ? e.message : 'Failed to delete note';
		toast.show(msg);
		console.error('Failed to delete note:', e);
	}
}

export function toggleNotesPanel() {
	notesOpen.update((v) => !v);
}

export function closeNotesPanel() {
	notesOpen.set(false);
}

export function toggleNotesSplit() {
	notesSplit.update((v) => !v);
}

// All contact groups: built-in types, the user's custom ones, and any ad hoc type
// already on a contact (keeps old data selectable even if its custom group was since removed).
export const allTypes = derived([contacts, preferences], ([$contacts, $preferences]) => {
	const custom = $preferences.customTypes || [];
	return [...new Set([...TYPES, ...custom, ...$contacts.map((c) => c.type)])];
});

export function addGroup(name: string) {
	const trimmed = name.trim();
	if (!trimmed) return;
	if (get(allTypes).some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
		toast.show(`"${trimmed}" already exists`);
		return;
	}
	preferences.update((p) => ({ ...p, customTypes: [...(p.customTypes || []), trimmed] }));
	toast.show(`Group "${trimmed}" added`);
}

export function removeGroup(name: string) {
	preferences.update((p) => ({ ...p, customTypes: (p.customTypes || []).filter((t) => t !== name) }));
	contacts.update((cs) => cs.map((c) => (c.type === name ? { ...c, type: 'Client' } : c)));
	groupFilter.update((g) => (g === `rel:${name}` ? 'all' : g));
	toast.show(`Group "${name}" removed`);
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

// Per-conversation reply send state -- 'sending' briefly disables the reply box
// and shows a spinner, matching a real (if instant) network round trip.
export const sendStates = writable<Record<string, 'idle' | 'sending'>>({});
const SEND_DELAY_MS = 1100;

// Replying resolves the thread: read, responded, no longer time-sensitive.
// Returns false if there was nothing to send, or a send is already in flight.
export function sendReply(conversationId: string): boolean {
	const text = (get(drafts)[conversationId] || '').trim();
	if (!text || get(sendStates)[conversationId] === 'sending') return false;

	sendStates.update((s) => ({ ...s, [conversationId]: 'sending' }));
	setTimeout(() => {
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
		sendStates.update((s) => ({ ...s, [conversationId]: 'idle' }));
		toast.show('Sent — thread marked responded');
	}, SEND_DELAY_MS);

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

