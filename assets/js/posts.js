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

  async function fetchJson(url) {
    var res = await fetch(url);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  }

  // ---- トップページ：お知らせ＋ブログ 最新N件 ----
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
      var slug = item.slug || item.id;
      var date = formatDate(item.publishedAtCustom || item.publishedAt);
      var title = esc(item.title);
      var href = item._type === 'news'
        ? prefix + 'news/' + slug + '/'
        : prefix + 'blog/' + slug + '/';

      if (item._type === 'news') {
        return '<a class="news-item" href="' + href + '">'
          + '<time datetime="' + date + '">' + date + '</time>'
          + '<p>' + title + '</p>'
          + '</a>';
      } else {
        var cat = (item.category && item.category.name)
          ? '<span class="tag">' + esc(item.category.name) + '</span>'
          : '';
        return '<a class="blog-item" href="' + href + '">'
          + cat
          + '<p>' + title + '</p>'
          + '</a>';
      }
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
        var slug = item.slug || item.id;
        var date = formatDate(item.publishedAtCustom || item.publishedAt);
        var title = esc(item.title);
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

  document.addEventListener('DOMContentLoaded', function () {
    loadPostsFeed();
    loadNewsList();
  });
})();
