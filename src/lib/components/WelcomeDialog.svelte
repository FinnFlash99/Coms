<script lang="ts">
	import { welcomed } from '$lib/stores';
	import Blueprint from './Blueprint.svelte';
	import Button from './Button.svelte';
	import { Mail, CircleCheck, Clock } from 'lucide-svelte';

	let { visible = false }: { visible?: boolean } = $props();

	function enter() {
		welcomed.enable();
	}
</script>

{#if visible}
	<div class="welcome-backdrop">
		<Blueprint class="welcome-card animate-pop">
			<div class="card-kicker">Unified inbox</div>
			<h1>Hi Maya, welcome to Coms</h1>
			<p class="tagline">One place to see the status of all your conversations.</p>

			<div class="features">
				<div class="feature">
					<span class="feature-icon">
						<Mail size={16} strokeWidth={1.5} />
					</span>
					<span>Slack, Email, WhatsApp and more — aggregated in one inbox.</span>
				</div>
				<div class="feature">
					<span class="feature-icon">
						<CircleCheck size={16} strokeWidth={1.5} />
					</span>
					<span>The status of everything — read, responded, needs attention — at a glance.</span>
				</div>
				<div class="feature">
					<span class="feature-icon">
						<Clock size={16} strokeWidth={1.5} />
					</span>
					<span>Nothing slips. The app does the tracking so you don't have to.</span>
				</div>
			</div>

			<Button variant="primary" onclick={enter}>Enter Coms</Button>
			<p class="demo-note text-muted">
				Demo mode with sample conversations. The full product syncs your platforms automatically.
			</p>
		</Blueprint>
	</div>
{/if}

<style>
	.welcome-backdrop {
		position: fixed;
		inset: 0;
		z-index: 60;
		display: grid;
		place-items: center;
		background: var(--color-bg);
		padding: 24px;
	}

	:global(.welcome-card) {
		max-width: 540px;
		padding: 46px 50px;
	}

	h1 {
		font-size: 44px;
		line-height: 1.1;
		margin: 0 0 6px;
	}

	.tagline {
		font-size: 17px;
		margin: 0 0 24px;
	}

	.features {
		display: flex;
		flex-direction: column;
		gap: 12px;
		margin-bottom: 28px;
	}

	.feature {
		display: flex;
		gap: 12px;
		align-items: center;
		font-size: 14px;
	}

	.feature-icon {
		width: 32px;
		height: 32px;
		flex: none;
		display: grid;
		place-items: center;
		border: 1px solid var(--color-divider);
		color: var(--color-accent);
	}

	.demo-note {
		font-size: 12px;
		margin: 16px 0 0;
	}
</style>
