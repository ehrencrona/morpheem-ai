<script lang="ts">
	import type { PageData } from './$types';
	import RecentSentences from './RecentSentences.svelte';
	import RecentWords from './RecentWords.svelte';
	import UserExercises from './UserExercises.svelte';

	export let data: PageData;
</script>

<div class="max-w-[1200px] px-4 md:px-12 lg:mt-8">
	<h3 class="text-lg font-sans font-bold mb-6 mt-4">Sentences read</h3>

	<RecentSentences sentences={data.readSentences} />

	<h3 class="text-lg font-sans font-bold mb-6 mt-12">Sentences written</h3>

	<RecentSentences sentences={data.writtenSentences} />

	<h3 class="text-lg font-sans font-bold mb-6 mt-12">Queued Exercises</h3>

	<UserExercises exercises={data.exercises} />

	<h3 class="text-lg font-sans font-bold mb-6 mt-12">Recent words</h3>

	<RecentWords knowledge={data.knowledge} />
</div>
