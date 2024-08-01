import type { Word } from '../../../../../../db/types';
import { apiCall } from '../../../api-call';

export async function fetchRelatedWords(wordIdOrWord: number | string): Promise<Word[]> {
	return apiCall(`/api/word/${wordIdOrWord}/related`, {});
}
