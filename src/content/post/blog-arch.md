---
date: 2025-03-09
title: "It's Free Real Estate: Design the Perfect Blog"
tags: [
  'Cloud Native',
  'Web Dev'
]
language: 'en'
---

## Introduction

With so much "real estate" to choose from these days, we can literally build a blog website with a blazingly fast worldwide CDN, automated CI/CD, a distributed database, edge computing API endpoints, spam protection, and LLM-based content moderation, all for **free**.

As a [wise man](https://youtu.be/cd4-UnU8lWY) (or maybe it was [Cloudflare](https://webmasters.stackexchange.com/a/88685)) once said:

> IT'S FREE REAL ESTATE!

<iframe width="336" height="189" src="https://www.youtube-nocookie.com/embed/cd4-UnU8lWY?start=34" title="YouTube video player" frameborder="0" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

But how? Let's dive into the rabbit hole.

## Overview

> Tip: Click "On this page" to view the table of contents and jump to any section.

Here's a quick overview of the technologies powering my blog:

- Frontend:
  - Core: Astro.js, Svelte, Tailwind CSS, TypeScript
  - Content: Markdown, Remark, Rehype
  - Hosting: Cloudflare Pages
- Backend:
  - Core: Cloudflare Pages Functions, TypeScript
  - Database: Cloudflare D1
  - Spam Protection: Cloudflare Turnstile
  - LLM: OpenAI, ByteDance Volcano Ark
  - Notification: Telegram Bot Platform

## User Experience

### Design Principles

The aesthetics of my blog are originally inspired by [ribice/kiss](https://github.com/ribice/kiss). Although this theme doesn't quite match my standards, it remains my favorite. If you don't want to invest the time in building a blog from scratch, it's a great starting point.

I'm a lazy person who likes enjoying life and touching grass instead of staring at a boring computer screen for hours. So, after investigating all the obvious options, I convinced myself that no free blog website templates met these requirements:

1. Extreme perfection
2. Minimalism without bloated visuals
3. Solid SEO optimization, accessibility, and responsiveness
4. Elegant details and cutting-edge web technologies
5. Extensible to whatever I like

A basic element of perfection is consistency: maintaining the same padding, margin, gap, color, size, and so on throughout the design.

### Components

First and foremost, a human-friendly design is paramount. For instance, any button intended for user interaction should have a clear and sufficiently large border, ensuring that mobile users can easily identify the tappable area. Visual cues should appear when a cursor hovers over a button to encourage interaction. Conversely, a disabled button should be easily distinguishable from its active state.

Here is the example Tailwind CSS code for a button:

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

Speaking of hover effects, here's a handy Tailwind CSS trick. It adds a `hocus` variant and allows you to target both hover and focus states simultaneously, reducing code duplication.

```css
@custom-variant hocus (&:hover, &:focus);
```

```html
<a href="https://example.com" class="hocus:text-cyan-700">
  Example
</a>
```

### Transitions and Animations

#### Navigation Bar Button

The hover effect of navigation bar buttons is implemented using CSS [`backdrop-filter`](https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter). It's in the Baseline 2024 list so don't worry about the compatibility. ~~You should always blame users for not upgrading their browsers.~~ Here is the example code:

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

This transition effect is used on post titles on the home page during hover and on the items in the table of contents. To make the transition buttery smooth, it consists of these ingredients:

- Blur filter
- Size change
- Color fade-in

In the table of contents, it also includes an X-axis translation. Here is the example code:

```html
<a
  class="relative text-stone-500 no-underline transition duration-300 before:absolute before:top-0 before:-left-3 before:inline-block before:h-0 before:w-0 before:-translate-x-1/2 before:bg-cyan-50 before:blur-xs before:transition-all before:duration-300 [&.active]:translate-x-4 [&.active]:text-cyan-700 [&.active]:before:h-full [&.active]:before:w-1 [&.active]:before:bg-cyan-500 [&.active]:before:blur-none"
  href="#example"
>
  <span class="py-1">Example</span>
</a>
```

#### "The Wiggle"

If an operation fails, the message text will turn red and display a subtle wiggle animation. This visual cue is inspired by ByteDance Acro Design. Here is the example code:

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

- Add `tabindex="0"` wherever it's needed. Pay special attention to navigating your website using only the keyboard, especially on Safari.
- Add a ["Skip to Main Content"](https://www.a11y-collective.com/blog/skip-to-main-content) button.
- Use [ARIA](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA) attributes when necessary.
- Review [this checklist](https://www.a11yproject.com/checklist) and test the website yourself.

### Responsive Design

Tailwind CSS has concise and helpful [documentation](https://tailwindcss.com/docs/responsive-design) on this topic. The general approach is to target smaller screens first and then consider larger screens. I prefer to test my responsive design with Chrome DevTools because it can simulate various devices.

*(This article is still under construction.)*