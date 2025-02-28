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
  let isErrorMessage = $state(false);
  let isSubmitting = $state(false);

  let canSubmit = $derived(
    !isSubmitting && senderName.trim() && content.trim()
  );

  async function submitComment(event: SubmitEvent) {
    event.preventDefault();

    if (!senderName.trim() || !content.trim()) {
      message = "Name and comment are required.";
      isErrorMessage = true;
      return;
    }

    isSubmitting = true;
    message = "Submitting...";
    isErrorMessage = false;

    try {
      const commentsEndpoint = config.api.endpoints.comments(postId);
      const url = `${config.api.baseUrl}/${commentsEndpoint}`;

      // Create FormData from form element
      const form = event.target as HTMLFormElement;
      const formData = new FormData(form);

      const response = await fetch(url, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        message = "Last comment submitted successfully!";
        isErrorMessage = false;
        senderName = "";
        senderEmail = "";
        content = "";
        if (onCommentSubmitted) {
          await tick();
          onCommentSubmitted();
        }
      } else {
        message = data.error || "Failed to submit comment.";
        isErrorMessage = true;
      }
    } catch (error) {
      console.error(error);
      message = "An error occurred. Please try again.";
      isErrorMessage = true;
    } finally {
      isSubmitting = false;
    }
  }
</script>

<form
  onsubmit={submitComment}
  class="flex flex-col gap-y-4 text-md
    **:transition-colors **:duration-300"
>
  <div class="flex flex-col gap-y-4">
    <div class="flex gap-y-4 justify-between items-end">
      <h2 class="c-section-title mb-0.5">Leave a comment</h2>

      <button class="c-button px-3" type="submit" disabled={!canSubmit}>
        Submit
      </button>
    </div>

    <div
      class="flex flex-col *:w-full *:border-stone-300 focus-within:*:border-cyan-500"
    >
      <div
        class="flex items-center justify-between text-stone-500 font-light px-3 h-6 text-sm rounded-t-lg border border-b-0"
      >
        <div
          class:invisible={!message}
          class:text-red-500={isErrorMessage}
          class:animate-wiggle={isErrorMessage}
        >
          {message}
        </div>

        <span
          class:text-red-500={content.length >
            config.api.constraints.maxCommentLength}
        >
          {content?.length || 0} / {config.api.constraints.maxCommentLength}
        </span>
      </div>
      <textarea
        class="text-lg focus:outline-none rounded-b-lg border
        px-3 py-2 placeholder:font-light"
        placeholder="Share your thoughts here..."
        id="content"
        name="content"
        bind:value={content}
        required
      ></textarea>
    </div>
  </div>

  <div class="flex flex-wrap gap-x-3 gap-y-4 items-start">
    <div class="flex flex-1 flex-col">
      <label class="c-label" for="name">Name (required)</label>
      <input
        class="c-input"
        id="name"
        name="senderName"
        bind:value={senderName}
        required
      />
    </div>

    <div class="flex flex-1 flex-col">
      <label class="c-label" for="email">Email (optional)</label>
      <input
        class="c-input"
        id="email"
        name="senderEmail"
        type="email"
        bind:value={senderEmail}
      />
    </div>

    <div class="relative h-15 min-w-40 text-stone-300 font-light text-sm">
      <div
        class="cf-turnstile"
        data-sitekey={config.token.turnstileSiteKey}
      ></div>
      <span class="absolute top-1 left-0.5 -z-50"> CAPTCHA is loading... </span>
    </div>
  </div>

  <script
    src="https://challenges.cloudflare.com/turnstile/v0/api.js"
    defer
  ></script>
</form>
