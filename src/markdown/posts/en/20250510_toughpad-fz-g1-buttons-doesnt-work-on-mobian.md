---
title: Making the TOUGHPAD A1/A2 Buttons Work on Mobian (Debian)
publishedAt: "2025-05-10"
---

It’s been a while.  
I’ve been slacking on blog updates for a long time. It’s not that I don’t have things to write about — I’m just a slow writer, and once it starts to feel like a chore, drafts pile up in the drawer. I recently realized that I apparently can’t pick up a half-written draft a month later and keep going. Me from a month ago is basically a stranger. Starting this month, I’d like to try posting about once a month. That’s the plan, anyway.

Anyway, the other day a friend gave me a junk TOUGHPAD (model: FZ-G1) he’d picked up in Akihabara. It had already been wiped and had no OS on it, so I decided to install [Mobian](https://mobian-project.org/) — Debian with [Phosh](https://phosh.mobi/) (a smartphone-oriented GUI environment) integrated on top. (A few friends of mine bought TOUGHPADs too, and some went with Arch Linux and [Plasma Mobile](https://plasma-mobile.org/ja/) for the GUI.)

![Mobian splash screen](https://p.ipic.vip/z8sc26.jpeg)

![Mobian passcode input screen](https://p.ipic.vip/dhbwj2.jpeg)

Setting `Scale` to `200%` under `Displays` in the settings made things look a lot better.

![Mobian Displays settings. Scale is set to 200%](https://p.ipic.vip/q2ul6u.jpeg)

![Mobian home screen](https://p.ipic.vip/6csxup.jpeg)

After installing Mobian, I was pretty pumped that video playback in the browser, Discord, and other apps just worked. But after using it for a while, I noticed something: the A1 and A2 buttons didn’t work. To be precise, of all the physical buttons, only A1 and A2 were dead. Every friend who had bought a TOUGHPAD was hitting the same issue.

I could have just shrugged and said “oh well, they don’t work.” But I was curious about the fact that every other button worked perfectly and only A1/A2 were broken, so I set myself a goal — get A1/A2 to take screenshots — and started digging in.

## Investigation

### Checking whether the input reaches the OS

The first thing I needed to figure out was which device the input was coming from, so I tried the `evtest` command. Here’s what running `evtest` with no arguments prints:

```
mobian@mobian:~$ evtest
No device specified, trying to scan all of /dev/input/event*
Not running as root, no devices may be available.
Available devices:
/dev/input/event0:	AT Translated Set 2 keyboard
/dev/input/event1:	SEM USB Keyboard
/dev/input/event10:	Power Button
/dev/input/event11:	Power Button
/dev/input/event12:	Panasonic Laptop Support
/dev/input/event13:	Intel Virtual Buttons
/dev/input/event14:	HDA Intel HDMI HDMI/DP,pcm=7
/dev/input/event15:	HDA Intel HDMI HDMI/DP,pcm=8
/dev/input/event16:	HDA Intel PCH Headphone
/dev/input/event2:	eGalax Inc. eGalaxTouch EXC3000-0077-22.00.00
/dev/input/event3:	eGalax Inc. eGalaxTouch EXC3000-0077-22.00.00 UNKNOWN
/dev/input/event4:	SEM USB Keyboard Consumer Control
/dev/input/event5:	SEM USB Keyboard System Control
/dev/input/event6:	Wacom ISDv4 EC Pen
/dev/input/event7:	PC Speaker
/dev/input/event8:	HDA Intel HDMI HDMI/DP,pcm=3
/dev/input/event9:	Video Bus
Select the device event number [0-16]:
```

I made some educated guesses and poked at a few of the event devices, and here’s what I found:

- `/dev/input/event11` fires when you press the power button
- `/dev/input/event12` fires when you press volume down or volume up
- `/dev/input/event13` fires when you press the Windows button or the screen rotation button

But none of the event devices fired for the A1/A2 buttons. I also tried `libinput debug-events` and `acpi_listen`, and neither of those picked anything up either.

While I was looking into other ways to capture input events, a friend shared this blog post with me:

[FZ-G1-Mk3 | Wade Mealing](https://wmealing.github.io/toughpad-fz-g1-buttons-acpi.html?utm_source=chatgpt.com)

This post covers almost exactly my situation — the A1/A2 buttons not working on Linux on an FZ-G1 — and the analysis in it was really helpful.

To summarize, the post covers the following:

- The A1/A2 buttons don’t show up in `libinput debug-events` — same as what I saw
- There’s a close-ish existing implementation in [KaarelP2rtel/panasonic-hbtn: Panasonic Toughpad FZ-M1 Tablet Button driver for Linux](https://github.com/KaarelP2rtel/panasonic-hbtn) — suggesting these buttons work over ACPI
- Enabling `CONFIG_ACPI_DEBUG=y` in the Linux kernel turns on ACPI debug logging. With that enabled, kernel log messages appear when A1/A2 is pressed (visible via `dmesg`)
- Based on those kernel logs, the author looked at the ACPI table, guessed `Device (HKEY)` was the source, and wrote a simple driver — but it didn’t work

Out of these, the “ACPI debug logging shows messages when the buttons are pressed” part seemed worth a shot, so I decided to try it.

### Compiling and installing the Linux kernel

There are plenty of detailed articles about compiling the Linux kernel out there, so I’ll just briefly note what I did here.
Given the TOUGHPAD’s specs, compiling the kernel on it would obviously take forever, so I did the compile on a separate x86_64 machine.

#### 1. Install the Linux kernel build dependencies

Install them with:

```bash
sudo apt build-dep linux
```

#### 2. Get the Linux kernel source

The kernel version on the TOUGHPAD was 6.12.25, so I grabbed linux-6.12.28.tar.xz.

```
curl -LO https://cdn.kernel.org/pub/linux/kernel/v6.x/linux-6.12.28.tar.xz
```

Extract it with:

```
tar -xf linux-6.12.25.tar.xz
```

#### 4. Set up .config

Kernel build settings live in `.config`.  
This is where the `CONFIG_ACPI_DEBUG=y` above goes. To avoid drifting from Mobian’s config, I copied Mobian’s config from the TOUGHPAD, flipped `CONFIG_ACPI_DEBUG` to `y`, and dropped it into the kernel source directory as `.config`. (I flipped a few other things at the same time, but I’ve forgotten what.)

```
CONFIG_ACPI_DEBUG=y
```

On my TOUGHPAD, the `.config` was at `/boot/config-6.12.25`.

**You’ll need the following enabled for later steps. Without them, you can’t override ACPI tables at boot.**

They were already enabled in Mobian on the TOUGHPAD, but just in case:

```
CONFIG_ARCH_HAS_ACPI_TABLE_UPGRADE=y
CONFIG_ACPI_TABLE_UPGRADE=y
```

#### 5. Compile

Run the following and wait about 15 minutes. It’ll take longer on a slower machine.  
For reference, the CPU I used was an `AMD Ryzen 5 7600X 6-Core Processor`.

```
make clean
make -j$(nproc)
```

#### 6. Copy the build artifacts to the TOUGHPAD

Since `make install` and similar commands need to run on the TOUGHPAD, copy the entire compiled kernel directory over to it.

The compiled kernel directory is huge, so transferring it is a pain, but with rsync set up like this it only took about 7 minutes.

Edit `/etc/rsyncd.conf` on the build machine as follows:

```
uid         = root
gid         = root
log file    = /var/log/rsyncd.log
pid file    = /var/run/rsyncd.pid

[linux-kernel]
path = /home/sh1ma/workspace/linux-6.12.25
```

Change `/home/sh1ma/workspace/linux-6.12.25` to wherever your kernel directory lives.

Then on the build machine, run:

```
rsync --daemon
```

This starts rsyncd so you can transfer over the rsync protocol (TCP) directly instead of going through ssh.

After that, run the following on the TOUGHPAD and the files copy over fast:

```
rsync -azvh --info=progress2 --whole-file rsync://192.168.100.12/linux-kernel ~/workspace/
```

#### 7. Install the build artifacts

Once the compiled kernel directory is on the TOUGHPAD, the rest of the work happens there.

A lot of kernel modules aren’t actually needed, so edit `/etc/initramfs-tools/initramfs.conf` so only the required ones get installed:

```
MODULES=dep
```

Update initramfs:

```
sudo update-initramfs -u -k 6.12.25
```

Then run:

```
sudo make modules_install
sudo make install
```

That’s it — installation is done. After a reboot, the new kernel should be running.

### Reading the ACPI debug logs

Booting a kernel built with `CONFIG_ACPI_DEBUG=y` adds `debug_level` and `debug_layer` files under `/sys/module/acpi/parameters`.

```
mobian@mobian:~$ ls /sys/module/acpi/parameters
acpica_version    debug_layer  ec_busy_polling  ec_event_clearing  ec_max_queries  ec_polling_guard    immediate_undock   trace_debug_level  trace_state
aml_debug_output  debug_level  ec_delay         ec_freeze_events   ec_no_wakeup    ec_storm_threshold  trace_debug_layer  trace_method_name
```

Change these values to actually get ACPI debug logs printed.

Get a root shell first — writing to these needs root:

```
sudo su
```

Check the `debug_level` parameter:

```
cat /sys/module/acpi/parameters/debug_level
```

Output:

```
Description              	Hex        SET
ACPI_LV_INIT             	0x00000001 [ ]
ACPI_LV_DEBUG_OBJECT     	0x00000002 [ ]
ACPI_LV_INFO             	0x00000004 [ ]
ACPI_LV_REPAIR           	0x00000008 [ ]
ACPI_LV_TRACE_POINT      	0x00000010 [ ]
ACPI_LV_INIT_NAMES       	0x00000020 [ ]
ACPI_LV_PARSE            	0x00000040 [ ]
ACPI_LV_LOAD             	0x00000080 [ ]
ACPI_LV_DISPATCH         	0x00000100 [ ]
ACPI_LV_EXEC             	0x00000200 [ ]
ACPI_LV_NAMES            	0x00000400 [ ]
ACPI_LV_OPREGION         	0x00000800 [ ]
ACPI_LV_BFIELD           	0x00001000 [ ]
ACPI_LV_TABLES           	0x00002000 [ ]
ACPI_LV_VALUES           	0x00004000 [ ]
ACPI_LV_OBJECTS          	0x00008000 [ ]
ACPI_LV_RESOURCES        	0x00010000 [ ]
ACPI_LV_USER_REQUESTS    	0x00020000 [ ]
ACPI_LV_PACKAGE          	0x00040000 [ ]
ACPI_LV_ALLOCATIONS      	0x00100000 [ ]
ACPI_LV_FUNCTIONS        	0x00200000 [ ]
ACPI_LV_OPTIMIZATIONS    	0x00400000 [ ]
ACPI_LV_MUTEX            	0x01000000 [ ]
ACPI_LV_THREADS          	0x02000000 [ ]
ACPI_LV_IO               	0x04000000 [ ]
ACPI_LV_INTERRUPTS       	0x08000000 [ ]
ACPI_LV_AML_DISASSEMBLE  	0x10000000 [ ]
ACPI_LV_VERBOSE_INFO     	0x20000000 [ ]
ACPI_LV_FULL_TABLES      	0x40000000 [ ]
ACPI_LV_EVENTS           	0x80000000 [ ]
--
debug_level = 0x00000000 (* = enabled)
```

Check the `debug_layer` parameter:

```
cat /sys/module/acpi/parameters/debug_layer
```

Output:

```
Description              	Hex        SET
ACPI_UTILITIES           	0x00000001 [ ]
ACPI_HARDWARE            	0x00000002 [ ]
ACPI_EVENTS              	0x00000004 [ ]
ACPI_TABLES              	0x00000008 [ ]
ACPI_NAMESPACE           	0x00000010 [ ]
ACPI_PARSER              	0x00000020 [ ]
ACPI_DISPATCHER          	0x00000040 [ ]
ACPI_EXECUTER            	0x00000080 [ ]
ACPI_RESOURCES           	0x00000100 [ ]
ACPI_CA_DEBUGGER         	0x00000200 [ ]
ACPI_OS_SERVICES         	0x00000400 [ ]
ACPI_CA_DISASSEMBLER     	0x00000800 [ ]
ACPI_COMPILER            	0x00001000 [ ]
ACPI_TOOLS               	0x00002000 [ ]
ACPI_ALL_DRIVERS         	0xFFFF0000 [ ]
--
debug_layer = 0x00000000 ( * = enabled)
```

To get useful logs when the A1/A2 buttons are actually pressed, these values worked well:

```
echo 0x200 > /sys/module/acpi/parameters/debug_level
echo 0x82 > /sys/module/acpi/parameters/debug_layer
```

- Setting `debug_level` to `0x200` enables only `ACPI_LV_EXEC`
- Setting `debug_layer` to `0x82` enables `ACPI_HARDWARE` and `ACPI_EXECUTER`

Once the writes succeed, debug logging is on. The settings don’t persist across reboots.

Now check the debug output. It comes through as kernel log messages, so `dmesg -w` will show it.

There’s a lot of noise, but a command like the one below slows it down to a readable pace:

[Wade Mealing](https://wmealing.github.io/toughpad-fz-g1-buttons-acpi.html?utm_source=chatgpt.com#enabling-acpi-events)

>

```bash
dmesg -w | grep Notify -A5 -B5
```

The interesting lines are around Notify, like the ones below. This block shows up every single time you press A1 or A2, so it’s almost certainly the log for those button presses. In particular, `TBTN` in the log looks like a symbol from the DSDT in the ACPI table.

```
[31002.859886]   exresop-0126 ex_resolve_operands   : Opcode 86 [Notify] RequiredOperandTypes=000001A6
[31002.859890]  exresolv-0084 ex_resolve_to_value   : Resolved object 00000000c7a02e9c
[31002.859892]    exdump-0880 ex_dump_operands      : **** Start operand dump for opcode [Notify], 2 operands
[31002.859895]    exdump-0603 ex_dump_operand       : 000000009e1948ee Namespace Node:  0  TBTN Device       000000009e1948ee 001 Notify Object: 00000000dfc93cab
```

### Decompiling the ACPI table

Let me take stock of where things stand:

- Button press events don’t show up in input-analysis tools like `libinput debug-events`, `evtest`, or `acpi_listen`
  - From that, two things follow:
    - Input events aren’t making it to the [Linux Input SubSystem](https://docs.kernel.org/input/input_uapi.html)
    - ACPI notifications aren’t reaching userland from the kernel
- But button presses do show up in the kernel log (`dmesg -w`)

So the ACPI events are getting to the kernel but are being ignored or swallowed somewhere along the way.

The next step is to dump the ACPI table and decompile the DSDT, the same way the [FZ-G1-Mk3 | Wade Mealing](https://wmealing.github.io/toughpad-fz-g1-buttons-acpi.html?utm_source=chatgpt.com#acpi-tables) post does, and then track down the definition of `TBTN` that I saw earlier. The decompile → override-DSDT flow is covered in more depth here:

[DSDT - ArchWiki](https://wiki.archlinux.jp/index.php/DSDT)

First, install `acpica-tool` for this work:

```bash
sudo apt install acpica-tool
```

Dump the ACPI tables with `acpidump`. (It drops multiple files into the current directory, so I’d recommend running it in a scratch directory.)

```bash
sudo acpidump -b
```

You’ll end up with the dumped ACPI binaries in the current directory:

```
mobian@mobian:~/tmp$ ls
 apic.dat    dsdt.dat   hpet.dat   pcct.dat     ssdt12.dat   ssdt2.dat   ssdt6.dat   tcpa.dat
'asf!.dat'   facp.dat   lpit.dat   slic.dat     ssdt13.dat   ssdt3.dat   ssdt7.dat
 bgrt.dat    facs.dat   mcfg.dat   ssdt10.dat   ssdt14.dat   ssdt4.dat   ssdt8.dat
 dmar.dat    fpdt.dat   msdm.dat   ssdt11.dat   ssdt1.dat    ssdt5.dat   ssdt9.dat
```

Only `dsdt.dat` matters here.
The following command decompiles it into `dsdt.dsl`:

```bash
iasl -d dsdt.dat
```

I uploaded the resulting `dsdt.dsl` as a gist:  
[TOUGHPAD FZ-G1 ACPI DSDT Table](https://gist.github.com/sh1ma/2c44b2da7445de88fdc1b599d3159da8)

Now to dig into `TBTN` in `dsdt.dsl`.  
Searching for `TBTN` turns up this section:

```
    Scope (\_SB)
    {
        Device (TBTN)
        {
            Mutex (HDMX, 0x00)
            Method (_HID, 0, NotSerialized)  // _HID: Hardware ID
            {
                If ((\_SB.PCI0.LPCB.GSGP (0x10, 0x01) == 0x01))
                {
                    If ((\_SB.PCI0.LPCB.GSGP (0x16, 0x01) != \_SB.PCI0.LPCB.GSGP (0x17, 0x01)))
                    {
                        Return (0x2B003434)
                    }
                }

                Return (0x2A003434)
            }
```

[Relevant section in the gist](https://gist.github.com/sh1ma/2c44b2da7445de88fdc1b599d3159da8#file-dsdt-dsl-L18182-L18198)

`Device (TBTN)` has a few methods attached to it.
Among them, `_HID` is the one that returns a hardware-specific ID.

According to section 6.1.5 of the [latest ACPI Spec](https://uefi.org/sites/default/files/resources/ACPI_Spec_6.5a_Final.pdf), `_HID` is described like this:

> 6.1.5 \_HID (Hardware ID)
>
> This object is used to supply OSPM with the device’s PNP ID or ACPI ID.

OSPM stands for “Operating System-directed configuration and Power Management,” which for our purposes is essentially ACPI. So it’s fine to think of `_HID` as the method that tells the OS what the device’s HID is.

That much I got. What caught my eye is that this `_HID` looked different from other `_HID`s in the same file. Two things in particular:

- Most other `_HID`s in `dsdt.dsl` are in a form like `Name (_HID, EisaId ("PNP0C02"))` — basically a constant that always returns `EisaId ("PNP0C02")` when `_HID` is queried. `TBTN`’s `_HID`, in contrast, is a method with conditional branches.
- The other `_HID`s return strings wrapped in `EisaId()`, but `TBTN`’s `_HID` returns raw integers.

I wondered whether `_HID` is even allowed to be an integer, so I kept reading the ACPI Spec. Here’s what I found:

- `EisaId()` is a macro that converts an EISA ID string into an integer
  - Documented in _19.6.37 EISAID (EISA ID String To Integer Conversion Macro)_ of the [ACPI Spec](https://uefi.org/sites/default/files/resources/ACPI_Spec_6.5a_Final.pdf)
- `_HID` can return either a string or an integer
  - If it’s a string, it’s an alphanumeric PNP ID or ACPI ID
    - PNP IDs and ACPI IDs are documented in [PNP ID and ACPI ID Registry | Unified Extensible Firmware Interface Forum](https://uefi.org/PNP_ACPI_Registry)
  - If it’s an integer, it’s a 32-bit compressed EISA type ID
    - This integer can be converted back to a string HID. _19.3.4 ASL Macros_ of the [ACPI Spec](https://uefi.org/sites/default/files/resources/ACPI_Spec_6.5a_Final.pdf) puts it this way:
      > Converts and compresses the 7-character text argument into its corresponding 4-byte numeric EISA ID encoding (Integer). This can be used when declaring IDs for devices that are EISA IDs.
    - The same section also describes how to convert a 32-bit compressed EISA type ID back to a string

So now I knew `TBTN`’s `_HID` returns a 32-bit compressed EISA type ID. I wrote a quick script to decode the two return values:

```python
def decode_eisa_id(eisa_id: int):
    eisa_id = int.from_bytes(eisa_id.to_bytes(4, "little"), "big")
    vendor = ""
    vendor_bits = (eisa_id >> 16) & 0xFFFF

    char1_val = (vendor_bits >> 10) & 0x1F
    char2_val = (vendor_bits >> 5) & 0x1F
    char3_val = vendor_bits & 0x1F

    vendor += chr(char1_val + 0x40)
    vendor += chr(char2_val + 0x40)
    vendor += chr(char3_val + 0x40)

    product_id = eisa_id & 0xFFFF
    return f"{vendor}{product_id:04X}"


id1 = 0x2A003434
id2 = 0x2B003434

print(f"0x{id1:08X} -> {decode_eisa_id(id1)}")
print(f"0x{id2:08X} -> {decode_eisa_id(id2)}")
```

[gist](https://gist.github.com/sh1ma/e106e4503e9bbb1bcc1dbc151e9bc202)

The output:

```
❯ python decode.py
0x2A003434 -> MAT002A
0x2B003434 -> MAT002B
```

Checking a few of the other defined devices, several of them also had HIDs with a `MAT` prefix, which suggests the decoded values look right.

Once we have the HID, the rest is just writing a driver.

The finished driver is here:

[sh1ma/tbtn-driver: TOUGPAD TBTN (A1, A2 buttons) Linux kernel driver](https://github.com/sh1ma/tbtn-driver)

[Here’s a video of the A1/A2 buttons actually working](https://cdn.sh1ma.dev/IMG_1051.mp4)

## Wrapping up

The truth is, before I wrote the real driver, I first rewrote the DSDT `TBTN` HID to the fixed value `PNP0C40`, overrode the ACPI table with the patched version, wrote a driver against that, and got it working end to end — but I skipped over all of that in this article. (I got lazy about writing it up.)  
I’d like to write a follow-up post at some point covering how to override DSDT and so on, as a note to my future self.
