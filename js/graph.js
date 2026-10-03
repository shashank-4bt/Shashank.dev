import { graphLinks } from '../src/data/site.js';

export function initGraph() {
  const root = document.querySelector('[data-graph]');
  if (!root) return;
  const techs = [...root.querySelectorAll('[data-tech]')];
  const projects = [...root.querySelectorAll('[data-graph-project]')];

  function paint(tech) {
    const link = graphLinks.find((item) => item.tech === tech);
    const ids = link ? link.projects : [];
    techs.forEach((btn) => btn.setAttribute('aria-pressed', String(btn.getAttribute('data-tech') === tech)));
    projects.forEach((node) => {
      const id = node.getAttribute('data-graph-project');
      node.classList.toggle('is-on', !tech || ids.includes(id));
      node.classList.toggle('is-dim', Boolean(tech) && !ids.includes(id));
    });
  }

  techs.forEach((btn) => {
    const tech = btn.getAttribute('data-tech') || '';
    btn.addEventListener('click', () => paint(tech));
    btn.addEventListener('focus', () => paint(tech));
    btn.addEventListener('pointerenter', () => {
      if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
      paint(tech);
    });
  });

  root.addEventListener('pointerleave', () => paint(''));
  paint('');
}
