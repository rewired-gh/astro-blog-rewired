import type { ExtendedHeading } from '../lib/tableOfContent';

const tocUlElem: HTMLUListElement | null = document.querySelector('ul#toc');
const detailsElem: HTMLDetailsElement | null = document.querySelector('details#toc-toggle');
const currentSpanElem: HTMLSpanElement | null = document.querySelector('span#toc-current');
const tocString: string = tocUlElem?.dataset?.toc || '[]';
const toc: ExtendedHeading[] = (JSON.parse(tocString) as { list: ExtendedHeading[] }).list;
import { TotalOrderedSet } from '../lib/orderedSet';

const headingDequeue: TotalOrderedSet<{
  slug: string;
  text: string;
}> = new TotalOrderedSet();

const headingOrderMap: Record<string, number> = {};
let currentOrder = 0;
const addOrderFromHeadings = (headings: ExtendedHeading[]) => {
  headings.forEach((heading) => {
    headingOrderMap[heading.slug] = currentOrder;
    currentOrder++;
    if (heading.children) {
      addOrderFromHeadings(heading.children);
    }
  });
};
addOrderFromHeadings(toc);

function addIntersectionObserver() {
  const observer = new IntersectionObserver((sections) => {
    sections.forEach((section) => {
      const heading = section.target.querySelector('h2, h3, h4, h5');
      if (!heading) {
        return;
      }
      const id = heading.getAttribute('id');
      if (!id) {
        return;
      }
      const link = document.querySelector(`ul#toc li a[href="#${id}"]`);
      if (!link) {
        return;
      }
      if (section.intersectionRatio > 0) {
        const i = headingDequeue.insert(
          { slug: id, text: heading.textContent || '' },
          headingOrderMap[id]
        );
        if (i === 0 && currentSpanElem) {
          currentSpanElem.textContent = heading.textContent;
        }
        link.classList.add('active');
      } else {
        const i = headingDequeue.remove(
          { slug: id, text: heading.textContent || '' },
          headingOrderMap[id]
        );
        if (i === 0 && currentSpanElem) {
          currentSpanElem.textContent = headingDequeue.get(0)?.text || '';
        }
        link.classList.remove('active');
      }
    });
  });
  document.querySelectorAll('article section').forEach((section) => {
    observer.observe(section);
  });
}
addIntersectionObserver();

function handleClickPage(event: MouseEvent) {
  if (
    detailsElem?.open &&
    (!detailsElem?.contains(event.target as Node) || tocUlElem?.contains(event.target as Node))
  ) {
    detailsElem.open = false;
  }
}
document.addEventListener('click', handleClickPage);
