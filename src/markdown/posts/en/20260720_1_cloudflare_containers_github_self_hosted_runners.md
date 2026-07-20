---
title: "Running GitHub Self-hosted Runners on Cloudflare Containers"
publishedAt: "2026-07-20"
description: "I set up ephemeral GitHub Actions self-hosted runners on Cloudflare Containers, driven by webhooks, and compared the cost against GitHub-hosted runners with real measurements."
tags: ["Cloudflare", "Cloudflare Containers", "GitHub Actions"]
---

I was actually planning to publish an article yesterday about doing CAD modeling and 3D printer control with Claude Code, but the modeling part didn't reach a quality I'd be happy publishing, so I'll do a bit more research first...![^1]

So this is another stopgap [Cloudflare Containers](https://developers.cloudflare.com/containers/) post.

This time I got a [GitHub Actions self-hosted runner](https://docs.github.com/en/actions/concepts/runners/self-hosted-runners) running on Cloudflare Containers, so this article covers how to do it, plus a rough cost comparison.

The first half is an intro to GitHub Actions self-hosted runners, so feel free to skip it if you already know the topic.

## TL;DR

- I set up a GitHub Actions self-hosted runner on Cloudflare Containers.
- In most scenarios, a self-hosted runner on Cloudflare Containers has no cost or spec advantage.
- That said, Cloudflare Containers only bills for the resources you actually use, so if you're already on the Workers Paid plan (currently \$5/month) and you run lots of short, low-resource jobs, it might be worth considering.

## What's a GitHub Actions self-hosted runner?

It's a mechanism for running Actions on machines you provide yourself, instead of on GitHub's servers.  
I'll skip the details here — the docs below explain it well.

https://docs.github.com/en/actions/concepts/runners/self-hosted-runners

Setting up a self-hosted runner isn't particularly hard.  
However, persistent runners and ephemeral runners differ slightly in how you set them up and operate them.

### Persistent runners vs ephemeral runners

In short, a persistent runner is an always-on runner that requires a long-running container.  
An ephemeral runner, on the other hand, starts up each time a GitHub Actions job begins — the container only comes up while there's work to do.

https://github.blog/changelog/2021-09-20-github-actions-ephemeral-self-hosted-runners-new-webhooks-for-auto-scaling/

https://docs.github.com/en/actions/reference/runners/self-hosted-runners#ephemeral-runners-for-autoscaling

It would have been fun if this experiment ended with "running self-hosted runners on Cloudflare is cheaper!", but when I [ran k3s on Cloudflare Containers](https://blog.sh1ma.dev/en/articles/20260705_k3s_on_cloudflare_workers) a while back, I already concluded that containers that need to stay running generally can't compete on price with other platforms, because of the memory the container itself consumes.[^2]

So if Cloudflare Containers has any chance of beating GitHub-hosted runners, it's with ephemeral runners, which don't need to stay resident and only run when a job fires.

## Spec comparison: GitHub-hosted runners vs Cloudflare Containers runners

- GitHub charges a fixed per-minute rate for 2 cores / 8 GB, whether you use them or not.
- Cloudflare Containers bills CPU by actual usage.

| Environment | vCPU | Memory | Disk | Notes |
|---|---|---|---|---|
| GitHub `ubuntu-latest` (private) | 2 | 8 GB | 14 GB SSD | \$0.006/min, rounded up per minute |
| GitHub `ubuntu-latest` (public) | 4 | 16 GB | 14 GB SSD | **free, unlimited** |
| CF lite | 1/16 | 256 MiB | 2 GB | verified working (slow) |
| CF basic | 1/4 | 1 GiB | 4 GB | verified working, recommended minimum |
| CF standard-1 | 1/2 | 4 GiB | 8 GB | |
| CF standard-2 | 1 | 6 GiB | 12 GB | |
| CF standard-3 | 2 | 8 GiB | 16 GB | spec-equivalent to private `ubuntu-latest` |
| CF standard-4 | 4 | 12 GiB | 20 GB | falls short of the public runner (4 cores/16 GB) on memory |

https://docs.github.com/en/actions/reference/runners/github-hosted-runners#standard-github-hosted-runners-for-public-repositories

https://docs.github.com/en/billing/reference/actions-runner-pricing

https://developers.cloudflare.com/containers/pricing/

https://developers.cloudflare.com/workers/platform/pricing/#containers


## Implementation

### Worker

The Worker is a thin layer: when it receives a `workflow_job` webhook (action: `queued`), it issues a registration token and starts a Container (Durable Object).

```typescript
if (url.pathname === "/webhook" && request.method === "POST") {
  const body = await request.text();
  const ok = await verifySignature(
    env.WEBHOOK_SECRET,
    body,
    request.headers.get("x-hub-signature-256"),
  );
  if (!ok) return new Response("bad signature", { status: 401 });

  // Ignore anything that isn't workflow_job / queued / the target label (omitted)

  const token = await getRegistrationToken(env);
  const name = `cf-runner-${payload.workflow_job.id}`;
  const container = env.RUNNER.getByName(name);
  await container.launch({
    repoUrl: `https://github.com/${env.GITHUB_REPO}`,
    token,
    labels: env.RUNNER_LABEL,
    name,
  });
  return new Response("launched");
}
```

The container side extends the `Container` class from `@cloudflare/containers`. Since the runner is a batch process that doesn't serve HTTP, there's no `defaultPort`, and `sleepAfter` acts as a safety cap on billing in case a job hangs.

```typescript
export class RunnerContainer extends Container<Env> {
  sleepAfter = "15m";

