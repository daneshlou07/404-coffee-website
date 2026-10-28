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
  let hidden = false;
  const hidePre = () => {
    if (hidden) return;
    hidden = true;
    clearInterval(msgTimer);
    $('#preloader').classList.add('done');
    document.body.classList.remove('loading');
    document.body.classList.add('ready');
    $$('.hero .reveal').forEach((e, i) => setTimeout(() => e.classList.add('in-view'), 600 + i * 150));
  };
  if (document.readyState === 'complete') {
    setTimeout(hidePre, reduce ? 0 : 2100);
  } else {
    window.addEventListener('load', () => setTimeout(hidePre, reduce ? 0 : 2100));
    setTimeout(hidePre, 3500);
  }

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

  // Mobile nav drawer (ZUS-style quick navigator)
  const navToggle = $('#nav-toggle'), mobileMenu = $('#mobile-menu');
  if (navToggle && mobileMenu) {
    const toggleMenu = (open) => {
      const isOpen = open !== undefined ? open : !mobileMenu.classList.contains('open');
      mobileMenu.classList.toggle('open', isOpen);
      navToggle.classList.toggle('open', isOpen);
      navToggle.setAttribute('aria-expanded', isOpen);
      mobileMenu.setAttribute('aria-hidden', !isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    };
    navToggle.addEventListener('click', () => toggleMenu());
    $$('#mobile-menu nav a').forEach(a => a.addEventListener('click', () => toggleMenu(false)));
    addEventListener('keydown', e => {
      if (e.key === 'Escape' && mobileMenu.classList.contains('open')) toggleMenu(false);
    });
  }

  // Reveal on scroll
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in-view');
    io.unobserve(e.target);
  }), { threshold: .15 });
  $$('.reveal:not(.hero .reveal),.reveal-left,.reveal-right').forEach(el => io.observe(el));

  // About photo cards swap
  const card1 = $('#about-card-1'), card2 = $('#about-card-2');
  if (card1 && card2) {
    let swapping = false;
    const swapCards = () => {
      if (swapping) return;
      swapping = true;
      const c1IsMain = card1.classList.contains('is-main');
      const incoming = c1IsMain ? card2 : card1;
      const outgoing = c1IsMain ? card1 : card2;

      // Ensure incoming card stays on top during the smooth transition
      incoming.classList.add('is-incoming');
      outgoing.classList.add('is-outgoing');

      // Trigger continuous CSS transition
      incoming.classList.remove('is-sub');
      incoming.classList.add('is-main');
      outgoing.classList.remove('is-main');
      outgoing.classList.add('is-sub');

      incoming.setAttribute('tabindex', '-1');
      outgoing.setAttribute('tabindex', '0');
      const inImg = incoming.querySelector('img'), outImg = outgoing.querySelector('img');
      if (inImg) incoming.setAttribute('aria-label', inImg.alt);
      if (outImg) outgoing.setAttribute('aria-label', 'Click to switch photo: ' + outImg.alt);

      // Clean up layer classes once transition completes
      setTimeout(() => {
        incoming.classList.remove('is-incoming');
        outgoing.classList.remove('is-outgoing');
        swapping = false;
      }, 820);
    };

    card1.addEventListener('click', () => { if (card1.classList.contains('is-sub')) swapCards(); });
    card2.addEventListener('click', () => { if (card2.classList.contains('is-sub')) swapCards(); });
    [card1, card2].forEach(c => {
      c.addEventListener('keydown', e => {
        if ((e.key === 'Enter' || e.key === ' ') && c.classList.contains('is-sub')) {
          e.preventDefault();
          swapCards();
        }
      });
    });
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

  // Menu stories carousel
  $$('.panel').forEach(panel => {
    const cards = $$('.card', panel), n = cards.length;
    let cur = 0;

    cards.forEach((c, i) => {
      const bars = document.createElement('div');
      bars.className = 'bars';
      bars.setAttribute('aria-hidden', 'true');
      bars.innerHTML = cards.map((_, j) => `<span class="seg${j < i ? ' done' : j === i ? ' cur' : ''}"><i></i></span>`).join('');
      c.prepend(bars);
    });

    const mk = (cls, label, txt) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'story-nav ' + cls; b.setAttribute('aria-label', label); b.textContent = txt;
      panel.appendChild(b); return b;
    };
    const prevBtn = mk('story-prev', 'Previous item', '‹'), nextBtn = mk('story-next', 'Next item', '›');

    const place = () => cards.forEach((c, i) => {
      const d = (i - cur + n) % n;
      const pos = d === 0 ? 0 : d === 1 ? 1 : d === n - 1 ? -1 : 2;
      const old = c.dataset.pos;
      if (old !== undefined && Math.abs(+old - pos) === 2) {
        c.style.transition = 'none';
        c.dataset.pos = pos;
        void c.offsetWidth;
        c.style.transition = '';
      } else c.dataset.pos = pos;
      c.setAttribute('aria-hidden', pos === 0 ? 'false' : 'true');
    });
    const go = i => { cur = (i + n) % n; place(); };
    place();

    prevBtn.addEventListener('click', () => go(cur - 1));
    nextBtn.addEventListener('click', () => go(cur + 1));
    cards.forEach((c, i) => c.addEventListener('click', e => {
      if (swiped) return;
      if (i !== cur) return go(i);
      const r = c.getBoundingClientRect();
      go((e.clientX - r.left) < r.width * .35 ? cur - 1 : cur + 1);
    }));

    if (!reduce) panel.addEventListener('animationend', e => { if (e.animationName === 'storyfill') go(cur + 1); });

    // Touch & swipe handling for mobile (Android & iOS) + desktop mouse drag
    let startX = 0, startY = 0, lastX = 0, lastY = 0, startTime = 0;
    let swiped = false;

    const startSwipe = (x, y) => {
      startX = lastX = x;
      startY = lastY = y;
      startTime = Date.now();
    };
    const moveSwipe = (x, y) => {
      lastX = x;
      lastY = y;
    };
    const endSwipe = () => {
      if (startX === 0) return;
      const dx = lastX - startX;
      const dy = lastY - startY;
      const dt = Date.now() - startTime;
      startX = 0;

      const isHorizontal = Math.abs(dx) > Math.abs(dy) * 1.15;
      const isDistance = Math.abs(dx) > 35;
      const isFlick = dt < 300 && Math.abs(dx) > 20;

      if (isHorizontal && (isDistance || isFlick)) {
        swiped = true;
        setTimeout(() => { swiped = false; }, 350);
        go(cur + (dx < 0 ? 1 : -1));
      }
    };

    panel.addEventListener('touchstart', e => {
      if (e.touches.length === 1) startSwipe(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });

    panel.addEventListener('touchmove', e => {
      if (e.touches.length === 1) moveSwipe(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });

    panel.addEventListener('touchend', e => {
      if (e.changedTouches.length > 0) {
        lastX = e.changedTouches[0].clientX;
        lastY = e.changedTouches[0].clientY;
      }
      endSwipe();
    }, { passive: true });

    panel.addEventListener('touchcancel', () => { startX = 0; }, { passive: true });

    panel.addEventListener('pointerdown', e => {
      if (e.pointerType === 'mouse') startSwipe(e.clientX, e.clientY);
    });
    panel.addEventListener('pointermove', e => {
      if (e.pointerType === 'mouse' && startX !== 0) moveSwipe(e.clientX, e.clientY);
    });
    panel.addEventListener('pointerup', e => {
      if (e.pointerType === 'mouse') endSwipe();
    });
    panel.addEventListener('pointercancel', () => { startX = 0; });

    new IntersectionObserver(es => es.forEach(e => panel.classList.toggle('is-off', !e.isIntersecting)), { threshold: .35 }).observe(panel);
  });

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

  // Enquiry form -> WhatsApp routing
  const enquiryForm = $('#enquiry');
  if (enquiryForm) {
    enquiryForm.addEventListener('submit', e => {
      e.preventDefault();
      const n = $('#f-name'), p = $('#f-phone'), t = $('#f-type'), m = $('#form-msg');
      const name = n.value.trim();
      const phone = p.value.trim();
      const eventType = t ? t.value : 'Event';

      const okN = name.length > 1;
      const okP = /^[+\d][\d\s-]{6,}$/.test(phone);

      n.classList.toggle('invalid', !okN);
      p.classList.toggle('invalid', !okP);

      if (!okN || !okP) {
        m.style.color = 'var(--red)';
        m.textContent = 'Please enter your name and a valid phone number.';
        return;
      }

      m.style.color = 'var(--glow)';
      m.textContent = 'Opening WhatsApp with your enquiry details…';

      const text = `Hi 404 Coffee! I would like to enquire about hosting an event at 404:\n\n• Name: ${name}\n• Contact: ${phone}\n• Event: ${eventType}\n\nLooking forward to hearing from you!`;
      const waUrl = `https://wa.me/60127772451?text=${encodeURIComponent(text)}`;

      setTimeout(() => {
        window.open(waUrl, '_blank', 'noopener,noreferrer');
        m.textContent = 'Enquiry opened in WhatsApp! You can also call or DM us below.';
      }, 350);
    });

    ['#f-name', '#f-phone'].forEach(sel => {
      const el = $(sel);
      if (el) el.addEventListener('input', () => el.classList.remove('invalid'));
    });
  }

  if (reduce) return;

  // Cursor glow
  const glow = $('#cursor-glow');
  addEventListener('mousemove', e => { glow.style.left = e.clientX + 'px'; glow.style.top = e.clientY + 'px'; }, { passive: true });
})();
