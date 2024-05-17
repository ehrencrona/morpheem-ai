<script lang="ts">
	import { slide } from 'svelte/transition';
	import { fetchAskMeAnything } from '../api/write/ama/client';
	import SpinnerButton from './SpinnerButton.svelte';

	export let word: string;
	export let sentence: string;

	let question: string = '';
	let answer: string = '';

	const onSubmit = async () => {
		if (!question) return;

		answer = await fetchAskMeAnything({ question, word, sentence });
	};
</script>

<div class="">
	<div class="mb-2 text-xs font-lato">Ask me anything</div>

	<form class="">
		<input
			type="text"
			class="bg-blue-1 rounded-sm block p-2 text-base mb-1 w-full"
			bind:value={question}
		/>
		<div class="text-xxs font-lato">(enter an English word to get a Polish translation)</div>

		<SpinnerButton
			onClick={onSubmit}
			className="text-blue-1 bg-blue-3 rounded-md px-4 py-1 mt-3 mb-1 text-xs"
			>Help me</SpinnerButton
		>
	</form>

	{#if answer}
		<div class="mt-3 text-sm" transition:slide>
			{answer}
		</div>
	{/if}
</div>
