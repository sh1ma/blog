---
  title: "I Started a Blog"
  publishedAt: "2023-11-09"
---

I started a blog.  
I built it with Next.js.
The code is public on [GitHub](https://github.com/sh1ma/blog).

Since I went to the trouble of building it, I’ll explain the technology behind this blog.

## Motivation for Building the Blog

I was inspired by a coworker who had built a blog.  
On top of that, I wanted a place where I could talk about technologies I like,
but I felt hesitant to post purely self-indulgent articles on zenn, so I decided to make a blog.  
I’ve made blogs several times before, but none of them lasted long, so this is my revenge match.

## Tech Stack

This time I chose Next.js + Vercel because I wanted to write it in React and wanted deployment to be easy.
To be honest, I haven’t really kept up with recent frontend trends, so I chose technologies I’m reasonably used to.

### Managing Articles

When I first started building it, I expected to manage articles with microcms, and I got as far as displaying articles, but I lost motivation and stopped.
I also had this vague feeling that depending on something external was kind of scary.
As a result, I decided to manage articles with markdown, or rather mdx.

### Design

I chose [Tailwind CSS](https://tailwindcss.com/) partly because thinking up the design myself was a hassle.
Tailwind gives you a nice set of width, padding, margin, color, and other values without requiring you to decide every specific number yourself,
so even though I’m not used to design, I was able to make a reasonably tidy UI.

### Rendering Articles

This was the part I struggled with the most while building it. At first, I wrote my own code to convert `.md` files into HTML with [remark](https://github.com/remarkjs/remark)
and feed that into [rehype](https://github.com/rehypejs/rehype).

But as I kept building it, I started to feel that approach was not great, so I decided to use [mdx](https://mdxjs.com/), which Next.js officially supports.
Apparently Next.js’s mdx support runs on top of the rehype and remark mentioned above, so it was nice not to have to handle that myself.

[@tailwindcss/typography](https://tailwindcss.com/docs/typography-plugin) handles the body styling nicely.
I was able to render things nicely without thinking about much in particular.

For code snippets that appear in the body, however, I used [rehype-pretty-code](https://github.com/atomiks/rehype-pretty-code).
This is a rehype plugin that syntax-highlights code blocks.
There seem to be other syntax highlighting plugins too, but for example with [rehype-prism](https://github.com/mapbox/rehype-prism),
it seems [parsing can break](https://blog.ojisan.io/use-shiki/), so I decided to use rehype-pretty-code this time.

### Deployment

I used Vercel for deployment. Since Vercel officially supports Next.js, I was able to deploy with zero config.
Vercel is the best!

## Summary

That’s about it for the minimal blog setup.
There are still several features I want to add and parts I want to refine, so I hope I can keep updating it little by little.
I also hope I can leisurely increase the number of articles.
