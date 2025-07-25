<script lang="ts">
	import { tick, onMount, onDestroy } from 'svelte';
	import config from '../lib/config';

	let { postId, onCommentSubmitted } = $props<{
		postId: string;
		onCommentSubmitted?: () => void;
	}>();

	let senderName = $state('');
	let senderEmail = $state('');
	let content = $state('');
	let message = $state('');
	let isErrorMessage = $state(false);
	let isSubmitting = $state(false);

	let canSubmit = $derived(!isSubmitting && senderName.trim() && content.trim());
	let formChanged = $derived(senderName !== '' || senderEmail !== '' || content !== '');

	function handleBeforeUnload(event: BeforeUnloadEvent) {
		if (formChanged && !isSubmitting) {
			event.preventDefault();
			return true;
		}
	}

	function resetTurnstile() {
		if (typeof window !== 'undefined' && window.turnstile) {
			window.turnstile.reset();
		}
	}

	onMount(() => {
		if (typeof window !== 'undefined') {
			window.addEventListener('beforeunload', handleBeforeUnload);
		}
	});

	onDestroy(() => {
		if (typeof window !== 'undefined') {
			window.removeEventListener('beforeunload', handleBeforeUnload);
		}
	});

	async function submitComment(event: SubmitEvent) {
		event.preventDefault();

		if (!senderName.trim() || !content.trim()) {
			message = 'Name and comment are required.';
			isErrorMessage = true;
			return;
		}

		isSubmitting = true;
		message = 'Submitting...';
		isErrorMessage = false;

		try {
			const commentsEndpoint = config.api.endpoints.comments(postId);
			const url = `${config.api.baseUrl}/${commentsEndpoint}`;

			const form = event.target as HTMLFormElement;
			const formData = new FormData(form);

			const response = await fetch(url, {
				method: 'POST',
				body: formData,
			});

			const data = await response.json();

			if (response.ok) {
				message = 'Last comment submitted successfully!';
				isErrorMessage = false;
				senderName = '';
				senderEmail = '';
				content = '';
				if (onCommentSubmitted) {
					await tick();
					onCommentSubmitted();
				}
			} else {
				message = data.error || 'Failed to submit comment.';
				isErrorMessage = true;
			}
		} catch (error) {
			console.error(error);
			message = 'An error occurred. Please try again.';
			isErrorMessage = true;
		} finally {
			isSubmitting = false;
			resetTurnstile();
		}
	}
</script>

<form
	onsubmit={submitComment}
	class="text-md flex flex-col gap-y-4
    **:transition-colors **:duration-300"
>
	<div class="flex flex-col gap-y-4">
		<div class="flex items-end justify-between gap-y-4">
			<h2 class="c-section-title mb-0.5">Leave a comment</h2>

			<button class="c-button px-3" type="submit" disabled={!canSubmit}> Submit </button>
		</div>

		<div class="flex flex-col *:w-full *:border-stone-300 focus-within:*:border-cyan-500">
			<div
				class="flex h-6 items-center justify-between truncate rounded-t-lg border border-b-0 px-3 text-sm font-light text-stone-500"
			>
				<div
					class="flex-1"
					class:invisible={!message}
					class:text-red-500={isErrorMessage}
					class:motion-safe:animate-wiggle={isErrorMessage}
					class:motion-safe:animate-pulse={isSubmitting}
				>
					{message}
				</div>

				<span class:text-red-500={content.length > config.api.constraints.maxCommentLength}>
					{content?.length || 0} / {config.api.constraints.maxCommentLength}
				</span>
			</div>
			<label class="hidden" for="content">Content (required)</label>
			<textarea
				class="max-h-96 min-h-24 rounded-b-lg border
        px-3 py-2 text-lg placeholder:font-light focus:outline-none"
				placeholder="Share your thoughts here..."
				id="content"
				name="content"
				bind:value={content}
				required
			></textarea>
		</div>
	</div>

	<div class="flex flex-wrap items-start gap-x-3 gap-y-4 *:w-full sm:*:w-fit">
		<div class="flex flex-1 flex-col gap-y-1">
			<label class="c-label" for="name">Name (required)</label>
			<input
				class="c-input"
				id="name"
				name="senderName"
				autocomplete="name"
				bind:value={senderName}
				required
			/>
		</div>

		<div class="flex flex-1 flex-col gap-y-1">
			<label class="c-label" for="email">Email (optional)</label>
			<input
				class="c-input"
				id="email"
				name="senderEmail"
				type="email"
				autocomplete="email"
				bind:value={senderEmail}
			/>
		</div>

		<div class="relative h-15 min-w-[300px] text-sm font-light text-stone-400">
			<div
				class="cf-turnstile"
				data-sitekey={config.token.turnstileSiteKey}
				data-theme="light"
			></div>
			<span class="absolute top-1/2 left-1/2 -z-50 -translate-1/2 motion-safe:animate-pulse">
				CAPTCHA is loading...
			</span>
		</div>
	</div>

	<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" defer>
	</script>
</form>
