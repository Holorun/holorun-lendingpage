// ===== LOGO BANNER SHRINK =====
const logoBanner = document.querySelector('.logo-banner');

if (logoBanner) {
  const minHeight = 80;
  let fullHeight;

  function measureBanner() {
    logoBanner.style.height = '';
    fullHeight = logoBanner.offsetHeight;
    logoBanner.style.height = Math.max(minHeight, fullHeight - window.scrollY) + 'px';
  }

  window.addEventListener('load', measureBanner);
  window.addEventListener('resize', measureBanner);

  window.addEventListener('scroll', () => {
    if (!fullHeight) return;
    const newHeight = Math.max(minHeight, fullHeight - window.scrollY * 0.4);
    logoBanner.style.height = newHeight + 'px';
  });
}



// ===== TABS =====
const tabBtns = document.querySelectorAll('.tab-btn');
const tabPanels = document.querySelectorAll('.tab-panel');

tabPanels.forEach(p => p.classList.remove('active'));
document.getElementById('tab-hardware').classList.add('active');

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    syncNavTabs(btn.dataset.tab);
    if (btn.dataset.tab === 'hardware') {
      requestAnimationFrame(openHardwareAccordions);
    }
  });
});

// ===== ACCORDION =====
const manuallyClosed = new Set();

document.querySelectorAll('.accordion-header').forEach(header => {
  header.addEventListener('click', () => {
    const body = document.getElementById(header.dataset.target);
    const isOpen = body.classList.contains('open');
    body.classList.toggle('open');
    header.classList.toggle('open');
    if (isOpen) {
      manuallyClosed.add(header.dataset.target);
    } else {
      manuallyClosed.delete(header.dataset.target);
    }
  });
});

function openHardwareAccordions() {
  document.querySelectorAll('#tab-hardware .accordion-header').forEach(header => {
    const body = document.getElementById(header.dataset.target);
    if (!manuallyClosed.has(header.dataset.target)) {
      body.classList.add('open');
      header.classList.add('open');
    }
  });
}

openHardwareAccordions();

// ===== NAV ICON: chroma key canvas, clipped to circle =====
(function () {
  const video  = document.getElementById('navIconSource');
  const canvas = document.getElementById('navIconCanvas');
  const ctx    = canvas.getContext('2d');

  // Source crop in the 2560×1600 video
  const SRC_X = 1055, SRC_Y = 582, SRC_W = 420, SRC_H = 420;
  const BG = [19, 39, 39], T = 28;

  // Process at display size (72×72) — 25× fewer pixels than 360×360
  const PW = canvas.width, PH = canvas.height;
  const off    = document.createElement('canvas');
  off.width = PW; off.height = PH;
  const offCtx = off.getContext('2d', { willReadFrequently: true });

  let rafId = null;
  let lastTs = 0;
  const FRAME_MS = 1000 / 30; // 30 fps cap

  function drawFrame(now) {
    if (video.paused || video.ended) { rafId = null; return; } // stop loop while paused
    if (video.readyState < 2)        { rafId = requestAnimationFrame(drawFrame); return; }
    if (now - lastTs < FRAME_MS)     { rafId = requestAnimationFrame(drawFrame); return; }
    lastTs = now;

    // Draw source region directly at display size (browser scales it cheaply in GPU)
    offCtx.drawImage(video, SRC_X, SRC_Y, SRC_W, SRC_H, 0, 0, PW, PH);
    const img = offCtx.getImageData(0, 0, PW, PH);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const dr = d[i]-BG[0], dg = d[i+1]-BG[1], db = d[i+2]-BG[2];
      if (dr*dr + dg*dg + db*db < T*T) d[i+3] = 0;
    }
    offCtx.putImageData(img, 0, 0);
    ctx.clearRect(0, 0, PW, PH);
    ctx.drawImage(off, 0, 0);

    rafId = requestAnimationFrame(drawFrame);
  }

  function startLoop() {
    if (!rafId) rafId = requestAnimationFrame(drawFrame);
  }

  video.addEventListener('loadeddata', startLoop);
  video.addEventListener('play',       startLoop); // restart after 60s pause
  if (video.readyState >= 2) startLoop();

  // Pause on full circle for 60s then replay
  video.addEventListener('ended', () => {
    video.pause();
    setTimeout(() => {
      video.currentTime = 0;
      video.play(); // triggers 'play' event → startLoop()
    }, 60000);
  });

  // Stop burning CPU when browser tab is hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    } else {
      startLoop();
    }
  });
})();


