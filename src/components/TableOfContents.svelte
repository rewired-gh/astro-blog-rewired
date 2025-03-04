<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { type ExtendedHeading } from '../lib/tableOfContent';
  import TableOfContentsHeading from './TableOfContentsHeading.svelte';

  const { toc } = $props<{
    toc: ExtendedHeading[];
  }>();

  interface HeadingState {
    slug: string;
    text: string;
    active: boolean;
  }
  const headingStates = $state([] as HeadingState[]);
  const addStateFromHeadings = (headings: ExtendedHeading[]) => {
    headings.forEach((heading) => {
      headingStates.push({
        slug: heading.slug,
        text: heading.text,
        active: false,
      });
      if (heading.children) {
        addStateFromHeadings(heading.children);
      }
    });
  };
  addStateFromHeadings(toc);
  console.log(headingStates);

  let firstActiveHeading = $derived(headingStates.find((s) => s.active)?.text || '');

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
        const state = headingStates.find((h) => h.slug === id);
        if (!state) {
          return;
        }
        if (section.intersectionRatio > 0) {
          state.active = true;
          link.classList.add('active');
        } else {
          state.active = false;
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

  function handleClickPage(event: MouseEvent) {
    if (detailsElem && detailsElem.open) {
      detailsElem.open = false;
    }
  }

  onMount(() => {
    addIntersectionObserver();
    document.addEventListener('click', handleClickPage);
  });

  onDestroy(() => {
    removeIntersectionObserver();
    document.removeEventListener('click', handleClickPage);
  });
</script>

<nav class="sticky top-0" class:hidden={toc.length === 0}>
  <details bind:this={detailsElem} class="z-10 flex flex-col">
    <summary
      class="shadow-glow flex items-center gap-x-3 rounded-b-lg bg-white py-2 hover:cursor-pointer"
    >
      <span class="c-button shadow-glow bg-white px-3">On this page</span>
      <span class="truncate text-sm text-stone-500">{firstActiveHeading}</span>
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
