---
title: nRF52832を使って偽AirTagを作る
publishedAt: "2025-01-03"
---

あけましておめでとうございます！  
OpenHaystack記事二個目です。nRF52832が乗った基板を調達できたので、これも偽AirTag化することにしました。  
今回はその備忘録です。  
（あけおめ記事はまた別に書きます。）

今回調達したnRF52832デバイスはDev KitなどのようにUSBでシリアルポート接続できたりする代物ではなく、まあせいぜいUARTとSWDで通信ができるよくらいの代物だったので、プログラマとしてOpenOCDを載せたラズパイ4でSWD経由でファームウェア書き込みを行いました。

## 今回使うもの

- Raspberry Pi 4 Model B
- ジャンパワイヤ（必要な分だけ）
- nRF52832

## やること

### OpenOCDの準備

（Raspberry OSが載っている）ラズパイにOpenOCDを入れるのはとても簡単です。  
以下のコマンドで入れられます。

```bash
sudo apt install -y openocd
```

ラズパイからSWDを使ってハードウェアと通信するには、GPIOの24番ピンと25番ピンを使います。  
ピンの配置は以下から確認するのが便利です。

[Raspberry Pi GPIO Pinout](https://pinout.xyz/)

- 24番：IO
- 25番：CLK

です。

ジャンパワイヤでラズパイと基板をいい感じに繋いだら設定ファイルを書いていきます。

以下がnRF523832とラズパイ4、そしてSWDを使う人向けのOpenOCDの設定になります。

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

参考にしたのは以下の記事中の設定ファイルですが、古い記述やラズパイ4に対応させるための記述が見当たらなかったので加筆・修正しました。

[Using Raspberry Pi as SWD programmer via OpenOCD Bitbang protocol — Ayan Pahwa](https://codensolder.com/blog/rip-swd-programmer)

↑を`openhaystack.cfg`などの名前で保存し、以下を実行してtelnetサーバとgdbサーバなどが立ち上がっていれば一旦準備は完了です。

```bash
openocd -f openhaystack.cfg
```

### nRF52832のファームウェアの用意

ファームウェアは自分は一からビルドもできますが一番簡単なのはコンパイル済みのバイナリを焼くことですね。  
こんかいはmacless-haystackというリポジトリのファームウェアを使用します。（使用するのはファームウェアのみです。）

[dchristl/macless-haystack: Create your own AirTag with OpenHaystack, but without the need to own an Apple device](https://github.com/dchristl/macless-haystack)

以下のコマンドでファームウェアをダウンロードします。（`v2.2.0`の箇所は適宜変更してください）

```bash
wget https://github.com/dchristl/macless-haystack/releases/download/v2.2.0/nrf52_firmware.bin
```

generate_keys.pyも鍵情報の作成に使うのでダウンロードします。

```
wget https://raw.githubusercontent.com/dchristl/macless-haystack/refs/heads/main/generate_keys.py
```

generate_keys.pyを実行すると`output/`に鍵情報のファイルが作成されます。

```bash
python generate_keys.py
```

```
❯ ls output
ZDOU6E.keys  ZDOU6E_devices.json  ZDOU6E_keyfile
```

`output/`配下の`XXXXXX_keyfile`がアドバタイズ用のキーです。これをファームウェアに埋め込みます。  
[手順は公式のREADMEに書いてあります](https://github.com/dchristl/macless-haystack/blob/main/firmware/nrf5x/README.md)が、ここでも紹介します。

以下を実行すると埋め込まれます。

```bash
export LC_CTYPE=C
xxd -p -c 100000 XXXXXX_keyfile | xxd -r -p | dd of=nrf51_firmware.bin skip=1 bs=1 seek=$(grep -oba OFFLINEFINDINGPUBLICKEYHERE! nrf51_firmware.bin | cut -d ':' -f 1) conv=notrunc
```

ここまで出来たらファームウェアの用意は完了です。

### ファームウェアをnRF52832に焼く

「OpenOCDの準備」の項で作ったOpenOCDの設定ファイルに以下を追記します。

注意：`nrf5 mass_erase`を忘れないようにしてください。これはReadback Protectionという書き込み保護を解除するコマンドです。忘れるとファームウェアが書き込めずエラーで失敗します。

```txt
nrf5 mass_erase
program nrf52_firmware2.bin verify
reset
```

追記したら以下を実行

```bash
openocd -f openhaystack.cfg
```

ファームウェアが正常に書き込まれればOpenHaystackのアプリから数分以内にデバイスがオンラインになると思います。

## まとめ

本当はめっちゃ悪戦苦闘したんですがだいぶ端折って書いてます。  
最近マイコンとかハードウェアとか弄るの楽しくなってます。また何かおもしろいおもちゃを見つけたら紹介しようと思います。
では！
