---
  title: "Cloudflareで管理しているドメインをvercelで使おうとするとリダイレクトループが発生する"
  publishedAt: "2023-11-10"
---

Vercel上にデプロイしたブログをcloudflareで管理している`sh1ma.dev`のサブドメインである`blog.sh1ma.dev`と紐付けようとしたときに嵌りました。  
具体的には多数のリダイレクトが発生してしまい、転送設定がうまくいかなかったのでその解決方法を書きます。

## 結論

[ERR_TOO_MANY_REDIRECTS · Cloudflare SSL/TLS docs](https://developers.cloudflare.com/ssl/troubleshooting/too-many-redirects/)に答えが書いてありました。

> After you add a new domain to Cloudflare, your visitors’ browsers might display ERR_TOO_MANY_REDIRECTS or The page isn’t redirecting properly errors.
> This error occurs when visitors get stuck in a redirect loop.

また、このエラーは以下の3つが原因の可能性があるとのことです。

- > A misconfiguration of your SSL/TLS Encryption mode. (SSL/TLSの暗号化モードの設定不備)
- > Various settings in SSL/TLS > Edge Certificates. (SSL/TLS > Edge Certificatesの設定)
- > A misconfigured redirect rule. (リダイレクトルールの不備)

私の場合は1番目の暗号化モードの不備でした。

Cloudflareのダッシュボードにいき、「SSL/TLS」ページ -> 「overview」ページに行き、
下の画像のようにSSL/TLS encryption modeを`Full`にすることで解決しました。
![Cloudflareのダッシュボードのスクリーンショット](https://cdn.sh1ma.dev/20231110.png)
