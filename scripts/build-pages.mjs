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

async function buildNews() {
  const data = await readJson("news.json");
  const template = await readTemplate("news-detail.html");
  for (const item of data.contents ?? []) {
    const slug = item.slug || item.id;
    const outDir = path.join(root, "news", slug);
    await ensureDir(outDir);
    const html = applyTemplate(template, {
      title: item.seoTitle || item.title,
      description: item.seoDescription || item.excerpt || item.title,
      prefix: "../../",
      date: item.publishedAt?.slice(0, 10) || "",
      body_html: item.body || "<p>本文を追加してください。</p>",
    });
    await fs.writeFile(path.join(outDir, "index.html"), html, "utf-8");
    console.log(`[news] ${slug}`);
  }
}

async function buildBlog() {
  const data = await readJson("blogs.json");
  const template = await readTemplate("blog-detail.html");
  for (const item of data.contents ?? []) {
    const slug = item.slug || item.id;
    const outDir = path.join(root, "blog", slug);
    await ensureDir(outDir);
    const html = applyTemplate(template, {
      title: item.seoTitle || item.title,
      description: item.seoDescription || item.excerpt || item.title,
      prefix: "../../",
      date: item.publishedAt?.slice(0, 10) || "",
      category: item.category?.name || "",
      body_html: item.body || "<p>本文を追加してください。</p>",
    });
    await fs.writeFile(path.join(outDir, "index.html"), html, "utf-8");
    console.log(`[blog] ${slug}`);
  }
}

await buildNews();
await buildBlog();
console.log("[build-pages] 完了");
