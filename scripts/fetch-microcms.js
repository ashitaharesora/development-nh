/**
 * microCMS からコンテンツを取得して assets/data/ に書き出す
 *
 * 必要な環境変数:
 *   MICROCMS_SERVICE_DOMAIN   例: yourservice  (yourservice.microcms.io の yourservice 部分)
 *   MICROCMS_API_KEY          GET 権限のみのAPIキー（ログには出力しない）
 *   MICROCMS_ENDPOINT_NEWS    お知らせのエンドポイント名
 *   MICROCMS_ENDPOINT_BLOGS   ブログのエンドポイント名
 *   MICROCMS_ENDPOINT_WORKS   支援事例のエンドポイント名
 *   MICROCMS_ENDPOINT_CATEGORIES  カテゴリのエンドポイント名（省略可）
 */

import fs from "node:fs/promises";
import path from "node:path";

const SERVICE_DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN;
const API_KEY = process.env.MICROCMS_API_KEY;
const ENDPOINT_NEWS = process.env.MICROCMS_ENDPOINT_NEWS || "news";
const ENDPOINT_BLOGS = process.env.MICROCMS_ENDPOINT_BLOGS || "blog";
const ENDPOINT_WORKS = process.env.MICROCMS_ENDPOINT_WORKS || "works";
const ENDPOINT_CATEGORIES = process.env.MICROCMS_ENDPOINT_CATEGORIES || "";

if (!SERVICE_DOMAIN || !API_KEY) {
  console.error("[fetch-microcms] ERROR: MICROCMS_SERVICE_DOMAIN と MICROCMS_API_KEY を設定してください。");
  process.exit(1);
}

const BASE_URL = `https://${SERVICE_DOMAIN}.microcms.io/api/v1`;
const OUT_DIR = path.resolve("assets/data");

await fs.mkdir(OUT_DIR, { recursive: true });

/**
 * microCMS エンドポイントを取得して JSON を返す
 * APIキーはリクエストヘッダーにのみ使用し、ログには出力しない
 */
async function fetchEndpoint(endpoint) {
  const url = `${BASE_URL}/${endpoint}?limit=100&orders=-publishedAt`;
  console.log(`[fetch] GET ${url}`);

  const res = await fetch(url, {
    headers: { "X-MICROCMS-API-KEY": API_KEY },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${endpoint} の取得に失敗しました: HTTP ${res.status} ${res.statusText}\n${body}`);
  }

  return res.json();
}

// --- news ---
const newsData = await fetchEndpoint(ENDPOINT_NEWS);
await fs.writeFile(
  path.join(OUT_DIR, "news.json"),
  JSON.stringify(newsData, null, 2),
  "utf-8"
);
console.log(`[done] news.json: ${newsData.contents?.length ?? 0} 件`);

// --- blogs ---
const blogsData = await fetchEndpoint(ENDPOINT_BLOGS);
await fs.writeFile(
  path.join(OUT_DIR, "blogs.json"),
  JSON.stringify(blogsData, null, 2),
  "utf-8"
);
console.log(`[done] blogs.json: ${blogsData.contents?.length ?? 0} 件`);

// --- works ---
const worksData = await fetchEndpoint(ENDPOINT_WORKS);
await fs.writeFile(
  path.join(OUT_DIR, "works.json"),
  JSON.stringify(worksData, null, 2),
  "utf-8"
);
console.log(`[done] works.json: ${worksData.contents?.length ?? 0} 件`);

// --- categories（省略可） ---
if (ENDPOINT_CATEGORIES) {
  const catData = await fetchEndpoint(ENDPOINT_CATEGORIES);
  await fs.writeFile(
    path.join(OUT_DIR, "categories.json"),
    JSON.stringify(catData, null, 2),
    "utf-8"
  );
  console.log(`[done] categories.json: ${catData.contents?.length ?? 0} 件`);
} else {
  await fs.writeFile(
    path.join(OUT_DIR, "categories.json"),
    '{"contents":[],"totalCount":0}\n',
    "utf-8"
  );
  console.log("[skip] categories: MICROCMS_ENDPOINT_CATEGORIES 未設定のため空ファイルを生成");
}

console.log("[fetch-microcms] 完了");
