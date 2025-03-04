import type { MarkdownHeading } from 'astro';

export interface ExtendedHeading extends MarkdownHeading {
  children: ExtendedHeading[];
}

export function buildToc(headings: MarkdownHeading[]): ExtendedHeading[] {
  const toc = headings.reduce((acc, h) => {
    const heading: ExtendedHeading = { ...h, children: [] };
    if (h.depth <= 2) {
      acc.push(heading);
    } else {
      const parent = acc.findLast((x) => x.depth === h.depth - 1);
      parent?.children?.push(heading);
    }
    return acc;
  }, [] as ExtendedHeading[]);
  return toc;
}
