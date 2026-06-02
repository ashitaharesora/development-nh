(() => {
  const CLARITY_ID = 'x0om9ckns4';
  const PROD_HOSTS = ['ashitaharesora.jp', 'www.ashitaharesora.jp'];

  if (!PROD_HOSTS.includes(window.location.hostname)) return;
  if (document.getElementById('ms-clarity-script')) return;

  window.clarity = window.clarity || function () {
    (window.clarity.q = window.clarity.q || []).push(arguments);
  };

  const script = document.createElement('script');
  script.id = 'ms-clarity-script';
  script.async = true;
  script.src = `https://www.clarity.ms/tag/${CLARITY_ID}`;
  document.head.appendChild(script);
})();

(() => {
  const PROD_ORIGIN = 'https://ashitaharesora.jp';
  const LEGACY_HOST = 'ashitaharesora.github.io';
  const LEGACY_PREFIXES = ['/ashita-haresora', '/development-nh', '/development'];

  if (window.location.hostname !== LEGACY_HOST) return;

  let nextPath = window.location.pathname || '/';

  for (const prefix of LEGACY_PREFIXES) {
    if (nextPath === prefix) {
      nextPath = '/';
      break;
    }

    if (nextPath.startsWith(prefix + '/')) {
      nextPath = nextPath.slice(prefix.length) || '/';
      break;
    }
  }

  const target = PROD_ORIGIN + nextPath + window.location.search + window.location.hash;

  if (window.location.href !== target) {
    window.location.replace(target);
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