// ===== DRAWER =====
const navToggle = document.getElementById('navToggle');
const drawer = document.getElementById('drawer');
const drawerOverlay = document.getElementById('drawerOverlay');
const drawerClose = document.getElementById('drawerClose');
const drawerContactLink = document.getElementById('drawerContactLink');

function openDrawer() {
  drawer.classList.add('open');
  drawerOverlay.classList.add('open');
}

function closeDrawer() {
  drawer.classList.remove('open');
  drawerOverlay.classList.remove('open');
}

navToggle.addEventListener('click', openDrawer);
drawerClose.addEventListener('click', closeDrawer);
drawerOverlay.addEventListener('click', closeDrawer);

drawerContactLink.addEventListener('click', (e) => {
  e.preventDefault();
  closeDrawer();
  syncNavTabs('opportunity');
  setTimeout(() => {
    const target = document.getElementById('the-future');
    const top = target.getBoundingClientRect().top + window.scrollY - stickyNav.offsetHeight - 16;
    window.scrollTo({ top, behavior: 'smooth' });
  }, 50);
});

// ===== STICKY NAV =====
const stickyNav = document.querySelector('.sticky-nav');

function setNavHeight() {
  document.documentElement.style.setProperty('--nav-height', stickyNav.offsetHeight + 'px');
}
setNavHeight();
window.addEventListener('resize', setNavHeight);

window.addEventListener('scroll', () => {
  if (window.scrollY > 60) {
    stickyNav.classList.add('scrolled');
    setNavHeight();
  } else {
    stickyNav.classList.remove('scrolled');
    setNavHeight();
  }
}, { passive: true });

// ===== NAV TAB BAR (appears in header on scroll) =====
const tabBar = document.querySelector('.tab-bar');
const navTabBar = document.getElementById('navTabBar');
const navTabBtns = document.querySelectorAll('.nav-tab-btn');

function syncNavTabs(activeTab) {
  navTabBtns.forEach(b => b.classList.toggle('active', b.dataset.tab === activeTab));
  tabBtns.forEach(b => b.classList.toggle('active', b.dataset.tab === activeTab));
  tabPanels.forEach(p => {
    p.classList.remove('active');
    // Pause all videos in inactive panels to free up CPU/memory
    p.querySelectorAll('video').forEach(v => { if (!v.paused) v.pause(); });
  });
  const activePanel = document.getElementById('tab-' + activeTab);
  activePanel.classList.add('active');
  requestAnimationFrame(() => {
    // If scrolled past the tab bar, the new panel may be shorter than the old
    // one — clamp back to the top of the tab bar so it doesn't land mid/end.
    const top = tabBar.getBoundingClientRect().top + window.scrollY - stickyNav.offsetHeight;
    if (window.scrollY > top) {
      window.scrollTo(0, top);
    }
    // Sync the sticky nav's tab row to the tab bar's actual position — the
    // IntersectionObserver below is skipped during navSwitching, so without
    // this it can get stuck showing/hiding after a tab switch.
    stickyNav.classList.toggle('tabs-visible', tabBar.getBoundingClientRect().bottom <= 0);
  });
}

let navSwitching = false;

navTabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    navSwitching = true;
    syncNavTabs(btn.dataset.tab);
    if (btn.dataset.tab === 'hardware') {
      requestAnimationFrame(openHardwareAccordions);
    }
    setTimeout(() => { navSwitching = false; }, 400);
  });
});

new IntersectionObserver(([entry]) => {
  if (navSwitching) return;
  if (!entry.isIntersecting && entry.boundingClientRect.top < 0) {
    stickyNav.classList.add('tabs-visible');
  } else {
    stickyNav.classList.remove('tabs-visible');
  }
}, { threshold: 0 }).observe(tabBar);


// ===== TECH CAROUSEL: SCROLL SECTION INTO VIEW (accounts for sticky nav) =====
function scrollTechSectionIntoView(outer) {
  const target = outer.closest('.accordion-item') || outer.closest('.tab-panel') || outer;
  const top = target.getBoundingClientRect().top + window.scrollY - stickyNav.offsetHeight - 16;
  window.scrollTo({ top, behavior: 'smooth' });
}

