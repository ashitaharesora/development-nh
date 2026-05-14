// ── ヘッダー高さを CSS 変数に反映（トップページヒーロー用）──
// .home-page のときだけ実行。ResizeObserver でリサイズにも追従する。
(function () {
  if (!document.body.classList.contains('home-page')) return;
  const header = document.querySelector('.site-header');
  if (!header) return;

  function syncHeaderHeight() {
    document.documentElement.style.setProperty('--header-h', header.offsetHeight + 'px');
  }

  // DOMContentLoaded 直後 + レンダリング後の2段階で確実に取得
  syncHeaderHeight();
  requestAnimationFrame(syncHeaderHeight);

  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(syncHeaderHeight).observe(header);
  } else {
    window.addEventListener('resize', syncHeaderHeight, { passive: true });
  }
})();

document.addEventListener('DOMContentLoaded', () => {
  const navToggle = document.querySelector('.home-page .nav-toggle');
  const nav = document.querySelector('.home-page .nav');
  const navClose = document.querySelector('.home-page .nav-close');

  if (navToggle && nav) {
    navToggle.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const isOpen = nav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    if (navClose) {
      navClose.addEventListener('click', () => {
        nav.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    }

    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        nav.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });

    document.addEventListener('click', (e) => {
      if (!nav.contains(e.target) && !navToggle.contains(e.target)) {
        nav.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  const year = document.querySelector('[data-year]');
  if (year) {
    year.textContent = new Date().getFullYear();
  }
});


document.addEventListener("DOMContentLoaded", () => {
  const targets = document.querySelectorAll(
    ".js-fade-up, .js-slide-left, .js-slide-right"
  );

  if (!targets.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.15,
      rootMargin: "0px 0px -40px 0px",
    }
  );

  targets.forEach((target) => observer.observe(target));
});

document.addEventListener('DOMContentLoaded', function () {
  const floatingCta = document.getElementById('floating-cta');
  if (!floatingCta) return;

  const mobileMq = window.matchMedia('(max-width: 768px)');

  const toggleFloatingCta = function () {
    if (!mobileMq.matches) {
      floatingCta.classList.remove('is-visible');
      return;
    }

    if (window.scrollY > 10) {
      floatingCta.classList.add('is-visible');
    } else {
      floatingCta.classList.remove('is-visible');
    }
  };

  toggleFloatingCta();
  window.addEventListener('scroll', toggleFloatingCta, { passive: true });
  window.addEventListener('resize', toggleFloatingCta);
});
