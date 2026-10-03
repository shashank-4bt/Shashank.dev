const KEY = 'shashank.dev.boot';

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function initIntro() {
  const root = document.querySelector('[data-boot]');
  if (!root) return;

  const skip = () => {
    root.hidden = true;
    root.setAttribute('aria-hidden', 'true');
    try {
      window.localStorage.setItem(KEY, '1');
    } catch {
      /* ignore quota / private mode */
    }
  };

  let seen = false;
  try {
    seen = window.localStorage.getItem(KEY) === '1';
  } catch {
    seen = false;
  }

  if (seen || prefersReducedMotion()) {
    skip();
    return;
  }

  root.hidden = false;
  root.removeAttribute('aria-hidden');
  const skipBtn = root.querySelector('[data-boot-skip]');
  skipBtn?.addEventListener('click', skip);
  root.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      skip();
    }
  });
  window.setTimeout(skip, 900);
  skipBtn?.focus();
}
