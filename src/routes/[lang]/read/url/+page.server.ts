import { extract } from '@extractus/article-extractor';
import { ServerLoad, error } from '@sveltejs/kit';
import * as htmlparser2 from 'htmlparser2';
import { Paragraph } from './Paragraph';

export const load: ServerLoad = async ({ locals: { language }, url }) => {
	const articleUrl = url.searchParams.get('url');

	if (!articleUrl) {
		return error(400, 'Bad Request');
	}

	const atPage = (parseInt(url.searchParams.get('page') || `1`) || 1) - 1;

	const article = await extract(articleUrl);

	if (!article) {
		return error(404, 'Failed to read article');
	}

	let pages: Paragraph[][] = [];

	let currentPage: Paragraph[] = [];
	let currentParagraph = '';
	let style: 'h' | 'p' = 'p';

	function pageEnds() {
		if (currentPage.length) {
			pages.push(currentPage);
			currentPage = [];
		}
	}

	function paragraphEnds(isEnd = false) {
		if (currentParagraph.trim()) {
			if (
				style == 'p' &&
				(isEnd || currentPage.reduce((acc, { text }) => acc + text.length, 0) > 120 || style == 'p')
			) {
				pageEnds();
			}

			currentPage.push({
				text: currentParagraph.trim(),
				style
			});
		}

		currentParagraph = '';
		style = 'p';
	}

	const parser = new htmlparser2.Parser({
		onopentag(name, attributes) {
			if (name[0] == 'h' && name.length == 2) {
				style = 'h';
			}
		},
		ontext(text) {
			currentParagraph += ' ' + text;
		},

		onclosetag(tagname) {
			if (tagname === 'p' || tagname == 'div') {
				paragraphEnds();
			}
		}
	});

	paragraphEnds(true);
	pageEnds();

	parser.write(article!.content || '');

	return {
		articleUrl,
		title: article.title,
		language,
		pages,
		atPage
	};
};
