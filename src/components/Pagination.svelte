<script lang="ts">
  const {
    currentPage = 1,
    totalPages = 1,
    prevUrl = '',
    nextUrl = '',
    onPrevPage = null,
    onNextPage = null,
    prevLabel = 'Previous',
    nextLabel = 'Next',
    customClass = '',
  } = $props<{
    currentPage?: number;
    totalPages?: number;
    prevUrl?: string;
    nextUrl?: string;
    onPrevPage?: () => void;
    onNextPage?: () => void;
    prevLabel?: string;
    nextLabel?: string;
    customClass?: string;
  }>();

  const hasPrev = !!prevUrl || !!onPrevPage;
  const hasNext = !!nextUrl || !!onNextPage;
</script>

<div
  class={'flex w-full items-center justify-center gap-x-3 text-sm font-light text-stone-500 [&_a]:w-20 [&_button]:w-20 ' +
    customClass}
>
  {#if prevUrl}
    <a tabindex="0" href={prevUrl} class="c-button" aria-disabled={!hasPrev}>
      {prevLabel}
    </a>
  {:else}
    <button onclick={onPrevPage} class="c-button" disabled={!hasPrev}>
      {prevLabel}
    </button>
  {/if}

  <span class="truncate text-center">
    Page {currentPage} of {totalPages}
  </span>

  {#if nextUrl}
    <a tabindex="0" href={nextUrl} class="c-button" aria-disabled={!hasNext}>
      {nextLabel}
    </a>
  {:else}
    <button onclick={onNextPage} class="c-button" disabled={!hasNext}>
      {nextLabel}
    </button>
  {/if}
</div>
