<script lang="ts">
	import type * as DB from '../../../db/types';
	import SpinnerButton from '../../../components/SpinnerButton.svelte';
	import { getLanguageOnClient } from '../api/api-call';
	import { getShowTransliteration } from '$lib/settings';
	import CloseSvg from '../../../components/CloseSvg.svelte';
	import type { UnknownWordResponse } from '../api/word/unknown/+server';
	import EditSvg from '../../../components/EditSvg.svelte';

	export let word: UnknownWordResponse;
	export let inflected: string | undefined = undefined;
	export let onRemove: (() => void) | undefined = undefined;

	export let mnemonic: string | undefined = undefined;
	export let english: string | undefined = undefined;
	export let related: string[] | undefined = undefined;

	export let addBottomMargin = true;

	export let onSelectRelated: ((related: string) => void) | undefined = undefined;

	$: form = word.form;
	$: transliteration = word.transliteration;
	$: expression = word.expression;

	export let onEditMnemonic: ((word: DB.Word, mnemonic?: string) => Promise<any>) | undefined;

	$: showLemma = inflected && (word.word !== inflected || form);
</script>

<div
	class="bg-light-gray rounded-md w-full border border-gray md:max-w-[500px] {addBottomMargin
		? 'mb-4'
		: ''}"
>
	<div class="font-medium flex bg-blue-3 text-[#fff] px-3 py-2 rounded-t-md items-baseline">
		<a
			href="https://en.wiktionary.org/wiki/{word.word}#{getLanguageOnClient().name}"
			target="_blank"
			class={`text-base ${showLemma ? '' : 'flex-1'} font-sans`}
			>{inflected || word.word}
		</a>
		{#if showLemma}
			<span class="text-xs font-sans flex-1 ml-2">
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

	<div class="px-3 pt-1 pb-3">
		{#if english}
			<div class="text-balance font-lato mt-2">
				{english}{#if word.type == 'name'}
					(name){/if}
			</div>
		{/if}

		{#if transliteration && getShowTransliteration()}
			<div class="text-xs font-lato mt-2">{transliteration}</div>
		{/if}

		{#if related?.length || mnemonic}
			<div class="text-xs font-lato mt-2">
				{#if related?.length}
					<div class="font-sans mb-2">
						{#each related as wordString, i}
							{#if i > 0},{/if}
							{#if onSelectRelated}
								<button class="inline-block underline" on:click={() => onSelectRelated(wordString)}>
									{wordString}
								</button>
							{:else}
								{wordString}
							{/if}
						{/each}
					</div>
				{/if}

				{#if mnemonic}
					<p class="text-balance leading-4">
						{mnemonic}
						{#if onEditMnemonic}
							<SpinnerButton
								className="w-5 h-5 hover:border-blue-3 border-2 border-light-gray p-[2px] inline-block"
								onClick={async () => onEditMnemonic(word, mnemonic)}
							>
								<EditSvg />
							</SpinnerButton>
						{/if}
					</p>
				{:else if onEditMnemonic}
					<div class="flex justify-end mt-1 font-sans">
						<SpinnerButton
							className="border rounded-sm px-1 py-[1px] ml-5 hover:bg-gray"
							onClick={async () => onEditMnemonic(word, mnemonic)}
						>
							Mnemonic
						</SpinnerButton>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>

{#if expression}
	<div class="bg-light-gray rounded-md w-full border border-gray md:max-w-[500px] mb-4">
		<div class="font-medium mb-1 flex bg-blue-3 text-[#fff] px-3 py-2 rounded-t-md items-baseline">
			<span class="text-base flex-1 font-sans">
				{expression.expression}
			</span>

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

		<div class="px-3 pb-3">
			<div class="text-balance font-lato mt-2">
				{expression.english}
			</div>
		</div>
	</div>
{/if}
