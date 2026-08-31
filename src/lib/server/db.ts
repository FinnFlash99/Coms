import type { D1Database } from '@cloudflare/workers-types';

export type { D1Database };

// Generate a unique ID
export function generateId(): string {
	return crypto.randomUUID();
}

// Database query helpers
export async function queryOne<T>(db: D1Database, sql: string, params: unknown[] = []): Promise<T | null> {
	const result = await db.prepare(sql).bind(...params).first<T>();
	return result;
}

export async function queryAll<T>(db: D1Database, sql: string, params: unknown[] = []): Promise<T[]> {
	const result = await db.prepare(sql).bind(...params).all<T>();
	return result.results;
}

export async function execute(db: D1Database, sql: string, params: unknown[] = []): Promise<D1Result> {
	return db.prepare(sql).bind(...params).run();
}

export interface D1Result {
	success: boolean;
	meta: {
		changes: number;
		last_row_id: number;
		duration: number;
	};
}

// User operations
export async function getUserById(db: D1Database, id: string) {
	return queryOne<{ id: string; email: string; name: string | null }>(
		db,
		'SELECT id, email, name FROM users WHERE id = ?',
		[id]
	);
}

export async function getUserByEmail(db: D1Database, email: string) {
	return queryOne<{ id: string; email: string; name: string | null }>(
		db,
		'SELECT id, email, name FROM users WHERE email = ?',
		[email]
	);
}

export async function createUser(db: D1Database, email: string, name?: string): Promise<{ id: string; email: string; name: string | null }> {
	const id = generateId();
	const nameValue = name || null;
	await execute(
		db,
		'INSERT INTO users (id, email, name) VALUES (?, ?, ?)',
		[id, email, nameValue]
	);
	return { id, email, name: nameValue };
}

// Contact operations
export async function getContactsByUser(db: D1Database, userId: string) {
	return queryAll<{
		id: string;
		name: string;
		contact_type: string;
		connection_strength: string;
	}>(
		db,
		'SELECT id, name, contact_type, connection_strength FROM contacts WHERE user_id = ? ORDER BY name',
		[userId]
	);
}

export async function updateContact(
	db: D1Database,
	id: string,
	updates: { name?: string; contact_type?: string; connection_strength?: string }
) {
	const setClauses: string[] = [];
	const params: unknown[] = [];

	if (updates.name !== undefined) {
		setClauses.push('name = ?');
		params.push(updates.name);
	}
	if (updates.contact_type !== undefined) {
		setClauses.push('contact_type = ?');
		params.push(updates.contact_type);
	}
	if (updates.connection_strength !== undefined) {
		setClauses.push('connection_strength = ?');
		params.push(updates.connection_strength);
	}

	if (setClauses.length === 0) return;

	setClauses.push('updated_at = ?');
	params.push(Math.floor(Date.now() / 1000));
	params.push(id);

	await execute(
		db,
		`UPDATE contacts SET ${setClauses.join(', ')} WHERE id = ?`,
		params
	);
}

// Conversation operations
export async function getConversationsByUser(db: D1Database, userId: string) {
	return queryAll<{
		id: string;
		contact_id: string;
		platform: string;
		is_read: number;
		is_responded: number;
		importance: string;
		is_time_sensitive: number;
		last_message_at: number;
		last_message_preview: string;
	}>(
		db,
		`SELECT id, contact_id, platform, is_read, is_responded, importance,
		        is_time_sensitive, last_message_at, last_message_preview
		 FROM conversations
		 WHERE user_id = ?
		 ORDER BY last_message_at DESC`,
		[userId]
	);
}

export async function getConversationById(db: D1Database, id: string) {
	return queryOne<{
		id: string;
		user_id: string;
		contact_id: string;
		platform: string;
		is_read: number;
		is_responded: number;
		importance: string;
		is_time_sensitive: number;
		last_message_at: number;
		last_message_preview: string;
	}>(
		db,
		'SELECT * FROM conversations WHERE id = ?',
		[id]
	);
}

