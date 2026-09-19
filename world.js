import * as THREE from "three";
import { CSS2DRenderer, CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

const PALETTE = {
  cream: 0xfefae0,
  ink: 0x283618,
  olive: 0x606c38,
  rust: 0xbc6c25,
  tan: 0xdda15e,
  dusk: 0x161b30,
};

const INTERACT_RADIUS = 2.6;
const DOOR_RADIUS = 2.2;

// One entry per vinyl: songs that share cover art live on the same record.
const RECORDS = [
  {
    tracks: [
      { id: "084YxThHOrmrM5YC0tyZEY", title: "Sofia" },
      { id: "2PDIfFHHKklyycN0paspsF", title: "Someone" },
      { id: "0A8uNXnfohqdCVXCfKPrSA", title: "Time Machine" },
      { id: "6PXw0fITgSiBnRWFszSpAS", title: "Growing" },
    ],
  },
  { tracks: [{ id: "1AffuacdDfxEh0ZQWFdAfm", title: "151" }] },
  { tracks: [{ id: "1xBTI8q5lTUHf3hXRg2BAp", title: "Wait" }] },
  {
    tracks: [
      { id: "5s71EMi5MNKD82SIBhkBC0", title: "Erased" },
      { id: "45hsEjHz0wsxX5t2mDXzhr", title: "She Said" },
      { id: "3Z6qc0I5JDUol2PGF6WAek", title: "Herz" },
      { id: "4o1HNJ4RTT0ZipPDGyQrTq", title: "Falcon" },
    ],
  },
];

const COURSEWORK_PROJECTS = [
  {
    title: "Favorite City Website",
    desc: "Downtown Chicago — layout, images, and navigation.",
    image: "images/favorite-city.jpg",
    url: "https://dgnhw2.csb.app/",
  },
  {
    title: "Musician Webpage",
    desc: "A favorite artist, embedded media, and custom styling.",
    image: "images/musician.jpg",
    url: "https://hz463v.csb.app/",
  },
  {
    title: "Product Landing Page",
    desc: "Sections, nav links, a form, and embedded video.",
    image: "images/product-landing.jpg",
    url: "https://2cshtl.csb.app/",
  },
  {
    title: "Technical Documentation Page",
    desc: "Single-page docs with internal navigation and code examples.",
    image: "images/technical-doc.jpg",
    url: "https://wjp7fz.csb.app/",
  },
  {
    title: "Page Layout",
    desc: "Structured webpage layouts with HTML and CSS.",
    image: "images/layout.jpg",
    url: "https://g95nxn.csb.app/",
  },
  {
    title: "Responsive Web Design",
    desc: "Media queries for phones, tablets, and desktop.",
    image: "images/rwd.jpg",
    url: "https://qgpygt.csb.app/",
  },
  {
    title: "CSS Grid",
    desc: "Organized, flexible layouts built with CSS Grid.",
    image: "images/grid.jpg",
    url: "https://jvrmjw.csb.app/",
  },
  {
    title: "CSS Animations & Transitions",
    desc: "Movement and hover effects for interactive pages.",
    image: "images/animations.jpg",
    url: "https://z67l6s.csb.app/",
  },
];

const app = document.getElementById("app");
const promptEl = document.getElementById("prompt");
const promptTextEl = document.getElementById("prompt-text");
const panelOverlay = document.getElementById("panelOverlay");
const panelBox = document.getElementById("panelBox");
const panelEyebrow = document.getElementById("panelEyebrow");
const panelTitle = document.getElementById("panelTitle");
const panelBody = document.getElementById("panelBody");
const panelClose = document.getElementById("panelClose");
const fadeEl = document.getElementById("fade");
const hintEl = document.getElementById("hint-text");
const computerScreen = document.getElementById("computerScreen");
const computerList = document.getElementById("computerList");
const crateSheet = document.getElementById("crateSheet");
const crateCloseBtn = document.getElementById("crateClose");
const crateToggleBtn = document.getElementById("crateToggle");
const crateNowEl = document.getElementById("crateNow");
const spotifyFrame = document.getElementById("spotifyFrame");
const spotifyIndexEl = document.getElementById("spotifyIndex");
const spotifyPrevBtn = document.getElementById("spotifyPrev");
const spotifyNextBtn = document.getElementById("spotifyNext");

// ---------- Scene setup ----------

const scene = new THREE.Scene();
scene.background = new THREE.Color(PALETTE.cream);
scene.fog = new THREE.Fog(PALETTE.cream, 18, 38);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
const OUTSIDE_CAM_OFFSET = new THREE.Vector3(0, 7.5, 9);
const INSIDE_CAM_OFFSET = new THREE.Vector3(0, 6.8, 8.2);
let cameraOffset = OUTSIDE_CAM_OFFSET.clone();
const cameraLookOffset = new THREE.Vector3(0, 1, 0);
camera.position.copy(cameraOffset);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
app.appendChild(renderer.domElement);

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = "absolute";
labelRenderer.domElement.style.top = "0";
labelRenderer.domElement.style.pointerEvents = "none";
labelRenderer.domElement.style.zIndex = "5";
app.appendChild(labelRenderer.domElement);

const outsideLabels = [];
const insideLabels = [];

function makeLabel(parent, text, x, y, z) {
  const div = document.createElement("div");
  div.className = "label";
  div.textContent = text;
  const obj = new CSS2DObject(div);
  obj.position.set(x, y, z);
  parent.add(obj);
  (parent === insideGroup ? insideLabels : outsideLabels).push(obj);
  return obj;
}

// ---------- Lighting ----------

const ambient = new THREE.AmbientLight(0xffffff, 0.75);
scene.add(ambient);

const sun = new THREE.DirectionalLight(0xffffff, 0.9);
sun.position.set(8, 14, 6);
scene.add(sun);

const lamp = new THREE.PointLight(0xffcf8f, 0, 14, 2);
lamp.position.set(0, 3.4, -0.5);
scene.add(lamp);

// ---------- Groups ----------

const outsideGroup = new THREE.Group();
const insideGroup = new THREE.Group();
insideGroup.visible = false;
scene.add(outsideGroup, insideGroup);

// ================= OUTSIDE =================

const OUTSIDE_BOUND_X = 9;
const OUTSIDE_BOUND_Z = 9;
const SPAWN_OUTSIDE = new THREE.Vector3(0, 0, 6);

const groundSize = 22;
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(groundSize, groundSize),
  new THREE.MeshLambertMaterial({ color: PALETTE.tan })
);
ground.rotation.x = -Math.PI / 2;
outsideGroup.add(ground);

const grid = new THREE.GridHelper(groundSize, 20, PALETTE.olive, PALETTE.olive);
grid.position.y = 0.01;
grid.material.transparent = true;
grid.material.opacity = 0.12;
outsideGroup.add(grid);

// A couple of decorative bushes so the lawn doesn't feel empty
[
  [-7.5, -1.5],
  [7.5, -1.5],
  [-5, 7.5],
  [5, 7.5],
].forEach(([x, z]) => {
  const bush = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.7, 0),
    new THREE.MeshLambertMaterial({ color: PALETTE.olive })
  );
  bush.position.set(x, 0.6, z);
  outsideGroup.add(bush);
});

// House exterior
const HOUSE_POS = new THREE.Vector3(0, 0, -7);
const DOOR_POS = new THREE.Vector3(0, 0, -4.3);
const HOUSE_HALF_X = 3.5 + 0.55; // wall half-width + character buffer
const HOUSE_HALF_Z = 3 + 0.55; // wall half-depth + character buffer
const houseGroup = new THREE.Group();
houseGroup.position.copy(HOUSE_POS);
outsideGroup.add(houseGroup);

const walls = new THREE.Mesh(
  new THREE.BoxGeometry(7, 4, 6),
  new THREE.MeshLambertMaterial({ color: 0xf1e3c6 })
);
walls.position.y = 2;
houseGroup.add(walls);

const roof = new THREE.Mesh(
  new THREE.ConeGeometry(5.6, 2.6, 4),
  new THREE.MeshLambertMaterial({ color: PALETTE.rust })
);
roof.position.y = 5.3;
roof.rotation.y = Math.PI / 4;
houseGroup.add(roof);

const doorMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(1.4, 2.2),
  new THREE.MeshBasicMaterial({ color: PALETTE.ink })
);
doorMesh.position.set(0, 1.1, 3.01);
houseGroup.add(doorMesh);

const windowGlow = new THREE.Mesh(
  new THREE.PlaneGeometry(1, 1),
  new THREE.MeshBasicMaterial({ color: 0xffdca0 })
);
windowGlow.position.set(-2.3, 2.2, 3.01);
houseGroup.add(windowGlow);
const windowGlow2 = windowGlow.clone();
windowGlow2.position.x = 2.3;
houseGroup.add(windowGlow2);

makeLabel(outsideGroup, "Patrick's Studio", HOUSE_POS.x, 5.3, HOUSE_POS.z + 3.3);

// ================= INSIDE =================
// Warm mid-century lounge: walnut slat wall, herringbone oak, terracotta rug, chunky boucle
// furniture, a brass globe chandelier and tall windows onto a night city. Gaming-chill.

const ROOM_HALF_X = 6.2;
const ROOM_HALF_Z = 6.2;
const SPAWN_INSIDE = new THREE.Vector3(0, 0, 4.6);

const MC = {
  plaster: 0xe6dcc8,
  plasterSide: 0xdcd0b8,
  walnut: 0x6e3f24,
  walnutDark: 0x3a2010,
  walnutLight: 0x9a6238,
  oak: 0xd2a566,
  terracotta: 0xa9532f,
  boucle: 0x8d7b56,
  black: 0x1d1a19,
  brass: 0xb98d3e,
  cream: 0xf1ead9,
  sage: 0x8fa079,
  rust: 0xc0582b,
  blush: 0xe2b8a8,
  dusty: 0x8ea4b8,
  charcoal: 0x2f3437,
};

const lambert = (color) => new THREE.MeshLambertMaterial({ color });
const brassMat = new THREE.MeshLambertMaterial({ color: MC.brass, emissive: 0x3a2a0c });
const walnutMat = lambert(MC.walnutLight);
const charcoalMat = lambert(MC.charcoal);
const blackMat = lambert(MC.black);

function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function canvasTexture(w, h, draw) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d"), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function repeatTexture(tex, x, y) {
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(x, y);
  return tex;
}

// Herringbone oak floor (right-angle herringbone tile, rotated 45 degrees)
const floorTex = canvasTexture(512, 512, (g, w) => {
  const u = w / 4;
  const woods = ["#d7ab6c", "#cf9f5f", "#dbb277", "#c99a58"];
  const plank = (x, y, pw, ph, tone) => {
    g.fillStyle = "#a9793f";
    g.fillRect(x, y, pw, ph);
    g.fillStyle = woods[tone];
    g.fillRect(x + 1.5, y + 1.5, pw - 3, ph - 3);
    g.fillStyle = "rgba(120, 78, 34, 0.18)";
    const long = pw > ph;
    for (let i = 1; i < 4; i++) {
      if (long) g.fillRect(x + 2, y + (ph * i) / 4, pw - 4, 1);
      else g.fillRect(x + (pw * i) / 4, y + 2, 1, ph - 4);
    }
  };
  for (let k = -6; k <= 10; k++) {
    for (let m = -4; m <= 4; m++) {
      const tone = ((k % 4) + 4) % 4;
      plank(k * u, (k + 4 * m) * u, 2 * u, u, tone);
      plank((k + 2) * u, (k - 1 + 4 * m) * u, u, 2 * u, (tone + 2) % 4);
    }
  }
});
floorTex.center.set(0.5, 0.5);
floorTex.rotation = Math.PI / 4;
repeatTexture(floorTex, 17, 17);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(13.2, 13.2), new THREE.MeshLambertMaterial({ map: floorTex }));
floor.rotation.x = -Math.PI / 2;
insideGroup.add(floor);

// Terracotta rug with a raised brick pattern
const rugTex = canvasTexture(512, 512, (g, w, h) => {
  g.fillStyle = "#9c4a29";
  g.fillRect(0, 0, w, h);
  const rnd = seededRandom(5);
  const bw = 64;
  const bh = 26;
  for (let row = 0; row * bh < h + bh; row++) {
    const off = row % 2 ? bw / 2 : 0;
    for (let col = -1; col * bw < w + bw; col++) {
      const x = col * bw + off;
      const y = row * bh;
      const shade = 0.9 + rnd() * 0.2;
      g.fillStyle = `rgb(${Math.round(176 * shade)}, ${Math.round(88 * shade)}, ${Math.round(52 * shade)})`;
      g.fillRect(x + 3, y + 3, bw - 6, bh - 6);
      g.fillStyle = "rgba(255, 196, 150, 0.25)";
      g.fillRect(x + 3, y + 3, bw - 6, 3);
      g.fillStyle = "rgba(60, 20, 8, 0.35)";
      g.fillRect(x + 3, y + bh - 6, bw - 6, 3);
    }
  }
});
repeatTexture(rugTex, 2.6, 2);
const rug = new THREE.Mesh(new THREE.PlaneGeometry(7.4, 4.8), new THREE.MeshLambertMaterial({ map: rugTex }));
rug.rotation.x = -Math.PI / 2;
rug.position.set(0.4, 0.012, 0.7);
insideGroup.add(rug);
const rugFringe = new THREE.Mesh(new THREE.PlaneGeometry(7.6, 5.0), lambert(0x7d3a20));
rugFringe.rotation.x = -Math.PI / 2;
rugFringe.position.set(0.4, 0.008, 0.7);
insideGroup.add(rugFringe);

// Walnut slat paneling (canvas texture) and cream plaster
const slatTex = canvasTexture(1024, 512, (g, w, h) => {
  const slats = 64;
  const sw = w / slats;
  const rnd = seededRandom(9);
  for (let i = 0; i < slats; i++) {
    const l = 24 + rnd() * 9;
    g.fillStyle = `hsl(${19 + rnd() * 6}, 52%, ${l}%)`;
    g.fillRect(i * sw, 0, sw, h);
    g.fillStyle = "rgba(255, 190, 130, 0.12)";
    g.fillRect(i * sw + 1, 0, 2, h);
    g.fillStyle = "rgba(12, 5, 2, 0.9)";
    g.fillRect(i * sw + sw - 3, 0, 3, h);
  }
});
const slatBackMat = new THREE.MeshLambertMaterial({ map: slatTex });
const slatSideTex = repeatTexture(slatTex.clone(), 1.5, 1);
slatSideTex.needsUpdate = true;
const slatSideMat = new THREE.MeshLambertMaterial({ map: slatSideTex });
const plasterMat = lambert(MC.plaster);
const plasterSideMat = lambert(MC.plasterSide);

const backSlats = new THREE.Mesh(new THREE.PlaneGeometry(8.7, 4.6), slatBackMat);
backSlats.position.set(-2.15, 2.3, -6.5);
insideGroup.add(backSlats);
const backPlaster = new THREE.Mesh(new THREE.PlaneGeometry(4.3, 4.6), plasterMat);
backPlaster.position.set(4.35, 2.3, -6.5);
insideGroup.add(backPlaster);
const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(13, 4.6), slatSideMat);
leftWall.position.set(-6.5, 2.3, 0);
leftWall.rotation.y = Math.PI / 2;
insideGroup.add(leftWall);
const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(13, 4.6), plasterSideMat);
rightWall.position.set(6.5, 2.3, 0);
rightWall.rotation.y = -Math.PI / 2;
insideGroup.add(rightWall);

const skirtMat = lambert(MC.walnutDark);
const skirtBack = new THREE.Mesh(new THREE.BoxGeometry(13, 0.24, 0.08), skirtMat);
skirtBack.position.set(0, 0.12, -6.46);
insideGroup.add(skirtBack);
const skirtSideGeo = new THREE.BoxGeometry(0.08, 0.24, 13);
[-6.46, 6.46].forEach((x) => {
  const s = new THREE.Mesh(skirtSideGeo, skirtMat);
  s.position.set(x, 0.12, 0);
  insideGroup.add(s);
});

