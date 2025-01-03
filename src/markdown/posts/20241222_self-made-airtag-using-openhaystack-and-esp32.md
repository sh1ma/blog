---
title: ESP32とOpenHaystackを使ってAirTagを自作してみる
publishedAt: "2024-12-22"
---

すっかり冷え込む季節になりました。一年中ユニクロのエアリズムを着ているので外に出るときは寒くて仕方ないです。そろそろヒートテック買わなきゃ。

今回はAppleの「探す」アプリで使われている「Find Myネットワーク」にタダ乗りして自作AirTagを作ることのできるOSSのプロジェクトのOpenHayStackを使ってみたので手順などを紹介したいと思います。

## OpenHaystackとは？

OpenHayStackとは、AppleのFind Myネットワークにタダ乗りしてBluetooth（BLE）を喋るデバイスをAirTag化できる技術・ソフトウェアです。  
Find MyネットワークやAirTagをリバースエンジニアリングした結果から開発されたものだそうです。

[seemoo-lab/openhaystack: Build your own 'AirTags' 🏷 today! Framework for tracking personal Bluetooth devices via Apple's massive Find My network.](https://github.com/seemoo-lab/openhaystack?tab=readme-ov-file#what-is-openhaystack)

## 実際に触ってみる

### 注意

実際のところリリース版を使って[公式のREADMEの手順](https://github.com/seemoo-lab/openhaystack?tab=readme-ov-file#installation)通りにやってもうまく動きません。それを解決するために今回はリリース版ではなくmainブランチの最新の状態を取り込んで作業しています。mainブランチの最新の状態によってはこの記事の通りの手順では動かないことに注意してください。

### 環境

- MacOS 14(Sonoma)
- XCode Version 15.1 (15C65)
- ESP32互換ボード

### 1. XCodeでOpenHaystackをビルドする

GithubのReleasesからビルド済みのアプリケーションがダウンロードできますが、そのバージョンは現行開発版ではなく、古いので使えません。そのためリリース版を使わず自前でビルドする必要があります。なのでこの手順は必須です。

まずはGithubリポジトリをcloneします。

```sh
git clone --depth 1 https://github.com/seemoo-lab/openhaystack.git
```

`--depth 1`をつけることで最新のコミット履歴だけを落とせるので素早くダウンロードできます。

リポジトリのディレクトリの`OpenHaystack`ディレクトリの中に`OpenHaystack.xcodeproj`があるのでこれを開くとXCodeが起動すると思います。
ただ、Xcodeのバージョンによっては以下の記事のような現象が発生し、ライブラリが足りないなどのエラーや警告が出ると思います。

[Xcode 15.3/15.4で発生するPackage.resolvedの削除問題について #Swift - Qiita](https://qiita.com/tichise/items/a6525272e326e7798f05)

自分はこのエラーが置きましたが、以下を実行し`OpenHaystack/OpenHaystack.xcodeproj/project.xcworkspace/xcshareddata/swiftpm/Package.resolved`を削除して再度XCodeを開き直すことで解決しました。

```sh
rm OpenHaystack/OpenHaystack.xcodeproj/project.xcworkspace/xcshareddata/swiftpm/Package.resolved
```

ビルドが完了するとこんな感じのアプリケーションが開きます。（セットアップ済みの画面なので既にアクセサリが表示されていますが実際には何も表示されていないと思います。）

![](https://cdn.sh1ma.dev/7b6b6d8a1dd5b890880e18c41ab2485a030ca33543c3c30299f1ac2de942f6c0.png)

### 2. OpenHaystackのセットアップ

**MacOS14以降では[OpenHaystackのREADMEの手順](https://github.com/seemoo-lab/openhaystack?tab=readme-ov-file#installation)通りにやってもうまくいきません。**

MacOS14以降の実際の手順を紹介します

OpenHaystackのアプリケーションをXCodeからビルドし起動したら、OpenHaystackの設定に移動します。ステータスバーのOpenHaystackから「Settings」で開きます。すると「Search Party Token」を入力するテキストフィールドのある設定が別ウィンドウで開きます。

![Search Party Tokenのテキストフィールドのある設定画面](https://cdn.sh1ma.dev/d9fc785094aed36c3fe2fdc8ccd8960595067d5092b4691c16c5585fa608776f.png)

ここにトークンを入れます。トークンはキーチェーンにあります。キーチェーンアプリを開いて以下の文字列で検索します。

```
com.apple.account.DeviceLocator.search-party-token
```

項目を右クリックし「パスワードをクリップボードにコピー」でコピーできます。

![キーチェーンアプリの画面。com.apple.account.DeviceLocator.search-party-tokenという語句で検索した結果が写っている。項目は一件ヒットしている](https://cdn.sh1ma.dev/131e673d33e983c73440ed42e9556c2d513059be887bd535b46491856af130b7.png)

先ほどのフィールドに入力したらアプリケーション側のセットアップは完了です。

### 3. OpenHaystackのファームウェアをESP32に焼く

OpenHaystackは公式にESP32のファームウェアを用意しています。ファームウェアの書き込みは公式の手順にに従えばできますがここでも一応紹介します。（[公式のインストラクション](https://github.com/seemoo-lab/openhaystack/tree/main/Firmware/ESP32)）

書き込みにはESP-IDFというツールを使用します。ESP-IDFのセットアップ手順は以下を参考にすると良いと思います。`idf.py`というコマンドが使えるようになっていればOKです。

[Standard Toolchain Setup for Linux and macOS - ESP32 - — ESP-IDF Programming Guide v5.3.2 documentation](https://docs.espressif.com/projects/esp-idf/en/stable/esp32/get-started/linux-macos-setup.html)

事前にOpenHaystackアプリからデバイスを作っておきます。画像赤丸の箇所から作成できます。

![OpenHaystackのアプリ画面。ナビゲーションバーの+マークのボタンに赤丸がついている](https://cdn.sh1ma.dev/128c5211dfc9d313ea1d331c388fb4008425959049fcf191138a056efa1927b9.png)

デバイスが一覧に追加されるので、追加されたデバイスを右クリックして「Copy advertisement key　→ Base64」でBase64形式でアドバタイズ用のキーをコピーしておきます。

OpenHaystackのプロジェクトディレクトリに入り、`Firmware/ESP32`まで移動します。

```sh
cd Firmware/ESP32
```

まずはファームウェアをビルドします。

```sh
idf.py build
```

ディレクトリ内にある`flash_esp32.sh`を使って書き込みます。「Base64-encoded advertisement key」の箇所には先ほどコピーしたアドバタイズ用のキーに置き換えます。

```sh
chmod +x flash_esp32.sh
./flash_esp32.sh -p /dev/yourSerialPort "Base64-encoded advertisement key"
```

ここまででセットアップは完了です。しばらくするとOpenHaystackの画面にデバイスの位置が表示されるはずです。（アプリ右上の更新ボタンを押すと位置情報が表示されるはずです。）ファームウェアを焼いてから表示されるまで5分ほどラグがあるように思いました。

## まとめ

ESP32を使ってOpenHaystackを動かす方法を紹介しました。もうかれこれ2,3週間くらい前にやったことな気がするのでうろ覚えで記事を書いたの間違っている箇所があればすいません・・・・・・。

最近nRF52832というハードウェアを使ってOpenHaystackを動かすのもやったのでそれも記事にかけたらいいなと思っています。

気づいたら年明けてた。
