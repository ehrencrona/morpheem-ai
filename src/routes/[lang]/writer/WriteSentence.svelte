<script lang="ts">
	import { exerciseToString } from '$lib/exerciseToString';
	import { filterUndefineds } from '$lib/filterUndefineds';
	import { onMount } from 'svelte';
	import { CodedError } from '../../../CodedError';
	import SpinnerButton from '../../../components/SpinnerButton.svelte';
	import type * as DB from '../../../db/types';
	import type { WriteEvaluation } from '../../../logic/evaluateWrite';
	import type { ExerciseKnowledge, WordKnowledge } from '../../../logic/types';
	import { getLanguageOnClient } from '../api/api-call';
	import { sendKnowledge } from '../api/knowledge/client';
	import { fetchAskMeAnything } from '../api/write/ama/client';
	import { sendWrittenSentence } from '../api/write/client';
	import { fetchWriteEvaluation } from '../api/write/evaluate/client';
	import { getCorrectedParts } from '../learn/getCorrectedParts';
	import Ama from '../learn/AMA.svelte';

	export let onDone: (sentence: DB.Sentence) => Promise<any>;

	let feedback: WriteEvaluation | undefined;
	let entered: string = '';

	let input: HTMLInputElement;

	$: correctParts =
		feedback && !feedback.isCorrect
			? getCorrectedParts(
					feedback.correctedSentence,
					filterUndefineds(feedback.correctedParts.map(({ correction }) => correction))
				)
			: undefined;
	$: enteredParts = feedback
		? getCorrectedParts(
				entered,
				filterUndefineds(feedback.correctedParts.map(({ userWrote }) => userWrote))
			)
		: undefined;

	function clear() {
		entered = '';
		feedback = undefined;
	}

	onMount(() => {
		input.focus();
	});

	const onSubmit = async () => {
		entered = entered.trim();

		if (!entered) {
			throw new CodedError('Please enter a sentence', 'sentenceMissing');
		}

		feedback = await fetchWriteEvaluation({
			exercise: 'writer',
			entered
		});

		console.log(
			`Feedback on "${entered}":\nCorrected sentence: ${feedback.correctedSentence}\n` +
				`Corrected part: ${feedback.correctedParts.map((part) => `"${part.userWrote}" -> "${part.correction}" (severity ${part.severity})`).join(', ') || 'none'}\n` +
				`User exercises: ${feedback.userExercises.map(exerciseToString).join(', ')}`
		);
	};

	const store = async ({ feedback, entered }: { feedback: WriteEvaluation; entered: string }) => {
		let { sentence, knowledge: gotKnowledge } = await sendWrittenSentence({
			sentence: feedback.correctedSentence || entered,
			entered
		});

		const knowledge: (WordKnowledge & { word: DB.Word })[] = gotKnowledge;

		let userExercises = feedback.userExercises.map(
			(e) =>
				({
					...e,
					sentenceId: e.sentenceId == -1 ? sentence.id : e.sentenceId
				}) as ExerciseKnowledge
		);

		sendKnowledge(knowledge, userExercises);

		return sentence;
	};

	const clickedContinue = async () => {
		if (!feedback) {
			throw new Error('Invalid state');
		}

		const sentence = await store({ feedback, entered });

		clear();

		return onDone(sentence);
	};

	const askMeAnything = async (question: string) => {
		const answer = await fetchAskMeAnything({
			exercise: 'write',
			question,
			sentenceEntered: entered,
			sentenceCorrected: feedback?.correctedSentence
		});

		return answer;
	};
</script>

<div>
	<form class="border-blue-3 border-4 p-4 rounded-lg">
		{#if !feedback}
			<p class="mb-4 mt-2 text-base font-lato">
				Write anything you want in {getLanguageOnClient().name}. Leave parts in English if you can't
				find a word.
			</p>

			<input
				type="text"
				bind:value={entered}
				bind:this={input}
				class="bg-blue-1 rounded-sm block w-full p-2 text-lg mb-4 mt-2"
				lang={getLanguageOnClient().code}
			/>
		{:else}
			<div class="mb-6 text-sm text-balance border-b-[1px] border-blue-3 pb-3">
				{feedback.feedback}
			</div>

			{#if enteredParts}
				<div class="text-base mb-4 text-balance {feedback.isCorrect ? 'text-green' : ''}">
					{#each enteredParts as part}
						{#if part.isCorrected}
							<span class="line-through text-red">{part.part}</span>
						{:else}
							{part.part}
						{/if}
					{/each}
				</div>
			{/if}

			{#if correctParts}
				<div class="text-xl font-bold mb-4 text-balance">
					{#each correctParts as part}
						{#if part.isCorrected}
							<span class="text-green">{part.part}</span>
						{:else}
							{part.part}
						{/if}
					{/each}
				</div>
			{/if}
		{/if}

		<div class="mt-4 flex justify-end">
			{#if !feedback}
				<SpinnerButton onClick={onSubmit} isSubmit={true}>Submit</SpinnerButton>
			{:else}
				<SpinnerButton onClick={async () => (feedback = undefined)} type="secondary">
					Edit
				</SpinnerButton>

				<SpinnerButton onClick={clickedContinue} grabFocus={true}>Continue</SpinnerButton>
			{/if}
		</div>
	</form>

	<Ama suggestions={[`Can I express this better?`]} ask={askMeAnything} wordId={0} />
</div>
