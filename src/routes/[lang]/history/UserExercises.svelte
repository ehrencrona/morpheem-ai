<script lang="ts">
	import CloseSvg from '../../../components/CloseSvg.svelte';
	import SpinnerButton from '../../../components/SpinnerButton.svelte';
	import type { Sentence, UserExercise } from '../../../db/types';
	import { deleteUserExercise } from '../api/user-exercises/[id]/client';

	export let exercises: (UserExercise & { sentence: Sentence; timeAgo: string; id: number })[];

	async function deleteExercise(id: number) {
		await deleteUserExercise(id);

		exercises = exercises.filter((exercise) => exercise.id !== id);
	}

	export let showAll = false;

	let openExercises: number[] = [];

	function toggleExercise(id: number) {
		if (openExercises.includes(id)) {
			openExercises = openExercises.filter((i) => i !== id);
		} else {
			openExercises = [...openExercises, id];
		}
	}
</script>

<p class="text-sm font-lato mb-6">
	When there was something you didn't know, new exercises will be created for you. These are the
	most recently created ones.
</p>

<div class="grid gap-3 items-center grid-cols-[1fr_auto] md:grid-cols-[1fr_auto] text-base mb-4">
	{#each showAll ? exercises : exercises.slice(0, 6) as exercise}
		<div
			on:click={() => toggleExercise(exercise.id)}
			class="cursor-pointer bg-light-gray rounded-md px-4 py-3 font-sans"
		>
			{#if exercise.exercise == 'phrase-cloze'}
				{openExercises.includes(exercise.id)
					? exercise.sentence.sentence
					: exercise.sentence.sentence.replace(exercise.phrase, '_____')}
			{:else}
				{exercise.sentence.sentence} [{'word' in exercise && exercise.word}]
			{/if}
		</div>

		<div>
			<button type="button" class="bg-red p-1" on:click={() => deleteExercise(exercise.id)}>
				<CloseSvg />
			</button>
		</div>
	{/each}
</div>

{#if exercises.length > 6}
	<SpinnerButton
		onClick={async () => (showAll = !showAll)}
		className="underline text-blue-3 text-sm font-lato mb-2"
	>
		{showAll ? 'Show less' : 'Show more'}
	</SpinnerButton>
{/if}
