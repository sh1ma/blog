---
  title: "I Heard WASI Can Be Used on Cloudflare Workers, So I Tried It"
  publishedAt: "2023-11-17"
---

I saw [an article saying WASI can apparently be used on Cloudflare Workers](https://blog.cloudflare.com/announcing-wasi-on-workers/)
and thought it was amazing, so I tried it.

## Environment

- rustc 1.73.0
- Cloudflare Workers
- npm
  - Required to run `npx wrangler@wasm`
- wasmtime

## Main Topic

### Preparation

Since we’ll use `wasm32-wasi` as the build target, install `wasm32-wasi`.

```sh
rustup target add wasm32-wasi
```

First, create a project with `cargo new`.

```sh
cargo new hello_world
```

Try running it once.

```sh
cargo run
```

Naturally, the output is as follows.

```
Hello, world!
```

Build this to wasm.

```sh
cargo build --target wasm32-wasi --release
```

A `hello_world.wasm` file is created in `target/wasm32-wasi/release`.

I wanted to check locally whether the wasm runs, so I tried using the wasm runtime [wasmtime](https://wasmtime.dev/).

First, install wasmtime.

```sh
curl https://wasmtime.dev/install.sh -sSf | bash
```

Next, try running the wasm.

```sh
wasmtime target/wasm32-wasi/release/hello_world.wasm
```

This also prints `Hello, world!`. That completes the preparation.

### Running It on Cloudflare Workers

```sh
npx wrangler@wasm dev target/wasm32-wasi/release/hello_world.wasm
```

```
 ⛅️ wrangler 0.0.0-c0d7699
---------------------------
⬣ Listening at http://localhost:8787
```

A server starts up like this, so if you access it from a browser or similar, you should see `Hello, World!` printed.
Apparently the main function is invoked when an HTTP request is triggered.

It looks like standard input can be passed by using a POST request, so let’s try that.

First, rewrite the code so it receives standard input.

```rust
fn main() {
    let mut input = String::new();
    std::io::stdin().read_line(&mut input).unwrap();
    println!("Hello, world! {}", input);
}
```

Build it again and run it with wranlger.

```sh
cargo build --target wasm32-wasi --release
npx wrangler@wasm dev target/wasm32-wasi/release/hello_world.wasm
```

Send a POST request with curl.

```sh
curl -X POST -d sh1ma https://localhost:8787
```

The response was `Hello, World! sh1ma`.

## Summary

In this way, I was able to run an ordinary rust program on Cloudflare Workers.

That said, at the moment it apparently isn’t possible to call APIs like Cloudflare d1 from WASI? (I heard this from someone.)

I’m thinking of using this to make a Function that returns images with exif removed, so if I manage to do it, I’ll probably put the code on github.
