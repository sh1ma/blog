---
title: Passing an RTX 3060 through to a Proxmox VM
publishedAt: "2024-07-25"
---

I really need to write more blog posts...  
I've done all sorts of things lately but haven't written any of it down, which is a shame.

This time I got Ollama running on a GPU inside a Proxmox VM, so here are my notes on how I did it.

## Environment

```
pve-manager/8.2.4/faa83925c9641325 (running kernel: 6.8.8-3-pve)
```

Plus an OC-model RTX 3060.

## Prerequisites outside of Proxmox

- Enable IOMMU (Intel VT-d or AMD-Vi)
  - You can turn this on in the BIOS

## Steps

### 1. Check that the GPU is actually installed

It's possible the card isn't being detected at all, so let's confirm.
`lspci{:sh}` lists PCI devices.
`lspci -nn{:sh}` also prints device names alongside their device IDs.

```sh
lspci -nn | grep -i nvidia
```

The output usually looks something like this:

```
01:00.0 VGA compatible controller [0300]: NVIDIA Corporation GA106 [GeForce RTX 3060 Lite Hash Rate] [xxxx:xxxx] (rev a1)
01:00.1 Audio device [0403]: NVIDIA Corporation GA106 High Definition Audio Controller [yyyy:yyyy] (rev a1)
```

Note down `xxxx:xxxx` and `yyyy:yyyy` — we'll need them later.

### 2. Enable IOMMU

**(Optional) Check whether IOMMU is already enabled**

Use the command below to check.
`dmesg{:sh}` prints the kernel's boot messages. If nothing IOMMU-related shows up in there, it probably isn't enabled.

```sh
dmesg | grep -e DMAR -e IOMMU
```

On an AMD CPU, you'll see something like this:

```
[    3.358781] pci 0000:00:00.2: AMD-Vi: IOMMU performance counters supported
[    3.426345] perf/amd_iommu: Detected AMD IOMMU #0 (2 banks, 4 counters/bank).
```

Reference: [PCI Passthrough - Proxmox VE](https://pve.proxmox.com/wiki/PCI_Passthrough#Verify_IOMMU_is_enabled)

GPU passthrough to a VM requires PCI passthrough, and PCI passthrough in turn requires IOMMU. Together they let a VM use devices attached to the host.  
Enabling IOMMU means changing a kernel parameter, which we do by editing the bootloader config at `/etc/default/grub`.

#### The actual work

Open `/etc/default/grub` in your editor of choice.

```sh
vim /etc/default/grub
```

Find the line that looks like this:

```sh
GRUB_CMDLINE_LINUX_DEFAULT="quiet"
```

This is the line to edit, but the value differs between Intel and AMD CPUs.  
I'm on an AMD CPU, so I set it like this:

```sh
GRUB_CMDLINE_LINUX_DEFAULT="quiet amd_iommu=on"
```

On an Intel CPU, use this instead:

```sh
GRUB_CMDLINE_LINUX_DEFAULT="quiet intel_iommu=on"
```

Save the file, then run:

```sh
update-grub
```

Reboot once to apply the change.

```sh
reboot
```

Reference: [PCI Passthrough via OVMF - ArchWiki](https://wiki.archlinux.jp/index.php/OVMF_%E3%81%AB%E3%82%88%E3%82%8B_PCI_%E3%83%91%E3%82%B9%E3%82%B9%E3%83%AB%E3%83%BC#IOMMU_.E3.81.AE.E6.9C.89.E5.8A.B9.E5.8C.96).  
Reference: [Kernel Parameters - ArchWiki](https://wiki.archlinux.jp/index.php/%E3%82%AB%E3%83%BC%E3%83%8D%E3%83%AB%E3%83%91%E3%83%A9%E3%83%A1%E3%83%BC%E3%82%BF)

### 3. Load the VFIO modules

Next, load the kernel modules known as VFIO. From what I gather, VFIO is what lets unprivileged userspace (i.e. the guest VM) drive the device safely.

Add the following to `/etc/modules`:

```
vfio
vfio_iommu_type1
vfio_pci
vfio_virqfd
```

Then create a VFIO config file at `/etc/modprobe.d/vfio.conf`.  
Reuse the IDs you noted from `lspci -nn | grep -i nvidia{:sh}` earlier.
Substitute your own values in for "xxxx:xxxx" and "yyyy:yyyy" below:

```
options vfio-pci ids=xxxx:xxxx,yyyy:yyyy
```

Next, blacklist the existing drivers so the host OS (Proxmox) stops using the GPU, leaving it to the VM.

```
blacklist nouveau
blacklist nvidia
blacklist nvidia-drm
blacklist nvidia-modeset
```

Regenerate the `initramfs`. It's the initial RAM image, and it still holds the old GPU driver configuration from before our changes, so it needs to be rebuilt.

```sh
update-initramfs -u
```

Finally, reboot — that's it for the host OS setup.

```sh
reboot
```

### 4. Set up the VM

#### Pick the target VM

Either create a new VM for GPU passthrough or pick an existing one. As I understand it, only one VM can receive the GPU.

Once you've picked one, open its settings in the Proxmox Web UI, go to the "Hardware" tab, click "Add PCI Device", and select the Nvidia GPU.

Check "All Functions" and save.

#### Install the driver inside the VM

Inside the VM, run:

```sh
apt update
apt install nvidia-detect
```

Then `apt install` whichever Nvidia GPU driver `nvidia-detect` recommends.  
If it says to install `nvidia-driver`, that looks like this:

```
apt install nvidia-driver
```

Reboot:

```
reboot
```

If everything installed correctly, `nvidia-smi` should now be available:

```
nvidia-smi
```

## Wrap-up

I vaguely remember tripping over a few things along the way, but I'm glossing over those. This should get you most of the way there.
