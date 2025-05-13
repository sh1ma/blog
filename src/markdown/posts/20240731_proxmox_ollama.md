---
title: ProxmoxのVMにOllama + OpenWebUIを入れた
publishedAt: "2024-07-31"
---

先日GPUパススルーしたProxmoxのVMにOllamaをインストールし、Webに公開するところまで行った。
やったことを思い出しながらここに書いていく。

## この記事で言及すること

- dockerコンテナからGPUを使えるようにする
- `docker compose`で[Ollama](https://github.com/ollama/ollama)と[OpenWebUI](https://github.com/open-webui/open-webui)を立ち上げる

## 前提

VMのOSはDebianのBookworm

```
Linux xx 6.1.0-23-amd64 #1 SMP PREEMPT_DYNAMIC Debian 6.1.99-1 (2024-07-15) x86_64 GNU/Linux
```

## やり方

### 1. Dockerを入れる

[aptでDockerを入れる方法はDockerの公式サイトに載っている](https://docs.docker.com/engine/install/ubuntu/#install-using-the-repository)が一応紹介。

先にコマンド全体を公式から引っ張っておくとこんな感じ。

```bash
# Add Docker's official GPG key:
sudo apt-get update
sudo apt-get install ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Add the repository to Apt sources:
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update


# Install Docker
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

**以下説明**

`ca-certificates`と`curl`が入っていない場合は以下で追加。

```bash
apt update
sudo apt install -y ca-certificates curl
```

次に`/etc/apt/keyrings`ディレクトリを作ってgpgキーを引っ張ってくる。どうやら最近は`/etc/apt/keyrings`にkeyringを置くのが最適解っぽい。
参考: [apt-key の非推奨化と keyring の扱い方](https://zenn.dev/kariya_mitsuru/articles/a950e0996fb703#fnref-48d3-2)

```bash
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
```

リポジトリの追加。以下でよしなにやってくれる。

```bash

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
```

最後にdockerのもろもろのインストール。

```bash
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

ここまでやればdockerコマンドが使えるようになっているはず。

### 2. NVIDIA Container Toolkitを入れて設定する

NVIDIA Container Toolkitを入れるとDockerコンテナでホストのGPUが使えるのでいれる。今回はapt経由でいれることにする。これも[公式に詳細な手順が書いてある](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html#installing-with-apt)が、ここでも一応紹介。

下記のコマンドでインストールのためのリポジトリをセットアップする。

```bash
curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | sudo gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg \
  && curl -s -L https://nvidia.github.io/libnvidia-container/stable/deb/nvidia-container-toolkit.list | \
    sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' | \
    sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list
```

インストール。

```bash
sudo apt update
sudo apt install -y nvidia-container-toolkit
```

下記のコマンドで入っているコマンドを確認できる。

```bash
sudo nvidia-ctk --version
```

入っていることが確認できたら以下を実行。dockerからNVIDIA Container Runtimeが使えるようになる。

```bash
sudo nvidia-ctk runtime configure --runtime=docker
```

最後にdockerを再起動しておく。

```bash
sudo systemctl restart docker
```

これでNVIDIA Container Toolkitのセットアップは終わり。

### 3. OllamaとOpenWebUIを使ってみる

以下のコマンドでOllamaのDockerイメージを実行できる。

```bash
sudo docker run -d --gpus=all -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama
```

Ollamaが実行されているかどうかを確認するためにapiサーバーにリクエストを投げるには以下の通り。

```bash
curl http://localhost:11434
```

正常に実行されていれば以下のようなレスポンスが返ってくる。

```
Ollama is running
```

この時点ではモデルなどは入っておらず、LLMを試すことはできない。  
UI経由でモデルをインストールしたりLLMを試したりするために、次は`docker compose`を使ってOpenWebUIといっしょに立ち上げてみる。

適当なディレクトリに以下のコードを`compose.yaml`として保存する。

```yaml
services:
  ollama:
    image: ollama/ollama
    runtime: nvidia
    container_name: ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama:/root/.ollama
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]

  open-webui:
    image: ghcr.io/open-webui/open-webui:main
    ports:
      - "8080:8080"
    volumes:
      - .:/app/open_webui
    environment:
      - OLLAMA_BASE_URL=http://ollama:11434

volumes:
  ollama:
  open-webui:
```

保存したらそのディレクトリで以下を実行すると`0.0.0.0:8080`でOpenWebUIが立ち上がるはず。

```bash
docker compose up
```

ここでログに以下の出力が出たらVMの設定を見直す必要がある。

```
CPU does not have vector extensions
```

`Type`の欄を`Host`にすることでこの問題は解消されるはず。(↓参考画像)

![ProxmoxのVMのCPU設定](https://cdn.sh1ma.dev/20240731_proxmox_ollama-1.png)

ここまででセットアップは終わり。あとはWebブラウザでVMのIPにアクセスしたらOpenWebUIが見られるはず。
