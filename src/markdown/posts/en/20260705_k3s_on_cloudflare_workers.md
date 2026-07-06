---
  title: "Running k3s on Cloudflare Workers Containers"
  publishedAt: "2026-07-05"
  description: "A walkthrough of stuffing a single-node k3s cluster into one Firecracker microVM and putting a Worker in front as a thin gateway."
  tags: ["Cloudflare", "Kubernetes", "k3s", "Cloudflare Workers"]
---

I stuffed a whole **single-node k3s cluster** into Cloudflare Workers Containers and got it to the point where I can drive it with plain `kubectl`. This post walks through how the setup works.

The full code lives here:

https://github.com/sh1ma/try-k3s-on-cf-workers-public

https://x.com/mizchi/status/2070456349197299956

> Would it be nice if k8s ran on Cloudflare?

https://x.com/sh1ma/status/2070688160766640444

> Rootless k3s might work. Want to try it.

https://x.com/sh1ma/status/2072200706883543466

> Got k3s running on Cloudflare Containers.

https://x.com/sh1ma/status/2072224558871204290

> Deployed nginx to the k3s cluster I set up on Cloudflare Containers.

https://x.com/sh1ma/status/2072255101541163312

> VOICEVOX runs.

https://x.com/sh1ma/status/2072329617990693297

> And in the end I got a Discord read-aloud bot using VOICEVOX to run on Cloudflare (driven from `kubectl`, so no Workers redeploys needed!).

## The big picture

Roughly, the setup looks like this:

```
Cloudflare Worker  ──►  Container (Firecracker microVM)
                          │
                          ├─ Python status.py (PID 1, port 8080)
                          │  ├─ /health, /manage/*, /services/*
                          │  ├─ /manage/apiserver → k3s apiserver reverse-proxy (HTTP + WebSocket)
                          │  ├─ /manage/dashboard → Kubernetes Dashboard reverse-proxy
                          │  └─ /services/*       → Traefik ClusterIP:80 (verbatim)
                          │
                          ├─ svcproxy (Go, homemade userspace kube-proxy)
                          │
                          └─ k3s server (all-in-one)
                             ├─ control plane: apiserver + controller + scheduler + SQLite
                             ├─ node: kubelet + containerd
                             └─ pods: coredns, dashboard, traefik, ...
```

There are three layers:

- **Worker**: a thin gateway that just forwards incoming HTTPS to a Container Durable Object. It carries no routing logic of its own.
- **`status.py` inside the container**: a Python server running as PID 1. It splits requests by path prefix — "management" vs. "public services" — and reverse-proxies them to the apiserver, the Dashboard, or Traefik.
- **k3s itself**: an all-in-one configuration where the control plane and the node live together. A homemade userspace kube-proxy (`svcproxy`) also runs alongside it in the same microVM.

From the outside, the URLs fall into two categories:

| URL prefix | Purpose |
|---|---|
| `/services/<name>/*` | Reaches a backend Service via an Ingress rule that you `kubectl apply` to the cluster |
| `/manage/*` | Management surface: Dashboard, apiserver reverse-proxy, `kubectl` endpoint, etc. |

To expose a new service, all you do is `kubectl apply -f my-ingress.yaml` and it becomes reachable at `/services/<name>/*`. You don't touch the Worker code at all.

## Inside a Cloudflare Container is a Firecracker microVM

Cloudflare Workers Containers is a Firecracker microVM-based runtime available on the Workers Paid plan. Run `uname -a` inside and it returns `Linux 6.18.36-cloudflare-firecracker`.

The permission model is remarkably relaxed: **`CapEff = 0x1ffffffffff` (all 41 caps held)**, no seccomp filter, user namespaces can be created, overlayfs can be mounted, and the KVM device is present. It's essentially "one privileged VM." There's no rootless straitjacket, so you can launch a rootful k3s server as-is.

The catch is the kernel: you get whatever is built in, and nothing else. There is no `/lib/modules` equivalent, so anything that assumes dynamic module loading simply won't work. This constraint shapes the k3s side heavily.

## The k3s side

`k3s server` is started with these flags:

- `--flannel-backend=host-gw`
- `--disable-kube-proxy`
- `--disable-network-policy`
- `--disable=servicelb`
- `--disable=traefik`

The key part is **disabling the built-in kube-proxy**. The Firecracker kernel is missing most netfilter extensions across the board: iptables mode has no `nfacct` support, nftables mode has no `reject` verdict, and ipvs mode has no `ip_vs` module at all — every mode is dead on arrival. flannel's VXLAN backend is unusable for the same reason, so I switched to `host-gw`. kube-router's network policy support depends on `NFLOG`, so I disabled that too.

servicelb and traefik are off because there's no need for an external LB (the Worker sits in front), and because I wanted to run my own up-to-date Traefik.

Pods run as nested containers under containerd. On top of the standard CoreDNS / metrics-server / local-path-provisioner, I drop the Kubernetes Dashboard and my own Traefik v3 (as the Ingress Controller) as manifests into `/var/lib/rancher/k3s/server/manifests/`. k3s's HelmChart/Deployment reconciler picks them up and applies them automatically at startup.

## svcproxy: a homemade userspace kube-proxy

Since kube-proxy is off, we need something to deliver packets aimed at a Service's ClusterIP to the actual pods. I wrote that in Go as `container/svcproxy/main.go`. It's a plain, dependency-free implementation in a few hundred lines.

The logic is simple:

