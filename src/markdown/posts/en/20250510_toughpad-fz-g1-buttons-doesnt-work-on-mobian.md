---
title: Making the TOUGHPAD A1/A2 Buttons Work on Mobian (Debian)
publishedAt: "2025-05-10"
---

It’s been a while.  
I had been neglecting blog updates for a long time. It’s not that I don’t have topics, but because I write slowly, it became a pain to write, and there are several shelved articles.... Recently I realized that apparently I can’t add to something I left half-written a month later. Myself from a month ago is basically another person, after all. From this month, I’d like to post about once a month. That’s the feeling.

Now then, the other day I got a junk TOUGHPAD (model number: FZ-G1) from a friend in Akiba. At the time of purchase, it had been initialized and had no OS installed, so I decided to install Debian with [Phosh](https://phosh.mobi/) (a GUI environment for smartphones) integrated into it: [Mobian](https://mobian-project.org/). (It seems several TOUGHPAD units were bought among friends, and some people installed Arch Linux and used [Plasma Mobile](https://plasma-mobile.org/ja/) for the GUI.)

![Mobian splash screen](https://p.ipic.vip/z8sc26.jpeg)

![Mobian passcode input screen](https://p.ipic.vip/dhbwj2.jpeg)

When I set `Scale` to `200%` from `Displays` in settings, it looked much better.

![Mobian Displays settings. Scale is set to 200%](https://p.ipic.vip/q2ul6u.jpeg)

![Mobian home screen](https://p.ipic.vip/6csxup.jpeg)

After installing Mobian, I was excited for a while that browser video playback, Discord, and other software worked, but after touching it for a while I noticed something. The A1 button and A2 button did not work. Strictly speaking, among the physical buttons, only the A1 and A2 buttons did not work. All of the friends who bought TOUGHPADs also faced this issue where the A1/A2 buttons did not work.

At this point I could have ended with “Oh. They don’t work.” But I was intrigued by the phenomenon where “the other buttons work perfectly, but only the A1/A2 buttons do not work,” so I decided to investigate with the goal of “taking screenshots with the A1/A2 buttons.”

## Investigation

### Check Whether the Input Is Recognized by the OS

First, I thought I needed to identify which device the input was coming from, so I tried analyzing it with the `evtest` command. Below is the output when running the `evtest` command without arguments.

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

After making guesses and checking several event devices, I learned the following.

- `/dev/input/event11` fires an event when the power button is pressed
- `/dev/input/event12` fires when the volume down and volume up buttons are pressed
- `/dev/input/event13` fires when the Windows button and screen rotation button are pressed

However, none of the event files fired when the A1/A2 buttons were pressed. I also tried using `libinput debug-events` and `acpi_listen`, but those did not react either.

While I was looking into ways to capture input events, a friend shared the following blog with me.

[FZ-G1-Mk3 | Wade Mealing](https://wmealing.github.io/toughpad-fz-g1-buttons-acpi.html?utm_source=chatgpt.com)

The discussion in this blog, based on almost the same situation of “the A1/A2 buttons do not work on Linux installed on an FZ-G1,” was very useful to me.

To summarize, the blog said the following.

- The A1/A2 buttons do not react in `libinput debug-events` ← same as me
- There is an implementation close to this in [KaarelP2rtel/panasonic-hbtn: Panasonic Toughpad FZ-M1 Tablet Button driver for Linux](https://github.com/KaarelP2rtel/panasonic-hbtn). ← This suggests these buttons operate via ACPI
- Enabling `CONFIG_ACPI_DEBUG=y` in the Linux kernel makes the ACPI debug log feature available. When ACPI debug logging is enabled, kernel logs flow when A1/A2 buttons fire (can be checked with `dmesg`)
- Based on the kernel logs that appeared, the author checked the ACPI table, guessed that `Device (HKEY)` was the source, and wrote a simple driver, but it had no effect

Of these, “when ACPI debug logging is enabled, kernel logs flow when the buttons are pressed” seemed worth trying, so I decided to try it.

### Compiling and Installing the Linux Kernel

I think there are other articles where people write the Linux kernel compilation steps in detail, so here I’ll briefly write what I did.
Considering the specs, compiling the Linux kernel on the TOUGHPAD seemed like it would take quite a long time, so for compilation I prepared a separate x86_64 machine and did it there.

#### 1. Prepare Linux Kernel Dependencies

Dependencies can be prepared with the following command.

```bash
sudo apt build-dep linux
```

#### 2. Prepare the Linux Kernel Source Code

The Linux kernel version on the TOUGHPAD was 6.12.25, so I downloaded linux-6.12.28.tar.xz.

```
curl -LO https://cdn.kernel.org/pub/linux/kernel/v6.x/linux-6.12.28.tar.xz
```

It can be extracted with the following command.

```
tar -xf linux-6.12.25.tar.xz
```

#### 4. Prepare .config

Settings for Linux kernel compilation are written in `.config`.  
The earlier `CONFIG_ACPI_DEBUG=y` is also written here. Because there must not be differences from Mobian’s config, I brought Mobian’s config from the TOUGHPAD, edited the `CONFIG_ACPI_DEBUG` item to `y`, and placed it inside the Linux kernel source code directory under the name `.config`. (At this time I also enabled a few other things, but I forgot what they were.)

```
CONFIG_ACPI_DEBUG=y
```

The `.config` on my TOUGHPAD was located at `/boot/config-6.12.25`.

**For the later work, if the following are not enabled, please enable them. If these are not enabled, you cannot override ACPI tables at boot time.**

They were already enabled on Mobian on the TOUGHPAD, but just in case.

```
CONFIG_ARCH_HAS_ACPI_TABLE_UPGRADE=y
CONFIG_ACPI_TABLE_UPGRADE=y
```

#### 5. Compile

Run the following command and wait about 15 minutes. Depending on the specs of the machine doing the compilation, you may wait longer.  
For reference: the CPU I used was `AMD Ryzen 5 7600X 6-Core Processor`.

```
make clean
make -j$(nproc)
```

#### 6. Copy the Build Artifacts to the TOUGHPAD

Since I would run `make install` and so on on the TOUGHPAD side, copy the entire compiled Linux kernel directory to the TOUGHPAD.

The compiled Linux kernel directory is extremely heavy, so moving it was difficult, but when I configured rsync as follows, it finished in about 7 minutes.

Edit `/etc/rsyncd.conf` on the machine used for compilation as follows.

```
uid         = root
gid         = root
log file    = /var/log/rsyncd.log
pid file    = /var/run/rsyncd.pid

[linux-kernel]
path = /home/sh1ma/workspace/linux-6.12.25
```

Adjust `/home/sh1ma/workspace/linux-6.12.25` to match the directory where each person’s Linux kernel is located.

Run the following on the machine used for compilation.

```
rsync --daemon
```

This starts rsyncd, making communication through the rsync protocol (TCP), rather than ssh, available.

After that, run the following on the TOUGHPAD side, and files will be copied quickly.

```
rsync -azvh --info=progress2 --whole-file rsync://192.168.100.12/linux-kernel ~/workspace/
```

#### 7. Install the Build Artifacts

Once the compiled Linux kernel directory has been copied, the work from here is on the TOUGHPAD side.

Because many kernel modules are not actually needed, edit the setting in `/etc/initramfs-tools/initramfs.conf` so that only the necessary ones are installed.

```
MODULES=dep
```

Update initramfs.

```
sudo update-initramfs -u -k 6.12.25
```

Run the following.

```
sudo make modules_install
sudo make install
```

With this, installation is complete! After rebooting, the new kernel should be applied.

### Viewing ACPI Debug Logs

When booting a Linux kernel configured with `CONFIG_ACPI_DEBUG=y` at compile time, files called `debug_level` and `debug_layer` had been added under `/sys/module/acpi/parameters`.

```
mobian@mobian:~$ ls /sys/module/acpi/parameters
acpica_version    debug_layer  ec_busy_polling  ec_event_clearing  ec_max_queries  ec_polling_guard    immediate_undock   trace_debug_level  trace_state
aml_debug_output  debug_level  ec_delay         ec_freeze_events   ec_no_wakeup    ec_storm_threshold  trace_debug_layer  trace_method_name
```

Rewrite these values so that ACPI debug logs are emitted.

First, enter root with the following command. (You cannot write unless you are root, so become root first.)

```
sudo su
```

Inspect the `debug_level` parameter.

```
cat /sys/module/acpi/parameters/debug_level
```

Output ↓

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

Inspect the `debug_layer` parameter.

```
cat /sys/module/acpi/parameters/debug_layer
```

Output ↓

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

As settings for the logs that appear when the A1/A2 buttons are actually pressed, rewriting them as follows worked well.

```
echo 0x200 > /sys/module/acpi/parameters/debug_level
echo 0x82 > /sys/module/acpi/parameters/debug_layer
```

- Setting `debug_level` to `0x200` makes only `ACPI_LV_EXEC` enabled
- Setting `debug_layer` to `0x82` makes `ACPI_HARDWARE` and `ACPI_EXECUTER` enabled

If the above rewrite succeeds, debug logs are enabled. The settings are lost after rebooting.

Check the debug logs. Debug logs appear as kernel logs, so they can be checked with `dmesg -w`.

A large amount of logs flow, but running a command like the following should make them flow at an understandable speed.

[Wade Mealing](https://wmealing.github.io/toughpad-fz-g1-buttons-acpi.html?utm_source=chatgpt.com#enabling-acpi-events)

>

```bash
dmesg -w | grep Notify -A5 -B5
```

The logs to focus on are around Notify, like the following. No matter how many times either the A1 or A2 button is pressed, this log always appears. This is probably safe to treat as the log from pressing the A1/A2 buttons. In particular, `TBTN` in the log looks like a symbol from the DSDT in the ACPI table.

```
[31002.859886]   exresop-0126 ex_resolve_operands   : Opcode 86 [Notify] RequiredOperandTypes=000001A6
[31002.859890]  exresolv-0084 ex_resolve_to_value   : Resolved object 00000000c7a02e9c
[31002.859892]    exdump-0880 ex_dump_operands      : **** Start operand dump for opcode [Notify], 2 operands
[31002.859895]    exdump-0603 ex_dump_operand       : 000000009e1948ee Namespace Node:  0  TBTN Device       000000009e1948ee 001 Notify Object: 00000000dfc93cab
```

### Decompiling the ACPI Table

Let’s organize the situation so far.

- Button press events were not output by input analysis tools such as `libinput debug-events`, `evtest`, and `acpi_listen`
  - From this, the following became clear
    - Input events are not being reported to the [Linux Input SubSystem](https://docs.kernel.org/input/input_uapi.html)
    - ACPI notifications are not reaching userland from the Linux kernel
- Button presses could be detected in Linux kernel logs (`dmesg -w`)

From the above, I learned that “ACPI events are being ignored by the Linux kernel, or are being swallowed.”

So next, as in the operations in the [FZ-G1-Mk3 | Wade Mealing](https://wmealing.github.io/toughpad-fz-g1-buttons-acpi.html?utm_source=chatgpt.com#acpi-tables) blog, dump the ACPI table and decompile the DSDT. Then investigate the definition of `TBTN` found earlier. The work of decompiling → overriding DSDT is written in more detail on the following page.

[DSDT - ArchWiki](https://wiki.archlinux.jp/index.php/DSDT)

First, install `acpica-tool`, a tool for investigation.

```bash
sudo apt install acpica-tool
```

Dump the ACPI table with the `acpidump` command. (Multiple files will be generated in the current directory, so I recommend doing this in a working directory.)

```bash
sudo acpidump -b
```

After running it, dumped ACPI binary files are output in the current directory.

```
mobian@mobian:~/tmp$ ls
 apic.dat    dsdt.dat   hpet.dat   pcct.dat     ssdt12.dat   ssdt2.dat   ssdt6.dat   tcpa.dat
'asf!.dat'   facp.dat   lpit.dat   slic.dat     ssdt13.dat   ssdt3.dat   ssdt7.dat
 bgrt.dat    facs.dat   mcfg.dat   ssdt10.dat   ssdt14.dat   ssdt4.dat   ssdt8.dat
 dmar.dat    fpdt.dat   msdm.dat   ssdt11.dat   ssdt1.dat    ssdt5.dat   ssdt9.dat
```

Of these, only dsdt.dat is used.
The following command generates `dsdt.dsl`, a decompiled file from `dsdt.dat`.

```bash
iasl -d dsdt.dat
```

I saved the generated `dsdt.dsl` in the following gist.  
[TOUGHPAD FZ-G1 ACPI DSDT Table](https://gist.github.com/sh1ma/2c44b2da7445de88fdc1b599d3159da8)

I’ll investigate `TBTN` from `dsdt.dsl`.  
Searching for `TBTN` reveals a section like the following.

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

Several methods are tied to `Device (TBTN)`.
Among them, `_HID` is a reference that returns a hardware-specific ID.

According to section 6.1.5 of the [latest ACPI Spec](https://uefi.org/sites/default/files/resources/ACPI_Spec_6.5a_Final.pdf), `_HID` is described as follows.

> 6.1.5 \_HID (Hardware ID)
>
> This object is used to supply OSPM with the device’s PNP ID or ACPI ID.  
> (Japanese translation: This object is used to provide the device’s PNP ID or ACPI ID to OSPM.)
> ）

OSPM is an abbreviation for “Operating System-directed configuration and Power Management,” and it should be fine to rephrase it as ACPI. In other words, it is reasonable to understand it as a method that tells the OS the HID.

I understood that much, but what bothered me was that it looked different from other HIDs. Specifically, the following two points differ.

- Other HIDs in `dsdt.dsl` are in a format like `Name (_HID, EisaId ("PNP0C02")`. This is defined as a constant function where `EisaId ("PNP0C02")` is always returned when the `_HID` method is invoked, whereas the `_HID` method of `TBTN` has conditional branching.
- Other `_HID`s return strings wrapped in `EisaId()`, whereas `TBTN`’s `_HID` returns primitive numbers.

I wondered whether `_HID` also permits numeric types, so I continued reading the ACPI Spec and learned the following.

- `EisaId()` is a macro that converts a string EISA ID to a numeric type
  - It was mentioned in _19.6.37 EISAID (EISA ID String To Integer Conversion Macro)_ of the [ACPI Spec](https://uefi.org/sites/default/files/resources/ACPI_Spec_6.5a_Final.pdf)
- The return value of `_HID` is either a string or a number
  - If it is a string, it is a PNP ID or ACPI ID composed of alphanumeric characters
    - PNP ID and ACPI ID are described in detail in [PNP ID and ACPI ID Registry | Unified Extensible Firmware Interface Forum](https://uefi.org/PNP_ACPI_Registry)
  - If it is numeric, it is a 32-bit compressed EISA type ID
    - This number can be converted to a string HID. In _19.3.4 ASL Macros_ of the [ACPI Spec](https://uefi.org/sites/default/files/resources/ACPI_Spec_6.5a_Final.pdf), it is mentioned as follows
      > Converts and compresses the 7-character text argument into its corresponding 4-byte numeric EISA ID encoding (Integer). This can be used when declaring IDs for devices that are EISA IDs.
    - It also introduced the procedure for converting from a 32-bit compressed EISA type ID to a string

At this point I knew that the return value of `TBTN`’s `_HID` is a 32-bit compressed EISA type ID, so I wrote a script to decode the two return values from `TBTN`’s `_HID` above.

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

The output was as follows.

```
❯ python decode.py
0x2A003434 -> MAT002A
0x2B003434 -> MAT002B
```

I looked at the HIDs of several other defined devices, and there were several with the prefix `MAT`. Therefore the decoded result seems correct.

Once the HID is known, the rest is the work of writing a driver.

I’ll put the resulting work below.

[sh1ma/tbtn-driver: TOUGPAD TBTN (A1, A2 buttons) Linux kernel driver](https://github.com/sh1ma/tbtn-driver)

[You can watch a video of the A1/A2 buttons working here](https://cdn.sh1ma.dev/IMG_1051.mp4)

## Summary

Before writing the real driver, I actually rewrote the DSDT `TBTN` HID to the fixed value `PNP0C40`, overrode the ACPI table, wrote a driver for that, and got it working, but I omitted that from the article. (Writing it became a pain.)  
I’d like to write another article as a memo about how to override DSDT and such.
