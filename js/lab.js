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

function initBookLab(root) {
  const bookEl = root.querySelector('[data-book]');
  const logEl = root.querySelector('[data-book-log]');
  const form = root.querySelector('[data-book-form]');
  const reset = root.querySelector('[data-book-reset]');
  if (!bookEl || !logEl || !form) return;

  const SEED = [
    { side: 'sell', price: 10120, qty: 300 },
    { side: 'sell', price: 10110, qty: 150 },
    { side: 'buy', price: 10090, qty: 200 },
    { side: 'buy', price: 10080, qty: 500 },
  ];

  let nextId = 1;
  let asks = [];
  let bids = [];
  let log = [];

  function fmt(price) {
    return (price / 100).toFixed(2);
  }

  function seed() {
    nextId = 1;
    asks = [];
    bids = [];
    log = ['Reset to schematic seed. Illustrative prices only.'];
    SEED.forEach((order) => rest(order.side, order.price, order.qty));
    log = ['Schematic seed loaded. Not a live market.'];
    render();
  }

  function rest(side, price, qty) {
    const order = { id: nextId++, side, price, qty };
    if (side === 'buy') {
      bids.push(order);
      bids.sort((a, b) => b.price - a.price || a.id - b.id);
    } else {
      asks.push(order);
      asks.sort((a, b) => a.price - b.price || a.id - b.id);
    }
  }

  function match(side, price, qty) {
    let remaining = qty;
    const fills = [];

    if (side === 'buy') {
      while (remaining > 0 && asks.length && price >= asks[0].price) {
        const top = asks[0];
        const take = Math.min(remaining, top.qty);
        fills.push({ price: top.price, qty: take });
        top.qty -= take;
        remaining -= take;
        if (top.qty === 0) asks.shift();
      }
    } else {
      while (remaining > 0 && bids.length && price <= bids[0].price) {
        const top = bids[0];
        const take = Math.min(remaining, top.qty);
        fills.push({ price: top.price, qty: take });
        top.qty -= take;
        remaining -= take;
        if (top.qty === 0) bids.shift();
      }
    }

    return { remaining, fills };
  }

  function levels(orders) {
    const map = new Map();
    orders.forEach((order) => {
      map.set(order.price, (map.get(order.price) || 0) + order.qty);
    });
    return [...map.entries()];
  }

  function render() {
    const askLevels = levels(asks).sort((a, b) => b[0] - a[0]);
    const bidLevels = levels(bids).sort((a, b) => b[0] - a[0]);
    const maxQty = Math.max(1, ...askLevels.map(([, q]) => q), ...bidLevels.map(([, q]) => q));

    const askRows = askLevels
      .map(
        ([price, qty]) =>
          `<div class="book__row book__row--ask"><span>${fmt(price)}</span><span>${qty}</span><span class="book__bar" style="--w: ${(qty / maxQty) * 100}%"></span></div>`,
      )
      .join('');
    const bidRows = bidLevels
      .map(
        ([price, qty]) =>
          `<div class="book__row book__row--bid"><span>${fmt(price)}</span><span>${qty}</span><span class="book__bar" style="--w: ${(qty / maxQty) * 100}%"></span></div>`,
      )
      .join('');

    bookEl.innerHTML = `<p class="book__side-label">Ask</p>${askRows || '<p class="lab__empty">No asks</p>'}
      <p class="book__spread">Spread</p>
      ${bidRows || '<p class="lab__empty">No bids</p>'}
      <p class="book__side-label">Bid</p>`;

    logEl.innerHTML = log
      .slice(-6)
      .map((line) => `<li>${escape(line)}</li>`)
      .join('');
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const side = form.side.value === 'sell' ? 'sell' : 'buy';
    const price = Math.round(Number(form.price.value) * 100);
    const qty = Math.round(Number(form.qty.value));
    if (!Number.isFinite(price) || !Number.isFinite(qty) || qty <= 0) return;

    const { remaining, fills } = match(side, price, qty);
    fills.forEach((fill) => {
      log.push(`Fill ${fill.qty} @ ${fmt(fill.price)}`);
    });
    if (remaining > 0) {
      rest(side, price, remaining);
      log.push(`Rest ${side} ${remaining} @ ${fmt(price)}`);
    } else {
      log.push(`Filled ${side} ${qty} @ limit ${fmt(price)}`);
    }
    render();
  });

  reset?.addEventListener('click', seed);
  seed();
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
  if (book) initBookLab(book);
  if (mc) initMonteCarlo(mc);
  if (pipe) initPipeline(pipe);
}
