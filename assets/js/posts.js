(function () {
  'use strict';

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

  /**
   * microCMS の画像フィールドを優先順で探して { url, alt } を返す。
   * eyecatch → thumbnail → image → mainImage の順に試す。
   */
  function getImage(item) {
    var field = item.eyecatch || item.thumbnail || item.image || item.mainImage || null;
    if (!field) return null;
    var url = (typeof field === 'string') ? field : (field.url || '');
    if (!url) return null;
    return { url: url, alt: field.alt || '' };
  }

  /**
   * グリッドカード HTML を生成
   * type: 'news' → /news/{slug}/
   * type: 'columns' → /columns/{slug}/
   */
  function renderCard(item, type, prefix) {
    var slug = item.slug || item.id || '';
    var date = formatDate(item.publishedAtCustom || item.publishedAt);
    var title = esc(item.title || '');
    var href = type === 'news'
      ? prefix + 'news/' + slug + '/'
      : prefix + 'columns/' + slug + '/';

    var img = getImage(item);
    var thumbHtml = '<div class="post-card-thumb">'
      + (img
          ? '<img src="' + esc(img.url) + '" alt="' + esc(img.alt || item.title || '') + '" loading="lazy">'
          : '')
      + '</div>';

    var tagLabel = type === 'news'
      ? 'お知らせ'
      : (item.category && item.category.name ? item.category.name : 'コラム');
    var tagsHtml = '<div class="post-card-tags"><span class="post-tag">' + esc(tagLabel) + '</span></div>';

    return '<a class="post-card" href="' + href + '">'
      + thumbHtml
      + '<div class="post-card-body">'
      + '<p class="post-card-title">' + title + '</p>'
      + tagsHtml
      + '<time datetime="' + date + '">' + date + '</time>'
      + '</div>'
      + '</a>';
  }

  async function fetchJson(url) {
    var res = await fetch(url);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  }

  // ---- トップページ：お知らせ＋コラム 最新N件 ----
  async function loadPostsFeed() {
    var el = document.getElementById('postsFeed');
    if (!el) return;

    var prefix = el.dataset.prefix || './';
    var limit = parseInt(el.dataset.limit || '3', 10);
    var items = [];

    await Promise.allSettled([
      fetchJson(prefix + 'assets/data/news.json').then(function (data) {
        (data.contents || []).forEach(function (item) {
          items.push(Object.assign({ _type: 'news' }, item));
        });
      }),
      fetchJson(prefix + 'assets/data/blogs.json').then(function (data) {
        (data.contents || []).forEach(function (item) {
          items.push(Object.assign({ _type: 'columns' }, item));
        });
      }),
    ]);

    items = items
      .filter(function (item) { return item.slug || item.id; })
      .sort(function (a, b) {
        var da = new Date(a.publishedAtCustom || a.publishedAt || 0);
        var db = new Date(b.publishedAtCustom || b.publishedAt || 0);
        return db - da;
      })
      .slice(0, limit);

    if (!items.length) {
      el.innerHTML = '<p class="meta">現在お知らせはありません。</p>';
      return;
    }

    el.innerHTML = items.map(function (item) {
      return renderCard(item, item._type, prefix);
    }).join('');
  }

  // ---- お知らせ一覧ページ ----
  async function loadNewsList() {
    var el = document.getElementById('newsList');
    var emptyEl = document.getElementById('newsEmpty');
    if (!el) return;

    var prefix = el.dataset.prefix || '../';

    try {
      var data = await fetchJson(prefix + 'assets/data/news.json');
      var items = data.contents || [];

      if (!items.length) {
        if (emptyEl) emptyEl.style.display = 'block';
        return;
      }

      el.innerHTML = items.map(function (item) {
        var slug = item.slug || item.id || '';
        var date = formatDate(item.publishedAtCustom || item.publishedAt);
        var title = esc(item.title || '');
        var excerpt = esc(item.excerpt || '');
        var href = slug ? slug + '/' : '#';

        return '<a class="news-item" href="' + href + '">'
          + '<time datetime="' + date + '">' + date + '</time>'
          + '<h3>' + title + '</h3>'
          + (excerpt ? '<p>' + excerpt + '</p>' : '')
          + '</a>';
      }).join('');

    } catch (e) {
      console.error('お知らせ一覧の取得に失敗しました', e);
      if (emptyEl) {
        emptyEl.textContent = '現在お知らせはありません。';
        emptyEl.style.display = 'block';
      }
    }
  }

  // ---- 税務・労務コラム一覧ページ ----
  async function loadColumnsList() {
    var el = document.getElementById('columnsList');
    var emptyEl = document.getElementById('columnsEmpty');
    if (!el) return;

    var prefix = el.dataset.prefix || '../';

    try {
      var data = await fetchJson(prefix + 'assets/data/blogs.json');
      var items = (data.contents || []).filter(function (item) { return item.slug || item.id; });

      if (!items.length) {
        if (emptyEl) emptyEl.style.display = 'block';
        return;
      }

      el.innerHTML = items.map(function (item) {
        return renderCard(item, 'columns', prefix);
      }).join('');

    } catch (e) {
      console.error('コラム一覧の取得に失敗しました', e);
      if (emptyEl) {
        emptyEl.textContent = '現在コラムはありません。';
        emptyEl.style.display = 'block';
      }
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    loadPostsFeed();
    loadNewsList();
    loadColumnsList();
  });
})();
