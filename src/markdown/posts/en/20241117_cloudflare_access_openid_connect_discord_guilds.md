---
title: Publishing a Website Only to People in a Discord Server Using Cloudflare Access
publishedAt: "2024-11-17"
---

I set up [stable-diffusion-webui](https://github.com/AUTOMATIC1111/stable-diffusion-webui) on my home server. I thought it would be a waste if only I used it, but I was scared to publish it to the whole world... so I made it accessible only to people who are in my private Discord server. This time I’ll introduce the steps.

## Roughly What We’ll Do

(If you see the following and think “I get it!”, you may not need to read the rest of the article.)

Using Cloudflare Workers + Discord OAuth, build an authentication server that can be used for OpenID Connect, then register it as an authentication provider in Cloudflare Zero Trust. Check the Claims of users authenticated by Cloudflare Access and determine whether they are in the Discord server.

## Main Text

### Prerequisites

- You have registered with Cloudflare
- You have set up wrangler (cloudflare’s cli). [The official site explains how to set it up.](https://developers.cloudflare.com/workers/get-started/guide/)

### 1. Create an App in Discord Developer Portal

First, access the [Discord　Developer Portal](https://discord.com/developers/applications) and create an Application to use for authentication. Make a note of the “Client ID” and “Client Secret” under “Client information” on the “OAuth2” page.

### 2. Build an Authentication Server with Cloudflare Workers

You can build it yourself, but someone has already published the following implementation, so we’ll use it.

[Erisa/discord-oidc-worker: Sign into Discord on Cloudflare Access, powered by Cloudflare Workers!](https://github.com/Erisa/discord-oidc-worker)

First, download the repository using `git clone` or similar.

```sh
git clone https://github.com/Erisa/discord-oidc-worker
```

Set up `discord-oidc-worker`.  
The setup method is written in the Github README, but I’ll explain it here too.

First, use npm to download dependencies.

```sh
cd discord-oidc-worker
npm install
```

Prepare [Cloudflare Workers KV](https://developers.cloudflare.com/kv/). There are two setup methods: using wrangler and clicking around in Cloudflare’s web console. wrangler is easier, so I’ll introduce that.

Create a cloudflare workers KV with the following command. This KV is used to store [JSON Web Key (JWK)](https://openid-foundation-japan.github.io/rfc7517.ja.html).

If your wrangler version is 3.60.0 or higher, read `kv:namespace` as `kv namespace`.

```sh
npx wrangler kv:namespace create "discord_oidc_keys"
```

If it succeeds, I think output like the following will appear.

```
🌀 Creating namespace with title "worker-discord_oidc_keys"
✨ Success!
Add the following to your configuration file in your kv_namespaces array:
{ binding = "discord_oidc_keys", id = "..." }
```

Change the `binding` in `{ binding = "discord_oidc_keys", ...}` to `KV` and copy-paste it into wrangler.toml.  
wrangler.toml will look like the following.

```toml
name = "discord-oidc"
main = "worker.js"
compatibility_date = "2022-12-24"

kv_namespaces = [
  { binding = "KV", id = "..." },
]
```

Next, create config.json based on config.sample.json.

```sh
cp config.sample.json config.json
```

Edit config.json. Use the client id and client secret you noted in step 1. Rewrite it as follows.

```json
{
  "clientId": "YOUR_DISCORD_CLIENT_ID",
  "clientSecret": "YOUR_DISCORD_CLIENT_SECRET",
  "redirectURL": "https://YOUR_CLOUDFLARE_USER_NAME.cloudflareaccess.com/cdn-cgi/access/callback",
  "serversToCheckRolesFor": ["YOUR_DISCORD_SERVER_ID"]
}
```

- Replace `YOUR_DISCORD_CLIENT_ID` with the actual discord client id
- Replace `YOUR_DISCORD_CLIENT_SECRET` with the actual discord client secret
- Replace `YOUR_CLOUDFLARE_USER_NAME` with the actual cloudflare username
- Replace `YOUR_DISCORD_SERVER_ID` with the Discord server that contains users who can access the web site (you can register multiple)

Finally, deploy it.

```sh
npx wrangler publish
```

If your wrangler version is new, run the following.

```sh
npx wrangler deploy
```

### 3. Configure Cloudflare Zero Trust

Register the Cloudflare Workers you just set up as an authentication provider in Cloudflare Zero Trust.

Go to “Authentication” under “Settings”, click “Add New” in the “Login Methods” section, and move to the “Add OpenID Connect” page.

![Login Methods section. There is “Add New” in the upper right](https://cdn.sh1ma.dev/e7593de96bfacde6ff31f37b754d1a3a798e4487259c50ca3fc4a8a3e3d5b6c8.png)

![Form on the Add OpenID Connect page](https://cdn.sh1ma.dev/cb3a61f1c721045dcf8c76ed4d8cf859496be2d7ca6a07e91c63f516973874ac.png)

Fill in the form items as follows.

- Name: Anything. Set whatever name you like
- App ID: Discord Client ID
- Client secret: Discord Client secret
- Auth URL: `https://discord-oidc.YOUR_CLOUDFLARE_USER_NAME.workers.dev/authorize/guilds`
- Token URL: `https://discord-oidc.YOUR_CLOUDFLARE_USER_NAME.workers.dev/token`
- Certificate URL: `https://discord-oidc.YOUR_CLOUDFLARE_USER_NAME.workers.dev/jwks.json`
- Proof Key for Code Exchange (PKCE): Turn on
- Email claim: No input required

Configure OIDC Claims as follows.

- id
- username
- discriminator
- guilds

![OIDC Claims configuration example](https://cdn.sh1ma.dev/7d03223d6f859dfcb3b1d89d71c735c18a88e9a75a7bd3d40ba5b1018b0a4ece.png)

After filling in the above, it is good to press “Test” and actually try it. If it looks good, press “Save” and save it.

### 4. Configure Cloudflare Access

Configure Cloudflare Access to use the authentication created in step 3.  
Go to the Cloudflare Access page and create an app with the “Add an application” button.

![Cloudflare Access settings page. There is an “Add an apllication” button in the center](https://cdn.sh1ma.dev/28a085caedc57bf6b75fd879a130773a66da4d201af43c8841f1984ecadfc6b4.png)

Select “Self Hosted”.

![Add an application page. Self Hosted is on the far right](https://cdn.sh1ma.dev/85ef9dea3e66b4d0245c3f132baf1073500f817b14d657bd11fa43f009188a03.png)

In Application Configuration, set the domain of the app whose access you want to restrict.

- Session Duration sets the period for which the session is valid

Set Identity Providers to only OpenID Connect.

![Identity Providers configuration. Only OpenID Connect is configured](https://cdn.sh1ma.dev/665058db0746c05deaffc0a738d50846403730c31656b3537a1f69348de830a4.png)

Press “Next” and proceed to Policies configuration.

Configure Rules.

Add the following to Include:

- Select OIDC Claims
- Enter “guilds” in “Claim name”
- Enter the Discord server ID in “Claim value”

![Configure Rules](https://cdn.sh1ma.dev/a5c3d3707f376737b69927383efe607f4103c7de4351f447b4cd887850de1000.png)

Press “Save Policy” to save, and the setup is complete. If you go to the target domain and see a screen like the following, it was successful. Try logging in and checking the behavior.

![Screenshot when accessing the target domain. A form prompting login appears in the center](https://cdn.sh1ma.dev/6be3fe282e3223637453d12f4c0b002fd0d3cca0cc2d14a2ea2354782d1ed578.png)

## Summary

I’m glad it was easier than I expected. discord-oidc-worker can authenticate not only by server but also by the user themselves, so I may use that too at some point.
