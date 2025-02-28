<script lang="ts">
  const {
    currentPage = 1,
    totalPages = 1,
    prevUrl = "",
    nextUrl = "",
    onPrevPage = null,
    onNextPage = null,
    prevLabel = "Previous",
    nextLabel = "Next",
    customClass = "",
  } = $props<{
    currentPage?: number;
    totalPages?: number;
    prevUrl?: string;
    nextUrl?: string;
    onPrevPage?: (() => void) | null;
    onNextPage?: (() => void) | null;
    prevLabel?: string;
    nextLabel?: string;
    customClass?: string;
  }>();

  const hasPrev = !!prevUrl || !!onPrevPage;
  const hasNext = !!nextUrl || !!onNextPage;
</script>

<div
  class={"text-sm font-light text-stone-500 w-full flex items-center justify-center gap-x-4 [&_a]:w-20 [&_button]:w-20 " +
    customClass}
>
  {#if prevUrl}
    <a href={prevUrl} class="c-button" class:invisible={!hasPrev}>
      {prevLabel}
    </a>
  {:else}
    <button
      onclick={onPrevPage}
      class="c-button"
      class:invisible={!hasPrev}
      disabled={!hasPrev}
    >
      {prevLabel}
    </button>
  {/if}

  <span class="text-center">
    Page {currentPage} of {totalPages}
  </span>

  {#if nextUrl}
    <a href={nextUrl} class="c-button" class:invisible={!hasNext}>
      {nextLabel}
    </a>
  {:else}
    <button
      onclick={onNextPage}
      class="c-button"
      class:invisible={!hasNext}
      disabled={!hasNext}
    >
      {nextLabel}
    </button>
  {/if}
</div>
