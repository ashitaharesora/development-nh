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