// ===== TECH CAROUSEL ARROWS: SCROLL SECTION INTO VIEW =====
['techPrev', 'techNext'].forEach(id => {
  const btn = document.getElementById(id);
  if (!btn) return;
  btn.addEventListener('click', () => {
    const outer = btn.closest('.tech-carousel-outer');
    if (outer) setTimeout(() => scrollTechSectionIntoView(outer), 520);
  });
});

// ===== CAPTION NEXT BUTTONS =====
document.querySelectorAll('.cap-next-btn').forEach(btn => {
  if (btn.classList.contains('cap-goto-tech')) return;
  // Button may live inside a .tech-slide (Technology section) or in a
  // standalone captions container outside the carousel (TETRAH section).
  const slide = btn.closest('.tech-slide');
  const outer = slide
    ? slide.closest('.tech-carousel-outer')
    : btn.closest('.carousel-captions')
        ?.closest('.tech-carousel-outer, section, .accordion-item')
        ?.querySelector('.tech-carousel-outer');
  const nextArrow = outer && outer.querySelector('.tech-side-arrow.right');
  if (nextArrow) {
    btn.addEventListener('click', () => {
      nextArrow.click();
      setTimeout(() => scrollTechSectionIntoView(outer), 520);
    });
  }
});

// ===== CAPTION PREV BUTTONS =====
document.querySelectorAll('.cap-prev-btn').forEach(btn => {
  const slide = btn.closest('.tech-slide');
  const outer = slide && slide.closest('.tech-carousel-outer');
  const prevArrow = outer && outer.querySelector('.tech-side-arrow.left');
  if (prevArrow) {
    btn.addEventListener('click', () => {
      prevArrow.click();
      setTimeout(() => scrollTechSectionIntoView(outer), 520);
    });
  }
});

// ===== TETRAH LAST SLIDE: GO TO TECHNOLOGY TAB =====
document.querySelectorAll('.cap-goto-tech').forEach(btn => {
  btn.addEventListener('click', goToTechnology);
});

// ===== TETRAH CAR VIDEO: HOLD ON LAST FRAME BEFORE LOOPING =====
const tetrahCarVideo = document.getElementById('tetrahCarVideo');
if (tetrahCarVideo) {
  const HOLD_MS = 30000;
  let holdTimer = null;
  let holdRemaining = HOLD_MS;
  let holdStartedAt = 0;

  function finishHold() {
    holdTimer = null;
    delete tetrahCarVideo.dataset.holding;
    holdRemaining = HOLD_MS;
    tetrahCarVideo.currentTime = 0;
    tetrahCarVideo.play();
  }

  tetrahCarVideo.addEventListener('ended', () => {
    tetrahCarVideo.dataset.holding = 'true';
    holdRemaining = HOLD_MS;
    holdStartedAt = Date.now();
    holdTimer = setTimeout(finishHold, holdRemaining);
  });

  // Pauses the countdown while the slide isn't being viewed, resumes it (from where it left off) when it is again
  tetrahCarVideo.addEventListener('tech:pause-hold', () => {
    if (holdTimer) {
      clearTimeout(holdTimer);
      holdTimer = null;
      holdRemaining -= (Date.now() - holdStartedAt);
    }
  });

  tetrahCarVideo.addEventListener('tech:resume-hold', () => {
    if (tetrahCarVideo.dataset.holding && !holdTimer) {
      holdStartedAt = Date.now();
      holdTimer = setTimeout(finishHold, holdRemaining);
    }
  });
}

