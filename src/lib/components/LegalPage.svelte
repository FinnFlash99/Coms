<script lang="ts">
	interface Clause {
		num: string;
		title: string;
		body: string;
	}

	interface Props {
		title: string;
		subtitle: string;
		otterEmoji: string;
		clauses: Clause[];
		calloutLead: string;
		crossLinkHref: string;
		crossLinkLabel: string;
	}

	let { title, subtitle, otterEmoji, clauses, calloutLead, crossLinkHref, crossLinkLabel }: Props = $props();
</script>

<div class="legal-page animate-in">
	<header class="legal-header">
		<a href="/" class="wordmark"><span class="wordmark-c">C</span>oms</a>
		<span class="tag tag-neutral">Placeholder</span>
		<span class="spacer"></span>
		<a href="/" class="btn btn-secondary">Back to Coms</a>
	</header>

	<h1>{title}</h1>
	<p class="text-muted subtitle">{subtitle}</p>

	<div class="otter-box">
		<span class="otter-emoji">{otterEmoji}</span>
	</div>

	<div class="clauses">
		{#each clauses as c}
			<div class="clause">
				<div class="clause-head">
					<span class="text-muted clause-num">{c.num}</span>
					<h2>{c.title}</h2>
				</div>
				<p class="text-muted clause-body">{c.body}</p>
			</div>
		{/each}
	</div>

	<div class="callout">
		<p class="callout-lead">{calloutLead}</p>
		<p class="text-muted callout-meta">
			Last updated: whenever you last loaded this page. See also the <a href={crossLinkHref}>{crossLinkLabel}</a>.
		</p>
	</div>
</div>

<style>
	.legal-page {
		max-width: 760px;
		margin: 0 auto;
		padding: 44px 32px 110px;
	}

	.legal-header {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 38px;
	}

	.wordmark {
		font-family: 'DM Serif Display', Georgia, serif;
		font-weight: 400;
		font-size: 25px;
		letter-spacing: -0.01em;
		text-decoration: none;
		color: var(--color-text);
	}

	.wordmark-c {
		font-size: 1.4em;
	}

	.spacer {
		flex: 1;
	}

	h1 {
		font-size: 42px;
		margin: 0 0 10px;
		line-height: 1.1;
		letter-spacing: -0.02em;
	}

	.subtitle {
		font-size: 15.5px;
		line-height: 1.6;
		margin: 0 0 34px;
		max-width: 560px;
	}

	.otter-box {
		display: grid;
		place-items: center;
		height: 230px;
		margin: 0 0 40px;
		border: 1px solid var(--color-divider);
		border-radius: var(--radius-lg);
		background: color-mix(in srgb, var(--color-accent) 8%, transparent);
	}

	.otter-emoji {
		font-size: 64px;
		display: inline-block;
		animation: legal-float 5.5s ease-in-out infinite;
	}

	@keyframes legal-float {
		0%,
		100% {
			transform: translateY(0) rotate(-2deg);
		}
		50% {
			transform: translateY(-10px) rotate(2deg);
		}
	}

	.clause {
		padding: 22px 0;
		border-bottom: 1px solid var(--color-divider);
	}

	.clause:last-child {
		border-bottom: none;
	}

	.clause-head {
		display: flex;
		align-items: baseline;
		gap: 12px;
		margin-bottom: 7px;
	}

	.clause-num {
		flex: none;
		font-family: var(--font-heading);
		font-size: 12px;
		letter-spacing: 0.1em;
	}

	.clause-head h2 {
		margin: 0;
		font-size: 19px;
		font-weight: 500;
		letter-spacing: -0.01em;
	}

	.clause-body {
		font-size: 14.5px;
		line-height: 1.65;
		margin: 0 0 0 33px;
		max-width: 600px;
	}

	.callout {
		margin-top: 34px;
		padding: 20px 22px;
		border: 1px solid var(--color-divider);
		border-radius: var(--radius-md);
		background: var(--color-surface);
	}

	.callout-lead {
		font-size: 14px;
		line-height: 1.6;
		margin: 0;
	}

	.callout-meta {
		font-size: 12.5px;
		margin: 12px 0 0;
	}
</style>
