<script lang="ts">
	import { signIn } from '$lib/stores';
</script>

<div class="signin-backdrop">
	<div class="signin-card animate-pop">
		<div class="wordmark"><span class="wordmark-c">C</span>oms</div>
		<h1>Sign in to Coms</h1>
		<p class="text-muted subtitle">Connect your accounts to see all your messages in one place.</p>

		<button class="btn btn-primary btn-block google-btn" onclick={signIn}>
			<svg width="17" height="17" viewBox="0 0 48 48" aria-hidden="true">
				<path
					fill="#4285F4"
					d="M45.1 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h11.8c-.5 2.7-2 5-4.4 6.6v5.5h7.1c4.2-3.8 6.6-9.5 6.6-16.1z"
				/>
				<path
					fill="#34A853"
					d="M24 46c5.9 0 10.9-2 14.5-5.4l-7.1-5.5c-2 1.3-4.5 2.1-7.4 2.1-5.7 0-10.6-3.9-12.3-9.1H4.4v5.7C8 41.1 15.4 46 24 46z"
				/>
				<path
					fill="#FBBC05"
					d="M11.7 28.1c-.4-1.3-.7-2.7-.7-4.1s.3-2.8.7-4.1v-5.7H4.4A22 22 0 0 0 2 24c0 3.6.9 6.9 2.4 9.8l7.3-5.7z"
				/>
				<path
					fill="#EA4335"
					d="M24 10.8c3.2 0 6.1 1.1 8.4 3.3l6.3-6.3C34.9 4.2 29.9 2 24 2 15.4 2 8 6.9 4.4 14.2l7.3 5.7c1.7-5.2 6.6-9.1 12.3-9.1z"
				/>
			</svg>
			Continue with Google
		</button>
		<p class="text-muted hint">We'll ask you to connect your messaging platforms next.</p>
		<p class="text-muted terms">
			By signing in, you agree to our <a href="/terms">Terms</a> and <a href="/privacy">Privacy Policy</a>
		</p>
	</div>
</div>

<style>
	.signin-backdrop {
		position: fixed;
		inset: 0;
		z-index: 65;
		display: grid;
		place-items: center;
		background: var(--color-bg);
		padding: 24px;
	}

	.signin-card {
		width: min(420px, 100%);
		padding: 44px 44px 32px;
		text-align: center;
		background: var(--color-surface);
		border: 1px solid var(--color-divider);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-md);
	}

	.wordmark {
		font-family: 'DM Serif Display', Georgia, serif;
		font-weight: 400;
		font-size: 30px;
		letter-spacing: -0.01em;
		margin-bottom: 26px;
	}

	.wordmark-c {
		font-size: 1.4em;
	}

	h1 {
		font-size: 27px;
		margin: 0 0 8px;
		line-height: 1.15;
	}

	.subtitle {
		font-size: 14.5px;
		line-height: 1.55;
		margin: 0 auto 28px;
		max-width: 300px;
	}

	.google-btn {
		justify-content: center;
		gap: 10px;
	}

	.hint {
		font-size: 12.5px;
		margin: 14px 0 0;
	}

	.terms {
		font-size: 11.5px;
		line-height: 1.6;
		margin: 30px 0 0;
		padding-top: 20px;
		border-top: 1px solid var(--color-divider);
	}
</style>
