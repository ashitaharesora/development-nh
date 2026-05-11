import fs from "node:fs/promises";
import path from "node:path";

const root = path.resolve(".");
const dataDir = path.join(root, "assets/data");
const templatesDir = path.join(root, "templates");

async function readJson(file) {
  const text = await fs.readFile(path.join(dataDir, file), "utf-8");
  return JSON.parse(text);
}

async function readTemplate(file) {
  return fs.readFile(path.join(templatesDir, file), "utf-8");
}

function applyTemplate(template, values) {
  return Object.entries(values).reduce((acc, [key, value]) => {
    return acc.replaceAll(`{{ ${key} }}`, value ?? "");
  }, template);
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

// ---- お知らせ詳細ページを生成 ----
async function buildNews() {
  const data = await readJson("news.json");
  const template = await readTemplate("news-detail.html");

  for (const item of data.contents ?? []) {
    const slug = item.slug || item.id;
    if (!slug) continue;

    const outDir = path.join(root, "news", slug);
    await ensureDir(outDir);

    const title = item.title || "";
    const date = item.publishedAt?.slice(0, 10) || "";

    const html = applyTemplate(template, {
      seo_title: item.seoTitle || title,
      title,
      description: item.seoDescription || item.excerpt || title,
      date,
      body_html: item.body || "<p>本文を追加してください。</p>",
    });

    await fs.writeFile(path.join(outDir, "index.html"), html, "utf-8");
    console.log(`[news] ${slug} (${date})`);
  }
}

// ---- コラム詳細ページを生成 ----
async function buildBlog() {
  const data = await readJson("blogs.json");
  const template = await readTemplate("column-detail.html");

  for (const item of data.contents ?? []) {
    const slug = item.slug || item.id;
    if (!slug) continue;

    const outDir = path.join(root, "columns", slug);
    await ensureDir(outDir);

    const title = item.title || "";
    const date = item.publishedAt?.slice(0, 10) || "";
    const categoryName = item.category?.name || "";

    const html = applyTemplate(template, {
      seo_title: item.seoTitle || title,
      title,
      description: item.seoDescription || item.excerpt || title,
      date,
      category_label: categoryName ? ` / ${categoryName}` : "",
      body_html: item.body || "<p>本文を追加してください。</p>",
    });

    await fs.writeFile(path.join(outDir, "index.html"), html, "utf-8");
    console.log(`[columns] ${slug} (${date})`);
  }
}

await buildNews();
await buildBlog();
console.log("[build-pages] 完了");