// Tall windows onto a night city
const cityTex = canvasTexture(512, 1024, (g, w, h) => {
  const sky = g.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#141a3a");
  sky.addColorStop(0.55, "#2e2a5c");
  sky.addColorStop(1, "#6b4a6e");
  g.fillStyle = sky;
  g.fillRect(0, 0, w, h);
  const rnd = seededRandom(21);
  g.fillStyle = "#fff4d0";
  for (let i = 0; i < 40; i++) g.fillRect(rnd() * w, rnd() * h * 0.45, 2, 2);
  for (let layer = 0; layer < 2; layer++) {
    let x = -20;
    while (x < w) {
      const bw = 50 + rnd() * 70;
      const bh = (layer ? 240 : 330) + rnd() * (layer ? 200 : 260);
      g.fillStyle = layer ? "#1a1830" : "#100f22";
      g.fillRect(x, h - bh, bw, bh);
      for (let wy = h - bh + 14; wy < h - 10; wy += 22) {
        for (let wx = x + 8; wx < x + bw - 10; wx += 16) {
          if (rnd() > 0.55) {
            g.fillStyle = rnd() > 0.5 ? "#ffd27a" : "#ffb45c";
            g.fillRect(wx, wy, 8, 11);
          }
        }
      }
      x += bw + 6;
    }
  }
});
const windowFrameMat = lambert(0x24170f);
[3.5, 5.4].forEach((wx, wi) => {
  const wg = new THREE.Group();
  wg.position.set(wx, 2.45, -6.46);
  const tex = cityTex.clone();
  tex.needsUpdate = true;
  tex.offset.x = wi * 0.35;
  tex.wrapS = THREE.RepeatWrapping;
  const pane = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 3.0), new THREE.MeshBasicMaterial({ map: tex }));
  wg.add(pane);
  [
    [1.62, 0.12, 0, 1.56],
    [1.62, 0.12, 0, -1.56],
    [0.12, 3.24, 0.81, 0],
    [0.12, 3.24, -0.81, 0],
    [0.05, 3.0, 0, 0],
    [1.5, 0.05, 0, 0.75],
    [1.5, 0.05, 0, 0],
    [1.5, 0.05, 0, -0.75],
  ].forEach(([w, h, x, y]) => {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.09), windowFrameMat);
    bar.position.set(x, y, 0.045);
    wg.add(bar);
  });
  insideGroup.add(wg);
});

// Curtains and a brass rod
const curtainMat = lambert(0xc9a27a);
[
  [2.55, 0.85],
  [6.2, 0.7],
].forEach(([cx, cw]) => {
  for (let i = 0; i < 5; i++) {
    const fold = new THREE.Mesh(new THREE.BoxGeometry(cw / 5 + 0.02, 3.9, 0.1), curtainMat);
    fold.position.set(cx - cw / 2 + (i + 0.5) * (cw / 5), 2.15, -6.36 + (i % 2) * 0.09);
    insideGroup.add(fold);
  }
});
const curtainRod = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 4.6, 8), brassMat);
curtainRod.rotation.z = Math.PI / 2;
curtainRod.position.set(4.35, 4.2, -6.3);
insideGroup.add(curtainRod);

// Potted plants (low-poly leaves)
function makePlant(x, y, z, scale = 1, potColor = 0xf2eee6) {
  const g = new THREE.Group();
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.17, 0.3, 10), lambert(potColor));
  pot.position.y = 0.15;
  g.add(pot);
  const leafGeo = new THREE.SphereGeometry(0.16, 6, 5);
  const leafColors = [0x6f8f5a, 0x86a56e, 0x5f7f4f];
  for (let i = 0; i < 8; i++) {
    const leaf = new THREE.Mesh(leafGeo, lambert(leafColors[i % 3]));
    const a = (i / 8) * Math.PI * 2;
    leaf.scale.set(0.55, 1.7 + (i % 3) * 0.25, 0.4);
    leaf.position.set(Math.cos(a) * 0.14, 0.62 + (i % 3) * 0.07, Math.sin(a) * 0.14);
    leaf.rotation.z = -Math.cos(a) * 0.5;
    leaf.rotation.x = Math.sin(a) * 0.5;
    g.add(leaf);
  }
  g.position.set(x, y, z);
  g.scale.setScalar(scale);
  insideGroup.add(g);
  return g;
}

// Brass globe chandelier
const chandelier = new THREE.Group();
chandelier.position.set(2.3, 3.6, -3.9);
chandelier.scale.setScalar(0.75);
const chRod = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 2.6, 8), brassMat);
chRod.position.y = 1.3;
chandelier.add(chRod);
const globeMat = new THREE.MeshBasicMaterial({ color: 0xfff3dc });
[
  [0, 0.05, 0, 0],
  [1, 0.28, 0.9, 0.5],
  [1, -0.2, 0.9, 2.6],
  [1, 0.22, 0.9, 4.2],
  [1, -0.16, 0.9, 5.4],
  [1, 0.12, 0.6, 1.4],
].forEach(([arm, y, len, ang]) => {
  const x = Math.cos(ang) * len;
  const z = Math.sin(ang) * len;
  if (arm) {
    const dir = new THREE.Vector3(x, y, z);
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, dir.length(), 6), brassMat);
    bar.position.copy(dir).multiplyScalar(0.5);
    bar.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    chandelier.add(bar);
  }
  const globe = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 12), globeMat);
  globe.position.set(x, y - 0.1, z);
  chandelier.add(globe);
});
insideGroup.add(chandelier);
lamp.position.set(2.0, 3.4, -2.6);

// Interior lighting: warm hemisphere fill plus the pools set up with each piece below
insideGroup.add(new THREE.HemisphereLight(0xffe6c8, 0xffcf9a, 0.55));

// Vinyl crate — a browsable stack of records, one per catalog track
const crateGroup = new THREE.Group();
crateGroup.position.set(0, 0, -5.4);
insideGroup.add(crateGroup);

// Light pine box, sized like a real record crate (sleeves stand edge-on inside it)
const CRATE_W = 2.1;
const CRATE_D = 1.0;
const CRATE_H = 0.55;
const pineMat = new THREE.MeshLambertMaterial({ color: 0xd8b47a });

const crateBase = new THREE.Mesh(new THREE.BoxGeometry(CRATE_W, 0.08, CRATE_D), pineMat);
crateBase.position.y = 0.04;
crateGroup.add(crateBase);

const crateFront = new THREE.Mesh(new THREE.BoxGeometry(CRATE_W, CRATE_H, 0.05), pineMat);
crateFront.position.set(0, CRATE_H / 2, CRATE_D / 2);
crateGroup.add(crateFront);
const crateBack = crateFront.clone();
crateBack.position.z = -CRATE_D / 2;
crateGroup.add(crateBack);

const crateSideGeo = new THREE.BoxGeometry(0.05, CRATE_H, CRATE_D);
const crateSideL = new THREE.Mesh(crateSideGeo, pineMat);
crateSideL.position.set(-CRATE_W / 2, CRATE_H / 2, 0);
crateGroup.add(crateSideL);
const crateSideR = crateSideL.clone();
crateSideR.position.x = CRATE_W / 2;
crateGroup.add(crateSideR);

// Hand-hold slot in the front panel
const handHold = new THREE.Mesh(
  new THREE.CapsuleGeometry(0.07, 0.5, 4, 12),
  new THREE.MeshLambertMaterial({ color: 0x2a1a0e })
);
handHold.rotation.z = Math.PI / 2;
handHold.scale.z = 0.25;
handHold.position.set(0, 0.34, CRATE_D / 2 + 0.02);
crateGroup.add(handHold);

const VINYL_COLORS = [PALETTE.rust, PALETTE.tan, PALETTE.olive];
const VINYL_COUNT = THREE.MathUtils.clamp(RECORDS.length, 3, 12);
const vinylPivots = [];
const CRATE_POS = new THREE.Vector3(0, 0, -5.4);
const PIVOT_Y = 0.7;

const sleeveGeo = new THREE.BoxGeometry(0.86, 0.9, 0.03);
const artGeo = new THREE.PlaneGeometry(0.8, 0.8);
const artDotGeo = new THREE.CircleGeometry(0.17, 20);
const discGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.02, 28);
const discLabelGeo = new THREE.CircleGeometry(0.14, 20);
const creamColor = new THREE.Color(PALETTE.cream);

// The crate is packed with sleeves standing edge-on. Your records sit at evenly spread
// slots among the decorative filler sleeves.
const SLOT_COUNT = 46;
const slotX = (s) => THREE.MathUtils.lerp(-0.92, 0.92, s / (SLOT_COUNT - 1));
const recordSlots = new Set();
const recordSlotList = [];
for (let i = 0; i < VINYL_COUNT; i++) {
  const s = Math.round(THREE.MathUtils.lerp(4, SLOT_COUNT - 5, (i + 0.5) / VINYL_COUNT));
  recordSlots.add(s);
  recordSlotList.push(s);
}

const FILLER_COLORS = [0xd9c9a3, 0xc9a66b, 0xb5733a, 0x7d8a52, 0x3a3a3a, 0xe8dcc0, 0x8a4b32, 0x5d6d7e, 0xa89b7c, 0x6b5a45];
const fillerGeo = new THREE.BoxGeometry(0.03, 0.9, 0.86);
const fillerSleeves = [];
let fillerSeed = 7;
const rand = () => {
  fillerSeed = (fillerSeed * 9301 + 49297) % 233280;
  return fillerSeed / 233280;
};

for (let s = 0; s < SLOT_COUNT; s++) {
  if (recordSlots.has(s)) continue;
  const h = 0.8 + rand() * 0.14;
  const mesh = new THREE.Mesh(
    fillerGeo,
    new THREE.MeshLambertMaterial({ color: FILLER_COLORS[Math.floor(rand() * FILLER_COLORS.length)] })
  );
  mesh.scale.y = h;
  const baseTilt = (rand() - 0.5) * 0.08;
  mesh.position.set(slotX(s), PIVOT_Y - 0.45 + 0.45 * h, 0);
  mesh.rotation.z = baseTilt;
  mesh.userData = { baseX: slotX(s), baseY: mesh.position.y, baseTilt };
  crateGroup.add(mesh);
  fillerSleeves.push(mesh);
}

for (let i = 0; i < VINYL_COUNT; i++) {
  const baseX = slotX(recordSlotList[i]);
  const baseTilt = (rand() - 0.5) * 0.06;
  const color = new THREE.Color(VINYL_COLORS[i % VINYL_COLORS.length]);

  const pivot = new THREE.Group();
  pivot.rotation.order = "ZYX";
  pivot.position.set(baseX, PIVOT_Y, 0);
  pivot.rotation.set(0, Math.PI / 2, baseTilt);
  crateGroup.add(pivot);

  const disc = new THREE.Mesh(discGeo, new THREE.MeshLambertMaterial({ color: 0x1c1c1c }));
  disc.rotation.x = Math.PI / 2;
  disc.position.set(0, 0, -0.03);
  pivot.add(disc);

  const discLabel = new THREE.Mesh(discLabelGeo, new THREE.MeshBasicMaterial({ color }));
  discLabel.position.y = 0.012;
  discLabel.rotation.x = -Math.PI / 2;
  disc.add(discLabel);

  const sleeve = new THREE.Mesh(sleeveGeo, new THREE.MeshLambertMaterial({ color }));
  pivot.add(sleeve);

  const art = new THREE.Mesh(
    artGeo,
    new THREE.MeshLambertMaterial({ color: color.clone().lerp(creamColor, 0.4) })
  );
  art.position.z = 0.017;
  pivot.add(art);

  const artDot = new THREE.Mesh(
    artDotGeo,
    new THREE.MeshBasicMaterial({ color: 0x1c1c1c, transparent: true, opacity: 0.55 })
  );
  artDot.position.z = 0.019;
  pivot.add(artDot);

  pivot.userData = { baseX, baseTilt, disc, art, artDot, hasArt: false };
  vinylPivots.push(pivot);
}

const crateLabel = makeLabel(insideGroup, "Music & Production", 0, 1.9, -5.4);

// Which crate slot shows record i (with more records than slots, they map proportionally)
function vinylForRecord(i) {
  if (RECORDS.length <= VINYL_COUNT) return i;
  return Math.round((i * (VINYL_COUNT - 1)) / (RECORDS.length - 1));
}

// Put each track's real cover on its sleeve (Spotify oEmbed returns the cover URL).
// Sleeves keep their colored placeholder if a lookup fails.
const coverLoader = new THREE.TextureLoader();
coverLoader.setCrossOrigin("anonymous");
let coversRequested = false;

