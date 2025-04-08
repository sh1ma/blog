package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"io/fs"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"
)

type FrontMatter struct {
	Title       string `json:"title"`
	PublishedAt string `json:"publishedAt"`
}

// Notionのテキストブロック一つあたりの最大文字数
const maxTextBlockLength = 2000

// 有効なコード言語リスト
var validCodeLanguages = map[string]bool{
	"abap": true, "agda": true, "arduino": true, "ascii art": true, "assembly": true,
	"bash": true, "basic": true, "bnf": true, "c": true, "c#": true, "c++": true,
	"clojure": true, "coffeescript": true, "coq": true, "css": true, "dart": true,
	"dhall": true, "diff": true, "docker": true, "ebnf": true, "elixir": true,
	"elm": true, "erlang": true, "f#": true, "flow": true, "fortran": true,
	"gherkin": true, "glsl": true, "go": true, "graphql": true, "groovy": true,
	"haskell": true, "hcl": true, "html": true, "idris": true, "java": true,
	"javascript": true, "json": true, "julia": true, "kotlin": true, "latex": true,
	"less": true, "lisp": true, "livescript": true, "llvm ir": true, "lua": true,
	"makefile": true, "markdown": true, "markup": true, "matlab": true, "mathematica": true,
	"mermaid": true, "nix": true, "notion formula": true, "objective-c": true, "ocaml": true,
	"pascal": true, "perl": true, "php": true, "plain text": true, "powershell": true,
	"prolog": true, "protobuf": true, "purescript": true, "python": true, "r": true,
	"racket": true, "reason": true, "ruby": true, "rust": true, "sass": true,
	"scala": true, "scheme": true, "scss": true, "shell": true, "smalltalk": true,
	"solidity": true, "sql": true, "swift": true, "toml": true, "typescript": true,
	"vb.net": true, "verilog": true, "vhdl": true, "visual basic": true, "webassembly": true,
	"xml": true, "yaml": true, "java/c/c++/c#": true, "notionscript": true,
}

func main() {
	notionSecret := os.Getenv("NOTION_INTEGRATION_SECRET")
	if notionSecret == "" {
		fmt.Println("NOTION_INTEGRATION_SECRET環境変数が設定されていないのだ")
		os.Exit(1)
	}

	databaseID := os.Getenv("NOTION_DATABASE_ID")
	if databaseID == "" {
		fmt.Println("NOTION_DATABASE_ID環境変数が設定されていないのだ")
		os.Exit(1)
	}

	// 特定のファイルだけを処理するための引数を取得
	var targetFile string
	if len(os.Args) > 1 {
		targetFile = os.Args[1]
	}

	// Markdownファイルを読み込む
	postsDir := "/Users/sh1ma/Projects/github.com/sh1ma/blog/src/markdown/posts"
	err := filepath.WalkDir(postsDir, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}

		if !d.IsDir() && strings.HasSuffix(d.Name(), ".md") {
			// 特定のファイルだけを処理する場合
			if targetFile != "" && !strings.Contains(d.Name(), targetFile) {
				return nil
			}

			// Markdownファイルを読み込む
			content, err := os.ReadFile(path)
			if err != nil {
				return err
			}

			// Front Matterを解析する
			frontMatter, contentText := parseFrontMatter(string(content))
			if frontMatter == nil {
				fmt.Printf("Front Matterの解析に失敗したのだ: %s\n", path)
				return nil
			}

			// 日付をパースする
			var date time.Time
			var parseErr error

			if frontMatter.PublishedAt != "" {
				date, parseErr = time.Parse("2006-01-02", frontMatter.PublishedAt)
			} else {
				// ファイル名から日付を取得する(例: 20240101_akeome.md)
				fileName := filepath.Base(path)
				if len(fileName) >= 8 && strings.IndexByte(fileName, '_') > 0 {
					dateStr := fileName[:8]
					date, parseErr = time.Parse("20060102", dateStr)
				} else {
					parseErr = fmt.Errorf("日付情報が見つからないのだ")
				}
			}

			if parseErr != nil {
				fmt.Printf("日付の解析に失敗したのだ: %s - %s\n", path, parseErr)
				return nil
			}

			// Markdownを解析してNotionのブロックに変換する
			blocks := parseMarkdownToBlocks(contentText, filepath.Dir(path))

			// Notionのデータベースに書き込む
			err = createNotionPage(notionSecret, databaseID, *frontMatter, blocks, date)
			if err != nil {
				fmt.Printf("Notionページの作成に失敗したのだ: %s\n", err)
				return nil
			}

			fmt.Printf("ページを作成したのだ: %s\n", path)
		}

		return nil
	})

	if err != nil {
		fmt.Printf("ディレクトリの探索でエラーが発生したのだ: %s\n", err)
		os.Exit(1)
	}
}

