---
title: Mobian（Debian）でTOUGHPADのA1/A2ボタンを動くようにした
publishedAt: "2025-05-10"
---

お久しぶりです。  
ブログの更新をずっとサボっていました。ネタがないわけではないんですが遅筆ゆえに書くのが億劫になってしまっていて、お蔵入りしている記事がいくつか・・・。書き途中のものを一ヶ月後とかに書き加えていこうとしてもできないらしいということに最近気づきました。一ヶ月も前の自分なんてほぼ他人ですからね。今月から一ヶ月に一回くらい投稿したいなという、そういう気持ちです。

さて、先日アキバでジャンク品になっていたTOUGHPAD（型番：FZ-G1）を友人から入手しました。購入時には初期化済みでOSが入っていなかったのでDebainに[Phosh](https://phosh.mobi/)（スマホ向けのGUI環境）を統合した[Mobian](https://mobian-project.org/)インストールしてみることにしました（TOUGHPADは友人間で何枚か買ったようで、中にはArch Linuxを入れてGUIに[Plasma Mobile](https://plasma-mobile.org/ja/)を採用している人もいました）。

![Mobianのスプラッシュスクリーン](https://p.ipic.vip/z8sc26.jpeg)

![Mobianのパスコード入力画面](https://p.ipic.vip/dhbwj2.jpeg)

設定の `Displays`から`Scale`を`200%`にするとかなり見栄えが良くなりました

![MobianのDisplays設定。Scaleが200%になっている](https://p.ipic.vip/q2ul6u.jpeg)

![Mobianのホーム画面](https://p.ipic.vip/6csxup.jpeg)

Mobianを入れてしばらくブラウザでの動画視聴やDiscord等のソフトウェアが動くことにテンションが上がったりしていたのですが、しばらく触ってみて気づいたことがあります。A1ボタンとA2ボタンが動かないのです。厳密にいうと、物理ボタンのうちA1ボタンとA2ボタンだけが動かないのです。TOUGHPADを購入した友人もみなこのA1/A2ボタンが動かない問題に直面していました。

ここで「なんだ。動かないのか。」で終わることもできたのですが、「他のボタンは完璧に動作するのにA1/A2ボタンだけが動かない」という現象に自分は興味を惹かれたので、「A1/A2ボタンでスクリーンショットを撮影する」ことを目標に調査することにしました。

## 調査

### 入力がOSに認識されているか調べる

まずはどのデバイスからの入力を特定する必要があると考え、`evtest`コマンドでの解析を試みました。以下は`evtest`コマンドを引数なしで実行したときの出力です

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

いくつかのeventデバイスにあたりをつけて調べていくと以下のことがわかりました。

- `/dev/input/event11`は電源ボタンを押すとイベントが発火する
- `/dev/input/event12`は音量小・音量大ボタンを押すと発火する
- `/dev/input/event13`はWindowsボタン・画面回転ボタンを押すと発火する

ただし、いずれのイベントファイルもA1/A2ボタンの押下により発火することはありませんでした。一応`libinput debug-events`や`acpi_listen`を使用したりもしてみましたが、こちらも反応しませんでした。

入力イベントをキャプチャする方法を調べようとしていると以下のブログを友人が共有してくれました。

[FZ-G1-Mk3 | Wade Mealing](https://wmealing.github.io/toughpad-fz-g1-buttons-acpi.html?utm_source=chatgpt.com)

このブログの「FZ-G1に入れたLinuxでA1/A2ボタンが動かない」というほぼ同じシチュエーションをもとにした考察は自分にとってはかなり有用でした。

このブログではまとめると以下のようなことが書かれていました。

- A1/A2ボタンは`libinput debug-events`では反応しない←自分と同様
- [KaarelP2rtel/panasonic-hbtn: Panasonic Toughpad FZ-M1 Tablet Button driver for Linux](https://github.com/KaarelP2rtel/panasonic-hbtn)に近い実装がある。←このボタンがACPI経由で動作するものであることを示唆している
- Linuxカーネルの`CONFIG_ACPI_DEBUG=y`を有効にするとACPIのデバッグログ機能が有効化できるようになる。ACPIのデバッグログを有効にすると、A1/A2ボタン発火時にカーネルログが流れる（`dmesg`で確認できる）
- 流れたカーネルログをもとにACPIテーブルを確認し、`Device (HKEY)`こそが発火元であると推測し、簡単なドライバを書いてみたが効果はなかった

このうち「ACPIのデバッグログを有効にするとボタン押下時にカーネルログが流れる」は試す価値がありそうだったので試すことにしました。

### Linuxカーネルのコンパイル〜インストール

Linuxカーネルのコンパイルの手順は他の方が詳しく書いている記事が転がってると思うのでここでは簡単にやったことを書きます。
スペック的にTOUGHPADでLinuxカーネルをコンパイルするのはかなり時間がかかりそうだと判断し、コンパイルに関しては別のx86_64マシンを用意し、そこで行いました。

#### 1. Linuxカーネルの依存の用意

依存は以下のコマンドで用意できます

```bash
sudo apt build-dep linux
```

#### 2. Linuxカーネルのソースコードの用意

TOUGHPADのLinuxカーネルバージョンは6.12.25だったのでlinux-6.12.28.tar.xzを落としてきます。

```
curl -LO https://cdn.kernel.org/pub/linux/kernel/v6.x/linux-6.12.28.tar.xz
```

解凍は以下のコマンドでできます。

```
tar -xf linux-6.12.25.tar.xz
```

#### 4. .configの用意

Linuxカーネルコンパイル時の設定が`.config`に記述されます。  
先の`CONFIG_ACPI_DEBUG=y`もここで記述します。Mobianのconfigと差異があってはいけないのでMobianのconfigをTOUGHPADから持ってきて、`CONFIG_ACPI_DEBUG`の項目を`y`に編集してLinuxカーネルのソースコードのディレクトリの中に`.config`という名前で配置します（このときついでにいくつか別のも有効化したんですが忘れました）。

```
CONFIG_ACPI_DEBUG=y
```

自分のTOUGHPAD上の`.config`は`/boot/config-6.12.25`にありました。

**あとの作業のため、もし以下が有効でなければ有効にしてください。これを有効化しないとブートタイムでのACPIテーブルの上書きが出来ません。**

TOUGHPAD上のMobianでは既に有効化されてはいましたが念の為。

```
CONFIG_ARCH_HAS_ACPI_TABLE_UPGRADE=y
CONFIG_ACPI_TABLE_UPGRADE=y
```

#### 5. コンパイル

以下のコマンドを実行して15分くらい待ちます。コンパイルするマシンのスペックによってはもっと待つと思います。  
参考までに：自分が使ったCPUは`AMD Ryzen 5 7600X 6-Core Processor`です

```
make clean
make -j$(nproc)
```

#### 6. 成果物をTOUGHPADにコピーする

TOUGHPAD側で`make install`などを行うのでコンパイル後のLinuxカーネルのディレクトリをそっくりそのままTOUGHPADにコピーしてください。

コンパイル後のLinuxカーネルのディレクトリはめちゃくちゃ重いので移動が大変でしたが、以下のようにrsyncを設定すると7分くらいで終わりました。

コンパイルしたマシンの`/etc/rsyncd.conf`を以下のように編集

```
uid         = root
gid         = root
log file    = /var/log/rsyncd.log
pid file    = /var/run/rsyncd.pid

[linux-kernel]
path = /home/sh1ma/workspace/linux-6.12.25
```

`/home/sh1ma/workspace/linux-6.12.25`は各自のLinuxカーネルの置いてあるディレクトリに合わせてください。

コンパイルしたマシンで以下を実行

```
rsync --daemon
```

これでrsyncdが起動し、sshではなくrsyncプロトコル（TCP）を介した通信が使えるようになります。

その後、TOUGHPAD側で以下を実行すると高速でファイルがコピーされていきます

```
rsync -azvh --info=progress2 --whole-file rsync://192.168.100.12/linux-kernel ~/workspace/
```

#### 7. 成果物のインストール

コンパイル済みのLinuxカーネルのディレクトリがコピーできればここからはTOUGHPAD側の作業です。

カーネルモジュールは実際には不要なものが多いため、`/etc/initramfs-tools/initramfs.conf`で設定を編集して必要なもののみインストールするよう変更します。

```
MODULES=dep
```

initramfsを更新します

```
sudo update-initramfs -u -k 6.12.25
```

以下を実行します

```
sudo make modules_install
sudo make install
```

ここまででインストールは完了です！再起動後に新しいカーネルが適用されているはずです

### ACPIのデバッグログを見る

コンパイルタイムで`CONFIG_ACPI_DEBUG=y`に設定されたLinuxカーネルを起動すると、`/sys/module/acpi/parameters`に`debug_level`と`debug_layer`というファイルが追加されていました。

```
mobian@mobian:~$ ls /sys/module/acpi/parameters
acpica_version    debug_layer  ec_busy_polling  ec_event_clearing  ec_max_queries  ec_polling_guard    immediate_undock   trace_debug_level  trace_state
aml_debug_output  debug_level  ec_delay         ec_freeze_events   ec_no_wakeup    ec_storm_threshold  trace_debug_layer  trace_method_name
```

これの値を書き換えてACPIのデバッグログが吐かれるようにします。

まずは以下のコマンドでrootに入ります（rootでなければ書き込めないので先にrootになっておきます）。

```
sudo su
```

`debug_level`パラメータを覗きます

```
cat /sys/module/acpi/parameters/debug_level
```

出力↓

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

`debug_layer`パラメータを覗きます

```
cat /sys/module/acpi/parameters/debug_layer
```

出力↓

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

実際にA1/A2ボタンが押されたときに流れるログの設定としては、以下のように書き換えるとよかったです。

```
echo 0x200 > /sys/module/acpi/parameters/debug_level
echo 0x82 > /sys/module/acpi/parameters/debug_layer
```

- `debug_level`を`0x200`に設定すると`ACPI_LV_EXEC`のみ有効な状態になる
- `debug_layer`を`0x82`に設定すると`ACPI_HARDWARE`と`ACPI_EXECUTER`が有効な状態になる

上記が書き換えが成功しているとデバッグログは有効になります。再起動すると設定は失われます。

デバッグログを確認します。デバッグログはカーネルログとして出るので`dmesg -w`で確認ができます。

ログは大量に流れますが、以下のようなコマンドで実行するとわかりやすい流速で流れると思います。

[Wade Mealing](https://wmealing.github.io/toughpad-fz-g1-buttons-acpi.html?utm_source=chatgpt.com#enabling-acpi-events)

>

```bash
dmesg -w | grep Notify -A5 -B5
```

注目すべきはNotify付近の以下のようなログです。A1/A2ボタンのどちらを何度押してもこのログは必ず流れます。恐らくこれがA1/A2ボタンを押したときのログとみて間違いなさそうです。特に、ログ中の`TBTN`はACPIテーブルのDSDTのシンボルに見えます。

```
[31002.859886]   exresop-0126 ex_resolve_operands   : Opcode 86 [Notify] RequiredOperandTypes=000001A6
[31002.859890]  exresolv-0084 ex_resolve_to_value   : Resolved object 00000000c7a02e9c
[31002.859892]    exdump-0880 ex_dump_operands      : **** Start operand dump for opcode [Notify], 2 operands
[31002.859895]    exdump-0603 ex_dump_operand       : 000000009e1948ee Namespace Node:  0  TBTN Device       000000009e1948ee 001 Notify Object: 00000000dfc93cab
```

### ACPIテーブルの逆コンパイル

ここまでの状況を整理します。

- `libinput debug-events`、`evtest`、`acpi_listen`といった入力分析ツールではボタン押下イベントは出力されなかった
  - このことから、以下のことがわかりました
    - [Linux Input SubSystem](https://docs.kernel.org/input/input_uapi.html)には入力イベントが報告されていない
    - ACPIの通知がLinuxのカーネルからユーザランドに届いていない
- Linuxカーネルのログ（`dmesg -w`）ではボタンの押下を検知できた

以上のことから「ACPIイベントがLinuxカーネルに無視されている、または握りつぶされている」ことがわかりました。

なので次は[FZ-G1-Mk3 | Wade Mealing](https://wmealing.github.io/toughpad-fz-g1-buttons-acpi.html?utm_source=chatgpt.com#acpi-tables)のブログの操作と同様に、ACPIテーブルをダンプしDSDTを逆コンパイルします。そして先ほど見つけた`TBTN`の定義について探索します。逆コンパイル→DSDTを上書きする作業については以下のページにより詳しく書かれています。

[DSDT - ArchWiki](https://wiki.archlinux.jp/index.php/DSDT)

まずは調査のためのツール`acpica-tool`をインストールします。

```bash
sudo apt install acpica-tool
```

`acpidump`コマンドでACPIテーブルをダンプします（カレントディレクトリに複数のファイルが生成されるので作業用ディレクトリで行うことをおすすめします）。

```bash
sudo acpidump -b
```

実行後、カレントディレクトリにダンプされたACPIのバイナリファイルが出力されます

```
mobian@mobian:~/tmp$ ls
 apic.dat    dsdt.dat   hpet.dat   pcct.dat     ssdt12.dat   ssdt2.dat   ssdt6.dat   tcpa.dat
'asf!.dat'   facp.dat   lpit.dat   slic.dat     ssdt13.dat   ssdt3.dat   ssdt7.dat
 bgrt.dat    facs.dat   mcfg.dat   ssdt10.dat   ssdt14.dat   ssdt4.dat   ssdt8.dat
 dmar.dat    fpdt.dat   msdm.dat   ssdt11.dat   ssdt1.dat    ssdt5.dat   ssdt9.dat
```

使用するのはこのうちdsdt.datのみです。
以下のコマンド`dsdt.dat`を逆コンパイルしたファイル`dsdt.dsl`が生成されます。

```bash
iasl -d dsdt.dat
```

生成された`dsdt.dsl`を以下のgistに保存しておきました。  
[TOUGHPAD FZ-G1 ACPI DSDT Table](https://gist.github.com/sh1ma/2c44b2da7445de88fdc1b599d3159da8)

`dsdt.dsl`から`TBTN`について調べていきます。  
`TBTN`で検索すると以下のような記述が現れます。

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

[gistの該当箇所](https://gist.github.com/sh1ma/2c44b2da7445de88fdc1b599d3159da8#file-dsdt-dsl-L18182-L18198)

`Device (TBTN)`にはいくつかのメソッドが紐づいています。
そのうち`_HID`はハードウェア固有のIDを返す参照です。

[ACPIの最新のSpec](https://uefi.org/sites/default/files/resources/ACPI_Spec_6.5a_Final.pdf)の6.1.5によると`_HID`は以下のような説明されています。

> 6.1.5 \_HID (Hardware ID)
>
> This object is used to supply OSPM with the device’s PNP ID or ACPI ID.  
> （和訳：このオブジェクトは、デバイスの PNP ID または ACPI ID を OSPM に提供するために使用されます。）
> ）

OSPMとは「OS主導の構成と電源管理（原語：Operating System-directed configuration and Power
Management）」の略で、ACPIと言い換えて問題ないはずです。つまりOSにHIDを伝えるメソッドと理解して差し支えないでしょう。

ここまではわかったのですが気になったのは他のHIDと様相が異なることです。具体的には、以下の２つの点が異なります。

- `dsdt.dsl`の他のHIDは`Name (_HID, EisaId ("PNP0C02")`のような形式です。これは`_HID`のメソッドが叩かれたときには常に`EisaId ("PNP0C02")`が返るような定数関数として定義されているのに対し、`TBTN`の`_HID`メソッドには条件分岐があります。
- 他の`_HID`は`EisaId()`に包まれた文字列を返しているのに対し、`TBTN`の`_HID`はプリミティブな数値を返します。

`_HID`が数値型も許容するのか疑問だったのでACPI Specを読み進めたところ、以下のことがわかりました。

- `EisaId()`は文字列のEISA IDを数値型に変換するマクロ
  - [ACPI Spec](https://uefi.org/sites/default/files/resources/ACPI_Spec_6.5a_Final.pdf)の _19.6.37 EISAID (EISA ID String To Integer Conversion Macro)_ で言及がありました
- `_HID`の返り値は文字列か数値のどちらか
  - 文字列の場合は英数で構成されたPNP IDかACPI ID
    - PNP IDとACPI IDについては[PNP ID and ACPI ID Registry | Unified Extensible Firmware Interface Forum](https://uefi.org/PNP_ACPI_Registry)に詳しく記述がありました
  - 数値の場合は32ビット圧縮EISAタイプID（原語：32-bit compressed EISA type ID）
    - この数値は文字列のHIDに変換可能です。[ACPI Spec](https://uefi.org/sites/default/files/resources/ACPI_Spec_6.5a_Final.pdf)の _19.3.4 ASL Macros_ で以下のように言及されています
      > Converts and compresses the 7-character text argument into its corresponding 4-byte numeric EISA ID encoding (Integer). This can be used when declaring IDs for devices that are EISA IDs.
    - また、ここでは32ビット圧縮EISAタイプIDから文字列に変換する手順も紹介されていました

ここまでで`TBTN`の`_HID`の返り値は32ビット圧縮EISAタイプIDと分かったので先ほどの`TBTN`の`_HID`の２つの返り値をデコードするスクリプトを書きます。

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

出力は以下のようになりました。

```
❯ python decode.py
0x2A003434 -> MAT002A
0x2B003434 -> MAT002B
```

いくつか定義された他のデバイスのHIDを見ましたが、接頭辞が`MAT`のものがいくつかありました。よってデコード結果はこれで正しそうです。

HIDが分かればあとはドライバを書いていく作業になります。

以下に成果物を載せておきます

[sh1ma/tbtn-driver: TOUGPAD TBTN (A1, A2 buttons) Linux kernel driver](https://github.com/sh1ma/tbtn-driver)

[ここからA1/A2ボタンが動いている様子の動画を確認できます](https://cdn.sh1ma.dev/IMG_1051.mp4)

## まとめ

本当は本物のドライバを書く前にDSDTの`TBTN`のHIDを固定値`PNP0C40`に書き換えた上でACPIテーブルを上書きし、それのドライバを書いたりして動くところまで持っていったりしたんですが記事では端折りました。（書くのがめんどくなってしまった）  
DSDTの上書きのやり方とかは備忘録的に別記事で書けたらなーと思ってます。
