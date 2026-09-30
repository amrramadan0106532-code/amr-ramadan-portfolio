(() => {
  'use strict';

  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));
  const root = document.documentElement;
  const reduced = root.classList.contains('reduced');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGsap = typeof window.gsap !== 'undefined';

  /* ───────── Small helpers that work without GSAP ───────── */

  // Cairo local time
  const clock = $('[data-clock]');
  const tick = () => {
    if (!clock) return;
    clock.textContent = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Cairo' }).format(new Date());
  };
  tick(); setInterval(tick, 30000);

  const year = $('[data-year]');
  if (year) year.textContent = new Date().getFullYear();

  // NeQabty case study: the pillar in the middle of the viewport drives the phone screen
  const pillars = $$('[data-pillar]');
  const caseScreens = $$('[data-case-screens] .cs');
  const caseDots = $$('.case__dots i');
  const setPillar = (n) => {
    pillars.forEach((p) => p.classList.toggle('is-active', +p.dataset.pillar === n));
    caseScreens.forEach((sc) => sc.classList.toggle('is-active', +sc.dataset.screen === n));
    caseDots.forEach((d, k) => d.classList.toggle('on', k === n));
  };
  if (pillars.length && 'IntersectionObserver' in window) {
    const po = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) setPillar(+en.target.dataset.pillar); });
    }, { rootMargin: '-45% 0px -45% 0px' });
    pillars.forEach((p) => po.observe(p));
    setPillar(0);
  }

  // Experience accordion
  $$('.job__head').forEach((head) => {
    head.addEventListener('click', () => {
      const job = head.closest('.job');
      const open = !job.classList.contains('is-open');
      job.classList.toggle('is-open', open);
      head.setAttribute('aria-expanded', String(open));
      if (window.ScrollTrigger) setTimeout(() => ScrollTrigger.refresh(), 650);
    });
  });

  // Copy email
  const toast = $('[data-toast]');
  let toastTimer;
  const showToast = (msg) => {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-on'), 2200);
  };
  $$('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const text = btn.getAttribute('data-copy');
      try {
        await navigator.clipboard.writeText(text);
        showToast('Email copied — talk soon!');
      } catch {
        window.location.href = 'mailto:' + text;
      }
    });
  });

  // Mobile menu
  const burger = $('[data-burger]');
  const menu = $('[data-menu]');
  const setMenu = (open) => {
    document.body.classList.toggle('menu-open', open);
    burger?.setAttribute('aria-expanded', String(open));
    burger?.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu?.setAttribute('aria-hidden', String(!open));
    if (window.__lenis) open ? window.__lenis.stop() : window.__lenis.start();
  };
  burger?.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  // Anchor links (smooth, Lenis-aware)
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      const target = id === '#top' ? document.body : $(id);
      if (!target) return;
      e.preventDefault();
      setMenu(false);
      if (window.__lenis) window.__lenis.scrollTo(target, { offset: id === '#top' ? 0 : -20, duration: 1.4 });
      else target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    });
  });

  // Nav: background after scroll, hide on scroll down, active link
  const nav = $('[data-nav]');
  let lastY = window.scrollY;
  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle('is-scrolled', y > 30);
    const menuOpen = document.body.classList.contains('menu-open');
    nav.classList.toggle('is-hidden', !menuOpen && y > lastY && y > 400);
    lastY = y;
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const navLinks = $$('.nav__links a');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        navLinks.forEach((l) => l.classList.toggle('is-active', l.getAttribute('href') === '#' + en.target.id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['about', 'work', 'experience', 'toolkit', 'contact'].forEach((id) => { const el = document.getElementById(id); if (el) io.observe(el); });
  }

  if (!hasGsap || reduced) return;

  /* ───────── Motion ───────── */
  gsap.registerPlugin(ScrollTrigger, SplitText);

  // Smooth scroll
  let lenis = null;
  if (typeof window.Lenis !== 'undefined') {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    window.__lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }

  // Scroll progress
  gsap.to('.progress span', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });

  // Cursor
  if (finePointer) {
    const cursor = $('.cursor');
    const dot = $('.cursor-dot');
    const label = $('.cursor__label');
    const cx = gsap.quickTo(cursor, 'x', { duration: 0.5, ease: 'power3' });
    const cy = gsap.quickTo(cursor, 'y', { duration: 0.5, ease: 'power3' });
    const dx = gsap.quickTo(dot, 'x', { duration: 0.08 });
    const dy = gsap.quickTo(dot, 'y', { duration: 0.08 });
    let shown = false;
    window.addEventListener('pointermove', (e) => {
      if (!shown) { shown = true; gsap.set([cursor, dot], { x: e.clientX, y: e.clientY }); gsap.to([cursor, dot], { opacity: 1, duration: 0.3 }); }
      cx(e.clientX); cy(e.clientY); dx(e.clientX); dy(e.clientY);
    });
    document.addEventListener('pointerover', (e) => {
      const view = e.target.closest('[data-cursor]');
      const link = e.target.closest('a, button');
      if (view && !link) {
        label.textContent = view.getAttribute('data-cursor');
        cursor.classList.add('is-view'); cursor.classList.remove('is-hover');
      } else if (link) {
        cursor.classList.add('is-hover'); cursor.classList.remove('is-view');
      } else {
        cursor.classList.remove('is-hover', 'is-view');
      }
    });
    document.addEventListener('pointerleave', () => gsap.to([cursor, dot], { opacity: 0, duration: 0.2 }));
    document.addEventListener('pointerenter', () => { if (shown) gsap.to([cursor, dot], { opacity: 1, duration: 0.2 }); });

    // Portrait follows the pointer a little
    const pimg = $('.portrait__frame');
    if (pimg) {
      const px = gsap.quickTo(pimg, 'x', { duration: 1.2, ease: 'power3' });
      const py = gsap.quickTo(pimg, 'y', { duration: 1.2, ease: 'power3' });
      window.addEventListener('pointermove', (e) => {
        px((e.clientX / window.innerWidth - 0.5) * -14);
        py((e.clientY / window.innerHeight - 0.5) * -10);
      });
    }

    // Magnetic buttons
    $$('[data-magnetic]').forEach((el) => {
      const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
      const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * 0.3);
        yTo((e.clientY - (r.top + r.height / 2)) * 0.4);
      });
      el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
    });
  }

  // Marquee that reacts to scroll velocity
  const track = $('[data-marquee]');
  if (track) {
    const loop = gsap.to(track, { xPercent: -50, ease: 'none', duration: 38, repeat: -1 });
    let dir = 1;
    ScrollTrigger.create({
      onUpdate(self) {
        if (self.direction !== dir) dir = self.direction;
        const v = Math.min(Math.abs(self.getVelocity()) / 350, 5);
        gsap.to(loop, { timeScale: dir * (1 + v), duration: 0.2, overwrite: true });
        gsap.to(loop, { timeScale: dir, duration: 1.2, delay: 0.2, ease: 'power2.out' });
      },
    });
  }

  const start = () => {
    /* Hero intro */
    const heroTitle = $('[data-hero-title]');
    const heroSplit = SplitText.create(heroTitle, { type: 'lines,words', mask: 'lines', linesClass: 'split-line' });
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.from(heroSplit.words, { yPercent: 110, duration: 1.3, stagger: 0.045 })
      .from('[data-hero-fade]', { y: 24, autoAlpha: 0, duration: 1.1, stagger: 0.1 }, 0.35)
      .from('.portrait__frame', { clipPath: 'inset(100% 0% 0% 0% round 280px 280px 28px 28px)', duration: 1.6, ease: 'expo.inOut' }, 0)
      .from('.portrait img', { scale: 1.35, duration: 2, ease: 'expo.out' }, 0.3)
      .from('.portrait__ring', { scale: 0.92, autoAlpha: 0, duration: 1.4 }, 0.7)
      .from('.portrait__side', { autoAlpha: 0, duration: 1 }, 1)
      .from('.nav', { yPercent: -100, autoAlpha: 0, duration: 1, clearProps: 'transform,opacity,visibility' }, 0.3);

    // Hero parallax out
    gsap.to('.hero__content', { yPercent: -18, autoAlpha: 0.2, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.portrait img', { yPercent: 10, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

    /* Section headings: masked line reveal */
    $$('[data-split]').forEach((el) => {
      SplitText.create(el, {
        type: 'lines', mask: 'lines', linesClass: 'split-line', autoSplit: true,
        onSplit: (self) => gsap.from(self.lines, {
          yPercent: 110, duration: 1.2, stagger: 0.1, ease: 'expo.out',
          scrollTrigger: { trigger: el, start: 'top 85%', once: true },
        }),
      });
    });

    /* Section labels */
    $$('.section__head').forEach((el) => {
      gsap.from(el.children, { y: 16, autoAlpha: 0, duration: 0.9, stagger: 0.08, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
    });

    /* About paragraph: words light up as you scroll */
    const big = $('[data-words]');
    if (big) {
      const split = SplitText.create(big, { type: 'words', wordsClass: 'w' });
      gsap.to(split.words, {
        opacity: 1, stagger: 0.1, ease: 'none',
        scrollTrigger: { trigger: big, start: 'top 80%', end: 'bottom 45%', scrub: 0.6 },
      });
    }

    /* Generic reveal */
    $$('[data-reveal]').forEach((el, i) => {
      gsap.from(el, { y: 50, autoAlpha: 0, duration: 1.1, ease: 'expo.out', delay: (i % 4) * 0.06, scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
    });

    /* Counters */
    $$('[data-counter]').forEach((el) => {
      const end = +el.getAttribute('data-counter');
      const o = { v: 0 };
      el.textContent = '0';
      gsap.to(o, {
        v: end, duration: 2, ease: 'power3.out',
        onUpdate: () => { el.textContent = Math.round(o.v); },
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      });
    });

    /* Work: pinned horizontal scroll on desktop, stacked reveal on mobile */
    const mm = gsap.matchMedia();
    mm.add('(min-width: 901px)', () => {
      const pin = $('[data-work-pin]');
      const workTrack = $('[data-work-track]');
      const distance = () => Math.max(0, workTrack.offsetLeft + workTrack.scrollWidth - pin.clientWidth + parseFloat(getComputedStyle(pin).paddingRight));
      const tween = gsap.to(workTrack, {
        x: () => -distance(), ease: 'none',
        scrollTrigger: { trigger: pin, start: 'top top', end: () => '+=' + distance(), pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1 },
      });
      $$('.project', workTrack).forEach((card) => {
        gsap.from(card.querySelector('.mock'), {
          yPercent: 40, rotate: 6, ease: 'none',
          scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left right', end: 'center center', scrub: true },
        });
      });
      gsap.from('.project', { x: 160, autoAlpha: 0, duration: 1.3, stagger: 0.08, ease: 'expo.out', scrollTrigger: { trigger: pin, start: 'top 70%', once: true } });
    });
    mm.add('(max-width: 900px)', () => {
      $$('.project').forEach((card) => {
        gsap.from(card, { y: 70, autoAlpha: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: card, start: 'top 90%', once: true } });
      });
    });

    /* NeQabty pillars */
    $$('.pillar').forEach((el) => {
      gsap.from(el.children, { y: 40, autoAlpha: 0, duration: 1.1, stagger: 0.08, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 80%', once: true } });
    });
    gsap.from('.phone--case', { y: 80, autoAlpha: 0, rotate: -4, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.case__layout', start: 'top 75%', once: true } });

    /* Experience rows */
    $$('.job').forEach((job, i) => {
      gsap.from(job, { y: 40, autoAlpha: 0, duration: 1, ease: 'expo.out', delay: i * 0.04, scrollTrigger: { trigger: job, start: 'top 92%', once: true } });
    });

    /* Contact */
    gsap.from('.contact__actions > *', { y: 30, autoAlpha: 0, duration: 1, stagger: 0.1, ease: 'expo.out', scrollTrigger: { trigger: '.contact__actions', start: 'top 92%', once: true } });
    gsap.from('.socials li', { y: 24, autoAlpha: 0, duration: 0.9, stagger: 0.07, ease: 'expo.out', scrollTrigger: { trigger: '.socials', start: 'top 95%', once: true } });
    gsap.fromTo('.contact__glow', { scale: 0.6, autoAlpha: 0.3 }, { scale: 1.1, autoAlpha: 1, ease: 'none', scrollTrigger: { trigger: '.contact', start: 'top bottom', end: 'bottom bottom', scrub: true } });

    ScrollTrigger.refresh();
  };

  /* ───────── Preloader → start ───────── */
  const runLoader = () => {
    const loader = $('.loader');
    const count = $('[data-count]');
    const seen = (() => { try { return sessionStorage.getItem('ar-loaded') === '1'; } catch { return false; } })();
    const o = { v: 0 };
    const tl = gsap.timeline({
      onComplete: () => {
        loader.remove();
        try { sessionStorage.setItem('ar-loaded', '1'); } catch { /* storage unavailable */ }
      },
    });
    tl.from('.loader__name', { yPercent: 100, autoAlpha: 0, duration: 0.8, ease: 'expo.out' })
      .to(o, { v: 100, duration: seen ? 0.5 : 1.5, ease: 'power2.inOut', onUpdate: () => { count.textContent = Math.round(o.v); } }, 0)
      .to('.loader__bar span', { scaleX: 1, duration: seen ? 0.5 : 1.5, ease: 'power2.inOut' }, 0)
      .to(loader, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1, ease: 'expo.inOut' }, '+=0.15')
      .add(() => { lenis?.start(); start(); }, '-=0.55');
  };

  const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
  Promise.race([fontsReady, new Promise((r) => setTimeout(r, 1500))]).then(() => {
    window.scrollTo(0, 0);
    runLoader();
  });
})();
