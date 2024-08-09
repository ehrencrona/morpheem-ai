<script lang="ts">
	import ConfirmSvg from '../../../components/ConfirmSvg.svelte';
	import SpinnerButton from '../../../components/SpinnerButton.svelte';
	import type { UserExerciseWithSentence } from '../../../db/types';
	import { getLanguageOnClient } from '../api/api-call';

	let sentence = '';

	export let onGenerate: (sentence: string) => Promise<UserExerciseWithSentence>;
	export let exercises: UserExerciseWithSentence[];

	let wasStored: UserExerciseWithSentence | undefined;

	$: if (sentence) {
		wasStored = undefined;
	}
</script>

<form>
	<div class="text-sm font-lato">Do you want to learn how to say a specific phrase? Enter it and you will get it as a translate exercise.</div>

	<div class="mt-6 mb-4">
		<div class="flex md:items-center items-end gap-4 flex-col md:flex-row">
			<input
				bind:value={sentence}
				type="text"
				placeholder="Enter an English or {getLanguageOnClient().name} sentence"
				class="bg-blue-1 rounded-sm block p-2 text-lg flex-1 w-full md:w-auto"
			/>

			<SpinnerButton
				isSubmit={true}
				type="primary"
				onClick={async () => {
					if (!sentence.trim()) {
						return;
					}

					wasStored = await onGenerate(sentence);

					exercises = [wasStored, ...exercises];
					sentence = '';
				}}>Save</SpinnerButton
			>
		</div>
	</div>

	<div class="flex flex-col gap-4 text-base">
		{#each exercises as exercise}
			<div
				class="bg-light-gray rounded-md px-4 py-3 w-full font-sans {exercise === wasStored
					? ' font-bold'
					: ''}"
			>
				{#if exercise === wasStored}
					<div class="w-4 h-4 inline-block mr-2">
						<ConfirmSvg />
					</div>
				{/if}

				{exercise.sentence.sentence}
			</div>
		{/each}
	</div>
</form>
