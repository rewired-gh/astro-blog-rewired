/** @type {import('@sveltejs/kit').Config} */
import { vitePreprocess } from '@astrojs/svelte';

export default {
	preprocess: vitePreprocess(),
};
