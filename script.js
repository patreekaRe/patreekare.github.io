const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// Hero title: split into letters so they can rise in one at a time
const heroTitle = document.querySelector('.hero-content h1');
if (heroTitle) {
  try {
    if (!reduceMotion) {
      const text = heroTitle.textContent.trim();
      heroTitle.setAttribute('aria-label', text);
      heroTitle.textContent = '';
      let ci = 0;
      text.split(' ').forEach((word, wi, words) => {
        const w = document.createElement('span');
        w.className = 'word';
        w.setAttribute('aria-hidden', 'true');
        [...word].forEach((ch) => {
          const c = document.createElement('span');
          c.className = 'char';
          c.style.setProperty('--ci', ci++);
          c.textContent = ch;
          w.appendChild(c);
        });
        heroTitle.appendChild(w);
        if (wi < words.length - 1) heroTitle.appendChild(document.createTextNode(' '));
      });
    }
  } finally {
    heroTitle.classList.add('ready');
  }
}

document.getElementById('year').textContent = new Date().getFullYear();

const navbar = document.getElementById('navbar');
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

navToggle.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  navToggle.classList.toggle('open', isOpen);
  navToggle.setAttribute('aria-expanded', String(isOpen));
});

navLinks.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    navToggle.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 10);
}, { passive: true });

const sections = document.querySelectorAll('section[id]');
const navAnchors = document.querySelectorAll('#navLinks a');

const setActiveLink = () => {
  let current = sections[0]?.id;
  const offset = 90;

  sections.forEach((section) => {
    if (window.scrollY >= section.offsetTop - offset) {
      current = section.id;
    }
  });

  navAnchors.forEach((anchor) => {
    const href = anchor.getAttribute('href');
    // Only same-page hash links get scroll-driven highlighting; a link to another
    // page (e.g. Resume) keeps whatever active state is already in its markup.
    if (href.startsWith('#')) {
      anchor.classList.toggle('active', href === `#${current}`);
    }
  });
};

window.addEventListener('scroll', setActiveLink, { passive: true });
setActiveLink();

// ---------- Motion and interaction ----------

// Scroll progress bar + hero parallax, batched into one frame per scroll
const progressBar = document.querySelector('.scroll-progress');
const heroVisual = document.querySelector('.hero-visual');
const scrollCue = document.querySelector('.scroll-cue');
let scrollTicking = false;

// The tonearm in the corner: it rests beside the record, drops on after a moment, then tracks
// toward the label as you scroll down the page. Clicking it goes back to the top.
const ARM_REST = -24; // degrees: needle hovering beside the record
const ARM_SWEEP = 28; // degrees: outer groove to inner groove
const tonearmArm = document.getElementById('tonearmArm');
let armDropped = reduceMotion;
if (tonearmArm && !reduceMotion) {
  setTimeout(() => {
    armDropped = true;
    updateOnScroll();
    setTimeout(() => tonearmArm.classList.add('tracking'), 1100);
  }, 1400);
}
const toTop = document.getElementById('toTop');
if (toTop) {
  toTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  });
}

const updateOnScroll = () => {
  scrollTicking = false;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const progress = max > 0 ? Math.min(1, window.scrollY / max) : 0;
  if (progressBar) progressBar.style.transform = `scaleX(${progress})`;
  if (tonearmArm) tonearmArm.style.transform = `rotate(${armDropped ? progress * ARM_SWEEP : ARM_REST}deg)`;
  if (!reduceMotion && window.scrollY < window.innerHeight * 1.5) {
    if (heroVisual) heroVisual.style.translate = `0 ${window.scrollY * 0.1}px`;
    if (scrollCue) scrollCue.style.opacity = Math.max(0, 0.75 - window.scrollY / 260);
  }
};

window.addEventListener('scroll', () => {
  if (scrollTicking) return;
  scrollTicking = true;
  requestAnimationFrame(updateOnScroll);
}, { passive: true });
updateOnScroll();

// Reveal sections and cards as they scroll into view, staggered within each group
if (!reduceMotion && 'IntersectionObserver' in window) {
  const targets = document.querySelectorAll(
    '.section-head, .walkthrough-card, .showcase, .project-tile, .about-block, .contact-card, .resume-card'
  );
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      revealObserver.unobserve(el);
      el.classList.add('in');
      // Once it has faded in, drop the reveal classes so the card's own hover transitions return
      setTimeout(() => el.classList.remove('reveal', 'in'), 1600);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

  targets.forEach((el) => {
    const siblings = [...el.parentElement.children].filter((c) => c.matches('.project-tile, .about-block, .resume-card'));
    const index = siblings.indexOf(el);
    el.style.setProperty('--d', `${index < 0 ? 0 : (index % 4) * 0.09}s`);
    el.classList.add('reveal');
    revealObserver.observe(el);
  });
}

