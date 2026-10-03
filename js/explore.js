function bindStageList(root) {
  const stages = [...root.querySelectorAll('[data-stage]')];
  const out = root.querySelector('[data-stage-out]');
  if (!stages.length || !out) return;

  function paint(button) {
    stages.forEach((btn) => btn.setAttribute('aria-pressed', String(btn === button)));
    const title = button.textContent.trim();
    const note = button.getAttribute('data-note') || '';
    out.innerHTML = `<p class="stage-out__name">${title}</p><p>${note}</p>`;
  }

  stages.forEach((btn) => {
    btn.setAttribute('aria-pressed', 'false');
    btn.addEventListener('click', () => paint(btn));
    btn.addEventListener('focus', () => paint(btn));
    btn.addEventListener('pointerenter', () => {
      if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
      paint(btn);
    });
  });
}

export function initExplorers() {
  document.querySelectorAll('[data-explorer]').forEach(bindStageList);
}
