---
title: "I Started a Blog"
publishedAt: "2023-11-09"
---

I started a blog.  
I built it with Next.js.
The source is up on [GitHub](https://github.com/sh1ma/blog).

Since I went through the trouble of building it, I figured I'd write about the tech behind the blog.

## Why I Built a Blog

A coworker of mine had built their own blog, which got me interested.  
On top of that, I wanted a place where I could talk about tech I like, but posting self-indulgent articles on Zenn felt a bit awkward, so I decided to build my own blog.  
I've tried starting blogs a few times before and none of them lasted, so this is my rematch.

## Tech Stack

I went with Next.js + Vercel this time because I wanted to write in React and I wanted deployment to be easy.
Honestly, I haven't been keeping up with recent frontend trends, so I stuck with tech I'm reasonably comfortable with.

### Managing Articles

Early on I was planning to manage articles with microCMS, and I got as far as rendering them, but I lost interest and dropped it.
Part of it was a vague feeling that depending on an external service felt risky.
In the end, I settled on managing articles as Markdown (well, MDX).

### Design

I picked [Tailwind CSS](https://tailwindcss.com/) partly because coming up with a design from scratch sounded like a pain.
Tailwind gives you sensible defaults for widths, padding, margins, and colors so you don't have to pick specific numbers yourself,
which meant even someone as inexperienced with design as me could put together a reasonably clean UI.

### Rendering Articles

This was the part I struggled with the most. At first, I wrote my own code to convert `.md` files to HTML with [remark](https://github.com/remarkjs/remark) and pipe the result through [rehype](https://github.com/rehypejs/rehype).

As I kept working on it, this approach started to feel off, so I switched to [MDX](https://mdxjs.com/), which Next.js officially supports.
Next.js's MDX support seems to run on top of the same rehype and remark under the hood, so it was nice not to have to wire that up myself.

Body styling is handled nicely by [@tailwindcss/typography](https://tailwindcss.com/docs/typography-plugin).
It renders well without me having to think much about it.

For code snippets in the body, though, I used [rehype-pretty-code](https://github.com/atomiks/rehype-pretty-code), a rehype plugin that syntax-highlights code blocks.
There are other syntax highlighting plugins too, but for example [rehype-prism](https://github.com/mapbox/rehype-prism) apparently has [issues where parsing breaks](https://blog.ojisan.io/use-shiki/), so I went with rehype-pretty-code.

### Deployment

I used Vercel for deployment. Vercel officially supports Next.js, so I got zero-config deployment out of the box.
Vercel is the best!

## Wrapping Up

That's the minimal blog setup. There are still a few features I want to add and things I want to polish, so I hope to keep chipping away at it.
I'd also like to grow the number of articles at my own pace.