if (finePointer && !reduceMotion) {
  // Cards tilt toward the cursor and a warm glow follows it
  document.querySelectorAll('.project-tile').forEach((card) => {
    let frame = 0;
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        card.style.setProperty('--mx', `${px * 100}%`);
        card.style.setProperty('--my', `${py * 100}%`);
        card.style.transition = 'transform .12s ease-out, box-shadow .3s var(--ease), border-color .3s var(--ease)';
        card.style.transform = `perspective(900px) rotateX(${(0.5 - py) * 6}deg) rotateY(${(px - 0.5) * 8}deg) translateY(-6px)`;
      });
    });
    card.addEventListener('pointerleave', () => {
      cancelAnimationFrame(frame);
      card.style.transition = '';
      card.style.transform = '';
    });
  });

  // Buttons lean toward the cursor
  document.querySelectorAll('.btn').forEach((btn) => {
    btn.addEventListener('pointermove', (e) => {
      const r = btn.getBoundingClientRect();
      const x = (e.clientX - (r.left + r.width / 2)) * 0.25;
      const y = (e.clientY - (r.top + r.height / 2)) * 0.35;
      btn.style.translate = `${x}px ${y}px`;
    });
    btn.addEventListener('pointerleave', () => {
      btn.style.translate = '';
    });
  });

  // The lamp in the walkthrough card looks toward the cursor
  const walkCard = document.querySelector('.walkthrough-card');
  const walkLamp = document.querySelector('.walkthrough-lamp');
  if (walkCard && walkLamp) {
    walkCard.addEventListener('pointermove', (e) => {
      const r = walkLamp.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      walkLamp.style.translate = `${clamp(dx * 0.08, -22, 22)}px ${clamp(dy * 0.08, -22, 22)}px`;
    });
    walkCard.addEventListener('pointerleave', () => {
      walkLamp.style.translate = '';
    });
  }
}

// Featured projects: one at a time, cycling on its own until you touch it
(() => {
  const root = document.getElementById('showcase');
  if (!root) return;
  const viewport = document.getElementById('showcaseViewport');
  const slides = [...root.querySelectorAll('.slide')];
  const pips = document.getElementById('showcasePips');
  const pathEl = document.getElementById('showcasePath');
  const countEl = document.getElementById('showcaseCount');
  const CYCLE = 8000;
  let index = 0;
  let timer = 0;
  let hovering = false;
  let stopped = false; // once someone interacts, stop auto-cycling for good
  let onScreen = true;

  const pipButtons = slides.map((slide, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'showcase-pip';
    b.setAttribute('aria-label', `Show project ${i + 1}: ${slide.querySelector('h3').textContent}`);
    b.addEventListener('click', () => { stopped = true; show(i); });
    pips.appendChild(b);
    return b;
  });

  const pad = (n) => String(n).padStart(2, '0');

  function show(next, dir) {
    next = (next + slides.length) % slides.length;
    if (dir === undefined) dir = next >= index ? 1 : -1;
    slides.forEach((slide, i) => {
      const active = i === next;
      // Park the incoming slide on the side it enters from, without animating there
      if (active && i !== index) {
        slide.style.transition = 'none';
        slide.classList.toggle('from-left', dir < 0);
        void slide.offsetWidth;
        slide.style.transition = '';
      }
      slide.classList.toggle('is-active', active);
      slide.toggleAttribute('inert', !active);
      slide.setAttribute('aria-hidden', String(!active));
      if (!active && i === index) slide.classList.toggle('from-left', dir > 0);
    });
    index = next;
    pipButtons.forEach((b, i) => b.setAttribute('aria-current', String(i === next)));
    pathEl.textContent = slides[next].dataset.path;
    countEl.textContent = `${pad(next + 1)} / ${pad(slides.length)}`;
    restart();
  }

  // Restart the fill animation on the active pip and the timer
  function restart() {
    clearTimeout(timer);
    root.classList.remove('auto');
    void root.offsetWidth;
    if (stopped || reduceMotion) return;
    root.classList.add('auto');
    root.style.setProperty('--cycle', `${CYCLE}ms`);
    if (!hovering && onScreen) timer = setTimeout(() => show(index + 1, 1), CYCLE);
  }

  function pause(on) {
    root.classList.toggle('paused', on);
    if (on) clearTimeout(timer);
    else if (!stopped && !reduceMotion) restart();
  }

  root.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') { hovering = true; pause(true); } });
  root.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') { hovering = false; pause(false); } });
  root.addEventListener('focusin', () => pause(true));
  root.addEventListener('focusout', () => { if (!hovering) pause(false); });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      if (onScreen) { if (!hovering) pause(false); } else clearTimeout(timer);
    }, { threshold: 0.3 }).observe(root);
  }

  document.getElementById('showcasePrev').addEventListener('click', () => { stopped = true; show(index - 1, -1); });
  document.getElementById('showcaseNext').addEventListener('click', () => { stopped = true; show(index + 1, 1); });

  root.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { stopped = true; show(index - 1, -1); }
    if (e.key === 'ArrowRight') { stopped = true; show(index + 1, 1); }
  });

  // Swipe or drag sideways to change project. A drag never counts as a click on the link.
  let startX = 0;
  let startY = 0;
  let dragging = false;
  let moved = false;
  viewport.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    startX = e.clientX;
    startY = e.clientY;
    dragging = true;
    moved = false;
  });
  viewport.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    if (Math.abs(e.clientX - startX) > 10 && Math.abs(e.clientX - startX) > Math.abs(e.clientY - startY)) {
      moved = true;
      viewport.classList.add('dragging');
    }
  });
  const endDrag = (e) => {
    if (!dragging) return;
    dragging = false;
    viewport.classList.remove('dragging');
    const dx = e.clientX - startX;
    if (moved && Math.abs(dx) > 50) {
      stopped = true;
      show(index + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
    }
  };
  viewport.addEventListener('pointerup', endDrag);
  viewport.addEventListener('pointercancel', () => { dragging = false; viewport.classList.remove('dragging'); });
  viewport.addEventListener('click', (e) => {
    if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; }
  }, true);

  show(0, 1);
})();

