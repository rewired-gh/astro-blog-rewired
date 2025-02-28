<script lang="ts">
  import { onMount } from "svelte";
  import { apiConfig } from "../lib/config";
  import type {
    Comment,
    CommentListResponse,
    PaginationMeta,
  } from "../types/comments";
  import moment from "moment";

  const { postId } = $props<{ postId: string }>();

  let comments: Comment[] = $state([]);
  let pagination: PaginationMeta | null = $state(null);
  let loading = $state(true);
  let error: string | null = $state(null);
  let currentPage = 1;

  // Expose this function to be called from parent component
  export function refreshComments() {
    fetchComments(currentPage);
  }

  async function fetchComments(page = 1) {
    loading = true;
    error = null;

    try {
      const commentsEndpoint = apiConfig.endpoints.comments(postId);
      const url = `${apiConfig.baseUrl}/${commentsEndpoint}?page=${page}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch comments: ${response.status} ${response.statusText}`
        );
      }

      const rawData = await response.json();

      if (rawData && typeof rawData === "object") {
        // Extract comments from the API response (now consistently in camelCase)
        if (Array.isArray(rawData.comments)) {
          comments = rawData.comments;
          pagination = rawData.pagination || null;
          currentPage = pagination?.currentPage || 1;
        } else {
          throw new Error(
            "Unexpected API response format: missing comments array"
          );
        }
      } else {
        throw new Error("Unexpected API response format: not an object");
      }
    } catch (err) {
      console.error("Comment fetch error:", err);
      error = `Error loading comments: ${err instanceof Error ? err.message : "Unknown error"}`;
    } finally {
      loading = false;
    }
  }

  function handlePrevPage() {
    if (pagination?.prevPage) {
      currentPage--;
      fetchComments(currentPage);
    }
  }

  function handleNextPage() {
    if (pagination?.nextPage) {
      currentPage++;
      fetchComments(currentPage);
    }
  }

  onMount(() => {
    fetchComments();

    // Listen for refresh event from the comment form
    const refreshListener = () => fetchComments(currentPage);
    window.addEventListener("refresh-comments", refreshListener);

    return () => {
      window.removeEventListener("refresh-comments", refreshListener);
    };
  });
</script>

<div>
  <h2 class="c-section-title mb-4">Comments</h2>

  {#if loading}
    <p class="text-stone-500 font-light motion-safe:animate-pulse">
      Loading comments...
    </p>
  {:else if error}
    <p class="text-stone-500 font-light">{error}</p>
  {:else if comments.length === 0}
    <p class="text-stone-500 font-light">
      No comments yet. Be the first to comment!
    </p>
  {:else}
    <div class="flex flex-col gap-y-4 font-light">
      {#each comments as comment}
        <div>
          <div class="text-sm mb-0.5">
            <strong class="font-medium">{comment.senderName}</strong>
            {#if comment.senderEmail}
              <span>({comment.senderEmail})</span>
            {/if}
            <span class="text-stone-500 ml-2"
              >{moment(new Date(comment.createdAt)).fromNow()}</span
            >
          </div>
          <div class="font-normal">{comment.content}</div>
        </div>
      {/each}
    </div>

    <span
      >Page {pagination?.currentPage || 1} of {pagination?.totalPages ||
        1}</span
    >
    {#if pagination && pagination.totalPages > 1}
      <div>
        <button disabled={!pagination.prevPage} onclick={handlePrevPage}>
          Previous Page
        </button>
        <button disabled={!pagination.nextPage} onclick={handleNextPage}>
          Next Page
        </button>
      </div>
    {/if}
  {/if}
</div>
