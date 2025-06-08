<script lang="ts">
	import { onMount } from 'svelte';
	import { apiConfig } from '../lib/config';
	import type { CommentResponse, PaginationMeta } from '../types/comments';
	import moment from 'moment';
	import Pagination from './Pagination.svelte';

	const { postId } = $props<{ postId: string }>();

	let comments: CommentResponse[] = $state([]);
	let pagination: PaginationMeta | null = $state(null);
	let loading = $state(true);
	let error: string | null = $state(null);
	let currentPage = 1;

	// Expose this function to be called from parent component
	export function refreshComments() {
		fetchComments(1, true);
	}

	async function fetchComments(page = 1, uninterrupted = false) {
		if (!uninterrupted) {
			loading = true;
		}
		error = null;

		try {
			const commentsEndpoint = apiConfig.endpoints.comments(postId);
			const url = `${apiConfig.baseUrl}/${commentsEndpoint}?page=${page}`;

			const response = await fetch(url);

			if (!response.ok) {
				throw new Error(`Failed to fetch comments: ${response.status} ${response.statusText}`);
			}

			const rawData = await response.json();

			if (rawData && typeof rawData === 'object') {
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
	});
</script>

<div class="flex flex-col gap-y-4">
	<h2 class="c-section-title">Comments</h2>

	{#if loading}
		<p class="font-light text-stone-500 motion-safe:animate-pulse">Loading comments...</p>
	{:else if error}
		<p class="font-light text-stone-500">{error}</p>
	{:else if comments.length === 0}
		<p class="font-light text-stone-500">No comments yet. Be the first to comment!</p>
	{:else}
		<div class="flex flex-col gap-y-4 font-light">
			{#each comments as comment}
				<div>
					<div class="mb-0.5 flex items-center truncate text-sm">
						<strong class="font-medium">{comment.senderName}</strong>
						{#if comment.senderEmail}
							<span class="ml-1 shrink">({comment.senderEmail})</span>
						{/if}
						<span class="m-1">·</span>
						<span class="text-stone-500">
							{moment.utc(comment.createdAt).local().fromNow()}
						</span>
					</div>
					<div class="font-normal">{comment.content}</div>
				</div>
			{/each}
		</div>

		{#if pagination}
			<Pagination
				currentPage={pagination.currentPage || 1}
				totalPages={pagination.totalPages || 1}
				onPrevPage={pagination.prevPage ? handlePrevPage : null}
				onNextPage={pagination.nextPage ? handleNextPage : null}
			/>
		{/if}
	{/if}
</div>
