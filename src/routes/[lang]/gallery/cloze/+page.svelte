<script>
	import { POLISH } from '../../../../constants';
	import ClozeDumb from '../../learn/ClozeDumb.svelte';
</script>

<div class="flex flex-wrap gap-12">
	<ClozeDumb
		sentence={{
			id: 1,
			sentence: 'This is an elephant.',
			english: null,
			transliteration: null
		}}
		word={{
			id: 123,
			word: 'elephant',
			conjugatedWord: 'elephant',
			word_index: 123,
			level: 1,
			type: undefined
		}}
		unknownWord={{
			id: 123,
			word: 'elephant',
			english: 'elephaaaaaaaaaaaaaaaaaaaant',
			level: 1,
			type: undefined
		}}
		sentenceTranslation={undefined}
		exercise="cloze"
		language={POLISH}
		showChars={0}
		evaluation={undefined}
		isPickingInflection={false}
		isLoadingSuggestions={false}
		isFetchingEvaluation={false}
		unknown={[]}
		onHint={() => Promise.resolve()}
		onNext={() => Promise.resolve()}
		onUnknown={(wordString) => Promise.resolve()}
		onRemoveUnknown={(word) => Promise.resolve()}
		onReveal={() => Promise.resolve()}
		onTranslate={() => Promise.resolve()}
		onType={(prefix) => {}}
		onAnswer={(wordString) => Promise.resolve()}
		onPickedWord={(wordString) => Promise.resolve()}
	/>

	<ClozeDumb
		sentence={{
			id: 1,
			sentence: 'This is an elephant.',
			english: null,
			transliteration: null
		}}
		word={{
			id: 123,
			word: 'elephant',
			conjugatedWord: 'elephant',
			word_index: 123,
			level: 1,
			type: undefined
		}}
		unknownWord={{
			id: 123,
			word: 'elephant',
			english: 'elephaaaaaaaaaaaaaaaaaaaant',
			level: 1,
			type: undefined
		}}
		sentenceTranslation={undefined}
		exercise="cloze"
		language={POLISH}
		showChars={1}
		evaluation={undefined}
		isPickingInflection={false}
		isLoadingSuggestions={false}
		isFetchingEvaluation={false}
		unknown={[]}
		onHint={() => Promise.resolve()}
		onNext={() => Promise.resolve()}
		onUnknown={(wordString) => Promise.resolve()}
		onRemoveUnknown={(word) => Promise.resolve()}
		onReveal={() => Promise.resolve()}
		onTranslate={() => Promise.resolve()}
		onType={(prefix) => {}}
		onAnswer={(wordString) => Promise.resolve()}
		onPickedWord={(wordString) => Promise.resolve()}
	/>

	<ClozeDumb
		sentence={{
			id: 1,
			sentence: 'This is a pterodactyl. There is no mouse in the room. This is an elephant. This is a mouse. This is a bear.',
			english: null,
			transliteration: null
		}}
		word={{
			id: 123,
			word: 'elephant',
			conjugatedWord: 'elephant',
			word_index: 123,
			level: 1,
			type: undefined
		}}
		unknownWord={{
			id: 123,
			word: 'elephant',
			english: 'elephaaaaaaaaaaaaaaaaaaaant',
			level: 1,
			type: undefined
		}}
		sentenceTranslation={undefined}
		exercise="cloze"
		language={POLISH}
		showChars={0}
		evaluation={undefined}
		isPickingInflection={false}
		isLoadingSuggestions={false}
		isFetchingEvaluation={false}
		unknown={[]}
		onHint={() => Promise.resolve()}
		onNext={() => Promise.resolve()}
		onUnknown={(wordString) => Promise.resolve()}
		onRemoveUnknown={(word) => Promise.resolve()}
		onReveal={() => Promise.resolve()}
		onTranslate={() => Promise.resolve()}
		onType={(prefix) => {}}
		onAnswer={(wordString) => Promise.resolve()}
		onPickedWord={(wordString) => Promise.resolve()}
	/>
</div>
