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
</script>

<section>
  <CommentList bind:this={commentListRef} {postId} />
  <CommentForm {postId} onCommentSubmitted={handleCommentSubmitted} />
</section>