func createNotionPage(apiKey, databaseID string, frontMatter FrontMatter, blocks []map[string]interface{}, date time.Time) error {
	url := "https://api.notion.com/v1/pages"

	// NotionのAPIリクエスト用のJSONを作成する
	requestBody := map[string]interface{}{
		"parent": map[string]interface{}{
			"database_id": databaseID,
		},
		"properties": map[string]interface{}{
			"Title": map[string]interface{}{
				"title": []map[string]interface{}{
					{
						"text": map[string]string{
							"content": frontMatter.Title,
						},
					},
				},
			},
			"PublishedAt": map[string]interface{}{
				"date": map[string]interface{}{
					"start": date.Format("2006-01-02"),
				},
			},
		},
		"children": blocks,
	}

	// JSONにエンコード
	jsonData, err := json.Marshal(requestBody)
	if err != nil {
		return err
	}

	// HTTPリクエストを作成
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return err
	}

	// ヘッダーを設定
	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Notion-Version", "2022-06-28")

	// リクエストを送信
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	// レスポンスを確認
	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("HTTPステータスエラー: %d, レスポンス: %s", resp.StatusCode, string(body))
	}

	return nil
}

func parseMarkdownToBlocks(markdown string, basePath string) []map[string]interface{} {
	var blocks []map[string]interface{}
	lines := strings.Split(markdown, "\n")

	// 現在のブロックタイプと内容を保持する
	var currentBlockType string
	var currentContent []string
	var codeLanguage string

	// 行ごとに処理する
	processCurrentBlock := func() {
		if len(currentContent) == 0 {
			return
		}

		content := strings.Join(currentContent, "\n")

		switch currentBlockType {
		case "heading_1", "heading_2", "heading_3":
			blocks = append(blocks, createHeadingBlock(currentBlockType, content))
		case "code":
			blocks = append(blocks, createCodeBlock(content, codeLanguage))
		case "bulleted_list_item":
			for _, block := range createTextBlocksWithLimit(content, func(text string) map[string]interface{} {
				return createBulletedListItemBlock(text)
			}) {
				blocks = append(blocks, block)
			}
		case "numbered_list_item":
			for _, block := range createTextBlocksWithLimit(content, func(text string) map[string]interface{} {
				return createNumberedListItemBlock(text)
			}) {
				blocks = append(blocks, block)
			}
		case "quote":
			for _, block := range createTextBlocksWithLimit(content, func(text string) map[string]interface{} {
				return createQuoteBlock(text)
			}) {
				blocks = append(blocks, block)
			}
		case "image":
			blocks = append(blocks, createImageBlock(content, basePath))
		default:
			// 段落として処理
			if strings.TrimSpace(content) != "" {
				for _, block := range createTextBlocksWithLimit(content, createParagraphBlock) {
					blocks = append(blocks, block)
				}
			}
		}

		// 状態をリセット
		currentBlockType = ""
		currentContent = nil
		codeLanguage = ""
	}

	inCodeBlock := false

	for i := 0; i < len(lines); i++ {
		line := lines[i]

		// コードブロック内部の処理
		if inCodeBlock {
			if strings.HasPrefix(line, "```") {
				inCodeBlock = false
				processCurrentBlock()
			} else {
				currentContent = append(currentContent, line)
			}
			continue
		}

		// コードブロックの開始
		if strings.HasPrefix(line, "```") {
			processCurrentBlock()
			inCodeBlock = true
			currentBlockType = "code"
			codeLanguage = strings.TrimSpace(strings.TrimPrefix(line, "```"))
			continue
		}

		// 見出し
		if strings.HasPrefix(line, "# ") {
			processCurrentBlock()
			currentBlockType = "heading_1"
			currentContent = append(currentContent, strings.TrimSpace(strings.TrimPrefix(line, "# ")))
			continue
		}

		if strings.HasPrefix(line, "## ") {
			processCurrentBlock()
			currentBlockType = "heading_2"
			currentContent = append(currentContent, strings.TrimSpace(strings.TrimPrefix(line, "## ")))
			continue
		}

		if strings.HasPrefix(line, "### ") {
			processCurrentBlock()
			currentBlockType = "heading_3"
			currentContent = append(currentContent, strings.TrimSpace(strings.TrimPrefix(line, "### ")))
			continue
		}

		// 箇条書きリスト
		if match, _ := regexp.MatchString(`^\s*-\s`, line); match {
			if currentBlockType != "bulleted_list_item" {
				processCurrentBlock()
				currentBlockType = "bulleted_list_item"
			}
			content := strings.TrimSpace(strings.TrimPrefix(strings.TrimSpace(line), "- "))
			currentContent = append(currentContent, content)
			continue
		}

		// 番号付きリスト
		if match, _ := regexp.MatchString(`^\s*\d+\.\s`, line); match {
			if currentBlockType != "numbered_list_item" {
				processCurrentBlock()
				currentBlockType = "numbered_list_item"
			}
			content := strings.TrimSpace(regexp.MustCompile(`^\s*\d+\.\s`).ReplaceAllString(line, ""))
			currentContent = append(currentContent, content)
			continue
		}

		// 引用
		if strings.HasPrefix(line, "> ") {
			if currentBlockType != "quote" {
				processCurrentBlock()
				currentBlockType = "quote"
			}
			content := strings.TrimSpace(strings.TrimPrefix(line, "> "))
			currentContent = append(currentContent, content)
			continue
		}

		// 画像
		if match, _ := regexp.MatchString(`!\[.*?\]\(.*?\)`, line); match {
			processCurrentBlock()
			currentBlockType = "image"
			currentContent = append(currentContent, line)
			processCurrentBlock() // 画像は即座に処理
			continue
		}

		// 空行
		if strings.TrimSpace(line) == "" {
			if currentBlockType != "" && currentBlockType != "paragraph" {
				processCurrentBlock()
				continue
			}

			// 段落内の改行として処理
			if currentBlockType == "paragraph" && len(currentContent) > 0 {
				currentContent = append(currentContent, "")
			}
			continue
		}

		// その他は段落として処理
		if currentBlockType == "" {
			currentBlockType = "paragraph"
		}

		// 段落に行を追加
		if currentBlockType == "paragraph" {
			currentContent = append(currentContent, line)
		} else {
			// 別のブロックタイプならば段落として処理
			processCurrentBlock()
			currentBlockType = "paragraph"
			currentContent = append(currentContent, line)
		}
	}

	// 最後のブロックを処理
	processCurrentBlock()

	return blocks
}

