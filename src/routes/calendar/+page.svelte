<script lang="ts">
	import { goto } from '$app/navigation';
	import { ChevronLeft, ChevronRight } from 'lucide-svelte';
	import { events, conversations, contacts, followUps, setDue, completeFollowUp } from '$lib/stores';
	import {
		EVENT_KINDS,
		PLATFORMS,
		dateKey,
		hhmm,
		dueLabel,
		getConversationStatus,
		isMailPlatform,
		type EventKind
	} from '$lib/types';
	import Button from '$components/Button.svelte';
	import Tag from '$components/Tag.svelte';
	import EventPrepDialog from '$components/EventPrepDialog.svelte';
	import DemoBadge from '$components/DemoBadge.svelte';

	let calView = $state<'month' | 'today'>('month');
	let monthOffset = $state(0);
	let prepEventId = $state<string | null>(null);

	const viewOptions: Array<{ value: 'month' | 'today'; label: string }> = [
		{ value: 'month', label: 'Month' },
		{ value: 'today', label: 'Today' }
	];

	const todayKey = dateKey(Date.now());
	const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

	function pillStyle(kind: EventKind, muted: boolean): string {
		const alert = kind === 'deadline';
		const border = muted
			? 'var(--color-divider)'
			: alert
				? 'color-mix(in srgb, var(--color-alert) 40%, transparent)'
				: 'color-mix(in srgb, var(--color-accent) 40%, transparent)';
		const bg = muted
			? 'color-mix(in srgb, var(--color-text) 5%, transparent)'
			: alert
				? 'var(--color-alert-tint)'
				: 'color-mix(in srgb, var(--color-accent) 18%, transparent)';
		const color = muted ? 'color-mix(in srgb, var(--color-text) 65%, transparent)' : 'var(--color-text)';
		return (
			'display:flex;align-items:center;gap:5px;width:100%;min-width:0;text-align:left;cursor:pointer;' +
			`font-family:var(--font-body);font-size:11.5px;padding:3px 6px;border-radius:calc(var(--radius-sm) * .75);` +
			`border:1px solid ${border};background:${bg};color:${color}` +
			(muted ? ';text-decoration:line-through' : '')
		);
	}

	interface CalItem {
		sort: number;
		label: string;
		title: string;
		dot: string;
		style: string;
		onOpen: () => void;
	}
	interface CalCell {
		day: number;
		isToday: boolean;
		inMonth: boolean;
		items: CalItem[];
		cellStyle: string;
		numStyle: string;
	}

	const calBase = $derived.by(() => {
		const now = new Date();
		return new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
	});

	const calTitleMonth = $derived(calBase.toLocaleDateString([], { month: 'long', year: 'numeric' }));

	const calCells = $derived.by((): CalCell[] => {
		const byDay: Record<string, CalItem[]> = {};
		$events.forEach((e) => {
			const past = e.startTs < Date.now() - 3600000;
			const key = dateKey(e.startTs);
			(byDay[key] ||= []).push({
				sort: e.startTs,
				label: (e.mins ? hhmm(e.startTs).replace(':00', '') + ' ' : '') + e.title,
				title: `${e.title} · ${EVENT_KINDS[e.kind].label}${e.where ? ' · ' + e.where : ''}`,
				dot: past
					? 'color-mix(in srgb, var(--color-text) 35%, transparent)'
					: e.kind === 'deadline'
						? 'var(--color-alert)'
						: 'var(--color-accent)',
				style: pillStyle(e.kind, past),
				onOpen: () => {
					prepEventId = e.id;
				}
			});
		});
		$conversations
			.filter((v) => v.dueTs)
			.forEach((v) => {
				const c = $contacts.find((x) => x.id === v.contactId);
				if (!c) return;
				const resolved = v.isRead && v.isResponded;
				const key = dateKey(v.dueTs as number);
				(byDay[key] ||= []).push({
					sort: v.dueTs as number,
					label: c.name.split(' (')[0],
					title: `${c.name} · ${PLATFORMS[v.platform].label}${resolved ? ' · resolved' : ' · open'}`,
					dot: resolved ? 'color-mix(in srgb, var(--color-text) 35%, transparent)' : 'var(--color-alert)',
					style: pillStyle('deadline', resolved),
					onOpen: () => goto(`/conversation/${v.contactId}`)
				});
			});
		Object.values(byDay).forEach((list) => list.sort((a, b) => a.sort - b.sort));

		const base = calBase;
		const first = new Date(base.getFullYear(), base.getMonth(), 1);
		const start = new Date(first);
		start.setDate(1 - first.getDay());
		const cells: CalCell[] = [];
		for (let i = 0; i < 42; i++) {
			const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
			const key = dateKey(d.getTime());
			const inMonth = d.getMonth() === base.getMonth();
			const isToday = key === todayKey;
			cells.push({
				day: d.getDate(),
				isToday,
				inMonth,
				items: byDay[key] || [],
				cellStyle:
					`min-height:104px;padding:8px 9px;background:` +
					(inMonth ? 'var(--color-surface)' : 'color-mix(in srgb, var(--color-bg) 70%, var(--color-surface))') +
					(isToday ? ';box-shadow:inset 0 0 0 1px var(--color-accent)' : ''),
				numStyle:
					'font-family:var(--font-heading);font-weight:500;font-size:13px;' +
					(inMonth ? (isToday ? 'color:var(--color-accent)' : '') : 'color:color-mix(in srgb, var(--color-text) 38%, transparent)')
			});
		}
		if (cells.slice(35).every((c) => !c.items.length && c.day < 15)) cells.length = 35;
		return cells;
	});

	const todayEvents = $derived.by(() => {
		const now = Date.now();
		return $events
			.filter((e) => dateKey(e.startTs) === todayKey)
			.sort((a, b) => a.startTs - b.startTs)
			.map((e) => {
				const endTs = e.startTs + e.mins * 60000;
				const cs = $conversations.filter((v) => e.convIds.includes(v.id));
				const unread = cs.filter((v) => !v.isRead).length;
				const people = e.attendees
					.map((id) => $contacts.find((c) => c.id === id)?.name.split(' (')[0])
					.filter((n): n is string => !!n);
				const isNow = now >= e.startTs && now < Math.max(endTs, e.startTs + 15 * 60000);
				return {
					id: e.id,
					startLabel: hhmm(e.startTs),
					durationLabel: e.mins ? `${e.mins} min` : 'due',
					kind: EVENT_KINDS[e.kind],
					title: e.title,
					isNow,
					meta: [
						people.length ? people.join(', ') : null,
						e.where || null,
						cs.length ? `${cs.length} linked ${cs.length === 1 ? 'thread' : 'threads'}` : null
					]
						.filter(Boolean)
						.join(' · '),
					hasUnread: unread > 0,
					unreadNote: `${unread} unread ${unread === 1 ? 'message' : 'messages'} before this — worth a look`
				};
			});
	});

	const attnRows = $derived.by(() => {
		return $conversations
			.map((v) => {
				const contact = $contacts.find((c) => c.id === v.contactId);
				const status = getConversationStatus(v);
				const urgent = v.timeSensitive && !(v.isRead && v.isResponded);
				const last = v.messages[v.messages.length - 1];
				const preview = isMailPlatform(v.platform) ? last?.subject || last?.content || '' : last?.content || '';
				return { id: v.id, contactId: v.contactId, contact, platform: v.platform, status, urgent, preview, lastTs: last?.timestamp ?? 0 };
			})
			.filter((e) => e.status !== 'done' && e.contact)
			.sort((a, b) => Number(b.urgent) - Number(a.urgent) || b.lastTs - a.lastTs)
			.slice(0, 6);
	});

	const openFollowUps = $derived(
		[...$followUps].filter((f) => !f.done).sort((a, b) => a.dueTs - b.dueTs)
	);

	const dated = $derived($conversations.filter((v) => v.dueTs && !(v.isRead && v.isResponded)));
	const overdueCount = $derived(dated.filter((v) => (v.dueTs as number) < Date.now()).length);

	const unscheduled = $derived.by(() => {
		return $conversations
			.filter((v) => v.timeSensitive && !v.dueTs && !(v.isRead && v.isResponded))
			.map((v) => {
				const c = $contacts.find((x) => x.id === v.contactId);
				const last = v.messages[v.messages.length - 1];
				return { id: v.id, contactId: v.contactId, name: c?.name.split(' (')[0] ?? '', platform: v.platform, preview: last?.content ?? '' };
			});
	});

	const attnTotal = $derived.by(() => {
		let unread = 0,
			needs = 0;
		$conversations.forEach((v) => {
			const st = getConversationStatus(v);
			if (st === 'unread') unread++;
			else if (st === 'needs') needs++;
		});
		return unread + needs;
	});

	const calSummaryMonth = $derived(
		`${$events.length} scheduled` +
			(dated.length ? ` · ${dated.length} open thread ${dated.length === 1 ? 'deadline' : 'deadlines'}` : '') +
			(overdueCount ? ` · ${overdueCount} overdue` : '')
	);

	const todaySummary = $derived(
		(todayEvents.length ? `${todayEvents.length} ${todayEvents.length === 1 ? 'thing' : 'things'} on your schedule` : 'Nothing scheduled') +
			' · ' +
			(attnTotal ? `${attnTotal} ${attnTotal === 1 ? 'conversation needs' : 'conversations need'} attention` : 'inbox is clear') +
			(openFollowUps.length ? ` · ${openFollowUps.length} follow-up${openFollowUps.length === 1 ? '' : 's'}` : '')
	);

	const calTitle = $derived(calView === 'today' ? 'Today' : calTitleMonth);
	const calSummary = $derived(calView === 'today' ? todaySummary : calSummaryMonth);

	function openConversation(contactId: string) {
		goto(`/conversation/${contactId}`);
	}
