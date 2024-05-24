<script lang="ts">
	import type { PageData } from './$types';
	import RecentSentences from './RecentSentences.svelte';
	import RecentWords from './RecentWords.svelte';

	export let data: PageData;

	const dateFormat = new Intl.DateTimeFormat('en-US', {
		month: 'short',
		day: 'numeric'
	});

	function formatNumber(n: number) {
		return n.toLocaleString('en-US');
	}
</script>

<a href="/learn" class="inline-block mt-2 bg-blue-3 text-blue-1 rounded-md px-4 py-3">
	Start studying
</a>

<h3 class="text-lg mb-4 mt-8">Your progress</h3>

<div class="grid grid-cols-4 max-w-[500px] text-xs">
	<div class="mb-2">Date</div>
	<div class="mb-2">Time spent</div>
	<div class="mb-2">Sentences seen</div>
	<div class="mb-2">Vocabulary</div>
	{#each data.activity as date}
		<div class="mb-1">
			{dateFormat.format(date.date)}
		</div>
		<div class="mb-1">
			{date.minutes_spent} min
		</div>
		<div class="mb-1">
			{date.sentences_done}
		</div>
		<div class="mb-1">
			{formatNumber(date.words_known)} words
		</div>
	{/each}
</div>

<h3 class="text-lg mb-4 mt-8">Sentences written</h3>

<RecentSentences sentences={data.writtenSentences} />

<h3 class="text-lg mb-4 mt-8">Recent words</h3>

<RecentWords knowledge={data.knowledge} />
