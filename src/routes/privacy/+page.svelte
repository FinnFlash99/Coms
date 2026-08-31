<script lang="ts">
	import LegalPage from '$components/LegalPage.svelte';

	const clauses = [
		{
			num: '01',
			title: 'What we collect',
			body: 'The messages you asked us to gather, and which of them you have dealt with. That second part is the entire product, and also the part you would most like us to forget. We cannot. It is the point.'
		},
		{
			num: '02',
			title: 'What we do not collect',
			body: 'Your location, your contacts list for its own sake, your browsing history, or the seven drafts you typed and deleted before sending "sounds good!". Those are gone. They were never here. Let them go.'
		},
		{
			num: '03',
			title: 'Who we share it with',
			body: 'Nobody. There is no advertising business hiding behind this page. If a company ever offers to buy your unread count, it will be a very strange day and you will be told about it.'
		},
		{
			num: '04',
			title: 'Otter data policy',
			body: 'The otter cannot read. It has no access to your messages, your calendar, or your notes. It has access to water. This has been independently verified by looking at it.'
		},
		{
			num: '05',
			title: 'Cookies',
			body: 'A small amount of information is kept in your browser so the app remembers your theme, your priority senders, and that you have already seen the welcome screen. Clearing it resets the app and nothing else.'
		},
		{
			num: '06',
			title: 'Your rights',
			body: 'You may leave at any time and take your data with you. You may also stay and ignore everything in your inbox indefinitely. Both are protected rights under this placeholder.'
		},
		{
			num: '07',
			title: 'Contact',
			body: 'There is no contact address yet, because this page is a placeholder written to fill a link that would otherwise go nowhere. When there is a real policy, there will be a real address.'
		}
	];
</script>

<svelte:head>
	<title>Privacy Policy - Coms</title>
</svelte:head>

<LegalPage
	title="Privacy Policy"
	subtitle="Also not real. Also not legal advice. The otter has been moved to this page and is now underwater, which it insists is a metaphor for data minimisation."
	otterEmoji="🦦"
	{clauses}
	calloutLead="Short version: your messages are yours, the otter cannot read, and nobody here wants your group chat."
	crossLinkHref="/terms"
	crossLinkLabel="Terms of Service"
/>