  async launch(opts: { repoUrl: string; token: string; labels: string; name: string }) {
    await this.start({
      envVars: {
        REPO_URL: opts.repoUrl,
        RUNNER_TOKEN: opts.token,
        RUNNER_LABELS: opts.labels,
        RUNNER_NAME: opts.name,
      },
    });
  }
}
```

### Container image

The image is nothing fancy — just ubuntu:24.04 with actions/runner installed.

https://github.com/actions/runner/releases

```dockerfile
FROM ubuntu:24.04

ARG RUNNER_VERSION=2.335.1

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       ca-certificates curl jq git tar gzip \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /runner

RUN curl -fL -o runner.tar.gz \
      "https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz" \
    && tar xzf runner.tar.gz \
    && rm runner.tar.gz \
    && ./bin/installdependencies.sh

COPY entrypoint.sh /entrypoint.sh
ENV RUNNER_ALLOW_RUNASROOT=1
ENTRYPOINT ["/entrypoint.sh"]
```

The entrypoint just runs config with `--ephemeral` and then starts the runner.

```bash
./config.sh \
  --unattended \
  --ephemeral \
  --disableupdate \
  --url "${REPO_URL}" \
  --token "${RUNNER_TOKEN}" \
  --name "${RUNNER_NAME}" \
  --labels "${RUNNER_LABELS}"

exec ./run.sh
```

### Workflow side

In the workflow, all you do is specify `self-hosted` and the runner's label in `runs-on`.

```yaml
jobs:
  hello:
    runs-on: [self-hosted, cf-runner]
