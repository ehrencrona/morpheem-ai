<script lang="ts">
	import type * as DB from '../../db/types';
	import SpinnerButton from './SpinnerButton.svelte';

	export let word: DB.Word;
	export let onRemove: (() => void) | undefined = undefined;
	export let expectedKnowledge: string | undefined = undefined;

	export let mnemonic: string | undefined = undefined;
	export let english: string | undefined = undefined;

	export let onGetMnemonic: (word: DB.Word, forceRegeneration: boolean) => Promise<any>;
	export let onEditMnemonic: (word: DB.Word, mnemonic?: string) => Promise<any>;
</script>

<div class="bg-light-gray rounded-md px-4 py-3 w-full md:w-[48%] mb-4">
	<div class="font-medium mb-1 text-xs flex">
		<a href="/words/{word.id}" class="flex-1">{word.word}</a>

		{#if expectedKnowledge != null}
			<span class="text-xxs font-lato ml-1">{expectedKnowledge}</span>
		{/if}

		{#if onRemove}
			<button
				on:click={onRemove}
				class="flex justify-center items-center p-[6px] mt-[-6px] mr-[-6px] ml-1"
			>
				<svg
					fill="#000000"
					height="800px"
					width="800px"
					version="1.1"
					id="Layer_1"
					xmlns="http://www.w3.org/2000/svg"
					xmlns:xlink="http://www.w3.org/1999/xlink"
					viewBox="0 0 512 512"
					xml:space="preserve"
					class="w-2 h-2"
				>
					<g>
						<g>
							<polygon
								points="512,59.076 452.922,0 256,196.922 59.076,0 0,59.076 196.922,256 0,452.922 59.076,512 256,315.076 452.922,512 
            512,452.922 315.076,256 		"
							/>
						</g>
					</g>
				</svg>
			</button>
		{/if}
	</div>

	{#if english}
		<div class="text-balance text-lg font-lato mt-2">{english}</div>
	{/if}

	<div class="text-xs font-lato mt-2">
		{#if mnemonic}
			<p>{mnemonic}</p>
		{/if}
		<div class="flex justify-end mt-1">
			{#if !mnemonic}
				<div class="pt-1">Mnemonic:</div>
			{/if}
			<SpinnerButton className="underline pt-1 pl-5" onClick={() => onGetMnemonic(word, true)}>
				{#if mnemonic}
					Regenerate
				{:else}
					Generate
				{/if}
			</SpinnerButton>

			<SpinnerButton
				className="underline pt-1 pl-5"
				onClick={async () => onEditMnemonic(word, mnemonic)}
			>
				{#if mnemonic}
					Edit
				{:else}
					Write
				{/if}
			</SpinnerButton>
		</div>
	</div>
</div>
