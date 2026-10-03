import { initScene } from './scene.js';
import { initMarks } from './logos.js';
import { initStructureFlow } from './structure-flow.js';
import { hydrateSite } from './content.js';
import { initSystemMap } from './system-map.js';
import { initLab } from './lab.js';
import { initExplorers } from './explore.js';
import { initIntro } from './intro.js';
import { initRail } from './rail.js';
import { initTerminal } from './terminal.js';
import { initGraph } from './graph.js';
import { skillUsage } from '../src/data/skill-usage.js';

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function initHeader() {
  const header = document.querySelector('[data-header]');
  if (!header) return;
  let ticking = false;

  function update() {
    ticking = false;
    header.classList.toggle('is-compact', window.scrollY > 24);
  }

  window.addEventListener(
    'scroll',
    () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    },
    { passive: true },
  );
  update();
}

function initNav() {
  const toggle = document.querySelector('[data-nav-toggle]');
  const nav = document.querySelector('[data-nav]');
  if (!toggle || !nav) return;

  const links = [...nav.querySelectorAll('a')];

  function setOpen(open, restoreFocus = true) {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? 'Close' : 'Menu';
    nav.classList.toggle('is-open', open);
    document.body.classList.toggle('nav-locked', open);
    if (open) links[0]?.focus();
    else if (restoreFocus) toggle.focus();
  }

  function isOpen() {
    return toggle.getAttribute('aria-expanded') === 'true';
  }

  toggle.addEventListener('click', () => setOpen(!isOpen()));

  links.forEach((link) => {
    link.addEventListener('click', () => {
      if (isOpen()) setOpen(false, false);
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isOpen()) {
      event.preventDefault();
      setOpen(false);
    }
    if (!isOpen() || event.key !== 'Tab') return;
    const first = links[0];
    const last = links[links.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
}

function initActiveNav() {
  const nav = document.querySelector('[data-nav]');
  if (!nav) return;
  const links = [...nav.querySelectorAll('a')];
  const map = [
    { id: 'hero', hash: '#hero' },
    { id: 'work', hash: '#work' },
    { id: 'system-map', hash: '#system-map' },
    { id: 'skills', hash: '#skills' },
    { id: 'lab', hash: '#lab' },
    { id: 'about', hash: '#about' },
    { id: 'contact', hash: '#contact' },
  ];

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const match = map.find((item) => item.id === entry.target.id);
        if (!match) return;
        links.forEach((link) => {
          const on = link.hash === match.hash;
          link.classList.toggle('is-active', on);
          if (on) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      });
    },
    { rootMargin: '-40% 0px -45% 0px', threshold: 0 },
  );

  map.forEach((item) => {
    const el = document.getElementById(item.id);
    if (el) io.observe(el);
  });
}

function initReveals() {
  const targets = document.querySelectorAll('.section, .project, .hero__quote, .about__index');
  if (prefersReducedMotion()) return;
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -6% 0px' },
  );
  targets.forEach((el) => {
    el.classList.add('reveal');
    io.observe(el);
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function initSkills() {
  const root = document.querySelector('[data-skill-map]');
  const rail = document.querySelector('[data-skill-rail]');
  const detail = document.querySelector('[data-skill-detail]');
  if (!root || !rail || !detail) return;

  const buttons = [...root.querySelectorAll('[data-skill]')];
  const desktop = window.matchMedia('(min-width: 768px)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  let selected = '';

  function placeDetail(button) {
    buttons.forEach((btn) => btn.closest('li')?.classList.remove('is-open'));
    if (desktop.matches || !button) {
      rail.appendChild(detail);
      return;
    }
    const item = button.closest('li');
    if (!item) {
      rail.appendChild(detail);
      return;
    }
    item.classList.add('is-open');
    item.appendChild(detail);
  }

  function paint(skill, sticky) {
    if (sticky) selected = skill;
    const shown = skill || selected;
    const related = skillUsage[shown] || [];
    buttons.forEach((btn) => {
      const on = Boolean(selected) && btn.getAttribute('data-skill') === selected;
      btn.setAttribute('aria-pressed', String(on));
    });
    const shownBtn = buttons.find((btn) => btn.getAttribute('data-skill') === shown);
    placeDetail(!desktop.matches && shownBtn ? shownBtn : null);

    if (!shown) {
      detail.innerHTML = '<p class="skill-map__prompt">Select a skill.</p>';
      return;
    }

    if (!related.length) {
      detail.innerHTML = `<p class="skill-detail__name">${escapeHtml(shown)}</p>
        <p class="skill-detail__label">Selected work</p>
        <p class="skill-detail__empty">No featured repository currently mapped.</p>`;
      return;
    }

    const count =
      related.length === 1 ? '1 repository' : `${related.length} repositories`;
    const items = related
      .map((project) => {
        const extra =
          project.type === 'repository'
            ? ' rel="noopener noreferrer" target="_blank"'
            : '';
        return `<li><a href="${escapeHtml(project.href)}"${extra}>${escapeHtml(project.name)}</a></li>`;
      })
      .join('');

    detail.innerHTML = `<p class="skill-detail__name">${escapeHtml(shown)}</p>
      <p class="skill-detail__label">Selected work</p>
      <ul class="skill-detail__list">${items}</ul>
      <p class="skill-detail__count">${count}</p>`;
  }

  buttons.forEach((btn) => {
    btn.setAttribute('aria-pressed', 'false');
    btn.setAttribute('aria-controls', 'skill-detail');
    const skill = btn.getAttribute('data-skill') || '';
    btn.addEventListener('click', () => paint(skill, true));
    btn.addEventListener('pointerenter', () => {
      if (!finePointer.matches || !desktop.matches) return;
      paint(skill, false);
    });
  });

  root.addEventListener('pointerleave', () => {
    if (!finePointer.matches || !desktop.matches) return;
    paint(selected, Boolean(selected));
  });

  desktop.addEventListener('change', () => {
    if (selected) paint(selected, true);
    else placeDetail(null);
  });

  root.addEventListener('keydown', (event) => {
    const keys = ['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft', 'Home', 'End'];
    if (!keys.includes(event.key)) return;
    const index = buttons.indexOf(document.activeElement);
    if (index < 0) return;
    event.preventDefault();
    let next = index;
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (index + 1) % buttons.length;
    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (index - 1 + buttons.length) % buttons.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = buttons.length - 1;
    buttons[next].focus();
    paint(buttons[next].getAttribute('data-skill') || '', true);
  });
}

function initMagnetic() {
  if (prefersReducedMotion()) return;
  if (window.matchMedia('(pointer: coarse)').matches) return;
  const el = document.querySelector('[data-magnetic]');
  if (!el) return;

  el.addEventListener('pointermove', (event) => {
    const rect = el.getBoundingClientRect();
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;
    el.style.transform = `translate(${x * 0.08}px, ${y * 0.18}px)`;
  });
  el.addEventListener('pointerleave', () => {
    el.style.transform = '';
  });
}

hydrateSite();
initIntro();
initHeader();
initNav();
initActiveNav();
initRail();
initReveals();
initSkills();
initSystemMap();
initGraph();
initExplorers();
initLab();
initTerminal();
initMagnetic();
initMarks();
initStructureFlow();
initScene(document.querySelector('[data-scene]'), document.querySelector('[data-coords]'));
