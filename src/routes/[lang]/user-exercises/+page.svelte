<script lang="ts">
	import { toPercent } from '$lib/toPercent';
	import CloseSvg from '../../../components/CloseSvg.svelte';
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

	<div
		class="grid gap-3 items-baseline grid-cols-[auto_1fr_auto_auto_auto] md:grid-cols-[auto_1fr_auto_auto_auto] text-sm md:text-base"
	>
		{#each data.exercises as exercise}
			<div class="text-xs font-lato">#{exercise.id}<br />{toPercent(exercise.level / 100)}</div>

			<div>
				{#if exercise.exercise == 'cloze' || exercise.exercise == 'cloze-inflection' || exercise.exercise == 'write'}
					<a href={`/${data.lang}/words/${exercise.wordId}`} class="text-blue-3 underline">
						{exercise.word}</a
					>
				{:else if exercise.exercise == 'phrase-cloze'}
					<div>"{exercise.phrase}"</div>
				{/if}

				<div>
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

			<div class="text-right text-xs">
				{exercise.timeAgo}

				<div>
					{toPercent(exercise.alpha)} / {toPercent(exercise.beta)}
				</div>
			</div>
			<button
				type="button"
				class="bg-red p-1"
				on:click={() => deleteExercise(exercise.id)}
			>
				<CloseSvg />
			</button>
		{/each}
	</div>
</main>
