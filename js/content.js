import { now, timeline, techMatrix } from '../src/data/site.js';
import { githubProfile, otherWork } from '../src/data/github-profile.js';

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

function renderMatrix(root) {
  const head = `<tr><th scope="col">Technology</th>${techMatrix.projects
    .map((name) => `<th scope="col">${escapeHtml(name)}</th>`)
    .join('')}</tr>`;
  const body = techMatrix.rows
    .map((row) => {
      const cells = row.marks
        .map((on) => `<td>${on ? '●' : '○'}</td>`)
        .join('');
      return `<tr><th scope="row">${escapeHtml(row.skill)}</th>${cells}</tr>`;
    })
    .join('');
  root.innerHTML = `<table class="matrix"><caption>Verified featured-project usage. ● used · ○ not a primary technology. Not a proficiency score.</caption><thead>${head}</thead><tbody>${body}</tbody></table>`;
}

function renderOtherWork(root) {
  root.innerHTML = otherWork
    .map((repo) => {
      const host = repo.url.replace(/^https:\/\//, '');
      return `<tr>
        <th scope="row">${escapeHtml(repo.name)}</th>
        <td><a href="${escapeHtml(repo.url)}" rel="noopener noreferrer" target="_blank">${escapeHtml(host)}</a></td>
      </tr>`;
    })
    .join('');
}

function applyGithubLinks() {
  const label = `github.com/${githubProfile.login}`;
  document.querySelectorAll('[data-github-link]').forEach((link) => {
    link.href = githubProfile.url;
    if (link.hasAttribute('data-github-label')) {
      link.textContent = label;
    }
  });
}

export function hydrateSite() {
  const nowRoot = document.querySelector('[data-now]');
  if (nowRoot) renderNow(nowRoot);

  const timelineRoot = document.querySelector('[data-timeline]');
  if (timelineRoot) renderTimeline(timelineRoot);

  const matrix = document.querySelector('[data-matrix]');
  if (matrix) renderMatrix(matrix);

  const other = document.querySelector('[data-other-work]');
  if (other) renderOtherWork(other);

  applyGithubLinks();
}
