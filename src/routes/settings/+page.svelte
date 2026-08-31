<script lang="ts">
	import { ChevronLeft, LogOut, X } from 'lucide-svelte';
	import {
		preferences,
		contacts,
		togglePriority,
		allTypes,
		addGroup,
		removeGroup,
		connections,
		connectionsLoading,
		togglePlatform,
		signOut,
		user
	} from '$lib/stores';
	import { TABS, PLATFORMS, CONNECTIONS, type Theme, type DefaultTabId } from '$lib/types';
	import Avatar from '$components/Avatar.svelte';
	import Button from '$components/Button.svelte';
	import Tag from '$components/Tag.svelte';
	import SegmentedControl from '$components/SegmentedControl.svelte';

	let groupDraft = $state('');

	const themeOptions: Array<{ value: Theme; label: string }> = [
		{ value: 'light', label: 'Light' },
		{ value: 'dark', label: 'Dark' },
		{ value: 'system', label: 'System' }
	];

	const defaultTabOptions: Array<{ id: DefaultTabId; label: string }> = [
		...TABS.map(([id, label]) => ({ id: id as DefaultTabId, label })),
		...(Object.keys(PLATFORMS) as Array<keyof typeof PLATFORMS>).map((p) => ({
			id: `pf:${p}` as DefaultTabId,
			label: PLATFORMS[p].label
		}))
	];

	const defaultTabHint = $derived(
		$preferences.defaultTab.startsWith('pf:')
			? `Coms opens filtered to ${PLATFORMS[$preferences.defaultTab.slice(3) as keyof typeof PLATFORMS].label}.`
			: 'The tab Coms opens on.'
	);

	function handleThemeChange(theme: Theme) {
		preferences.update((p) => ({ ...p, theme }));
	}

	function handleDefaultTabChange(ev: Event) {
		const defaultTab = (ev.target as HTMLSelectElement).value as DefaultTabId;
		preferences.update((p) => ({ ...p, defaultTab }));
	}

	function handleAddGroup() {
		addGroup(groupDraft);
		groupDraft = '';
	}

	function handleGroupDraftKey(ev: KeyboardEvent) {
		if (ev.key === 'Enter') {
			ev.preventDefault();
			handleAddGroup();
		}
	}

	function toggleNotify() {
		preferences.update((p) => ({ ...p, notify: !p.notify }));
	}

	function toggleNotifyOption(key: 'notifyDeadlines' | 'notifyFlagged' | 'notifyUnread') {
		preferences.update((p) => ({ ...p, [key]: !p[key] }));
	}

	function togglePriorityFirst() {
		preferences.update((p) => ({ ...p, priorityFirst: !p.priorityFirst }));
	}

	const priorityHint = $derived(() => {
		const count = ($preferences.priority || []).length;
		return count
			? `${count} sender${count === 1 ? '' : 's'} flagged — their messages sort to the top of the inbox.`
			: 'No priority senders yet. Flag anyone whose messages should always surface first.';
	});

	function handleLogout() {
		signOut();
	}
</script>

