---
title: "Mounting Cloudflare R2 into macOS Finder"
publishedAt: "2026-07-10"
description: "How I got a Cloudflare R2 bucket to show up in macOS Finder using Rclone's nfsmount, with no macFUSE required."
tags: ["Cloudflare", "R2", "Rclone"]
---

Hi. Everyone's talking about the [GPT‑5.6 release](https://openai.com/ja-JP/index/previewing-gpt-5-6-sol/) these days. I haven't tried it yet (though I am paying for it).


This post is about mounting a Cloudflare R2 bucket as a shared folder with Rclone so I can use it from macOS Finder.

https://x.com/sh1ma/status/2075519775388930305?s=20

## TL;DR

- Combining Rclone with R2, I was able to virtually mount the bucket on my OS.
- Once mounted, I could browse and edit the R2 objects from Finder like any other folder.
- You don't even need macFUSE: `rclone nfsmount` works with macOS's built-in NFS client.
- When you open the mount in Finder, macOS writes `.DS_Store` / `._*` files into the bucket, so it's a good idea to suppress that with `defaults write com.apple.desktopservices DSDontWriteNetworkStores true`.

[Rclone · Cloudflare R2 docs](https://developers.cloudflare.com/r2/examples/rclone/)

## Background (feel free to skip)

I store the images and videos for this blog in a bound [Cloudflare R2](https://developers.cloudflare.com/r2/) bucket, but that has been a friction point when writing posts. Every time I want to embed a piece of media I have to: pull the file down locally, rename it, strip EXIF and other file metadata, and then upload it via Wrangler or the web UI. Enough steps to be annoying.

I used to run my own upload dashboard for image management, but I couldn't keep up with maintaining it and eventually stopped using it.

Since I started posting to the blog again recently, media wrangling has felt like a real problem across the first few posts, so I decided to tackle it with the approach I describe here.

Even though the title says Finder, the same thing should work on Windows and most other OSes.


## What is Rclone?

[Rclone](https://rclone.org/) is a CLI tool — think of it as "rsync for the cloud" — that talks to more than 70 object storage and cloud storage backends (S3, GCS, Azure Blob, Dropbox, Google Drive, and so on) through one consistent interface. Cloudflare R2 is S3-compatible, so all you have to do is pick the `s3` provider in Rclone and set it to `Cloudflare`.

Rclone also happens to ship with `rclone mount`, which lets you mount a remote as a local filesystem.

## How to mount it on macOS

`rclone mount` uses FUSE under the hood, which normally means installing macFUSE. But macFUSE requires a kernel extension (kext) and asks you to weaken System Integrity Protection (SIP) — not something I personally want on my machine.

Instead, I'm going to use `rclone nfsmount`. It spins up an NFS server on localhost inside Rclone and lets macOS's built-in NFS client mount it — no macFUSE, no `sudo`.

## Setup

I did the setup with Claude Code driving.

### 1. Install Rclone

On macOS, install it with Homebrew.

Install instructions for other OSes are here:  
https://rclone.org/install/

```bash
brew install rclone
```

Version check:

```bash
$ rclone version
rclone v1.74.4
- os/version: darwin 26.3.1 (64 bit)
- os/kernel: 25.3.0 (arm64)
```

### 2. Create an R2 API token

Rclone reaches R2 through its S3-compatible API, so you need a dedicated R2 API token. The OAuth token from `wrangler` won't work — keep that in mind.

Create the token from the Cloudflare Dashboard:

![Cloudflare Dashboard token list page](https://cdn.sh1ma.dev/edd2e855-d360-4934-b78d-ea2597a42c3a.png)


1. Open `https://dash.cloudflare.com/<account_id>/r2/api-tokens`
2. Click "Create API token"
3. Set Permissions to `Object Read & Write`, and scope Bucket down to the target bucket (recommended)
4. Note down the **Access Key ID** and **Secret Access Key** shown after creation

![Cloudflare Dashboard screen after the token has been created](https://cdn.sh1ma.dev/fe8a13e7-d5e8-4d67-951c-644ee1201232.png)

The secret is only shown once, so make sure to copy it right away.

### 3. Write the rclone config

You can use the interactive mode (`rclone config`), but since I already knew every value, I just wrote `~/.config/rclone/rclone.conf` by hand.

```ini title="~/.config/rclone/rclone.conf"
[sh1madev-cdn]
type = s3
provider = Cloudflare
access_key_id = <ACCESS_KEY_ID>
secret_access_key = <SECRET_ACCESS_KEY>
region = auto
endpoint = https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

- `[sh1madev-cdn]` is the remote's name (used later in the mount command). Any name is fine.
- You can find `endpoint` on each bucket's "Settings" page in the Cloudflare Dashboard as well.
- `region = auto` is the standard for R2.

Sanity check:

```bash
rclone ls sh1madev-cdn:sh1madev-cdn --max-depth 1 | head
```

If you see a list of objects from the bucket, you're good.

### 4. Create a mount point and mount

```bash
mkdir -p ~/mnt/sh1madev-cdn

rclone nfsmount sh1madev-cdn:sh1madev-cdn ~/mnt/sh1madev-cdn \
  --vfs-cache-mode writes \
  --daemon \
  --log-file=/tmp/rclone-sh1madev-cdn.log \
  --log-level INFO
```

What each option does:

- `--vfs-cache-mode writes`: buffers writes locally before uploading to R2. Without this, most write operations tend to fail — treat it as essentially required.
- `--daemon`: runs Rclone in the background.
- `--log-file` / `--log-level`: writes a log so you can diagnose things when something goes wrong.

Confirm it's mounted:

```bash
$ mount | grep sh1madev-cdn
localhost:/sh1madev-cdn sh1madev-cdn on /Users/sh1ma/mnt/sh1madev-cdn (nfs, nodev, nosuid, mounted by sh1ma)

$ ls ~/mnt/sh1madev-cdn | head
aaa.png
bbb.png
ccc.webp
...
```

Now you can open `~/mnt/sh1madev-cdn` in Finder and browse R2 like a normal folder.

To unmount:

```bash
umount ~/mnt/sh1madev-cdn
```

## Watch out when using Finder: don't let it write `.DS_Store` / `._*` into the bucket

The moment you open the mount in Finder, macOS happily starts writing `.DS_Store` files and AppleDouble resource fork files (`._<filename>`) into the bucket.

In my case, I actually looked inside the bucket and found tracks left over from previous work:

```
8196 .DS_Store
4096 ._.DS_Store
4096 ._128c5211dfc9d313ea1d331c388fb4008425959049fcf191138a056efa1927b9.png
...
```

To suppress this, flip a hidden macOS setting:

```bash
defaults write com.apple.desktopservices DSDontWriteNetworkStores true
killall Finder
```

With this, at least `.DS_Store` will stop being written.

You'll also want to clean up what's already leaked in. Running with `--dry-run` first lets you check the targets safely before deleting.

```bash
# Dry run
rclone delete sh1madev-cdn:sh1madev-cdn --include ".DS_Store" --include "._*" --dry-run

# Once you're happy with the list, drop --dry-run
rclone delete sh1madev-cdn:sh1madev-cdn --include ".DS_Store" --include "._*"
```

## Security notes

- The Access Key ID and Secret Access Key are stored in **plaintext** in `~/.config/rclone/rclone.conf`. If that worries you, `rclone config` also has a `--password` option that encrypts the config itself — consider using it.

## Wrapping up

I got R2 mounted on macOS without installing macFUSE. `rclone nfsmount` is genuinely useful, and now, when I'm writing a post, media handling is as easy as copy-pasting an image in Finder.

If you've been dealing with the same annoyance, give it a try.
