---
title: Making a Fake AirTag with nRF52832
publishedAt: "2025-01-03"
---

Happy New Year!  
This is my second OpenHaystack article. I was able to obtain a board with an nRF52832 on it, so I decided to turn this into a fake AirTag too.  
This time it is a memo for myself.  
(I’ll write a New Year’s article separately.)

The nRF52832 device I procured this time was not something like a Dev Kit that can connect to a serial port over USB; at most, it was the kind of thing that can communicate over UART and SWD. So as the programmer, I used a Raspberry Pi 4 with OpenOCD installed and wrote the firmware over SWD.

## Things Used This Time

- Raspberry Pi 4 Model B
- Jumper wires (as many as needed)
- nRF52832

## What to Do

### Preparing OpenOCD

Installing OpenOCD on a Raspberry Pi (running Raspberry OS) is very easy.  
You can install it with the following command.

```sh
sudo apt install -y openocd
```

To communicate with hardware from the Raspberry Pi using SWD, use GPIO pins 24 and 25.  
It is convenient to check the pin layout from the following.

[Raspberry Pi GPIO Pinout](https://pinout.xyz/)

- Pin 24: IO
- Pin 25: CLK

That’s it.

After connecting the Raspberry Pi and the board nicely with jumper wires, write the configuration file.

The following is the OpenOCD configuration for people using nRF523832, Raspberry Pi 4, and SWD.

```txt
adapter driver bcm2835gpio
bcm2835gpio peripheral_base 0xFE000000

bcm2835gpio speed_coeffs 236181 60

adapter gpio swclk 25
adapter gpio swdio 24

transport select swd

set CHIPNAME nrf52832
source [find target/nrf52.cfg]

nrf5 mass_erase

init
targets
reset
```

The configuration file I referenced was in the article below, but it had old descriptions and I could not find descriptions for supporting Raspberry Pi 4, so I added and modified it.

[Using Raspberry Pi as SWD programmer via OpenOCD Bitbang protocol — Ayan Pahwa](https://codensolder.com/blog/rip-swd-programmer)

Save the above with a name such as `openhaystack.cfg`, and if running the following starts a telnet server, gdb server, and so on, the preparation is complete for now.

```sh
openocd -f openhaystack.cfg
```

### Preparing the nRF52832 Firmware

I can build the firmware from scratch myself, but the easiest way is to flash a precompiled binary.  
This time I’ll use firmware from a repository called macless-haystack. (Only the firmware is used.)

[dchristl/macless-haystack: Create your own AirTag with OpenHaystack, but without the need to own an Apple device](https://github.com/dchristl/macless-haystack)

Download the firmware with the following command. (Change the `v2.2.0` part as appropriate.)

```sh
wget https://github.com/dchristl/macless-haystack/releases/download/v2.2.0/nrf52_firmware.bin
```

Download generate_keys.py too, because it is used to create key information.

```
wget https://raw.githubusercontent.com/dchristl/macless-haystack/refs/heads/main/generate_keys.py
```

When you run generate_keys.py, key information files are created in `output/`.

```sh
python generate_keys.py
```

```
❯ ls output
ZDOU6E.keys  ZDOU6E_devices.json  ZDOU6E_keyfile
```

The `XXXXXX_keyfile` under `output/` is the advertising key. Embed this into the firmware.  
[The steps are written in the official README](https://github.com/dchristl/macless-haystack/blob/main/firmware/nrf5x/README.md), but I’ll introduce them here too.

Running the following embeds it.

```sh
export LC_CTYPE=C
xxd -p -c 100000 XXXXXX_keyfile | xxd -r -p | dd of=nrf51_firmware.bin skip=1 bs=1 seek=$(grep -oba OFFLINEFINDINGPUBLICKEYHERE! nrf51_firmware.bin | cut -d ':' -f 1) conv=notrunc
```

Once this much is done, the firmware preparation is complete.

### Flashing the Firmware to the nRF52832

Add the following to the OpenOCD configuration file created in the “Preparing OpenOCD” section.

Note: Do not forget `nrf5 mass_erase`. This is a command that disables write protection called Readback Protection. If you forget it, the firmware cannot be written and it fails with an error.

```txt
nrf5 mass_erase
program nrf52_firmware2.bin verify
reset
```

After adding it, run the following.

```sh
openocd -f openhaystack.cfg
```

If the firmware is written correctly, I think the device will become online in the OpenHaystack app within a few minutes.

## Summary

In reality I struggled a lot, but I’m omitting quite a bit here.  
Recently I’ve been enjoying tinkering with microcontrollers and hardware. If I find another interesting toy, I’ll introduce it.
See you!
