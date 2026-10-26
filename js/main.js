(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  // Preloader
  document.body.classList.add('loading');
  const msgs = ['Error: Coffee not found…', 'Retrying…', 'Brewing…', '200 OK ☕'];
  let mi = 0;
  const msgEl = $('#pre-msg');
  const msgTimer = setInterval(() => { mi = Math.min(mi + 1, msgs.length - 1); msgEl.textContent = msgs[mi]; }, 520);
  const hidePre = () => {
    clearInterval(msgTimer);
    $('#preloader').classList.add('done');
    document.body.classList.remove('loading');
    document.body.classList.add('ready');
    $$('.hero .reveal').forEach((e, i) => setTimeout(() => e.classList.add('in-view'), 600 + i * 150));
  };
  window.addEventListener('load', () => setTimeout(hidePre, reduce ? 0 : 2100));

  // Nav + progress + parallax
  const nav = $('#nav'), prog = $('#progress');
  const pars = $$('[data-parallax]');
  let ticking = false;
  const onScroll = () => {
    const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
    prog.style.width = (y / max * 100) + '%';
    nav.classList.toggle('scrolled', y > 40);
    if (!reduce) pars.forEach(p => { p.style.transform = `translateY(${y * +p.dataset.parallax}px)`; });
    ticking = false;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  // Reveal on scroll + counters
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in-view');
    $$('[data-count]', e.target).forEach(countUp);
    if (e.target.matches('[data-count]')) countUp(e.target);
    io.unobserve(e.target);
  }), { threshold: .15 });
  $$('.reveal:not(.hero .reveal),.reveal-left,.reveal-right').forEach(el => io.observe(el));
  function countUp(el) {
    if (el.dataset.done) return; el.dataset.done = 1;
    const to = +el.dataset.count; let n = 0;
    const t = setInterval(() => { n++; el.textContent = n; if (n >= to) clearInterval(t); }, reduce ? 1 : 90);
  }

  // Menu tabs with sliding ink
  const tabs = $$('.tab'), ink = $('.tab-ink');
  const moveInk = t => { ink.style.left = t.offsetLeft + 'px'; ink.style.width = t.offsetWidth + 'px'; };
  tabs.forEach(t => t.addEventListener('click', () => {
    tabs.forEach(x => x.classList.toggle('active', x === t));
    $$('.panel').forEach(p => p.classList.toggle('active', p.id === 'panel-' + t.dataset.tab));
    moveInk(t);
  }));
  const initInk = () => moveInk($('.tab.active'));
  addEventListener('resize', initInk);
  document.fonts.ready.then(initInk); initInk();

  // Gallery (ordered chronologically as posted on @f04coffee feed)
  const gal = [
    'ig-01', 'collab-02', 'ig-03', 'collab-04', 'ig-05', 'ig-06',
    'ig-07', 'ig-08', 'ig-09', 'ig-10', 'ig-11', 'ig-12',
    'ig-13', 'ig-14', 'ig-15', 'ig-16', 'ig-17', 'ig-18',
    'ig-19', 'ig-20', 'ig-21', 'ig-22', 'ig-23', 'ig-24',
    'ig-25', 'ig-26', 'ig-27', 'ig-28', 'ig-29', 'ig-30',
    'ig-31', 'ig-32', 'ig-33', 'ig-34'
  ].map(n => `images/ig/${n}.jpg`);
  const mas = $('#masonry');
  gal.forEach((src, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.id = 'gal-' + i; b.setAttribute('aria-label', 'Open photo ' + (i + 1));
    b.innerHTML = `<img src="${src}" alt="404 Coffee Instagram photo ${i + 1}" loading="lazy">`;
    b.addEventListener('click', () => openLb(i));
    mas.appendChild(b);
  });
  const gio = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { setTimeout(() => e.target.classList.add('in'), (+e.target.dataset.d || 0)); gio.unobserve(e.target); }
  }), { threshold: .1 });
  $$('.masonry button').forEach((b, i) => { b.dataset.d = (i % 4) * 90; gio.observe(b); });

  // Lightbox
  const lb = $('#lightbox'), lbi = $('#lb-img'); let cur = 0;
  function openLb(i) { cur = (i + gal.length) % gal.length; lbi.src = gal[cur]; lb.hidden = false; document.body.style.overflow = 'hidden'; }
  function closeLb() { lb.hidden = true; document.body.style.overflow = ''; }
  $('#lb-close').onclick = closeLb;
  $('#lb-prev').onclick = () => openLb(cur - 1);
  $('#lb-next').onclick = () => openLb(cur + 1);
  lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });
  addEventListener('keydown', e => {
    if (lb.hidden) return;
    if (e.key === 'Escape') closeLb();
    if (e.key === 'ArrowLeft') openLb(cur - 1);
    if (e.key === 'ArrowRight') openLb(cur + 1);
  });

  // Enquiry form (front-end demo)
  $('#enquiry').addEventListener('submit', e => {
    e.preventDefault();
    const n = $('#f-name'), p = $('#f-phone'), m = $('#form-msg');
    const okN = n.value.trim().length > 1, okP = /^[+\d][\d\s-]{6,}$/.test(p.value.trim());
    n.classList.toggle('invalid', !okN); p.classList.toggle('invalid', !okP);
    m.textContent = okN && okP ? `Thanks ${n.value.trim()}! We'll get back to you soon. (demo form)` : 'Please enter your name and a valid phone number.';
  });

  if (reduce) return;

  // 3D tilt
  $$('.tilt').forEach(el => {
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      el.style.transform = `perspective(800px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateY(-4px)`;
    });
    el.addEventListener('mouseleave', () => { el.style.transform = ''; });
  });

  // Magnetic buttons
  $$('.magnetic').forEach(b => {
    b.addEventListener('mousemove', e => {
      const r = b.getBoundingClientRect();
      b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .25}px,${(e.clientY - r.top - r.height / 2) * .35}px)`;
    });
    b.addEventListener('mouseleave', () => { b.style.transform = ''; });
  });

  // Cursor glow
  const glow = $('#cursor-glow');
  addEventListener('mousemove', e => { glow.style.left = e.clientX + 'px'; glow.style.top = e.clientY + 'px'; }, { passive: true });

  // Steam particles
  const cv = $('#steam'), ctx = cv.getContext('2d');
  let W, H, ps = [];
  const size = () => { W = cv.width = cv.offsetWidth; H = cv.height = cv.offsetHeight; };
  size(); addEventListener('resize', size);
  const spawn = () => ({ x: Math.random() * W, y: H + 20, r: 20 + Math.random() * 50, vy: .3 + Math.random() * .6, vx: (Math.random() - .5) * .3, a: .0, life: 0 });
  for (let i = 0; i < 24; i++) { const p = spawn(); p.y = Math.random() * H; p.life = Math.random() * 300; ps.push(p); }
  (function tick() {
    ctx.clearRect(0, 0, W, H);
    ps.forEach((p, i) => {
      p.y -= p.vy; p.x += p.vx + Math.sin((p.y + i * 40) / 70) * .3; p.life++; p.r += .08;
      p.a = Math.min(.09, Math.sin(Math.min(p.life / 380, 1) * Math.PI) * .09);
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
      g.addColorStop(0, `rgba(255,120,130,${p.a})`); g.addColorStop(1, 'rgba(255,120,130,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill();
      if (p.y < -p.r || p.life > 380) ps[i] = spawn();
    });
    requestAnimationFrame(tick);
  })();
})();
