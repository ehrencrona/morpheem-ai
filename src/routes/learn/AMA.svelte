<script lang="ts">
	import { slide } from 'svelte/transition';
	import SpinnerButton from './SpinnerButton.svelte';

	export let ask: (question: string) => Promise<string>;
	export let explanation: string | undefined = undefined;
	export let wordId: number;

	let question: string | undefined = undefined;
	let answer: string | undefined = undefined;

	$: if (wordId) {
		question = undefined;
		answer = undefined;
	}

	const onSubmit = async () => {
		if (!question) return;

		answer = await ask(question);
	};
</script>

<div class="">
	<div class="mb-2 text-sm font-lato text-gray-1">Ask me anything</div>

	<form class="">
		<input
			type="text"
			class="bg-blue-1 rounded-sm block p-2 text-base mb-1 w-full"
			bind:value={question}
		/>
		{#if explanation}
			<div class="text-xs font-lato text-gray-1">{explanation}</div>
		{/if}

		<SpinnerButton
			onClick={onSubmit}
			isSubmit={true}
			className="text-blue-1 bg-blue-3 rounded-md px-5 py-1 mt-3 mb-1 text-xs"
		>
			Get answer
		</SpinnerButton>
	</form>

	{#if answer}
		<div class="mt-3 text-sm mb-2" transition:slide>
			{@html /* Replace **word** with <b>word</b>*/
			/* Replace < with lt; */
			answer
				.replace(/</g, 'lt;')
				.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
				.replace(/\n/g, '<br>')}
			<button
				on:click={() => (answer = undefined) && (question = undefined)}
				class="text-red underline ml-1">Clear</button
			>
		</div>
	{/if}
</div>
