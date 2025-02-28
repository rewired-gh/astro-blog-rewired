<script lang="ts">
  import CommentForm from "./CommentForm.svelte";
  import CommentList from "./CommentList.svelte";

  export let postId: string;
  let commentListRef: any;

  function handleCommentSubmitted() {
    if (commentListRef) {
      commentListRef.refreshComments();
    }
  }
</script>

<section>
  <h2 class="text-[22px] mb-[1em] text-stone-900">Comments</h2>
  <CommentForm {postId} onCommentSubmitted={handleCommentSubmitted} />
  <CommentList bind:this={commentListRef} {postId} />
</section>
