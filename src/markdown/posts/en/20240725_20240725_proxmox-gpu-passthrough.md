---
title: GPU Passthrough of an RTX3060 to a Proxmox VM
publishedAt: "2024-07-25"
---

I have to write a blog post...  
I’ve done various things recently, but it’s sad that I haven’t really recorded them on the blog.

This time I was able to run Ollama using a GPU on a Proxmox VM, so I’ll write down what I did as a memo.

## Environment

```
pve-manager/8.2.4/faa83925c9641325 (running kernel: 6.8.8-3-pve)
```

Also an OC model RTX3060.

## Things to Do in Advance Outside Proxmox

- Enable IOMMU (Intel VT-d or AMD-Vi)
  - You can enable it from the BIOS

## Steps

### 1. First, Check Whether the GPU Is Inserted

There might be cases where it isn’t recognized.
`lspci{:sh}` is a command that lists PCI devices.
`lspci -nn{:sh}` outputs device names and device IDs.

```sh
lspci -nn | grep -i nvidia
```

It generally outputs something like the following.

```
01:00.0 VGA compatible controller [0300]: NVIDIA Corporation GA106 [GeForce RTX 3060 Lite Hash Rate] [xxxx:xxxx] (rev a1)
01:00.1 Audio device [0403]: NVIDIA Corporation GA106 High Definition Audio Controller [yyyy:yyyy] (rev a1)
```

Make a note of `xxxx:xxxx` and `yyyy:yyyy` because they will be used later.

### 2. Enable IOMMU

**(Optional) Check whether IOMMU is enabled**

The command for checking is as follows.
`dmesg{:sh}` is a command that lets you see the kernel’s boot output. If information related to IOMMU does not appear there, it probably isn’t enabled.

```sh
dmesg | grep -e DMAR -e IOMMU
```

If you are using an AMD CPU, output like this appears.

```
[    3.358781] pci 0000:00:00.2: AMD-Vi: IOMMU performance counters supported
[    3.426345] perf/amd_iommu: Detected AMD IOMMU #0 (2 banks, 4 counters/bank).
```

Reference: [PCI Passthrough - Proxmox VE](https://pve.proxmox.com/wiki/PCI_Passthrough#Verify_IOMMU_is_enabled)

To do GPU passthrough to a VM, PCI passthrough is required, and to do PCI passthrough, IOMMU must be enabled. This allows devices on the host machine to be used from within the VM.  
To enable IOMMU, you need to adjust kernel parameters, and that can be done by editing the bootloader configuration `/etc/default/grub`.

#### Main Topic

Open `/etc/default/grub` in your favorite editor.

```sh
vim /etc/default/grub
```

Find the line that looks like the following.

```sh
GRUB_CMDLINE_LINUX_DEFAULT="quiet"
```

You edit this part, but the setting differs depending on whether you are using an Intel CPU or an AMD CPU.  
I am using an AMD CPU, so I configured it as follows.

```sh
GRUB_CMDLINE_LINUX_DEFAULT="quiet amd_iommu=on"
```

If you are using an Intel CPU, it is as follows.

```sh
GRUB_CMDLINE_LINUX_DEFAULT="quiet intel_iommu=on"
```

After changing and saving it, run the following command.

```sh
update-grub
```

Reboot once to apply the settings.

```sh
reboot
```

Reference: [PCI Passthrough via OVMF - ArchWiki](https://wiki.archlinux.jp/index.php/OVMF_%E3%81%AB%E3%82%88%E3%82%8B_PCI_%E3%83%91%E3%82%B9%E3%82%B9%E3%83%AB%E3%83%BC#IOMMU_.E3.81.AE.E6.9C.89.E5.8A.B9.E5.8C.96).  
Reference: [Kernel Parameters - ArchWiki](https://wiki.archlinux.jp/index.php/%E3%82%AB%E3%83%BC%E3%83%8D%E3%83%AB%E3%83%91%E3%83%A9%E3%83%A1%E3%83%BC%E3%82%BF)

### 3. Loading VFIO Modules

Load the kernel modules called VFIO. Apparently, using VFIO allows devices to be handled safely even from unprivileged userspace (= inside the VM).

Add the following to `/etc/modules`.

```
vfio
vfio_iommu_type1
vfio_pci
vfio_virqfd
```

Then create the VFIO configuration file `/etc/modprobe.d/vfio.conf`.  
Use the IDs obtained earlier with `lspci -nn | grep -i nvidia{:sh}` here.
Replace “xxxx:xxxx” and “yyyy:yyyy” below and add it.

```
options vfio-pci ids=xxxx:xxxx,yyyy:yyyy
```

Next, disable the existing drivers. This prevents the host OS (Proxmox) from using the GPU and allows only the VM to use it.
VM

```
blacklist nouveau
blacklist nvidia
blacklist nvidia-drm
blacklist nvidia-modeset
```

Update the `initramfs` information. `initramfs` is the initial RAM image, and because it contains information such as the GPU drivers from before the updates above, it needs to be updated.

```sh
update-initramfs -u
```

Finally, reboot and the host OS setup is done.

```sh
reboot
```

### 4. Setting Up the VM

#### Decide the Target VM

Create a new VM for GPU passthrough, or decide which existing VM to use. Apparently only one VM can use GPU passthrough.

Once decided, from the Proxmox Web UI, go to the VM settings, move to the “Hardware” tab, and select “Add PCI Device”. Select the Nvidia GPU.

Check “All Functions” and save.

#### Install Drivers in the VM

Run the following commands inside the VM.

```sh
apt update
apt install nvidia-detect
```

Install the Nvidia GPU driver shown there with `apt install`.  
If installing `nvidia-driver`, it is as follows.

```
apt install nvidia-driver
```

Reboot.

```
reboot
```

If the installation completed correctly, the following command should be available.

```
nvidia-smi
```

## Summary

I remember there were some points where I stumbled partway through, but I’m omitting them. This should mostly work.
