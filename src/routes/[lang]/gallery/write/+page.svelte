<script>
	import { POLISH } from '../../../../constants';
	import WriteSentence from '../../learn/WriteSentence.svelte';
</script>

<WriteSentence
	word={{
		id: 123,
		word: 'rower',
		level: 1
	}}
	sentence={{
		id: 1,
		sentence: 'This is a car.',
		english: null,
		transliteration: null
	}}
	language={POLISH}
	onNext={async () => {}}
	fetchTranslation={async () => ({
		english: 'Bla bla',
		transliteration: undefined
	})}
	sendKnowledge={async (knowledge) => {
		console.log(knowledge);
	}}
	source="studied"
	exerciseId={null}
	isAdmin={false}
	correctSentence="Bla"
	translation={{
		english: 'Bla bla',
		transliteration: undefined
	}}
/>