function loadCoverArt() {
  if (coversRequested) return;
  coversRequested = true;
  RECORDS.forEach((record, i) => {
    const u = vinylPivots[vinylForRecord(i)].userData;
    if (u.hasArt) return;
    u.hasArt = true;
    fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(`https://open.spotify.com/track/${record.tracks[0].id}`)}`)
      .then((r) => r.json())
      .then((data) => {
        coverLoader.load(data.thumbnail_url, (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          u.art.material.dispose();
          u.art.material = new THREE.MeshBasicMaterial({ map: tex, color: 0xdddddd });
          u.artDot.visible = false;
        });
      })
      .catch(() => {
        u.hasArt = false;
      });
  });
}

const rbox = (w, h, d, r, material) => new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, r), material);


// Solid furniture footprints for walking collision (center x, z, half width, half depth)
const FURNITURE = [
  { x: 0.3, z: -0.6, hw: 2.1, hd: 0.7 },
  { x: 0.3, z: 1.4, hw: 0.85, hd: 0.6 },
  { x: 3.9, z: 0.9, hw: 0.9, hd: 0.85 },
  { x: -2.35, z: -0.85, hw: 0.4, hd: 0.4 },
  { x: -4.9, z: -0.7, hw: 0.62, hd: 0.62 },
  { x: -5.4, z: -2.4, hw: 0.95, hd: 0.4 },
  { x: 5.4, z: -2.4, hw: 0.9, hd: 0.42 },
  { x: -3.9, z: -6.0, hw: 1.45, hd: 0.3 },
  { x: 0, z: -5.4, hw: 1.1, hd: 0.55 },
  { x: -5.6, z: 2.4, hw: 0.4, hd: 0.3 },
  { x: 5.6, z: 2.7, hw: 0.42, hd: 0.42 },
  { x: 2.95, z: -1.5, hw: 0.25, hd: 0.25 },
  { x: -5.8, z: -5.5, hw: 0.3, hd: 0.3 },
];

// Boucle fabric
const boucleTex = canvasTexture(256, 256, (g, w, h) => {
  g.fillStyle = "#8d7b56";
  g.fillRect(0, 0, w, h);
  const rnd = seededRandom(3);
  const cols = ["#a8946a", "#6f5f3f", "#b9a679", "#7a6a48", "#c9b98d", "#5d4f34"];
  for (let i = 0; i < 3200; i++) {
    g.fillStyle = cols[Math.floor(rnd() * cols.length)];
    g.fillRect(rnd() * w, rnd() * h, 2 + rnd() * 2, 2 + rnd() * 2);
  }
});
repeatTexture(boucleTex, 2, 2);
const boucleMat = new THREE.MeshLambertMaterial({ map: boucleTex });

// Light over the crate so the records glow
const crateSpot = new THREE.SpotLight(0xffe2b0, 2.4, 9, 0.72, 0.6, 1.4);
crateSpot.position.set(0, 3.7, -3.3);
crateSpot.target.position.set(0, 0.9, -5.4);
insideGroup.add(crateSpot, crateSpot.target);

// Floating shelf above the crate
const shelfBoard = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.06, 0.3), walnutMat);
shelfBoard.position.set(0, 2.55, -6.32);
insideGroup.add(shelfBoard);
[
  [-0.85, 0.17, MC.sage],
  [-0.7, 0.2, MC.dusty],
  [-0.56, 0.15, MC.rust],
].forEach(([x, h, color]) => {
  const book = new THREE.Mesh(new THREE.BoxGeometry(0.11, h * 2, 0.2), lambert(color));
  book.position.set(x, 2.58 + h, -6.32);
  insideGroup.add(book);
});
const speaker = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.3, 0.22), charcoalMat);
speaker.position.set(0.55, 2.73, -6.32);
insideGroup.add(speaker);
const speakerCone = new THREE.Mesh(new THREE.CircleGeometry(0.09, 16), new THREE.MeshBasicMaterial({ color: 0x5a6068 }));
speakerCone.position.set(0.55, 2.73, -6.2);
insideGroup.add(speakerCone);
makePlant(1.0, 2.58, -6.32, 0.5, MC.blush);

// Brass wall clock
const wallClock = new THREE.Group();
wallClock.position.set(-1.7, 3.35, -6.46);
const clockRim = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.028, 8, 28), brassMat);
wallClock.add(clockRim);
const clockFace = new THREE.Mesh(new THREE.CircleGeometry(0.24, 28), new THREE.MeshBasicMaterial({ color: 0xf6efdc }));
clockFace.position.z = 0.005;
wallClock.add(clockFace);
const hourHand = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.13, 0.01), blackMat);
hourHand.position.set(0.03, 0.05, 0.015);
hourHand.rotation.z = -0.5;
wallClock.add(hourHand);
const minuteHand = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.19, 0.01), blackMat);
minuteHand.position.set(-0.05, 0.02, 0.02);
minuteHand.rotation.z = 1.1;
wallClock.add(minuteHand);
insideGroup.add(wallClock);

// Sideboard with vase, books, sculpture and a textured art piece above
const sideboard = new THREE.Group();
sideboard.position.set(-3.9, 0, -6.0);
const sbBody = rbox(2.8, 0.62, 0.5, 0.04, lambert(0xb0763f));
sbBody.position.y = 0.59;
sideboard.add(sbBody);
[-0.95, 0, 0.95].forEach((x) => {
  const drawer = rbox(0.86, 0.5, 0.03, 0.02, lambert(0xc48a52));
  drawer.position.set(x, 0.59, 0.25);
  sideboard.add(drawer);
  const pull = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.22, 8), brassMat);
  pull.rotation.z = Math.PI / 2;
  pull.position.set(x, 0.68, 0.29);
  sideboard.add(pull);
});
[
  [-1.25, -0.18],
  [1.25, -0.18],
  [-1.25, 0.18],
  [1.25, 0.18],
].forEach(([x, z]) => {
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.025, 0.3, 8), lambert(MC.walnutLight));
  leg.position.set(x, 0.15, z);
  sideboard.add(leg);
});
insideGroup.add(sideboard);

const vase = new THREE.Mesh(new THREE.SphereGeometry(0.17, 14, 12), lambert(0xe6d3b3));
vase.scale.y = 0.95;
vase.position.set(-4.75, 1.07, -6.0);
insideGroup.add(vase);
const vaseNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 0.14, 10), lambert(0xe6d3b3));
vaseNeck.position.set(-4.75, 1.27, -6.0);
insideGroup.add(vaseNeck);
const bloomColors = [0xd2562b, 0xe38a3a, 0xc0392b, 0xf0a04a, 0xd2562b, 0xe38a3a, 0xb8432a];
bloomColors.forEach((color, i) => {
  const a = (i / bloomColors.length) * Math.PI * 2;
  const len = 0.5 + (i % 3) * 0.14;
  const tx = Math.cos(a) * 0.13;
  const tz = Math.sin(a) * 0.05;
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, len, 5), lambert(0x6b7a3f));
  stem.position.set(-4.75 + tx / 2, 1.34 + len / 2, -6.0 + tz / 2);
  stem.rotation.z = -tx * 1.6;
  insideGroup.add(stem);
  const bloom = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), lambert(color));
  bloom.position.set(-4.75 + tx, 1.34 + len, -6.0 + tz);
  insideGroup.add(bloom);
});
[
  [-3.55, 0.94, MC.cream, 0.42],
  [-3.55, 0.99, MC.rust, 0.38],
  [-3.55, 1.04, MC.sage, 0.34],
  [-3.55, 1.09, MC.dusty, 0.3],
].forEach(([x, y, color, w]) => {
  const book = new THREE.Mesh(new THREE.BoxGeometry(w, 0.045, 0.26), lambert(color));
  book.position.set(x, y, -6.0);
  insideGroup.add(book);
});
[
  [-3.15, MC.rust, 0.32],
  [-3.09, MC.black, 0.34],
  [-3.03, MC.cream, 0.3],
].forEach(([x, color, h]) => {
  const book = new THREE.Mesh(new THREE.BoxGeometry(0.05, h, 0.22), lambert(color));
  book.position.set(x, 0.9 + h / 2, -6.0);
  book.rotation.z = -0.12;
  insideGroup.add(book);
});
const sculptBody = rbox(0.16, 0.3, 0.13, 0.06, blackMat);
sculptBody.position.set(-4.2, 1.06, -6.0);
sculptBody.rotation.z = 0.12;
insideGroup.add(sculptBody);
const sculptHead = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), blackMat);
sculptHead.position.set(-4.24, 1.27, -6.0);
insideGroup.add(sculptHead);

const artTex = canvasTexture(512, 272, (g, w, h) => {
  g.fillStyle = "#cdc1a8";
  g.fillRect(0, 0, w, h);
  const rnd = seededRandom(17);
  for (let row = 0; row < 8; row++) {
    let x = 26;
    while (x < w - 40) {
      const tw = 22 + rnd() * 38;
      g.fillStyle = `rgb(${34 + Math.round(rnd() * 26)}, ${34 + Math.round(rnd() * 24)}, ${36 + Math.round(rnd() * 22)})`;
      g.fillRect(x, 26 + row * 27, tw, 21);
      x += tw + 4;
    }
  }
  g.fillStyle = "#a89a7c";
  g.fillRect(26, h - 32, w - 52, 3);
});
const artFrame = new THREE.Group();
artFrame.position.set(-3.9, 2.45, -6.46);
artFrame.add(new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.16, 0.07), lambert(0x8a6a44)));
const artPlane = new THREE.Mesh(new THREE.PlaneGeometry(1.94, 1.0), new THREE.MeshBasicMaterial({ map: artTex }));
artPlane.position.z = 0.04;
artFrame.add(artPlane);
insideGroup.add(artFrame);

// Lounge: boucle sofa with throw pillows
const sofa = new THREE.Group();
sofa.position.set(0.3, 0, -0.6);
const sofaBase = rbox(3.0, 0.46, 1.15, 0.16, boucleMat);
sofaBase.position.y = 0.32;
sofa.add(sofaBase);
[-1.62, 1.62].forEach((x) => {
  const arm = rbox(0.55, 0.85, 1.2, 0.24, boucleMat);
  arm.position.set(x, 0.52, 0);
  sofa.add(arm);
});
const sofaBack = rbox(3.0, 0.7, 0.42, 0.2, boucleMat);
sofaBack.position.set(0, 0.8, -0.42);
sofa.add(sofaBack);
[-0.99, 0, 0.99].forEach((x) => {
  const seat = rbox(0.97, 0.28, 0.86, 0.13, boucleMat);
  seat.position.set(x, 0.66, 0.1);
  sofa.add(seat);
  const back = rbox(0.96, 0.58, 0.3, 0.14, boucleMat);
  back.position.set(x, 1.02, -0.16);
  back.rotation.x = -0.16;
  sofa.add(back);
});
[
  [-1.0, 0xc0582b, 0.5, 0.5, 0.5],
  [0.35, 0xe8dfca, 0.5, 0.46, -0.25],
  [0.95, 0x5a3c26, 0.46, 0.4, 0.3],
].forEach(([x, color, w, h, rot]) => {
  const pillow = rbox(w, h, 0.16, 0.07, lambert(color));
  pillow.position.set(x, 1.0, 0.1);
  pillow.rotation.set(-0.12, 0, rot);
  sofa.add(pillow);
});
insideGroup.add(sofa);

// Ottoman with a magazine and glasses
const ottoman = new THREE.Group();
ottoman.position.set(0.3, 0, 1.4);
const ottBase = rbox(1.6, 0.55, 1.05, 0.2, boucleMat);
ottBase.position.y = 0.3;
ottoman.add(ottBase);
const ottTop = rbox(1.5, 0.2, 0.95, 0.1, boucleMat);
ottTop.position.y = 0.6;
ottoman.add(ottTop);
const magTex = canvasTexture(128, 96, (g, w, h) => {
  g.fillStyle = "#f4efe2";
  g.fillRect(0, 0, w, h);
  g.fillStyle = "#c0582b";
  g.fillRect(0, 0, w, 20);
  g.fillStyle = "#3a3a3a";
  for (let i = 0; i < 6; i++) g.fillRect(10, 32 + i * 10, 40 + ((i * 17) % 50), 3);
  g.fillStyle = "#8ea4b8";
  g.fillRect(76, 34, 40, 40);
});
const magazine = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.36), new THREE.MeshLambertMaterial({ map: magTex }));
magazine.rotation.set(-Math.PI / 2, 0, 0.35);
magazine.position.set(0.1, 0.705, 0.05);
ottoman.add(magazine);
[-0.06, 0.06].forEach((dx) => {
  const lens = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.007, 6, 14), blackMat);
  lens.rotation.x = -Math.PI / 2;
  lens.position.set(0.32 + dx, 0.715, 0.18);
  ottoman.add(lens);
});
insideGroup.add(ottoman);

// Armchair with a plaid throw and a sleeping cat
const armchair = new THREE.Group();
armchair.position.set(3.9, 0, 0.9);
armchair.rotation.y = -0.5;
const chairBaseMesh = rbox(1.35, 0.5, 1.15, 0.18, boucleMat);
chairBaseMesh.position.y = 0.32;
armchair.add(chairBaseMesh);
[-0.62, 0.62].forEach((x) => {
  const arm = rbox(0.5, 0.82, 1.15, 0.22, boucleMat);
  arm.position.set(x, 0.5, 0);
  armchair.add(arm);
});
const chairBackMesh = rbox(1.7, 0.85, 0.46, 0.22, boucleMat);
chairBackMesh.position.set(0, 0.85, -0.44);
armchair.add(chairBackMesh);
const chairSeatCushion = rbox(0.9, 0.26, 0.86, 0.12, boucleMat);
chairSeatCushion.position.set(0, 0.68, 0.08);
armchair.add(chairSeatCushion);
const plaidTex = canvasTexture(128, 128, (g, w, h) => {
  g.fillStyle = "#4a4a4f";
  g.fillRect(0, 0, w, h);
  g.fillStyle = "rgba(20, 20, 24, 0.7)";
  for (let i = 0; i < 4; i++) {
    g.fillRect(i * 32, 0, 12, h);
    g.fillRect(0, i * 32, w, 12);
  }
  g.fillStyle = "rgba(200, 200, 210, 0.25)";
  for (let i = 0; i < 4; i++) g.fillRect(i * 32 + 14, 0, 2, h);
});
const plaidMat = new THREE.MeshLambertMaterial({ map: plaidTex });
const throwTop = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.035, 0.8), plaidMat);
throwTop.position.set(-0.62, 0.94, 0.02);
armchair.add(throwTop);
const throwDrop = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.42, 0.8), plaidMat);
throwDrop.position.set(-0.88, 0.74, 0.02);
armchair.add(throwDrop);
const chairPillow = rbox(0.62, 0.5, 0.18, 0.08, lambert(0xd9cbb0));
chairPillow.position.set(0.15, 0.98, -0.16);
chairPillow.rotation.set(-0.3, 0, -0.12);
armchair.add(chairPillow);


insideGroup.add(armchair);

// Stacked black side table with a globe lamp
const stack = new THREE.Group();
stack.position.set(-2.35, 0, -0.85);
[
  [0.36, 0.22],
  [0.3, 0.63],
  [0.26, 0.99],
].forEach(([r, y]) => {
  const orb = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), blackMat);
  orb.scale.y = 0.64;
  orb.position.y = y;
  stack.add(orb);
});
const lampStem = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.3, 8), brassMat);
lampStem.position.y = 1.32;
stack.add(lampStem);
const lampGlobe = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), new THREE.MeshBasicMaterial({ color: 0xfff3dc }));
lampGlobe.position.y = 1.56;
stack.add(lampGlobe);
insideGroup.add(stack);
const globeLampLight = new THREE.PointLight(0xffd6a0, 1.1, 7, 1.6);
globeLampLight.position.set(-2.35, 1.6, -0.6);
insideGroup.add(globeLampLight);

// Plants around the room
makePlant(2.95, 0, -1.5, 1.7, 0xb5653f);
makePlant(-5.8, 0, -5.5, 1.5, 0xf2eee6);
makePlant(5.9, 0, -5.6, 1.4, 0xf2eee6);

// Acoustic guitar on a stand — About
const guitarGroup = new THREE.Group();
guitarGroup.position.set(-5.6, 0, 2.4);
const honey = lambert(0xc8894a);
const guitarLower = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.16, 22), honey);
guitarLower.rotation.x = Math.PI / 2;
guitarLower.position.y = 0.72;
guitarGroup.add(guitarLower);
const guitarWaist = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.34, 0.16), honey);
guitarWaist.position.y = 1.0;
guitarGroup.add(guitarWaist);
const guitarUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.29, 0.16, 20), honey);
guitarUpper.rotation.x = Math.PI / 2;
guitarUpper.position.y = 1.2;
guitarGroup.add(guitarUpper);
const soundHole = new THREE.Mesh(new THREE.CircleGeometry(0.1, 20), new THREE.MeshBasicMaterial({ color: 0x1e140c }));
soundHole.position.set(0, 0.86, 0.085);
guitarGroup.add(soundHole);
const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.05, 0.03), lambert(0x3a2412));
bridge.position.set(0, 0.55, 0.09);
guitarGroup.add(bridge);
const guitarNeck = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.95, 0.07), lambert(0x4b3220));
guitarNeck.position.set(0, 1.95, 0);
guitarGroup.add(guitarNeck);
const headstock = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.3, 0.06), lambert(0x3a2412));
headstock.position.set(0, 2.55, 0);
guitarGroup.add(headstock);
const standRod = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.4, 8), charcoalMat);
standRod.position.set(0, 0.2, -0.05);
guitarGroup.add(standRod);
[-0.28, 0.28].forEach((x) => {
  const foot = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.04, 0.5), charcoalMat);
  foot.position.set(x, 0.02, 0);
  guitarGroup.add(foot);
});
const guitarRest = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.03, 0.05), charcoalMat);
guitarRest.position.set(0, 0.36, 0);
guitarGroup.add(guitarRest);
insideGroup.add(guitarGroup);
makeLabel(insideGroup, "About", -5.6, 3.1, 2.4);

// Gaming corner — Featured Work
const tvGroup = new THREE.Group();
tvGroup.position.set(-5.4, 0, -2.4);
const consoleBody = rbox(1.75, 0.34, 0.6, 0.04, walnutMat);
consoleBody.position.y = 0.5;
tvGroup.add(consoleBody);
[
  [-0.78, -0.22],
  [0.78, -0.22],
  [-0.78, 0.22],
  [0.78, 0.22],
].forEach(([x, z]) => {
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.02, 0.33, 8), blackMat);
  leg.position.set(x, 0.165, z);
  tvGroup.add(leg);
});
const gameTex = canvasTexture(512, 288, (g, w, h) => {
  const bg = g.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, "#1a2350");
  bg.addColorStop(1, "#4a1f52");
  g.fillStyle = bg;
  g.fillRect(0, 0, w, h);
  g.fillStyle = "rgba(255, 255, 255, 0.08)";
  for (let i = 0; i < 10; i++) g.fillRect(0, i * 30, w, 1);
  g.fillStyle = "#ff5a6e";
  g.font = "800 44px 'Poppins', sans-serif";
  g.textAlign = "center";
  g.fillText("MARVEL", w / 2, 78);
  g.fillStyle = "#e9f0ff";
  g.font = "700 30px 'Poppins', sans-serif";
  g.fillText("CHAMPIONS", w / 2, 116);
  g.fillStyle = "#f0c05a";
  g.font = "700 20px 'Poppins', sans-serif";
  g.fillText("WORK IN PROGRESS", w / 2, 138);
  const cards = ["#e4574d", "#3f6fd8", "#f0c05a", "#7fbf8a", "#c77dd6"];
  cards.forEach((c, i) => {
    const x = 40 + i * 92;
    g.fillStyle = c;
    g.beginPath();
    g.roundRect(x, 150, 72, 100, 8);
    g.fill();
    g.fillStyle = "rgba(255,255,255,0.3)";
    g.fillRect(x + 8, 160, 56, 40);
  });
});
const tvBezel = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.92, 0.05), charcoalMat);
tvBezel.position.set(0, 1.2, 0);
tvGroup.add(tvBezel);
const tvScreen = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.82), new THREE.MeshBasicMaterial({ map: gameTex }));
tvScreen.position.set(0, 1.2, 0.03);
tvGroup.add(tvScreen);
const tvFoot = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.03, 0.2), charcoalMat);
tvFoot.position.set(0, 0.68, 0);
tvGroup.add(tvFoot);
const consoleUnit = rbox(0.42, 0.07, 0.28, 0.02, lambert(0xf3f1ec));
consoleUnit.position.set(-0.62, 0.71, 0.1);
tvGroup.add(consoleUnit);
const consoleLed = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.012, 0.005), new THREE.MeshBasicMaterial({ color: 0x59b4ff }));
consoleLed.position.set(-0.62, 0.71, 0.245);
tvGroup.add(consoleLed);
const controller = rbox(0.17, 0.04, 0.1, 0.02, charcoalMat);
controller.position.set(0.55, 0.69, 0.12);
tvGroup.add(controller);
[
  [0.3, 0x3f6fd8],
  [0.38, 0xe4574d],
  [0.46, 0xf0c05a],
].forEach(([x, color], i) => {
  const gameCase = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 0.12), lambert(color));
  gameCase.position.set(x - 0.05 * i, 0.75, -0.12);
  tvGroup.add(gameCase);
});
[-1.02, 1.02].forEach((x) => {
  const spk = rbox(0.2, 0.78, 0.22, 0.05, charcoalMat);
  spk.position.set(x, 0.73, 0);
  tvGroup.add(spk);
  const cone = new THREE.Mesh(new THREE.CircleGeometry(0.06, 14), new THREE.MeshBasicMaterial({ color: 0x5a6068 }));
  cone.position.set(x, 0.62, 0.115);
  tvGroup.add(cone);
});
const tvGlowPlane = new THREE.Mesh(
  new THREE.PlaneGeometry(1.76, 1.06),
  new THREE.MeshBasicMaterial({ color: 0xb07bff, transparent: true, opacity: 0.55 })
);
tvGlowPlane.position.set(0, 1.2, -0.06);
tvGroup.add(tvGlowPlane);
insideGroup.add(tvGroup);
const beanbag = new THREE.Mesh(new THREE.SphereGeometry(0.62, 16, 12), lambert(MC.blush));
beanbag.scale.set(1, 0.66, 1);
beanbag.position.set(-4.9, 0.36, -0.7);
insideGroup.add(beanbag);
const tvGlow = new THREE.PointLight(0xa06bff, 1.0, 5, 1.6);
tvGlow.position.set(-5.4, 1.3, -1.6);
insideGroup.add(tvGlow);
makeLabel(insideGroup, "Featured Work", -5.4, 1.9, -2.4);

// Walnut desk with a monitor — Coursework
const deskGroup = new THREE.Group();
deskGroup.position.set(5.4, 0, -2.4);
const deskTop = rbox(1.7, 0.06, 0.78, 0.02, walnutMat);
deskTop.position.y = 0.78;
deskGroup.add(deskTop);
[
  [-0.78, -0.32],
  [0.78, -0.32],
  [-0.78, 0.32],
  [0.78, 0.32],
].forEach(([x, z]) => {
  const leg = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.75, 0.05), blackMat);
  leg.position.set(x, 0.375, z);
  deskGroup.add(leg);
});
const ledStrip = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.014, 0.02), new THREE.MeshBasicMaterial({ color: 0xff6bd0 }));
ledStrip.position.set(0, 0.745, 0.375);
deskGroup.add(ledStrip);
const codeTex = canvasTexture(512, 288, (g, w, h) => {
  g.fillStyle = "#1b2032";
  g.fillRect(0, 0, w, h);
  g.fillStyle = "#12162a";
  g.fillRect(0, 0, 46, h);
  const colors = ["#ff7eb6", "#7fdbca", "#ffd479", "#c8d3f5", "#a29bfe"];
  for (let i = 0; i < 14; i++) {
    g.fillStyle = "#4d5573";
    g.fillRect(14, 22 + i * 18, 16, 6);
    const indent = (i % 4) * 22;
    let x = 64 + indent;
    for (let k = 0; k < 3; k++) {
      const len = 30 + ((i * 41 + k * 67) % 90);
      g.fillStyle = colors[(i + k) % colors.length];
      g.fillRect(x, 22 + i * 18, len, 6);
      x += len + 10;
    }
  }
});
const monitorBezel = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.6, 0.03), charcoalMat);
monitorBezel.position.set(0, 1.22, -0.18);
deskGroup.add(monitorBezel);
const monitorScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.94, 0.54), new THREE.MeshBasicMaterial({ map: codeTex }));
monitorScreen.position.set(0, 1.22, -0.16);
deskGroup.add(monitorScreen);
const monitorNeck = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.2, 0.05), charcoalMat);
monitorNeck.position.set(0, 0.92, -0.18);
deskGroup.add(monitorNeck);
const monitorFoot = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.02, 0.18), charcoalMat);
monitorFoot.position.set(0, 0.82, -0.18);
deskGroup.add(monitorFoot);
const keyboard = rbox(0.5, 0.025, 0.16, 0.01, lambert(0xf0eee8));
keyboard.position.set(-0.05, 0.82, 0.12);
deskGroup.add(keyboard);
const mouse = rbox(0.07, 0.03, 0.11, 0.015, lambert(0xf0eee8));
mouse.position.set(0.4, 0.83, 0.12);
deskGroup.add(mouse);
const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.1, 12), lambert(MC.dusty));
mug.position.set(-0.6, 0.86, 0.1);
deskGroup.add(mug);
const deskLampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.02, 12), brassMat);
deskLampBase.position.set(0.68, 0.82, -0.05);
deskGroup.add(deskLampBase);
const deskLampArm = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.34, 6), brassMat);
deskLampArm.position.set(0.68, 0.99, -0.05);
deskGroup.add(deskLampArm);
const deskLampShade = new THREE.Mesh(
  new THREE.ConeGeometry(0.1, 0.12, 12, 1, true),
  new THREE.MeshBasicMaterial({ color: 0xffdca0, side: THREE.DoubleSide })
);
deskLampShade.position.set(0.68, 1.18, -0.05);
deskGroup.add(deskLampShade);
const chairSeat = rbox(0.6, 0.12, 0.6, 0.08, boucleMat);
chairSeat.position.set(0, 0.5, 0.95);
deskGroup.add(chairSeat);
const chairBackDesk = rbox(0.6, 0.5, 0.1, 0.08, boucleMat);
chairBackDesk.position.set(0, 0.88, 1.24);
deskGroup.add(chairBackDesk);
const chairPole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.44, 8), charcoalMat);
chairPole.position.set(0, 0.24, 0.95);
deskGroup.add(chairPole);
const chairBaseDesk = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.03, 5), charcoalMat);
chairBaseDesk.position.set(0, 0.02, 0.95);
deskGroup.add(chairBaseDesk);
insideGroup.add(deskGroup);
makePlant(5.4 + 0.65, 0.81, -2.4 - 0.15, 0.45, 0xf2eee6);
const deskGlow = new THREE.PointLight(0x9fc4ff, 0.8, 4, 1.6);
deskGlow.position.set(5.4, 1.3, -1.6);
insideGroup.add(deskGlow);
makeLabel(insideGroup, "Coursework", 5.4, 1.9, -2.4);

// Round walnut side table with a rotary phone — Contact
const phoneGroup = new THREE.Group();
phoneGroup.position.set(5.6, 0, 2.7);
const tableTop = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.05, 20), walnutMat);
tableTop.position.y = 0.62;
phoneGroup.add(tableTop);
[0, 1, 2].forEach((i) => {
  const a = (i / 3) * Math.PI * 2 + 0.5;
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.62, 8), blackMat);
  leg.position.set(Math.cos(a) * 0.22, 0.31, Math.sin(a) * 0.22);
  leg.rotation.z = -Math.cos(a) * 0.12;
  leg.rotation.x = Math.sin(a) * 0.12;
  phoneGroup.add(leg);
});
const phoneBody = rbox(0.34, 0.12, 0.26, 0.04, lambert(MC.cream));
phoneBody.position.y = 0.72;
phoneGroup.add(phoneBody);
const phoneDial = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.02, 16), charcoalMat);
phoneDial.position.set(0, 0.79, 0.02);
phoneGroup.add(phoneDial);
const handset = new THREE.Mesh(new THREE.CapsuleGeometry(0.03, 0.26, 4, 8), lambert(MC.sage));
handset.rotation.z = Math.PI / 2;
handset.position.set(0, 0.83, -0.07);
phoneGroup.add(handset);
insideGroup.add(phoneGroup);
makeLabel(insideGroup, "Contact", 5.6, 1.5, 2.7);

// Woven doormat marking the exit back outside
const exitMat = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.6), lambert(0xd8c8a4));
exitMat.rotation.x = -Math.PI / 2;
exitMat.position.set(0, 0.015, 5.4);
insideGroup.add(exitMat);

// ================= EXTRA DETAILS =================

// Tall bookcase between the sideboard and the crate
const bookcase = new THREE.Group();
bookcase.position.set(-1.75, 0, -6.28);
const bcMat = lambert(MC.walnutLight);
[-0.6, 0.6].forEach((x) => {
  const side = new THREE.Mesh(new THREE.BoxGeometry(0.05, 2.6, 0.34), bcMat);
  side.position.set(x, 1.3, 0);
  bookcase.add(side);
});
const bcTop = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.05, 0.34), bcMat);
bcTop.position.set(0, 2.6, 0);
bookcase.add(bcTop);
const bcBack = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.6, 0.02), lambert(MC.walnutDark));
bcBack.position.set(0, 1.3, -0.16);
bookcase.add(bcBack);
const shelfYs = [0.12, 0.72, 1.32, 1.92];
shelfYs.forEach((y) => {
  const board = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.04, 0.32), bcMat);
  board.position.set(0, y, 0);
  bookcase.add(board);
});
const bookRand = seededRandom(31);
const bookColors = [MC.rust, MC.sage, MC.dusty, MC.cream, 0x3d4a5c, 0xb98d3e, 0x7d3a20, 0x5a6b48, 0xd9a68f, 0x2f3437];
shelfYs.forEach((y, si) => {
  let x = -0.54;
  while (x < 0.5) {
    if (si === 1 && x > 0.05 && x < 0.32) {
      x = 0.32;
      continue;
    }
    if (si === 3 && x > -0.15 && x < 0.2) {
      x = 0.2;
      continue;
    }
    const w = 0.045 + bookRand() * 0.06;
    const h = 0.26 + bookRand() * 0.2;
    const book = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.22), lambert(bookColors[Math.floor(bookRand() * bookColors.length)]));
    const lean = x > 0.42 && bookRand() > 0.5 ? 0.2 : 0;
    book.position.set(x + w / 2, y + 0.02 + h / 2, 0.01);
    book.rotation.z = -lean;
    bookcase.add(book);
    x += w + 0.004;
  }
});
// Objects among the books: a mini globe, a framed photo, and a stack of board games
const miniGlobe = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 10), lambert(0x6f8fb0));
miniGlobe.position.set(0.18, shelfYs[1] + 0.22, 0.02);
bookcase.add(miniGlobe);
const globeStand = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.05, 0.1, 8), brassMat);
globeStand.position.set(0.18, shelfYs[1] + 0.07, 0.02);
bookcase.add(globeStand);
const photoFrame = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.28, 0.03), lambert(0x2f3437));
photoFrame.position.set(0.02, shelfYs[3] + 0.16, 0.05);
photoFrame.rotation.y = -0.15;
bookcase.add(photoFrame);
const photoArt = new THREE.Mesh(new THREE.PlaneGeometry(0.17, 0.23), new THREE.MeshBasicMaterial({ color: 0xc9b99a }));
photoArt.position.set(0.02, shelfYs[3] + 0.16, 0.067);
photoArt.rotation.y = -0.15;
bookcase.add(photoArt);
[
  [0.0, MC.rust, 0.34],
  [0.02, MC.dusty, 0.3],
].forEach(([dx, color, w], i) => {
  const game = new THREE.Mesh(new THREE.BoxGeometry(w, 0.06, 0.24), lambert(color));
  game.position.set(dx - 0.1, shelfYs[2] + 0.05 + i * 0.065, 0.01);
  bookcase.add(game);
});
insideGroup.add(bookcase);
makePlant(-1.75 - 0.3, 2.62, -6.28, 0.5, 0xd9a68f);
makePlant(-1.75 + 0.28, 2.62, -6.28, 0.42, 0xf2eee6);
FURNITURE.push({ x: -1.75, z: -6.2, hw: 0.6, hd: 0.25 });

// Small rugs under the beanbag and the desk chair
function roundRug(x, z, layers) {
  layers.forEach(([inner, outer, color, y]) => {
    const geo = inner > 0 ? new THREE.RingGeometry(inner, outer, 40) : new THREE.CircleGeometry(outer, 40);
    const m = new THREE.Mesh(geo, lambert(color));
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, y, z);
    insideGroup.add(m);
  });
}
roundRug(-4.9, -0.7, [
  [0, 1.2, 0xebdfc8, 0.016],
  [0.9, 1.05, MC.blush, 0.017],
  [0, 0.85, 0xf3e9d6, 0.018],
]);
roundRug(5.4, -1.35, [
  [0, 1.0, 0xd9cdb6, 0.016],
  [0.62, 0.78, MC.dusty, 0.017],
  [0, 0.6, 0xf0e8d6, 0.018],
]);

// Gallery prints on the slat wall
function frameArt(w, h, tex, x, y, z) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.BoxGeometry(w + 0.14, h + 0.14, 0.05), lambert(0x1f1d1c)));
  const mat = new THREE.Mesh(new THREE.PlaneGeometry(w + 0.06, h + 0.06), new THREE.MeshBasicMaterial({ color: 0xf1ead9 }));
  mat.position.z = 0.028;
  g.add(mat);
  const art = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex }));
  art.position.z = 0.034;
  g.add(art);
  g.position.set(x, y, z);
  insideGroup.add(g);
}

const vinylPrint = canvasTexture(200, 260, (g, w, h) => {
  g.fillStyle = "#e9dfc9";
  g.fillRect(0, 0, w, h);
  g.fillStyle = "#1c1c1c";
  g.beginPath();
  g.arc(w / 2, h / 2, 76, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "rgba(255,255,255,0.14)";
  for (let r = 30; r < 74; r += 8) {
    g.beginPath();
    g.arc(w / 2, h / 2, r, 0, Math.PI * 2);
    g.stroke();
  }
  g.fillStyle = "#c0582b";
  g.beginPath();
  g.arc(w / 2, h / 2, 22, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#e9dfc9";
  g.beginPath();
  g.arc(w / 2, h / 2, 4, 0, Math.PI * 2);
  g.fill();
});
const padPrint = canvasTexture(200, 260, (g, w, h) => {
  g.fillStyle = "#8ea4b8";
  g.fillRect(0, 0, w, h);
  g.fillStyle = "#2f3437";
  g.beginPath();
  g.roundRect(28, 96, 144, 70, 30);
  g.fill();
  g.fillStyle = "#e9dfc9";
  g.fillRect(52, 118, 30, 8);
  g.fillRect(63, 107, 8, 30);
  ["#e4574d", "#f0c05a", "#7fbf8a", "#c77dd6"].forEach((c, i) => {
    g.fillStyle = c;
    g.beginPath();
    g.arc(130 + (i % 2) * 16 - (i > 1 ? 8 : 0), 120 + (i > 1 ? 14 : -4) + (i % 2) * 0, 6, 0, Math.PI * 2);
    g.fill();
  });
});
const mountainPrint = canvasTexture(200, 260, (g, w, h) => {
  const sky = g.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#f2cfae");
  sky.addColorStop(1, "#e79f95");
  g.fillStyle = sky;
  g.fillRect(0, 0, w, h);
  g.fillStyle = "#b3627a";
  g.beginPath();
  g.moveTo(0, h);
  g.lineTo(0, 170);
  g.lineTo(70, 100);
  g.lineTo(130, 175);
  g.lineTo(w, 130);
  g.lineTo(w, h);
  g.fill();
  g.fillStyle = "#6d3f66";
  g.beginPath();
  g.moveTo(0, h);
  g.lineTo(0, 215);
  g.lineTo(90, 150);
  g.lineTo(w, 220);
  g.lineTo(w, h);
  g.fill();
  g.fillStyle = "#fbe6b8";
  g.beginPath();
  g.arc(140, 70, 24, 0, Math.PI * 2);
  g.fill();
});
const cassettePrint = canvasTexture(200, 260, (g, w, h) => {
  g.fillStyle = "#5f8f86";
  g.fillRect(0, 0, w, h);
  g.fillStyle = "#e9dfc9";
  g.beginPath();
  g.roundRect(26, 84, 148, 92, 8);
  g.fill();
  g.fillStyle = "#2f3437";
  g.fillRect(44, 100, 112, 34);
  g.fillStyle = "#e9dfc9";
  [72, 128].forEach((cx) => {
    g.beginPath();
    g.arc(cx, 117, 12, 0, Math.PI * 2);
    g.fill();
  });
  g.fillStyle = "#c0582b";
  g.fillRect(44, 146, 112, 6);
});
const moonPrint = canvasTexture(200, 260, (g, w, h) => {
  g.fillStyle = "#1e2447";
  g.fillRect(0, 0, w, h);
  g.fillStyle = "#f4ead0";
  g.beginPath();
  g.arc(100, 130, 52, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#1e2447";
  g.beginPath();
  g.arc(122, 116, 46, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#f4ead0";
  for (let i = 0; i < 14; i++) g.fillRect((i * 53) % w, (i * 37) % 80, 2, 2);
});
frameArt(0.5, 0.65, vinylPrint, -5.15, 3.75, -6.44);
frameArt(0.5, 0.65, padPrint, -4.4, 3.75, -6.44);
frameArt(0.5, 0.65, mountainPrint, -3.65, 3.75, -6.44);
frameArt(0.5, 0.65, cassettePrint, -0.65, 3.75, -6.44);
frameArt(0.5, 0.65, moonPrint, 0.65, 3.75, -6.44);

// Moonlight falling through the windows onto the floor (Henry's favorite napping spot)
const moonTex = canvasTexture(256, 512, (g, w, h) => {
  g.clearRect(0, 0, w, h);
  const cols = 2;
  const rows = 4;
  const gap = 12;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = (c * w) / cols + gap / 2;
      const y = (r * h) / rows + gap / 2;
      const fade = 1 - (r / rows) * 0.75;
      const grad = g.createLinearGradient(0, y, 0, y + h / rows);
      grad.addColorStop(0, `rgba(206, 224, 255, ${0.8 * fade})`);
      grad.addColorStop(1, `rgba(206, 224, 255, ${0.8 * (fade - 0.19)})`);
      g.fillStyle = grad;
      g.fillRect(x, y, w / cols - gap, h / rows - gap);
    }
  }
});
[3.95, 5.85].forEach((x) => {
  const beam = new THREE.Mesh(
    new THREE.PlaneGeometry(1.5, 2.9),
    new THREE.MeshBasicMaterial({ map: moonTex, transparent: true, opacity: 0.42, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  beam.rotation.x = -Math.PI / 2;
  beam.position.set(x, 0.024, -5.0);
  insideGroup.add(beam);
});

// ================= HENRY THE CAT =================
// A grey tabby who wanders the room, hops up on furniture and naps in different spots.

const henryFur = lambert(0x8a7d6b);
const henryStripe = lambert(0x2b2825);
const henryLight = lambert(0xe2d9c8);
const henryPink = lambert(0xc98f86);
const henryNoseMat = lambert(0xb78579);

const henry = new THREE.Group();
henry.scale.setScalar(1.6);
insideGroup.add(henry);
const henryRig = new THREE.Group();
henry.add(henryRig);

// Tabby fur painted as a texture: stripes wrap around the body, a dark spine line runs along
// the back, and the belly fades to cream. Spheres have their poles along z so the texture's
// horizontal axis goes around the body and vertical goes along it.
const makeFurTexture = (repeatY) => {
  const tex = canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = "#8a7d6b";
    g.fillRect(0, 0, w, h);
    const rnd = seededRandom(23);
    const bands = 5;
    for (let k = 0; k < bands; k++) {
      const cy = ((k + 0.5) * h) / bands;
      for (let x = 0; x < w; x += 8) {
        const th = 17 + rnd() * 8;
        g.fillStyle = "#3a322b";
        g.fillRect(x, cy - th / 2 + (rnd() - 0.5) * 6, 9, th);
      }
      const cy2 = ((k + 1) * h) / bands;
      for (let x = 0; x < w; x += 8) {
        g.fillStyle = "rgba(58, 50, 43, 0.55)";
        g.fillRect(x, cy2 - 2.5 + (rnd() - 0.5) * 4, 9, 5);
      }
    }
    g.fillStyle = "#2a2521";
    g.fillRect(w * 0.75 - 9, 0, 18, h);
    const belly = g.createLinearGradient(w * 0.06, 0, w * 0.44, 0);
    belly.addColorStop(0, "rgba(238, 231, 214, 0)");
    belly.addColorStop(0.45, "rgba(240, 234, 220, 1)");
    belly.addColorStop(0.55, "rgba(240, 234, 220, 1)");
    belly.addColorStop(1, "rgba(238, 231, 214, 0)");
    g.fillStyle = belly;
    g.fillRect(w * 0.06, 0, w * 0.38, h);
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, repeatY);
  return tex;
};
const furMatFor = (repeatY) => new THREE.MeshLambertMaterial({ map: makeFurTexture(repeatY) });

// Painted tabby markings for the legs and tail. The texture's horizontal axis wraps around the
// limb and the vertical axis runs along it. Stripes are wavy, heaviest on the outer side, thin
// out and break up toward a paler inner side, with a softer edge, thin secondary stripes and
// speckled fur grain so they read as fur markings rather than painted rings.
const makeMarkingTexture = ({ rows, seed, thick = 0.5 }) =>
  canvasTexture(128, 256, (g, w, h) => {
    const rnd = seededRandom(seed);
    g.fillStyle = "#8a7d6b";
    g.fillRect(0, 0, w, h);
    for (let n = 0; n < 800; n++) {
      g.fillStyle = rnd() < 0.5 ? "rgba(170, 157, 136, 0.2)" : "rgba(88, 78, 64, 0.22)";
      g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 2, 2 + rnd() * 5);
    }

    const pitch = h / rows;
    const step = 2;
    for (let k = 0; k < rows; k++) {
      const cy0 = (k + 0.5) * pitch + (rnd() - 0.5) * pitch * 0.2;
      const phase = rnd() * Math.PI * 2;
      let gap = 0;
      for (let x = 0; x < w; x += step) {
        if (gap > 0) {
          gap--;
          continue;
        }
        const outer = 0.5 + 0.5 * Math.cos((x / w) * Math.PI * 2);
        const weight = 0.45 + 0.55 * outer;
        if (weight < 0.7 && rnd() < 0.1) {
          gap = 1 + Math.floor(rnd() * 3);
          continue;
        }
        const cy = cy0 + Math.sin(x * 0.09 + phase) * pitch * 0.08 + (rnd() - 0.5) * 1.6;
        const th = pitch * thick * weight * (0.8 + rnd() * 0.45);
        g.fillStyle = "rgba(48, 40, 34, 0.35)";
        g.fillRect(x, cy - th / 2 - 2.5, step + 0.5, th + 5);
        g.fillStyle = "#2f2822";
        g.fillRect(x, cy - th / 2 + (rnd() - 0.5) * 2, step + 0.5, th + (rnd() - 0.5) * 2);
      }
      // A thinner, broken stripe between the main ones
      if (rnd() < 0.7) {
        const y = cy0 + pitch * 0.5;
        for (let x = rnd() * 20; x < w; x += 18 + rnd() * 30) {
          g.fillStyle = "rgba(52, 44, 37, 0.55)";
          g.fillRect(x, y + (rnd() - 0.5) * 3, 8 + rnd() * 14, 2 + rnd() * 2);
        }
      }
    }

    const inner = g.createLinearGradient(w * 0.32, 0, w * 0.68, 0);
    inner.addColorStop(0, "rgba(226, 217, 200, 0)");
    inner.addColorStop(0.5, "rgba(226, 217, 200, 0.3)");
    inner.addColorStop(1, "rgba(226, 217, 200, 0)");
    g.fillStyle = inner;
    g.fillRect(w * 0.32, 0, w * 0.36, h);
  });
const markMat = (opts) => new THREE.MeshLambertMaterial({ map: makeMarkingTexture(opts) });

// Tail markings: full rings that wrap all the way around, wobbling and a little thicker along the
// top, with thin broken rings between them, a dark line down the spine and a paler underside.
// The horizontal axis goes around the tail (top of the tail is the middle) and vertical runs along it.
const makeTailTexture = ({ seed, thick, tip = false }) =>
  canvasTexture(256, 256, (g, w, h) => {
    const rnd = seededRandom(seed);
    const TAU = Math.PI * 2;
    g.fillStyle = tip ? "#2b2825" : "#8a7d6b";
    g.fillRect(0, 0, w, h);
    for (let n = 0; n < 1400; n++) {
      g.fillStyle = tip
        ? rnd() < 0.5 ? "rgba(92, 80, 68, 0.3)" : "rgba(10, 8, 7, 0.4)"
        : rnd() < 0.5 ? "rgba(170, 157, 136, 0.2)" : "rgba(88, 78, 64, 0.24)";
      g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 2, 2 + rnd() * 5);
    }
    if (tip) return;

    const rows = 3;
    const pitch = h / rows;
    const step = 2;
    for (let k = 0; k < rows; k++) {
      const cy0 = (k + 0.5) * pitch + (rnd() - 0.5) * pitch * 0.16;
      const phase = rnd() * TAU;
      const phase2 = rnd() * TAU;
      for (let x = 0; x < w; x += step) {
        const top = 0.5 - 0.5 * Math.cos((x / w) * TAU);
        const weight = 0.72 + 0.28 * top;
        const cy = cy0 + Math.sin((x / w) * TAU * 2 + phase) * pitch * 0.07 + Math.sin((x / w) * TAU * 5 + phase2) * pitch * 0.025;
        const th = pitch * thick * weight * (0.85 + rnd() * 0.3);
        g.fillStyle = "rgba(48, 40, 34, 0.3)";
        g.fillRect(x, cy - th / 2 - 3.5, step + 0.5, th + 7);
        g.fillStyle = "#2c2520";
        g.fillRect(x, cy - th / 2 + (rnd() - 0.5) * 2.5, step + 0.5, th + (rnd() - 0.5) * 2.5);
        // Stray dark hairs feathering the edge of the ring
        if (rnd() < 0.35) {
          g.fillStyle = "rgba(44, 37, 32, 0.55)";
          const dir = rnd() < 0.5 ? -1 : 1;
          g.fillRect(x, dir < 0 ? cy - th / 2 - 5 - rnd() * 3 : cy + th / 2 + 1, 1, 4 + rnd() * 3);
        }
      }
      // A thin broken ring between the main ones
      const y = cy0 + pitch * 0.5;
      for (let x = rnd() * 30; x < w; x += 24 + rnd() * 50) {
        g.fillStyle = "rgba(52, 44, 37, 0.5)";
        g.fillRect(x, y + (rnd() - 0.5) * 3, 14 + rnd() * 28, 2.5 + rnd() * 2);
      }
    }

    // Dark line down the spine
    for (let y = 0; y < h; y += 3) {
      g.fillStyle = "rgba(38, 31, 26, 0.7)";
      const wob = Math.sin(y * 0.08) * 2;
      g.fillRect(w / 2 - 7 + wob, y, 14 + (rnd() - 0.5) * 3, 3.5);
    }

    // Paler underside
    [[0, w * 0.2], [w * 0.8, w]].forEach(([x0, x1], side) => {
      const belly = g.createLinearGradient(x0, 0, x1, 0);
      belly.addColorStop(side ? 0 : 1, "rgba(226, 217, 200, 0)");
      belly.addColorStop(side ? 1 : 0, "rgba(226, 217, 200, 0.35)");
      g.fillStyle = belly;
      g.fillRect(x0, 0, x1 - x0, h);
    });
  });

const henryWhite = lambert(0xf7f2e8);
const henryTorso = new THREE.Group();
henryRig.add(henryTorso);
const torsoPart = (r, sx, sy, sz, x, y, z, mat = henryFur, alongZ = false) => {
  const geo = new THREE.SphereGeometry(r, 20, 14);
  if (alongZ) geo.rotateX(Math.PI / 2);
  const m = new THREE.Mesh(geo, mat);
  m.scale.set(sx, sy, sz);
  m.position.set(x, y, z);
  henryTorso.add(m);
  return m;
};
torsoPart(0.118, 0.95, 1.08, 1.15, 0, 0.005, 0.14, furMatFor(1), true); // chest and shoulders
torsoPart(0.098, 0.9, 0.95, 1.7, 0, -0.005, 0.0, furMatFor(1.4), true); // waist
torsoPart(0.128, 1.0, 1.0, 1.08, 0, 0.01, -0.14, furMatFor(1), true); // haunches
torsoPart(0.075, 1, 1.05, 1.25, 0, 0.055, 0.235); // neck base
torsoPart(0.088, 0.88, 1.1, 1.0, 0, -0.045, 0.2, henryWhite); // white chest bib
const henryBelly = new THREE.Mesh(new THREE.CapsuleGeometry(0.04, 0.24, 4, 8), henryWhite);
henryBelly.rotation.x = Math.PI / 2;
henryBelly.scale.set(1, 1, 0.55);
henryBelly.position.set(0, -0.095, 0.06);
henryTorso.add(henryBelly);

const henryHead = new THREE.Group();
henryRig.add(henryHead);
const skull = new THREE.Mesh(new THREE.SphereGeometry(0.105, 14, 12), henryFur);
skull.scale.set(1.1, 0.95, 1);
henryHead.add(skull);
const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.048, 10, 8), henryLight);
muzzle.scale.set(1.2, 0.85, 1);
muzzle.position.set(0, -0.03, 0.085);
henryHead.add(muzzle);
const nose = new THREE.Mesh(new THREE.SphereGeometry(0.015, 8, 6), henryNoseMat);
nose.position.set(0, -0.005, 0.13);
henryHead.add(nose);
const henryMouth = new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 6), lambert(0x6b2f36));
henryMouth.scale.set(1, 0.04, 0.8);
henryMouth.position.set(0, -0.052, 0.112);
henryHead.add(henryMouth);
[-1, 1].forEach((s) => {
  const ear = new THREE.Mesh(new THREE.ConeGeometry(0.052, 0.125, 4), henryFur);
  ear.position.set(s * 0.075, 0.125, -0.005);
  ear.rotation.z = -s * 0.22;
  henryHead.add(ear);
  const inner = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.085, 4), henryPink);
  inner.position.set(s * 0.075, 0.118, 0.014);
  inner.rotation.z = -s * 0.22;
  henryHead.add(inner);
  for (let k = 0; k < 2; k++) {
    const cheek = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.007, 0.006), henryStripe);
    cheek.position.set(s * 0.085, 0.015 - k * 0.022, 0.075);
    cheek.rotation.z = s * (0.35 - k * 0.5);
    cheek.rotation.y = -s * 0.5;
    henryHead.add(cheek);
  }
  for (let k = 0; k < 3; k++) {
    const whisker = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.003, 0.003), henryLight);
    whisker.position.set(s * 0.09, -0.02 - k * 0.012, 0.11);
    whisker.rotation.z = s * (0.15 - k * 0.15);
    henryHead.add(whisker);
  }
});
const henryEyes = [];
[-1, 1].forEach((s) => {
  const eye = new THREE.Mesh(new THREE.CircleGeometry(0.024, 12), new THREE.MeshBasicMaterial({ color: 0x9dbb8a }));
  eye.position.set(s * 0.05, 0.025, 0.1);
  henryHead.add(eye);
  const pupil = new THREE.Mesh(new THREE.BoxGeometry(0.007, 0.03, 0.002), new THREE.MeshBasicMaterial({ color: 0x1e1e22 }));
  pupil.position.set(s * 0.05, 0.025, 0.102);
  henryHead.add(pupil);
  henryEyes.push(eye, pupil);
});
for (let k = -1; k <= 1; k++) {
  const mark = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.008, 0.05), henryStripe);
  mark.position.set(k * 0.03, 0.097, 0.03);
  mark.rotation.x = -0.15;
  mark.rotation.z = -k * 0.15;
  henryHead.add(mark);
}

const henryTail = [];
let tailParent = new THREE.Group();
const henryTailRoot = tailParent;
tailParent.position.set(0, 0.05, -0.27);
henryRig.add(tailParent);
const tailJointMat = lambert(0x5a4f43);
for (let i = 0; i < 5; i++) {
  // Tapered tube whose texture runs evenly along its length, so the rings wrap around the tail.
  // Rings get heavier toward the tip, and the last segment is solid dark.
  const tailMat = new THREE.MeshLambertMaterial({ map: makeTailTexture({ seed: 61 + i * 7, thick: 0.4 + i * 0.07, tip: i === 4 }) });
  const rProx = 0.029 - i * 0.0025;
  const rDist = 0.029 - (i + 1) * 0.0025;
  const tubeGeo = new THREE.CylinderGeometry(rProx, rDist, 0.09, 18, 1, true);
  tubeGeo.rotateX(Math.PI / 2);
  const seg = new THREE.Mesh(tubeGeo, tailMat);
  seg.position.z = -0.045;
  tailParent.add(seg);
  // Round joint so the tube stays closed when the tail bends
  const joint = new THREE.Mesh(new THREE.SphereGeometry(rDist * 1.02, 12, 10), i === 4 ? tailMat : tailJointMat);
  joint.position.z = -0.09;
  tailParent.add(joint);
  const next = new THREE.Group();
  next.position.z = -0.09;
  tailParent.add(next);
  henryTail.push(tailParent);
  tailParent = next;
}

const henryLegs = [];
[
  [-0.07, 0.17],
  [0.07, 0.17],
  [-0.09, -0.15],
  [0.09, -0.15],
].forEach(([x, z], i) => {
  const front = i < 2;
  const pivot = new THREE.Group();
  pivot.position.set(x, -0.07, z);

  // Each leg gets its own painted markings (different seed per leg so they don't all match)
  const marks = (rows, thick = 0.5) => markMat({ rows, thick, seed: 101 + i * 13 + rows * 3 });
  const limb = (parent, rTop, rBottom, len, mat) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, len, 12), mat);
    m.position.y = -len / 2;
    parent.add(m);
    return m;
  };
  const jointBall = (parent, r) => parent.add(new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), henryFur));

  // Paw: a soft pad with little toes, kept mostly flat on the floor by the animation
  const makePaw = (parent, y) => {
    const paw = new THREE.Group();
    paw.position.y = y;
    parent.add(paw);
    const pad = new THREE.Mesh(new THREE.SphereGeometry(0.032, 10, 8), henryFur);
    pad.scale.set(1, 0.6, 1.4);
    pad.position.set(0, -0.006, 0.014);
    paw.add(pad);
    [-1, 0, 1].forEach((k) => {
      const toe = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 5), front ? henryLight : henryFur);
      toe.scale.set(1, 0.8, 1.1);
      toe.position.set(k * 0.018, -0.011, 0.046 - Math.abs(k) * 0.006);
      paw.add(toe);
    });
    return paw;
  };

  const leg = { pivot, phase: i === 0 || i === 3 ? 0 : Math.PI, front, baseZ: z };
  if (front) {
    // Shoulder, upper arm, elbow, forearm, paw
    const upperLen = 0.095;
    const foreLen = 0.11;
    limb(pivot, 0.034, 0.025, upperLen, marks(3));
    const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.038, 12, 10), marks(4, 0.46));
    shoulder.scale.set(0.9, 1.3, 1.15);
    shoulder.position.y = -0.03;
    pivot.add(shoulder);
    const elbow = new THREE.Group();
    elbow.position.y = -upperLen;
    pivot.add(elbow);
    jointBall(elbow, 0.026);
    limb(elbow, 0.024, 0.017, foreLen, marks(4, 0.46));
    leg.knee = elbow;
    leg.paw = makePaw(elbow, -foreLen);
    // Elbow tucked back, forearm dropping straight down
    leg.baseUp = 0.2;
    leg.baseKnee = -0.2;
  } else {
    // Big thigh, shin angled back to the heel, then the long foot bone forward to the paw
    const thighLen = 0.088;
    const shinLen = 0.088;
    const footLen = 0.078;
    limb(pivot, 0.04, 0.026, thighLen, marks(2));
    const thigh = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 12), marks(5, 0.46));
    thigh.scale.set(0.85, 1.6, 1.25);
    thigh.position.set(0, -0.04, -0.006);
    pivot.add(thigh);
    const knee = new THREE.Group();
    knee.position.y = -thighLen;
    pivot.add(knee);
    jointBall(knee, 0.026);
    limb(knee, 0.026, 0.02, shinLen, marks(4, 0.46));
    const hock = new THREE.Group();
    hock.position.y = -shinLen;
    knee.add(hock);
    jointBall(hock, 0.021);
    limb(hock, 0.019, 0.015, footLen, marks(3, 0.44));
    leg.knee = knee;
    leg.hock = hock;
    leg.paw = makePaw(hock, -footLen);
    leg.baseUp = -0.55;
    leg.baseKnee = 1.3;
    leg.baseHock = -0.95;
  }
  henryRig.add(pivot);
  henryLegs.push(leg);
});

// Floor waypoints Henry walks between (checked against furniture so he never cuts through it)
const HENRY_NODE_DEFS = {
  front: [0.3, 3.0],
  left: [-2.6, 2.8],
  right: [2.7, 2.9],
  beanApproach: [-3.7, 0.4],
  leftMid: [-3.4, -2.7],
  sideboardFront: [-3.3, -4.8],
  crateMid: [0, -3.6],
  rightBack: [2.6, -3.6],
  sun: [3.9, -4.6],
  rightMid: [3.6, -2.8],
  eastStrip: [5.5, -0.2],
  armApproach: [3.4, 2.4],
  sofaFrontL: [-0.9, 0.5],
  deskApproach: [4.3, -1.1],
  behindSofa: [0.5, -2.4],
  sofaFrontR: [1.6, 0.55],
  ottApproach: [0.3, 2.55],
  rugSpot: [-2.4, 1.3],
  crateSeat: [1.6, -4.3],
};
const nodeNames = Object.keys(HENRY_NODE_DEFS);
const henryNodes = nodeNames.map((n) => new THREE.Vector3(HENRY_NODE_DEFS[n][0], 0, HENRY_NODE_DEFS[n][1]));
const nodeIndex = Object.fromEntries(nodeNames.map((n, i) => [n, i]));

function segmentClear(a, b) {
  const steps = Math.ceil(a.distanceTo(b) / 0.1);
  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    const x = a.x + (b.x - a.x) * t;
    const z = a.z + (b.z - a.z) * t;
    if (FURNITURE.some((f) => Math.abs(x - f.x) < f.hw + 0.12 && Math.abs(z - f.z) < f.hd + 0.12)) return false;
  }
  return true;
}
const henryEdges = henryNodes.map(() => []);
for (let i = 0; i < henryNodes.length; i++) {
  for (let j = i + 1; j < henryNodes.length; j++) {
    const d = henryNodes[i].distanceTo(henryNodes[j]);
    if (d < 6.5 && segmentClear(henryNodes[i], henryNodes[j])) {
      henryEdges[i].push([j, d]);
      henryEdges[j].push([i, d]);
    }
  }
}

function henryPath(from, to) {
  const dist = henryNodes.map(() => Infinity);
  const prev = henryNodes.map(() => -1);
  const open = new Set(henryNodes.map((_, i) => i));
  dist[from] = 0;
  while (open.size) {
    let u = -1;
    open.forEach((i) => {
      if (u === -1 || dist[i] < dist[u]) u = i;
    });
    if (dist[u] === Infinity || u === to) break;
    open.delete(u);
    henryEdges[u].forEach(([v, w]) => {
      if (dist[u] + w < dist[v]) {
        dist[v] = dist[u] + w;
        prev[v] = u;
      }
    });
  }
  const path = [];
  for (let n = to; n !== -1 && n !== from; n = prev[n]) path.unshift(n);
  return dist[to] === Infinity ? null : path;
}

insideGroup.updateMatrixWorld(true);
const worldOf = (obj, x, y, z) => obj.localToWorld(new THREE.Vector3(x, y, z));
const floorAt = (name, y = 0.012) => new THREE.Vector3(henryNodes[nodeIndex[name]].x, y, henryNodes[nodeIndex[name]].z);

const HENRY_SPOTS = [
  { name: "armchair", kind: "sleep", elevated: true, approach: nodeIndex.armApproach, pos: worldOf(armchair, 0.1, 0.8, 0.12), heading: -0.5 },
  { name: "sofaLeft", kind: "stretch", elevated: true, approach: nodeIndex.sofaFrontL, pos: worldOf(sofa, -0.99, 0.8, 0.1), heading: 0.3 },
  { name: "sofaRight", kind: "sit", elevated: true, approach: nodeIndex.sofaFrontR, pos: worldOf(sofa, 0.99, 0.8, 0.1), heading: -0.25 },
  { name: "ottoman", kind: "stretch", elevated: true, approach: nodeIndex.ottApproach, pos: new THREE.Vector3(-0.35, 0.7, 1.45), heading: 0.4 },
  { name: "beanbag", kind: "sleep", elevated: true, approach: nodeIndex.beanApproach, pos: new THREE.Vector3(-4.9, 0.74, -0.7), heading: 1.0 },
  { name: "deskChair", kind: "sit", elevated: true, approach: nodeIndex.deskApproach, pos: worldOf(deskGroup, 0, 0.56, 0.95), heading: 0.2 },
  { name: "sunbeam", kind: "sleep", elevated: false, approach: nodeIndex.sun, pos: floorAt("sun"), heading: 2.2 },
  { name: "rug", kind: "stretch", elevated: false, approach: nodeIndex.rugSpot, pos: floorAt("rugSpot", 0.015), heading: -0.8 },
  { name: "crateWatch", kind: "sit", elevated: false, approach: nodeIndex.crateSeat, pos: floorAt("crateSeat"), heading: Math.PI },
];

const henryAI = {
  mode: "rest",
  spot: HENRY_SPOTS[0],
  node: HENRY_SPOTS[0].approach,
  path: [],
  target: null,
  timer: 25,
  jump: null,
  purr: 0,
  blinkIn: 3,
  blinkFor: 0,
  followTimer: 0,
  followNode: -1,
  followCooldown: 25,
  attending: false,
  yawIn: 10,
  yawT: 0,
  activity: "sleep",
  snap: false,
  energy: 0.4,
};
const henryPose = { crouch: 1, sleep: 1, walk: 0, phase: 0, stretch: 0, yawn: 0, curl: 1 };
henry.position.copy(HENRY_SPOTS[0].pos);
henry.rotation.y = HENRY_SPOTS[0].heading;

// "prrr" bubble, sleeping zzz, and the pet interaction
const petEl = document.createElement("div");
petEl.className = "henry-bubble";
petEl.textContent = "prrr ♥";
const petObj = new CSS2DObject(petEl);
petObj.position.set(0, 1.02, 0);
henry.add(petObj);
insideLabels.push(petObj);
const zzzEl = document.createElement("div");
zzzEl.className = "henry-zzz";
zzzEl.textContent = "z z z";
const zzzObj = new CSS2DObject(zzzEl);
zzzObj.position.set(0, 0.9, 0);
henry.add(zzzObj);
insideLabels.push(zzzObj);
const nameEl = document.createElement("div");
nameEl.className = "henry-name";
nameEl.textContent = "Henry";
const nameObj = new CSS2DObject(nameEl);
nameObj.position.set(0, 0.64, 0);
henry.add(nameObj);
insideLabels.push(nameObj);
let petTimer = null;

function petHenry() {
  const ai = henryAI;
  ai.purr = 3;
  ai.timer += 6;
  petEl.classList.add("show");
  clearTimeout(petTimer);
  petTimer = setTimeout(() => petEl.classList.remove("show"), 2200);
  const asleep = ai.mode === "rest" && ai.activity === "sleep";
  if (!asleep && ai.mode !== "jump" && Math.random() < 0.6) startHenryFollow(14 + Math.random() * 8);
}

const nearestHenryNode = (pos) => {
  let best = 0;
  let bestD = Infinity;
  henryNodes.forEach((n, i) => {
    const d = Math.hypot(n.x - pos.x, n.z - pos.z);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  });
  return best;
};

// A pseudo-spot for when Henry is standing on the floor and not tied to a piece of furniture
const floorSpotFor = (nodeIdx) => ({
  name: "floor",
  kind: "sit",
  elevated: false,
  approach: nodeIdx,
  pos: henryNodes[nodeIdx].clone(),
  heading: henry.rotation.y,
});

function startHenryFollow(duration) {
  const ai = henryAI;
  ai.followTimer = duration;
  ai.followNode = -1;
  ai.attending = false;
  ai.followCooldown = 22 + 30 * (1 - ai.energy);
  if (ai.spot.elevated) {
    ai.node = ai.spot.approach;
    ai.spot = floorSpotFor(ai.node);
    startHenryJump(henry.position, henryNodes[ai.node], "follow");
  } else {
    ai.node = nearestHenryNode(henry.position);
    ai.spot = floorSpotFor(ai.node);
    ai.mode = "follow";
  }
}

function startHenryJump(from, to, next) {
  henryAI.mode = "jump";
  henryAI.jump = { from: from.clone(), to: to.clone(), t: 0, dur: 0.75, arc: 0.4, next };
}

function beginHenryWalk() {
  const path = henryPath(henryAI.node, henryAI.target.approach);
  henryAI.path = path || [];
  henryAI.mode = "walk";
}

function startHenryTrip() {
  const sleepy = 1 - henryAI.energy;
  henryAI.target = pickWeighted(
    HENRY_SPOTS.filter((s) => s !== henryAI.spot).map((s) => [s, s.weight * (1 + sleepy * s.likes.sleep * 1.5)])
  );
  if (henryAI.spot.elevated) {
    henryAI.node = henryAI.spot.approach;
    startHenryJump(henry.position, henryNodes[henryAI.node], "walk");
  } else {
    henryAI.node = henryAI.spot.approach;
    beginHenryWalk();
  }
}

// Henry's tastes: which spots he favors, what he likes to do there, and how he sleeps
const SPOT_PERSONALITY = {
  sunbeam: { weight: 2.4, likes: { sleep: 0.85, sit: 0.05, stretch: 0.1 } },
  armchair: { weight: 1.5, likes: { sleep: 0.6, sit: 0.25, stretch: 0.15 } },
  beanbag: { weight: 1.1, likes: { sleep: 0.55, sit: 0.2, stretch: 0.25 } },
  sofaLeft: { weight: 1.2, likes: { sleep: 0.3, sit: 0.2, stretch: 0.5 } },
  sofaRight: { weight: 1, likes: { sleep: 0.25, sit: 0.5, stretch: 0.25 } },
  ottoman: { weight: 0.9, likes: { sleep: 0.2, sit: 0.3, stretch: 0.5 } },
  deskChair: { weight: 0.9, likes: { sleep: 0.25, sit: 0.6, stretch: 0.15 } },
  rug: { weight: 1.1, likes: { sleep: 0.3, sit: 0.2, stretch: 0.5 } },
  crateWatch: { weight: 1, likes: { sleep: 0.1, sit: 0.75, stretch: 0.15 } },
};
HENRY_SPOTS.forEach((s) => Object.assign(s, SPOT_PERSONALITY[s.name]));

const pickWeighted = (entries) => {
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let r = Math.random() * total;
  for (const [value, w] of entries) {
    r -= w;
    if (r <= 0) return value;
  }
  return entries[entries.length - 1][0];
};

function settleHenry(spot) {
  const ai = henryAI;
  ai.spot = spot;
  ai.node = spot.approach;
  ai.mode = "rest";
  const sleepy = 1 - ai.energy;
  // He gets sleepier the longer he's been up; energetic Henry lounges awake
  ai.activity = pickWeighted([
    ["sleep", spot.likes.sleep * (0.25 + 0.9 * sleepy)],
    ["sit", spot.likes.sit],
    ["stretch", spot.likes.stretch],
  ]);
  ai.timer =
    ai.activity === "sleep" ? (22 + Math.random() * 32) * (0.6 + 0.6 * sleepy) : (8 + Math.random() * 12) * (0.6 + 0.6 * ai.energy);
}

// Each time the player enters the house Henry is doing something different
function randomizeHenry() {
  const ai = henryAI;
  const roll = Math.random();
  clearTimeout(petTimer);
  petEl.classList.remove("show");
  ai.snap = true;
  ai.energy = 1;
  ai.followCooldown = 3 + Math.random() * 6;
  ai.yawIn = 4 + Math.random() * 12;
  ai.attending = false;
  ai.path = [];
  if (roll < 0.4) {
    // Already settled somewhere, mostly awake right now
    const spot = pickWeighted(HENRY_SPOTS.map((s) => [s, s.weight]));
    henry.position.copy(spot.pos);
    henry.rotation.y = spot.heading + (Math.random() - 0.5) * 0.6;
    settleHenry(spot);
    ai.timer *= 0.4 + Math.random() * 0.8;
  } else {
    // Up and about: somewhere on the floor, either coming to say hi or heading to a spot
    const nodeIdx = Math.floor(Math.random() * henryNodes.length);
    henry.position.copy(henryNodes[nodeIdx]);
    henry.position.y = 0.012;
    ai.node = nodeIdx;
    ai.spot = floorSpotFor(nodeIdx);
    ai.mode = "rest";
    if (roll < 0.7) startHenryFollow(10 + Math.random() * 8);
    else startHenryTrip();
  }
}

const wrapPi = (a) => Math.atan2(Math.sin(a), Math.cos(a));

function updateHenry(delta, t) {
  const ai = henryAI;
  const pose = henryPose;
  const ease = ai.snap ? 1 : 1 - Math.pow(0.02, delta);
  let desiredYaw = henry.rotation.y;
  let moving = 0;

  const playerDist = Math.hypot(character.position.x - henry.position.x, character.position.z - henry.position.z);
  ai.followCooldown = Math.max(0, ai.followCooldown - delta);
  ai.energy = Math.max(0, ai.energy - delta / 100);

  if (ai.mode === "rest") {
    desiredYaw = ai.spot.heading;
    ai.timer -= delta;
    const awake = ai.activity !== "sleep";
    // Wander over to greet the player when they come close
    if (awake && !browsing && ai.followCooldown === 0 && playerDist < 3.4 && Math.random() < delta * (0.12 + 0.4 * ai.energy)) {
      startHenryFollow(12 + Math.random() * 8);
    } else if (ai.timer <= 0) startHenryTrip();
  } else if (ai.mode === "follow") {
    ai.followTimer -= delta;
    const pNode = nearestHenryNode(character.position);
    if (pNode !== ai.followNode) {
      ai.followNode = pNode;
      ai.path = henryPath(ai.node, pNode) || [];
      ai.attending = false;
    }
    const nextIdx = ai.path[0];
    if (nextIdx === undefined) {
      ai.attending = true;
      desiredYaw = Math.atan2(character.position.x - henry.position.x, character.position.z - henry.position.z);
    } else {
      const wp = henryNodes[nextIdx];
      const dx = wp.x - henry.position.x;
      const dz = wp.z - henry.position.z;
      const dist = Math.hypot(dx, dz);
      if (dist < 0.08) {
        ai.node = nextIdx;
        ai.path.shift();
      } else {
        const step = Math.min(1.05 * delta, dist);
        henry.position.x += (dx / dist) * step;
        henry.position.z += (dz / dist) * step;
        henry.position.y += (0.012 - henry.position.y) * ease;
        desiredYaw = Math.atan2(dx, dz);
        moving = 1;
      }
    }
    if (ai.followTimer <= 0 || browsing) {
      ai.attending = false;
      ai.spot = floorSpotFor(ai.node);
      startHenryTrip();
    }
  } else if (ai.mode === "walk") {
    const nextIdx = ai.path[0];
    if (nextIdx === undefined) {
      if (ai.target.elevated) startHenryJump(henry.position, ai.target.pos, "rest");
      else {
        henry.position.copy(ai.target.pos);
        settleHenry(ai.target);
      }
    } else {
      const wp = henryNodes[nextIdx];
      const dx = wp.x - henry.position.x;
      const dz = wp.z - henry.position.z;
      const dist = Math.hypot(dx, dz);
      if (dist < 0.08) {
        ai.node = nextIdx;
        ai.path.shift();
      } else {
        const step = Math.min(0.85 * delta, dist);
        henry.position.x += (dx / dist) * step;
        henry.position.z += (dz / dist) * step;
        henry.position.y += (0.012 - henry.position.y) * ease;
        desiredYaw = Math.atan2(dx, dz);
        moving = 1;
      }
    }
  } else if (ai.mode === "jump") {
    const j = ai.jump;
    j.t += delta / j.dur;
    const k = Math.min(j.t, 1);
    henry.position.lerpVectors(j.from, j.to, k);
    henry.position.y += Math.sin(Math.PI * k) * j.arc;
    desiredYaw = Math.atan2(j.to.x - j.from.x, j.to.z - j.from.z);
    if (k >= 1) {
      if (j.next === "walk") beginHenryWalk();
      else if (j.next === "follow") {
        ai.mode = "follow";
        ai.followNode = -1;
      } else {
        henry.position.copy(j.to);
        settleHenry(ai.target);
      }
    }
  }

  if (!ai.snap) henry.rotation.y += wrapPi(desiredYaw - henry.rotation.y) * Math.min(delta * 6, 1);

  const resting = ai.mode === "rest" || (ai.mode === "follow" && ai.attending);
  const sleeping = ai.mode === "rest" && ai.activity === "sleep";
  const stretching = ai.mode === "rest" && ai.activity === "stretch";

  // Occasional yawn while awake and settled
  if (resting && !sleeping) {
    ai.yawIn -= delta;
    if (ai.yawIn <= 0 && ai.yawT <= 0) {
      ai.yawT = 1.7;
      ai.yawIn = 9 + Math.random() * 14;
    }
  }
  ai.yawT = Math.max(0, ai.yawT - delta);
  const yawnTarget = ai.yawT > 0 ? Math.sin(Math.PI * (1 - ai.yawT / 1.7)) : 0;
  pose.yawn += (yawnTarget - pose.yawn) * Math.min(delta * 12, 1);
  henryMouth.scale.set(1 + 0.3 * pose.yawn, 0.04 + 0.95 * pose.yawn, 0.8);
  henryMouth.position.y = -0.052 - 0.012 * pose.yawn;
  pose.crouch += ((resting ? 1 : ai.mode === "jump" ? 0.2 : 0) - pose.crouch) * ease;
  pose.sleep += ((sleeping ? 1 : 0) - pose.sleep) * ease;
  pose.stretch += ((stretching ? 1 : 0) - pose.stretch) * ease;
  pose.curl += ((sleeping ? 1 : 0) - pose.curl) * ease;
  pose.walk += (moving - pose.walk) * ease;
  if (moving) pose.phase += delta * 9;

  const breathRate = ai.purr > 0 ? 7 : 1.7;
  ai.purr = Math.max(0, ai.purr - delta);
  const breath = Math.sin(t * breathRate);
  const bob = Math.abs(Math.sin(pose.phase)) * 0.014 * pose.walk;
  henryRig.position.y = THREE.MathUtils.lerp(0.3, 0.13, pose.crouch) + bob;

  // Body shape: long and lean when walking or stretched, a compact rounded loaf when settled,
  // and a tight ball when curled up asleep
  const loaf = pose.crouch * (1 - pose.sleep) * (1 - pose.stretch);
  const sleepZ = 0.64;
  const torsoZ = THREE.MathUtils.lerp(
    THREE.MathUtils.lerp(THREE.MathUtils.lerp(1, 0.72, pose.crouch), 1.0, pose.stretch),
    sleepZ,
    pose.sleep
  );
  const torsoS = 1 + 0.08 * loaf + 0.03 * breath * pose.crouch + 0.1 * pose.curl;
  henryTorso.scale.set(torsoS, torsoS, torsoZ);
  // Walking shifts his weight side to side and twists the spine a little
  henryTorso.rotation.y = Math.sin(pose.phase) * 0.06 * pose.walk;
  henryTorso.rotation.z = Math.sin(pose.phase + Math.PI / 2) * 0.04 * pose.walk;
  henryTailRoot.position.z = -0.27 * torsoZ;

  henryLegs.forEach((leg) => {
    const extend = leg.front ? pose.stretch : 0;
    const tuck = leg.front ? loaf : 0;
    const settled = THREE.MathUtils.lerp(1, 0.28, pose.crouch);
    const laidOut = THREE.MathUtils.lerp(THREE.MathUtils.lerp(settled, 0.42, tuck), 1.5, extend);
    leg.pivot.scale.y = laidOut;
    leg.pivot.position.z = leg.baseZ * torsoZ;
    const legPhase = pose.phase + leg.phase;
    const jumping = (ai.mode === "jump" ? 1 : 0) * (1 - pose.crouch);
    // Settled cats fold their legs away, so the resting zigzag fades out as he loafs or stretches
    const bendScale = (1 - pose.crouch * 0.9) * (1 - extend);
    // Swing phase (foot moving forward) lifts the paw by folding the knee; stance stays straight
    const lift = Math.max(0, -Math.cos(legPhase)) * pose.walk;
    const hipRot =
      leg.baseUp * bendScale +
      Math.sin(legPhase) * (leg.front ? 0.6 : 0.7) * pose.walk -
      0.35 * jumping -
      1.5 * extend -
      1.4 * tuck;
    const kneeRot = leg.baseKnee * bendScale + lift * (leg.front ? 1.0 : 0.9) + 0.6 * jumping;
    leg.pivot.rotation.x = hipRot;
    leg.knee.rotation.x = kneeRot;
    let hockRot = 0;
    if (leg.hock) {
      // The heel folds up as the foot swings forward, and pushes off straight behind
      const push = Math.max(0, Math.cos(legPhase)) * pose.walk;
      hockRot = leg.baseHock * bendScale - lift * 0.75 + push * 0.3;
      leg.hock.rotation.x = hockRot;
    }
    // Counter-rotate the paw so it stays mostly flat, rolling up onto the toes as it lifts
    leg.paw.rotation.x = -(hipRot + kneeRot + hockRot) * 0.8 + 0.35 * lift;
  });

  const M = THREE.MathUtils;
  let headY = M.lerp(M.lerp(0.07, 0.0, pose.sleep), 0.04, pose.stretch);
  let headZ = M.lerp(0.28, 0.21, pose.sleep) + 0.02 * pose.stretch - (1 - torsoZ) * 0.25;
  let headX = 0;
  let headRx = 0.65 * pose.sleep + 0.2 * pose.stretch - 0.55 * pose.yawn + Math.sin(pose.phase * 2) * 0.03 * pose.walk;
  let headRy = 0.5 * pose.sleep;
  let headRz = 0;
  // Curled: head tucked round toward his tail, chin resting down
  headX = M.lerp(headX, 0.075, pose.curl);
  headY = M.lerp(headY, -0.015, pose.curl);
  headZ = M.lerp(headZ, 0.1, pose.curl);
  headRx = M.lerp(headRx, 0.55, pose.curl);
  headRy = M.lerp(headRy, 1.25, pose.curl);
  headRz = M.lerp(headRz, -0.3, pose.curl);
  henryHead.position.set(headX, headY, headZ);
  henryHead.rotation.set(headRx, headRy, headRz);

  const curl = pose.sleep;
  henryTailRoot.position.x = M.lerp(0, 0.06, pose.curl);
  henryTail.forEach((seg, i) => {
    const sway = Math.sin(t * 1.6 + i * 0.5) * (0.12 + 0.12 * pose.walk);
    const wrap = (i === 0 ? -1.3 : -0.78) * pose.curl;
    seg.rotation.y = wrap + sway * (1 - pose.curl * 0.85);
    seg.rotation.x = (i === 0 ? -0.5 * (1 - curl) + 0.2 * curl : -0.12 * (1 - curl)) * (1 - 0.8 * pose.stretch);
  });

  ai.blinkIn -= delta;
  if (ai.blinkIn <= 0) {
    ai.blinkFor = 0.14;
    ai.blinkIn = 2.5 + Math.random() * 4;
  }
  ai.blinkFor = Math.max(0, ai.blinkFor - delta);
  const eyeOpen = pose.sleep >= 0.5 || ai.blinkFor > 0 || pose.yawn > 0.3 ? 0.08 : pose.stretch > 0.5 ? 0.45 : 1;
  henryEyes.forEach((e) => {
    e.scale.y = eyeOpen;
  });

  ai.snap = false;
  zzzEl.classList.toggle("show", sleeping && pose.sleep > 0.8);
  nameEl.classList.toggle("show", playerDist < 4.5 && !browsing);
}

// ---------- Interactables ----------

const ROOM_ITEMS = [
  {
    key: "work",
    label: "Featured Work",
    position: new THREE.Vector3(-5.4, 0, -2.4),
    eyebrow: "Selected work · In development",
    title: "Marvel Champions: Spider-Man vs. Rhino",
    body: "A work in progress: a digital solo app for Marvel Champions: The Card Game, built from scratch while learning Unity and C#. So far it's a singleton manager architecture with interrupt-driven card effects and async player choices, with more of the rules still to come.",
  },
  {
    key: "music",
    label: "Music & Production",
    position: new THREE.Vector3(0, 0, -5.4),
    eyebrow: "Independent work",
    title: "Music & Production",
    body: "Writing, producing, and mixing my own music, with releases on Spotify. Current work runs through Reaper using FabFilter, Valhalla, and Serum 2.",
  },
  {
    key: "coursework",
    label: "Coursework",
    position: new THREE.Vector3(5.4, 0, -2.4),
    eyebrow: "Fundamentals",
    title: "Coursework Projects",
    body: "Eight focused builds covering layout, responsive design, CSS Grid, and animation — each one targeting a specific front-end skill from the ground up.",
  },
  {
    key: "about",
    label: "About",
    position: new THREE.Vector3(-5.6, 0, 2.4),
    eyebrow: "Background",
    title: "Music Educator, Now Building for the Web",
    body: "A BM in Music Education from CSULB and years of teaching and producing music shape how I approach code: break a big unfamiliar system into parts, then rebuild it into something that holds up.",
  },
  {
    key: "contact",
    label: "Contact",
    position: new THREE.Vector3(5.6, 0, 2.7),
    eyebrow: "Let's talk",
    title: "Get in Touch",
    body: "patricklawrosal@gmail.com — open to entry-level front-end and full-stack roles in the LA area.",
  },
];

const DOOR_IN = { key: "door-in", label: "Enter the House", position: DOOR_POS, action: "enter" };
const DOOR_OUT = { key: "door-out", label: "Exit", position: new THREE.Vector3(0, 0, 5.4), action: "exit" };

let area = "outside";
let boundX = OUTSIDE_BOUND_X;
let boundZ = OUTSIDE_BOUND_Z;
insideLabels.forEach((l) => (l.visible = false));

function blockedByHouse(x, z) {
  if (area === "outside") {
    return Math.abs(x - HOUSE_POS.x) < HOUSE_HALF_X && Math.abs(z - HOUSE_POS.z) < HOUSE_HALF_Z;
  }
  return FURNITURE.some((b) => Math.abs(x - b.x) < b.hw + 0.2 && Math.abs(z - b.z) < b.hd + 0.2);
}

const HENRY_ITEM = { key: "henry", label: "Pet Henry", position: henry.position, action: "pet", radius: 1.7 };

function currentInteractables() {
  return area === "outside" ? [DOOR_IN] : [...ROOM_ITEMS, HENRY_ITEM, DOOR_OUT];
}

// ---------- Character ----------

const character = new THREE.Group();

const body = new THREE.Mesh(
  new THREE.CapsuleGeometry(0.55, 0.9, 4, 8),
  new THREE.MeshLambertMaterial({ color: PALETTE.rust })
);
body.position.y = 1.05;
character.add(body);

const head = new THREE.Mesh(
  new THREE.SphereGeometry(0.42, 16, 16),
  new THREE.MeshLambertMaterial({ color: 0xf3d5b5 })
);
head.position.y = 1.95;
character.add(head);

const eyeGeo = new THREE.SphereGeometry(0.06, 8, 8);
const eyeMat = new THREE.MeshBasicMaterial({ color: PALETTE.ink });
const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
eyeL.position.set(-0.15, 1.98, 0.36);
const eyeR = eyeL.clone();
eyeR.position.x = 0.15;
character.add(eyeL, eyeR);

character.position.copy(SPAWN_OUTSIDE);
scene.add(character);

// ---------- Area transitions ----------

let transitioning = false;

function fadeSwitch(callback) {
  if (transitioning) return;
  transitioning = true;
  fadeEl.classList.add("visible");
  setTimeout(() => {
    callback();
    setTimeout(() => {
      fadeEl.classList.remove("visible");
      transitioning = false;
    }, 60);
  }, 220);
}

function enterHouse() {
  fadeSwitch(() => {
    area = "inside";
    loadCoverArt();
    randomizeHenry();
    outsideGroup.visible = false;
    insideGroup.visible = true;
    outsideLabels.forEach((l) => (l.visible = false));
    insideLabels.forEach((l) => (l.visible = true));
    character.position.copy(SPAWN_INSIDE);
    character.rotation.y = Math.PI;
    boundX = ROOM_HALF_X - 0.4;
    boundZ = ROOM_HALF_Z - 0.4;
    cameraOffset = INSIDE_CAM_OFFSET.clone();
    scene.background = new THREE.Color(PALETTE.dusk);
    scene.fog = new THREE.Fog(PALETTE.dusk, 20, 40);
    ambient.intensity = 0.3;
    sun.intensity = 0.2;
    lamp.intensity = 1.6;
    hintEl.textContent = "Walk up to an object and press E";
  });
}

function exitHouse() {
  fadeSwitch(() => {
    area = "outside";
    outsideGroup.visible = true;
    insideGroup.visible = false;
    outsideLabels.forEach((l) => (l.visible = true));
    insideLabels.forEach((l) => (l.visible = false));
    character.position.copy(SPAWN_OUTSIDE);
    character.rotation.y = 0;
    boundX = OUTSIDE_BOUND_X;
    boundZ = OUTSIDE_BOUND_Z;
    cameraOffset = OUTSIDE_CAM_OFFSET.clone();
    scene.background = new THREE.Color(PALETTE.cream);
    scene.fog = new THREE.Fog(PALETTE.cream, 18, 38);
    ambient.intensity = 0.75;
    sun.intensity = 0.9;
    lamp.intensity = 0;
    hintEl.textContent = "Walk to the house and press E";
  });
}

// ---------- Input ----------

const keys = new Set();
const KEY_MAP = {
  KeyW: "up",
  ArrowUp: "up",
  KeyS: "down",
  ArrowDown: "down",
  KeyA: "left",
  ArrowLeft: "left",
  KeyD: "right",
  ArrowRight: "right",
};

window.addEventListener("keydown", (e) => {
  if (browsing) {
    if (e.code === "ArrowLeft" || e.code === "KeyA") loadTrack(recordIndex - 1);
    else if (e.code === "ArrowRight" || e.code === "KeyD") loadTrack(recordIndex + 1);
    else if (e.code === "KeyE" || e.code === "Enter" || e.code === "Escape") exitBrowse();
    return;
  }
  if (KEY_MAP[e.code]) keys.add(KEY_MAP[e.code]);
  if (e.code === "KeyE" || e.code === "Enter") tryInteract();
  if (e.code === "Escape") closePanel();
});

window.addEventListener("keyup", (e) => {
  if (KEY_MAP[e.code]) keys.delete(KEY_MAP[e.code]);
});

// Virtual analog joystick — drag distance sets both direction and speed
const joystickEl = document.getElementById("joystick");
const joystickStickEl = document.getElementById("joystickStick");
const JOY_RADIUS = 38;
const joystick = { active: false, x: 0, z: 0 };

function updateJoystick(clientX, clientY) {
  const rect = joystickEl.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  let dx = clientX - cx;
  let dy = clientY - cy;
  const dist = Math.hypot(dx, dy);
  if (dist > JOY_RADIUS) {
    dx = (dx / dist) * JOY_RADIUS;
    dy = (dy / dist) * JOY_RADIUS;
  }
  joystickStickEl.style.transform = `translate(${dx}px, ${dy}px)`;
  joystick.x = dx / JOY_RADIUS;
  joystick.z = dy / JOY_RADIUS;
}

function resetJoystick() {
  joystick.active = false;
  joystick.x = 0;
  joystick.z = 0;
  joystickStickEl.style.transition = "transform 0.15s ease";
  joystickStickEl.style.transform = "translate(0px, 0px)";
}

joystickEl.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  joystick.active = true;
  joystickStickEl.style.transition = "none";
  try {
    joystickEl.setPointerCapture(e.pointerId);
  } catch {
    // ignore — some synthetic/edge-case pointers can't be captured
  }
  updateJoystick(e.clientX, e.clientY);
});
joystickEl.addEventListener("pointermove", (e) => {
  if (joystick.active) updateJoystick(e.clientX, e.clientY);
});
joystickEl.addEventListener("pointerup", resetJoystick);
joystickEl.addEventListener("pointercancel", resetJoystick);

document.getElementById("interactBtn").addEventListener("pointerdown", (e) => {
  e.preventDefault();
  tryInteract();
});

let nearestItem = null;

let browsing = false;

function tryInteract() {
  if (!nearestItem || transitioning || browsing) return;
  if (nearestItem.action === "enter") enterHouse();
  else if (nearestItem.action === "exit") exitHouse();
  else if (nearestItem.action === "pet") petHenry();
  else openPanel(nearestItem);
}

let recordIndex = 0;
let trackIndex = 0;

// The song list that appears on the pulled-out record (a DOM overlay pinned to the 3D disc)
const vinylFaceEl = document.createElement("div");
vinylFaceEl.className = "vinyl-face";
const vinylFaceObj = new CSS2DObject(vinylFaceEl);
let faceTimer = null;
let frameTimer = null;

function renderVinylFace() {
  clearTimeout(faceTimer);
  vinylFaceEl.classList.remove("show");
  vinylFaceEl.replaceChildren();

  const record = RECORDS[recordIndex];
  vinylPivots[vinylForRecord(recordIndex)].userData.disc.add(vinylFaceObj);

  const list = document.createElement("div");
  list.className = "vinyl-tracks";
  record.tracks.forEach((track, ti) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "vinyl-track" + (ti === trackIndex ? " active" : "");
    btn.textContent = track.title;
    btn.addEventListener("click", () => loadTrack(recordIndex, ti));
    list.appendChild(btn);
  });
  vinylFaceEl.appendChild(list);

  faceTimer = setTimeout(() => vinylFaceEl.classList.add("show"), 500);
}

function loadTrack(r, t = 0) {
  const nextRecord = (r + RECORDS.length) % RECORDS.length;
  const recordChanged = nextRecord !== recordIndex || !vinylFaceEl.isConnected;
  recordIndex = nextRecord;
  const record = RECORDS[recordIndex];
  trackIndex = THREE.MathUtils.clamp(t, 0, record.tracks.length - 1);

  // Wait for flipping to settle so quick flips don't leave the player on an earlier song
  const src = `https://open.spotify.com/embed/track/${record.tracks[trackIndex].id}?utm_source=generator&theme=0`;
  clearTimeout(frameTimer);
  frameTimer = setTimeout(() => {
    if (browsing && spotifyFrame.getAttribute("src") !== src) spotifyFrame.src = src;
  }, 350);
  spotifyIndexEl.textContent = `${recordIndex + 1} / ${RECORDS.length}`;
  crateNowEl.textContent = `Now: ${record.tracks[trackIndex].title}`;

  if (recordChanged) {
    renderVinylFace();
  } else {
    vinylFaceEl.querySelectorAll(".vinyl-track").forEach((el, ti) => {
      el.classList.toggle("active", ti === trackIndex);
    });
  }
}

spotifyPrevBtn.addEventListener("click", () => loadTrack(recordIndex - 1));
spotifyNextBtn.addEventListener("click", () => loadTrack(recordIndex + 1));

function enterBrowse() {
  browsing = true;
  resetJoystick();
  app.classList.add("browsing");
  character.visible = false;
  crateLabel.visible = false;
  loadTrack(recordIndex, trackIndex);
  crateSheet.classList.add("open");
}

function exitBrowse() {
  browsing = false;
  app.classList.remove("browsing");
  character.visible = true;
  crateLabel.visible = true;
  crateSheet.classList.remove("open");
  clearTimeout(frameTimer);
  spotifyFrame.src = "";
  clearTimeout(faceTimer);
  vinylFaceEl.classList.remove("show");
  vinylFaceObj.removeFromParent();
}

crateCloseBtn.addEventListener("click", exitBrowse);

// Fold the player down to a slim bar (it keeps playing behind it)
crateToggleBtn.addEventListener("click", () => {
  const collapsed = crateSheet.classList.toggle("collapsed");
  crateToggleBtn.setAttribute("aria-expanded", String(!collapsed));
  crateToggleBtn.setAttribute("aria-label", collapsed ? "Expand player" : "Collapse player");
});

let computerBuilt = false;

function buildComputerList() {
  if (computerBuilt) return;
  computerBuilt = true;
  COURSEWORK_PROJECTS.forEach((p) => {
    const card = document.createElement("a");
    card.className = "computer-card";
    card.href = p.url;
    card.target = "_blank";
    card.rel = "noopener";

    const img = document.createElement("img");
    img.src = p.image;
    img.alt = p.title;
    img.loading = "lazy";
    card.appendChild(img);

    const body = document.createElement("div");
    body.className = "card-body";
    const h4 = document.createElement("h4");
    h4.textContent = p.title;
    const desc = document.createElement("p");
    desc.textContent = p.desc;
    body.append(h4, desc);
    card.appendChild(body);

    computerList.appendChild(card);
  });
}

function openPanel(item) {
  if (item.key === "music" && RECORDS.length) {
    enterBrowse();
    return;
  }

  panelEyebrow.textContent = item.eyebrow;
  panelTitle.textContent = item.title;
  panelBody.textContent = item.body;

  computerScreen.hidden = true;
  panelBox.classList.remove("wide");

  if (item.key === "coursework") {
    buildComputerList();
    computerScreen.hidden = false;
    panelBox.classList.add("wide");
  }

  panelOverlay.classList.add("open");
}

function closePanel() {
  panelOverlay.classList.remove("open");
}

panelClose.addEventListener("click", closePanel);
panelOverlay.addEventListener("click", (e) => {
  if (e.target === panelOverlay) closePanel();
});

// ---------- Resize ----------

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
});

