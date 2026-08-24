// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Error {
			message: string;
			code?: string;
		}

		interface Locals {
			user?: {
				id: string;
				email: string;
				name?: string;
			};
		}

		interface PageData {}

		interface Platform {
			env: {
				DB: D1Database;
				SESSIONS: KVNamespace;
				OAUTH_STATE: KVNamespace;
			};
			context: {
				waitUntil(promise: Promise<unknown>): void;
			};
			caches: CacheStorage & { default: Cache };
		}
	}
}

export {};
