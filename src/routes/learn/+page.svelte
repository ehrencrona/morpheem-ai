<script lang="ts">
	import { onMount } from 'svelte';
	import { CodedError } from '../../CodedError';
	import { KNOWLEDGE_TYPE_READ } from '../../db/knowledgeTypes';
	import type * as DB from '../../db/types';
	import { getNextSentence, getNextWords } from '../../logic/isomorphic/getNext';
	import { expectedKnowledge, now } from '../../logic/isomorphic/knowledge';
	import type { AggKnowledgeForUser } from '../../logic/types';
	import { userId } from '../../logic/user';
	import { fetchAggregateKnowledge, sendKnowledge } from '../api/knowledge/client';
	import { markSentenceSeen } from '../api/sentences/[sentence]/client';
	import { fetchTranslation } from '../api/sentences/[sentence]/english/client';
	import { fetchHint } from '../api/sentences/[sentence]/hint/client';
	import {
		addSentencesForWord,
		fetchSentencesWithWord
	} from '../api/sentences/withword/[word]/client';
	import { fetchMnemonic } from '../api/word/[id]/mnemonic/client';
	import type { UnknownWordResponse } from '../api/word/unknown/+server';
	import { lookupUnknownWord } from '../api/word/unknown/client';
	import Sentence from './Sentence.svelte';
	import WriteSentence from './WriteSentence.svelte';

	let knowledge: AggKnowledgeForUser[] = [];

	let revealed: (UnknownWordResponse & { mnemonic?: string })[];
	let current:
		| {
				wordId: number;
				sentence: DB.Sentence;
				words: DB.Word[];
				type: 'write' | 'read';
		  }
		| undefined;

	async function init() {
		knowledge = await fetchAggregateKnowledge();

		console.log(`Loaded ${knowledge.length} knowledge entries`);

		showNextSentence();
	}

	let nextPromise: ReturnType<typeof calculateNextSentence>;

	async function calculateNextSentence(wordIds: number[] = [], excludeWordId?: number) {
		if (!wordIds.length) {
			wordIds = getNextWords(knowledge).filter((id) => id !== excludeWordId);
		}

		const wordId = wordIds[0];

		try {
			let sentences = await fetchSentencesWithWord(wordId);
			let nextSentence = getNextSentence(sentences, knowledge, wordId);

			if (!nextSentence || nextSentence.score < 0.93) {
				try {
					sentences = sentences.concat(await addSentencesForWord(wordId));
				} catch (e) {
					console.error(`While adding sentences for ${wordId}: ${e}`);
				}

				console.log(
					`Added ${sentences.length} sentences for word ${wordId}: ${sentences.map((s) => s.sentence) + '\n'}`
				);

				nextSentence = getNextSentence(sentences, knowledge, wordId);

				if (!nextSentence) {
					console.error(`No sentences found for word ${wordId}`);

					return calculateNextSentence(wordIds.slice(1), wordId);
				}
			}

			const { sentence, score } = nextSentence;

			return {
				sentence,
				wordId,
				getNextPromise: () => calculateNextSentence(wordIds.slice(1), wordId)
			};
		} catch (e: any) {
			console.log(e);

			if (e instanceof CodedError && e.code == 'wrongLemma') {
				knowledge = knowledge.filter((k) => wordId != k.wordId);
			} else {
				error = e.message;
			}

			return calculateNextSentence(wordIds.slice(1), wordId);
		}
	}

	async function showNextSentence() {
		const {
			sentence,
			wordId,
			getNextPromise: getNext
		} = await (nextPromise || calculateNextSentence());

		nextPromise = getNext();

		const k = knowledge.find((k) => k.wordId === wordId)!;
		const wordKnowledge = k ? expectedKnowledge(k, { now: now(), lastTime: k.time }) : 0;

		const type = wordKnowledge > 0.4 ? 'write' : 'read';

		if (type == 'read') {
			markSentenceSeen(sentence.id).catch(console.error);
		}

		current = {
			wordId: wordId,
			sentence,
			words: sentence.words,
			type
		};
		revealed = [];
		error = undefined;

		console.log({
			...current,
			wordKnowledge
		});
	}

	onMount(init);

	async function getMnemonic(word: DB.Word) {
		if (!current) {
			throw new Error('Invalid state');
		}

		const mnemonic = await fetchMnemonic(word.id);

		revealed = revealed.map((r) => {
			if (r.id === word.id) {
				r.mnemonic = mnemonic;
			}

			return r;
		});
	}

	const getHint = () => fetchHint(current!.sentence.id);
	const getTranslation = () => fetchTranslation(current!.sentence.id);

	async function onUnknown(word: string) {
		if (!current) {
			throw new Error('Invalid state');
		}

		const unknownWord = await lookupUnknownWord(word, current.sentence.id, current.wordId);

		revealed = [...revealed, unknownWord];
	}

	let error: string | undefined = undefined;

	async function store() {
		if (!current) {
			throw new Error('Invalid state');
		}

		try {
			const sentenceId = current.sentence.id;
			const studiedWordId = current.wordId;

			await sendKnowledge(
				current.words
					.filter((word) => !revealed.find(({ id }) => id === word.id))
					.map((word) => ({
						wordId: word.id,
						sentenceId: sentenceId,
						userId: userId,
						isKnown: true,
						studiedWordId,
						type: KNOWLEDGE_TYPE_READ
					}))
			);

			knowledge = await fetchAggregateKnowledge();

			await showNextSentence();
		} catch (e: any) {
			console.error(e);

			error = e.message;
		}
	}

	function calculateWordsKnown(knowledge: AggKnowledgeForUser[]) {
		const n = now();

		const wordsKnown = knowledge.reduce(
			(acc, wk) => acc + expectedKnowledge(wk, { now: n, lastTime: wk.time }),
			0
		);

		return Math.round(wordsKnown);
	}

	async function continueAfterWrite() {
		knowledge = await fetchAggregateKnowledge();

		showNextSentence();
	}
