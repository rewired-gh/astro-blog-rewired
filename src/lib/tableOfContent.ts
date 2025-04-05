import type { MarkdownHeading } from 'astro';

export interface ExtendedHeading extends MarkdownHeading {
  children: ExtendedHeading[];
}

export function buildToc(headings: MarkdownHeading[]): ExtendedHeading[] {
  const maxDepth = 5;
  const minDepth = 2;
  const lastHeading: { [key: number]: ExtendedHeading } = {};
  const toc = headings.reduce((acc, h) => {
    if (h.depth > maxDepth) {
      return acc;
    }
    const heading: ExtendedHeading = { ...h, children: [] };
    if (h.depth <= minDepth) {
      acc.push(heading);
    } else {
      const parent = lastHeading[h.depth - 1];
      parent?.children?.push(heading);
    }
    lastHeading[h.depth] = heading;
    return acc;
  }, [] as ExtendedHeading[]);
  return toc;
}
