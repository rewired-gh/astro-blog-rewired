import { getCollection } from "astro:content";
import MarkdownIt from "markdown-it";
import { convert } from "html-to-text";

interface DigestEntry {
  title: string,
  date: Date,
  tags: string[],
  excerpt: string,
}

interface TagEntry {
  slug: string;
  digests: DigestEntry[]
}

const parser = new MarkdownIt();

export const createExcerpt = (body: string, maxLen = 300) => {
  const html = parser.render(body);
  const options = {
    wordwrap: null,
    selectors: [
      { selector: "a", options: { ignoreHref: true } },
      { selector: "img", format: "skip" },
      { selector: "figure", format: "skip" },
    ],
  };
  const text = convert(html, options);
  const distilled = convert(text, options);
  return distilled.substring(0, maxLen);
};

export async function getTagStaticPaths() {
  const blogEntries = await getCollection("post");
  const digestEntries = blogEntries.map((entry) => {
    return {
      title: entry.data.title,
      date: entry.data.date,
      tags: entry.data.tags,
      excerpt: createExcerpt(entry.body),
    } as DigestEntry
  })
  const tagEntryMap = new Map<string, TagEntry>()
  const tags = [
    ...new Set(digestEntries.map((entry) => entry.tags).flat()),
  ].map((tag) => {
    const tagEntry = { slug: tag, digests: [] } as TagEntry
    tagEntryMap.set(tag, tagEntry)
    return tagEntry;
  });
  digestEntries.forEach((entry) => {
    entry.tags.forEach((tag)=> {
      tagEntryMap.get(tag)?.digests.push(entry)
    })
  })
  return tags.map((tag) => ({
    params: { slug: tag.slug },
    props: { digests: tag.digests, tag: tag.slug },
  }));
}