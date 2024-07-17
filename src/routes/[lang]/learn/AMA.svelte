<script lang="ts">
	import { slide } from 'svelte/transition';
	import SpinnerButton from '../../../components/SpinnerButton.svelte';
	import BottomBar from '../../../components/BottomBar.svelte';
	import CloseSvg from '../../../components/CloseSvg.svelte';

	export let ask: (question: string) => Promise<string>;
	export let explanation: string | undefined = undefined;
	export let wordId: number | undefined;

	export let suggestions: string[] = [];

	let question: string | undefined = undefined;
	let answer: string | undefined;

	let isFullScreen = false;

	function isTouchDevice() {
		return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
	}

	$: if (wordId) {
		question = undefined;
		answer = undefined;
	}

	const onSubmit = async () => {
		if (!question) return;

		answer = await ask(question);
	};
</script>

<BottomBar {isFullScreen}>
	<div class="mb-2 text-sm font-lato text-gray-1">Ask me anything</div>

	<form class="">
		<input
			type="text"
			class="bg-blue-1 rounded-sm block p-2 text-base mb-1 w-full placeholder-darker-gray"
			bind:value={question}
			on:focus={() => window.innerWidth < 768 && isTouchDevice() && (isFullScreen = true)}
			on:blur={() => (isFullScreen = false)}
			placeholder={suggestions.length
				? `e.g. "${suggestions[Math.floor(Math.random() * suggestions.length)]}"`
				: ''}
		/>
		{#if explanation}
			<div class="text-xs font-lato text-gray-1">{explanation}</div>
		{/if}

		<div class="flex items-center mt-3 mb-1">
			<SpinnerButton
				onClick={onSubmit}
				isSubmit={true}
				className="text-blue-1 bg-blue-3 rounded-md px-5 py-1 text-xs font-lato"
			>
				Get answer
			</SpinnerButton>
		</div>
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
				class="ml-1"
				type="button"><CloseSvg fill="000" /></button
			>
		</div>
	{/if}
</BottomBar>
