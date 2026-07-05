---
title: Building a Fake AirTag with an nRF52832
publishedAt: "2025-01-03"
---

Happy New Year!  
This is my second OpenHaystack post. I got my hands on a board with an nRF52832 on it, so I decided to turn that into a fake AirTag as well.  
This is my notes from doing it.  
(I'll do a proper New Year's post separately.)

The nRF52832 board I picked up isn't a Dev Kit — no USB serial port, at best just UART and SWD for talking to it. So I used a Raspberry Pi 4 running OpenOCD as the programmer and flashed the firmware over SWD.

## What I used

- Raspberry Pi 4 Model B
- Jumper wires (as many as you need)
- nRF52832

## Steps

### Setting up OpenOCD

Installing OpenOCD on a Raspberry Pi (running Raspberry Pi OS) is very easy — just:

```sh
sudo apt install -y openocd
```

To talk to the target over SWD from the Pi, use GPIO pins 24 and 25.  
This is a handy reference for the pin layout:

[Raspberry Pi GPIO Pinout](https://pinout.xyz/)

- Pin 24: IO
- Pin 25: CLK

Wire the Pi to the board with jumper wires and then write the config file.

Here's an OpenOCD config for the nRF52832 + Raspberry Pi 4 + SWD combo:

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

I based this on the config in the article below, but that one had some outdated directives and nothing for the Raspberry Pi 4, so I added and adjusted a few things.

[Using Raspberry Pi as SWD programmer via OpenOCD Bitbang protocol — Ayan Pahwa](https://codensolder.com/blog/rip-swd-programmer)

Save the config as something like `openhaystack.cfg`. If the following starts up a telnet server, gdb server, and so on, the OpenOCD side is ready:

```sh
openocd -f openhaystack.cfg
```

### Preparing the nRF52832 firmware

I could build the firmware from scratch, but the easiest path is to flash a precompiled binary.  
This time I'll use the firmware from a repo called macless-haystack. (Only the firmware, nothing else.)

[dchristl/macless-haystack: Create your own AirTag with OpenHaystack, but without the need to own an Apple device](https://github.com/dchristl/macless-haystack)

Download the firmware. (Change `v2.2.0` as needed.)

```sh
wget https://github.com/dchristl/macless-haystack/releases/download/v2.2.0/nrf52_firmware.bin
```

Also grab `generate_keys.py`, which is used to generate the key material.

```
wget https://raw.githubusercontent.com/dchristl/macless-haystack/refs/heads/main/generate_keys.py
```

Running it creates the key files under `output/`.

```sh
python generate_keys.py
```

```
❯ ls output
ZDOU6E.keys  ZDOU6E_devices.json  ZDOU6E_keyfile
```

The `XXXXXX_keyfile` under `output/` is the advertising key. That's what you embed into the firmware.  
[The steps are in the official README](https://github.com/dchristl/macless-haystack/blob/main/firmware/nrf5x/README.md), but I'll cover them here too.

The following patches the key into the binary:

```sh
export LC_CTYPE=C
xxd -p -c 100000 XXXXXX_keyfile | xxd -r -p | dd of=nrf51_firmware.bin skip=1 bs=1 seek=$(grep -oba OFFLINEFINDINGPUBLICKEYHERE! nrf51_firmware.bin | cut -d ':' -f 1) conv=notrunc
```

That's the firmware ready.

### Flashing the firmware onto the nRF52832

Append the following to the OpenOCD config from the "Setting up OpenOCD" section.

Note: don't leave out `nrf5 mass_erase`. It clears a write-protect feature called Readback Protection. Skip it and the flash will fail with an error.

```txt
nrf5 mass_erase
program nrf52_firmware2.bin verify
reset
```

Then run:

```sh
openocd -f openhaystack.cfg
```

If the flash succeeds, the device should show up as online in the OpenHaystack app within a few minutes.

## Wrap-up

I actually fought with this quite a bit, but I skipped over most of the pain here.  
Lately I've been really enjoying messing around with microcontrollers and hardware. If I stumble onto another fun toy, I'll write about it.
See you!
