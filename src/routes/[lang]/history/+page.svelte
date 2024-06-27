<script lang="ts">
	import type { PageData } from './$types';
	import RecentSentences from './RecentSentences.svelte';
	import RecentWords from './RecentWords.svelte';

	export let data: PageData;
</script>

<h3 class="text-lg mb-4 mt-8">Sentences read</h3>

<RecentSentences sentences={data.readSentences} />

<h3 class="text-lg mb-4 mt-8">Sentences written</h3>

<RecentSentences sentences={data.writtenSentences} />

<h3 class="text-lg mb-4 mt-8">Recent words</h3>

<RecentWords knowledge={data.knowledge} />
