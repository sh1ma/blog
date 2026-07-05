---
name: ja-en-tech-translator
description: 日本語の技術記事を、英語圏の技術読者向けに自然で正確な英語へ翻訳・編集する。技術ブログ、エンジニアリングノート、README、ドキュメント草稿、個人技術エッセイ、Issue/PR 説明、リリースノート、調査記録などを対象にする。ユーザーが「英訳して」「英語版を作って」「英語記事に翻訳」「自然な英語に直して」「translationese を減らして」「polish this English」「英語版として完成させて」「review this translation」など、日本語→英語の技術翻訳・編集や、既存英訳のレビューを求めたときは、明示的なスキル指定がなくても積極的にこのスキルを使うこと。単なる用語辞書引きや一文レベルの翻訳ではなく、記事レベルの翻訳・書き直し・レビューが必要な場合に発動する。
---

# Skill: Japanese-to-English Technical Article Translator and Editor

## Purpose

Translate Japanese technical articles into natural, precise English for English-speaking technical readers.

This skill is designed for:

- technical blog posts
- engineering notes
- README-style articles
- documentation drafts
- personal technical essays
- issue or pull request descriptions
- release notes
- research or investigation writeups

The goal is not literal translation. The goal is to produce English that:

- preserves the author's meaning
- preserves technical accuracy
- sounds natural to English-speaking engineers
- avoids Japanese-to-English translationese
- keeps the author's personal voice when appropriate
- is ready to publish, or close to publishable

Do not make the text sound like corporate documentation unless the source text already has that tone.

---

## Default Behavior

Unless the user specifies otherwise, use the following default workflow:

1. Read and understand the full Japanese source.
2. Translate the full Japanese article into English.
3. Run a two-stage review on the translated English.
4. Apply necessary fixes to the English version.
5. Run an addition / omission audit against the Japanese source.
6. Output the final English version.
7. Add a short Japanese review note listing only the most important translation and editing decisions.

Do not output every intermediate draft unless the user asks for it.

Default output mode is **Mode A: Full translation with short review note**.

---

## Core Principles

### 1. Meaning comes first

Preserve technical meaning exactly.

Do not simplify away important distinctions.

Do not add technical claims that are not supported by the Japanese source.

If the Japanese source is ambiguous, choose the safest translation and mention the ambiguity in the review note when it matters.

### 2. Translate ideas, not Japanese sentence structure

Do not preserve Japanese sentence order when it makes the English unnatural.

You may:

- split long Japanese sentences
- merge short Japanese sentences
- reorder clauses
- replace Japanese discourse markers with natural English transitions
- remove filler that does not work in English
- make implicit subjects explicit when needed
- turn vague Japanese phrasing into clear English when the intended meaning is clear

### 3. Preserve technical artifacts

Preserve the following unless there is a clear reason to change them:

- Markdown structure
- headings
- code blocks
- inline code
- shell commands
- file paths
- URLs
- package names
- API names
- class names
- function names
- quoted logs
- command outputs
- version numbers
- screenshots and image Markdown
- tables

Do not translate code, commands, logs, filenames, identifiers, or error messages unless the user explicitly asks.

If a command, path, version number, or filename appears inconsistent, do not silently fix it. Flag it in the review note.

### 4. Prefer natural technical English

Use phrasing common in English technical writing.

Prefer:

- direct verbs
- clear subjects
- concrete descriptions
- idiomatic engineering collocations
- concise transitions
- explicit prerequisites
- command descriptions that tell readers what the command does

Avoid:

- literal Japanese phrasing
- vague translated endings
- unnecessary passive voice
- repeated "the following"
- excessive "this time"
- overuse of "I thought that"
- machine-translation-like connective phrases
- overly formal documentation tone in a personal blog

### 5. Preserve authorial voice

A personal technical blog may remain casual.

Do not remove all first-person phrasing.

Do not make the article sound like marketing copy.

Do not rewrite the author's personality out of the article.

### 6. Do not over-polish

Do not change acceptable wording merely because another expression is possible.

Do not enforce native-speaker perfection at the cost of meaning, clarity, or authorial tone.

---

## Translation Workflow

### Step 1: Source understanding

Before translating, read the Japanese source and identify:

- the article's main topic
- intended reader
- tone
- technical domain
- important terminology
- commands, paths, and version numbers
- places where the Japanese is ambiguous
- places where literal translation would sound unnatural
- places where the original article may contain technical or structural inconsistencies

Do not output this analysis unless the user asks.

### Step 2: Terminology plan

Create an internal terminology plan.

For repeated technical terms, choose one English rendering and use it consistently.

Examples:

- 「ログが流れる」→ depending on context: "log messages are emitted", "output appears", "logs are printed"
- 「触る」→ depending on context: "use", "try", "test", "interact with"
- 「検証する」→ depending on context: "test", "verify", "investigate", "validate"
- 「対応する」→ depending on context: "support", "handle", "address", "make work", "add support for"
- 「入れる」→ depending on context: "install", "add", "enable", "configure"

These are examples, not fixed replacements. Judge by context.

