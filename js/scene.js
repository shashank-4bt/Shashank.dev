const POINT_STEP_DESKTOP = 28;
const POINT_STEP_MOBILE = 36;

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function hexToRgb(value) {
  const v = value.startsWith('#') ? value.slice(1) : value;
  if (v.length === 3) {
    const r = parseInt(v[0] + v[0], 16);
    const g = parseInt(v[1] + v[1], 16);
    const b = parseInt(v[2] + v[2], 16);
    return { r, g, b };
  }
  if (v.length >= 6) {
    return {
      r: parseInt(v.slice(0, 2), 16),
      g: parseInt(v.slice(2, 4), 16),
      b: parseInt(v.slice(4, 6), 16),
    };
  }
  return { r: 183, g: 201, b: 163 };
}

/**
 * Cursor-reactive coordinate field. Lightweight 2D canvas.
 * Static on touch / reduced-motion; paused while off-screen.
 */
export function initScene(canvas, coordsEl) {
  if (!canvas) return;

  const wrap = canvas.parentElement;
  const stage = wrap?.closest('.hero') || wrap;
  const ctx = canvas.getContext('2d');
  if (!ctx || !wrap) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const interactive = !reduced && !coarse;

  let width = 0;
  let height = 0;
  let dpr = 1;
  let raf = 0;
  let visible = true;
  let pointer = { x: -9999, y: -9999 };
  let points = [];

  function resize() {
    const rect = wrap.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(1, Math.floor(rect.width));
    height = Math.max(1, Math.floor(rect.height));
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const step = width < 640 ? POINT_STEP_MOBILE : POINT_STEP_DESKTOP;
    points = [];
    const pad = step;
    for (let y = pad; y < height - pad / 2; y += step) {
      for (let x = pad; x < width - pad / 2; x += step) {
        points.push({ x, y });
      }
    }
    draw(0);
  }

  function draw(time) {
    const line = hexToRgb(cssVar('--line') || '#2a2c27');
    const accent = hexToRgb(cssVar('--accent') || '#b7c9a3');
    ctx.clearRect(0, 0, width, height);

    ctx.strokeStyle = `rgba(${line.r}, ${line.g}, ${line.b}, 0.45)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(16, height / 2);
    ctx.lineTo(width - 16, height / 2);
    ctx.moveTo(width / 2, 16);
    ctx.lineTo(width / 2, height - 16);
    ctx.stroke();

    const t = interactive ? time * 0.00035 : 0;

    for (const p of points) {
      let dx = 0;
      let dy = 0;
      if (interactive) {
        const vx = p.x - pointer.x;
        const vy = p.y - pointer.y;
        const dist = Math.hypot(vx, vy) || 1;
        const force = Math.max(0, 1 - dist / 140);
        dx = (vx / dist) * force * 14;
        dy = (vy / dist) * force * 14;
        dx += Math.sin(t + p.y * 0.02) * 0.35;
      }
      const x = p.x + dx;
      const y = p.y + dy;
      const near = interactive && Math.hypot(p.x - pointer.x, p.y - pointer.y) < 64;
      ctx.fillStyle = near
        ? `rgba(${accent.r}, ${accent.g}, ${accent.b}, 0.95)`
        : `rgba(${line.r}, ${line.g}, ${line.b}, 0.85)`;
      ctx.fillRect(x, y, near ? 2 : 1.2, near ? 2 : 1.2);
    }
  }

  function loop(time) {
    if (!visible || !interactive) return;
    draw(time);
    raf = window.requestAnimationFrame(loop);
  }

  function onPointer(event) {
    const rect = stage.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
    if (coordsEl) {
      const nx = width ? (pointer.x / width).toFixed(2) : '0.00';
      const ny = height ? (pointer.y / height).toFixed(2) : '0.00';
      coordsEl.textContent = `x ${nx} · y ${ny}`;
    }
  }

  function onLeave() {
    pointer.x = -9999;
    pointer.y = -9999;
  }

  const io = new IntersectionObserver(
    (entries) => {
      visible = entries.some((entry) => entry.isIntersecting);
      if (visible && interactive) {
        cancelAnimationFrame(raf);
        raf = window.requestAnimationFrame(loop);
      } else {
        cancelAnimationFrame(raf);
        if (visible) draw(0);
      }
    },
    { threshold: 0.05 },
  );
  io.observe(wrap);

  const ro = new ResizeObserver(resize);
  ro.observe(wrap);

  if (interactive) {
    stage.addEventListener('pointermove', onPointer, { passive: true });
    stage.addEventListener('pointerleave', onLeave);
  } else if (coordsEl) {
    coordsEl.textContent = 'grid · static';
  }

  resize();
  if (interactive && visible) raf = window.requestAnimationFrame(loop);
}
