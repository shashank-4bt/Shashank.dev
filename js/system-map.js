import { systemMap } from '../src/data/site.js';

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function detailHtml(node) {
  const related = (node.related || [])
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join('');
  const project = node.project
    ? `<p class="sysmap__link"><a href="${escapeHtml(node.project.href)}">${escapeHtml(node.project.name)}</a></p>`
    : '';
  const stack = node.stack ? `<p class="sysmap__stack">${escapeHtml(node.stack)}</p>` : '';

  return `<p class="sysmap__detail-label">${escapeHtml(node.label)}</p>
    ${stack}
    ${node.blurb ? `<p class="sysmap__blurb">${escapeHtml(node.blurb)}</p>` : ''}
    ${project}
    <p class="sysmap__related-label">Related</p>
    <ul class="sysmap__related">${related}</ul>`;
}

function nodeById(id) {
  if (id === systemMap.root.id) return systemMap.root;
  return systemMap.nodes.find((node) => node.id === id) || systemMap.root;
}

export function initSystemMap() {
  const root = document.querySelector('[data-sysmap]');
  const detail = document.querySelector('[data-sysmap-detail]');
  if (!root || !detail) return;

  const buttons = [...root.querySelectorAll('[data-node]')];
  let selected = 'root';

  function paint(id, sticky) {
    if (sticky) selected = id;
    const shown = id || selected;
    const node = nodeById(shown);
    buttons.forEach((btn) => {
      const on = btn.getAttribute('data-node') === shown;
      btn.setAttribute('aria-pressed', String(btn.getAttribute('data-node') === selected));
      btn.classList.toggle('is-hot', on);
    });
    detail.innerHTML = detailHtml(node);
  }

  buttons.forEach((btn) => {
    const id = btn.getAttribute('data-node') || 'root';
    btn.addEventListener('click', () => paint(id, true));
    btn.addEventListener('pointerenter', () => {
      if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
      paint(id, false);
    });
    btn.addEventListener('focus', () => paint(id, false));
  });

  root.addEventListener('pointerleave', () => paint(selected, Boolean(selected)));

  root.addEventListener('keydown', (event) => {
    const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'];
    if (!keys.includes(event.key)) return;
    const index = buttons.indexOf(document.activeElement);
    if (index < 0) return;
    event.preventDefault();
    let next = index;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % buttons.length;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + buttons.length) % buttons.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = buttons.length - 1;
    buttons[next].focus();
    paint(buttons[next].getAttribute('data-node') || 'root', true);
  });

  paint('root', true);
}
