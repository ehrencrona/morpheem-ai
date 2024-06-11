<script lang="ts">
	import type * as DB from '../../../db/types';
	import SpinnerButton from '../../../components/SpinnerButton.svelte';
	import { getLanguageOnClient } from '../api/api-call';

	export let word: DB.Word;
	export let form: string | undefined = undefined;
	export let inflected: string | undefined = undefined;
	export let onRemove: (() => void) | undefined = undefined;

	export let mnemonic: string | undefined = undefined;
	export let english: string | undefined = undefined;

	export let onEditMnemonic: (word: DB.Word, mnemonic?: string) => Promise<any>;

	$: showLemma = inflected && (word.word !== inflected || form);
</script>

<div class="bg-light-gray rounded-md w-full border border-gray md:max-w-[500px] mb-4">
	<div class="font-medium mb-1 flex bg-blue-3 text-[#fff] px-3 py-2 rounded-t-md items-baseline">
		<a
			href="/{getLanguageOnClient().code}/words/{word.id}"
			class={`text-base ${showLemma ? '' : 'flex-1'}`}
			>{inflected || word.word}
		</a>
		{#if showLemma}
			<span class="text-xs font-lato flex-1 ml-2">
				{#if word.word != inflected}{word.word}{/if}{#if form}
					<span>{#if word.word != inflected}, {/if}{form}</span>
				{/if}
			</span>
		{/if}

		{#if onRemove}
			<button
				type="button"
				on:click={onRemove}
				class="flex justify-center items-center p-[4px] mr-[-6px] ml-1"
			>
				<svg
					fill="#fff"
					version="1.1"
					id="Layer_1"
					xmlns="http://www.w3.org/2000/svg"
					xmlns:xlink="http://www.w3.org/1999/xlink"
					viewBox="0 0 512 512"
					xml:space="preserve"
					class="w-[10px] h-[10px]"
				>
					<g>
						<g>
							<polygon
								points="512,59.076 452.922,0 256,196.922 59.076,0 0,59.076 196.922,256 0,452.922 59.076,512 256,315.076 452.922,512 
            512,452.922 315.076,256"
							/>
						</g>
					</g>
				</svg>
			</button>
		{/if}
	</div>

	<div class="px-3 pb-4">
		{#if english}
			<div class="text-balance font-lato mt-2">{english}</div>
		{/if}

		<div class="text-xs font-lato mt-2">
			{#if mnemonic}
				<p class="text-balance leading-4">
					{mnemonic}
					<SpinnerButton
						className="text-xs font-lato underline p-0 ml-1"
						onClick={async () => onEditMnemonic(word, mnemonic)}
					>
						Edit
					</SpinnerButton>
				</p>
			{:else}
				<div class="flex justify-end mt-1">
					<SpinnerButton
						className="underline pt-1 pl-5"
						onClick={async () => onEditMnemonic(word, mnemonic)}
					>
						Mnemonic
					</SpinnerButton>
				</div>
			{/if}
		</div>
	</div>
</div>