export async function updateConversation(
	db: D1Database,
	id: string,
	updates: {
		is_read?: boolean;
		is_responded?: boolean;
		importance?: string;
		is_time_sensitive?: boolean;
	}
) {
	const setClauses: string[] = [];
	const params: unknown[] = [];

	if (updates.is_read !== undefined) {
		setClauses.push('is_read = ?');
		params.push(updates.is_read ? 1 : 0);
	}
	if (updates.is_responded !== undefined) {
		setClauses.push('is_responded = ?');
		params.push(updates.is_responded ? 1 : 0);
	}
	if (updates.importance !== undefined) {
		setClauses.push('importance = ?');
		params.push(updates.importance);
	}
	if (updates.is_time_sensitive !== undefined) {
		setClauses.push('is_time_sensitive = ?');
		params.push(updates.is_time_sensitive ? 1 : 0);
	}

	if (setClauses.length === 0) return;

	setClauses.push('updated_at = ?');
	params.push(Math.floor(Date.now() / 1000));
	params.push(id);

	await execute(
		db,
		`UPDATE conversations SET ${setClauses.join(', ')} WHERE id = ?`,
		params
	);
}

// Message operations
export async function getMessagesByConversation(db: D1Database, conversationId: string) {
	return queryAll<{
		id: string;
		platform: string;
		content: string;
		sender_name: string;
		direction: string;
		timestamp: number;
		is_read: number;
	}>(
		db,
		`SELECT id, platform, content, sender_name, direction, timestamp, is_read
		 FROM messages
		 WHERE conversation_id = ?
		 ORDER BY timestamp ASC`,
		[conversationId]
	);
}

// Platform connection operations
export async function getPlatformConnectionsByUser(db: D1Database, userId: string) {
	return queryAll<{
		id: string;
		platform: string;
		status: string;
		platform_email: string | null;
		last_sync_at: number | null;
	}>(
		db,
		`SELECT id, platform, status, platform_email, last_sync_at
		 FROM platform_connections
		 WHERE user_id = ?`,
		[userId]
	);
}

export async function getPlatformConnection(db: D1Database, userId: string, platform: string) {
	return queryOne<{
		id: string;
		user_id: string;
		platform: string;
		access_token_encrypted: string;
		refresh_token_encrypted: string | null;
		token_iv: string;
		token_expires_at: number | null;
		status: string;
		sync_cursor: string | null;
	}>(
		db,
		'SELECT * FROM platform_connections WHERE user_id = ? AND platform = ?',
		[userId, platform]
	);
}

export async function upsertPlatformConnection(
	db: D1Database,
	userId: string,
	platform: string,
	data: {
		accessTokenEncrypted: string;
		refreshTokenEncrypted?: string;
		tokenIv: string;
		tokenExpiresAt?: number;
		platformUserId?: string;
		platformEmail?: string;
	}
) {
	const id = generateId();
	const now = Math.floor(Date.now() / 1000);

	await execute(
		db,
		`INSERT INTO platform_connections
		 (id, user_id, platform, access_token_encrypted, refresh_token_encrypted, token_iv, token_expires_at, platform_user_id, platform_email, status, created_at, updated_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)
		 ON CONFLICT(user_id, platform) DO UPDATE SET
		   access_token_encrypted = excluded.access_token_encrypted,
		   refresh_token_encrypted = excluded.refresh_token_encrypted,
		   token_iv = excluded.token_iv,
		   token_expires_at = excluded.token_expires_at,
		   platform_user_id = excluded.platform_user_id,
		   platform_email = excluded.platform_email,
		   status = 'active',
		   updated_at = excluded.updated_at`,
		[
			id,
			userId,
			platform,
			data.accessTokenEncrypted,
			data.refreshTokenEncrypted || null,
			data.tokenIv,
			data.tokenExpiresAt || null,
			data.platformUserId || null,
			data.platformEmail || null,
			now,
			now
		]
	);
}

export async function deletePlatformConnection(db: D1Database, userId: string, platform: string) {
	await execute(
		db,
		'DELETE FROM platform_connections WHERE user_id = ? AND platform = ?',
		[userId, platform]
	);
}