</script>

<main class="font-sans bold w-full">
	{#if error}
		<h3>{error}</h3>
	{/if}

	<div class="bg-blue-3 text-center text-blue-1 p-2 rounded-md absolute bottom-2 right-2">
		<b class="font-sans text-3xl font-bold">{calculateWordsKnown(knowledge)}</b>
		<div class="text-xs font-lato">words known</div>
	</div>

	{#if current}
		<div class="text-right font-lato text-xs flex gap-1 mb-4 flex justify-end">
			<a href={`/sentences/${current?.sentence.id}/delete`} class="underline text-red">
				Delete sentence
			</a>
		</div>

		{#if current.type == 'read'}
			<Sentence
				word={current.words.find(({ id }) => id == current?.wordId)}
				sentence={current.sentence}
				{revealed}
				{getHint}
				{onUnknown}
				{getMnemonic}
				{getTranslation}
				{knowledge}
				onNext={store}
			/>
		{:else}
			<WriteSentence
				word={{
					word: current.words.find(({ id }) => id == current.wordId).word,
					id: current.wordId
				}}
				onContinue={continueAfterWrite}
			/>
		{/if}
	{:else}
		<div class="text-center mt-12">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="1em"
				height="1em"
				viewBox="0 0 24 24"
				class="inline-block"
			>
				<path
					fill="currentColor"
					d="M12,4a8,8,0,0,1,7.89,6.7A1.53,1.53,0,0,0,21.38,12h0a1.5,1.5,0,0,0,1.48-1.75,11,11,0,0,0-21.72,0A1.5,1.5,0,0,0,2.62,12h0a1.53,1.53,0,0,0,1.49-1.3A8,8,0,0,1,12,4Z"
				>
					<animateTransform
						attributeName="transform"
						dur="0.75s"
						repeatCount="indefinite"
						type="rotate"
						values="0 12 12;360 12 12"
					/>
				</path>
			</svg>
		</div>
	{/if}
</main>
