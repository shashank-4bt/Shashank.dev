/** Deterministic schematic book. Prices are integer ticks (cents). */

export const MERCURY_SEED = [
  { side: 'sell', price: 10120, qty: 300 },
  { side: 'sell', price: 10110, qty: 150 },
  { side: 'sell', price: 10100, qty: 420 },
  { side: 'buy', price: 10090, qty: 200 },
  { side: 'buy', price: 10080, qty: 500 },
  { side: 'buy', price: 10070, qty: 120 },
];

export function formatTick(price) {
  return (price / 100).toFixed(2);
}

export function createBook(seed = MERCURY_SEED) {
  let nextId = 1;
  let asks = [];
  let bids = [];
  const log = [];

  function rest(side, price, qty) {
    const order = { id: nextId++, side, price, qty };
    if (side === 'buy') {
      bids.push(order);
      bids.sort((a, b) => b.price - a.price || a.id - b.id);
    } else {
      asks.push(order);
      asks.sort((a, b) => a.price - b.price || a.id - b.id);
    }
    return order;
  }

  function match(side, price, qty) {
    let remaining = qty;
    const fills = [];
    const book = side === 'buy' ? asks : bids;
    const crosses = side === 'buy' ? () => remaining > 0 && book.length && price >= book[0].price : () => remaining > 0 && book.length && price <= book[0].price;

    while (crosses()) {
      const top = book[0];
      const take = Math.min(remaining, top.qty);
      fills.push({ price: top.price, qty: take, id: top.id });
      top.qty -= take;
      remaining -= take;
      if (top.qty === 0) book.shift();
    }
    return { remaining, fills };
  }

  function submit(side, price, qty) {
    const { remaining, fills } = match(side, price, qty);
    fills.forEach((fill) => log.push(`Fill ${fill.qty} @ ${formatTick(fill.price)}`));
    if (remaining > 0) {
      const order = rest(side, price, remaining);
      log.push(`Rest ${side} ${remaining} @ ${formatTick(price)} #${order.id}`);
      return { fills, order };
    }
    log.push(`Filled ${side} ${qty} @ limit ${formatTick(price)}`);
    return { fills, order: null };
  }

  function cancelLast() {
    const last = [...asks, ...bids].sort((a, b) => b.id - a.id)[0];
    if (!last) {
      log.push('No resting order to cancel.');
      return null;
    }
    asks = asks.filter((order) => order.id !== last.id);
    bids = bids.filter((order) => order.id !== last.id);
    log.push(`Cancel #${last.id} ${last.side} ${last.qty} @ ${formatTick(last.price)}`);
    return last;
  }

  function modifyLast(qty) {
    const last = [...asks, ...bids].sort((a, b) => b.id - a.id)[0];
    if (!last || qty <= 0) {
      log.push('No resting order to modify.');
      return null;
    }
    last.qty = qty;
    log.push(`Modify #${last.id} qty → ${qty}`);
    return last;
  }

  function reset() {
    nextId = 1;
    asks = [];
    bids = [];
    log.length = 0;
    seed.forEach((order) => rest(order.side, order.price, order.qty));
    log.length = 0;
    log.push('Schematic seed loaded. Not a live market.');
  }

  function levels(side) {
    const source = side === 'buy' ? bids : asks;
    const map = new Map();
    source.forEach((order) => map.set(order.price, (map.get(order.price) || 0) + order.qty));
    const rows = [...map.entries()];
    rows.sort((a, b) => (side === 'buy' ? b[0] - a[0] : b[0] - a[0]));
    return rows;
  }

  reset();

  return {
    submit,
    cancelLast,
    modifyLast,
    reset,
    levels,
    log,
    snapshot() {
      return { asks: levels('sell'), bids: levels('buy'), log: log.slice(-6) };
    },
  };
}

export function renderBook(el, book) {
  if (!el) return;
  const { asks, bids } = book.snapshot();
  const maxQty = Math.max(1, ...asks.map(([, q]) => q), ...bids.map(([, q]) => q));
  const row = (kind, price, qty) =>
    `<div class="book__row book__row--${kind}"><span>${formatTick(price)}</span><span>${qty}</span><span class="book__bar" style="--w: ${(qty / maxQty) * 100}%"></span></div>`;
  const askHtml = asks.length ? asks.map(([p, q]) => row('ask', p, q)).join('') : '<p class="lab__empty">No asks</p>';
  const bidHtml = bids.length ? bids.map(([p, q]) => row('bid', p, q)).join('') : '<p class="lab__empty">No bids</p>';
  el.innerHTML = `<p class="book__side-label">Ask</p>${askHtml}<p class="book__spread">Spread</p>${bidHtml}<p class="book__side-label">Bid</p>`;
}
