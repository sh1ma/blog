---
title: "Trying out WASI on Cloudflare Workers"
publishedAt: "2023-11-17"
---

I came across [an article saying Cloudflare Workers now supports WASI](https://blog.cloudflare.com/announcing-wasi-on-workers/).
It looked cool, so I gave it a try.

## Environment

- rustc 1.73.0
- Cloudflare Workers
- npm
  - Required to run `npx wrangler@wasm`
- wasmtime

## Walkthrough

### Setup

The build target is `wasm32-wasi`, so install it first.

```sh
rustup target add wasm32-wasi
```

Create a new project with `cargo new`.

```sh
cargo new hello_world
```

Run it once to make sure it works.

```sh
cargo run
```

As expected, you get:

```
Hello, world!
```

Now build it to wasm.

```sh
cargo build --target wasm32-wasi --release
```

This produces `hello_world.wasm` under `target/wasm32-wasi/release`.

To confirm the wasm actually runs locally, I'll use the wasm runtime [wasmtime](https://wasmtime.dev/).

Install wasmtime:

```sh
curl https://wasmtime.dev/install.sh -sSf | bash
```

Then run the wasm:

```sh
wasmtime target/wasm32-wasi/release/hello_world.wasm
```

This prints `Hello, world!` as well. That's all the setup we need.

### Running it on Cloudflare Workers

```sh
npx wrangler@wasm dev target/wasm32-wasi/release/hello_world.wasm
```

```
 ⛅️ wrangler 0.0.0-c0d7699
---------------------------
⬣ Listening at http://localhost:8787
```

The server comes up like this, and if you hit it from a browser you'll see `Hello, World!` in the response.
It looks like an incoming HTTP request is what triggers the `main` function.

It also looks like you can pass stdin via a POST request, so let's try that.

First, rewrite the code to read from stdin.

```rust
fn main() {
    let mut input = String::new();
    std::io::stdin().read_line(&mut input).unwrap();
    println!("Hello, world! {}", input);
}
```

Rebuild and start it up with wrangler again.

```sh
cargo build --target wasm32-wasi --release
npx wrangler@wasm dev target/wasm32-wasi/release/hello_world.wasm
```

Then send a POST request with curl:

```sh
curl -X POST -d sh1ma https://localhost:8787
```

The response came back as `Hello, World! sh1ma`.

## Wrap-up

And that's how you run a plain Rust program on Cloudflare Workers.

That said, from what I've heard you can't call APIs like Cloudflare D1 from WASI at the moment (secondhand info, so take it with a grain of salt).

I'm thinking of using this to build a Function that returns an image with its EXIF data stripped. If I get it working, I'll probably put the code up on GitHub.
