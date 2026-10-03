const MARKS = {
  quantlab: `<svg class="mark" viewBox="0 0 14 14" aria-hidden="true"><path d="M1 10 C3 10 4 4 6 5 S10 11 13 7" fill="none" stroke="currentColor" stroke-width="1"/></svg>`,
  mercury: `<svg class="mark" viewBox="0 0 14 14" aria-hidden="true"><rect x="2" y="2" width="10" height="2" fill="currentColor"/><rect x="2" y="10" width="10" height="2" fill="currentColor"/><path d="M2 7h10" stroke="currentColor" stroke-width="1"/></svg>`,
  knowlyy: `<svg class="mark" viewBox="0 0 14 14" aria-hidden="true"><circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" stroke-width="1"/><circle cx="7" cy="2" r="0.8" fill="currentColor"/><circle cx="11.5" cy="7" r="0.8" fill="currentColor"/><circle cx="7" cy="12" r="0.8" fill="currentColor"/><circle cx="2.5" cy="7" r="0.8" fill="currentColor"/></svg>`,
  phisheye: `<svg class="mark" viewBox="0 0 14 14" aria-hidden="true"><circle cx="7" cy="7" r="2" fill="none" stroke="currentColor"/><circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" opacity=".6"/><circle cx="7" cy="7" r="6.2" fill="none" stroke="currentColor" opacity=".35"/></svg>`,
  fundmatch: `<svg class="mark" viewBox="0 0 14 14" aria-hidden="true"><path d="M3 4h8M3 7h8M3 10h8" stroke="currentColor" stroke-width="1"/><path d="M10 2l3 2-3 2M10 8l3 2-3 2" fill="none" stroke="currentColor" stroke-width="1"/></svg>`,
};

export function initMarks() {
  document.querySelectorAll('[data-mark]').forEach((el) => {
    const key = el.getAttribute('data-mark');
    const svg = MARKS[key];
    if (!svg) return;
    el.insertAdjacentHTML('afterbegin', svg);
  });
}
