import { z, defineCollection } from 'astro:content';

const postCollection = defineCollection({
	type: 'content',
	schema: z.object({
		title: z.string(),
		date: z.date(),
		tags: z.array(z.string()),
		language: z.string().optional(),
	}),
});

export const collections = {
	post: postCollection,
};