// ===== CAROUSEL FACTORY =====
function initCarousel(trackId, prevId, nextId, counterId, captionsId) {
  const track = document.getElementById(trackId);
  const prev = document.getElementById(prevId);
  const next = document.getElementById(nextId);
  const counter = document.getElementById(counterId);
  const captionsEl = captionsId ? document.getElementById(captionsId) : null;
  const captions = captionsEl ? Array.from(captionsEl.children) : [];
  if (!track || !prev || !next) return;
  const slides = track.querySelectorAll('.tech-slide');
  const total = slides.length;
  let current = 0;
  let startX = 0;
  let inView = false;

  function updatePlayback() {
    slides.forEach((slide, i) => {
      const video = slide.querySelector('video');
      if (!video || video.dataset.userControlled) return;
      const shouldPlay = inView && i === current;
      if (video.dataset.holding) {
        video.dispatchEvent(new Event(shouldPlay ? 'tech:resume-hold' : 'tech:pause-hold'));
        return;
      }
      if (shouldPlay) video.play();
      else video.pause();
    });
  }

  function go(index) {
    current = Math.max(0, Math.min(index, total - 1));
    const offset = Math.round(track.parentElement.getBoundingClientRect().width * current);
    track.style.transform = `translateX(${-offset}px)`;
    if (counter) counter.textContent = (current + 1) + ' / ' + total;
    prev.disabled = current === 0;
    next.disabled = current === total - 1;
    captions.forEach((cap, i) => { cap.hidden = i !== current; });
    updatePlayback();
  }

  prev.addEventListener('click', () => go(current - 1));
  next.addEventListener('click', () => go(current + 1));
  track.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', e => {
    const diff = startX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) go(diff > 0 ? current + 1 : current - 1);
  }, { passive: true });
  window.addEventListener('resize', () => go(current));

  const carouselOuter = track.closest('.tech-carousel-outer');
  if (carouselOuter) {
    new IntersectionObserver(entries => {
      entries.forEach(entry => {
        inView = entry.isIntersecting;
        updatePlayback();
      });
    }, { threshold: 0.4 }).observe(carouselOuter);
  }

  go(0);
}

initCarousel('tetrahTrack', 'tetrahPrev', 'tetrahNext', 'tetrahCounter', 'tetrahCaptions');

initCarousel('techTrack', 'techPrev', 'techNext', 'techCounter');

// ===== DEEP LINK ROUTING (/TETRAH, /tech, /pitch-deck) =====
function scrollToEl(el, extra = 16) {
  const top = el.getBoundingClientRect().top + window.scrollY - stickyNav.offsetHeight - extra;
  window.scrollTo(0, top);
}

function goToTechnology() {
  syncNavTabs('technology');
  requestAnimationFrame(() => {
    setTimeout(() => scrollToEl(tabBar, 0), 50);
  });
}

(function routeFromPath() {
  const path = window.location.pathname.replace(/\/+$/, '').toLowerCase();

  if (path === '/tetrah') {
    syncNavTabs('hardware');
    requestAnimationFrame(() => {
      openHardwareAccordions();
      setTimeout(() => scrollToEl(document.getElementById('tetrah-body').closest('.accordion-item')), 50);
    });
  } else if (path === '/tech') {
    goToTechnology();
  } else if (path === '/pitch-deck') {
    syncNavTabs('opportunity');
    requestAnimationFrame(() => {
      setTimeout(() => scrollToEl(document.getElementById('the-future')), 50);
    });
  }
})();

// ===== SECTION REVEAL ON SCROLL =====
const revealSections = document.querySelectorAll('.scroll-shrink');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
    }
  });
}, { threshold: 0.1 });

revealSections.forEach(s => revealObserver.observe(s));

// ===== PARTICLE CANVAS =====
const canvas = document.getElementById('bg');
const ctx = canvas.getContext('2d');

let W, H, particles;

const TEAL = 'rgba(0, 200, 180,';
const COUNT = 80;

function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
}

function randomBetween(a, b) {
  return a + Math.random() * (b - a);
}

function initParticles() {
  particles = Array.from({ length: COUNT }, () => ({
    x: randomBetween(0, W),
    y: randomBetween(0, H),
    r: randomBetween(0.4, 1.8),
    vx: randomBetween(-0.15, 0.15),
    vy: randomBetween(-0.25, -0.05),
    alpha: randomBetween(0.1, 0.55),
  }));
}

function drawParticles() {
  ctx.clearRect(0, 0, W, H);

  // Draw connecting lines between nearby particles
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 120) {
        const lineAlpha = (1 - dist / 120) * 0.08;
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.strokeStyle = `${TEAL} ${lineAlpha})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }
  }

  // Draw particles
  for (const p of particles) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = `${TEAL} ${p.alpha})`;
    ctx.fill();
  }
}

function updateParticles() {
  for (const p of particles) {
    p.x += p.vx;
    p.y += p.vy;
    // wrap around
    if (p.y < -5) p.y = H + 5;
    if (p.x < -5) p.x = W + 5;
    if (p.x > W + 5) p.x = -5;
  }
}

function loop() {
  updateParticles();
  drawParticles();
  requestAnimationFrame(loop);
}

window.addEventListener('resize', () => {
  resize();
  initParticles();
});

resize();
initParticles();
loop();
