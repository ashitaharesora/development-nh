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

  function getImage(item) {
    var field = item.eyecatch || item.thumbnail || item.image || item.mainImage || null;
    if (!field) return null;
    var url = (typeof field === 'string') ? field : (field.url || '');
    if (!url) return null;
    return { url: url, alt: field.alt || '' };
  }

  /**
   * 記事からカテゴリ名を取得する。
   * microCMS の field 形式（文字列 / {name} オブジェクト / 配列）と
   * category / tags の両フィールドに対応。
   */
  function getCategoryName(item) {
    // --- category フィールド（単一参照 or 文字列）---
    var cat = item.category;
    if (cat) {
      if (typeof cat === 'string' && cat) return cat;
      if (cat.name) return cat.name;
      // content reference が配列で返ってくる場合
      if (Array.isArray(cat) && cat.length) {
        return cat[0].name || cat[0] || null;
      }
    }
    // --- tags フィールド（複数参照）---
    var tags = item.tags;
    if (tags && Array.isArray(tags) && tags.length) {
      return tags[0].name || tags[0] || null;
    }
    return null;
  }

  /**
   * 記事がカテゴリ名に一致するか判定。
   * category / tags 両方を確認し、name での比較のみ行う。
   */
  function matchesCategory(item, categoryName) {
    if (!categoryName) return true; // 「すべて」

    // category フィールド（単一参照 or 文字列）
    var cat = item.category;
    if (cat) {
      if (typeof cat === 'string' && cat === categoryName) return true;
      if (cat.name === categoryName) return true;
      if (Array.isArray(cat)) {
        if (cat.some(function (c) { return (c.name || c) === categoryName; })) return true;
      }
    }

    // tags フィールド（複数参照）
    var tags = item.tags;
    if (tags && Array.isArray(tags)) {
      if (tags.some(function (t) { return (t.name || t) === categoryName; })) return true;
    }

    return false;
  }

  /**
   * グリッドカード HTML を生成
   * showTag: true のときカテゴリタグを表示
   */
  function renderCard(item, type, prefix, showTag) {
    var slug = item.slug || item.id || '';
    var date = formatDate(item.publishedAtCustom || item.publishedAt);
    var title = esc(item.title || '');
    var href = type === 'news'
      ? prefix + 'news/' + slug + '/'
      : prefix + 'column/' + slug + '/';

    var img = getImage(item);
    var thumbHtml = '<div class="post-card-thumb">'
      + (img
          ? '<img src="' + esc(img.url) + '" alt="' + esc(img.alt || item.title || '') + '" loading="lazy">'
          : '')
      + '</div>';

    var tagsHtml = '';
    if (showTag !== false) {
      var tagLabel = type === 'news'
        ? 'お知らせ'
        : (getCategoryName(item) || 'コラム');
      tagsHtml = '<div class="post-card-tags"><span class="post-tag">' + esc(tagLabel) + '</span></div>';
    }

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

  // ---- トップページ：お知らせ＋コラム 最新N件（タグあり） ----
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
          items.push(Object.assign({ _type: 'blog' }, item));
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
      return renderCard(item, item._type, prefix, true);
    }).join('');
  }

  // ---- お知らせ一覧ページ（タグなし・テキストリスト） ----
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

  // ---- コラム一覧ページ（カテゴリフィルター付き・タグあり） ----
  async function loadColumnList() {
    var el = document.getElementById('columnList');
    var emptyEl = document.getElementById('columnEmpty');
    var tabsEl = document.getElementById('categoryTabs');
    if (!el) return;

    var prefix = el.dataset.prefix || '../';
    var allItems = [];

    try {
      var data = await fetchJson(prefix + 'assets/data/blogs.json');
      allItems = (data.contents || []).filter(function (item) { return item.slug || item.id; });
    } catch (e) {
      console.error('コラム一覧の取得に失敗しました', e);
      if (emptyEl) {
        emptyEl.textContent = '現在コラムはありません。';
        emptyEl.style.display = 'block';
      }
      return;
    }

    function renderFiltered(category) {
      var filtered = allItems.filter(function (item) {
        return matchesCategory(item, category);
      });

      if (!filtered.length) {
        el.innerHTML = '';
        if (emptyEl) emptyEl.style.display = 'block';
        return;
      }
      if (emptyEl) emptyEl.style.display = 'none';
      el.innerHTML = filtered.map(function (item) {
        return renderCard(item, 'blog', prefix, true);
      }).join('');
    }

    if (tabsEl) {
      tabsEl.addEventListener('click', function (e) {
        var btn = e.target.closest('.feed-tab');
        if (!btn) return;
        tabsEl.querySelectorAll('.feed-tab').forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        renderFiltered(btn.dataset.category);
      });
    }

    renderFiltered('');
  }

  document.addEventListener('DOMContentLoaded', function () {
    loadPostsFeed();
    loadNewsList();
    loadColumnList();
  });
})();
