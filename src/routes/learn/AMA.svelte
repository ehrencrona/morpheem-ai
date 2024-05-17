<script lang="ts">
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

<div style="margin-top: 2em">
	<div>Ask me anything</div>
	<form style="display: flex">
		<input type="text" bind:value={question} />
		<SpinnerButton on:click={onSubmit}>Help me</SpinnerButton>
	</form>
	<div style="font-size: 80%; margin-top: 1em">
		(enter an English word to get a Polish translation)
	</div>

	{#if answer}
		<div style="margin-top: 1em">
			<i>{answer}</i>
		</div>
	{/if}
</div>

<style>
	input {
		font-size: larger;
		width: 300px;
		padding: 6px;
	}
</style>
