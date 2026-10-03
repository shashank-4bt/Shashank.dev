export function initStructureFlow() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const nodes = document.querySelectorAll('[data-flow], .viz');
  if (reduced) {
    nodes.forEach((node) => node.classList.add('is-on'));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-on');
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.25, rootMargin: '0px 0px -8% 0px' },
  );

  nodes.forEach((node) => io.observe(node));
}
