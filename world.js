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
const catBreath = [];

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

// Sleeping cat
const cat = new THREE.Group();
cat.position.set(0.1, 0.86, 0.12);
const catFur = lambert(0xe8a25a);
const catBody = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.22, 4, 10), catFur);
catBody.rotation.z = Math.PI / 2;
catBody.scale.set(1, 1, 1.05);
cat.add(catBody);
const catHead = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 10), catFur);
catHead.position.set(0.22, -0.02, 0.05);
cat.add(catHead);
[-0.05, 0.05].forEach((dz) => {
  const ear = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.06, 4), catFur);
  ear.position.set(0.24, 0.09, 0.05 + dz);
  cat.add(ear);
});
const catTail = new THREE.Mesh(new THREE.CapsuleGeometry(0.03, 0.22, 4, 8), catFur);
catTail.rotation.z = Math.PI / 2 + 0.5;
catTail.position.set(-0.28, -0.03, 0.06);
cat.add(catTail);
const catStripe = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.2, 0.02), lambert(0xb56e2c));
catStripe.position.set(0.02, 0.1, 0.1);
cat.add(catStripe);
armchair.add(cat);
catBreath.push(catBody);
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

// ---------- Interactables ----------

const ROOM_ITEMS = [
  {
    key: "work",
    label: "Featured Work",
    position: new THREE.Vector3(-5.4, 0, -2.4),
    eyebrow: "Selected work",
    title: "Marvel Champions: Spider-Man vs. Rhino",
    body: "A digital solo app for Marvel Champions: The Card Game, built from scratch while learning Unity and C# — a singleton manager architecture with interrupt-driven card effects and async player choices.",
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

function currentInteractables() {
  return area === "outside" ? [DOOR_IN] : [...ROOM_ITEMS, DOOR_OUT];
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
    catBreath.forEach((body) => {
      body.scale.y = 1 + 0.06 * Math.sin(t * 1.9);
    });
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
    if (dist < closestDist) {
      closestDist = dist;
      closest = item;
    }
  });

  if (closest && closestDist < radius && !transitioning && !browsing) {
    nearestItem = closest;
    promptTextEl.textContent = closest.action === "enter" ? "Enter" : closest.action === "exit" ? "Exit" : closest.label;
    promptEl.classList.add("visible");
  } else {
    nearestItem = null;
    promptEl.classList.remove("visible");
  }

  // Camera follow (fixed-angle, Animal Crossing style), or a close-up on the crate while browsing
  if (browsing) {
    const dist = THREE.MathUtils.clamp(3.4 / camera.aspect, 3.6, 7.5);
    targetCamPos.set(CRATE_POS.x, 2.2 + dist * 0.25, CRATE_POS.z + dist);
    targetLookAt.set(CRATE_POS.x, 0.35, CRATE_POS.z);
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
