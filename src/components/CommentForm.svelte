<script lang="ts">
  import { tick } from 'svelte';
  import { apiConfig } from '../lib/config';
  import type { CommentSubmission } from '../types/comments';
  
  let { postId, onCommentSubmitted } = $props<{
    postId: string;
    onCommentSubmitted?: () => void;
  }>();
  
  let senderName = $state('');
  let senderEmail = $state('');
  let content = $state('');
  let message = $state('');
  let isSubmitting = $state(false);

  let canSubmit = $derived(senderName.trim() && content.trim());

  async function submitComment(event: SubmitEvent) {
    event.preventDefault();
    
    if (!senderName.trim() || !content.trim()) {
      message = 'Name and comment are required.';
      return;
    }

    isSubmitting = true;
    message = 'Submitting...';

    try {
      // Mock captcha token for simplicity
      const captchaToken = 'mock-token';
      
      const commentsEndpoint = apiConfig.endpoints.comments(postId);
      const url = `${apiConfig.baseUrl}/${commentsEndpoint}`;
      
      // Using camelCase property names consistently
      const commentData: CommentSubmission = {
        senderName,
        senderEmail: senderEmail || null,
        content,
        captchaToken,
      };
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(commentData),
      });

      const data = await response.json();
      
      if (response.ok) {
        message = 'Last comment submitted successfully!';
        senderName = '';
        senderEmail = '';
        content = '';
        if (onCommentSubmitted) {
          await tick();
          onCommentSubmitted();
        }
      } else {
        message = data.error || 'Failed to submit comment.';
      }
    } catch (error) {
      console.error(error);
      message = 'An error occurred. Please try again.';
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class="comment-form">
  <h3>Leave a comment</h3>
  
  <form onsubmit={submitComment}>
    <div>
      <label for="name">Name (required)</label>
      <input id="name" bind:value={senderName} required />
    </div>
    
    <div>
      <label for="email">Email (optional)</label>
      <input id="email" type="email" bind:value={senderEmail} />
    </div>
    
    <div>
      <label for="content">Comment (required)</label>
      <textarea id="content" bind:value={content} required></textarea>
    </div>
    
    <button type="submit" disabled={isSubmitting}>
      Submit Comment
    </button>
    
    {#if message}
      <div>{message}</div>
    {/if}
  </form>
</div>
