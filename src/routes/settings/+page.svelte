<script lang="ts">
	import { ChevronLeft, LogOut } from 'lucide-svelte';
	import { preferences, welcomed, toast } from '$lib/stores';
	import { TABS, type Theme, type TabId } from '$lib/types';
	import Avatar from '$components/Avatar.svelte';
	import Button from '$components/Button.svelte';
	import SegmentedControl from '$components/SegmentedControl.svelte';
	import DemoBadge from '$components/DemoBadge.svelte';

	const themeOptions: Array<{ value: Theme; label: string }> = [
		{ value: 'light', label: 'Light' },
		{ value: 'dark', label: 'Dark' },
		{ value: 'system', label: 'System' }
	];

	const tabOptions = TABS.map(([value, label]) => ({ value, label }));

	function handleThemeChange(theme: Theme) {
		preferences.update((p) => ({ ...p, theme }));
	}

	function handleDefaultTabChange(defaultTab: TabId) {
		preferences.update((p) => ({ ...p, defaultTab }));
	}

	function toggleNotify() {
		preferences.update((p) => ({ ...p, notify: !p.notify }));
	}

	function toggleNotifyOption(key: 'notifyDeadlines' | 'notifyFlagged' | 'notifyUnread') {
		preferences.update((p) => ({ ...p, [key]: !p[key] }));
	}

	function handleLogout() {
		welcomed.reset();
		toast.show('Logged out');
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
			<label>Theme</label>
			<SegmentedControl
				options={themeOptions}
				value={$preferences.theme}
				name="coms-theme"
				onchange={handleThemeChange}
			/>
		</div>

		<div class="field">
			<label>Default tab</label>
			<SegmentedControl
				options={tabOptions}
				value={$preferences.defaultTab}
				name="coms-dtab"
				onchange={handleDefaultTabChange}
			/>
			<p class="hint text-muted">The tab Coms opens on.</p>
		</div>

		<div class="field">
			<label>Notifications</label>
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
			<label>Account</label>
			<div class="account-row">
				<Avatar name="Maya" size="sm" />
				<div class="account-info">
					<div class="account-name">Maya</div>
					<div class="account-email text-muted">maya@freelance.co</div>
				</div>
				<Button variant="secondary" onclick={handleLogout}>
					<LogOut size={14} strokeWidth={1.5} />
					Log out
				</Button>
			</div>
		</div>
	</div>
</div>

<DemoBadge />

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

	.field label:first-child {
		display: block;
		font-size: 12px;
		margin-bottom: 5px;
		color: color-mix(in srgb, var(--color-text) 70%, transparent);
	}

	.hint {
		font-size: 12px;
		margin: 6px 0 0;
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
