<script lang="ts">
	import { notes, notesSplit, closeNotesPanel, toggleNotesSplit, addNote, toggleNote, removeNote } from '$lib/stores';
	import { relativeTime, type NoteKind } from '$lib/types';
	import SegmentedControl from './SegmentedControl.svelte';
	import Button from './Button.svelte';
	import { X, PanelRightClose, PanelRight } from 'lucide-svelte';

	let mode = $state<NoteKind>('task');
	let draft = $state('');

	const modeOptions: Array<{ value: NoteKind; label: string }> = [
		{ value: 'task', label: 'Task' },
		{ value: 'note', label: 'Note' }
	];

	const draftEmpty = $derived(!draft.trim());
	const placeholder = $derived(mode === 'task' ? 'What needs doing?' : 'Write it down…');

	const countLabel = $derived.by(() => {
		const open = $notes.filter((n) => n.kind === 'task' && !n.done).length;
		const noteCount = $notes.filter((n) => n.kind === 'note').length;
		const parts = [
			open ? `${open} open` : null,
			noteCount ? `${noteCount} note${noteCount === 1 ? '' : 's'}` : null
		].filter(Boolean);
		return parts.length ? parts.join(' · ') : 'empty';
	});

	function submit() {
		if (draftEmpty) return;
		addNote(draft, mode);
		draft = '';
	}

	function handleKey(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			submit();
		}
	}
</script>

<aside class="notes-panel" class:floating={!$notesSplit}>
	<div class="notes-header">
		<span class="notes-title">Notes &amp; tasks</span>
		<span class="text-muted notes-count">{countLabel}</span>
		<span class="spacer"></span>
		<button
			class="btn btn-ghost btn-icon"
			title={$notesSplit ? 'Float over the inbox' : 'Split the screen'}
			onclick={toggleNotesSplit}
		>
			{#if $notesSplit}
				<PanelRight size={15} strokeWidth={1.5} />
			{:else}
				<PanelRightClose size={15} strokeWidth={1.5} />
			{/if}
		</button>
		<button class="btn btn-ghost btn-icon" title="Close notes" onclick={closeNotesPanel}>
			<X size={15} strokeWidth={1.5} />
		</button>
	</div>

	<div class="notes-compose">
		<SegmentedControl options={modeOptions} value={mode} name="coms-notemode" onchange={(v) => (mode = v)} />
		<div class="compose-row">
			<textarea
				class="input compose-input"
				{placeholder}
				bind:value={draft}
				onkeydown={handleKey}
			></textarea>
			<Button variant="primary" disabled={draftEmpty} onclick={submit}>Add</Button>
		</div>
	</div>

	<div class="notes-list">
		{#if $notes.length}
			{#each $notes as n, i (n.id)}
				<div class="note-row" class:last={i === $notes.length - 1}>
					{#if n.kind === 'task'}
						<input
							type="checkbox"
							class="note-check"
							checked={n.done}
							onchange={() => toggleNote(n.id)}
						/>
					{:else}
						<span class="note-dot"></span>
					{/if}
					<div class="note-body">
						<p class="note-text" class:done={n.done}>{n.text}</p>
						<p class="text-muted note-time">{relativeTime(n.ts)}</p>
					</div>
					<button class="btn btn-ghost btn-icon note-remove" title="Delete" onclick={() => removeNote(n.id)}>
						<X size={13} strokeWidth={1.5} />
					</button>
				</div>
			{/each}
		{:else}
			<p class="text-muted notes-empty">Nothing written down yet.</p>
		{/if}
	</div>
</aside>

<style>
	.notes-panel {
		display: flex;
		flex-direction: column;
		background: var(--color-surface);
		animation: coms-in 0.22s ease;

		position: sticky;
		top: 0;
		flex: none;
		width: 340px;
		height: 100vh;
		border-left: 1px solid var(--color-divider);
	}

	.notes-panel.floating {
		position: fixed;
		top: 18px;
		right: 18px;
		bottom: 18px;
		width: 340px;
		z-index: 60;
		border: 1px solid var(--color-divider);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-lg);
	}

	.notes-header {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 20px 20px 14px;
	}

	.notes-title {
		font-family: var(--font-heading);
		font-weight: 500;
		font-size: 17px;
		letter-spacing: -0.01em;
	}

	.notes-count {
		font-size: 11.5px;
	}

	.spacer {
		flex: 1;
	}

	.notes-compose {
		padding: 0 20px 16px;
		border-bottom: 1px solid var(--color-divider);
	}

	.notes-compose :global(.seg) {
		margin-bottom: 9px;
	}

	.compose-row {
		display: flex;
		gap: 8px;
		align-items: flex-end;
	}

	.compose-input {
		flex: 1;
		min-height: 40px;
		max-height: 110px;
		font-size: 13.5px;
		padding: 9px 11px;
		resize: vertical;
	}

	.notes-list {
		flex: 1;
		min-height: 0;
		overflow: auto;
	}

	.note-row {
		display: flex;
		gap: 11px;
		align-items: flex-start;
		padding: 13px 18px;
		border-bottom: 1px solid var(--color-divider);
	}

	.note-row.last {
		border-bottom: none;
	}

	.note-check {
		width: 15px;
		height: 15px;
		flex: none;
		margin-top: 2px;
		accent-color: var(--color-accent);
	}

	.note-dot {
		width: 5px;
		height: 5px;
		flex: none;
		margin-top: 7px;
		border-radius: 50%;
		background: var(--color-accent);
	}

	.note-body {
		flex: 1;
		min-width: 0;
	}

	.note-text {
		font-size: 13.5px;
		line-height: 1.5;
		margin: 0;
	}

	.note-text.done {
		text-decoration: line-through;
		color: color-mix(in srgb, var(--color-text) 55%, transparent);
	}

	.note-time {
		font-size: 11px;
		margin: 4px 0 0;
	}

	.note-remove {
		flex: none;
		padding: 3px;
		opacity: 0.6;
	}

	.notes-empty {
		font-size: 13px;
		margin: 0;
		padding: 26px 20px;
		text-align: center;
	}
</style>
