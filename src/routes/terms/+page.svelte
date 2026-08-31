<script lang="ts">
	import LegalPage from '$components/LegalPage.svelte';

	const clauses = [
		{
			num: '01',
			title: 'Acceptance of terms',
			body: 'By reading this sentence you have accepted these terms. By reading the next one you accept them again, slightly harder. There is no way out except closing the tab, which we also count as acceptance.'
		},
		{
			num: '02',
			title: 'What Coms does',
			body: 'Coms gathers your messages from several places and shows you which ones are still waiting on a reply. It does not write the replies for you. That part is famously still your job.'
		},
		{
			num: '03',
			title: 'Your responsibilities',
			body: 'Answer your people. Flag the things that actually matter, not everything. Do not mark a thread "responded" when you have only thought about responding — the app cannot tell, but you can, and that is worse.'
		},
		{
			num: '04',
			title: 'Acceptable use',
			body: 'Do not use Coms to organise a large-scale scheme of any kind. Do not use it to ignore your mother more efficiently. Small-scale schemes and ordinary procrastination are permitted and, frankly, expected.'
		},
		{
			num: '05',
			title: 'The otter clause',
			body: 'The otter floating above is a placeholder and holds no legal authority, no equity, and no opinion on your inbox. It is present because an empty legal page is sad and it was available. It floats. That is the whole role.'
		},
		{
			num: '06',
			title: 'Limitation of liability',
			body: 'If you miss a deadline, that is between you and the deadline. Coms will show you it was coming, in red, more than once. What happens after that is a matter of personal character.'
		},
		{
			num: '07',
			title: 'Changes to these terms',
			body: 'These terms will be replaced entirely by real ones written by a real lawyer. You will not be notified, because you are reading a placeholder and we both know it.'
		}
	];
</script>

<svelte:head>
	<title>Terms of Service - Coms</title>
</svelte:head>

<LegalPage
	title="Terms of Service"
	subtitle="These are not real terms. A lawyer has not seen this page. An otter has. Below is what the otter agreed to on your behalf."
	otterEmoji="🦦"
	{clauses}
	calloutLead="When real terms exist, this page gets replaced and the otter is reassigned to the privacy policy. It already knows."
	crossLinkHref="/privacy"
	crossLinkLabel="Privacy Policy"
/>
