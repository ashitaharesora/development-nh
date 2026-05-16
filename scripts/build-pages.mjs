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

/** eyecatch / thumbnail / image / mainImage フィールドから画像URLを取得 */
function getEyecatchUrl(item) {
  const field = item.eyecatch || item.thumbnail || item.image || item.mainImage || null;
  if (!field) return "";
  if (typeof field === "string") return field;
  return field.url || "";
}

/** アイキャッチ画像HTML（未設定なら空文字） */
function buildEyecatchHtml(url, alt) {
  if (!url) return "";
  return `<div class="article-eyecatch"><div class="container"><img src="${url}" alt="${alt}" loading="lazy"></div></div>`;
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
    const eyecatchUrl = getEyecatchUrl(item);

    const html = applyTemplate(template, {
      seo_title: item.seoTitle || title,
      title,
      description: item.seoDescription || item.excerpt || title,
      date,
      eyecatch_html: buildEyecatchHtml(eyecatchUrl, title),
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
    const eyecatchUrl = getEyecatchUrl(item);

    const html = applyTemplate(template, {
      seo_title: item.seoTitle || title,
      title,
      description: item.seoDescription || item.excerpt || title,
      date,
      category_label: categoryName ? ` / ${categoryName}` : "",
      eyecatch_html: buildEyecatchHtml(eyecatchUrl, title),
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

    // category は文字列 / {name} オブジェクト / 配列のいずれかに対応
    const cat = item.category;
    const categoryName =
      (typeof cat === "string" && cat) ? cat :
      (cat?.name) ? cat.name :
      (Array.isArray(cat) && cat.length) ? (cat[0]?.name || cat[0] || "") :
      "";
    const categoryLabel = categoryName || "支援事例";

    // カテゴリタグHTML（詳細ページ用）
    const categoryTagHtml = `<div class="post-card-tags" style="margin-top:10px"><span class="post-tag">${categoryLabel}</span></div>`;

    // アイキャッチ画像HTML（getEyecatchUrl と同じロジック）
    const eyecatchUrl = getEyecatchUrl(item);
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
      category_tag_html: categoryTagHtml,
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
