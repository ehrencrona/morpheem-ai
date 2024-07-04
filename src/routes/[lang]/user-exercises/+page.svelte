<script lang="ts">
	import { toPercent } from '$lib/toPercent';
	import { deleteUserExercise } from '../api/user-exercises/[id]/client';
	import type { PageData } from './$types';

	export let data: PageData;

	async function deleteExercise(id: number) {
		await deleteUserExercise(id);

		data.exercises = data.exercises.filter((exercise) => exercise.id !== id);
	}
</script>

<main>
	<h1 class="text-xl mt-12 mb-4">Exercises</h1>

	<div class="grid gap-3 items-baseline grid-cols-[auto_1fr_auto_auto] md:grid-cols-[auto_auto_1fr_auto_auto] text-sm md:text-base">
		{#each data.exercises as exercise}
			<div class="text-xs font-lato">#{exercise.id}<br />{toPercent(exercise.level / 100)}</div>

			<div class="hidden md:block">
				<span class="bg-blue-3 text-white p-1 text-xs">{exercise.exercise}</span>
			</div>

			<div>
				{#if exercise.exercise == 'cloze' || exercise.exercise == 'cloze-inflection' || exercise.exercise == 'write'}
					<a href={`/${data.lang}/words/${exercise.wordId}`} class="text-blue-3 underline">
						{exercise.word}</a
					>
				{:else if exercise.exercise == 'phrase-cloze'}
					<div>"{exercise.phrase}"</div>
				{/if}

				<div class="block md:hidden">
					<span class="bg-blue-3 text-white p-1 text-xxs">{exercise.exercise}</span>
				</div>
			</div>

			<div>
				{exercise.sentence?.sentence}

				<a
					href={`/${data.lang}/sentences/${exercise.sentenceId}`}
					class="text-xs font-lato text-blue-3 underline">{exercise.sentence?.id}</a
				>
			</div>

			<div class="text-right">
				{exercise.timeAgo}

				<div class="text-xs font-lato">
					{toPercent(exercise.alpha)} / {toPercent(exercise.beta)}
				</div>

				<button type="button" class="text-red" on:click={() => deleteExercise(exercise.id)}>
					delete
				</button>
			</div>
		{/each}
	</div>
</main>
