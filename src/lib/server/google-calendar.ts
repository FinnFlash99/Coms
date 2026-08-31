/**
 * Google Calendar API utilities for server-side calendar integration.
 * Uses OAuth tokens stored in platform_connections (via Gmail OAuth which includes calendar scope).
 */

import type { CalendarEvent, EventKind, Contact } from '$lib/types';

// Google Calendar API response types
interface GoogleCalendarEvent {
	id: string;
	summary?: string;
	description?: string;
	location?: string;
	start: {
		dateTime?: string;
		date?: string;
		timeZone?: string;
	};
	end: {
		dateTime?: string;
		date?: string;
		timeZone?: string;
	};
	attendees?: Array<{
		email: string;
		displayName?: string;
		responseStatus?: string;
		self?: boolean;
	}>;
	conferenceData?: {
		conferenceSolution?: {
			name?: string;
		};
	};
	hangoutLink?: string;
}

interface GoogleCalendarListResponse {
	items: GoogleCalendarEvent[];
	nextPageToken?: string;
}

/**
 * Fetch calendar events from Google Calendar API
 */
export async function fetchGoogleCalendarEvents(
	accessToken: string,
	timeMin: Date,
	timeMax: Date,
	maxResults = 50
): Promise<GoogleCalendarEvent[]> {
	const params = new URLSearchParams({
		timeMin: timeMin.toISOString(),
		timeMax: timeMax.toISOString(),
		maxResults: maxResults.toString(),
		singleEvents: 'true',
		orderBy: 'startTime'
	});

	const response = await fetch(
		`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
		{
			headers: {
				Authorization: `Bearer ${accessToken}`,
				'Content-Type': 'application/json'
			}
		}
	);

	if (!response.ok) {
		const errorText = await response.text();
		console.error('Google Calendar API error:', errorText);
		throw new Error(`Google Calendar API error: ${response.status}`);
	}

	const data = (await response.json()) as GoogleCalendarListResponse;
	return data.items || [];
}

/**
 * Fetch a single calendar event by ID
 */
export async function fetchGoogleCalendarEvent(
	accessToken: string,
	eventId: string
): Promise<GoogleCalendarEvent | null> {
	const response = await fetch(
		`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
		{
			headers: {
				Authorization: `Bearer ${accessToken}`,
				'Content-Type': 'application/json'
			}
		}
	);

	if (response.status === 404) {
		return null;
	}

	if (!response.ok) {
		const errorText = await response.text();
		console.error('Google Calendar API error:', errorText);
		throw new Error(`Google Calendar API error: ${response.status}`);
	}

	return response.json();
}

/**
 * Infer event kind from Google Calendar event data
 */
function inferEventKind(event: GoogleCalendarEvent): EventKind {
	const summary = (event.summary || '').toLowerCase();
	const hasConference = !!event.hangoutLink || !!event.conferenceData;

	// Check for call-related keywords
	if (
		hasConference ||
		summary.includes('call') ||
		summary.includes('zoom') ||
		summary.includes('meet') ||
		summary.includes('phone')
	) {
		return 'call';
	}

	// Check for deadline keywords
	if (
		summary.includes('deadline') ||
		summary.includes('due') ||
		summary.includes('submit') ||
		summary.includes('deliver')
	) {
		return 'deadline';
	}

	// Check for appointment keywords
	if (
		summary.includes('appointment') ||
		summary.includes('doctor') ||
		summary.includes('dentist') ||
		summary.includes('consultation')
	) {
		return 'appointment';
	}

	// Default to meeting
	return 'meeting';
}

/**
 * Calculate event duration in minutes
 */
function calculateDurationMins(event: GoogleCalendarEvent): number {
	const startStr = event.start.dateTime || event.start.date;
	const endStr = event.end.dateTime || event.end.date;

	if (!startStr || !endStr) return 60; // Default 1 hour

	const start = new Date(startStr);
	const end = new Date(endStr);

	// For all-day events (date without time), use 24 hours
	if (!event.start.dateTime) {
		return 24 * 60;
	}

	return Math.round((end.getTime() - start.getTime()) / 60000);
}

/**
 * Match attendee emails to contacts
 */
export function matchAttendeesToContacts(
	attendeeEmails: string[],
	contacts: Contact[],
	contactEmails: Map<string, string> // contactId -> email
): string[] {
	const matchedIds: string[] = [];

	for (const email of attendeeEmails) {
		// Find contact by email match
		for (const [contactId, contactEmail] of contactEmails) {
			if (contactEmail.toLowerCase() === email.toLowerCase()) {
				matchedIds.push(contactId);
				break;
			}
		}
	}

	return matchedIds;
}

/**
 * Transform Google Calendar event to Coms CalendarEvent
 */
export function toComsCalendarEvent(
	googleEvent: GoogleCalendarEvent,
	matchedContactIds: string[] = []
): CalendarEvent {
	const startStr = googleEvent.start.dateTime || googleEvent.start.date;
	const startTs = startStr ? new Date(startStr).getTime() : Date.now();

	// Filter out self from attendees
	const attendeeEmails =
		googleEvent.attendees?.filter((a) => !a.self).map((a) => a.email) || [];

	return {
		id: googleEvent.id,
		title: googleEvent.summary || 'Untitled Event',
		kind: inferEventKind(googleEvent),
		startTs,
		mins: calculateDurationMins(googleEvent),
		where: googleEvent.location || '',
		attendees: matchedContactIds.length > 0 ? matchedContactIds : attendeeEmails,
		convIds: [] // Will be enriched by separate query
	};
}

/**
 * Transform array of Google Calendar events to Coms CalendarEvents
 */
export function toComsCalendarEvents(
	googleEvents: GoogleCalendarEvent[],
	contactEmailMap?: Map<string, string>
): CalendarEvent[] {
	return googleEvents.map((ge) => {
		let matchedIds: string[] = [];

		if (contactEmailMap) {
			const attendeeEmails =
				ge.attendees?.filter((a) => !a.self).map((a) => a.email) || [];
			matchedIds = matchAttendeesToContacts(attendeeEmails, [], contactEmailMap);
		}

		return toComsCalendarEvent(ge, matchedIds);
	});
}
