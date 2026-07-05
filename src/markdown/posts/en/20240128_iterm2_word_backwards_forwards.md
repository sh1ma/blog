---
  title: "Making Word Movement Work in iTerm2 with Option + Arrow Keys"
  publishedAt: "2024-01-28"
---

Even though I’ve used iTerm2 for many years, I had never properly configured word movement.  
I really wanted to move by word with `Option + <arrow key>`, so this time I made it possible to move by word using the arrow keys together with Option.

## How to Configure It

There are two ways: change the “Global Keymap”, or configure it per iTerm2 profile.  
I chose not to change the global keymap and instead only changed iTerm2’s default profile.  
The method explained below changes only the default profile.

### 1. Go to the Keys tab from iTerm2 settings and open Key Mappings.

![Screenshot of the screen after opening the Key Mappings tab in iTerm2](https://cdn.sh1ma.dev/20240128-1.png)

It looks like this.

### 2, Press the “+” button at the bottom of the screen to add a new key mapping.

![Screenshot while assigning a shortcut for Option + → from the Key Mappings tab](https://cdn.sh1ma.dev/20240128-2.png)

When you click the “Keyboard Shortcut” field, it waits for shortcut key input, so enter `Option + →`.

For Action, select “Send Escape Sequence” and enter `f`.  
This means that when `Option + →` is pressed, it sends `Esc + f`. (In iTerm2, `Esc + f` is the default shortcut for word movement.)

Using the same steps, set `Option + ←` to `Esc + b`.

Once you save the settings, you’re done.
