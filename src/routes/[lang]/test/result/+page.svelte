<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;

	function toNumber(value: number) {
		if (value > data.wordCount * 0.9) {
			return `all words`;
		}

		if (value > 100) {
			value = Math.round(value / 100) * 100;
		} else if (value > 10) {
			value = Math.round(value / 10) * 10;
		}

		return value.toLocaleString('en-US') + ' words';
	}
</script>

<h1 class="font-sans text-2xl font-bold lg:mt-12 mb-8">Done!</h1>

<div class="max-w-[600px]">
	<p class="mb-4">
		We estimate your passive vocabulary to be <b>{toNumber(data.wordsKnown.read)}</b> and your
		active vocabulary to be <b>{toNumber(data.wordsKnown.write)}</b>.
	</p>

	<p class="mb-4">
		This number is not very precise, but as you keep studying it will be refined and used to track
		your progress.
	</p>

	{#if data.wordsKnown.read > data.wordCount * 0.9 || data.wordsKnown.write > data.wordCount * 0.9}
		<p class="mb-4">
			There are currently <b>{data.wordCount}</b> words in the system. This number will increase over
			time.
		</p>
	{/if}
</div>

<div class="mt-8">
	<a href="/{data.languageCode}/" class="text-blue-1 rounded-md px-6 py-1 m-2 ml-0 bg-blue-4">
		Start studying
	</a>
</div>
