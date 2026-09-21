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

const updateOnScroll = () => {
  scrollTicking = false;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  if (progressBar) progressBar.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
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
    '.section-head, .walkthrough-card, .featured-card, .project-tile, .about-block, .contact-card, .resume-card'
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
    const siblings = [...el.parentElement.children].filter((c) => c.matches('.featured-card, .project-tile, .about-block, .resume-card'));
    const index = siblings.indexOf(el);
    el.style.setProperty('--d', `${index < 0 ? 0 : (index % 4) * 0.09}s`);
    el.classList.add('reveal');
    revealObserver.observe(el);
  });
}

if (finePointer && !reduceMotion) {
  // Cards tilt toward the cursor and a warm glow follows it
  document.querySelectorAll('.featured-card:not(.featured-music), .project-tile').forEach((card) => {
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

// ---------- Music: a Spotify player inside the Featured card ----------
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

const musicPlayerEl = document.getElementById('musicPlayer');
if (musicPlayerEl) {
  const embedEl = document.getElementById('musicEmbed');
  const coversEl = document.getElementById('musicCovers');
  const songsEl = document.getElementById('musicSongs');
  const noteEl = document.getElementById('musicNote');
  let recordIdx = 0;
  let songIdx = 0;
  let controller = null;
  let fallbackFrame = null;
  let started = false;
  let playing = false;
  let playedOnce = false;
  let nudgeTimer = null;

  const currentSong = () => MUSIC_RECORDS[recordIdx].songs[songIdx];

  const renderCovers = () => {
    coversEl.replaceChildren();
    MUSIC_RECORDS.forEach((record, ri) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.setAttribute('aria-pressed', String(ri === recordIdx));
      btn.setAttribute('aria-label', `Record ${ri + 1}: ${record.songs.map((s) => s.title).join(', ')}`);
      const img = document.createElement('img');
      img.src = record.cover;
      img.alt = '';
      img.loading = 'lazy';
      btn.appendChild(img);
      btn.addEventListener('click', () => {
        recordIdx = ri;
        songIdx = 0;
        renderCovers();
        renderSongs();
        // Choosing a record only loads its first song; playing needs a deliberate tap on a song
        setTrack(false);
      });
      coversEl.appendChild(btn);
    });
  };

  const renderSongs = () => {
    songsEl.replaceChildren();
    MUSIC_RECORDS[recordIdx].songs.forEach((song, si) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = song.title;
      btn.setAttribute('aria-pressed', String(si === songIdx));
      btn.addEventListener('click', () => {
        songIdx = si;
        renderSongs();
        setTrack(true);
      });
      songsEl.appendChild(btn);
    });
  };

  const setTrack = (autoplay) => {
    if (!started) return;
    const song = currentSong();
    if (controller) {
      controller.loadUri(`spotify:track:${song.id}`);
      if (autoplay) controller.play();
    } else if (fallbackFrame) {
      fallbackFrame.src = `https://open.spotify.com/embed/track/${song.id}?utm_source=generator&theme=0`;
    }
    // Browsers only let the player start itself after you have pressed play in it once
    clearTimeout(nudgeTimer);
    if (autoplay && controller && !playedOnce) {
      nudgeTimer = setTimeout(() => {
        if (!playing) noteEl.hidden = false;
      }, 1500);
    }
  };

  const startPlayer = () => {
    if (started) return;
    started = true;
    const mount = document.createElement('div');
    embedEl.appendChild(mount);
    window.onSpotifyIframeApiReady = (api) => {
      api.createController(mount, { width: '100%', height: 152, uri: `spotify:track:${currentSong().id}` }, (ctl) => {
        controller = ctl;
        ctl.addListener('playback_update', (e) => {
          playing = !!e.data && !e.data.isPaused;
          if (playing) {
            playedOnce = true;
            noteEl.hidden = true;
          }
        });
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
      fallbackFrame.src = `https://open.spotify.com/embed/track/${currentSong().id}?utm_source=generator&theme=0`;
      embedEl.replaceChildren(fallbackFrame);
    }, 5000);
  };

  renderCovers();
  renderSongs();

  // Load Spotify's player only once the card is close to being on screen
  if ('IntersectionObserver' in window) {
    const musicObserver = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        musicObserver.disconnect();
        startPlayer();
      }
    }, { rootMargin: '300px 0px' });
    musicObserver.observe(musicPlayerEl);
  } else {
    startPlayer();
  }
}
