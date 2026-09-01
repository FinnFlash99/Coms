import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { queryAll, execute } from '$lib/server/db';

// GET /api/notes - List all notes for current user
export const GET: RequestHandler = async ({ locals, platform }) => {
	const user = locals.user;
	if (!user) {
		throw error(401, 'Unauthorized');
	}

	const db = platform?.env.DB;
	if (!db) {
		throw error(500, 'Database not available');
	}

	try {
		// Check if notes table exists
		const tableCheck = await db.prepare(
			"SELECT name FROM sqlite_master WHERE type='table' AND name='notes'"
		).first();

		if (!tableCheck) {
			// Notes table doesn't exist yet, return empty
			return json({ items: [], total: 0 });
		}

		// Note: The notes table uses 'done' not 'is_done', and 'ts' not 'created_at'
		// It also doesn't have user_id, so we return all notes for now
		const rows = await queryAll<{
			id: string;
			text: string;
			kind: string;
			done: number;
			ts: number;
		}>(
			db,
			`SELECT id, text, kind, done, ts
			 FROM notes
			 ORDER BY ts DESC`
		);

		const items = rows.map((row) => ({
			id: row.id,
			text: row.text,
			kind: row.kind || 'note',
			isDone: Boolean(row.done),
			createdAt: new Date(row.ts * 1000).toISOString()
		}));

		return json({ items, total: items.length });
	} catch (e) {
		console.error('Error fetching notes:', e);
		// Return empty array if table doesn't exist or other error
		return json({ items: [], total: 0 });
	}
};

// POST /api/notes - Create a new note
export const POST: RequestHandler = async ({ request, locals, platform }) => {
	const user = locals.user;
	if (!user) {
		throw error(401, 'Unauthorized');
	}

	const db = platform?.env.DB;
	if (!db) {
		throw error(500, 'Database not available');
	}

	try {
		const body = (await request.json()) as { text: string; kind?: 'note' | 'task' };
		const { text, kind = 'note' } = body;

		if (!text || typeof text !== 'string') {
			throw error(400, 'Text is required');
		}

		const id = crypto.randomUUID();
		const ts = Math.floor(Date.now() / 1000);

		await execute(
			db,
			`INSERT INTO notes (id, text, kind, done, ts)
			 VALUES (?, ?, ?, 0, ?)`,
			[id, text.trim(), kind, ts]
		);

		return json({
			id,
			text: text.trim(),
			kind,
			done: false,
			ts
		});
	} catch (e) {
		if ((e as { status?: number }).status) throw e;
		console.error('Error creating note:', e);
		throw error(500, 'Failed to create note');
	}
};
