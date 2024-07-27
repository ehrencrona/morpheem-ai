import { getUnits } from '../../../../db/units';
import { apiCall, getLanguageOnClient } from '../api-call';

export type Units = Awaited<ReturnType<typeof getUnits>>;

let cache = new Map<string, Units>();

export async function fetchUnits(): Promise<Units> {
	const language = getLanguageOnClient().code;

	let units: Units = cache.get(language) || (await apiCall('/api/units', {}));

	cache.set(language, units!);

	return units!;
}
