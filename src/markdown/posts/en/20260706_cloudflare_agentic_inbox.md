---
title: "Running a Custom-Domain Email Client on Cloudflare"
publishedAt: "2026-07-06"
priority: 2
description: "A hands-on report on standing up a self-hosted, custom-domain email client on Cloudflare Workers using Cloudflare's official agentic-inbox OSS project."
tags: ["Cloudflare", "Workers", "Email Routing", "OSS"]
---

I hand-wrote this article too. (The English version is translated by Claude Code — please bear with me.)

I've wanted to run mail on my own domain for a while, but dealing with [DMARC](https://dmarc.org/resources/specification/), [DKIM](https://datatracker.ietf.org/doc/html/rfc6376) and friends looked painful, and I couldn't picture myself keeping it running reliably. So I kept putting it off.

Today, while idly scrolling GitHub, I noticed that [yusukebe](https://github.com/yusukebe) — the author of [Hono](https://hono.dev/) and a Cloudflare engineer — had starred a repository called [agentic-inbox](https://github.com/cloudflare/agentic-inbox), and it showed up in my feed.

Judging from the repo description, this thing seems to handle both sending and receiving mail.

>  A self-hosted email client with an AI agent, running entirely on Cloudflare Workers

https://github.com/cloudflare/agentic-inbox

My first thought was, "wait, doesn't Cloudflare only support _receiving_ mail via [Email Routing](https://developers.cloudflare.com/email-service/configuration/email-routing-addresses/)?" But when I looked into it, [Cloudflare had been running a private beta since September 2025](https://blog.cloudflare.com/email-service/), and [it just went public beta in July 2026](https://blog.cloudflare.com/email-for-agents/). Nice timing.

The [official Send Emails docs](https://developers.cloudflare.com/email-service/get-started/send-emails/) actually seem to have been around since roughly April 2026.

I was already using Email Routing to receive mail on my own domain, but I'd always wanted to send too, and this looked genuinely fun — so I decided to set it up. This article is that writeup.

https://x.com/sh1ma/status/2073997367980982449?s=20



**Heads-up: _apparently you need a Workers Paid Plan to use this._**

## TL;DR

- Cloudflare's official [agentic-inbox](https://github.com/cloudflare/agentic-inbox) lets you host a full web-based email client on Cloudflare Workers that can send and receive mail on your own domain.
- Receiving uses Email Routing, sending uses Email Service, mailboxes live in a Durable Object (SQLite), attachments go to R2, and auth is handled by Cloudflare Access. Full Cloudflare stack.
- The "Deploy to Cloudflare" button does one-click deploy, but **you have to remember to set up the Email Routing catch-all and configure the Cloudflare Access secrets afterwards, or nothing works.** (I ended up cloning the repo and letting Claude Code drive the deploy.)
- It also integrates with [Workers AI](https://developers.cloudflare.com/workers-ai/) — apparently it can draft polite replies to incoming mail for you.

## What is agentic-inbox?

The official Cloudflare blog post explains it well, so I'd read that too.

https://blog.cloudflare.com/email-for-agents/

[cloudflare/agentic-inbox](https://github.com/cloudflare/agentic-inbox) is a self-hosted email client published by Cloudflare. The entire stack is built out of Cloudflare services.

https://github.com/cloudflare/agentic-inbox

### Highlights

- Receiving is handled by [Email Routing](https://developers.cloudflare.com/email-routing/), and sending is done via the `send_email` binding of [Email Service](https://developers.cloudflare.com/email-service/).
- Each mailbox gets its own [Durable Object](https://developers.cloudflare.com/durable-objects/) + SQLite, and attachments are stored in [R2](https://developers.cloudflare.com/r2/).
- With the [Cloudflare Agents SDK](https://developers.cloudflare.com/agents/) + [Workers AI (`@cf/moonshotai/kimi-k2.5`)](https://developers.cloudflare.com/workers-ai/models/kimi-k2.5/), it apparently reads incoming mail and drafts replies for you.
- In production, Cloudflare Access is required. If you don't configure Access Controls, even you can't reach the app.

Reading the [Email for Agents](https://blog.cloudflare.com/email-for-agents/) post from the Cloudflare blog alongside the repo makes it clearer why the stack is put together this way.


## Setup

Just follow the README — I'll keep this brief.

### 1. Deploy with "Deploy to Cloudflare"

Hitting the "[Deploy to Cloudflare](https://github.com/cloudflare/agentic-inbox#to-set-up)" button in the README will get Cloudflare to provision the R2 bucket, Durable Object, and Workers AI for you. Along the way it asks for `DOMAINS` (the domains you want to receive mail on) — fill that in.

At this point the Worker itself is up, but you can't receive mail yet. You still need the following.

### 2. Point the Email Routing catch-all at the Worker

In the Cloudflare dashboard, open _Email Routing_ for the target domain and set the _catch-all_ rule to forward to the agentic-inbox Worker. Without this, incoming mail never reaches the Worker.

### 3. Enable Email Service

Head to the _Email Sending_ settings page in the Cloudflare dashboard and pick the zone you want to send mail from.
I happened to have [soysoysoysoy.soy](https://soysoysoysoy.soy) lying around, so I used that.

![Screenshot of the Email Sending page in the Cloudflare dashboard](https://cdn.sh1ma.dev/50d86893-d8e4-4111-b126-1fc5623c11e2.png)

### 4. Configure Cloudflare Access

Access is mandatory in production. If you skip this, the Worker will yell at you with `Cloudflare Access must be configured in production`.

As shown in the screenshot, go to the agentic-inbox Worker in the dashboard, open `Settings → Domains`, and change the _Worker URL_'s Production URL visibility from _Public_ to _Restricted_. A modal like the one below pops up.

![Screenshot of a modal showing Audience (aud) and JWKs URL](https://cdn.sh1ma.dev/720346bc-bb40-44df-bc95-28ad77602751.png)



The values in the modal map to environment variables you'll need to set:

- Audience (aud) → `POLICY_AUD`
- JWKs URL → `TEAM_DOMAIN`

Set these as Worker secrets:

```bash
# Each command drops into a prompt — paste the value and press Enter.
wrangler secret put POLICY_AUD 
wrangler secret put TEAM_DOMAIN 
```


### 5. Create a mailbox

Open the deployed web UI (the Production URL from earlier) and create a mailbox with an address like `hello@yourdomain.com`. Only after this can you actually send and receive mail.

![Home screen of the deployed agentic-inbox with no mailboxes yet, showing "No mailboxes yet"](https://cdn.sh1ma.dev/c58acad7-3008-41b8-addc-25f551cebed4.png)

![Screen after creating a mailbox, with one entry in the mailbox list](https://cdn.sh1ma.dev/a075804a-64f4-4c90-baa7-6f1c79c8d96b.png)


Once everything above is in place, sending and receiving works.

You can see me actually sending a mail in the tweet below ↓

https://x.com/sh1ma/status/2074068714899829193?s=20

## Wrap-up

If you want to send and receive mail on your own domain, options like Zoho or Google Workspace exist, but they all cost money, which has always been a sticking point for me.

With this, it all fits inside my existing Workers Paid plan, which makes me pretty happy!

If any of this sounds interesting, try building your own custom-domain mail client on Cloudflare.
(I'd also love to try the AI features… I just don't have anyone to email.)
