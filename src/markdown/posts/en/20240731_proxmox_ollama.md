---
title: Running Ollama + Open WebUI on a Proxmox VM
publishedAt: "2024-07-31"
---

The other day I installed Ollama on the Proxmox VM I'd set up with GPU passthrough and got as far as putting it on the web.
Here's what I did, jotted down from memory.

## What this post covers

- Making the GPU visible from inside a Docker container
- Bringing up [Ollama](https://github.com/ollama/ollama) and [Open WebUI](https://github.com/open-webui/open-webui) with `docker compose`

## Prerequisites

The VM runs Debian Bookworm.

```
Linux xx 6.1.0-23-amd64 #1 SMP PREEMPT_DYNAMIC Debian 6.1.99-1 (2024-07-15) x86_64 GNU/Linux
```

## How to do it

### 1. Install Docker

[The official Docker docs already cover installing via apt](https://docs.docker.com/engine/install/ubuntu/#install-using-the-repository), but I'll walk through it here too.

Here's the full command sequence from the official docs up front:

```sh
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

**Now the step-by-step version.**

If you don't have `ca-certificates` and `curl` already, install them:

```sh
apt update
sudo apt install -y ca-certificates curl
```

Next, create the `/etc/apt/keyrings` directory and pull in the GPG key. As I understand it, `/etc/apt/keyrings` is the currently recommended place to put keyrings.
Reference (Japanese): [apt-key の非推奨化と keyring の扱い方](https://zenn.dev/kariya_mitsuru/articles/a950e0996fb703#fnref-48d3-2)

```sh
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
```

Add the apt repository. The snippet below takes care of it:

```sh

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
```

Finally, install Docker itself along with its plugins:

```sh
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

At this point, the `docker` command should be available.

### 2. Install and configure the NVIDIA Container Toolkit

The NVIDIA Container Toolkit is what lets Docker containers use the host's GPU, so let's install it. I'll go with apt here. [The official docs cover this in detail](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html#installing-with-apt), but I'll walk through it anyway.

Set up the apt repository with the following:

```sh
curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | sudo gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg \
  && curl -s -L https://nvidia.github.io/libnvidia-container/stable/deb/nvidia-container-toolkit.list | \
    sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' | \
    sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list
```

Install it:

```sh
sudo apt update
sudo apt install -y nvidia-container-toolkit
```

Confirm that the CLI is installed:

```sh
sudo nvidia-ctk --version
```

Once you've verified that, run the following to hook the NVIDIA Container Runtime into Docker:

```sh
sudo nvidia-ctk runtime configure --runtime=docker
```

Finally, restart Docker:

```sh
sudo systemctl restart docker
```

That's it for the NVIDIA Container Toolkit setup.

### 3. Try out Ollama and Open WebUI

Run the Ollama Docker image like so:

```sh
sudo docker run -d --gpus=all -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama
```

To check that Ollama is up, hit its API server:

```sh
curl http://localhost:11434
```

If it's running, you'll get back:

```
Ollama is running
```

At this point no models are installed yet, so we can't actually try out an LLM.  
So next, to install models and chat with them through a UI, I'll bring it up together with Open WebUI using `docker compose`.

Save the snippet below as `compose.yaml` somewhere convenient:

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

Once saved, run this in that directory and Open WebUI should come up on `0.0.0.0:8080`:

```sh
docker compose up
```

If you see this in the logs, though, you'll need to revisit the VM settings:

```
CPU does not have vector extensions
```

Setting the CPU `Type` field to `Host` should sort this out. (See the screenshot below.)

![Proxmox VM CPU settings](https://cdn.sh1ma.dev/20240731_proxmox_ollama-1.png)

That's the setup done. From here, hit the VM's IP in a browser and you should see Open WebUI.
