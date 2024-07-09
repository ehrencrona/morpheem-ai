<script lang="ts">
	import { goto } from '$app/navigation';
	import SpinnerButton from '../../../../components/SpinnerButton.svelte';
	import { knowledgeTypeToExercise } from '../../../../db/knowledgeTypes';
	import type { ExerciseKnowledge, WordKnowledge } from '../../../../logic/types';
	import { getLanguageOnClient } from '../../api/api-call';
	import { sendKnowledge as sendKnowledgeClient } from '../../api/knowledge/client';
	import Cloze from '../../learn/Cloze.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	let wordIndex = -1;

	$: word = data.words[Math.max(wordIndex, 0)];

	const onNext = async () => {
		if (wordIndex >= data.words.length - 1) {
			await goto(`write/done`);
		} else {
			wordIndex++;
		}
	};

	async function sendKnowledge(words: WordKnowledge[], userExercises?: ExerciseKnowledge[]) {
		console.log(
			`Knowledge: ${words.map(({ wordId, type, isKnown }) => `${wordId}, ${knowledgeTypeToExercise(type)}: ${isKnown}`).join(', ')}`
		);

		await sendKnowledgeClient(words, userExercises);
	}
</script>

{#if wordIndex == -1}
	<h1 class="font-sans text-2xl font-bold mt-12 mb-8">2. Active vocabulary</h1>

	<div class="max-w-[600px]">
		<p class="mb-4">
			You will get a sequence of sentences with a word missing. Fill in the correct word.
		</p>

		<p class="mb-4">
			The inflection does not matter for now, just select the correct base form of the word.
		</p>

		<p class="mb-4">This will be used to estimate your active vocabulary size.</p>
	</div>

	<div class="mt-8">
		<SpinnerButton onClick={onNext}>Start</SpinnerButton>
	</div>
{:else}
	<h1 class="text-base">Sentence {wordIndex + 1} / {data.words.length}</h1>

	<Cloze
		{sendKnowledge}
		sentence={word.sentence}
		word={word.word}
		sentenceWords={word.sentenceWords}
		language={getLanguageOnClient()}
		{onNext}
		exerciseId={null}
	/>
{/if}
