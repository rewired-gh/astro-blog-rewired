<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { type ExtendedHeading } from '../lib/tableOfContent';
  import TableOfContentsHeading from './TableOfContentsHeading.svelte';

  const { toc } = $props<{
    toc: ExtendedHeading[];
  }>();

  const headingMap = toc.reduce((acc: Record<string, string>, heading: ExtendedHeading) => {
    acc[heading.slug] = heading.text;
    return acc;
  }, {});

  let activeHeadingIds = $state([] as string[]);
  let lastActiveHeading = $derived(
    activeHeadingIds[activeHeadingIds.length - 1]
      ? headingMap[activeHeadingIds[activeHeadingIds.length - 1]] || ''
      : ''
  );

  let detailsElem: HTMLDetailsElement | null = null;
  let observer: IntersectionObserver | null = null;

  function addIntersectionObserver() {
    observer = new IntersectionObserver((sections) => {
      sections.forEach((section) => {
        const heading = section.target.querySelector('h2, h3, h4, h5');
        if (!heading) {
          return;
        }
        const id = heading.getAttribute('id');
        if (!id) {
          return;
        }
        const link = document.querySelector(`#toc li a[href="#${id}"]`);
        if (!link) {
          return;
        }
        if (section.intersectionRatio > 0) {
          activeHeadingIds.push(id);
          link.classList.add('active');
        } else {
          activeHeadingIds = activeHeadingIds.filter((activeId) => activeId !== id);
          link.classList.remove('active');
        }
      });
    });
    document.querySelectorAll('article section').forEach((section) => {
      observer?.observe(section);
    });
  }

  function removeIntersectionObserver() {
    document.querySelectorAll('article section').forEach((section) => {
      observer?.unobserve(section);
    });
  }

  function handleClickOutside(event: MouseEvent) {
    if (detailsElem && !detailsElem.contains(event.target as Node) && detailsElem.open) {
      detailsElem.open = false;
    }
  }

  onMount(() => {
    addIntersectionObserver();
    document.addEventListener('click', handleClickOutside);
  });

  onDestroy(() => {
    removeIntersectionObserver();
    document.removeEventListener('click', handleClickOutside);
  });
</script>

<nav class="sticky top-0" class:hidden={toc.length === 0}>
  <details bind:this={detailsElem} class="z-10 flex flex-col">
    <summary
      class="shadow-glow flex items-center gap-x-3 rounded-b-lg bg-white py-2 hover:cursor-pointer"
    >
      <span class="c-button shadow-glow bg-white px-3">On this page</span>
      <span class="truncate text-sm text-stone-500">{lastActiveHeading}</span>
    </summary>

    <div class="pt-2">
      <ul
        id="toc"
        class="shadow-glow mt-0 mb-0 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm **:flex **:flex-col **:items-start sm:w-96"
      >
        {#each toc as h}
          <TableOfContentsHeading heading={h} />
        {/each}
      </ul>
    </div>
  </details>
</nav>
