<script lang="ts">
	import {
		getPastDue,
		getRepetitionTime,
		getShowTransliteration,
		setClozePreference,
		setPastDue,
		setReadPreference,
		setRepetitionTime,
		setShowTransliteration
	} from '$lib/settings';
	import { onMount } from 'svelte';

	let repetitionTime = 0;
	let pastDue = 0;
	let clozePreference = 0;
	let readPreference = 0;

	onMount(() => {
		repetitionTime = getRepetitionTime();
		pastDue = getPastDue();
	});

	let doTransliterate = getShowTransliteration();

	$: setShowTransliteration(doTransliterate);
</script>

<h1 class="text-2xl font-sans font-bold mb-8 mt-8">Settings</h1>

<label class="block mt-4 mb-4">
	<input type="checkbox" bind:checked={doTransliterate} class="mr-1" />

	Transliterate Korean and Russian
</label>

<div class="grid grid-cols-3 gap-2 items-center">
	<div>More repetition</div>
	<ul class="flex flex-1 justify-center pt-1">
		{#each [-2, -1, 0, 1, 2] as i}
			<li>
				{#if pastDue == i}
					<div class="inline-block w-4 h-4 rounded-full bg-blue-4 border border-blue-4 mr-2"></div>
				{:else}
					<button
						type="button"
						on:click={() => {
							setPastDue(i);
							pastDue = i;
						}}
					>
						<div
							class="inline-block w-4 h-4 rounded-full bg-blue-1 border border-blue-4 mr-2"
						></div>
					</button>
				{/if}
			</li>
		{/each}
	</ul>
	<div class="text-right">More new words</div>

	<div>Rehearse early</div>
	<ul class="flex flex-1 justify-center pt-1">
		{#each [-2, -1, 0, 1, 2] as i}
			<li>
				{#if repetitionTime == i}
					<div class="inline-block w-4 h-4 rounded-full bg-blue-4 border border-blue-4 mr-2"></div>
				{:else}
					<button
						type="button"
						on:click={() => {
							setRepetitionTime(i);
							repetitionTime = i;
						}}
					>
						<div
							class="inline-block w-4 h-4 rounded-full bg-blue-1 border border-blue-4 mr-2"
						></div>
					</button>
				{/if}
			</li>
		{/each}
	</ul>
	<div class="text-right">Rehearse late</div>

	<div>More writing / fill-in-blanks</div>
	<ul class="flex flex-1 justify-center pt-1">
		{#each [-2, -1, 0, 1, 2] as i}
			<li>
				{#if readPreference == i}
					<div class="inline-block w-4 h-4 rounded-full bg-blue-4 border border-blue-4 mr-2"></div>
				{:else}
					<button
						type="button"
						on:click={() => {
							setReadPreference(i);
							readPreference = i;
						}}
					>
						<div
							class="inline-block w-4 h-4 rounded-full bg-blue-1 border border-blue-4 mr-2"
						></div>
					</button>
				{/if}
			</li>
		{/each}
	</ul>
	<div class="text-right">More reading</div>

	<div>More writing</div>
	<ul class="flex flex-1 justify-center pt-1">
		{#each [-2, -1, 0, 1, 2] as i}
			<li>
				{#if clozePreference == i}
					<div class="inline-block w-4 h-4 rounded-full bg-blue-4 border border-blue-4 mr-2"></div>
				{:else}
					<button
						type="button"
						on:click={() => {
							setClozePreference(i);
							clozePreference = i;
						}}
					>
						<div
							class="inline-block w-4 h-4 rounded-full bg-blue-1 border border-blue-4 mr-2"
						></div>
					</button>
				{/if}
			</li>
		{/each}
	</ul>
	<div class="text-right">More fill-the-blanks</div>
</div>
