export function initRail() {
  const rail = document.querySelector('[data-rail]');
  if (!rail) return;
  const links = [...rail.querySelectorAll('a[href^="#"]')];
  const sections = links
    .map((link) => document.getElementById(link.hash.slice(1)))
    .filter(Boolean);

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((link) => {
          const on = link.hash === `#${entry.target.id}`;
          link.classList.toggle('is-active', on);
          if (on) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      });
    },
    { rootMargin: '-42% 0px -50% 0px', threshold: 0 },
  );

  sections.forEach((section) => io.observe(section));
}