1. Every 3 seconds, run `kubectl get services -A -o json` and `get endpointslices -A -o json`.
2. Build the expected `(ClusterIP, port) → [endpoint...]` table.
3. Diff it against the current set of listeners and reconcile.

The reconcile step does the following:

- **Add**: `ip addr add <ClusterIP>/32 dev lo` puts the IP on loopback, then `net.Listen("tcp", "<ClusterIP>:<port>")` accepts connections. Each accepted connection is spliced bidirectionally to a pod endpoint with `io.Copy`.
- **Remove**: close the listener, and — after checking a reference count — remove the IP from `lo` too.
- **Endpoints change**: swap the slice in via `atomic.Pointer[[]endpoint]` (existing connections are left alone).

From a pod's point of view, this behaves exactly like kube-proxy being there. UDP isn't supported, but the main paths (CoreDNS → apiserver, etc.) are all TCP, so it hasn't been a problem in practice.

## The Worker side and `status.py` routing

The Worker is nearly empty. It forwards any path straight to the Container Durable Object. All the actual routing happens inside the container, in `status.py` (PID 1).

`status.py` branches three ways:

- `/health` — a lightweight liveness response for CF Container's `pingEndpoint`.
- `/services/<name>/*` — forwarded verbatim to Traefik's ClusterIP (`kube-system/traefik:80`). The path is not rewritten.
- `/manage/*` — the management surface, which branches further:
  - `/manage/apiserver/*` → forwarded over TLS to `https://127.0.0.1:6443` (the `kubectl` backend).
  - `/manage/dashboard/*` → forwarded to the Kubernetes Dashboard (insecure HTTP on 9090).
  - `/manage/kubectl?args=...` → shells out to `kubectl` on the server and returns stdout/stderr as JSON.

Once a request hits Traefik via `/services/*`, it's dispatched to the backend Service through the `IngressRoute` + Middleware (`stripPrefix: /services/<name>`) that the user applied with `kubectl`. That's what makes the "just add an Ingress and it's public at `/services/<name>/*`" experience work.

## Driving `kubectl` from your laptop

Because `/manage/apiserver/*` is a reverse-proxy for the apiserver, in principle you can just point `kubectl` at it: `kubectl --server=https://<worker>/manage/apiserver`. In practice there are two problems:

1. Cloudflare Access (Service Token) is in front, so requests need `CF-Access-Client-Id` / `CF-Access-Client-Secret` headers.
2. `kubectl` **won't send a bearer token to an `http://` endpoint**, so the local side needs to be HTTPS too or ServiceAccount token auth won't go through.

To deal with both, I put a small local HTTPS proxy in the middle: `bin/access-proxy.py`. It listens on `https://127.0.0.1:8087` with a self-signed cert, injects the Access headers, and forwards to the Worker. That's all it does.

```sh
kubectl --server=https://127.0.0.1:8087/manage/apiserver \
        --token="$TOKEN" \
        --insecure-skip-tls-verify=true \
        get nodes
```

On top of that, commands like `kubectl port-forward` / `exec` / `logs -f` use WebSocket (HTTP/1.1 `Upgrade`), so both `status.py` and `access-proxy.py` have a "detect `Upgrade: websocket` and switch to raw TCP splicing" path. After returning a `101`, they just pump the client ↔ upstream connection bidirectionally.

## Firecracker-specific gotchas

Of the things I hit while putting this together, here are the ones other people are most likely to run into.

**kube-proxy doesn't work in any mode**
Everything in netfilter that assumes dynamic module loading is gone (`nfacct` / `reject` / `ip_vs` / `NFLOG`, etc.). But `nf_conntrack` and the iptables base framework itself are alive, so if you commit to **implementing Services in userspace**, it works fine. `svcproxy` is exactly that.

**`@cloudflare/containers`'s `pingEndpoint` is a `"host/path"` string, not a URL path**
Passing `pingEndpoint = "/health"` (with a leading slash) gives you a URL of `http:///health`, where the hostname is empty and the path is treated as empty — so what actually goes out is `GET /`. You have to write it like `pingEndpoint = "container/health"`. If you miss this and you have a greedy reverse-proxy on `/`, all the health-check traffic ends up flowing to whatever pod is behind it, fills the thread pool, and then even `/health` gets stuck — a cascading failure.

**k3s's `--disable=X` will actively delete manifests with the matching name**
If you pass `--disable=traefik` and drop a `traefik.yaml` into the manifest directory, the addon reconciler decides on startup that "traefik is disabled" and physically removes the file. Rename it to something like `ingress-controller.yaml` and it stops noticing.

**Traefik v3 watches all ten of its CRDs**
Even if you only want to use Middleware, the controller cache sync will time out and the pod will exit unless `middlewaretcps` / `ingressroutetcps` / `ingressrouteudps` / `tlsstores` / `tlsoptions` / `serverstransports` / `serverstransporttcps` and friends are all defined as CRDs. Cheapest fix: install empty definitions for all of them with `x-kubernetes-preserve-unknown-fields: true`.

## Wrapping up

Cloudflare Workers Containers is easiest to think of as "a box that lets a Worker boot one privileged VM." Steer clear of the kernel constraints and you can fit an entire Kubernetes control plane inside. Running k8s with no extra VMs and no managed control-plane bill — just the Workers Paid plan (plus Container runtime) — is a pretty fun option.

I haven't gotten around to multi-node or persistence yet, so if I do, I'll write a follow-up.
