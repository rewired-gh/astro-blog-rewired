import rss from '@astrojs/rss';
import { mainDescription, mainTitle } from '../components/pageTitle';
import { getAllDigestEntries } from '../components/digest';

export const GET = async (context: {site: string | URL}) => {
  return rss({
    title: mainTitle,
    description: mainDescription,
    site: context.site,
    items: (await getAllDigestEntries()).map((entry) => ({
      title: entry.title,
      pubDate: entry.date,
      description: entry.excerpt,
      link: entry.path,
    })),
  });
}