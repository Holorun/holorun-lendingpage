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
  const savedScroll = window.scrollY;
  navTabBtns.forEach(b => b.classList.toggle('active', b.dataset.tab === activeTab));
  tabBtns.forEach(b => b.classList.toggle('active', b.dataset.tab === activeTab));
  tabPanels.forEach(p => p.classList.remove('active'));
  document.getElementById('tab-' + activeTab).classList.add('active');
  requestAnimationFrame(() => window.scrollTo(0, savedScroll));
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

// ===== CUSTOM VIDEO PLAY/PAUSE OVERLAY =====
document.querySelectorAll('.tech-video-wrap').forEach(wrap => {
  const video = wrap.querySelector('video');
  const btn = wrap.querySelector('.tech-play-btn');
  const fsBtn = wrap.querySelector('.tech-fullscreen-btn');
  if (!video || !btn) return;

  btn.addEventListener('click', () => {
    video.dataset.userControlled = 'true';
    if (video.paused) video.play();
    else video.pause();
  });

  video.addEventListener('play', () => wrap.classList.add('playing'));
  video.addEventListener('pause', () => wrap.classList.remove('playing'));

  // Fullscreen functionality
  if (fsBtn) {
    fsBtn.addEventListener('click', () => {
      const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
      if (!isFs) {
        video.dataset.userControlled = 'true';
        if (video.paused) video.play();
        // On touch/mobile devices let the browser handle fullscreen natively via the video element
        if ('ontouchstart' in window && video.webkitEnterFullscreen) {
          video.webkitEnterFullscreen();
        } else if (wrap.requestFullscreen) {
          wrap.requestFullscreen().then(() => {
            wrap.classList.add('fullscreen');
          }).catch(() => {
            if (video.webkitEnterFullscreen) video.webkitEnterFullscreen();
          });
        } else if (wrap.webkitRequestFullscreen) {
          wrap.webkitRequestFullscreen();
          wrap.classList.add('fullscreen');
        }
      } else {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        wrap.classList.remove('fullscreen');
      }
    });

    // Listen for fullscreen change events to update the button state
    document.addEventListener('fullscreenchange', () => {
      if (!document.fullscreenElement) {
        document.querySelectorAll('.tech-video-wrap').forEach(w => {
          w.classList.remove('fullscreen');
        });
      }
    });

    document.addEventListener('webkitfullscreenchange', () => {
      if (!document.webkitFullscreenElement) {
        document.querySelectorAll('.tech-video-wrap').forEach(w => {
          w.classList.remove('fullscreen');
        });
      }
    });
  }

  // ===== TIMELINE / SEEK BAR =====
  const bar = document.createElement('div');
  bar.className = 'tech-progress-bar';
  bar.setAttribute('role', 'slider');
  bar.setAttribute('aria-label', 'Seek video');
  bar.setAttribute('aria-valuemin', '0');
  bar.setAttribute('aria-valuemax', '100');
  bar.setAttribute('tabindex', '0');
  bar.innerHTML = '<div class="tech-progress-fill"><div class="tech-progress-thumb"></div></div>';
  wrap.appendChild(bar);

  const fill = bar.querySelector('.tech-progress-fill');

  const updateProgress = () => {
    if (!video.duration) return;
    const pct = (video.currentTime / video.duration) * 100;
    fill.style.width = pct + '%';
    bar.setAttribute('aria-valuenow', String(Math.round(pct)));
  };

  video.addEventListener('timeupdate', updateProgress);
  video.addEventListener('loadedmetadata', updateProgress);

  const seekFromEvent = e => {
    if (!video.duration) return;
    const rect = bar.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const pct = Math.min(1, Math.max(0, x / rect.width));
    video.currentTime = pct * video.duration;
    fill.style.width = (pct * 100) + '%';
  };

  let dragging = false;
  bar.addEventListener('pointerdown', e => {
    dragging = true;
    video.dataset.userControlled = 'true';
    bar.setPointerCapture(e.pointerId);
    seekFromEvent(e);
  });
  bar.addEventListener('pointermove', e => {
    if (dragging) seekFromEvent(e);
  });
  bar.addEventListener('pointerup', () => { dragging = false; });
  bar.addEventListener('pointercancel', () => { dragging = false; });

  bar.addEventListener('keydown', e => {
    if (!video.duration) return;
    if (e.key === 'ArrowRight') {
      video.currentTime = Math.min(video.duration, video.currentTime + 5);
    } else if (e.key === 'ArrowLeft') {
      video.currentTime = Math.max(0, video.currentTime - 5);
    } else {
      return;
    }
    e.preventDefault();
  });
});

// ===== CAPTION NEXT BUTTONS =====
document.querySelectorAll('.cap-next-btn').forEach(btn => {
  const slide = btn.closest('.tech-slide');
  const outer = slide && slide.closest('.tech-carousel-outer');
  const nextArrow = outer && outer.querySelector('.tech-side-arrow.right');
  if (nextArrow) {
    btn.addEventListener('click', () => {
      nextArrow.click();
      // wait for slide transition (0.5s) then scroll so the full section is in view
      setTimeout(() => {
        const section = outer.closest('.accordion-item') || outer;
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 520);
    });
  }
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
