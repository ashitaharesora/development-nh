# ashitaHARESORA′ 再構成スターター

このフォルダは、現在の静的HTMLサイトを **microCMS を後から載せやすい構成** に整理したスターターです。

## 含めたもの
- 固定ページ: トップ / 事務所案内 / サービス / FAQ / お問い合わせ / アクセス / プライバシーポリシー
- 一覧・詳細: お知らせ / ブログ / 支援事例
- 共通化: `assets/css/style.css` と `assets/js/main.js`
- microCMS 連携のたたき台: `scripts/fetch-microcms.mjs` `scripts/build-pages.mjs`
- GitHub Pages 用 workflow
- `robots.txt` `sitemap.xml` `404.html`

## まずやること
1. いま使っている画像・ロゴ・フォントを `assets/img/` `assets/fonts/` に移動
2. CSS のフォント指定を必要に応じて調整
3. microCMS に `news` `blog` `works` の API を作成
4. GitHub Secrets に `MICROCMS_SERVICE_DOMAIN` と `MICROCMS_API_KEY` を設定
5. Webhook で `repository_dispatch` を飛ばす設定を追加

## 補足
- 事例ページは **掲載イメージ** です。公開時は実際の匿名化事例に差し替えてください。
- 旧URL からの移行を考えて、必要なら旧ファイル名のリダイレクトページを残してください。
# development
