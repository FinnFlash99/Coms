import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { queryOne, execute } from '$lib/server/db';

// PATCH /api/notes/[id] - Update a note
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
		// Check note exists
		const note = await queryOne<{ id: string }>(db, 'SELECT id FROM notes WHERE id = ?', [
			params.id
		]);

		if (!note) {
			throw error(404, 'Note not found');
		}

		const body = (await request.json()) as { text?: string; done?: boolean };
		const updates: string[] = [];
		const values: (string | number)[] = [];

		if (typeof body.text === 'string') {
			updates.push('text = ?');
			values.push(body.text.trim());
		}

		if (typeof body.done === 'boolean') {
			updates.push('done = ?');
			values.push(body.done ? 1 : 0);
		}

		if (updates.length === 0) {
			throw error(400, 'No valid updates provided');
		}

		values.push(params.id);

		await execute(db, `UPDATE notes SET ${updates.join(', ')} WHERE id = ?`, values);

		// Return updated note
		const updated = await queryOne<{
			id: string;
			text: string;
			kind: string;
			done: number;
			ts: number;
		}>(db, 'SELECT id, text, kind, done, ts FROM notes WHERE id = ?', [params.id]);

		return json({
			id: updated!.id,
			text: updated!.text,
			kind: updated!.kind,
			done: Boolean(updated!.done),
			ts: updated!.ts
		});
	} catch (e) {
		if ((e as { status?: number }).status) throw e;
		console.error('Error updating note:', e);
		throw error(500, 'Failed to update note');
	}
};

// DELETE /api/notes/[id] - Delete a note
export const DELETE: RequestHandler = async ({ params, locals, platform }) => {
	const user = locals.user;
	if (!user) {
		throw error(401, 'Unauthorized');
	}

	const db = platform?.env.DB;
	if (!db) {
		throw error(500, 'Database not available');
	}

	try {
		// Check note exists
		const note = await queryOne<{ id: string }>(db, 'SELECT id FROM notes WHERE id = ?', [
			params.id
		]);

		if (!note) {
			throw error(404, 'Note not found');
		}

		await execute(db, 'DELETE FROM notes WHERE id = ?', [params.id]);

		return json({ success: true });
	} catch (e) {
		if ((e as { status?: number }).status) throw e;
		console.error('Error deleting note:', e);
		throw error(500, 'Failed to delete note');
	}
};
