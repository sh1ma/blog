---
  title: "Enabling Word-wise Cursor Movement in iTerm2 with Option + Arrow Keys"
  publishedAt: "2024-01-28"
---

I've been using iTerm2 for years without ever bothering to set up word-wise movement.  
I finally got tired of that and decided to bind `Option + <arrow key>` to move by word.

## How to Configure It

There are two ways to do this: change the "Global Keymap", or configure it per iTerm2 profile.  
I left the global keymap alone and only changed iTerm2's default profile. The steps below cover just the default profile.

### 1. Open Settings, go to the Keys tab, and select Key Mappings.

![Screenshot of the Key Mappings tab in iTerm2](https://cdn.sh1ma.dev/20240128-1.png)

You should see something like this.

### 2. Click the "+" button at the bottom to add a new key mapping.

![Screenshot of assigning a shortcut for Option + → from the Key Mappings tab](https://cdn.sh1ma.dev/20240128-2.png)

Click the "Keyboard Shortcut" field; it will wait for input, so press `Option + →`.

Set Action to "Send Escape Sequence" and enter `f`.  
This makes iTerm2 send `Esc + f` when you press `Option + →`. (`Esc + f` is iTerm2's default shortcut for moving forward by word.)

Do the same for `Option + ←`, mapping it to `Esc + b`.

Save your settings and you're done.
