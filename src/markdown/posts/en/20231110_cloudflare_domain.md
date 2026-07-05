---
  title: "Pointing a Cloudflare-Managed Domain at Vercel Causes a Redirect Loop"
  publishedAt: "2023-11-10"
---

I ran into trouble when I tried to point `blog.sh1ma.dev`, a subdomain of `sh1ma.dev` (managed by Cloudflare), at my blog deployed on Vercel.  
Specifically, the browser bounced through too many redirects and the forwarding never resolved, so here's how I fixed it.

## TL;DR

The answer was right there in the [ERR_TOO_MANY_REDIRECTS · Cloudflare SSL/TLS docs](https://developers.cloudflare.com/ssl/troubleshooting/too-many-redirects/).

> After you add a new domain to Cloudflare, your visitors’ browsers might display ERR_TOO_MANY_REDIRECTS or The page isn’t redirecting properly errors.
> This error occurs when visitors get stuck in a redirect loop.

The docs list three possible causes:

- > A misconfiguration of your SSL/TLS Encryption mode.
- > Various settings in SSL/TLS > Edge Certificates.
- > A misconfigured redirect rule.

In my case it was the first one: the encryption mode was misconfigured.

Go to the Cloudflare dashboard, open "SSL/TLS" → "Overview", and set the SSL/TLS encryption mode to `Full` as shown below. That fixed it.
![Screenshot of the Cloudflare dashboard](https://cdn.sh1ma.dev/20231110.png)
