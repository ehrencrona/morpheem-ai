<script lang="ts">
	import { logError } from '$lib/logError';
	import type { SendKnowledge } from '$lib/SendKnowledge';
	import { onMount } from 'svelte';
	import type { UserExerciseWithSentence } from '../../../db/types';
	import type { Cloze } from '../../../logic/generateCloze';
	import { sendClozes, sendGenerateCloze } from '../api/cloze/create/client';
	import { sendGenerateTranslate } from '../api/write/create/client';
	import GenerateClozeDumb from './GenerateClozeDumb.svelte';
	import GenerateTranslateDumb from './GenerateTranslateDumb.svelte';

	export let sendKnowledge: SendKnowledge;
	export let translateExercises: UserExerciseWithSentence[];

	const noOfExercises = 6;
	let wasStored = false;

	let clozes: Cloze[] = [];

	const hardcodedSuggestions = [`learn words describing body parts`, `use the future tense`];

	let suggestions = hardcodedSuggestions;

	onMount(() => {
		try {
			let history = JSON.parse(localStorage.getItem('exercisesAdded') || '[]') as string[];

			suggestions = suggestions.concat(...(history || []));
		} catch (e) {
			logError(e);
		}
	});

	function dedup(array: string[]) {
		return [...new Set(array)];
	}

	const onGenerateCloze = async (skill: string) => {
		clozes = await sendGenerateCloze({ skill, noOfExercises });
		wasStored = false;

		try {
			let history = JSON.parse(localStorage.getItem('exercisesAdded') || '[]') as string[];

			history = dedup((history || []).concat(skill));

			suggestions = [...hardcodedSuggestions, ...history];

			localStorage.setItem('exercisesAdded', JSON.stringify(history.slice(-6)));
		} catch (e) {
			logError(e);
		}
	};

	const onMore = async (skill: string) => {
		wasStored = false;
		clozes = await sendGenerateCloze({ skill, noOfExercises: clozes.length + noOfExercises });
	};

	const onStore = async () => {
		const knowledge = await sendClozes(clozes);

		sendKnowledge([], knowledge);

		wasStored = true;
	};
</script>

<h1 class="text-2xl font-sans font-bold mb-4 lg:mt-8">Fill-in-the-blanks Exercises</h1>

<GenerateClozeDumb
	{clozes}
	onGenerate={onGenerateCloze}
	{onStore}
	{onMore}
	{wasStored}
	suggestions={suggestions.slice(-6)}
/>

<h1 class="text-2xl font-sans font-bold mb-4 lg:mt-8">Translation Exercises</h1>

<GenerateTranslateDumb
	onGenerate={(sentence) => sendGenerateTranslate({ sentence })}
	exercises={translateExercises}
/>
