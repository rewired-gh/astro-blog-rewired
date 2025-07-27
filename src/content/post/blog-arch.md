---
date: 2025-03-09
title: "It's Free Real Estate: Design the Perfect Blog"
tags: [
  'Cloud Native',
  'Web Dev',
  'Full-stack',
  'UX',
  'SEO',
]
language: 'en'
---

> 注意：为了面向更多的受众，本文不提供中文版本，如有需要请使用浏览器的翻译功能，感谢理解。

> Please note: To reach a broader audience, a Chinese version of this article is not provided. If needed, please use your browser's translation feature. Thank you for your understanding.

> Cloudflare Pages might be gradually phasing out, please consider using Cloudflare Worker for future projects. This article does not necessarily reflect the latest architecture of this blog.

## Introduction

Nowadays, With so much free "real estate" to choose from, we can literally build a complete blog with blazingly fast worldwide CDN, automated CI/CD, distributed database, edge computing API endpoints, spam protection, and LLM-based content moderation, all for **free**.

As a [wise man](https://youtu.be/cd4-UnU8lWY) (or maybe it was [Cloudflare](https://webmasters.stackexchange.com/a/88685)) once said:

> IT'S FREE REAL ESTATE!

<iframe width="336" height="189" src="https://www.youtube-nocookie.com/embed/cd4-UnU8lWY?start=34" title="YouTube video player" frameborder="0" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

But how? Let's dive into the rabbit hole. In this article, I'll walk you through the architecture of my blog.

## Overview

> Tip: Click "**On this page**" to view the table of contents and jump to any section you want.

Here is a brief overview of the technology stack:

- Frontend:
  - Core: Astro.js, Svelte, Tailwind CSS, TypeScript
  - Content: Markdown, Remark, Rehype
  - Hosting: Cloudflare Pages
- Backend:
  - Core: Cloudflare Pages Functions, TypeScript
  - Database: Cloudflare D1
  - Spam Protection: Cloudflare Turnstile
  - LLM: OpenAI SDK, ByteDance Volcano Ark
  - Notification: Telegram Bot Platform

## Content Generation

Astro can do a lot of heavy lifting right out of the box. It also has a useful [guide](https://docs.astro.build/en/guides/markdown-content) for basic Markdown rendering. If you want to build a documentation website, Astro offers the polished and easy-to-use [Starlight](https://starlight.astro.build) framework. However, building a complete blog requires tackling some problems.

### Styling

To style the articles, I started with [Tailwind Typography](https://github.com/tailwindlabs/tailwindcss-typography). After some further developement, I quickly realized its limitations. Fortunately, Tailwind Typography can be customized with the `tailwind.config.mjs` file. Here is an example:

```js
/** @type {import('tailwindcss').Config} */
import colors from 'tailwindcss/colors';
export default {
  extend: {
      typography: {
        DEFAULT: {
          css: {
            maxWidth: '100%',
            h2: {
              fontSize: '22px',
            },
            // ...
          },},
        stone: {
          css: {
            '--tw-prose-body': colors.stone[800],
            // ...
          },},},},},};
```

### Content Excerpt

Excerpts of blog posts are useful for displaying summaries in listings and as meta descriptions. You can generate excerpts during the build process using a few techniques. I chose [markdown-it](https://github.com/markdown-it/markdown-it) and [html-to-text](https://github.com/html-to-text/node-html-to-text) (though the latter is not actively maintained). Here is the helper function I use to generate excerpts:

```ts
import MarkdownIt from 'markdown-it';
import { convert } from 'html-to-text';

const parser = new MarkdownIt();
const excerptCache = new Map<string, string>();
export function createExcerpt(slug: string, body: string, maxLen: number) {
  const cached = excerptCache.get(slug);
  if (cached) {
    return cached;
  }
  const html = parser.render(body);
  const options = {
    wordwrap: null,
    selectors: [
      { selector: 'a', options: { ignoreHref: true } },
      { selector: 'img', format: 'skip' },
      { selector: 'figure', format: 'skip' },
      { selector: 'pre', format: 'skip' },
      { selector: 'table', format: 'skip' },
      { selector: 'h1', format: 'skip' },
      // ...
    ],
  };
  const text = convert(html, options);
  const distilled = convert(text, options);
  const excerpt = distilled.substring(0, maxLen) + '…';
  excerptCache.set(slug, excerpt);
  return excerpt;
}
```

Please note that the HTML content is converted twice to ensure thorough cleanup.

## User Experience

### Design Principles

The aesthetics of my blog were inspired by [ribice/kiss](https://github.com/ribice/kiss). Although this theme doesn't quite match my standards, it remains my favorite. If you don't want to invest the time in building a blog from scratch, it's a great starting point.

I'm a lazy person who likes enjoying life and touching grass instead of staring at a boring computer screen for hours. So, after investigating all the obvious options, I convinced myself that no free blog website templates met these requirements:

1. Extreme perfection
2. Minimalism without bloated visuals
3. Solid SEO optimization, accessibility, and responsiveness
4. Elegant details and cutting-edge web technologies
5. Extensible to whatever I like

Speaking of perfection, a basic element of perfection is consistency: maintaining the same padding, margin, gap, color, size, and so on throughout the design.

### Components

Every good design is a human-centred design. For example, any button intended for user interaction should have a clear and sufficiently large border, ensuring that mobile users can easily identify the tappable area. Visual cues should appear when a cursor hovers over a button to encourage interaction. On the contrary, a disabled button should be easily distinguishable from its active state.

Here is the Tailwind CSS code for a button:

```css
@layer components {
  .c-button {
    @apply truncate text-stone-500 text-sm font-light text-center py-1.5 border rounded-full border-stone-300 transition-colors duration-300;
  }
  
  .c-button:hover:not(:disabled), .c-button:focus:not(:disabled) {
    @apply border-cyan-500 text-cyan-700 cursor-pointer outline-0;
  }

  .c-button:disabled {
    @apply text-stone-400 border-dashed;
  }

  // ...
}
```

Here is a handy Tailwind CSS trick. It adds a `hocus` variant and allows you to target both hover and focus states simultaneously, therefore reducing code duplication.

```css
@custom-variant hocus (&:hover, &:focus);
```

```html
<a href="https://example.com" class="hocus:text-cyan-700">
  Example
</a>
```

### Motions

Here are some notable motions used in my blog. Other motions are mostly trivial to implement using Tailwind CSS.

#### Navigation Bar Button

The hover effect of navigation bar buttons is implemented using CSS [`backdrop-filter`](https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter). It's in the Baseline 2024 list so don't worry about the compatibility. ~~You should always blame users for not upgrading their browsers.~~ Here is the code:

```html
<a
  tabindex="0"
  href="https://example.com"
  class="hocus:after:h-[calc(100%+0.4rem)] relative after:pointer-events-none after:absolute after:-top-[0.2rem] after:-left-[0.3rem] after:z-10 after:h-0 after:w-[calc(100%+0.6rem)] after:backdrop-invert after:transition-all after:duration-300 focus:outline-0"
>
  Example
</a>
```

#### Dynamic Item

This transition effect is used on post titles on the home page during hover and on the items in the table of contents. To make the transition buttery smooth, I added the following ingredients:

- Blur filter
- Size change
- Color fade-in

In the table of contents, it also includes an X-axis translation. Here is the code:

```html
<a
  class="relative text-stone-500 no-underline transition duration-300 before:absolute before:top-0 before:-left-3 before:inline-block before:h-0 before:w-0 before:-translate-x-1/2 before:bg-cyan-50 before:blur-xs before:transition-all before:duration-300 [&.active]:translate-x-4 [&.active]:text-cyan-700 [&.active]:before:h-full [&.active]:before:w-1 [&.active]:before:bg-cyan-500 [&.active]:before:blur-none"
  href="#example"
>
  <span class="py-1">Example</span>
</a>
```

#### "The Wiggle"

When an operation fails, the message text will turn red and display a subtle wiggle animation. This visual cue is inspired by ByteDance Acro Design. Here is the code:

```css
@theme {
  --animate-wiggle: wiggle 150ms ease-out 2;
  @keyframes wiggle {
    0% {}
    25% {
      transform: translateX(-1px);
    }
    75% {
      transform: translateX(1px);
    }
    100% {}
  }
}
```

```html
<div
  class:invisible={!message}
  class:text-red-500={isErrorMessage}
  class:motion-safe:animate-wiggle={isErrorMessage}
  class:motion-safe:animate-pulse={isSubmitting}
>
  {message}
</div>
```

### Accessibility

An easy way to improve accessibility is by auditing your website using [Lighthouse](https://developer.chrome.com/docs/lighthouse/overview) and always writing [semantic HTML](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Accessibility/HTML). However, there are some extra things to consider:

1. Add `tabindex="0"` wherever it's needed. Try navigating your website using only the keyboard, especially on Safari.
2. Add a ["Skip to Main Content"](https://www.a11y-collective.com/blog/skip-to-main-content) button.
3. Use [ARIA](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA) attributes when necessary.
4. Review [this checklist](https://www.a11yproject.com/checklist) and test the website yourself.

### Responsive Design

Tailwind CSS has concise and helpful [documentation](https://tailwindcss.com/docs/responsive-design) on this topic. The general idea is to target smaller screens first and then consider larger screens. I prefer to test the responsive design with Chrome DevTools because it can simulate various screen dimensions.

## SEO

Similar to accessibility, SEO (Search Engine Optimization) can be audited using [Lighthouse](https://developer.chrome.com/docs/lighthouse/overview). However, since SEO is a rather broad concept that covers many aspects, I will share my approach to achieving a decent level of SEO.

### Basic Metadata

Basic metadata includes the language attribute and standard HTML metadata in the `head` section. Here is a minimal example:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width" />
    <meta name="description" content={description} />
    <title>Example</title>
    <link rel="cononical" href={Astro.url} />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="sitemap" href="/sitemap-index.xml" />
    <meta name="generator" content={Astro.generator} />
  </head>
  <body>
    <!-- ... -->
  </body>
</html>
```

### For Crawlers

Google's crawler tends to prefer websites with a correct sitemap, a `robots.txt` file, and a well-handled 404 error page. You can configure the generation of sitemap and `robots.txt` file by following the [guide](https://docs.astro.build/en/guides/integrations-guide/sitemap) of `@astrojs/sitemap`. If you're using [Google Search Console](https://search.google.com/search-console), it's recommended to manually submit your sitemap when you add your blog for the first time.

You might also find it helpful to configure your RSS feed generation in a similar way. For example, I use `@astrojs/rss` and followed this [guide](https://docs.astro.build/en/recipes/rss).

### Open Graph

The [Open Graph protocol](https://ogp.me) is used by many major social media platforms for displaying any web page as a rich object. The rich object can be a card of a link. Implementing these properties on your website can potentially increase its exposure. Here are some of the Open Graph properties I used:

```html
<head>
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:url" content={Astro.url} />
  <meta property="og:site_name" content={config.site.name} />
  <meta property="og:type" content={pageType} />
</head>
```

## Table of Contents

### Content Generation

#### Components

Headings of an article can be retrieved from `(await entry.render()).headings`. The heading depth starts from 2, which corresponds to `h2`. After retrieving the headings, they need to be converted into a nested structure. Below is the algorithm I designed for this transformation:

```ts
export interface ExtendedHeading extends MarkdownHeading {
  children: ExtendedHeading[];
}

export function buildToc(headings: MarkdownHeading[]): ExtendedHeading[] {
  const lastHeading: { [key: number]: ExtendedHeading } = {};
  const toc = headings.reduce((acc, h) => {
    if (h.depth >= 6) {
      return acc;
    }
    const heading: ExtendedHeading = { ...h, children: [] };
    if (h.depth <= 2) {
      acc.push(heading);
    } else {
      const parent = lastHeading[h.depth - 1];
      parent?.children?.push(heading);
    }
    lastHeading[h.depth] = heading;
    return acc;
  }, [] as ExtendedHeading[]);
  return toc;
}
```

I know it's not written in a purely functional style, but it's more readable.

To render the table of contents, I created an Astro wrapper component, `TableOfContents`, which contains the dynamic component `TableOfContentsCore`. The heading items are built recursively using the `TableOfContentsHeading` component. Here is how `TableOfContentsHeading` looks like:

```astro
---
interface Props {
  heading: ExtendedHeading;
}

const { heading } = Astro.props;
---

<li>
  <a href={'#' + heading.slug}>
    <span>{heading.text}</span>
  </a>
  {
    heading.children.length > 0 && (
      <ul>
        {heading.children.map((h) => (
          <Astro.self heading={h} />
        ))}
      </ul>
    )
  }
</li>
```

#### Markdown Parsing

I also wrote a Rehype plugin to wrap each heading and its directly associated content in a section. This step is necessary for implementing "On this page" detection, which will be explained later. Here is the implementation:

```ts
import { visit } from 'unist-util-visit';
import { h } from 'hastscript';

export default function rehypeSectionHeadings() {
  return (tree: any) => {
    visit(tree, 'root', (rootNode) => {
      const sectionedChildren = [];
      let currentSection = null;
      for (const child of rootNode.children) {
        if (child.type === 'element' && ['h2', 'h3', 'h4', 'h5'].includes(child.tagName)) {
          if (currentSection) {
            sectionedChildren.push(currentSection);
          }
          currentSection = h('section', [child]);
        } else {
          if (currentSection) {
            currentSection.children.push(child);
          } else {
            sectionedChildren.push(child);
          }
        }
      }
      if (currentSection) {
        sectionedChildren.push(currentSection);
      }
      rootNode.children = sectionedChildren;
    });
  };
}
```

### Scripting

To automatically highlight the sections on the viewport, I attached `IntersectionObserver` to each section. The highlighted items are marked with `active` class. At first, I wrote everything in the dynamic component using Svelte, but later quickly found that writing vanilla code is much more easy and maintainable. Here is the code for attaching `IntersectionObserver`s to all sections:

```ts
function addIntersectionObserver() {
  const observer = new IntersectionObserver((sections) => {
    sections.forEach((section) => {
      const heading = section.target.querySelector('h2, h3, h4, h5');
      if (!heading) {
        return;
      }
      const id = heading.getAttribute('id');
      if (!id) {
        return;
      }
      const link = document.querySelector(`ul#toc li a[href="#${id}"]`);
      if (!link) {
        return;
      }
      if (section.intersectionRatio > 0) {
        const i = headingDequeue.insert(
          { slug: id, text: heading.textContent || '' },
          headingOrderMap[id]
        );
        if (i === 0 && currentSpanElem) {
          currentSpanElem.textContent = heading.textContent;
        }
        link.classList.add('active');
      } else {
        const i = headingDequeue.remove(
          { slug: id, text: heading.textContent || '' },
          headingOrderMap[id]
        );
        if (i === 0 && currentSpanElem) {
          currentSpanElem.textContent = headingDequeue.get(0)?.text || '';
        }
        link.classList.remove('active');
      }
    });
  });
  document.querySelectorAll('article section').forEach((section) => {
    observer.observe(section);
  });
}
```

The above code also handles the "On this page" text. To determine which section title is displayed, I designed an algorithm based on a total ordered set data structure. This structure combines a hash set with a sorted list, and on insertion it uses binary search to find the correct index. Here is the implementation:

```ts
export class TotalOrderedSet<T> {
  private _existedWeights: Set<number>;
  private _orderedElements: {
    value: T;
    weight: number;
  }[];

  constructor() {
    this._existedWeights = new Set();
    this._orderedElements = [];
  }

  private _findIndexForInsert(weight: number): number {
    let low = 0;
    let high = this._orderedElements.length;

    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      if (this._orderedElements[mid].weight < weight) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }
    return low;
  }

  private _findIndexForRemove(weight: number): number {
    let low = 0;
    let high = this._orderedElements.length - 1;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (this._orderedElements[mid].weight === weight) {
        return mid;
      } else if (this._orderedElements[mid].weight < weight) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    return -1;
  }

  insert(value: T, weight: number) {
    if (this._existedWeights.has(weight)) {
      return -1;
    }
    const index = this._findIndexForInsert(weight);
    this._orderedElements.splice(index, 0, { value, weight });
    this._existedWeights.add(weight);
    return index;
  }

  remove(value: T, weight: number) {
    if (!this._existedWeights.has(weight)) {
      return -1;
    }
    const index = this._findIndexForRemove(weight);
    this._orderedElements.splice(index, 1);
    this._existedWeights.delete(weight);
    return index;
  }

  get(index: number) {
    return this._orderedElements[index]?.value;
  }
}
```

## Comments Section

The comments section of my blog is pretty simple, but the implementation behind the scene is a little bit complicated. It is deployed mostly on Cloudflare and uses [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/functions). For each comment submission, the backend service validates all fields, verifies the [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile) token, uses an LLM to determine whether the comment meets the guidelines, saves the comment to a [Cloudflare D1](https://developers.cloudflare.com/d1) database, notifies me via a Telegram bot (this process should use a message queue when traffic is high), and finally returns a success response.

### API and Persistence

The Cloudflare Pages Functions backend codebase can be embedded within the main website repository. This allows Cloudflare Pages to automatically build and deploy both the frontend and the backend functions together. To test the integration between the API endpoints and the frontend during development, the `wrangler` and `astro` commands need to be run concurrently, for example, using the `concurrently` package:

```bash
concurrently "pnpm astro dev" "pnpm wrangler pages dev"
```

Database resources and environment variables should be declared in the `wrangler.toml` file. I use different databases for development and production. The database resource is provided as a parameter to each cloud function, and the query language for Cloudflare D1 is nearly identical to SQLite. To execute multiple statements in a single request, it requires batch execution instead of SQL transaction statements. Here is an example:

```ts
const batchResult = await db.batch([
  // Delete the oldest comment if we've reached the limit
  db.prepare(
      'DELETE FROM comments WHERE id = (SELECT id FROM comments WHERE post_id = ? ORDER BY created_at ASC LIMIT 1)'
    )
    .bind(postId),

  // Insert the new comment
  db.prepare(
      'INSERT INTO comments (post_id, sender_name, sender_email, content, ip) VALUES (?, ?, ?, ?, ?) RETURNING id, sender_name, sender_email, content, created_at'
    )
    .bind(postId, data.senderName, data.senderEmail || null, data.content, clientIp),
]);
```

### Comment Creation

The process for posting a comment is as follows:

1. Parse the request, including contents from URL parameters, body form, and headers.
2. Validate whether the basic fields comply with the contraints.
3. Check whether Cloudflare Turnstile verification is passed.
4. Use LLM to check whether the comment is appropriate. If the LLM has a high latency, this process should be asynchronous by using a message queue.
5. If a post has too many comments, delete some and insert the new comment in an atomic batch to the Cloudflare D1 database. Otherwise, simply insert the comment.
6. Notify admins a new comment was posted via a Telegram bot.
7. Respond.

### Comments Fetching

The process for fetching comments from a post is as follows:

1. Parse the request, including post ID and page number.
2. Calculate the pagination related variables.
3. If the pagination is invalid, the page number must be invalid.
4. Select the comments from Cloudflare D1 database.
5. Respond.