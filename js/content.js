import { now, timeline } from '../src/data/site.js';

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderNow(root) {
  root.innerHTML = now
    .map((item) => {
      const value = item.href
        ? `<a href="${escapeHtml(item.href)}">${escapeHtml(item.value)}</a>`
        : escapeHtml(item.value);
      return `<div class="now__cell">
        <dt>${escapeHtml(item.label)}</dt>
        <dd>${value}</dd>
      </div>`;
    })
    .join('');
}

function renderTimeline(root) {
  const items = timeline.items
    .map((item) => {
      const current = item.current
        ? `<p class="timeline__now">${escapeHtml(item.note || 'Currently building')}</p>`
        : '';
      return `<li${item.current ? ' class="is-current"' : ''}>
        <a href="${escapeHtml(item.href)}">${escapeHtml(item.name)}</a>
        <p>${escapeHtml(item.field)}</p>
        ${current}
      </li>`;
    })
    .join('');

  root.innerHTML = `<p class="timeline__year">${escapeHtml(timeline.year)}</p>
    <ol class="timeline__list">${items}</ol>`;
}

export function hydrateSite() {
  const nowRoot = document.querySelector('[data-now]');
  if (nowRoot) renderNow(nowRoot);

  const timelineRoot = document.querySelector('[data-timeline]');
  if (timelineRoot) renderTimeline(timelineRoot);
}
