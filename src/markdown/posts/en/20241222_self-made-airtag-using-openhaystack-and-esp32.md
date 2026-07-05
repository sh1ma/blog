---
title: Building a DIY AirTag with ESP32 and OpenHaystack
publishedAt: "2024-12-22"
---

It's really starting to get cold. I wear Uniqlo AIRism all year round, so stepping outside is brutal right now. I should probably pick up some HEATTECH soon.

This time I gave OpenHaystack a try — an open-source project that lets you build your own AirTag by piggybacking on the "Find My" network used by Apple's Find My app — so I want to walk through how I set it up.

## What is OpenHaystack?

OpenHaystack is a project (a mix of tooling and software) that turns any BLE-capable device into an AirTag by piggybacking on Apple's Find My network.  
It was built based on reverse engineering of the Find My network and AirTags.

[seemoo-lab/openhaystack: Build your own 'AirTags' 🏷 today! Framework for tracking personal Bluetooth devices via Apple's massive Find My network.](https://github.com/seemoo-lab/openhaystack?tab=readme-ov-file#what-is-openhaystack)

## Trying it out

### Heads up

Following [the official README](https://github.com/seemoo-lab/openhaystack?tab=readme-ov-file#installation) with the release build doesn't actually work as-is. To get around that, I used the latest state of the `main` branch instead of a release build. Depending on what `main` looks like when you read this, these steps may not match exactly.

### Environment

- macOS 14 (Sonoma)
- Xcode Version 15.1 (15C65)
- An ESP32-compatible board

### 1. Build OpenHaystack with Xcode

There's a prebuilt app on GitHub Releases, but it's old and doesn't reflect the current development version, so it's unusable in practice. That's why we need to build from source — this step isn't optional.

First, clone the GitHub repository.

```sh
git clone --depth 1 https://github.com/seemoo-lab/openhaystack.git
```

`--depth 1` grabs only the latest commit, which keeps the download quick.

Inside the repo, you'll find `OpenHaystack.xcodeproj` under the `OpenHaystack` directory. Open it and Xcode should launch.
Depending on your Xcode version, though, you may hit the issue described in the article below and see errors or warnings about missing libraries.

[About the Package.resolved Deletion Issue Occurring in Xcode 15.3/15.4 #Swift - Qiita](https://qiita.com/tichise/items/a6525272e326e7798f05)

I ran into this too. Running the following to delete `OpenHaystack/OpenHaystack.xcodeproj/project.xcworkspace/xcshareddata/swiftpm/Package.resolved` and then reopening Xcode fixed it for me.

```sh
rm OpenHaystack/OpenHaystack.xcodeproj/project.xcworkspace/xcshareddata/swiftpm/Package.resolved
```

Once the build finishes, an app like this opens. (The screenshot is from an already-configured setup, so accessories are visible — yours will probably be empty at this point.)

![](https://cdn.sh1ma.dev/7b6b6d8a1dd5b890880e18c41ab2485a030ca33543c3c30299f1ac2de942f6c0.png)

### 2. Set up OpenHaystack

**On macOS 14 and later, following [the OpenHaystack README steps](https://github.com/seemoo-lab/openhaystack?tab=readme-ov-file#installation) as-is doesn't work.**

Here's what actually works on macOS 14+.

After building and launching OpenHaystack from Xcode, open its settings. Click the OpenHaystack icon in the status bar and choose "Settings" — a separate window opens with a text field for the Search Party Token.

![Settings screen with the Search Party Token text field](https://cdn.sh1ma.dev/d9fc785094aed36c3fe2fdc8ccd8960595067d5092b4691c16c5585fa608776f.png)

You'll enter the token here. It lives in Keychain. Open the Keychain app and search for:

```
com.apple.account.DeviceLocator.search-party-token
```

Right-click the entry and choose "Copy Password to Clipboard".

![Keychain app screen showing search results for com.apple.account.DeviceLocator.search-party-token. One item is found](https://cdn.sh1ma.dev/131e673d33e983c73440ed42e9556c2d513059be887bd535b46491856af130b7.png)

Paste it into the field, and the app-side setup is done.

### 3. Flash the OpenHaystack firmware onto an ESP32

OpenHaystack ships official ESP32 firmware. You can just follow the official flashing steps, but I'll cover them here too. ([Official instructions](https://github.com/seemoo-lab/openhaystack/tree/main/Firmware/ESP32))

Flashing uses a tool called ESP-IDF. The guide below is a good reference for setting it up. You're good once the `idf.py` command is available.

[Standard Toolchain Setup for Linux and macOS - ESP32 - — ESP-IDF Programming Guide v5.3.2 documentation](https://docs.espressif.com/projects/esp-idf/en/stable/esp32/get-started/linux-macos-setup.html)

Before flashing, create a device in the OpenHaystack app. Use the button circled in red in the screenshot.

![OpenHaystack app screen. The + button in the navigation bar is circled in red](https://cdn.sh1ma.dev/128c5211dfc9d313ea1d331c388fb4008425959049fcf191138a056efa1927b9.png)

The device shows up in the list. Right-click it and choose "Copy advertisement key → Base64" to copy the advertising key in Base64.

Move into the OpenHaystack project's `Firmware/ESP32` directory.

```sh
cd Firmware/ESP32
```

Build the firmware first.

```sh
idf.py build
```

Then flash it using `flash_esp32.sh` in the same directory. Replace the `Base64-encoded advertisement key` argument with the key you just copied.

```sh
chmod +x flash_esp32.sh
./flash_esp32.sh -p /dev/yourSerialPort "Base64-encoded advertisement key"
```

That's it for setup. After a while, the device's location should appear in the OpenHaystack app. (Hit the refresh button in the upper right to force a fetch.) In my case there was roughly a 5-minute lag between flashing the firmware and the first location showing up.

## Wrap-up

That's how I got OpenHaystack running on an ESP32. This was actually two or three weeks ago, so I wrote this from a bit of a hazy memory — apologies if I got any details wrong.

I also got OpenHaystack running on an nRF52832 recently, so I'd like to write that up too.

Next thing I knew, the new year had already arrived.
