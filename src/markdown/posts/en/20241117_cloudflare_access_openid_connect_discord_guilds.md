---
title: Restricting a Website to Members of a Discord Server with Cloudflare Access
publishedAt: "2024-11-17"
---

I set up [stable-diffusion-webui](https://github.com/AUTOMATIC1111/stable-diffusion-webui) on my home server. Keeping it to myself felt like a waste, but exposing it to the whole internet was a bit scary, so I made it accessible only to members of a private Discord server I'm in. Here's how I did it.

## The Rough Idea

(If the summary below already makes sense to you, you can probably skip the rest of the article.)

Build an OpenID Connect auth server on Cloudflare Workers backed by Discord OAuth, then register it as an identity provider in Cloudflare Zero Trust. Cloudflare Access then inspects the claims returned for each authenticated user and decides whether they belong to the Discord server.

## Walkthrough

### Prerequisites

- A Cloudflare account
- wrangler (Cloudflare's CLI) set up. [The official site has setup instructions.](https://developers.cloudflare.com/workers/get-started/guide/)

### 1. Create an app in the Discord Developer Portal

Head to the [Discord Developer Portal](https://discord.com/developers/applications) and create an Application to use for authentication. On the "OAuth2" page, note the "Client ID" and "Client Secret" listed under "Client information".

### 2. Build the auth server on Cloudflare Workers

You could write one from scratch, but someone has already published a solid implementation, so we'll use that.

[Erisa/discord-oidc-worker: Sign into Discord on Cloudflare Access, powered by Cloudflare Workers!](https://github.com/Erisa/discord-oidc-worker)

First, clone the repository.

```sh
git clone https://github.com/Erisa/discord-oidc-worker
```

Now set up `discord-oidc-worker`.  
Setup is documented in the GitHub README, but I'll walk through it here too.

Install dependencies with npm.

```sh
cd discord-oidc-worker
npm install
```

Next, provision a [Cloudflare Workers KV](https://developers.cloudflare.com/kv/) namespace. You can do this either with wrangler or by clicking through Cloudflare's web console. wrangler is easier, so that's what I'll cover.

Create the KV namespace with the following command. It's used to store the [JSON Web Key (JWK)](https://openid-foundation-japan.github.io/rfc7517.ja.html).

If your wrangler version is 3.60.0 or higher, read `kv:namespace` as `kv namespace`.

```sh
npx wrangler kv:namespace create "discord_oidc_keys"
```

On success, you should see output like the following.

```
🌀 Creating namespace with title "worker-discord_oidc_keys"
✨ Success!
Add the following to your configuration file in your kv_namespaces array:
{ binding = "discord_oidc_keys", id = "..." }
```

Change the `binding` field in `{ binding = "discord_oidc_keys", ...}` from `discord_oidc_keys` to `KV` and paste it into wrangler.toml.  
wrangler.toml should end up looking like this:

```toml
name = "discord-oidc"
main = "worker.js"
compatibility_date = "2022-12-24"

kv_namespaces = [
  { binding = "KV", id = "..." },
]
```

Next, create config.json from config.sample.json.

```sh
cp config.sample.json config.json
```

Edit config.json, using the client ID and client secret you noted in step 1. It should look like this:

```json
{
  "clientId": "YOUR_DISCORD_CLIENT_ID",
  "clientSecret": "YOUR_DISCORD_CLIENT_SECRET",
  "redirectURL": "https://YOUR_CLOUDFLARE_USER_NAME.cloudflareaccess.com/cdn-cgi/access/callback",
  "serversToCheckRolesFor": ["YOUR_DISCORD_SERVER_ID"]
}
```

- Replace `YOUR_DISCORD_CLIENT_ID` with your actual Discord client ID
- Replace `YOUR_DISCORD_CLIENT_SECRET` with your actual Discord client secret
- Replace `YOUR_CLOUDFLARE_USER_NAME` with your actual Cloudflare username
- Replace `YOUR_DISCORD_SERVER_ID` with the ID of the Discord server whose members should be able to access the site (you can list multiple)

Finally, deploy it.

```sh
npx wrangler publish
```

On newer versions of wrangler, use this instead:

```sh
npx wrangler deploy
```

### 3. Configure Cloudflare Zero Trust

Register the Worker you just deployed as an identity provider in Cloudflare Zero Trust.

Go to "Settings" > "Authentication", then in the "Login Methods" section click "Add New" to open the "Add OpenID Connect" page.

![Login Methods section. "Add New" is in the upper right](https://cdn.sh1ma.dev/e7593de96bfacde6ff31f37b754d1a3a798e4487259c50ca3fc4a8a3e3d5b6c8.png)

![Form on the Add OpenID Connect page](https://cdn.sh1ma.dev/cb3a61f1c721045dcf8c76ed4d8cf859496be2d7ca6a07e91c63f516973874ac.png)

Fill in the form as follows:

- Name: whatever you like
- App ID: your Discord Client ID
- Client secret: your Discord Client secret
- Auth URL: `https://discord-oidc.YOUR_CLOUDFLARE_USER_NAME.workers.dev/authorize/guilds`
- Token URL: `https://discord-oidc.YOUR_CLOUDFLARE_USER_NAME.workers.dev/token`
- Certificate URL: `https://discord-oidc.YOUR_CLOUDFLARE_USER_NAME.workers.dev/jwks.json`
- Proof Key for Code Exchange (PKCE): on
- Email claim: leave empty

Set OIDC Claims to the following:

- id
- username
- discriminator
- guilds

![OIDC Claims configuration example](https://cdn.sh1ma.dev/7d03223d6f859dfcb3b1d89d71c735c18a88e9a75a7bd3d40ba5b1018b0a4ece.png)

Once everything is filled in, click "Test" to give it a try. If it looks good, click "Save".

### 4. Configure Cloudflare Access

Now hook that identity provider up to Cloudflare Access.  
Open the Cloudflare Access page and click "Add an application" to create a new app.

![Cloudflare Access settings page. The "Add an application" button is in the center](https://cdn.sh1ma.dev/28a085caedc57bf6b75fd879a130773a66da4d201af43c8841f1984ecadfc6b4.png)

Select "Self Hosted".

![Add an application page. Self Hosted is on the far right](https://cdn.sh1ma.dev/85ef9dea3e66b4d0245c3f132baf1073500f817b14d657bd11fa43f009188a03.png)

Under Application Configuration, set the domain of the app you want to protect.

- Session Duration controls how long a session stays valid.

For Identity Providers, select only OpenID Connect.

![Identity Providers configuration. Only OpenID Connect is selected](https://cdn.sh1ma.dev/665058db0746c05deaffc0a738d50846403730c31656b3537a1f69348de830a4.png)

Click "Next" to move on to Policies.

Configure Rules.

Add the following under Include:

- Select OIDC Claims
- Enter `guilds` for "Claim name"
- Enter your Discord server ID for "Claim value"

![Configure Rules](https://cdn.sh1ma.dev/a5c3d3707f376737b69927383efe607f4103c7de4351f447b4cd887850de1000.png)

Click "Save Policy" and you're done. Visit the protected domain, and if you see a page like the one below, it's working. Try logging in to confirm.

![Screenshot of the target domain. A login prompt is shown in the center](https://cdn.sh1ma.dev/6be3fe282e3223637453d12f4c0b002fd0d3cca0cc2d14a2ea2354782d1ed578.png)

## Wrap-up

It came together more easily than I expected. discord-oidc-worker can also authenticate against individual users rather than just servers, so I may end up using that mode at some point too.
