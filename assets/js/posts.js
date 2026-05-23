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

  function normalizeCategoryName(name) {
    if (!name) return '';
    return name === '法人化' ? '創業支援' : name;
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
      if (typeof cat === 'string' && cat) return normalizeCategoryName(cat);
      if (cat.name) return normalizeCategoryName(cat.name);
      // content reference が配列で返ってくる場合
      if (Array.isArray(cat) && cat.length) {
        return normalizeCategoryName(cat[0].name || cat[0] || null);
      }
    }
    // --- tags フィールド（複数参照）---
    var tags = item.tags;
    if (tags && Array.isArray(tags) && tags.length) {
      return normalizeCategoryName(tags[0].name || tags[0] || null);
    }
    return null;
  }

  /**
   * 記事がカテゴリ名に一致するか判定。
   * category / tags 両方を確認し、name での比較のみ行う。
   */
  function matchesCategory(item, categoryName) {
    if (!categoryName) return true; // 「すべて」

    var normalizedCategoryName = normalizeCategoryName(categoryName);

    // category フィールド（単一参照 or 文字列）
    var cat = item.category;
    if (cat) {
      if (typeof cat === 'string' && normalizeCategoryName(cat) === normalizedCategoryName) return true;
      if (normalizeCategoryName(cat.name) === normalizedCategoryName) return true;
      if (Array.isArray(cat)) {
        if (cat.some(function (c) { return normalizeCategoryName(c.name || c) === normalizedCategoryName; })) return true;
      }
    }

    // tags フィールド（複数参照）
    var tags = item.tags;
    if (tags && Array.isArray(tags)) {
      if (tags.some(function (t) { return normalizeCategoryName(t.name || t) === normalizedCategoryName; })) return true;
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
        ? (getCategoryName(item) || 'お知らせ')
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

  var homeDesktopMedia = window.matchMedia ? window.matchMedia('(min-width: 901px)') : null;

  function getFeedLimit(el, desktopFallback, mobileFallback) {
    var desktopLimit = parseInt(el.dataset.limit || String(desktopFallback), 10);
    var mobileLimit = parseInt(el.dataset.limitMobile || String(mobileFallback), 10);

    if (isNaN(desktopLimit) || desktopLimit < 1) desktopLimit = desktopFallback;
    if (isNaN(mobileLimit) || mobileLimit < 1) mobileLimit = mobileFallback;

    return homeDesktopMedia && homeDesktopMedia.matches ? desktopLimit : mobileLimit;
  }

  function watchHomeFeedBreakpoint(callback) {
    if (!homeDesktopMedia || !callback) return;

    if (typeof homeDesktopMedia.addEventListener === 'function') {
      homeDesktopMedia.addEventListener('change', callback);
      return;
    }

    if (typeof homeDesktopMedia.addListener === 'function') {
      homeDesktopMedia.addListener(callback);
    }
  }

  // ---- トップページ：お知らせ＋コラム 最新N件（タグあり） ----
  async function loadPostsFeed() {
    var el = document.getElementById('postsFeed');
    if (!el) return;

    var prefix = el.dataset.prefix || './';
    var limit = getFeedLimit(el, 3, 2);
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

  // ---- お知らせ一覧ページ（カード型） ----
  async function loadNewsList() {
    var el = document.getElementById('newsList');
    var emptyEl = document.getElementById('newsEmpty');
    if (!el) return;

    var prefix = el.dataset.prefix || '../';

    try {
      var data = await fetchJson(prefix + 'assets/data/news.json');
      var items = (data.contents || []).filter(function (item) { return item.slug || item.id; });

      if (!items.length) {
        if (emptyEl) emptyEl.style.display = 'block';
        return;
      }

      el.innerHTML = items.map(function (item) {
        return renderCard(item, 'news', prefix, true);
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

  /** 支援事例カード1件のHTMLを生成（一覧・フィード共通） */
  function renderWorkCard(item, prefix) {
    var slug = item.slug || item.id || '';
    var date = formatDate(item.publishedAtCustom || item.publishedAt);
    var title = esc(item.title || '');
    var href = prefix + 'works/' + slug + '/';

    var img = getImage(item);
    var thumbHtml = '<div class="post-card-thumb">'
      + (img
          ? '<img src="' + esc(img.url) + '" alt="' + esc(img.alt || item.title || '') + '" loading="lazy">'
          : '')
      + '</div>';

    var categoryName = getCategoryName(item) || '支援事例';
    var tagsHtml = '<div class="post-card-tags"><span class="post-tag">' + esc(categoryName) + '</span></div>';

    var consultationText = (item.consultation || '').replace(/<[^>]*>/g, '').trim();
    var excerpt = consultationText.length > 80 ? consultationText.slice(0, 80) + '…' : consultationText;
    var excerptHtml = excerpt ? '<p class="post-card-excerpt">' + esc(excerpt) + '</p>' : '';

    return '<a class="post-card" href="' + esc(href) + '">'
      + thumbHtml
      + '<div class="post-card-body">'
      + '<p class="post-card-title">' + title + '</p>'
      + tagsHtml
      + excerptHtml
      + '<time datetime="' + date + '">' + date + '</time>'
      + '</div>'
      + '</a>';
  }

  // ---- 支援事例一覧ページ（カテゴリフィルター付き） ----
  async function loadWorksList() {
    var el = document.getElementById('worksList');
    var emptyEl = document.getElementById('worksEmpty');
    var tabsEl = document.getElementById('worksCategoryTabs');
    if (!el) return;

    var prefix = el.dataset.prefix || '../';
    var allItems = [];

    try {
      var data = await fetchJson(prefix + 'assets/data/works.json');
      allItems = (data.contents || []).filter(function (item) { return item.slug || item.id; });
    } catch (e) {
      console.error('支援事例一覧の取得に失敗しました', e);
      if (emptyEl) {
        emptyEl.textContent = '現在支援事例はありません。';
        emptyEl.style.display = 'block';
      }
      return;
    }

    function renderFiltered(category) {
      var filtered = category
        ? allItems.filter(function (item) { return matchesCategory(item, category); })
        : allItems;

      if (!filtered.length) {
        el.innerHTML = '';
        if (emptyEl) emptyEl.style.display = 'block';
        return;
      }
      if (emptyEl) emptyEl.style.display = 'none';
      el.innerHTML = filtered.map(function (item) {
        return renderWorkCard(item, prefix);
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

  // ---- トップページ：コラムフィード（最新N件） ----
  async function loadColumnFeed() {
    var el = document.getElementById('columnFeed');
    var emptyEl = document.getElementById('columnFeedEmpty');
    if (!el) return;

    var prefix = el.dataset.prefix || './';
    var limit = getFeedLimit(el, 3, 2);

    try {
      var data = await fetchJson(prefix + 'assets/data/blogs.json');
      var items = (data.contents || [])
        .filter(function (item) { return item.slug || item.id; })
        .sort(function (a, b) {
          var da = new Date(a.publishedAtCustom || a.publishedAt || 0);
          var db = new Date(b.publishedAtCustom || b.publishedAt || 0);
          return db - da;
        })
        .slice(0, limit);

      if (!items.length) {
        if (emptyEl) emptyEl.style.display = 'block';
        return;
      }

      el.innerHTML = items.map(function (item) {
        return renderCard(item, 'blog', prefix, true);
      }).join('');

    } catch (e) {
      console.error('コラムフィードの取得に失敗しました', e);
      if (emptyEl) emptyEl.style.display = 'block';
    }
  }

  // ---- トップページ：お知らせフィード（最新N件） ----
  async function loadNewsFeed() {
    var el = document.getElementById('newsFeed');
    var emptyEl = document.getElementById('newsFeedEmpty');
    if (!el) return;

    var prefix = el.dataset.prefix || './';
    var limit = getFeedLimit(el, 3, 2);

    try {
      var data = await fetchJson(prefix + 'assets/data/news.json');
      var items = (data.contents || [])
        .filter(function (item) { return item.slug || item.id; })
        .sort(function (a, b) {
          var da = new Date(a.publishedAtCustom || a.publishedAt || 0);
          var db = new Date(b.publishedAtCustom || b.publishedAt || 0);
          return db - da;
        })
        .slice(0, limit);

      if (!items.length) {
        if (emptyEl) emptyEl.style.display = 'block';
        return;
      }

      el.innerHTML = items.map(function (item) {
        return renderCard(item, 'news', prefix, true);
      }).join('');

    } catch (e) {
      console.error('お知らせフィードの取得に失敗しました', e);
      if (emptyEl) emptyEl.style.display = 'block';
    }
  }

  // ---- トップページ：支援事例フィード（最新N件） ----
  async function loadWorksFeed() {
    var el = document.getElementById('worksFeed');
    var emptyEl = document.getElementById('worksFeedEmpty');
    if (!el) return;

    var prefix = el.dataset.prefix || './';
    var limit = getFeedLimit(el, 3, 2);

    try {
      var data = await fetchJson(prefix + 'assets/data/works.json');
      var items = (data.contents || [])
        .filter(function (item) { return item.slug || item.id; })
        .sort(function (a, b) {
          var da = new Date(a.publishedAtCustom || a.publishedAt || 0);
          var db = new Date(b.publishedAtCustom || b.publishedAt || 0);
          return db - da;
        })
        .slice(0, limit);

      if (!items.length) {
        if (emptyEl) emptyEl.style.display = 'block';
        return;
      }

      el.innerHTML = items.map(function (item) {
        return renderWorkCard(item, prefix);
      }).join('');

    } catch (e) {
      console.error('支援事例フィードの取得に失敗しました', e);
      if (emptyEl) emptyEl.style.display = 'block';
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    loadWorksFeed();
    loadColumnFeed();
    loadNewsFeed();
    loadPostsFeed();
    loadNewsList();
    loadColumnList();
    loadWorksList();

    if (document.body.classList.contains('home-page')) {
      watchHomeFeedBreakpoint(function () {
        loadWorksFeed();
        loadColumnFeed();
        loadNewsFeed();
      });
    }
  });
})();