// テキストが長すぎる場合に分割するヘルパー関数
func createTextBlocksWithLimit(content string, createBlockFunc func(string) map[string]interface{}) []map[string]interface{} {
	var blocks []map[string]interface{}

	// テキストが短い場合はそのまま処理
	if len(content) <= maxTextBlockLength {
		blocks = append(blocks, createBlockFunc(content))
		return blocks
	}

	// テキストを分割して処理
	for i := 0; i < len(content); i += maxTextBlockLength {
		end := i + maxTextBlockLength
		if end > len(content) {
			end = len(content)
		}

		chunk := content[i:end]
		blocks = append(blocks, createBlockFunc(chunk))
	}

	return blocks
}

func createParagraphBlock(content string) map[string]interface{} {
	return map[string]interface{}{
		"object": "block",
		"type":   "paragraph",
		"paragraph": map[string]interface{}{
			"rich_text": []map[string]interface{}{
				{
					"type": "text",
					"text": map[string]interface{}{
						"content": content,
					},
				},
			},
		},
	}
}

func createHeadingBlock(headingType, content string) map[string]interface{} {
	// 見出しは短いので分割は考慮しない
	if len(content) > maxTextBlockLength {
		content = content[:maxTextBlockLength]
	}

	return map[string]interface{}{
		"object": "block",
		"type":   headingType,
		headingType: map[string]interface{}{
			"rich_text": []map[string]interface{}{
				{
					"type": "text",
					"text": map[string]interface{}{
						"content": content,
					},
				},
			},
			"color": "default",
		},
	}
}

