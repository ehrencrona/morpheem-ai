<script lang="ts">
	import { slide } from 'svelte/transition';
	import SpinnerButton from './SpinnerButton.svelte';

	export let ask: (question: string) => Promise<string>;
	export let explanation: string | undefined = undefined;
	export let wordId: number;

	let question: string | undefined = undefined;
	let answer: string | undefined = undefined;

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

<div
	class="fixed bottom-0 left-0 right-0 bg-[#ffffff] px-4 py-2 flex justify-center center z-30 {isFullScreen
		? 'top-0'
		: ''}"
	style="box-shadow: 0 -2px 4px -1px rgba(0, 0, 0, 0.1); transition: top 0.3s;"
>
	<div class="w-full max-w-[800px]">
		<div class="mb-2 text-sm font-lato text-gray-1">Ask me anything</div>

		<form class="">
			<input
				type="text"
				class="bg-blue-1 rounded-sm block p-2 text-base mb-1 w-full"
				bind:value={question}
				on:focus={() => window.innerWidth < 768 && isTouchDevice() && (isFullScreen = true)}
				on:blur={() => (isFullScreen = false)}
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
</div>
