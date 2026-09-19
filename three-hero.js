import * as THREE from "three";

const mount = document.getElementById("hero-canvas");

if (mount && window.WebGLRenderingContext) {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const BAR_COUNT = 48;
  const BASE_RADIUS = 1.55;
  const COLOR_STOPS = [
    new THREE.Color("#bc6c25"), // rust
    new THREE.Color("#dda15e"), // tan
    new THREE.Color("#606c38"), // olive
  ];

  const colorAt = (t) => {
    const scaled = (t % 1) * COLOR_STOPS.length;
    const i = Math.floor(scaled) % COLOR_STOPS.length;
    const next = (i + 1) % COLOR_STOPS.length;
    return COLOR_STOPS[i].clone().lerp(COLOR_STOPS[next], scaled - i);
  };

  const scene = new THREE.Scene();

  const camera = new THREE.OrthographicCamera(-2.88, 2.88, 2.88, -2.88, 0.1, 10);
  camera.position.z = 5;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  mount.appendChild(renderer.domElement);

  const ring = new THREE.Group();
  scene.add(ring);

  const barGeo = new THREE.BoxGeometry(0.065, 1, 0.03);
  const bars = [];

  for (let i = 0; i < BAR_COUNT; i++) {
    const angle = (i / BAR_COUNT) * Math.PI * 2;
    const material = new THREE.MeshBasicMaterial({
      color: colorAt(i / BAR_COUNT),
      transparent: true,
      opacity: 0.85,
    });
    const bar = new THREE.Mesh(barGeo, material);
    bar.rotation.z = angle - Math.PI / 2;
    bar.userData = { angle, phase: (i / BAR_COUNT) * Math.PI * 2 };
    ring.add(bar);
    bars.push(bar);
  }

  const coreGeo = new THREE.CircleGeometry(0.22, 32);
  const coreMat = new THREE.MeshBasicMaterial({ color: "#283618", transparent: true, opacity: 0.15 });
  const core = new THREE.Mesh(coreGeo, coreMat);
  scene.add(core);

  const resize = () => {
    const size = mount.clientWidth || mount.clientHeight || 1;
    renderer.setSize(size, size);
  };

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(mount);
  resize();

  let pointerX = 0;
  let pointerY = 0;

  window.addEventListener(
    "pointermove",
    (event) => {
      pointerX = (event.clientX / window.innerWidth) * 2 - 1;
      pointerY = (event.clientY / window.innerHeight) * 2 - 1;
    },
    { passive: true }
  );

  // Interaction: scrolling makes the bars leap, hovering the portrait wakes them up, and a click
  // sends a pulse rippling around the ring
  const visual = mount.parentElement;
  let boost = 0;
  let beat = 0;
  let hover = 0;
  let hovering = false;
  let lastScrollY = window.scrollY;

  window.addEventListener(
    "scroll",
    () => {
      const dy = Math.abs(window.scrollY - lastScrollY);
      lastScrollY = window.scrollY;
      boost = Math.min(1, boost + Math.min(dy / 80, 0.4));
    },
    { passive: true }
  );

  if (visual) {
    visual.addEventListener("pointerenter", () => (hovering = true));
    visual.addEventListener("pointerleave", () => (hovering = false));
    visual.addEventListener("pointerdown", () => (beat = 1));
  }

  let rafId = null;
  const clock = new THREE.Clock();
  let lastT = 0;

  const renderStaticFrame = () => {
    bars.forEach((bar) => {
      const amp = 0.55;
      bar.scale.y = amp;
      const r = BASE_RADIUS + amp / 2;
      bar.position.set(Math.cos(bar.userData.angle) * r, Math.sin(bar.userData.angle) * r, 0);
    });
    renderer.render(scene, camera);
  };

  const animate = () => {
    rafId = requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    const dt = Math.min(t - lastT, 0.1);
    lastT = t;
    boost *= Math.exp(-dt * 2.5);
    beat *= Math.exp(-dt * 1.6);
    hover += ((hovering ? 1 : 0) - hover) * Math.min(dt * 5, 1);

    bars.forEach((bar, i) => {
      const wave = 0.5 + 0.5 * Math.sin(t * 1.7 + bar.userData.phase + i * 0.25);
      const pulse = 0.5 + 0.5 * Math.sin(t * 14 - i * 0.5);
      const amp = Math.min(
        0.3 + 0.6 * wave + boost * 0.3 * (0.4 + 0.6 * pulse) + hover * 0.14 * wave + beat * 0.6 * pulse,
        1.3
      );
      bar.scale.y = amp;
      const r = BASE_RADIUS + amp / 2;
      bar.position.set(Math.cos(bar.userData.angle) * r, Math.sin(bar.userData.angle) * r, 0);
    });

    ring.rotation.z += 0.0025 + boost * 0.02 + beat * 0.03;
    ring.rotation.x += (pointerY * 0.25 - ring.rotation.x) * 0.04;
    ring.rotation.y += (pointerX * 0.25 - ring.rotation.y) * 0.04;

    core.scale.setScalar(1 + 0.08 * Math.sin(t * 1.7));

    renderer.render(scene, camera);
  };

  const handleVisibility = () => {
    if (document.hidden) {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
    } else if (!prefersReducedMotion && !rafId) {
      animate();
    }
  };

  document.addEventListener("visibilitychange", handleVisibility);

  if (prefersReducedMotion) {
    renderStaticFrame();
  } else {
    animate();
  }
}
