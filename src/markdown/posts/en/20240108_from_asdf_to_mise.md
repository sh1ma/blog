---
title: "Moving from asdf and direnv to mise"
publishedAt: "2024-01-08"
---

I've been using [asdf](https://asdf-vm.com/) to manage runtime versions for things like Python and Node.js, and direnv to manage per-directory environment variables. Recently I ran across a version manager called [mise](https://mise.jdx.dev/) that looks promising, so I decided to give it a try.

## Uninstalling asdf and direnv

I installed both with Homebrew, so I removed them with `brew uninstall`.

```bash
brew uninstall asdf direnv
brew autoremove
```

## Installing mise

The [mise Getting Started](https://mise.jdx.dev/getting-started.html) steps work as-is.

For optional configuration and the fine print, the official docs are the better reference.

```bash
curl https://mise.jdx.dev/install.sh | sh
```

Then add mise to your PATH in `.zshrc`:

```sh
eval "$(~/.local/bin/mise activate zsh)"
export PATH="$HOME/.local/share/mise/shims:$PATH"
```

After restarting the terminal, `mise` should be on your PATH. Check that it works:

```bash
mise -V
```

Output:

```
2024.1.12 macos-arm64 (3750934 2024-01-07)
```

Nice.

## Using mise

Let's take it for a spin.

mise has two main features:

- Runtime version management
- Per-directory environment variables

Both sound useful, so I'll try each one.

### Runtime version management

First, install the Node.js 20 line.

```bash
mise use --global node@20
node -v
```

Output:

```
v20.10.0
```

Nice — I like that specifying just the major version is enough for it to install automatically.  
As a bonus, when I ran `mise use` in a directory that already had a `.tool-versions` file, it auto-installed the versions listed there if they weren't present.

## Per-directory environment variables

Next up, per-directory env vars.  
Unlike direnv, you create a `.mise.toml` file instead of `.envrc`. (There's also a way to use `.envrc`, but I'll skip that here.)

Move into a scratch directory and create a `.mise.toml`:

```toml
[env]
HELLO = "WORLD"
```

To activate it, you need to run `mise trust`, similar to `direnv allow`.

```bash
mise trust
```

Output:

```
mise trusted /Users/sh1ma/tmp/.mise.toml
```

You can print the environment variables with `mise env`:

```bash
mise env | grep HELLO
```

Output:

```
export HELLO=WORLD
```

```bash
echo $HELLO
```

Output:

```
WORLD
```

Looks good.

## Wrap-up

I wasn't unhappy with asdf and direnv, but collapsing two tools into one does feel tidier.  
Oh — I need to remember to add `.mise.toml` to the `.gitignore` in my home directory.
