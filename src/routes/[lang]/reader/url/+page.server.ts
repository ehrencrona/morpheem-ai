import { ArticleData, extract } from '@extractus/article-extractor';
import { ServerLoad, error } from '@sveltejs/kit';
import * as htmlparser2 from 'htmlparser2';
import { Paragraph } from './Paragraph';
import { logError } from '$lib/logError';

export const load: ServerLoad = async ({ locals: { language, userId }, url }) => {
	const articleUrl = url.searchParams.get('url');

	if (!articleUrl) {
		return error(400, 'Bad Request');
	}

	let title: string | undefined;
	let pages: Paragraph[][] = [];

	const atPage = (parseInt(url.searchParams.get('page') || `1`) || 1) - 1;

	try {
		console.log(`Reading article ${articleUrl} (user ${userId})...`);

		const article = await extract(articleUrl);

		if (article) {
			title = article.title;

			let currentPage: Paragraph[] = [];
			let currentParagraph = '';
			let style: 'h' | 'p' = 'p';

			function pageEnds() {
				if (currentPage.length) {
					pages.push(currentPage);
					currentPage = [];
				}
			}

			function paragraphEnds() {
				if (currentParagraph.trim()) {
					if (currentPage.reduce((acc, { text }) => acc + text.length, 0) > 120) {
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
						pageEnds();
					}
				},
				ontext(text) {
					currentParagraph += ' ' + text;
				},

				onclosetag(tagname) {
					if (tagname === 'p' || tagname == 'div' || (tagname[0] == 'h' && tagname.length == 2)) {
						paragraphEnds();
					}
				}
			});

			paragraphEnds();
			pageEnds();

			parser.write(article!.content || '');
		} else {
			logError(`Unable to read article ${articleUrl} (user ${userId})`);

			title = 'Unable to read article';

			pages = [
				[
					{
						text: 'Sorry, we were unable to read this article. This is probably due to technical details relating to how the site of the article is built.',
						style: 'p'
					},
					{
						text: 'Please try another article or another site.',
						style: 'p'
					}
				]
			];
		}
	} catch (e) {
		logError(e, `While reading article ${articleUrl} (user ${userId})`);

		title = 'Unable to read article';

		pages = [
			[
				{
					text: 'Sorry, we were unable to read this article. This is probably due to technical issues relating to how the site of the article is built.',
					style: 'p'
				},
				{
					text: 'Please try another article or another site.',
					style: 'p'
				},
				{
					text: `Error message: "${(e as any).message}"`,
					style: 'p'
				}
			]
		];
	}

	return {
		articleUrl,
		title,
		language,
		pages,
		atPage
	};
};
