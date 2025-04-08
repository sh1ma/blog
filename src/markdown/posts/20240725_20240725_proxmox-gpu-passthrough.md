---
title: ProxmoxのVMにRTX3060をGPUパススルー
publishedAt: "2024-07-25"
---

ブログ書かなきゃ・・・  
最近色々やったんですが特にブログに残せてなかったの悲しい。

今回はProxmoxのVMでGPU使ってOllama動かせたのでメモがてらやったことを書いていきます。

## 環境

```
pve-manager/8.2.4/faa83925c9641325 (running kernel: 6.8.8-3-pve)
```

あとRTX3060のOCモデル

## Proxmox上以外で事前にやっておくこと

- IOMMUを有効にする(Intel VT-dとかAMD-Vi)
  - BIOSから有効にできるよ

## 手順

### 1. そもそもGPU刺さってるか確認する

認識されてないみたいなこともあるかもだしね。
`lspci{:sh}`はPCIデバイスを一覧するコマンド。
`lspci -nn{:sh}`でデバイス名とデバイスIDが出力される。

```bash
lspci -nn | grep -i nvidia
```

大体以下のような感じで出力される。

```
01:00.0 VGA compatible controller [0300]: NVIDIA Corporation GA106 [GeForce RTX 3060 Lite Hash Rate] [xxxx:xxxx] (rev a1)
01:00.1 Audio device [0403]: NVIDIA Corporation GA106 High Definition Audio Controller [yyyy:yyyy] (rev a1)
```

`xxxx:xxxx`と`yyyy:yyyy`はあとで使うのでメモっておく。

### 2. IOMMUを有効化する

**(Optional) IOMMUが有効化されているか確認する**

確認コマンドは以下の通り。
`dmesg{:sh}`はカーネルの起動時の出力を見るコマンド。そこにIOMMUに関する情報がでていなかったら有効になってなさそう。

```bash
dmesg | grep -e DMAR -e IOMMU
```

AMDのCPU使ってるならこんな感じの表示が出る

```
[    3.358781] pci 0000:00:00.2: AMD-Vi: IOMMU performance counters supported
[    3.426345] perf/amd_iommu: Detected AMD IOMMU #0 (2 banks, 4 counters/bank).
```

参考：[PCI Passthrough - Proxmox VE](https://pve.proxmox.com/wiki/PCI_Passthrough#Verify_IOMMU_is_enabled)

VMにGPUパススルーをするにはPCIパススルーが必要で、PCIパススルーをするにはIOMMUを有効化する必要がある。これによってVM上でホストマシンのデバイスを使うことができる。  
IOMMUを有効化するにはカーネルパラメータを弄る必要があって、それはブートローダーの設定`/etc/default/grub`を弄ることで実現できる。

#### 本題

好きなエディタで`/etc/default/grub`を開く

```bash
vim /etc/default/grub
```

以下のようになっている行を見つける

```bash
GRUB_CMDLINE_LINUX_DEFAULT="quiet"
```

ここを編集するのだが、Intel CPUを使っているかAMD CPUを使っているかで設定内容が異なる。  
自分はAMD CPUを使っているので以下のように設定した。

```bash
GRUB_CMDLINE_LINUX_DEFAULT="quiet amd_iommu=on"
```

Intel CPUを使っている場合は以下の通り

```bash
GRUB_CMDLINE_LINUX_DEFAULT="quiet intel_iommu=on"
```

変更し、保存したら以下のコマンドを実行

```bash
update-grub
```

設定を反映するために一度再起動する

```bash
reboot
```

参考：[OVMF による PCI パススルー - ArchWiki](https://wiki.archlinux.jp/index.php/OVMF_%E3%81%AB%E3%82%88%E3%82%8B_PCI_%E3%83%91%E3%82%B9%E3%82%B9%E3%83%AB%E3%83%BC#IOMMU_.E3.81.AE.E6.9C.89.E5.8A.B9.E5.8C.96)。  
参考：[カーネルパラメータ - ArchWiki](https://wiki.archlinux.jp/index.php/%E3%82%AB%E3%83%BC%E3%83%8D%E3%83%AB%E3%83%91%E3%83%A9%E3%83%A1%E3%83%BC%E3%82%BF)

### 3. VFIOモジュールのロード

VFIOと呼ばれるカーネルモジュールをロードする。VFIOを使えば非特権のユーザスペース(=VM内)でも安全にデバイスが扱えるらしい。

`/etc/modules`に以下を追記する。

```
vfio
vfio_iommu_type1
vfio_pci
vfio_virqfd
```

そしてVFIOの設定ファイル`/etc/modprobe.d/vfio.conf`を作成する。  
先ほどの`lspci -nn | grep -i nvidia{:sh}`で取得したidをここで使う。
以下の「xxxx:xxxx」や「yyyy:yyyy」を置き換えて追記する。

```
options vfio-pci ids=xxxx:xxxx,yyyy:yyyy
```

次に、既存のドライバを無効化しておく。これによりホストOS(Proxmox)がGPUを使用しなくなり、VMのみが使用するようにできる。
VM

```
blacklist nouveau
blacklist nvidia
blacklist nvidia-drm
blacklist nvidia-modeset
```

`initramfs`の情報を更新する。`initramfs`は初期RAMイメージで、上記更新前のGPUドライバの情報などを持っているため、更新する必要がある。

```bash
update-initramfs -u
```

最後に再起動してホストOSの設定はおしまい。

```bash
reboot
```

### 4. VMのセットアップ

#### 対象のVMを決める

GPUパススルーをするVMを新規作成。もしくは決める。GPUパススルーできるのはVM一つだけらしい。

決めたらProxmoxのWeb UIからVMの設定で「ハードウェア」タブに移動し、「PCIデバイスを追加」を選択。NvidiaのGPUを選択する。

「すべての機能(All Functions)」にチェックをして保存する。

#### VMにドライバをインストール

VM内で以下のコマンドを実行する

```bash
apt update
apt install nvidia-detect
```

そこで表示されたNvidia GPUドライバを`apt install`する。  
`nvidia-driver`をインストールする場合は以下の通り

```
apt install nvidia-driver
```

再起動

```
reboot
```

インストールが正しく完了していれば以下のコマンドが使えるようになっている

```
nvidia-smi
```

## まとめ

なんか途中転けた場面もあった記憶があったけど端折ってます。大体これでいけるはず。
