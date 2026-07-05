---
title: Trying to Build a DIY AirTag with ESP32 and OpenHaystack
publishedAt: "2024-12-22"
---

It has become a completely chilly season. Since I wear Uniqlo AIRism all year round, it is unbearably cold when I go outside. I should probably buy HEATTECH soon.

This time I tried using OpenHayStack, an OSS project that lets you build a DIY AirTag by piggybacking on the “Find My network” used by Apple’s “Find My” app, so I’d like to introduce the steps and such.

## What Is OpenHaystack?

OpenHayStack is a technology/software that can turn devices that speak Bluetooth (BLE) into AirTags by piggybacking on Apple’s Find My network.  
It seems to have been developed from the results of reverse engineering the Find My network and AirTag.

[seemoo-lab/openhaystack: Build your own 'AirTags' 🏷 today! Framework for tracking personal Bluetooth devices via Apple's massive Find My network.](https://github.com/seemoo-lab/openhaystack?tab=readme-ov-file#what-is-openhaystack)

## Actually Trying It

### Note

In reality, even if you use the release version and follow [the official README steps](https://github.com/seemoo-lab/openhaystack?tab=readme-ov-file#installation), it does not work properly. To solve that, this time I worked with the latest state from the main branch instead of the release version. Please note that depending on the latest state of the main branch, the steps in this article may not work.

### Environment

- MacOS 14(Sonoma)
- XCode Version 15.1 (15C65)
- ESP32-compatible board

### 1. Build OpenHaystack with XCode

You can download a built application from Github Releases, but that version is old rather than the current development version, so it cannot be used. Therefore, you need to build it yourself without using the release version. So this step is required.

First, clone the Github repository.

```sh
git clone --depth 1 https://github.com/seemoo-lab/openhaystack.git
```

By adding `--depth 1`, you can download only the latest commit history, so it downloads quickly.

Inside the repository directory, there is `OpenHaystack.xcodeproj` in the `OpenHaystack` directory, and opening this should start XCode.
However, depending on the Xcode version, a phenomenon like the one in the following article may occur, and I think errors or warnings about missing libraries will appear.

[About the Package.resolved Deletion Issue Occurring in Xcode 15.3/15.4 #Swift - Qiita](https://qiita.com/tichise/items/a6525272e326e7798f05)

I encountered this error, but I solved it by running the following, deleting `OpenHaystack/OpenHaystack.xcodeproj/project.xcworkspace/xcshareddata/swiftpm/Package.resolved`, and reopening XCode.

```sh
rm OpenHaystack/OpenHaystack.xcodeproj/project.xcworkspace/xcshareddata/swiftpm/Package.resolved
```

When the build completes, an application like this opens. (This is an already set-up screen, so accessories are already displayed, but in reality I think nothing will be displayed yet.)

![](https://cdn.sh1ma.dev/7b6b6d8a1dd5b890880e18c41ab2485a030ca33543c3c30299f1ac2de942f6c0.png)

### 2. Setting Up OpenHaystack

**On MacOS 14 and later, following [the OpenHaystack README steps](https://github.com/seemoo-lab/openhaystack?tab=readme-ov-file#installation) does not work.**

I’ll introduce the actual steps for MacOS 14 and later.

After building and launching the OpenHaystack application from XCode, go to OpenHaystack settings. Open it from “Settings” under OpenHaystack in the status bar. Then a settings window opens with a text field for entering “Search Party Token”.

![Settings screen with the Search Party Token text field](https://cdn.sh1ma.dev/d9fc785094aed36c3fe2fdc8ccd8960595067d5092b4691c16c5585fa608776f.png)

Put the token here. The token is in Keychain. Open the Keychain app and search for the following string.

```
com.apple.account.DeviceLocator.search-party-token
```

You can copy it by right-clicking the item and selecting “Copy Password to Clipboard”.

![Keychain app screen. It shows search results for the phrase com.apple.account.DeviceLocator.search-party-token. One item is found](https://cdn.sh1ma.dev/131e673d33e983c73440ed42e9556c2d513059be887bd535b46491856af130b7.png)

After entering it in the field from earlier, the application-side setup is complete.

### 3. Flash the OpenHaystack Firmware to the ESP32

OpenHaystack officially provides ESP32 firmware. Firmware flashing can be done by following the official steps, but I’ll introduce it here too. ([Official instructions](https://github.com/seemoo-lab/openhaystack/tree/main/Firmware/ESP32))

For flashing, use a tool called ESP-IDF. I think the following is a good reference for ESP-IDF setup steps. It is OK if the command `idf.py` becomes available.

[Standard Toolchain Setup for Linux and macOS - ESP32 - — ESP-IDF Programming Guide v5.3.2 documentation](https://docs.espressif.com/projects/esp-idf/en/stable/esp32/get-started/linux-macos-setup.html)

Create a device from the OpenHaystack app in advance. You can create one from the location marked with a red circle in the image.

![OpenHaystack app screen. The + button in the navigation bar is circled in red](https://cdn.sh1ma.dev/128c5211dfc9d313ea1d331c388fb4008425959049fcf191138a056efa1927b9.png)

The device is added to the list, so right-click the added device and use “Copy advertisement key　→ Base64” to copy the advertising key in Base64 format.

Enter the OpenHaystack project directory and move to `Firmware/ESP32`.

```sh
cd Firmware/ESP32
```

First, build the firmware.

```sh
idf.py build
```

Use `flash_esp32.sh` in the directory to flash it. Replace the “Base64-encoded advertisement key” part with the advertising key you copied earlier.

```sh
chmod +x flash_esp32.sh
./flash_esp32.sh -p /dev/yourSerialPort "Base64-encoded advertisement key"
```

That completes setup. After a while, the device’s location should be displayed on the OpenHaystack screen. (If you press the refresh button in the upper right of the app, the location information should appear.) It felt like there was about a 5-minute lag from flashing the firmware until it appeared.

## Summary

I introduced how to run OpenHaystack using ESP32. I feel like I did this about two or three weeks ago already, so I wrote the article from vague memory. Sorry if there are any incorrect parts......

Recently I also got OpenHaystack running using hardware called nRF52832, so I hope I can write an article about that too.

Before I knew it, the new year had started.
