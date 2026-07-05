---
  title: "A Redirect Loop Occurs When Using a Domain Managed by Cloudflare on Vercel"
  publishedAt: "2023-11-10"
---

I got stuck when trying to connect my blog deployed on Vercel to `blog.sh1ma.dev`, a subdomain of `sh1ma.dev` managed by cloudflare.  
Specifically, a large number of redirects occurred and the forwarding setup did not work properly, so I’ll write down how I solved it.

## Conclusion

The answer was written in [ERR_TOO_MANY_REDIRECTS · Cloudflare SSL/TLS docs](https://developers.cloudflare.com/ssl/troubleshooting/too-many-redirects/).

> After you add a new domain to Cloudflare, your visitors’ browsers might display ERR_TOO_MANY_REDIRECTS or The page isn’t redirecting properly errors.
> This error occurs when visitors get stuck in a redirect loop.

It also says this error can be caused by the following three things.

- > A misconfiguration of your SSL/TLS Encryption mode. (A misconfiguration of the SSL/TLS encryption mode)
- > Various settings in SSL/TLS > Edge Certificates. (Settings in SSL/TLS > Edge Certificates)
- > A misconfigured redirect rule. (A misconfigured redirect rule)

In my case, it was the first one: a problem with the encryption mode.

Go to the Cloudflare dashboard, then the “SSL/TLS” page -> the “overview” page,
and set SSL/TLS encryption mode to `Full` as shown in the image below. That fixed it.
![Screenshot of the Cloudflare dashboard](https://cdn.sh1ma.dev/20231110.png)