<div class="settings animate-in">
	<header class="header">
		<a href="/" class="btn btn-secondary btn-icon" title="Back">
			<ChevronLeft size={16} strokeWidth={1.5} />
		</a>
		<h2>Settings</h2>
	</header>

	<div class="sections">
		<div class="field">
			<span class="field-label">Theme</span>
			<SegmentedControl
				options={themeOptions}
				value={$preferences.theme}
				name="coms-theme"
				onchange={handleThemeChange}
			/>
		</div>

		<div class="field">
			<span class="field-label">Default tab</span>
			<select class="input default-tab-select" value={$preferences.defaultTab} onchange={handleDefaultTabChange}>
				{#each defaultTabOptions as o}
					<option value={o.id}>{o.label}</option>
				{/each}
			</select>
			<p class="hint text-muted">{defaultTabHint}</p>
		</div>

		<div class="field">
			<span class="field-label">Connected platforms</span>
			<div class="platform-list" class:loading={$connectionsLoading}>
				{#each CONNECTIONS as p (p.id)}
					{@const on = $connections[p.id]}
					<div class="platform-row">
						<span class="platform-icon" style:color={on ? 'var(--color-accent)' : 'color-mix(in srgb, var(--color-text) 45%, transparent)'}>
							{#if p.icon === 'mail'}
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
									<rect x="3" y="5" width="18" height="14" rx="1.5"></rect>
									<polyline points="3 8 12 13.5 21 8"></polyline>
								</svg>
							{:else if p.icon === 'hash'}
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
									<line x1="9.5" y1="4" x2="7.5" y2="20"></line>
									<line x1="16.5" y1="4" x2="14.5" y2="20"></line>
									<line x1="4" y1="9.5" x2="20" y2="9.5"></line>
									<line x1="4" y1="14.5" x2="20" y2="14.5"></line>
								</svg>
							{:else}
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
									<path d="M20.5 11.5a8.5 8.5 0 0 1-12.2 7.7L3.5 20.5l1.3-4.8A8.5 8.5 0 1 1 20.5 11.5z"></path>
								</svg>
							{/if}
						</span>
						<span class="platform-name">{p.name}</span>
						<span class="text-muted platform-status">{on ? p.handle : 'Not connected'}</span>
						{#if on}
							<button class="btn btn-ghost platform-btn" onclick={() => togglePlatform(p.id, p.name)}>Disconnect</button>
						{:else}
							<button class="btn btn-secondary platform-btn" onclick={() => togglePlatform(p.id, p.name)}>Connect</button>
						{/if}
					</div>
				{/each}
			</div>
			<p class="hint text-muted">Connect platforms to sync your messages. You can disconnect anytime.</p>
		</div>

		<div class="field">
			<span class="field-label">Groups</span>
			<div class="group-add-row">
				<input
					class="input group-input"
					placeholder="e.g. Parents, School, Landlord"
					bind:value={groupDraft}
					onkeydown={handleGroupDraftKey}
				/>
				<Button variant="secondary" disabled={!groupDraft.trim()} onclick={handleAddGroup}>Add group</Button>
			</div>
			<div class="group-chips">
				{#each $allTypes as t}
					{@const custom = ($preferences.customTypes || []).includes(t)}
					<Tag variant={custom ? 'accent' : 'neutral'}>
						<span class="group-chip-label">
							{t}
							{#if custom}
								<button class="btn btn-ghost btn-icon group-remove" title="Remove group" onclick={() => removeGroup(t)}>
									<X size={10} strokeWidth={2} />
								</button>
							{/if}
						</span>
					</Tag>
				{/each}
			</div>
			<p class="hint text-muted">Built-in groups can't be removed. Assign a group to anyone from their conversation.</p>
		</div>

		<div class="field">
			<span class="field-label">Notifications</span>
			<label class="checkbox-row">
				<input type="checkbox" checked={$preferences.notify} onchange={toggleNotify} />
				Send me notifications
			</label>
			<div class="notify-options" class:disabled={!$preferences.notify}>
				<label class="checkbox-row sub">
					<input
						type="checkbox"
						checked={$preferences.notifyDeadlines}
						disabled={!$preferences.notify}
						onchange={() => toggleNotifyOption('notifyDeadlines')}
					/>
					Auto-detected deadlines (e.g. "tomorrow at 3pm")
				</label>
				<label class="checkbox-row sub">
					<input
						type="checkbox"
						checked={$preferences.notifyFlagged}
						disabled={!$preferences.notify}
						onchange={() => toggleNotifyOption('notifyFlagged')}
					/>
					Items flagged as urgent
				</label>
				<label class="checkbox-row sub">
					<input
						type="checkbox"
						checked={$preferences.notifyUnread}
						disabled={!$preferences.notify}
						onchange={() => toggleNotifyOption('notifyUnread')}
					/>
					Every new unread message
				</label>
			</div>
			<p class="hint text-muted">Choose what triggers a notification.</p>
		</div>

		<div class="field">
			<span class="field-label">Priority senders</span>
			<label class="checkbox-row">
				<input type="checkbox" checked={$preferences.priorityFirst} onchange={togglePriorityFirst} />
				Sort priority senders to the top
			</label>
			<div class="priority-list">
				{#each $contacts as c}
					<label class="priority-row">
						<input
							type="checkbox"
							checked={($preferences.priority || []).includes(c.id)}
							onchange={() => togglePriority(c.id)}
						/>
						<span class="priority-name">{c.name}</span>
						<span class="text-muted priority-meta">{c.type} · {c.connection}</span>
					</label>
				{/each}
			</div>
			<p class="hint text-muted">{priorityHint()}</p>
		</div>

		<div class="field">
			<span class="field-label">Account</span>
			<div class="text-muted signed-in-as">Signed in as</div>
			<div class="account-row">
				<Avatar name={$user?.name || $user?.email || 'User'} size="sm" />
				<div class="account-info">
					<div class="account-name">{$user?.name || 'User'}</div>
					<div class="account-email text-muted">{$user?.email || ''}</div>
				</div>
				<Button variant="secondary" onclick={handleLogout}>
					<LogOut size={14} strokeWidth={1.5} />
					Log out
				</Button>
			</div>
		</div>
	</div>
</div>

<style>
	.settings {
		max-width: 640px;
		margin: 0 auto;
		padding: 38px 32px 100px;
	}

	.header {
		display: flex;
		align-items: center;
		gap: 14px;
		margin-bottom: 26px;
	}

	.header h2 {
		margin: 0;
		font-size: 30px;
	}

	.sections {
		display: flex;
		flex-direction: column;
		gap: 32px;
	}

	.field .field-label {
		display: block;
		font-size: 12px;
		margin-bottom: 5px;
		color: color-mix(in srgb, var(--color-text) 70%, transparent);
	}

	.hint {
		font-size: 12px;
		margin: 6px 0 0;
	}

	.default-tab-select {
		width: auto;
		max-width: 240px;
	}

	.group-add-row {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}

	.group-input {
		flex: 1;
		min-width: 170px;
	}

	.group-chips {
		display: flex;
		gap: 7px;
		flex-wrap: wrap;
		margin-top: 12px;
	}

	.group-chip-label {
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}

	.group-remove {
		padding: 0;
		width: 14px;
		height: 14px;
	}

	.platform-list {
		display: flex;
		flex-direction: column;
		gap: 1px;
		background: var(--color-divider);
		border: 1px solid var(--color-divider);
		border-radius: var(--radius-md);
		overflow: hidden;
		transition: opacity 0.2s;
	}

	.platform-list.loading {
		opacity: 0.5;
		pointer-events: none;
	}

	.platform-row {
		display: flex;
		align-items: center;
		gap: 11px;
		padding: 12px 14px;
		background: var(--color-surface);
	}

	.platform-icon {
		flex: none;
		display: grid;
		place-items: center;
	}

	.platform-name {
		flex: none;
		font-family: var(--font-heading);
		font-weight: 500;
		font-size: 14px;
	}

	.platform-status {
		flex: 1;
		min-width: 0;
		font-size: 12.5px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.platform-btn {
		flex: none;
		font-size: 12px;
		padding: 4px 10px;
	}

	.signed-in-as {
		font-size: 11px;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		margin-bottom: 9px;
	}

	.checkbox-row {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		font-size: 14px;
		cursor: pointer;
	}

	.checkbox-row input {
		width: 15px;
		height: 15px;
		accent-color: var(--color-accent);
	}

	.checkbox-row.sub {
		font-size: 13px;
	}

	.checkbox-row.sub input {
		width: 14px;
		height: 14px;
	}

	.notify-options {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin: 10px 0 0 24px;
		transition: opacity 0.2s;
	}

	.notify-options.disabled {
		opacity: 0.4;
		pointer-events: none;
	}

	.priority-list {
		display: flex;
		flex-direction: column;
		gap: 1px;
		margin-top: 12px;
		background: var(--color-divider);
		border: 1px solid var(--color-divider);
		border-radius: var(--radius-md);
		overflow: hidden;
	}

	.priority-row {
		display: flex;
		align-items: center;
		gap: 11px;
		padding: 11px 14px;
		background: var(--color-surface);
		cursor: pointer;
	}

	.priority-row:hover {
		background: color-mix(in srgb, var(--color-text) 4%, transparent);
	}

	.priority-row input {
		width: 15px;
		height: 15px;
		flex: none;
		accent-color: var(--color-accent);
	}

	.priority-name {
		flex: 1;
		min-width: 0;
		font-family: var(--font-heading);
		font-weight: 500;
		font-size: 14px;
	}

	.priority-meta {
		font-size: 12px;
	}

	.account-row {
		display: flex;
		align-items: center;
		gap: 14px;
		flex-wrap: wrap;
	}

	.account-info {
		flex: 1;
		min-width: 160px;
	}

	.account-name {
		font-size: 14px;
		font-weight: 500;
	}

	.account-email {
		font-size: 12px;
	}
</style>
