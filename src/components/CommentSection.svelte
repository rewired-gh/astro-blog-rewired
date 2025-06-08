<script lang="ts">
  import CommentForm from './CommentForm.svelte';
  import CommentList from './CommentList.svelte';

  export let postId: string;
  let commentListRef: any;

  function handleCommentSubmitted() {
    if (commentListRef) {
      commentListRef.refreshComments();
    }
  }

  export const prerender = false;
</script>

<section class="flex flex-col gap-y-8">
  <CommentForm {postId} onCommentSubmitted={handleCommentSubmitted} />
  <CommentList bind:this={commentListRef} {postId} />
</section>
