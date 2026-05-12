/* ===== Nav scroll effect ===== */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });

/* ===== Reveal on scroll ===== */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => {
        entry.target.classList.add('visible');
      }, i * 60);
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* ===== Counter animation ===== */
function animateCounter(el, target) {
  const duration = 1200;
  const start = performance.now();
  const update = (now) => {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(eased * target);
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      animateCounter(el, parseInt(el.dataset.target, 10));
      counterObserver.unobserve(el);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('.stat-number').forEach(el => counterObserver.observe(el));

/* ===== Copy to clipboard ===== */
const copyBtn = document.getElementById('copyBtn');
const installCmd = document.getElementById('installCmd');
copyBtn?.addEventListener('click', () => {
  navigator.clipboard.writeText(installCmd.textContent.trim()).then(() => {
    copyBtn.classList.add('copied');
    setTimeout(() => copyBtn.classList.remove('copied'), 2000);
  });
});

/* ===== Module tabs ===== */
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.module-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('tab-' + tab.dataset.tab)?.classList.add('active');
  });
});

/* ===== Terminal typewriter animation ===== */
const termOutput = document.getElementById('termOutput');

const termLines = [
  { text: '', delay: 400 },
  { text: '<span class="t-dim">devguard v2.0.0 — scanning project...</span>', delay: 500 },
  { text: '', delay: 300 },
  { text: '<span class="t-dim">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</span>', delay: 200 },
  { text: '<span class="t-dim">  ENV AUDIT</span>', delay: 150 },
  { text: '<span class="t-dim">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</span>', delay: 300 },
  { text: '<span class="t-red">  ✗ DATABASE_URL</span><span class="t-dim"> — Missing required key</span>', delay: 250 },
  { text: '<span class="t-red">  ✗ JWT_SECRET</span><span class="t-dim"> — Insecure value: \'secret\'</span>', delay: 250 },
  { text: '<span class="t-yellow">  ⚠ PORT</span><span class="t-dim"> — Expected number, got \'abc\'</span>', delay: 300 },
  { text: '', delay: 200 },
  { text: '<span class="t-dim">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</span>', delay: 150 },
  { text: '<span class="t-dim">  DEPS AUDIT</span>', delay: 150 },
  { text: '<span class="t-dim">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</span>', delay: 300 },
  { text: '<span class="t-red">  ✗ moment</span><span class="t-dim"> — imported nowhere in source</span>', delay: 220 },
  { text: '<span class="t-yellow">  ⚠ axios</span><span class="t-dim"> — 0.27.0 → 1.7.2</span>', delay: 220 },
  { text: '<span class="t-red">  ✗ express@4.18.0</span><span class="t-red"> CVE-2024-29041</span><span class="t-dim"> High</span>', delay: 300 },
  { text: '', delay: 200 },
  { text: '<span class="t-dim">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</span>', delay: 150 },
  { text: '<span class="t-dim">  REACT AUDIT</span>', delay: 150 },
  { text: '<span class="t-dim">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</span>', delay: 300 },
  { text: '<span class="t-yellow">  ⚠ Home.tsx:42</span><span class="t-dim"> — inline object prop causes re-renders</span>', delay: 220 },
  { text: '<span class="t-red">  ✗ Avatar.tsx:12</span><span class="t-dim"> — &lt;img&gt; missing alt attribute</span>', delay: 250 },
  { text: '', delay: 200 },
  { text: '<span class="t-dim">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</span>', delay: 150 },
  { text: '<span class="t-dim">  SUMMARY</span>', delay: 150 },
  { text: '<span class="t-dim">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</span>', delay: 300 },
  { text: '<span class="t-red">  4 errors</span>  <span class="t-yellow">3 warnings</span>  <span class="t-green">9 passed</span>', delay: 600 },
  { text: '<span class="t-dim">  Fix errors before deploying. Run with --json for CI.</span>', delay: 400 },
];

let running = false;

function startTerminalAnimation() {
  if (running) return;
  running = true;

  const cursor = document.createElement('span');
  cursor.className = 'cursor';
  termOutput.appendChild(cursor);

  let lineIndex = 0;
  let elapsed = 0;

  function renderNext() {
    if (lineIndex >= termLines.length) {
      cursor.remove();
      return;
    }

    const { text, delay } = termLines[lineIndex];
    elapsed += delay;

    setTimeout(() => {
      const div = document.createElement('div');
      div.innerHTML = text || '&nbsp;';
      div.style.opacity = '0';
      div.style.transform = 'translateX(-6px)';
      div.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
      termOutput.insertBefore(div, cursor);
      requestAnimationFrame(() => {
        div.style.opacity = '1';
        div.style.transform = 'translateX(0)';
      });
      lineIndex++;
      renderNext();
    }, delay);
  }

  renderNext();
}

// Start when terminal enters viewport
const termObserver = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting) {
    setTimeout(startTerminalAnimation, 600);
    termObserver.disconnect();
  }
}, { threshold: 0.3 });

const termWrap = document.querySelector('.terminal-wrap');
if (termWrap) termObserver.observe(termWrap);

/* ===== Particle canvas ===== */
(function () {
  const canvas = document.getElementById('particles');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles = [], animId;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() * W;
      this.y = Math.random() * H;
      this.r = Math.random() * 1.5 + 0.3;
      this.vx = (Math.random() - 0.5) * 0.25;
      this.vy = (Math.random() - 0.5) * 0.25;
      this.alpha = Math.random() * 0.5 + 0.1;
      this.color = Math.random() > 0.7 ? '#22c55e' : '#e2e4ea';
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      if (this.x < -5 || this.x > W + 5 || this.y < -5 || this.y > H + 5) this.reset();
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.globalAlpha = this.alpha;
      ctx.fill();
    }
  }

  function init() {
    resize();
    particles = Array.from({ length: 80 }, () => new Particle());
  }

  function drawConnections() {
    ctx.globalAlpha = 1;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(34,197,94,${0.04 * (1 - dist / 120)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  }

  function loop() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => { p.update(); p.draw(); });
    drawConnections();
    ctx.globalAlpha = 1;
    animId = requestAnimationFrame(loop);
  }

  init();
  loop();
  window.addEventListener('resize', () => { resize(); particles.forEach(p => p.reset()); }, { passive: true });
})();
