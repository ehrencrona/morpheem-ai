<script lang="ts">
	import SpinnerButton from '../../../components/SpinnerButton.svelte';
	import type { Cloze } from '../../../logic/generateCloze';

	export let clozes: Cloze[];

	export let suggestions: string[];

	let skill: string;

	export let onGenerate: (skill: string) => Promise<any>;
	export let onStore: () => Promise<any>;
	export let onMore: (skill: string) => Promise<void>;

	export let wasStored = false;
</script>

<form>
	<div class="text-sm font-lato">
		Describe a grammatical issue you want to practice. We will generate fill-in-the-blanks exercises
		using AI. You will get a preview of the exercises before saving them, so you can refine your
		description.
	</div>

	<div class="text-sm font-lato mt-4 text-blue-3 hidden md:block">
		{#each suggestions as suggestion}
			<div>
				"<button
					class="underline"
					type="button"
					on:click={() => {
						skill = suggestion;
						onGenerate(suggestion);
					}}>{suggestion}</button
				>"
			</div>
		{/each}
	</div>

	<div class="mt-6 mb-4">
		<div class="mb-2">I find it difficult to</div>

		<div class="flex md:items-center items-end gap-4 flex-col md:flex-row">
			<input
				bind:value={skill}
				type="text"
				placeholder="know when to use the form xyz"
				class="bg-blue-1 rounded-sm block p-2 text-lg flex-1 w-full md:w-auto"
			/>

			<SpinnerButton
				isSubmit={true}
				type="primary"
				onClick={() => onGenerate(skill)}
				className="underline text-blue-3">Generate</SpinnerButton
			>
		</div>
	</div>
</form>

{#if clozes.length}
	<form>
		<div
			class="max-h-60 overflow-auto mt-3 mb-3 font-lato flex flex-col gap-1 py-4 border-b border-t border-light-gray relative md:mt-8 md:border md:p-2"
		>
			{#each clozes as cloze}
				<div>{cloze.exercise.replace('___', `[${cloze.answer}]`)}</div>
			{/each}
		</div>

		<div class="text-right">
			<SpinnerButton onClick={() => onMore(skill)} className="underline text-blue-3 bottom-0">
				Generate more
			</SpinnerButton>
		</div>

		<div class="flex flex-wrap mt-2">
			<SpinnerButton onClick={onStore}>Save</SpinnerButton>

			{#if wasStored}
				<div class="flex items-center justify-center text-green font-bold pl-2">Saved!</div>
			{/if}
		</div>
	</form>
{/if}
