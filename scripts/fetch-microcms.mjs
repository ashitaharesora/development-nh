import fs from "node:fs/promises";
import path from "node:path";

const SERVICE_DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN;
const API_KEY = process.env.MICROCMS_API_KEY;
const endpoints = ["news", "blog", "works"];

if (!SERVICE_DOMAIN || !API_KEY) {
  console.error("MICROCMS_SERVICE_DOMAIN と MICROCMS_API_KEY を設定してください。");
  process.exit(1);
}

const outDir = path.resolve(".cache");
await fs.mkdir(outDir, { recursive: true });

for (const endpoint of endpoints) {
  const url = `https://${SERVICE_DOMAIN}.microcms.io/api/v1/${endpoint}?limit=100`;
  const res = await fetch(url, {
    headers: { "X-MICROCMS-API-KEY": API_KEY }
  });
  if (!res.ok) {
    throw new Error(`${endpoint} の取得に失敗しました: ${res.status} ${res.statusText}`);
  }
  const json = await res.json();
  await fs.writeFile(path.join(outDir, `${endpoint}.json`), JSON.stringify(json, null, 2), "utf-8");
  console.log(`fetched ${endpoint}: ${json.contents?.length ?? 0}`);
}