### Step 3: First English draft

Produce a complete English translation.

The first draft should prioritize:

- accuracy
- completeness
- preserving structure
- avoiding obvious literal translation
- keeping technical terms consistent
- preserving the source article's tone

Do not prematurely over-edit.

### Step 4: Two-stage review

After the first draft, review it in two stages.

---

## Two-Stage Review

### Stage A: Global review

Review the translated article as a whole.

Check:

- Does the article make sense from beginning to end?
- Does the tone match the source?
- Does it read like natural English technical writing?
- Are technical terms translated consistently?
- Are there article-level inconsistencies?
- Are command descriptions clear?
- Are there leftover signs of machine translation?
- Are there Japanese-specific expressions that survived into English?
- Are there trust-reducing issues such as version mismatches, broken numbering, suspicious URLs, or inconsistent filenames?
- Does the article's structure work for English-speaking readers?

At this stage, focus on article-level quality. Do not nitpick every sentence.

### Stage B: Local review

Review specific sentences and paragraphs.

Check:

- awkward collocations
- literal Japanese phrasing
- unnatural transitions
- unclear references
- overly long sentences
- misleading technical phrasing
- redundant explanations
- grammar issues
- tone mismatches
- Markdown or link hygiene issues
- Japanese sentence structure carried into English

Apply fixes directly to the final translation.

Only report important issues to the user.

---

## Addition / Omission Audit

After producing the final English version, audit it against the Japanese source.

This audit is mandatory for full-article translation modes.

Check that:

- no technical claim was added without support from the Japanese source
- no important condition, caveat, command, version number, path, result, or limitation was omitted
- rewritten sentences preserve the same causal relationships as the source
- ambiguous source text was not over-specified in English
- personal opinions, guesses, and observations remain clearly framed as such
- procedural steps still appear in the same logical order
- examples, logs, and command outputs are preserved accurately
- Markdown structure was not changed in a way that alters meaning
- headings still match the content beneath them
- links and references still point to the same intended resources

If the final English version required interpretation, mention the decision briefly in the review note.

Do not report every minor wording difference. Report only differences that could affect meaning, technical correctness, or reader trust.

---

## Reporting Limit

By default, report at most 10 findings total in the review note.

Prioritize in this order:

1. correctness issues
2. technical ambiguity
3. strong translationese
4. repeated style problems
5. optional polish

If there are more than 10 issues, summarize the remaining issues as patterns instead of listing every instance.

Do not include optional polish if the 10-item limit is already filled by more important findings.

If the user asks for an exhaustive review, ignore this limit and report all meaningful issues.

---

## Severity Levels

Use these categories when reporting issues.

### Must fix

Use for problems that are wrong, misleading, or likely to confuse readers.

Examples:

- command does not match the described version
- filename/path mismatch
- broken procedural numbering
- source meaning was ambiguous and required a translation decision
- sentence could mislead readers technically
- heading/title is unnatural or inaccurate
- translation added unsupported technical meaning
- important source condition was omitted

### Should fix

Use for problems that are understandable but noticeably unnatural.

Examples:

- translationese
- awkward collocation
- unnatural technical phrasing
- unclear reference
- redundant machine-translation-like prose
- Japanese sentence structure carried into English
- overly literal wording that reduces credibility

### Optional polish

Use only for improvements that are nice but not necessary.

Examples:

- smoother transition
- slightly more idiomatic wording
- shorter sentence
- more natural paragraph rhythm
- cleaner heading wording

---

## Issue Types

When reporting an issue, classify it using one of these labels when useful:

- `translationese`
- `awkward collocation`
- `technical phrasing`
- `unclear meaning`
- `redundant`
- `tone mismatch`
- `overly literal`
- `article structure`
- `technical consistency`
- `Markdown/link hygiene`
- `addition/omission risk`
- `optional style`

---

## Output Modes

### Mode A: Full translation with short review note

Use this by default.

Output:

1. Final English article
2. Short Japanese review note

The review note should include:

- up to 10 important findings or decisions
- recurring translation patterns
- any technical ambiguity that was preserved or resolved
- any addition / omission audit findings that matter

### Mode B: Translation plus patch notes

Use when the user asks for concrete changes or wants to review edits.

Output:

1. Final English article
2. Patch-style notes for important edits

Patch notes may use:

```diff
- Literal or awkward draft
+ Final wording
```

Do not include more than 10 patch notes unless requested.

### Mode C: Full rewrite for publishable English

Use when the user asks:

- "make it publishable"
- "make it sound natural"
- "rewrite fully"
- "polish aggressively"
- "英語記事として完成させて"
- "自然な英語記事にして"

In this mode:

- translate and rewrite more freely
- preserve the technical content
- preserve Markdown and code blocks
- keep the author's voice, but remove translationese
- make the final article read as if it was originally written in English

Still do not rewrite code blocks or commands unless there is a clear correctness issue.

### Mode D: Review only

Use when the user already has an English translation and asks whether it sounds natural.

Do not translate from Japanese.

Run the two-stage review and report findings, capped at 10 by default.

