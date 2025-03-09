import { getCollection } from 'astro:content';
import MarkdownIt from 'markdown-it';
import { convert } from 'html-to-text';

export interface DigestEntry {
  path: string;
  title: string;
  date: Date;
  tags: string[];
  language?: string;
  excerpt: string;
}

interface TagEntry {
  slug: string;
  digests: DigestEntry[];
}

const parser = new MarkdownIt();
const excerptCache = new Map<string, string>();

export function createExcerpt(slug: string, body: string, maxLen = 150) {
  const cached = excerptCache.get(slug);
  if (cached) {
    return cached;
  }
  const html = parser.render(body);
  const options = {
    wordwrap: null,
    selectors: [
      { selector: 'a', options: { ignoreHref: true } },
      { selector: 'img', format: 'skip' },
      { selector: 'figure', format: 'skip' },
      { selector: 'iframe', format: 'skip' },
      { selector: 'h1', format: 'skip' },
      { selector: 'h2', format: 'skip' },
      { selector: 'h3', format: 'skip' },
      { selector: 'h4', format: 'skip' },
      { selector: 'h5', format: 'skip' },
      { selector: 'h6', format: 'skip' },
    ],
  };
  const text = convert(html, options);
  const distilled = convert(text, options);
  const excerpt = distilled.substring(0, maxLen) + '……';
  excerptCache.set(slug, excerpt);
  return excerpt;
}

export async function getAllDigestEntries() {
  const blogEntries = (await getCollection('post')).sort(
    (a, b) => b.data.date.getTime() - a.data.date.getTime()
  );
  const digests = blogEntries.map(
    (entry) =>
      ({
        path: `/post/${entry.slug}`,
        title: entry.data.title,
        date: entry.data.date,
        tags: entry.data.tags,
        language: entry.data.language,
        excerpt: createExcerpt(entry.slug, entry.body),
      }) as DigestEntry
  );
  return digests;
}

export async function getTagStaticPaths() {
  const digestEntries = await getAllDigestEntries();
  const tagEntryMap = new Map<string, TagEntry>();
  const tags = [...new Set(digestEntries.map((entry) => entry.tags).flat())].map((tag) => {
    const tagEntry = { slug: tag, digests: [] } as TagEntry;
    tagEntryMap.set(tag, tagEntry);
    return tagEntry;
  });
  digestEntries.forEach((entry) => {
    entry.tags.forEach((tag) => {
      tagEntryMap.get(tag)?.digests.push(entry);
    });
  });
  return tags.map((tag) => ({
    params: { slug: tag.slug },
    props: { digests: tag.digests, tag: tag.slug },
  }));
}
