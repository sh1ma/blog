import { createFileRoute } from "@tanstack/react-router"
import { LuExternalLink, LuSparkles } from "react-icons/lu"
import { SiGithub, SiX, SiYoutube } from "react-icons/si"

export const Route = createFileRoute("/about")({
  component: AboutPage,
  head: () => ({
    meta: [
      { title: "About - blog.sh1ma.dev" },
      { name: "description", content: "sh1ma について" },
    ],
  }),
})

// GitHub 上の個人リポジトリ (フォーク除く) から集計した値 (2026 年 9 月時点)
// - share: 直近 1 年の自分のコミット数を、各リポジトリの言語別バイト比で按分した割合
// - repos: 直近 1 年に更新があり、その言語が 20% 以上を占めるリポジトリ数
// - since: その言語が 20% 以上を占めるリポジトリのうち最も古いものの作成年
type Language = {
  name: string
  share: number
  repos: number
  since: number
  note: string
}

const languages: Language[] = [
  {
    name: "TypeScript",
    share: 73,
    repos: 15,
    since: 2020,
    note: "個人開発のメイン。このブログをはじめ、Web アプリや Cloudflare Workers 上のツールはだいたい TypeScript で書いている。",
  },
  {
    name: "Go",
    share: 12,
    repos: 15,
    since: 2023,
    note: "CLI ツールはだいたい Go。bwpk や image2webp、get-tweet など、ちょっとしたツールを作るときによく使う。",
  },
  {
    name: "Python",
    share: 5,
    repos: 7,
    since: 2019,
    note: "昔はメインで、pyne や apywrapper を書いていた。最近は解析用のスクリプトや herdr-auto-title のような小さいツールで使う程度。",
  },
  {
    name: "JavaScript",
    share: 5,
    repos: 3,
    since: 2020,
    note: "主に frida のスクリプトとして使う。iostrace など iOS の解析まわり。",
  },
  {
    name: "Rust",
    share: 1,
    repos: 1,
    since: 2020,
    note: "仕事では書いているが、個人開発ではたまに触る程度。Angelic-Angel や crabapple など。",
  },
]

const otherLanguages = ["C", "Swift", "Kotlin", "Objective-C"]

const hobbies = [
  {
    title: "読書",
    items: [
      "小説が好き。最近はあまり読めていない。",
      "最近は専ら技術書ばかり読んでいる。",
    ],
  },
  {
    title: "ニコニコ動画",
    items: [
      "毎日見ている。",
      "合成音声キャラが喋る動画、特に「ソフトウェアトーク劇場」タグをよく見る。",
    ],
  },
]

const projects = [
  {
    name: "sh1ma/pyne",
    tagline: "LINE for Python",
    description:
      "LINE の API を Python から扱うためのライブラリ。現在はアーカイブ済み。",
    href: "https://github.com/sh1ma/pyne",
    archived: true,
  },
  {
    name: "sh1ma/voicevoxcore.go",
    tagline: "VOICEVOX Core の Go ラッパー",
    description:
      "voicevox_core を Go から呼び出すためのラッパー。FFI を利用している。",
    href: "https://github.com/sh1ma/voicevoxcore.go",
    archived: false,
  },
  {
    name: "sh1ma/iostrace",
    tagline: "frida ベースの iOS 用 strace 代替",
    description:
      "64bit iOS デバイス向けの strace 相当を frida で実現するツール。",
    href: "https://github.com/sh1ma/iostrace",
    archived: false,
  },
  {
    name: "sh1ma/bwpk",
    tagline: "Bitwarden の passkey を CLI から使う",
    description:
      "Bitwarden に保存した passkey (FIDO2/WebAuthn) をコマンドラインから利用するための CLI。マスターパスワードや TouchID で解錠できる。",
    href: "https://github.com/sh1ma/bwpk",
    archived: false,
  },
  {
    name: "sh1ma/Angelic-Angel",
    tagline: "Web Push でツイートをストリーミング受信するサーバー",
    description:
      "ブラウザが Web Push を受け取る仕組みを模倣し、その経路経由でツイートをストリーミング受信するサーバー。",
    href: "https://github.com/sh1ma/Angelic-Angel",
    archived: false,
  },
  {
    name: "sh1ma/try-k3s-on-cf-workers-public",
    tagline: "Cloudflare Workers Containers 上で k3s を動かす実験",
    description:
      "Cloudflare Workers Containers の中に single-node の k3s クラスタを立てて、Pod をデプロイして遊べるようにする実験プロジェクト。",
    href: "https://github.com/sh1ma/try-k3s-on-cf-workers-public",
    archived: false,
  },
]

function AboutPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <section className="mb-12 rounded-2xl bg-bg-surface p-8 shadow-soft">
        <div className="mb-6 flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <img
            src="/anon-illust.jpeg"
            alt="sh1ma のアイコン"
            width={96}
            height={96}
            className="size-24 shrink-0 rounded-full object-cover shadow-soft ring-2 ring-brand-primary-light/40"
          />
          <div>
            <div className="mb-3 inline-flex items-center gap-1 rounded-full bg-brand-primary-light/20 px-3 py-1 text-xs font-medium text-brand-primary">
              <LuSparkles size={14} />
              <span>About me</span>
            </div>
            <h2 className="text-4xl font-bold tracking-tight text-text-primary">
              sh1ma
            </h2>
          </div>
        </div>
        <p className="mb-6 text-lg leading-relaxed text-text-secondary">
          エンジニアをしています。普段はサーバーサイドや低レイヤ寄りのことを触ることが多いです。
        </p>
        <dl className="flex flex-wrap gap-x-8 gap-y-3 border-t border-border-subtle pt-6 text-sm">
          <div className="flex items-center gap-2">
            <dt className="text-text-muted">生まれ</dt>
            <dd className="font-medium text-text-primary">2000 年</dd>
          </div>
          <div className="flex items-center gap-2">
            <dt className="text-text-muted">職業</dt>
            <dd className="font-medium text-text-primary">エンジニア</dd>
          </div>
          <div className="flex items-center gap-2">
            <dt className="text-text-muted">GitHub</dt>
            <dd>
              <a
                href="https://github.com/sh1ma"
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1 font-medium text-brand-primary hover:underline"
              >
                <SiGithub size={14} />
                @sh1ma
              </a>
            </dd>
          </div>
          <div className="flex items-center gap-2">
            <dt className="text-text-muted">X</dt>
            <dd>
              <a
                href="https://x.com/sh1ma"
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1 font-medium text-brand-primary hover:underline"
              >
                <SiX size={14} />
                @sh1ma
              </a>
            </dd>
          </div>
          <div className="flex items-center gap-2">
            <dt className="text-text-muted">YouTube</dt>
            <dd>
              <a
                href="https://www.youtube.com/@am1hs"
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1 font-medium text-brand-primary hover:underline"
              >
                <SiYoutube size={14} />
                @am1hs
              </a>
            </dd>
          </div>
        </dl>
      </section>

      <Section title="Skills" subtitle="個人開発で使っている言語">
        <p className="mb-4 text-sm leading-relaxed text-text-muted">
          GitHub の個人リポジトリの直近 1
          年のコミットから集計した、言語ごとの割合です (2026 年 9 月時点)。
        </p>
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {languages.map((lang) => (
            <LanguageCard key={lang.name} language={lang} />
          ))}
        </ul>
        <p className="mt-4 text-sm text-text-secondary">
          ほかに {otherLanguages.join(" / ")} もちょっとだけ書いています。
        </p>
      </Section>

      <Section title="Hobbies" subtitle="趣味">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {hobbies.map((hobby) => (
            <div
              key={hobby.title}
              className="rounded-xl bg-bg-surface p-5 shadow-soft"
            >
              <h4 className="mb-3 text-lg font-bold text-text-primary">
                {hobby.title}
              </h4>
              <ul className="flex flex-col gap-2 text-sm leading-relaxed text-text-secondary">
                {hobby.items.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span
                      aria-hidden
                      className="mt-2 size-1 shrink-0 rounded-full bg-brand-primary"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Projects" subtitle="作ったもの">
        <ul className="flex flex-col gap-4">
          {projects.map((project) => (
            <li key={project.name}>
              <a
                href={project.href}
                target="_blank"
                rel="noreferrer noopener"
                className="group flex flex-col gap-2 rounded-xl bg-bg-surface p-5 shadow-soft transition-all hover:-translate-y-1 hover:shadow-hover"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <SiGithub
                    size={18}
                    className="text-text-muted group-hover:text-brand-primary"
                  />
                  <h4 className="text-lg font-bold text-brand-primary group-hover:underline">
                    {project.name}
                  </h4>
                  {project.archived && (
                    <span className="rounded-full bg-bg-muted px-2 py-0.5 text-xs font-medium text-text-muted">
                      Archived
                    </span>
                  )}
                  <LuExternalLink
                    size={14}
                    className="text-text-muted opacity-0 transition-opacity group-hover:opacity-100"
                  />
                </div>
                <p className="text-sm font-medium text-text-secondary">
                  {project.tagline}
                </p>
                <p className="text-sm leading-relaxed text-text-secondary">
                  {project.description}
                </p>
              </a>
            </li>
          ))}
        </ul>
      </Section>
    </main>
  )
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <section className="mb-12">
      <div className="mb-6 flex items-baseline justify-between border-b border-border-subtle pb-3">
        <h3 className="text-2xl font-bold text-text-primary">{title}</h3>
        <span className="text-sm text-text-muted">{subtitle}</span>
      </div>
      {children}
    </section>
  )
}

function LanguageCard({ language }: { language: Language }) {
  return (
    <li className="flex flex-col gap-3 rounded-xl bg-bg-surface p-5 shadow-soft">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-lg font-bold text-text-primary">{language.name}</h4>
        <span className="rounded-full bg-bg-muted px-2 py-0.5 text-xs font-medium text-text-muted">
          {language.since} 年〜
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <UsageBar share={language.share} />
        <p className="text-xs text-text-muted">
          コミットの {language.share}% ・ {language.repos} リポジトリ
        </p>
      </div>
      <p className="text-sm leading-relaxed text-text-secondary">
        {language.note}
      </p>
    </li>
  )
}

function UsageBar({ share }: { share: number }) {
  return (
    <div
      className="h-1.5 w-full rounded-full bg-bg-muted"
      title={`直近 1 年のコミットの ${share}%`}
    >
      <div
        className="h-full rounded-full bg-brand-primary"
        style={{ width: `${share}%` }}
      />
    </div>
  )
}
