/**
 * Calendar API client for Coms frontend
 *
 * This module provides a typed interface to the calendar API endpoints,
 * which fetch events from Google Calendar via OAuth.
 */

import type { CalendarEvent, Contact } from '$lib/types';

// Response types
interface CalendarEventsResponse {
	events: CalendarEvent[];
	connected: boolean;
	error?: string;
}

interface ConversationInfo {
	id: string;
	contact_id: string;
	last_message_at: number;
	last_message_preview: string;
}

interface CalendarEventDetailResponse {
	event: CalendarEvent;
	attendees: {
		matched: Contact[];
		unmatched: string[];
		conversations: Record<string, ConversationInfo>;
	};
}

/**
 * Fetch calendar events for a date range
 */
export async function fetchCalendarEvents(
	start?: Date,
	end?: Date
): Promise<{ events: CalendarEvent[]; connected: boolean }> {
	const params = new URLSearchParams();
	if (start) params.set('start', start.toISOString());
	if (end) params.set('end', end.toISOString());

	const query = params.toString();
	const url = `/api/calendar/events${query ? `?${query}` : ''}`;

	const response = await fetch(url, { credentials: 'include' });

	if (!response.ok) {
		const errorBody = (await response.json().catch(() => ({ error: 'Request failed' }))) as {
			error?: string;
		};
		throw new Error(errorBody.error || `API error: ${response.status}`);
	}

	const data = (await response.json()) as CalendarEventsResponse;
	return { events: data.events, connected: data.connected };
}

/**
 * Fetch a single calendar event with enriched attendee info
 */
export async function fetchCalendarEventDetail(
	eventId: string
): Promise<CalendarEventDetailResponse> {
	const response = await fetch(`/api/calendar/events/${eventId}`, {
		credentials: 'include'
	});

	if (!response.ok) {
		const errorBody = (await response.json().catch(() => ({ error: 'Request failed' }))) as {
			error?: string;
		};
		throw new Error(errorBody.error || `API error: ${response.status}`);
	}

	return response.json();
}

/**
 * Fetch calendar events for the current month
 */
export async function fetchCurrentMonthEvents(): Promise<{
	events: CalendarEvent[];
	connected: boolean;
}> {
	const now = new Date();
	const start = new Date(now.getFullYear(), now.getMonth(), 1);
	const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
	return fetchCalendarEvents(start, end);
}

/**
 * Fetch calendar events for today
 */
export async function fetchTodayEvents(): Promise<{
	events: CalendarEvent[];
	connected: boolean;
}> {
	const now = new Date();
	const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
	return fetchCalendarEvents(start, end);
}
