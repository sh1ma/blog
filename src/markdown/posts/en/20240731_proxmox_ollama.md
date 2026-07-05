---
title: Installing Ollama + OpenWebUI on a Proxmox VM
publishedAt: "2024-07-31"
---

The other day I installed Ollama on a Proxmox VM with GPU passthrough and got as far as exposing it to the Web.
I’ll write down what I did here while remembering it.

## What This Article Covers

- Making the GPU available from docker containers
- Starting [Ollama](https://github.com/ollama/ollama) and [OpenWebUI](https://github.com/open-webui/open-webui) with `docker compose`

## Assumptions

The VM OS is Debian Bookworm.

```
Linux xx 6.1.0-23-amd64 #1 SMP PREEMPT_DYNAMIC Debian 6.1.99-1 (2024-07-15) x86_64 GNU/Linux
```

## How to Do It

### 1. Install Docker

[Docker’s official site has instructions for installing Docker with apt](https://docs.docker.com/engine/install/ubuntu/#install-using-the-repository), but I’ll introduce them anyway.

If you pull the full command sequence from the official site first, it looks like this.

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

**Explanation below**

If `ca-certificates` and `curl` are not installed, add them with the following.

```sh
apt update
sudo apt install -y ca-certificates curl
```

Next, create the `/etc/apt/keyrings` directory and fetch the gpg key. Apparently these days putting keyrings under `/etc/apt/keyrings` seems to be the best approach.
Reference: [Deprecation of apt-key and How to Handle keyrings](https://zenn.dev/kariya_mitsuru/articles/a950e0996fb703#fnref-48d3-2)

```sh
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
```

Add the repository. The following handles it nicely.

```sh

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
```

Finally, install the various docker components.

```sh
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

After doing this much, the docker command should be available.

### 2. Install and Configure NVIDIA Container Toolkit

Installing NVIDIA Container Toolkit allows Docker containers to use the host GPU, so I’ll install it. This time I’ll install it via apt. [The official documentation also has detailed steps](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html#installing-with-apt), but I’ll introduce them here too.

Set up the repository for installation with the command below.

```sh
curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | sudo gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg \
  && curl -s -L https://nvidia.github.io/libnvidia-container/stable/deb/nvidia-container-toolkit.list | \
    sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' | \
    sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list
```

Install it.

```sh
sudo apt update
sudo apt install -y nvidia-container-toolkit
```

You can check the installed command with the following.

```sh
sudo nvidia-ctk --version
```

Once you confirm it is installed, run the following. This makes NVIDIA Container Runtime available from docker.

```sh
sudo nvidia-ctk runtime configure --runtime=docker
```

Finally, restart docker.

```sh
sudo systemctl restart docker
```

This completes the NVIDIA Container Toolkit setup.

### 3. Try Using Ollama and OpenWebUI

You can run the Ollama Docker image with the following command.

```sh
sudo docker run -d --gpus=all -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama
```

To send a request to the api server and check whether Ollama is running, use the following.

```sh
curl http://localhost:11434
```

If it is running normally, a response like the following comes back.

```
Ollama is running
```

At this point, no models are installed, so you cannot try an LLM yet.  
To install models through a UI and try LLMs, next I’ll use `docker compose` to start it together with OpenWebUI.

Save the following code as `compose.yaml` in an appropriate directory.

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

After saving it, run the following in that directory, and OpenWebUI should start on `0.0.0.0:8080`.

```sh
docker compose up
```

If the following output appears in the logs here, you need to review the VM settings.

```
CPU does not have vector extensions
```

This problem should be resolved by setting the `Type` field to `Host`. (Reference image below)

![Proxmox VM CPU settings](https://cdn.sh1ma.dev/20240731_proxmox_ollama-1.png)

That completes the setup. After that, if you access the VM’s IP from a web browser, you should be able to see OpenWebUI.