func createCodeBlock(content, language string) map[string]interface{} {
	// 言語名を標準化
	language = strings.ToLower(language)

	// 有効な言語名かチェック
	if !validCodeLanguages[language] {
		language = "plain text"
	}

	return map[string]interface{}{
		"object": "block",
		"type":   "code",
		"code": map[string]interface{}{
			"rich_text": []map[string]interface{}{
				{
					"type": "text",
					"text": map[string]interface{}{
						"content": content,
					},
				},
			},
			"language": language,
		},
	}
}

func createBulletedListItemBlock(content string) map[string]interface{} {
	return map[string]interface{}{
		"object": "block",
		"type":   "bulleted_list_item",
		"bulleted_list_item": map[string]interface{}{
			"rich_text": []map[string]interface{}{
				{
					"type": "text",
					"text": map[string]interface{}{
						"content": content,
					},
				},
			},
			"color": "default",
		},
	}
}

func createNumberedListItemBlock(content string) map[string]interface{} {
	return map[string]interface{}{
		"object": "block",
		"type":   "numbered_list_item",
		"numbered_list_item": map[string]interface{}{
			"rich_text": []map[string]interface{}{
				{
					"type": "text",
					"text": map[string]interface{}{
						"content": content,
					},
				},
			},
			"color": "default",
		},
	}
}

func createQuoteBlock(content string) map[string]interface{} {
	return map[string]interface{}{
		"object": "block",
		"type":   "quote",
		"quote": map[string]interface{}{
			"rich_text": []map[string]interface{}{
				{
					"type": "text",
					"text": map[string]interface{}{
						"content": content,
					},
				},
			},
			"color": "default",
		},
	}
}

func createImageBlock(markdownImage, basePath string) map[string]interface{} {
	// ![alt text](image-url) の形式から画像URLを抽出
	regex := regexp.MustCompile(`!\[(.*?)\]\((.*?)\)`)
	matches := regex.FindStringSubmatch(markdownImage)

	if len(matches) < 3 {
		return createParagraphBlock(markdownImage)
	}

	imageURL := matches[2]

	// 相対パスの場合は絶対URLに変換（この部分は環境に合わせて調整する必要があります）
	if !strings.HasPrefix(imageURL, "http") {
		// ここでは単純に相対パスの処理をしていませんが、必要に応じて実装してください
		// 例: imageURL = "https://yourdomain.com/images/" + filepath.Base(imageURL)
	}

	return map[string]interface{}{
		"object": "block",
		"type":   "image",
		"image": map[string]interface{}{
			"type": "external",
			"external": map[string]interface{}{
				"url": imageURL,
			},
		},
	}
}

func parseFrontMatter(content string) (*FrontMatter, string) {
	// Front Matterを探す
	if !strings.HasPrefix(content, "---\n") {
		return nil, content
	}

	endIndex := strings.Index(content[4:], "---")
	if endIndex == -1 {
		return nil, content
	}

	frontMatterContent := content[4 : endIndex+4]
	remainingContent := content[endIndex+7:]

	// Front Matterを解析する
	frontMatter := &FrontMatter{}

	// タイトル
	titleMatch := extractField(frontMatterContent, "title: ")
	if titleMatch != "" {
		frontMatter.Title = strings.Trim(titleMatch, "\"'")
	}

	// 公開日
	publishedAtMatch := extractField(frontMatterContent, "publishedAt: ")
	if publishedAtMatch != "" {
		frontMatter.PublishedAt = strings.Trim(publishedAtMatch, "\"'")
	}

	return frontMatter, remainingContent
}

func extractField(content, fieldPrefix string) string {
	lineStart := strings.Index(content, fieldPrefix)
	if lineStart == -1 {
		return ""
	}

	lineStart += len(fieldPrefix)
	lineEnd := strings.Index(content[lineStart:], "\n")

	if lineEnd == -1 {
		return content[lineStart:]
	}

	return content[lineStart : lineStart+lineEnd]
}
