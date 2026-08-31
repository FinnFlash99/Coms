// Token encryption utilities using Web Crypto API (available in Workers runtime)

const ALGORITHM = 'AES-GCM';

// Import the encryption key from environment
export async function importKey(keyHex: string): Promise<CryptoKey> {
	const keyData = hexToBytes(keyHex);
	return crypto.subtle.importKey('raw', keyData.buffer as ArrayBuffer, { name: ALGORITHM }, false, [
		'encrypt',
		'decrypt'
	]);
}

// Encrypt a token
export async function encryptToken(
	plaintext: string,
	keyHex: string,
	existingIvHex?: string
): Promise<{ encrypted: string; iv: string }> {
	const key = await importKey(keyHex);
	const iv = existingIvHex ? hexToBytes(existingIvHex) : crypto.getRandomValues(new Uint8Array(12));
	const encodedData = new TextEncoder().encode(plaintext);

	const encryptedBuffer = await crypto.subtle.encrypt(
		{ name: ALGORITHM, iv: iv.buffer as ArrayBuffer },
		key,
		encodedData
	);

	return {
		encrypted: bytesToHex(new Uint8Array(encryptedBuffer)),
		iv: bytesToHex(iv)
	};
}

// Decrypt a token
export async function decryptToken(
	encryptedHex: string,
	ivHex: string,
	keyHex: string
): Promise<string> {
	const key = await importKey(keyHex);
	const encrypted = hexToBytes(encryptedHex);
	const iv = hexToBytes(ivHex);

	const decryptedBuffer = await crypto.subtle.decrypt(
		{ name: ALGORITHM, iv: iv.buffer as ArrayBuffer },
		key,
		encrypted.buffer as ArrayBuffer
	);

	return new TextDecoder().decode(decryptedBuffer);
}

// Helper: Convert bytes to hex string
function bytesToHex(bytes: Uint8Array): string {
	return Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}

// Helper: Convert hex string to bytes
function hexToBytes(hex: string): Uint8Array {
	const bytes = new Uint8Array(hex.length / 2);
	for (let i = 0; i < bytes.length; i++) {
		bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
	}
	return bytes;
}

// Generate a random encryption key (for initial setup)
export function generateEncryptionKey(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(32)); // 256 bits
	return bytesToHex(bytes);
}
