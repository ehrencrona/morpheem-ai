<script lang="ts">
	import type * as DB from '../../../db/types';
	import SpinnerButton from '../../../components/SpinnerButton.svelte';
	import { getLanguageOnClient } from '../api/api-call';
	import { getShowTransliteration } from '$lib/settings';
	import CloseSvg from '../../../components/CloseSvg.svelte';

	export let word: DB.Word;
	export let form: string | undefined = undefined;
	export let inflected: string | undefined = undefined;
	export let onRemove: (() => void) | undefined = undefined;

	export let mnemonic: string | undefined = undefined;
	export let english: string | undefined = undefined;
	export let transliteration: string | undefined = undefined;

	export let onEditMnemonic: (word: DB.Word, mnemonic?: string) => Promise<any>;

	$: showLemma = inflected && (word.word !== inflected || form);
</script>

<div class="bg-light-gray rounded-md w-full border border-gray md:max-w-[500px] mb-4">
	<div class="font-medium mb-1 flex bg-blue-3 text-[#fff] px-3 py-2 rounded-t-md items-baseline">
		<a
			href="https://en.wiktionary.org/wiki/{word.word}#{getLanguageOnClient().name}"
			target="_blank"
			class={`text-base ${showLemma ? '' : 'flex-1'}`}
			>{inflected || word.word}
		</a>
		{#if showLemma}
			<span class="text-xs font-lato flex-1 ml-2">
				{#if word.word != inflected}{word.word}{/if}{#if form}
					<span
						>{#if word.word != inflected},
						{/if}{form}</span
					>
				{/if}
			</span>
		{/if}

		{#if onRemove}
			<button
				type="button"
				on:click={onRemove}
				class="flex justify-center items-center p-[4px] mr-[-6px] ml-1"
			>
				<CloseSvg />
			</button>
		{/if}
	</div>

	<div class="px-3 pb-4">
		{#if english}
			<div class="text-balance font-lato mt-2">
				{english}{#if word.type == 'name'}
					(name){/if}
			</div>
		{/if}

		{#if transliteration && getShowTransliteration()}
			<div class="text-xs font-lato mt-2">{transliteration}</div>
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
