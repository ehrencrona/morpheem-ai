import { extract } from '@extractus/article-extractor';
import { ServerLoad, error } from '@sveltejs/kit';
import * as htmlparser2 from 'htmlparser2';

export const load: ServerLoad = async ({ locals: { language }, url }) => {
	const articleUrl = url.searchParams.get('url');

	if (!articleUrl) {
		return error(400, 'Bad Request');
	}

	const article = await extract(articleUrl);

	if (!article) {
		return error(404, 'Failed to read article');
	}

	let paragraphs: string[] = [];

	let currentParagraph = '';

	function paragraphEnds() {
		if (currentParagraph.trim()) {
			paragraphs.push(currentParagraph);
		}

		currentParagraph = '';
	}

	const parser = new htmlparser2.Parser({
		onopentag(name, attributes) {},
		ontext(text) {
			currentParagraph += ' ' + text;
		},

		onclosetag(tagname) {
			if (tagname === 'p' || tagname == 'div') {
				paragraphEnds();
			}
		}
	});

	parser.write(article!.content || '');

	return {
		title: article.title,
		language,
		paragraphs
	};
};
