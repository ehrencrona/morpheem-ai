<script lang="ts">
	import { onMount } from 'svelte';
	import { sendClozes, sendGenerateCloze } from '../api/cloze/create/client';
	import AddExercisesDumb from './AddExercisesDumb.svelte';
	import { logError } from '$lib/logError';

	const noOfExercises = 6;

	export let onCancel: () => Promise<any>;

	let clozes: import('../../../logic/generateCloze').Cloze[] = [];

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

	const onGenerate = async (skill: string) => {
		clozes = await sendGenerateCloze({ skill, noOfExercises });

		try {
			let history = JSON.parse(localStorage.getItem('exercisesAdded') || '[]') as string[];

			history = dedup((history || []).concat(skill));

			suggestions = [...hardcodedSuggestions, ...history]

			localStorage.setItem('exercisesAdded', JSON.stringify(history.slice(-6)));
		} catch (e) {
			logError(e);
		}
	};

	const onMore = async (skill: string) => {
		clozes = await sendGenerateCloze({ skill, noOfExercises: clozes.length + noOfExercises });
	};

	const onStore = async () => {
		await sendClozes(clozes);

		await onCancel();
	};
</script>

<AddExercisesDumb
	{clozes}
	{onGenerate}
	{onStore}
	{onCancel}
	{onMore}
	suggestions={suggestions.slice(-6)}
/>
