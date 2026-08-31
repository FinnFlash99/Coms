// OAuth configuration and helpers
/// <reference types="@cloudflare/workers-types" />

export type OAuthPlatform = 'gmail' | 'outlook' | 'slack' | 'whatsapp';

export interface OAuthConfig {
	authUrl: string;
	tokenUrl: string;
	scopes: string[];
	clientIdEnvKey: string;
	clientSecretEnvKey: string;
}

export const OAUTH_CONFIGS: Record<OAuthPlatform, OAuthConfig> = {
	gmail: {
		authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
		tokenUrl: 'https://oauth2.googleapis.com/token',
		scopes: [
			'https://www.googleapis.com/auth/gmail.readonly',
			'https://www.googleapis.com/auth/gmail.send',
			'https://www.googleapis.com/auth/gmail.modify',
			'https://www.googleapis.com/auth/calendar.readonly',
			'email',
			'profile'
		],
		clientIdEnvKey: 'GOOGLE_CLIENT_ID',
		clientSecretEnvKey: 'GOOGLE_CLIENT_SECRET'
	},
	outlook: {
		authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
		tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
		scopes: ['Mail.Read', 'Mail.Send', 'User.Read', 'Calendars.Read', 'offline_access'],
		clientIdEnvKey: 'MICROSOFT_CLIENT_ID',
		clientSecretEnvKey: 'MICROSOFT_CLIENT_SECRET'
	},
	slack: {
		authUrl: 'https://slack.com/oauth/v2/authorize',
		tokenUrl: 'https://slack.com/api/oauth.v2.access',
		scopes: [
			'channels:history',
			'channels:read',
			'chat:write',
			'im:history',
			'users:read',
			'users:read.email'
		],
		clientIdEnvKey: 'SLACK_CLIENT_ID',
		clientSecretEnvKey: 'SLACK_CLIENT_SECRET'
	},
	// WhatsApp uses Meta's Graph API OAuth flow (v26.0 as of Aug 2026)
	whatsapp: {
		authUrl: 'https://www.facebook.com/v26.0/dialog/oauth',
		tokenUrl: 'https://graph.facebook.com/v26.0/oauth/access_token',
		scopes: ['whatsapp_business_messaging', 'whatsapp_business_management'],
		clientIdEnvKey: 'META_APP_ID',
		clientSecretEnvKey: 'META_APP_SECRET'
	}
};

// Generate OAuth state token
export async function generateStateToken(kv: KVNamespace, userId: string): Promise<string> {
	const state = crypto.randomUUID();
	await kv.put(`oauth:state:${state}`, userId, { expirationTtl: 600 }); // 10 minutes
	return state;
}

// Validate and consume OAuth state token
export async function validateStateToken(kv: KVNamespace, state: string): Promise<string | null> {
	const userId = await kv.get(`oauth:state:${state}`);
	if (userId) {
		await kv.delete(`oauth:state:${state}`);
	}
	return userId;
}

// Build OAuth authorization URL
export function buildAuthUrl(
	platform: OAuthPlatform,
	clientId: string,
	redirectUri: string,
	state: string
): string {
	const config = OAUTH_CONFIGS[platform];
	const params = new URLSearchParams({
		client_id: clientId,
		redirect_uri: redirectUri,
		response_type: 'code',
		scope: config.scopes.join(' '),
		state,
		access_type: 'offline', // For refresh tokens (Google)
		prompt: 'consent' // Always show consent screen (Google)
	});

	return `${config.authUrl}?${params.toString()}`;
}

// Exchange authorization code for tokens
export async function exchangeCodeForTokens(
	platform: OAuthPlatform,
	code: string,
	clientId: string,
	clientSecret: string,
	redirectUri: string
): Promise<{
	accessToken: string;
	refreshToken?: string;
	expiresIn?: number;
	tokenType: string;
}> {
	const config = OAUTH_CONFIGS[platform];

	const body = new URLSearchParams({
		client_id: clientId,
		client_secret: clientSecret,
		code,
		redirect_uri: redirectUri,
		grant_type: 'authorization_code'
	});

	const response = await fetch(config.tokenUrl, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body: body.toString()
	});

	if (!response.ok) {
		const error = await response.text();
		throw new Error(`OAuth token exchange failed: ${error}`);
	}

	const data = (await response.json()) as {
		access_token: string;
		refresh_token?: string;
		expires_in?: number;
		token_type: string;
	};

	return {
		accessToken: data.access_token,
		refreshToken: data.refresh_token,
		expiresIn: data.expires_in,
		tokenType: data.token_type
	};
}

// Refresh access token
export async function refreshAccessToken(
	platform: OAuthPlatform,
	refreshToken: string,
	clientId: string,
	clientSecret: string
): Promise<{
	accessToken: string;
	expiresIn?: number;
}> {
	const config = OAUTH_CONFIGS[platform];

	const body = new URLSearchParams({
		client_id: clientId,
		client_secret: clientSecret,
		refresh_token: refreshToken,
		grant_type: 'refresh_token'
	});

	const response = await fetch(config.tokenUrl, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body: body.toString()
	});

	if (!response.ok) {
		throw new Error('Token refresh failed');
	}

	const data = (await response.json()) as {
		access_token: string;
		expires_in?: number;
	};

	return {
		accessToken: data.access_token,
		expiresIn: data.expires_in
	};
}
