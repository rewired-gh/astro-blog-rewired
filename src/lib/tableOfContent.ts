import type { MarkdownHeading } from 'astro';

export interface ExtendedHeading extends MarkdownHeading {
  children: ExtendedHeading[];
}

export function buildToc(headings: MarkdownHeading[]): ExtendedHeading[] {
  const lastHeading: { [key: number]: ExtendedHeading } = {};
  const toc = headings.reduce((acc, h) => {
    if (h.depth >= 6) {
      return acc;
    }
    const heading: ExtendedHeading = { ...h, children: [] };
    if (h.depth <= 2) {
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
