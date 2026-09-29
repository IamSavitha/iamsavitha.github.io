// Progressive-enhancement effects. The page is complete without this script;
// everything here is skipped when the visitor prefers reduced motion.

(window as Window & { __fx?: boolean }).__fx = true;

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Fade-up elements marked [data-reveal] as they enter the viewport. */
function initReveal() {
  const targets = document.querySelectorAll<HTMLElement>('[data-reveal]');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('is-in'));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          observer.unobserve(entry.target);
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
  );
  targets.forEach((el) => observer.observe(el));
}

/** Tilt the hero screen back to flat as the page scrolls. */
function initScrollTilt() {
  const screen = document.querySelector<HTMLElement>('[data-scroll-tilt]');
  if (!screen || reduceMotion) return;
  let queued = false;
  const update = () => {
    queued = false;
    const progress = Math.min(1, window.scrollY / (window.innerHeight * 0.55));
    const wide = window.innerWidth >= 768;
    const [tilt, from, to] = wide ? [18, 1.03, 1] : [12, 0.94, 1];
    screen.style.setProperty('--tilt', `${tilt * (1 - progress)}deg`);
    screen.style.setProperty('--scale', `${from + (to - from) * progress}`);
  };
  window.addEventListener('scroll', () => {
    if (!queued) {
      queued = true;
      requestAnimationFrame(update);
    }
  }, { passive: true });
  update();
}

/** Cursor spotlight on every .card, plus a gentle 3D tilt on [data-tilt-card]. */
function initCardPointer() {
  if (reduceMotion || !window.matchMedia('(hover: hover)').matches) return;
  document.addEventListener('pointermove', (event) => {
    const card = (event.target as Element | null)?.closest<HTMLElement>('.card');
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    card.style.setProperty('--mx', `${x}px`);
    card.style.setProperty('--my', `${y}px`);
    if (card.hasAttribute('data-tilt-card')) {
      const rx = ((y / rect.height) - 0.5) * -5;
      const ry = ((x / rect.width) - 0.5) * 5;
      card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-2px)`;
    }
  });
  document.addEventListener('pointerout', (event) => {
    const card = (event.target as Element | null)?.closest<HTMLElement>('[data-tilt-card]');
    if (card && !card.contains(event.relatedTarget as Node | null)) card.style.transform = '';
  });
}

/** Twinkling sparkles behind the hero, paused while off screen. */
function initSparkles() {
  const canvas = document.querySelector<HTMLCanvasElement>('[data-sparkles]');
  const ctx = canvas?.getContext('2d');
  if (!canvas || !ctx || reduceMotion) return;

  type Dot = { x: number; y: number; r: number; speed: number; phase: number; warm: boolean };
  let dots: Dot[] = [];
  let width = 0;
  let height = 0;
  let running = false;
  const ratio = Math.min(window.devicePixelRatio || 1, 2);

  const resize = () => {
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    const count = Math.min(90, Math.round((width * height) / 14000));
    dots = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 0.4 + Math.random() * 1.1,
      speed: 0.08 + Math.random() * 0.25,
      phase: Math.random() * Math.PI * 2,
      warm: Math.random() < 0.45,
    }));
  };

  const draw = (time: number) => {
    if (!running) return;
    ctx.clearRect(0, 0, width, height);
    for (const dot of dots) {
      dot.y -= dot.speed;
      if (dot.y < -4) {
        dot.y = height + 4;
        dot.x = Math.random() * width;
      }
      const alpha = 0.25 + 0.6 * Math.abs(Math.sin(time / 900 + dot.phase));
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
      ctx.fillStyle = dot.warm ? `rgba(253, 186, 116, ${alpha})` : `rgba(255, 255, 255, ${alpha * 0.8})`;
      ctx.fill();
    }
    requestAnimationFrame(draw);
  };

  resize();
  window.addEventListener('resize', resize);
  new IntersectionObserver(([entry]) => {
    const wasRunning = running;
    running = entry.isIntersecting;
    if (running && !wasRunning) requestAnimationFrame(draw);
  }).observe(canvas);
}

initReveal();
initScrollTilt();
initCardPointer();
initSparkles();