// Coursework: two highlights up front, the rest tucked behind a "More projects" button
const moreToggle = document.getElementById('moreToggle');
const moreProjects = document.getElementById('moreProjects');
if (moreToggle && moreProjects) {
  const moreLabel = moreToggle.querySelector('.more-label');
  moreToggle.addEventListener('click', () => {
    const opening = !moreProjects.classList.contains('open');
    moreProjects.classList.toggle('open', opening);
    moreToggle.setAttribute('aria-expanded', String(opening));
    moreLabel.textContent = opening ? 'Show fewer' : 'More projects';
    // Closing a long list can leave you far down the page, so bring the section back into view
    if (!opening) {
      document.getElementById('coursework').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    }
  });
}
// ---------- Dark / light theme ----------
// The saved choice is applied in the page <head> before first paint; this is just the toggle.
const themeRoot = document.documentElement;
const themeToggle = document.getElementById('themeToggle');
if (themeToggle) {
  const syncThemeLabel = () => {
    const dark = themeRoot.getAttribute('data-theme') === 'dark';
    themeToggle.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
  };
  themeToggle.addEventListener('click', () => {
    const dark = themeRoot.getAttribute('data-theme') !== 'dark';
    if (dark) themeRoot.setAttribute('data-theme', 'dark');
    else themeRoot.removeAttribute('data-theme');
    try {
      localStorage.setItem('theme', dark ? 'dark' : 'light');
    } catch (e) {
      // storage blocked: the choice just won't be remembered
    }
    syncThemeLabel();
    window.dispatchEvent(new CustomEvent('themechange', { detail: { dark } }));
  });
  syncThemeLabel();
}

// ---------- Music: a shelf of records that flip to show their songs ----------
const MUSIC_RECORDS = [
  {
    cover: 'images/covers/record-1.jpg',
    songs: [
      { id: '084YxThHOrmrM5YC0tyZEY', title: 'Sofia' },
      { id: '2PDIfFHHKklyycN0paspsF', title: 'Someone' },
      { id: '0A8uNXnfohqdCVXCfKPrSA', title: 'Time Machine' },
      { id: '6PXw0fITgSiBnRWFszSpAS', title: 'Growing' },
    ],
  },
  { cover: 'images/covers/record-2.jpg', songs: [{ id: '1AffuacdDfxEh0ZQWFdAfm', title: '151' }] },
  { cover: 'images/covers/record-3.jpg', songs: [{ id: '1xBTI8q5lTUHf3hXRg2BAp', title: 'Wait' }] },
  {
    cover: 'images/covers/record-4.jpg',
    songs: [
      { id: '5s71EMi5MNKD82SIBhkBC0', title: 'Erased' },
      { id: '45hsEjHz0wsxX5t2mDXzhr', title: 'She Said' },
      { id: '3Z6qc0I5JDUol2PGF6WAek', title: 'Herz' },
      { id: '4o1HNJ4RTT0ZipPDGyQrTq', title: 'Falcon' },
    ],
  },
];

