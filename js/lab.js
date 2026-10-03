import { createBook, renderBook } from './book-engine.js';

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function initTabs(root) {
  const tabs = [...root.querySelectorAll('[role="tab"]')];
  const panels = [...root.querySelectorAll('[role="tabpanel"]')];

  function activate(id, focusTab) {
    tabs.forEach((tab) => {
      const on = tab.getAttribute('aria-controls') === id;
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
      if (on && focusTab) tab.focus();
    });
    panels.forEach((panel) => {
      panel.hidden = panel.id !== id;
    });
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => activate(tab.getAttribute('aria-controls'), false));
  });

  root.querySelector('[role="tablist"]')?.addEventListener('keydown', (event) => {
    const current = tabs.findIndex((tab) => tab.getAttribute('aria-selected') === 'true');
    if (current < 0) return;
    let next = current;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (current + 1) % tabs.length;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (current - 1 + tabs.length) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    else return;
    event.preventDefault();
    activate(tabs[next].getAttribute('aria-controls'), true);
  });

  const first = tabs[0]?.getAttribute('aria-controls');
  if (first) activate(first, false);
}

function initUrlLab(root) {
  const form = root.querySelector('[data-url-form]');
  const input = root.querySelector('[data-url-input]');
  const out = root.querySelector('[data-url-out]');
  if (!form || !input || !out) return;

  function paint() {
    const raw = input.value.trim();
    if (!raw) {
      out.innerHTML = '<p class="lab__empty">Enter a URL to inspect its structure.</p>';
      return;
    }
    try {
      const parsed = new URL(raw);
      const params = [...parsed.searchParams.entries()];
      const rows = [
        ['Protocol', parsed.protocol.replace(':', '')],
        ['Host', parsed.hostname],
        ['Port', parsed.port || 'default'],
        ['Path', parsed.pathname || '/'],
        ['Query', parsed.search || '—'],
        ['Hash', parsed.hash || '—'],
      ];
      const paramRows = params.length
        ? `<h4>Query keys</h4><ul class="lab__kv">${params
            .map(([key, value]) => `<li><span>${escape(key)}</span><span>${escape(value)}</span></li>`)
            .join('')}</ul>`
        : '';
      out.innerHTML = `<ul class="lab__kv">${rows
        .map(([k, v]) => `<li><span>${escape(k)}</span><span>${escape(v)}</span></li>`)
        .join('')}</ul>${paramRows}
        <p class="lab__note">Structure only. This is not a security verdict.</p>`;
    } catch {
      out.innerHTML = '<p class="lab__empty">Could not parse that as a URL. Include a scheme, e.g. https://example.com/path?q=1</p>';
    }
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    paint();
  });
}

function escape(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function paintLog(logEl, book) {
  logEl.innerHTML = book.log
    .slice(-6)
    .map((line) => `<li>${escape(line)}</li>`)
    .join('');
}

function bindBook(root) {
  const bookEl = root.querySelector('[data-book]');
  const logEl = root.querySelector('[data-book-log]');
  const form = root.querySelector('[data-book-form]');
  if (!bookEl || !form) return;
  const book = createBook();

  function paint() {
    renderBook(bookEl, book);
    if (logEl) paintLog(logEl, book);
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const side = form.side.value === 'sell' ? 'sell' : 'buy';
    const price = Math.round(Number(form.price.value) * 100);
    const qty = Math.round(Number(form.qty.value));
    if (!Number.isFinite(price) || !Number.isFinite(qty) || qty <= 0) return;
    book.submit(side, price, qty);
    paint();
  });

  root.querySelector('[data-book-reset]')?.addEventListener('click', () => {
    book.reset();
    paint();
  });
  root.querySelector('[data-book-cancel]')?.addEventListener('click', () => {
    book.cancelLast();
    paint();
  });
  root.querySelector('[data-book-modify]')?.addEventListener('click', () => {
    const qty = Math.round(Number(form.qty.value));
    if (!Number.isFinite(qty) || qty <= 0) return;
    book.modifyLast(qty);
    paint();
  });

  paint();
}

