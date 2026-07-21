---
title: "Encrypting environment variables with mise + age"
publishedAt: "2026-07-06"
description: "Notes on trying out mise's experimental age-based encryption for environment variables. In practice, using an SSH public key as the recipient is easier than managing an x25519 key file."
tags: ["mise", "age", "Security"]
---

Hi. My [previous post](https://blog.sh1ma.dev/20260705_k3s_on_cloudflare_workers.md) was written mostly by AI, but I want to write this one carefully by hand.

I'm a longtime `mise` user, and this time I tried out the `age`-based environment variable encryption that ships with it.
The post starts with the setup, then covers things to watch out for in practice and a few recommendations.
The [official docs](https://mise.jdx.dev/environments/secrets/age.html) have the most up-to-date setup instructions, so you may want to read them alongside this post.

https://x.com/sh1ma/status/2073800662387950078?s=20

> Embarrassingly, I've been neglecting to manage project secrets properly for a long time…
>
> I finally got around to looking into it, and since I use mise, going with `age` — which is officially supported — turned out to be simple and nice.
>
> https://mise.jdx.dev/environments/secrets/age.html

## TL;DR

- I stopped writing environment variables to `mise.toml` and `.env` in plaintext and set up `age`-based encryption, which `mise` supports out of the box.
- No dependencies other than `age` are needed, and I can now manage environment variables securely without losing the `mise` experience I'm used to.
- **Do not run `age-keygen -o ~/.config/mise/age.txt` from the official setup instructions.**
- → Use an SSH key for encryption instead.

## Why encrypt environment variables?

**Short answer: because plaintext credentials can be stolen.**

With malware and spyware everywhere these days, keeping credentials or secrets in plaintext inside a project's `.env` file is risky: if your machine is compromised, an attacker can exfiltrate them.
There are even cases where simply running `npm install` is enough to steal secrets. This is not someone else's problem — it affects every developer.

Some recent examples:

- [April 2026 — fake tanstack packages published to npm that exfiltrated `.env` files from `postinstall`](https://socket.dev/blog/tanstack-brandsquat-compromise)
- [May 2026 — node-ipc@9.1.6, 9.2.3, and 12.0.1 shipped a backdoor that sent secrets to a remote endpoint](https://securitylabs.datadoghq.com/articles/node-ipc-npm-malware-analysis/)

Ideally the secret files are never stolen in the first place, and tools like [Takumi Guard](https://flatt.tech/takumi/features/guard) from the Japanese security company [GMO Flatt Security](https://flatt.tech/) can prevent some of these attacks. But no tool can block 100% of them.
That's why encrypting secrets — "even if they get stolen, they can't be read" — is worth doing whether you're an individual or part of an organization.

## Choosing an encryption tool

Despite the background above, I hadn't actually set up any encryption until now.
Part of it was that picking a tool sounded like a hassle, but more importantly I didn't want to lose the experience of managing environment variables through `mise` that I'd already gotten used to.

I considered [dotenvx](https://dotenvx.com/) and [encryption with gpg](https://techblog.ap-com.co.jp/entry/2023/10/23/173344) as well, but in the end I picked `mise` + `age` because it avoided any extra tooling and didn't require thinking about anything complicated.

### Aside: setting environment variables with mise

For an intro to `mise`, see my [earlier post — Migrating from asdf and direnv to mise](https://blog.sh1ma.dev/articles/20240108_from_asdf_to_mise). The short version: you drop a `mise.toml` file inside your project, list your environment variables in it, and those variables are loaded whenever you're inside that directory.

```toml title="mise.toml"
[env]
DB_HOST = "localhost:3306"
DB_PASSWORD = "abcde1234"
# You can also load a .env file
_.file = ".env"
```

## Trying it out

This assumes `mise` is already installed.
There are two steps.

### 1. Enable experimental features

`age`-based encryption is currently experimental, so you need to enable experimental features first:

```bash
mise settings set experimental=true
```

### 2. Point `MISE_AGE_SSH_IDENTITY_FILES` at your SSH key

The [Quick Start in the official docs](https://mise.jdx.dev/environments/secrets/age.html#quick-start) generates a key pair as an (Optional) step. **Do not do that.**
It has security implications, which I'll cover below.

Instead of generating a new key, use an SSH key. The SSH key **must** have a passphrase. Without a passphrase, the security posture is the same as step 2 in the official docs.

It looks like you can register either the public or the private key, but it needs to be passed as an array.

```bash title="~/.zshrc"
export MISE_AGE_SSH_IDENTITY_FILES=($HOME/.ssh/id_ed25519) # $HOME/.ssh/id_ed25519.pub may also work (untested)
```

### Test it

Once that's done, you can encrypt and decrypt values using your SSH key.

Run the following in any directory and enter a value to store (the input is not echoed):

```bash title="Command to store an encrypted environment variable"
mise set --age-encrypt --prompt DB_PASSWORD
```

The environment variable is stored, encrypted, in that directory's `mise.toml`, like so:

```toml title="mise.toml"
[env]
DB_PASSWORD = { age = "Encrypted_Value_AAAAAAAAAAAAAA1234567890" }
```

Inside the directory, you can confirm that the decrypted value is loaded:

```bash
echo $DB_PASSWORD # → e.g. password1234
```

If the value you registered above is printed, the setup is working.

## Practices for keeping this safe

### Don't use a key generated by `age-keygen` as the docs suggest — use a passphrase-protected SSH key instead

**TL;DR: if an attacker can steal the `age-keygen`-generated private key, encrypting `mise.toml` no longer buys you anything.**

`age-keygen` creates a key pair (a private key for decryption and a public key for encryption), but it has no option to set a passphrase. If you follow the official docs and run `age-keygen`, the raw private key ends up in `~/.config/mise/age.txt`.

You went through the trouble of encrypting the values in `mise.toml`, but if an attacker can simply grab `~/.config/mise/age.txt` and decrypt them, that's almost pointless. So the private key shouldn't sit in plaintext anywhere, in any directory.

The same applies to the SSH key: if it has no passphrase, encryption is meaningless — an attacker who steals the SSH private key can decrypt everything just like they could with `age`'s own key.

If your SSH key does have a passphrase, then even if an attacker steals the private key, they can't actually use it until they break the passphrase. That's what keeps the contents of `mise.toml` protected.

#### Aside: `age` itself does support passphrase-protected keys

[Strictly speaking, `age` does support passphrase-protected key files](https://github.com/filosottile/age#passphrase-protected-key-files), but it can't integrate with your OS's secret store (covered below), so using an SSH key is the better choice either way.

https://x.com/sh1ma/status/2073952805287825555

> About mise's `age` encryption for secrets: the docs show a setup where you drop `age.txt` (the private key) into your home directory, as in the image — but you should absolutely not do that.
> Use SSH Key recipients instead (i.e. use your SSH private key as the decryption key).

#### 2026-07-21 update: a note on reusing a signing SSH key for encryption

Adding this section based on feedback from [@haruyama](https://x.com/haruyama/status/2074296776295887031) ([and follow-up](https://x.com/haruyama/status/2074448338519568753)).

This post recommends reusing your SSH key as an `age` recipient, but there is a broader question worth being aware of: is it actually OK to use a key intended for signing to also perform encryption?

- `age`'s author, Filippo Valsorda, has himself acknowledged in [FiloSottile/age#540](https://github.com/FiloSottile/age/discussions/540) that "Key reuse across signatures and encryption is indeed not safe and requires analysis." He says he did perform an analysis when designing `age`, but has not published those notes. He also notes that the papers he cites "don't apply 1:1" to how `age` uses HKDF. In other words, **there is no publicly available proof that reuse is safe**; it's essentially "trust me, I looked at it."
- Elsewhere in that discussion, another participant (cipriancraciun) argues that RSA-OAEP padding and a domain separation label (`age-encryption.org/v1/ssh-rsa`) prevent cross-protocol interactions. That's a reasonable argument, but it comes from a community member, not from the author.
- Filippo's own article, [Using Ed25519 signing keys for encryption](https://words.filippo.io/using-ed25519-keys-for-encryption/), explains that Ed25519 keys can be mathematically converted to X25519 keys. That shows reuse is *implementable*; it does not by itself guarantee that reuse is safe in practice.
- Given all of the above, some people take the more cautious position that signing keys and encryption keys should be kept separate as a matter of principle, and consider SSH-key reuse for `age` "not sufficiently vetted" (see [@haruyama's posts](https://x.com/haruyama/status/2074296776295887031) [again](https://x.com/haruyama/status/2074448338519568753)).

No concrete attack against this reuse is known at the moment, but there is also no explicit guarantee of safety. If you want strict separation between signing and encryption keys, one option is to generate a dedicated `age` key pair (ideally passphrase-protected) instead.

### When using a passphrase-protected SSH key, register the passphrase in a secret store like Keychain

Being prompted for the passphrase every time you decrypt is a pain.
By storing the passphrase in a secret store like Keychain, you can keep it safe and skip typing it every time.

On macOS, you can save the passphrase to Keychain with:

```bash
/usr/bin/ssh-add --apple-use-keychain ~/.ssh/id_ed25519 # or another private key
```


## Wrap-up

That's a run-through of encrypting environment variables with `mise` + `age`.
If nothing else, I hope the "use an SSH key" part comes through!
