export interface Article {
	title: string;
	url: string;
	date: string;
}

export function getReaderHistory(): Article[] {
	if (typeof localStorage === 'undefined') {
		return [];
	}

	const str = localStorage.getItem('readerHistory');

	return str == null ? [] : JSON.parse(str);
}

export function addToReaderHistory(article: Article) {
	if (typeof localStorage === 'undefined') {
		return;
	}

	let history = getReaderHistory();

	history = [article, ...history];

	history = dedup(history);

	history = history.slice(0, 10);

	localStorage.setItem('readerHistory', JSON.stringify(history));
}

function dedup(history: Article[]): Article[] {
	const urls = new Set<string>();

	return history.filter((article) => {
		if (urls.has(article.url)) {
			return false;
		}

		urls.add(article.url);

		return true;
	});
}