</script>

<div class="calendar animate-in">
	<header class="header">
		<a href="/" class="btn btn-secondary btn-icon" title="Back to inbox">
			<ChevronLeft size={16} strokeWidth={1.5} />
		</a>
		<h2>{calTitle}</h2>
		<span class="spacer"></span>
		<span class="seg">
			{#each viewOptions as o}
				<label class="seg-opt">
					<input type="radio" name="coms-calview" checked={calView === o.value} onchange={() => (calView = o.value)} />
					{o.label}
				</label>
			{/each}
		</span>
		{#if calView === 'month'}
			<span class="month-nav">
				<button class="btn btn-ghost" onclick={() => (monthOffset = 0)}>This month</button>
				<button class="btn btn-secondary btn-icon" title="Previous month" onclick={() => monthOffset--}>
					<ChevronLeft size={15} strokeWidth={1.5} />
				</button>
				<button class="btn btn-secondary btn-icon" title="Next month" onclick={() => monthOffset++}>
					<ChevronRight size={15} strokeWidth={1.5} />
				</button>
			</span>
		{/if}
	</header>
	<p class="summary text-muted">{calSummary}</p>

	{#if calView === 'today'}
		<div class="today-grid">
			<div>
				<div class="section-header">
					<span class="section-label">Schedule</span>
					<span class="text-muted section-count">
						{new Date().toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
					</span>
				</div>
				{#if todayEvents.length}
					<div class="event-list">
						{#each todayEvents as e}
							<div class="event-card" class:now={e.isNow}>
								<div class="event-time">
									<div class="event-start">{e.startLabel}</div>
									<div class="text-muted event-duration">{e.durationLabel}</div>
								</div>
								<div class="event-body">
									<div class="event-top">
										<Tag variant={e.kind.tagVariant}>{e.kind.label}</Tag>
										<span class="event-title">{e.title}</span>
										{#if e.isNow}
											<span class="event-now">Now</span>
										{/if}
									</div>
									<p class="text-muted event-meta">{e.meta}</p>
									{#if e.hasUnread}
										<p class="event-unread">{e.unreadNote}</p>
									{/if}
								</div>
								<Button variant="secondary" class="event-prep" onclick={() => (prepEventId = e.id)}>Prep</Button>
							</div>
						{/each}
					</div>
				{:else}
					<div class="empty-card">
						<p class="text-muted">Nothing scheduled today.</p>
					</div>
				{/if}

				{#if openFollowUps.length}
					<div class="followups-block">
						<div class="section-header">
							<span class="section-label">Follow-ups</span>
							<span class="text-muted section-count">{openFollowUps.length}</span>
						</div>
						<div class="follow-card">
							{#each openFollowUps as f, i}
								<div class="follow-row" class:last={i === openFollowUps.length - 1}>
									<button class="btn btn-ghost btn-icon follow-done" title="Mark done" onclick={() => completeFollowUp(f.id)}>
										<span class="follow-circle"></span>
									</button>
									<span class="follow-text">{f.text}</span>
									<span class="text-muted follow-due">{dueLabel(f.dueTs)}</span>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>

			<div>
				<div class="section-header">
					<span class="section-label">Needs attention</span>
					<span class="text-muted section-count">{attnRows.length}</span>
				</div>
				{#if attnRows.length}
					<div class="attn-card">
						{#each attnRows as a, i}
							{#if a.contact}
								<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
								<div class="attn-row" class:last={i === attnRows.length - 1} onclick={() => openConversation(a.contactId)}>
									<div class="attn-top">
										<span class="platform-tag">{PLATFORMS[a.platform].label}</span>
										<span class="attn-name">{a.contact.name}</span>
										{#if a.urgent}
											<Tag variant="alert">Time-sensitive</Tag>
										{/if}
									</div>
									<p class="text-muted attn-preview">{a.preview}</p>
								</div>
							{/if}
						{/each}
					</div>
				{:else}
					<div class="empty-card">
						<p class="text-muted">All clear — nothing waiting on you.</p>
					</div>
				{/if}
			</div>
		</div>
	{:else}
		<div class="month-grid">
			{#each dayNames as d}
				<div class="dow">{d}</div>
			{/each}
			{#each calCells as c}
				<div style={c.cellStyle}>
					<div class="cell-head">
						<span style={c.numStyle}>{c.day}</span>
						{#if c.isToday}
							<span class="today-label">Today</span>
						{/if}
					</div>
					<div class="cell-items">
						{#each c.items as it}
							<button style={it.style} title={it.title} onclick={it.onOpen}>
								<span class="item-dot" style:background={it.dot}></span>
								<span class="item-label">{it.label}</span>
							</button>
						{/each}
					</div>
				</div>
			{/each}
		</div>
		<div class="legend">
			<span class="text-muted legend-item"><span class="legend-dot" style:background="var(--color-alert)"></span>Deadline or overdue</span>
			<span class="text-muted legend-item"><span class="legend-dot" style:background="var(--color-accent)"></span>Meeting, call or appointment</span>
			<span class="text-muted legend-item">
				<span class="legend-dot" style:background="color-mix(in srgb, var(--color-text) 35%, transparent)"></span>Resolved
			</span>
		</div>

		{#if unscheduled.length}
			<div class="unscheduled-block">
				<div class="section-header">
					<span class="section-label">Time-sensitive, no date yet</span>
					<span class="text-muted section-count">{unscheduled.length}</span>
				</div>
				<div class="unscheduled-card">
					{#each unscheduled as u, i}
						<div class="unscheduled-row" class:last={i === unscheduled.length - 1}>
							<span class="platform-tag">{PLATFORMS[u.platform].label}</span>
							<span class="unscheduled-name">{u.name}</span>
							<span class="text-muted unscheduled-preview">{u.preview}</span>
							<input class="input unscheduled-date" type="date" onchange={(e) => setDue(u.id, e.currentTarget.value)} />
							<button class="btn btn-ghost" onclick={() => openConversation(u.contactId)}>Open</button>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	{/if}
</div>

<EventPrepDialog eventId={prepEventId} onclose={() => (prepEventId = null)} />
<DemoBadge />

<style>
	.calendar {
		max-width: 1080px;
		margin: 0 auto;
		padding: 38px 32px 100px;
	}

	.header {
		display: flex;
		align-items: center;
		gap: 14px;
		margin-bottom: 6px;
	}

	.header h2 {
		margin: 0;
		font-size: 30px;
		letter-spacing: -0.01em;
	}

	.spacer {
		flex: 1;
	}

	.month-nav {
		display: flex;
		gap: 8px;
	}

	.summary {
		font-size: 13px;
		margin: 0 0 26px;
	}

	.section-header {
		display: flex;
		align-items: baseline;
		gap: 8px;
		margin-bottom: 10px;
	}

	.section-label {
		font-family: var(--font-heading);
		font-weight: 500;
		font-size: 11px;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: color-mix(in srgb, var(--color-text) 60%, transparent);
	}

	.section-count {
		font-size: 11px;
	}

	/* Today view */
	.today-grid {
		display: grid;
		grid-template-columns: 1.45fr 1fr;
		gap: 26px;
		align-items: start;
	}

	.event-list {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.event-card {
		display: flex;
		gap: 16px;
		align-items: flex-start;
		background: var(--color-surface);
		border: 1px solid var(--color-divider);
		border-radius: var(--radius-md);
		padding: 16px 18px;
	}

	.event-card.now {
		border-color: color-mix(in srgb, var(--color-alert) 45%, transparent);
	}

	.event-time {
		flex: none;
		width: 74px;
		text-align: right;
	}

	.event-start {
		font-family: var(--font-heading);
		font-weight: 500;
		font-size: 15px;
	}

	.event-duration {
		font-size: 11.5px;
	}

	.event-body {
		flex: 1;
		min-width: 0;
	}

	.event-top {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
	}

	.event-title {
		font-family: var(--font-heading);
		font-weight: 500;
		font-size: 17px;
		letter-spacing: -0.01em;
	}

	.event-now {
		font-size: 9.5px;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--color-alert);
	}

	.event-meta {
		font-size: 13px;
		margin: 6px 0 0;
	}

	.event-unread {
		font-size: 13px;
		margin: 8px 0 0;
		color: var(--color-alert-text);
	}

	:global(.event-prep) {
		flex: none;
		font-size: 12px;
		padding: 5px 11px;
	}

	.empty-card {
		background: var(--color-surface);
		border: 1px solid var(--color-divider);
		border-radius: var(--radius-md);
		padding: 26px;
		text-align: center;
	}

	.followups-block {
		margin-top: 32px;
	}

	.follow-card {
		background: var(--color-surface);
		border: 1px solid var(--color-divider);
		border-radius: var(--radius-md);
		overflow: hidden;
	}

	.follow-row {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 11px 14px;
		border-bottom: 1px solid var(--color-divider);
	}

	.follow-row.last {
		border-bottom: none;
	}

	.follow-circle {
		width: 15px;
		height: 15px;
		border-radius: 50%;
		border: 1.5px solid currentColor;
		display: block;
	}

	.follow-text {
		flex: 1;
		min-width: 0;
		font-size: 13.5px;
	}

	.follow-due {
		font-size: 11.5px;
	}

	.attn-card {
		background: var(--color-surface);
		border: 1px solid var(--color-divider);
		border-radius: var(--radius-md);
		overflow: hidden;
	}

	.attn-row {
		padding: 13px 16px;
		cursor: pointer;
		border-bottom: 1px solid var(--color-divider);
	}

	.attn-row.last {
		border-bottom: none;
	}

	.attn-row:hover {
		background: color-mix(in srgb, var(--color-text) 4%, transparent);
	}

	.attn-top {
		display: flex;
		align-items: center;
		gap: 9px;
		flex-wrap: wrap;
	}

	.attn-name {
		font-family: var(--font-heading);
		font-weight: 500;
		font-size: 14.5px;
	}

	.attn-preview {
		font-size: 12.5px;
		margin: 6px 0 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.platform-tag {
		display: inline-flex;
		align-items: center;
		font-size: 10.5px;
		font-weight: 500;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		padding: 3px 9px;
		border-radius: calc(var(--radius-md) * 0.75);
		background: color-mix(in srgb, var(--color-text) 10%, transparent);
		flex: none;
	}

	/* Month view */
	.month-grid {
		display: grid;
		grid-template-columns: repeat(7, minmax(0, 1fr));
		gap: 1px;
		background: var(--color-divider);
		border: 1px solid var(--color-divider);
		border-radius: var(--radius-md);
		overflow: hidden;
	}

	.dow {
		background: var(--color-surface);
		padding: 9px 10px;
		font-family: var(--font-heading);
		font-weight: 500;
		font-size: 10.5px;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: color-mix(in srgb, var(--color-text) 58%, transparent);
	}

	.cell-head {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-bottom: 6px;
	}

	.today-label {
		font-size: 9px;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--color-accent);
	}

	.cell-items {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.item-dot {
		width: 5px;
		height: 5px;
		flex: none;
		border-radius: 50%;
	}

	.item-label {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.legend {
		display: flex;
		gap: 18px;
		flex-wrap: wrap;
		align-items: center;
		margin: 16px 0 0;
	}

	.legend-item {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 12px;
	}

	.legend-dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
	}

	.unscheduled-block {
		margin-top: 38px;
	}

	.unscheduled-card {
		background: var(--color-surface);
		border: 1px solid var(--color-divider);
		border-radius: var(--radius-md);
		overflow: hidden;
	}

	.unscheduled-row {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 13px 18px;
		border-bottom: 1px solid var(--color-divider);
	}

	.unscheduled-row.last {
		border-bottom: none;
	}

	.unscheduled-name {
		font-family: var(--font-heading);
		font-weight: 500;
		font-size: 15px;
	}

	.unscheduled-preview {
		flex: 1;
		min-width: 0;
		font-size: 13px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.unscheduled-date {
		width: auto;
		min-height: 30px;
		font-size: 12.5px;
		padding: 3px 8px;
	}
</style>