// ---------- Animation loop ----------

const moveDir = new THREE.Vector3();
const targetCamPos = new THREE.Vector3();
const targetLookAt = new THREE.Vector3();
const currentLook = new THREE.Vector3();
let viewShift = 0;
const faceCenter = new THREE.Vector3();
const faceEdge = new THREE.Vector3();
let lookInitialized = false;
const clock = new THREE.Clock();
const SPEED = 5.2;

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.1);
  const t = clock.getElapsedTime();

  moveDir.set(0, 0, 0);
  let speedFactor = 1;
  const inputAllowed = !transitioning && !browsing && !panelOverlay.classList.contains("open");
  if (inputAllowed) {
    if (keys.has("up")) moveDir.z -= 1;
    if (keys.has("down")) moveDir.z += 1;
    if (keys.has("left")) moveDir.x -= 1;
    if (keys.has("right")) moveDir.x += 1;

    if (moveDir.lengthSq() === 0 && joystick.active) {
      moveDir.set(joystick.x, 0, joystick.z);
      speedFactor = Math.min(moveDir.length(), 1);
    }
  }

  if (moveDir.lengthSq() > 0.0001) {
    moveDir.normalize();

    const nextX = THREE.MathUtils.clamp(character.position.x + moveDir.x * SPEED * speedFactor * delta, -boundX, boundX);
    if (!blockedByHouse(nextX, character.position.z)) {
      character.position.x = nextX;
    }

    const nextZ = THREE.MathUtils.clamp(character.position.z + moveDir.z * SPEED * speedFactor * delta, -boundZ, boundZ);
    if (!blockedByHouse(character.position.x, nextZ)) {
      character.position.z = nextZ;
    }

    const targetAngle = Math.atan2(moveDir.x, moveDir.z);
    let angleDiff = targetAngle - character.rotation.y;
    angleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
    character.rotation.y += angleDiff * Math.min(delta * 10, 1);

    body.position.y = 1.05 + Math.abs(Math.sin(t * 10)) * 0.06;
  } else {
    body.position.y = 1.05;
  }

  if (area === "inside") {
    updateHenry(delta, t);
  }

  // Vinyl crate: sleeves rest edge-on; the selected record rises, turns to face you, and
  // the sleeves around it part and lean away
  if (area === "inside") {
    const selectedPivot = browsing ? vinylPivots[vinylForRecord(recordIndex)] : null;
    const selectedX = selectedPivot ? selectedPivot.userData.baseX : 0;
    const ease = 1 - Math.pow(0.0008, delta);

    const spread = (baseX) => {
      if (!selectedPivot) return { push: 0, lean: 0 };
      const dx = baseX - selectedX;
      const falloff = Math.exp(-Math.abs(dx) * 2.4);
      return { push: Math.sign(dx) * 0.5 * falloff, lean: -Math.sign(dx) * 0.28 * falloff };
    };

    fillerSleeves.forEach((mesh) => {
      const u = mesh.userData;
      const { push, lean } = spread(u.baseX);
      mesh.position.x += (u.baseX + push - mesh.position.x) * ease;
      mesh.rotation.z += (u.baseTilt + lean - mesh.rotation.z) * ease;
    });

    vinylPivots.forEach((pivot) => {
      const u = pivot.userData;
      let tx = u.baseX;
      let ty = PIVOT_Y;
      let tz = 0;
      let ry = Math.PI / 2;
      let rx = 0;
      let rz = u.baseTilt;
      let discY = 0;

      if (pivot === selectedPivot) {
        tx = 0;
        ty = 0.95;
        tz = 0.95;
        ry = 0;
        rx = -0.12;
        rz = 0;
        discY = 0.98;
      } else {
        const { push, lean } = spread(u.baseX);
        tx = u.baseX + push;
        rz = u.baseTilt + lean;
      }

      pivot.position.x += (tx - pivot.position.x) * ease;
      pivot.position.y += (ty - pivot.position.y) * ease;
      pivot.position.z += (tz - pivot.position.z) * ease;
      pivot.rotation.y += (ry - pivot.rotation.y) * ease;
      pivot.rotation.x += (rx - pivot.rotation.x) * ease;
      pivot.rotation.z += (rz - pivot.rotation.z) * ease;
      u.disc.position.y += (discY - u.disc.position.y) * ease;
    });
  }

  // Nearest interactable / prompt
  let closest = null;
  let closestDist = Infinity;
  const radius = area === "outside" ? DOOR_RADIUS : INTERACT_RADIUS;
  currentInteractables().forEach((item) => {
    const dist = character.position.distanceTo(item.position);
    if (dist >= (item.radius ?? radius)) return;
    // Henry only gets the prompt when nothing else is in range, so he never steals the crate
    const winsOver =
      !closest ||
      (closest === HENRY_ITEM && item !== HENRY_ITEM) ||
      (item !== HENRY_ITEM && dist < closestDist);
    if (winsOver) {
      closestDist = dist;
      closest = item;
    }
  });

  if (closest && !transitioning && !browsing) {
    nearestItem = closest;
    promptTextEl.textContent = closest.action === "enter" ? "Enter" : closest.action === "exit" ? "Exit" : closest.label;
    promptEl.classList.add("visible");
  } else {
    nearestItem = null;
    promptEl.classList.remove("visible");
  }

  // Camera follow (fixed-angle, Animal Crossing style), or a close-up on the crate while browsing
  if (browsing) {
    if (window.innerWidth <= 700) {
      // Phones: frame the pulled-out record (sleeve + disc, about 1.9 tall and 0.9 wide) so it
      // fills the space above the bottom sheet, growing when the sheet is collapsed
      const visibleFrac = THREE.MathUtils.clamp(1 - crateSheet.offsetHeight / window.innerHeight, 0.4, 1);
      const fitTan = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      const dist = Math.max(2.6 / (visibleFrac * fitTan), 1.3 / (camera.aspect * fitTan));
      const recordZ = CRATE_POS.z + 0.95;
      targetCamPos.set(CRATE_POS.x, 1.45 + dist * 0.1, recordZ + dist);
      targetLookAt.set(CRATE_POS.x, 1.4, recordZ);
    } else {
      const dist = THREE.MathUtils.clamp(3.4 / camera.aspect, 3.6, 7.5);
      targetCamPos.set(CRATE_POS.x, 2.2 + dist * 0.25, CRATE_POS.z + dist);
      targetLookAt.set(CRATE_POS.x, 0.35, CRATE_POS.z);
    }
  } else {
    targetCamPos.set(
      character.position.x + cameraOffset.x,
      cameraOffset.y,
      character.position.z + cameraOffset.z
    );
    targetLookAt.set(
      character.position.x + cameraLookOffset.x,
      cameraLookOffset.y,
      character.position.z + cameraLookOffset.z
    );
  }
  const camEase = 1 - Math.pow(0.001, delta);
  camera.position.lerp(targetCamPos, camEase);
  if (!lookInitialized) {
    currentLook.copy(targetLookAt);
    lookInitialized = true;
  }
  currentLook.lerp(targetLookAt, camEase);
  camera.lookAt(currentLook);

  // On phones the bottom sheet covers a big slice of the screen, so slide the view up to keep
  // the crate in the visible area above it
  const wantShift = browsing && window.innerWidth <= 700 ? crateSheet.offsetHeight * 0.5 : 0;
  viewShift += (wantShift - viewShift) * camEase;
  if (Math.abs(viewShift) > 0.5) {
    camera.setViewOffset(window.innerWidth, window.innerHeight, 0, viewShift, window.innerWidth, window.innerHeight);
  } else if (camera.view && camera.view.enabled) {
    camera.clearViewOffset();
  }

  // Keep the on-record song list matched to the pulled-out disc's size on screen
  if (browsing && vinylFaceObj.parent) {
    camera.updateMatrixWorld();
    vinylFaceObj.parent.getWorldPosition(faceCenter);
    faceEdge.setFromMatrixColumn(camera.matrixWorld, 0).multiplyScalar(0.42).add(faceCenter);
    faceCenter.project(camera);
    faceEdge.project(camera);
    const radiusPx = Math.abs(faceEdge.x - faceCenter.x) * 0.5 * window.innerWidth;
    vinylFaceEl.style.width = `${radiusPx * 2}px`;
    vinylFaceEl.style.height = `${radiusPx * 2}px`;
    vinylFaceEl.style.fontSize = `${Math.max(radiusPx * 0.11, 8)}px`;
  }

  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
}

animate();
