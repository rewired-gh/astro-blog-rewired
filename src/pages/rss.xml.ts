import rss from '@astrojs/rss';
import { getAllDigestEntries } from '../lib/digest';
import config from '../lib/config';

export const GET = async (context: { site: string | URL }) => {
	return rss({
		title: config.site.name,
		description: config.site.description,
		site: context.site,
		items: (await getAllDigestEntries()).map((entry) => ({
			title: entry.title,
			pubDate: entry.date,
			description: entry.excerpt,
			link: entry.path,
		})),
	});
};