```

## It works

A real job (echo + checkout) succeeded. Under the hood it's a Firecracker microVM — `uname -a` returns `Linux cloudchamber 6.18.36-cloudflare-firecracker` (linux/amd64).

Here are the measurements:

| Item | basic (1/4 vCPU, 1GiB) | lite (1/16 vCPU, 256MiB) |
|---|---|---|
| Job result | success | success |
| Webhook received → job start | ~11 s | ~13 s |
| Job duration | 23 s | 74 s |
| Approx. cost per job | ≈ \$0.00018 | ≈ \$0.00015 |

From queueing to job start takes about 11–13 seconds including the cold start — roughly the same as waiting for a GitHub-hosted runner to spin up.

### lite doesn't actually save money

This was the interesting part. lite's unit price is about 1/3.9 of basic's, but with only 1/16 vCPU the same job takes about 3.2× longer, so the **per-job cost (unit price × duration) comes out nearly identical**. You just lose on latency, so I'd say basic is the practical minimum configuration.

One more gotcha: instance type changes don't roll out immediately. If you don't confirm the configuration has propagated with `wrangler containers info` before measuring, your job runs on an instance with the old spec.

## Cost comparison

Here are the official rates this is based on (as of 2026-07-20):

- **Cloudflare Containers** (requires Workers Paid, \$5/month): vCPU \$0.000020/vCPU-second, memory \$0.0000025/GiB-second, disk \$0.00000007/GB-second. **Billed in 10ms increments, only while running.** Included allowance: 375 vCPU-minutes, 25 GiB-hours, 200 GB-hours per month.
- **GitHub Actions** (hosted, private repositories): Linux 2-core at \$0.006/min, **rounded up to the minute per job**. Free tier: 2,000 min/month on Free, 3,000 min/month on Pro/Team. Public repositories are free and unlimited.

The thing that really matters here is the [pricing change from 2025-11-21](https://developers.cloudflare.com/changelog/post/2025-11-21-new-cpu-pricing/): CPU is now billed by **actual CPU usage** rather than allocated vCPU (memory and disk are still allocation-based). In other words, the less CPU your job actually uses, the cheaper it gets.

Converted to \$/min per instance type, the comparison looks like this. The CPU 100% column is the upper bound — real costs come in below it.

| CF instance | Spec | \$/min (CPU 100%) | \$/min (CPU 20%) | vs GitHub 2-core (\$0.006/min) |
|---|---|---|---|---|
| lite | 1/16 vCPU, 256MiB | \$0.000121 | \$0.000061 | ~1/50–1/98 |
| basic | 1/4 vCPU, 1GiB | \$0.000467 | \$0.000227 | ~1/13–1/26 |
| standard-1 | 1/2 vCPU, 4GiB | \$0.001234 | \$0.000754 | ~1/4.9–1/8.0 |
| standard-3 | 2 vCPU, 8GiB | \$0.003667 | \$0.001747 | ~1/1.6–1/3.4 |

GitHub's ubuntu-latest (private) is 2 vCPU / 8 GB RAM, so the spec-equivalent comparison is standard-3. Even for a build that maxes out the CPU, **Cloudflare is about 39% cheaper**, and for I/O-bound jobs running at around 20% CPU it's **about 71% cheaper**. On top of that, Cloudflare bills in 10ms increments while GitHub rounds up to the minute, so the shorter the job, the wider the gap.

### Where Cloudflare Containers wins

1. **Private repositories that have used up the free tier**: the overage is 39–71% cheaper at equivalent specs, and if you can drop light jobs down to basic, 1/13–1/26.
2. **Lots of short jobs**: GitHub rounds each job up to a minute, so 1,000 ten-second jobs cost \$6.00 on GitHub vs about \$0.08 on CF basic — roughly a 75× difference.
3. **Jobs that fit on low-spec instances** (lint, notifications, etc.).
4. **Already paying for Workers Paid**: the included 375 vCPU-minutes/month gives you about 1,500 minutes/month of basic-equivalent jobs at no extra cost.

### Where GitHub-hosted still wins

1. **Public repositories**: hosted runners are free and unlimited, so there's no contest.
2. **Usage within the free tier (2,000 min/month)**: GitHub costs \$0 while CF needs the \$5/month Workers Paid fixed cost.
3. **Jobs that need Docker**: nested virtualization isn't available inside the Firecracker microVM, so the docker daemon won't run — container-build CI is a poor fit.
4. **Jobs that rely on preinstalled tools**: none of the hosted runners' huge toolchain is there, so setup time becomes billed time.

### Break-even point

There are two ways to frame the break-even, depending on your assumptions.

1. **Comparing total cost for a single account** (when GitHub Free's 2,000-minute free tier is fully available): GitHub is \$0 up to 2,000 minutes while CF starts from the \$5/month fixed cost, so the crossover is at **about 6,980 min/month for CPU-100% jobs, or about 3,830 min/month for CPU-20% jobs** (standard-3, with both platforms' free allowances included).
2. **Comparing marginal cost** (free tier consumed by other workloads, Workers Paid already subscribed): per minute it's GitHub \$0.006 vs CF standard-3 \$0.00367 (CPU 100%) to \$0.00175 (CPU 20%), so **CF is 39–71% cheaper from the very first minute**.

![Chart comparing monthly CI usage against monthly cost. GitHub Free grows at \$0.006/min beyond the 2,000-minute free tier, while Cloudflare standard-3 starts from a \$5/month fixed cost. The crossover (break-even) is around 6,980 min/month at CPU 100% and around 3,830 min/month at CPU 20%](https://cdn.sh1ma.dev/20260720_1_cloudflare_containers_github_self_hosted_runners/ci-cost-vs-usage.en.png)

Looking at total cost per workload: for light usage that fits in the free tier (1,000 min/month), GitHub wins at \$0 vs CF's \$5+; at 3,000 min/month GitHub still wins (\$6.00 vs \$15.28); and at the 10,000 min/month scale CF pulls ahead (\$48.00 vs \$40.95). Jobs with lower CPU usage widen the gap further.

![Bar chart comparing total monthly cost per workload. With free tiers and fixed costs included, GitHub is cheaper at 1,000 and 3,000 min/month, and Cloudflare pulls ahead at 10,000 min/month](https://cdn.sh1ma.dev/20260720_1_cloudflare_containers_github_self_hosted_runners/ci-cost-cases.en.png)

## Summary

- GitHub Actions self-hosted runners just work on Cloudflare Containers.
- Webhook-driven startup + `--ephemeral` gets you "pay only while a job is running."
- lite looks cheap but is slow, so its per-job cost is about the same as basic. basic is the practical minimum.
- Since 2025-11, CPU is billed by actual usage, so jobs that leave CPU idle are cheaper (39–71% cheaper at equivalent specs).
- In total-cost terms, though, GitHub's free tier and the Workers Paid \$5/month both work against CF — the crossover only comes at around 4,000–7,000 min/month. It's also a poor fit for public repositories and Docker-build-based CI.



[^1]:https://x.com/sh1ma/status/2078146772367720493
[^2]:https://x.com/sh1ma/status/2072666550436556888
