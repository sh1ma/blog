---
  title: "Moving from asdf and direnv to mise"
  publishedAt: "2024-01-08"
---

Until now, I had been using [asdf](https://asdf-vm.com/) to manage runtime versions for things like python and nodejs,
and direnv to manage environment variables per directory,
but recently I found a version management tool called [mise](https://mise.jdx.dev/) that looked pretty good, so I decided to install it.

## Uninstalling asdf and direnv

I had installed them with homebrew, so I uninstalled them with `brew uninstall`.

```bash
brew uninstall asdf direnv
brew autoremove
```

## Installing mise

The steps from [mise Getting Started](https://mise.jdx.dev/getting-started.html) seem to work as-is.

For optional settings and details, the official documentation is more thorough.

```bash
curl https://mise.jdx.dev/install.sh | sh
```

Add the path to `.zshrc`.

```sh
eval "$(~/.local/bin/mise activate zsh)"
export PATH="$HOME/.local/share/mise/shims:$PATH"
```

After restarting the terminal, the `mise` command should be available. Check that it works.

```bash
mise -V
```

Output:

```
2024.1.12 macos-arm64 (3750934 2024-01-07)
```

Looks good.

## Using mise

Let’s try using it right away.

mise has the following two kinds of functionality.

- Runtime version management
- Environment variable management per directory

Both seem useful, so I’ll try them.

### Runtime Version Management

First, install the Node.js 20 series.

```bash
mise use --global node@20
node -v
```

Output:

```
v20.10.0
```

Hmm, nice. I’m happy that it installs automatically if you only specify the major version.  
By the way, when I ran `mise use` in a directory with a `.tool-versions` file, it automatically installed the specified version if it was missing.

## Environment Variable Management per Directory

Next, I’ll try environment variable management per directory.  
Unlike direnv, it seems you create a file called `.mise.toml` instead of `.envrc`. (There are also methods/settings for using .envrc, but I’ll omit them.)

Enter an appropriate directory and create `.mise.toml`.

```toml
[env]
HELLO = "WORLD"
```

To enable it, it seems you need to run `mise trust`, similar to `direnv allow` in `direnv`.

```bash
mise trust
```

Output:

```
mise trusted /Users/sh1ma/tmp/.mise.toml
```

You can display environment variables with `mise env`.

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

## Summary

I wasn’t dissatisfied with asdf and direnv, but it feels cleaner to have consolidated two tools into one.  
Oh, I need to remember to add `.mise.toml` to the `.gitignore` in my home directory.
