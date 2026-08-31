<script lang="ts">
	import { connections, togglePlatform, finishOnboarding } from '$lib/stores';
	import { CONNECTIONS } from '$lib/types';

	const noneConnected = $derived(!Object.values($connections).some(Boolean));
</script>

<div class="onboard-backdrop">
	<div class="onboard-content animate-in">
		<div class="kicker">Almost there</div>
		<h1>Connect your platforms</h1>
		<p class="text-muted subtitle">Choose which accounts to sync. You can always change this in Settings.</p>

		<div class="rows">
			{#each CONNECTIONS as p (p.id)}
				{@const on = $connections[p.id]}
				<div class="row">
					<span class="icon" style:color={on ? 'var(--color-accent)' : 'color-mix(in srgb, var(--color-text) 50%, transparent)'}>
						{#if p.icon === 'mail'}
							<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
								<rect x="3" y="5" width="18" height="14" rx="1.5"></rect>
								<polyline points="3 8 12 13.5 21 8"></polyline>
							</svg>
						{:else if p.icon === 'hash'}
							<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
								<line x1="9.5" y1="4" x2="7.5" y2="20"></line>
								<line x1="16.5" y1="4" x2="14.5" y2="20"></line>
								<line x1="4" y1="9.5" x2="20" y2="9.5"></line>
								<line x1="4" y1="14.5" x2="20" y2="14.5"></line>
							</svg>
						{:else}
							<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
								<path d="M20.5 11.5a8.5 8.5 0 0 1-12.2 7.7L3.5 20.5l1.3-4.8A8.5 8.5 0 1 1 20.5 11.5z"></path>
							</svg>
						{/if}
					</span>
					<div class="row-body">
						<div class="row-name">{p.name}</div>
						<div class="text-muted row-blurb">{p.blurb}</div>
					</div>
					{#if on}
						<span class="connected">
							<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
								<polyline points="5 12.5 10 17.5 19 7"></polyline>
							</svg>
							Connected
						</span>
					{:else}
						<button class="btn btn-secondary" onclick={() => togglePlatform(p.id, p.name)}>Connect</button>
					{/if}
				</div>
			{/each}
		</div>

		<div class="actions">
			<button class="btn btn-ghost" onclick={finishOnboarding}>Skip for now</button>
			<span class="spacer"></span>
			<button class="btn btn-primary" disabled={noneConnected} onclick={finishOnboarding}>Continue to Coms</button>
		</div>
	</div>
</div>

<style>
	.onboard-backdrop {
		position: fixed;
		inset: 0;
		z-index: 62;
		overflow: auto;
		background: var(--color-bg);
	}

	.onboard-content {
		max-width: 600px;
		margin: 0 auto;
		padding: 76px 32px 64px;
	}

	.kicker {
		font-family: var(--font-heading);
		font-weight: 500;
		font-size: 11px;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--color-accent);
		margin-bottom: 10px;
	}

	h1 {
		font-size: 38px;
		margin: 0 0 8px;
		line-height: 1.12;
		letter-spacing: -0.02em;
	}

	.subtitle {
		font-size: 15.5px;
		line-height: 1.6;
		margin: 0 0 34px;
		max-width: 440px;
	}

	.rows {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.row {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 17px 19px;
		border: 1px solid var(--color-divider);
		border-radius: var(--radius-md);
		background: var(--color-surface);
	}

	.icon {
		flex: none;
		display: grid;
		place-items: center;
		width: 38px;
		height: 38px;
		border: 1px solid var(--color-divider);
		border-radius: var(--radius-sm);
	}

	.row-body {
		flex: 1;
		min-width: 0;
	}

	.row-name {
		font-family: var(--font-heading);
		font-weight: 500;
		font-size: 15.5px;
		letter-spacing: -0.01em;
	}

	.row-blurb {
		font-size: 13px;
		margin-top: 3px;
	}

	.connected {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		flex: none;
		font-size: 13px;
		color: var(--color-accent);
	}

	.actions {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-top: 32px;
	}

	.spacer {
		flex: 1;
	}
</style>
