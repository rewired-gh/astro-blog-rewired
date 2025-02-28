<script lang="ts">
  import { tick } from "svelte";
  import config from "../lib/config";
  import type { CommentSubmission } from "../types/comments";

  let { postId, onCommentSubmitted } = $props<{
    postId: string;
    onCommentSubmitted?: () => void;
  }>();

  let senderName = $state("");
  let senderEmail = $state("");
  let content = $state("");
  let message = $state("");
  let isSubmitting = $state(false);
  let turnstileToken = $state("");

  let canSubmit = $derived(
    !isSubmitting && senderName.trim() && content.trim() && turnstileToken
  );

  function onTurnstileResolved(token: string) {
    console.log(token);
    turnstileToken = token;
  }
  if (typeof window !== "undefined") {
    window.onTurnstileResolved = onTurnstileResolved;
  }

  async function submitComment(event: SubmitEvent) {
    event.preventDefault();

    if (!senderName.trim() || !content.trim()) {
      message = "Name and comment are required.";
      return;
    }

    isSubmitting = true;
    message = "Submitting...";

    try {
      // Mock captcha token for simplicity
      const captchaToken = "mock-token";

      const commentsEndpoint = config.api.endpoints.comments(postId);
      const url = `${config.api.baseUrl}/${commentsEndpoint}`;

      // Using camelCase property names consistently
      const commentData: CommentSubmission = {
        senderName,
        senderEmail: senderEmail || null,
        content,
        captchaToken,
      };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(commentData),
      });

      const data = await response.json();

      if (response.ok) {
        message = "Last comment submitted successfully!";
        senderName = "";
        senderEmail = "";
        content = "";
        if (onCommentSubmitted) {
          await tick();
          onCommentSubmitted();
        }
      } else {
        message = data.error || "Failed to submit comment.";
      }
    } catch (error) {
      console.error(error);
      message = "An error occurred. Please try again.";
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div>
  <form
    onsubmit={submitComment}
    class="flex flex-col gap-y-3
    text-md text-stone-800
    [&_label]:text-stone-500 [&_label]:text-sm [&_label]:font-light [&_input]:px-2 [&_input]:py-1
    **:transition-colors **:duration-300
    focus:[&_input]:outline-none [&_input]:rounded-lg
    [&_input]:border [&_input]:border-stone-300 focus:[&_input]:border-cyan-500"
  >
    <div class="flex flex-col">
      <label class="hidden" for="content">Leave a comment</label>
      <textarea
        class="text-lg focus:outline-none rounded-lg border
        border-stone-300 focus:border-cyan-500
        px-3 py-2 placeholder:font-light"
        placeholder="Leave a comment"
        id="content"
        bind:value={content}
        required
      ></textarea>
    </div>

    <div class="flex flex-wrap gap-3 items-stretch">
      <div class="flex flex-1 flex-col">
        <label for="name">Name (required)</label>
        <input id="name" bind:value={senderName} required />
      </div>

      <div class="flex flex-1 flex-col">
        <label for="email">Email (optional)</label>
        <input id="email" type="email" bind:value={senderEmail} />
      </div>

      <div
        class="cf-turnstile my-1"
        data-sitekey={config.token.turnstileSiteKey}
        data-callback="onTurnstileResolved"
      ></div>
    </div>

    <button class="self-end" type="submit" disabled={!canSubmit}>
      Submit Comment
    </button>

    {#if message}
      <div>{message}</div>
    {/if}
  </form>
</div>
