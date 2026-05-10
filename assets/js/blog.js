// ブログ一覧ページ用スクリプト
// APIキーはGitHub Actions側のみで使用し、ブラウザからはposts.jsonを参照する
(function () {
  'use strict';

  async function loadBlogList() {
    var listEl = document.getElementById('blogList');
    var emptyEl = document.getElementById('blogEmpty');
    if (!listEl) return;

    try {
      var res = await fetch('../assets/data/posts.json');
      if (!res.ok) throw new Error('HTTP ' + res.status);

      var data = await res.json();
      var items = Array.isArray(data.blog) ? data.blog : [];

      if (!items.length) {
        if (emptyEl) emptyEl.style.display = 'block';
        return;
      }

      listEl.innerHTML = items.map(function (item) {
        var title = esc(item.title || '');
        var excerpt = esc(item.excerpt || '');
        var slug = item.slug || '';
        var categoryName = esc((item.category && item.category.name) || '');
        var eyecatchUrl = (item.eyecatch && item.eyecatch.url) || '';
        var published = formatDate(item.publishedAtCustom || item.publishedAt);

        return '<a class="blog-item blog-item-with-image" href="' + slug + '/">'
          + (eyecatchUrl
            ? '<div class="blog-thumb"><img src="' + eyecatchUrl + '" alt="' + title + '"></div>'
            : '')
          + '<div class="blog-item-body">'
          + (categoryName ? '<span class="tag">' + categoryName + '</span>' : '')
          + '<div class="meta">' + published + '</div>'
          + '<h3>' + title + '</h3>'
          + (excerpt ? '<p>' + excerpt + '</p>' : '')
          + '</div>'
          + '</a>';
      }).join('');

    } catch (e) {
      console.error('ブログ一覧の取得に失敗しました', e);
      if (emptyEl) {
        emptyEl.textContent = 'ブログ一覧を読み込めませんでした。';
        emptyEl.style.display = 'block';
      }
    }
  }

  function formatDate(value) {
    if (!value) return '';
    var d = new Date(value);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 10);
  }

  function esc(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  document.addEventListener('DOMContentLoaded', loadBlogList);
})();
