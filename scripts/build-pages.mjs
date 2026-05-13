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
  const template = await readTemplate("blog-detail.html");

  for (const item of data.contents ?? []) {
    const slug = item.slug || item.id;
    if (!slug) continue;

    const outDir = path.join(root, "column", slug);
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
    console.log(`[column] ${slug} (${date})`);
  }
}

// ---- 支援事例詳細ページを生成 ----
async function buildWorks() {
  const data = await readJson("works.json");
  const template = await readTemplate("works-detail.html");

  for (const item of data.contents ?? []) {
    const slug = item.slug || item.id;
    if (!slug) continue;

    const outDir = path.join(root, "works", slug);
    await ensureDir(outDir);

    const title = item.title || "";
    const date = item.publishedAtCustom?.slice(0, 10) || item.publishedAt?.slice(0, 10) || "";
    const categoryName = item.category?.name || "支援事例";
    const categoryLabel = categoryName ? ` / ${categoryName}` : "";

    // アイキャッチ画像HTML
    const eyecatchField = item.eyecatch || null;
    const eyecatchUrl = eyecatchField?.url || (typeof eyecatchField === "string" ? eyecatchField : "");
    const eyecatchHtml = eyecatchUrl
      ? `<div class="works-eyecatch"><div class="container"><img src="${eyecatchUrl}" alt="${title}" loading="lazy"></div></div>`
      : "";

    // リッチテキストフィールドのラッパー（未設定なら空）
    function sectionHtml(label, content) {
      if (!content) return "";
      return `<div class="works-section"><h3 class="works-section-title">${label}</h3><div class="content">${content}</div></div>`;
    }

    // SEO用テキスト（HTMLタグを除去）
    const consultationText = (item.consultation || "").replace(/<[^>]*>/g, "").trim();
    const description = item.seoDescription || consultationText.slice(0, 120) || title;

    const html = applyTemplate(template, {
      seo_title: item.seoTitle || title,
      title,
      description,
      date,
      category_label: categoryLabel,
      eyecatch_html: eyecatchHtml,
      consultation_html: sectionHtml("ご相談の経緯", item.consultation),
      support_html: sectionHtml("弊所でサポートした内容", item.support),
      result_html: sectionHtml("サポートの成果", item.result),
      body_html: item.body ? `<div class="content">${item.body}</div>` : "",
    });

    await fs.writeFile(path.join(outDir, "index.html"), html, "utf-8");
    console.log(`[works] ${slug} (${date})`);
  }
}

await buildNews();
await buildBlog();
await buildWorks();
console.log("[build-pages] 完了");
