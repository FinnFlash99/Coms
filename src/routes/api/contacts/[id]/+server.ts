import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { updateContact } from '$lib/server/db';

// PATCH /api/contacts/[id] - Update contact
export const PATCH: RequestHandler = async ({ params, request, locals, platform }) => {
	const user = locals.user;
	if (!user) {
		throw error(401, 'Unauthorized');
	}

	const db = platform?.env.DB;
	if (!db) {
		throw error(500, 'Database not available');
	}

	try {
		const body = (await request.json()) as {
			name?: string;
			type?: string;
			connection?: string;
		};
		const updates: {
			name?: string;
			contact_type?: string;
			connection_strength?: string;
		} = {};

		if (body.name && typeof body.name === 'string') {
			updates.name = body.name;
		}
		if (body.type && ['Client', 'Subcontractor', 'Vendor', 'Personal', 'other'].includes(body.type)) {
			updates.contact_type = body.type;
		}
		if (body.connection && ['Close', 'Regular', 'Occasional', 'New'].includes(body.connection)) {
			updates.connection_strength = body.connection;
		}

		await updateContact(db, params.id, updates);

		return json({ success: true });
	} catch (e) {
		console.error('Error updating contact:', e);
		throw error(500, 'Failed to update contact');
	}
};