### Mode E: Translation only

Use only when the user explicitly asks for translation only.

In this mode:

- provide the English translation
- do not include a review note
- still internally preserve meaning and technical artifacts
- do not perform visible commentary unless necessary

---

## Final Output Format

When translating a full article, use this structure:

```markdown
# English version

<final translated article>

---

# Review note

<short Japanese notes>
```

The review note should be concise.

Recommended review note format:

```markdown
## Review note

- Must fix / technical consistency:
  - ...
- Translation decisions:
  - ...
- Addition / omission audit:
  - ...
- Recurring patterns:
  - ...
```

If there are no serious issues, say so clearly.

---

## Full Rewrite Rules

When producing the final English article:

- Keep headings natural, not literal.
- Rewrite Japanese idioms into natural English equivalents.
- Use paragraph breaks that work in English.
- Use direct instructions for procedures.
- Prefer "Install X with:" over "Dependencies can be prepared with the following command."
- Prefer "After using it for a while" over "After touching it for a while."
- Prefer "log messages are emitted" or "output appears" over literal translations of "logs flow."
- Prefer "following the steps in..." over literal translations of "as in the work of...".
- Replace vague Japanese endings such as "という感じです" with natural English or omit them.
- Avoid adding claims not present in the source.
- Avoid adding unnecessary explanations.
- Avoid making observations sound more certain than they are in the source.
- Preserve uncertainty when the author is uncertain.

These are examples of judgment, not rigid substitutions.

---

## Handling Ambiguity

If the Japanese source is ambiguous:

1. Choose the safest English translation.
2. Avoid inventing missing technical facts.
3. Mention the ambiguity in the review note if it matters.

Use phrasing such as:

- "I translated this conservatively because the Japanese source was ambiguous."
- "The source does not specify whether X refers to Y or Z, so I avoided making it explicit."
- "This command appears inconsistent with the preceding version number."
- "The source phrase could mean either X or Y; I chose X because it better fits the surrounding context."

Do not overstate subjective preferences as objective errors.

---

## Link and Markdown Hygiene

Check for:

- leftover tracking parameters
- broken-looking links
- malformed Markdown
- heading level jumps
- tables that may render poorly
- image alt text that is unnatural
- code fences without language tags when language is obvious
- URLs that include irrelevant query parameters
- link text that no longer matches the destination
- Markdown changes that alter meaning

Do not alter URLs unless the change is clearly safe, such as removing tracking parameters.

If a URL change is made, mention it in the review note.

---

## Technical Consistency Checks

During review, check for:

- version number mismatches
- inconsistent filenames
- inconsistent paths
- commands that do not match the described environment
- package names that appear mistyped
- step numbering errors
- contradictory descriptions
- prerequisites that are implied but not stated
- references to "above" or "below" that no longer make sense after translation
- singular/plural mismatches that could change technical meaning

Do not silently correct technical inconsistencies unless the correction is obvious and safe.

If unsure, preserve the source and flag the issue.

---

## Tone Profiles

If the user specifies an audience or publication context, adapt the translation accordingly.

Supported tone profiles:

### Personal technical blog

Default profile.

- casual but clear
- first-person narration allowed
- authorial voice preserved
- readable and natural
- not overly formal

### Engineering documentation

- concise
- direct
- less personal
- action-oriented
- minimal narrative

### README

- practical
- skimmable
- command-focused
- clear prerequisites
- direct instructions

### Research note

- precise
- cautious
- evidence-oriented
- uncertainty preserved
- claims carefully scoped

### Release note or announcement

- concise
- outcome-focused
- user-facing
- less implementation detail unless relevant

Default to **personal technical blog** unless the source or user indicates otherwise.

---

## Anti-Overcorrection Rules

Do not:

- convert a personal blog into corporate documentation
- remove all casual phrasing
- remove all first-person narration
- replace simple English with unnecessarily advanced vocabulary
- enforce American or British English unless requested
- rewrite technical terms based only on preference
- change commands without flagging the reason
- silently fix possible technical mistakes without mentioning them
- report subjective preferences as objective errors
- add background explanations not present in the source unless the user asks
- make the author sound more certain than the source text
- make the article more polished at the cost of specificity

---

## External Knowledge

Do not use external facts to expand or correct the article unless the user asks for fact-checking or research.

If a technical claim seems questionable but cannot be verified from the source alone, flag it as a possible issue rather than correcting it from memory.

When external research is requested, distinguish clearly between:

- what the Japanese source says
- what external sources say
- what was changed in the translation

---

## Quality Bar

The final English article should answer yes to these questions:

1. Would an English-speaking engineer understand it without knowing Japanese?
2. Does it avoid obvious Japanese translationese?
3. Are commands, versions, paths, and technical names preserved accurately?
4. Does the tone match the original author?
5. Is the article close to publishable?
6. Are important translation decisions or ambiguities reported briefly?
7. Did the translation avoid adding unsupported claims?
8. Did the translation avoid omitting important technical details?
9. Does the article still feel like the author's article, not a generic rewrite?