const musicShelf = document.getElementById('musicShelf');
if (musicShelf) {
  const embedEl = document.getElementById('musicEmbed');
  const nowEl = document.getElementById('musicNow');
  const cards = [];
  let controller = null;
  let fallbackFrame = null;
  let started = false;
  let playing = false;
  let selected = null; // { ri, si }

  const songLabel = (ri) => MUSIC_RECORDS[ri].songs.map((s) => s.title).join(', ');

  // Only the visible face of a card can be focused or read out
  const setFlipped = (ri, flipped) => {
    const card = cards[ri];
    card.el.classList.toggle('flipped', flipped);
    card.front.inert = flipped;
    card.back.inert = !flipped;
    card.front.setAttribute('aria-expanded', String(flipped));
  };

  const flipRecord = (ri) => {
    cards.forEach((_, i) => setFlipped(i, i === ri));
  };

  const setNow = () => {
    if (!selected) return;
    const song = MUSIC_RECORDS[selected.ri].songs[selected.si];
    nowEl.textContent = `${playing ? 'Now playing' : 'Selected'}: ${song.title}`;
  };

  const markPlaying = () => {
    cards.forEach((card, i) => card.el.classList.toggle('playing', playing && selected && selected.ri === i));
    setNow();
  };

  // Songs with a `file` play through a plain <audio> element started by the tap itself, which is the
  // only kind of playback every phone allows. Songs without one use Spotify's embedded player.
  const audio = new Audio();
  audio.preload = 'none';
  let localActive = false;
  let wantPlay = false; // Spotify was asked to play and hasn't started yet

  const bar = document.createElement('div');
  bar.className = 'music-bar';
  bar.hidden = true;
  const barPlay = document.createElement('button');
  barPlay.type = 'button';
  barPlay.className = 'music-bar-play';
  barPlay.setAttribute('aria-label', 'Play or pause');
  const barTitle = document.createElement('span');
  barTitle.className = 'music-bar-title';
  const barSeek = document.createElement('input');
  barSeek.type = 'range';
  barSeek.className = 'music-bar-seek';
  barSeek.min = '0';
  barSeek.max = '1000';
  barSeek.value = '0';
  barSeek.setAttribute('aria-label', 'Seek');
  const barSpotify = document.createElement('a');
  barSpotify.className = 'music-bar-spotify';
  barSpotify.target = '_blank';
  barSpotify.rel = 'noopener';
  barSpotify.textContent = 'Spotify ↗';
  bar.append(barPlay, barTitle, barSeek, barSpotify);
  embedEl.before(bar);

  barPlay.addEventListener('click', () => (audio.paused ? audio.play() : audio.pause()));
  barSeek.addEventListener('input', () => {
    if (audio.duration) audio.currentTime = (barSeek.value / 1000) * audio.duration;
  });
  audio.addEventListener('timeupdate', () => {
    if (audio.duration) barSeek.value = String(Math.round((audio.currentTime / audio.duration) * 1000));
  });
  ['play', 'pause', 'ended'].forEach((type) => audio.addEventListener(type, () => {
    if (!localActive) return;
    playing = !audio.paused && !audio.ended;
    bar.classList.toggle('is-playing', playing);
    barPlay.textContent = playing ? '❚❚' : '▶';
    markPlaying();
  }));

  const stopLocal = () => {
    if (!localActive) return;
    localActive = false;
    audio.pause();
    bar.hidden = true;
    embedEl.hidden = false;
  };

  const playLocal = (song) => {
    if (controller) controller.pause();
    wantPlay = false;
    localActive = true;
    embedEl.hidden = true;
    bar.hidden = false;
    barTitle.textContent = song.title;
    barSpotify.href = `https://open.spotify.com/track/${song.id}`;
    barSeek.value = '0';
    audio.src = song.file;
    // Called straight from the tap, so phones allow it
    audio.play().catch(() => {});
  };

  const load = (autoplay) => {
    if (!started || !selected) return;
    const song = MUSIC_RECORDS[selected.ri].songs[selected.si];
    if (controller) {
      wantPlay = !!autoplay;
      controller.loadUri(`spotify:track:${song.id}`);
      if (autoplay) {
        controller.play();
        // Some browsers drop a play() sent before the new track is ready, so send it again then
        setTimeout(() => { if (wantPlay && !localActive) controller.play(); }, 600);
      }
    } else if (fallbackFrame) {
      fallbackFrame.src = `https://open.spotify.com/embed/track/${song.id}?utm_source=generator&theme=0`;
    }
  };

  const chooseSong = (ri, si) => {
    selected = { ri, si };
    cards.forEach((card, i) => {
      card.el.classList.toggle('active', i === ri);
      card.buttons.forEach((btn, bi) => btn.setAttribute('aria-current', String(i === ri && bi === si)));
    });
    playing = false;
    markPlaying();
    const song = MUSIC_RECORDS[ri].songs[si];
    if (song.file) {
      playLocal(song);
    } else {
      stopLocal();
      load(true);
    }
  };

  MUSIC_RECORDS.forEach((record, ri) => {
    const el = document.createElement('div');
    el.className = 'record';
    el.setAttribute('role', 'listitem');

    const disc = document.createElement('div');
    disc.className = 'record-disc';
    disc.setAttribute('aria-hidden', 'true');

    const flip = document.createElement('div');
    flip.className = 'record-flip';

    const front = document.createElement('button');
    front.type = 'button';
    front.className = 'record-face record-front';
    front.setAttribute('aria-label', `Record ${ri + 1}: ${songLabel(ri)}. Flip to see the songs.`);
    front.setAttribute('aria-expanded', 'false');
    const img = document.createElement('img');
    img.src = record.cover;
    img.alt = '';
    img.loading = 'lazy';
    const hint = document.createElement('span');
    hint.className = 'record-hint';
    hint.textContent = 'Flip';
    front.append(img, hint);
    front.addEventListener('click', () => flipRecord(ri));

    const back = document.createElement('div');
    back.className = 'record-face record-back';
    back.inert = true;
    const title = document.createElement('p');
    title.className = 'record-back-title';
    title.textContent = record.songs.length > 1 ? `Record ${ri + 1} · ${record.songs.length} songs` : `Record ${ri + 1} · single`;
    const list = document.createElement('ol');
    list.className = 'record-songs';
    const buttons = record.songs.map((song, si) => {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = song.title;
      btn.addEventListener('click', () => chooseSong(ri, si));
      li.appendChild(btn);
      list.appendChild(li);
      return btn;
    });
    const backBtn = document.createElement('button');
    backBtn.type = 'button';
    backBtn.className = 'record-flip-back';
    backBtn.textContent = '← Back to the cover';
    backBtn.addEventListener('click', () => {
      setFlipped(ri, false);
      front.focus();
    });
    back.append(title, list, backBtn);

    flip.append(front, back);
    el.append(disc, flip);
    musicShelf.appendChild(el);
    cards.push({ el, front, back, buttons });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const open = cards.findIndex((card) => card.el.classList.contains('flipped'));
    if (open >= 0) {
      setFlipped(open, false);
      cards[open].front.focus();
    }
  });

  const startPlayer = () => {
    if (started) return;
    started = true;
    const first = MUSIC_RECORDS[0].songs[0];
    const mount = document.createElement('div');
    embedEl.appendChild(mount);
    window.onSpotifyIframeApiReady = (api) => {
      api.createController(mount, { width: '100%', height: 152, uri: `spotify:track:${first.id}` }, (ctl) => {
        controller = ctl;
        ctl.addListener('playback_update', (e) => {
          if (localActive) return;
          playing = !!e.data && !e.data.isPaused;
          if (playing) wantPlay = false;
          markPlaying();
        });
        ctl.addListener('ready', () => {
          if (wantPlay && !localActive) ctl.play();
        });
        // A song may have been picked while the player was still starting up
        if (selected && !localActive) load(true);
      });
    };
    const script = document.createElement('script');
    script.src = 'https://open.spotify.com/embed/iframe-api/v1';
    script.async = true;
    document.body.appendChild(script);
    // If Spotify's player script is blocked or slow, fall back to a plain embed
    setTimeout(() => {
      if (controller || embedEl.querySelector('iframe')) return;
      fallbackFrame = document.createElement('iframe');
      fallbackFrame.title = 'Spotify player';
      fallbackFrame.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
      const current = selected ? MUSIC_RECORDS[selected.ri].songs[selected.si] : first;
      fallbackFrame.src = `https://open.spotify.com/embed/track/${current.id}?utm_source=generator&theme=0`;
      embedEl.replaceChildren(fallbackFrame);
    }, 5000);
  };

  // Load Spotify's player only once the section is close to being on screen
  if ('IntersectionObserver' in window) {
    const musicObserver = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        musicObserver.disconnect();
        startPlayer();
      }
    }, { rootMargin: '300px 0px' });
    musicObserver.observe(musicShelf);
  } else {
    startPlayer();
  }
}
