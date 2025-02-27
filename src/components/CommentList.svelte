<script lang="ts">
  import { onMount } from 'svelte';
  import { apiConfig } from '../lib/config';
  import type { Comment, CommentListResponse, PaginationMeta } from '../types/comments';
  
  export let postId: string;
  
  let comments: Comment[] = [];
  let pagination: PaginationMeta | null = null;
  let loading = true;
  let error: string | null = null;
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
        throw new Error(`Failed to fetch comments: ${response.status} ${response.statusText}`);
      }
      
      const rawData = await response.json();
      console.log('API Response:', rawData);
      
      if (rawData && typeof rawData === 'object') {
        // Extract comments from the API response (now consistently in camelCase)
        if (Array.isArray(rawData.comments)) {
          comments = rawData.comments;
          pagination = rawData.pagination || null;
          currentPage = pagination?.currentPage || 1;
        } else {
          throw new Error('Unexpected API response format: missing comments array');
        }
      } else {
        throw new Error('Unexpected API response format: not an object');
      }
    } catch (err) {
      console.error('Comment fetch error:', err);
      error = `Error loading comments: ${err instanceof Error ? err.message : 'Unknown error'}`;
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
    window.addEventListener('refresh-comments', refreshListener);
    
    return () => {
      window.removeEventListener('refresh-comments', refreshListener);
    };
  });
</script>

<div class="comment-list">
  <h3>Comments</h3>
  
  {#if loading}
    <p>Loading comments...</p>
  {:else if error}
    <p>{error}</p>
  {:else if comments.length === 0}
    <p>No comments yet. Be the first to comment!</p>
  {:else}
    <div class="comments">
      {#each comments as comment}
        <div class="comment">
          <div class="comment-header">
            <strong>{comment.senderName}</strong>
            {#if comment.senderEmail}
              <span class="email">({comment.senderEmail})</span>
            {/if}
            <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
          </div>
          <div class="comment-content">{comment.content}</div>
        </div>
      {/each}
    </div>
    
    <span>Page {pagination?.currentPage || 1} of {pagination?.totalPages || 1}</span>
    {#if pagination && pagination.totalPages > 1}
      <div class="pagination">
        <button disabled={!pagination.prevPage} on:click={handlePrevPage}>
          Previous Page
        </button>
        <button disabled={!pagination.nextPage} on:click={handleNextPage}>
          Next Page
        </button>
      </div>
    {/if}
  {/if}
</div>
