<script lang="ts">
  import type { ExtendedHeading } from '../lib/tableOfContent';
  import { onMount } from 'svelte';
  import TableOfContentsHeading from './TableOfContentsHeading.svelte';

  const { heading } = $props<{
    heading: ExtendedHeading;
  }>();
</script>

<li class="mt-0 mb-0">
  <a
    class="relative text-stone-500 no-underline transition duration-300 before:absolute
    before:top-0 before:-left-3 before:inline-block before:h-0 before:w-0 before:-translate-x-1/2
    before:bg-cyan-50 before:blur-xs before:transition-all before:duration-300 [&.active]:translate-x-4
    [&.active]:text-cyan-700 [&.active]:before:h-full [&.active]:before:w-1
    [&.active]:before:bg-cyan-500 [&.active]:before:blur-none"
    href={'#' + heading.slug}
  >
    <span class="truncate py-1">{heading.text}</span>
  </a>
  {#if heading.children.length > 0}
    <ul>
      {#each heading.children as h}
        <TableOfContentsHeading heading={h} />
      {/each}
    </ul>
  {/if}
</li>
