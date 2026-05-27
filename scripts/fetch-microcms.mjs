import fs from "node:fs/promises";
import path from "node:path";

const SERVICE_ID = process.env.MICROCMS_SERVICE_ID;
const API_KEY = process.env.MICROCMS_API_KEY;
const ENDPOINT_NEWS = process.env.MICROCMS_ENDPOINT_NEWS || "news";
const ENDPOINT_BLOGS = process.env.MICROCMS_ENDPOINT_BLOGS || "column";
const ENDPOINT_CATEGORIES = process.env.MICROCMS_ENDPOINT_CATEGORIES || "";

if (!SERVICE_ID || !API_KEY) {
  console.error("MICROCMS_SERVICE_ID と MICROCMS_API_KEY を設定してください。");
  process.exit(1);
}

const BASE_URL = `https://${SERVICE_ID}.microcms.io/api/v1`;

async function fetchEndpoint(endpoint) {
  const url = `${BASE_URL}/${endpoint}?limit=100&orders=-publishedAt`;
  const res = await fetch(url, {
    headers: { "X-MICROCMS-API-KEY": API_KEY }
  });
  if (!res.ok) {
    throw new Error(`${endpoint} の取得に失敗しました: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

const outDir = path.resolve("assets/data");
await fs.mkdir(outDir, { recursive: true });

// お知らせ
const newsData = await fetchEndpoint(ENDPOINT_NEWS);
console.log(`news (${ENDPOINT_NEWS}): ${newsData.contents?.length ?? 0} 件`);

// ブログ
const blogData = await fetchEndpoint(ENDPOINT_BLOGS);
console.log(`column (${ENDPOINT_BLOGS}): ${blogData.contents?.length ?? 0} 件`);

// カテゴリ（設定されている場合のみ）
let categoryData = { contents: [] };
if (ENDPOINT_CATEGORIES) {
  categoryData = await fetchEndpoint(ENDPOINT_CATEGORIES);
  console.log(`categories (${ENDPOINT_CATEGORIES}): ${categoryData.contents?.length ?? 0} 件`);
}

// posts.json に統合して書き出す（APIキーは含まれない）
const posts = {
  news: newsData.contents ?? [],
  blog: blogData.contents ?? [],
  categories: categoryData.contents ?? []
};

await fs.writeFile(
  path.join(outDir, "posts.json"),
  JSON.stringify(posts, null, 2),
  "utf-8"
);

console.log(`posts.json 生成完了: news=${posts.news.length} blog=${posts.blog.length} categories=${posts.categories.length}`);
