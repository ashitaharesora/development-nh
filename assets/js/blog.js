async function loadBlogList() {
    const listEl = document.getElementById('blogList');
    const emptyEl = document.getElementById('blogEmpty');

    if (!listEl) return;

    try {
        const res = await fetch('../assets/data/blog.json', { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        const items = Array.isArray(data.contents) ? data.contents : [];

        if (!items.length) {
            emptyEl.style.display = 'block';
            return;
        }

        listEl.innerHTML = items.map((item) => {
            const title = escapeHtml(item.title || '');
            const excerpt = escapeHtml(item.excerpt || '');
            const slug = item.slug || '';
            const categoryName = escapeHtml(item.category?.name || '');
            const eyecatchUrl = item.eyecatch?.url || '';
            const published = formatDate(item.publishedAtCustom || item.publishedAt);

            return `
        <a class="blog-item blog-item-with-image" href="${slug}/">
          ${eyecatchUrl ? `<div class="blog-thumb"><img src="${eyecatchUrl}" alt="${title}"></div>` : ''}
          <div class="blog-item-body">
            ${categoryName ? `<span class="tag">${categoryName}</span>` : ''}
            <div class="meta">${published}</div>
            <h3>${title}</h3>
            <p>${excerpt}</p>
          </div>
        </a>
      `;
        }).join('');
    } catch (error) {
        console.error('ブログ一覧の取得に失敗しました', error);
        emptyEl.textContent = 'ブログ一覧を読み込めませんでした。';
        emptyEl.style.display = 'block';
    }
}

function formatDate(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().slice(0, 10);
}

function escapeHtml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

document.addEventListener('DOMContentLoaded', loadBlogList);