function gaussian() {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function initMonteCarlo(root) {
  const canvas = root.querySelector('[data-mc-canvas]');
  const stats = root.querySelector('[data-mc-stats]');
  const run = root.querySelector('[data-mc-run]');
  const clear = root.querySelector('[data-mc-clear]');
  if (!canvas || !stats || !run) return;

  const ctx = canvas.getContext('2d');
  let samples = [];

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  function draw() {
    const width = canvas.clientWidth || 320;
    const height = canvas.clientHeight || 160;
    const styles = getComputedStyle(document.documentElement);
    const fg = styles.getPropertyValue('--fg-dim').trim() || '#9c9a91';
    const accent = styles.getPropertyValue('--accent').trim() || '#b7c9a3';
    const line = styles.getPropertyValue('--line').trim() || '#2a2c27';

    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = line;
    ctx.beginPath();
    ctx.moveTo(8, height - 18);
    ctx.lineTo(width - 8, height - 18);
    ctx.stroke();

    if (!samples.length) {
      stats.textContent = '0 samples';
      return;
    }

    const bins = 24;
    const min = Math.min(...samples);
    const max = Math.max(...samples);
    const span = max - min || 1;
    const counts = new Array(bins).fill(0);
    samples.forEach((value) => {
      const index = Math.min(bins - 1, Math.floor(((value - min) / span) * bins));
      counts[index] += 1;
    });
    const peak = Math.max(...counts, 1);
    const gap = 2;
    const barW = (width - 16) / bins;

    counts.forEach((count, i) => {
      const h = ((height - 28) * count) / peak;
      ctx.fillStyle = accent;
      ctx.globalAlpha = 0.85;
      ctx.fillRect(8 + i * barW + gap / 2, height - 18 - h, barW - gap, h);
    });
    ctx.globalAlpha = 1;
    ctx.fillStyle = fg;
    ctx.font = '11px ui-monospace, monospace';
    ctx.fillText(min.toFixed(2), 8, height - 4);
    ctx.fillText(max.toFixed(2), width - 42, height - 4);

    const mean = samples.reduce((sum, value) => sum + value, 0) / samples.length;
    stats.textContent = `${samples.length} samples · mean ${mean.toFixed(3)} · N(0,1) draws`;
  }

  function addSamples(count) {
    for (let i = 0; i < count; i += 1) samples.push(gaussian());
    draw();
  }

  run.addEventListener('click', () => addSamples(prefersReducedMotion() ? 80 : 200));
  clear?.addEventListener('click', () => {
    samples = [];
    draw();
  });

  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();
}

function initPipeline(root) {
  const input = root.querySelector('[data-pipe-input]');
  const stages = [...root.querySelectorAll('[data-pipe-stage]')];
  const out = root.querySelector('[data-pipe-out]');
  if (!input || !stages.length || !out) return;

  function transform(raw) {
    const cleaned = raw.trim().replace(/\s+/g, ' ');
    const parts = cleaned.split(/[,\s]+/).filter(Boolean);
    const nums = parts.map(Number).filter((n) => Number.isFinite(n));
    const mean = nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
    return { raw, cleaned, parts, nums, mean };
  }

  function paint() {
    const state = transform(input.value);
    stages.forEach((el) => el.classList.toggle('is-on', Boolean(state.cleaned)));
    out.innerHTML = `<ul class="lab__kv">
      <li><span>Raw</span><span>${escape(state.raw || '—')}</span></li>
      <li><span>Clean</span><span>${escape(state.cleaned || '—')}</span></li>
      <li><span>Tokens</span><span>${escape(state.parts.join(' · ') || '—')}</span></li>
      <li><span>Numbers</span><span>${escape(state.nums.join(', ') || '—')}</span></li>
      <li><span>Mean</span><span>${state.mean === null ? '—' : escape(String(state.mean.toFixed(4)))}</span></li>
    </ul>
    <p class="lab__note">Local transform of the text you typed. Not market data.</p>`;
  }

  input.addEventListener('input', paint);
  paint();
}

export function initLab() {
  const root = document.querySelector('[data-lab]');
  if (!root) return;
  initTabs(root);
  const url = root.querySelector('#lab-url');
  const book = root.querySelector('#lab-book');
  const mc = root.querySelector('#lab-mc');
  const pipe = root.querySelector('#lab-pipe');
  if (url) initUrlLab(url);
  if (book) bindBook(book);
  if (mc) initMonteCarlo(mc);
  if (pipe) initPipeline(pipe);
  document.querySelectorAll('[data-mercury-book]').forEach(bindBook);
}
