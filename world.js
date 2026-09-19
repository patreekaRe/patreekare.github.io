import * as THREE from "three";
import { CSS2DRenderer, CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";

const PALETTE = {
  cream: 0xfefae0,
  ink: 0x283618,
  olive: 0x606c38,
  rust: 0xbc6c25,
  tan: 0xdda15e,
  dusk: 0x241a12,
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
// Cozy music room — lamp-lit, dark surround.

const ROOM_HALF_X = 6.2;
const ROOM_HALF_Z = 6.2;
const SPAWN_INSIDE = new THREE.Vector3(0, 0, 4.6);

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(15, 15),
  new THREE.MeshLambertMaterial({ color: 0x6b4a2c })
);
floor.rotation.x = -Math.PI / 2;
insideGroup.add(floor);

const rug = new THREE.Mesh(
  new THREE.CircleGeometry(3.4, 28),
  new THREE.MeshLambertMaterial({ color: PALETTE.rust })
);
rug.rotation.x = -Math.PI / 2;
rug.position.y = 0.01;
insideGroup.add(rug);
const rugInner = new THREE.Mesh(
  new THREE.CircleGeometry(2.5, 28),
  new THREE.MeshLambertMaterial({ color: PALETTE.tan })
);
rugInner.rotation.x = -Math.PI / 2;
rugInner.position.y = 0.02;
insideGroup.add(rugInner);

const wallMat = new THREE.MeshLambertMaterial({ color: 0x4a3a2a });
const backWall = new THREE.Mesh(new THREE.PlaneGeometry(13, 4.6), wallMat);
backWall.position.set(0, 2.3, -6.5);
insideGroup.add(backWall);
const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(13, 4.6), wallMat);
leftWall.position.set(-6.5, 2.3, 0);
leftWall.rotation.y = Math.PI / 2;
insideGroup.add(leftWall);
const rightWall = leftWall.clone();
rightWall.position.x = 6.5;
insideGroup.add(rightWall);

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

// Guitar — leaning near the west wall
const guitarGroup = new THREE.Group();
guitarGroup.position.set(-5.6, 0, 2.4);
guitarGroup.rotation.z = -0.18;
const guitarBody = new THREE.Mesh(
  new THREE.CylinderGeometry(0.55, 0.65, 0.18, 16),
  new THREE.MeshLambertMaterial({ color: PALETTE.rust })
);
guitarBody.rotation.x = Math.PI / 2;
guitarBody.position.y = 0.9;
guitarGroup.add(guitarBody);
const guitarNeck = new THREE.Mesh(
  new THREE.BoxGeometry(0.12, 1.5, 0.08),
  new THREE.MeshLambertMaterial({ color: 0x3a2a1a })
);
guitarNeck.position.set(0, 2, 0.05);
guitarGroup.add(guitarNeck);
insideGroup.add(guitarGroup);
makeLabel(insideGroup, "About", -5.6, 3.1, 2.4);

// Retro TV / arcade corner — west wall
const tvGroup = new THREE.Group();
tvGroup.position.set(-5.4, 0, -2.4);
const tvBody = new THREE.Mesh(
  new THREE.BoxGeometry(1.3, 1, 0.8),
  new THREE.MeshLambertMaterial({ color: PALETTE.olive })
);
tvBody.position.y = 0.9;
tvGroup.add(tvBody);
const tvScreen = new THREE.Mesh(
  new THREE.PlaneGeometry(0.9, 0.6),
  new THREE.MeshBasicMaterial({ color: PALETTE.tan })
);
tvScreen.position.set(0, 0.95, 0.41);
tvGroup.add(tvScreen);
const tvStand = new THREE.Mesh(
  new THREE.BoxGeometry(0.9, 0.5, 0.6),
  new THREE.MeshLambertMaterial({ color: 0x3a2a1a })
);
tvStand.position.y = 0.25;
tvGroup.add(tvStand);
insideGroup.add(tvGroup);
makeLabel(insideGroup, "Featured Work", -5.4, 1.9, -2.4);

// Desk with laptop — east wall
const deskGroup = new THREE.Group();
deskGroup.position.set(5.4, 0, -2.4);
const deskTop = new THREE.Mesh(
  new THREE.BoxGeometry(1.4, 0.1, 0.7),
  new THREE.MeshLambertMaterial({ color: 0x8a5a34 })
);
deskTop.position.y = 0.75;
deskGroup.add(deskTop);
const deskLegs = new THREE.Mesh(
  new THREE.BoxGeometry(1.2, 0.7, 0.5),
  new THREE.MeshLambertMaterial({ color: 0x5a3d22 })
);
deskLegs.position.y = 0.35;
deskGroup.add(deskLegs);
const laptopBase = new THREE.Mesh(
  new THREE.BoxGeometry(0.5, 0.04, 0.35),
  new THREE.MeshLambertMaterial({ color: 0xdddddd })
);
laptopBase.position.set(0, 0.82, 0);
deskGroup.add(laptopBase);
const laptopScreen = new THREE.Mesh(
  new THREE.BoxGeometry(0.5, 0.32, 0.03),
  new THREE.MeshBasicMaterial({ color: PALETTE.rust })
);
laptopScreen.position.set(0, 1, -0.16);
laptopScreen.rotation.x = -0.3;
deskGroup.add(laptopScreen);
insideGroup.add(deskGroup);
makeLabel(insideGroup, "Coursework", 5.4, 1.9, -2.4);

// Side table with rotary phone — east wall, near entrance
const phoneGroup = new THREE.Group();
phoneGroup.position.set(5.6, 0, 2.7);
const phoneTable = new THREE.Mesh(
  new THREE.CylinderGeometry(0.4, 0.4, 0.6, 12),
  new THREE.MeshLambertMaterial({ color: 0x8a5a34 })
);
phoneTable.position.y = 0.3;
phoneGroup.add(phoneTable);
const phoneBody = new THREE.Mesh(
  new THREE.BoxGeometry(0.35, 0.2, 0.3),
  new THREE.MeshLambertMaterial({ color: PALETTE.ink })
);
phoneBody.position.y = 0.7;
phoneGroup.add(phoneBody);
insideGroup.add(phoneGroup);
makeLabel(insideGroup, "Contact", 5.6, 1.5, 2.7);

// Doormat marking the exit back outside
const exitMat = new THREE.Mesh(
  new THREE.PlaneGeometry(1.4, 0.6),
  new THREE.MeshLambertMaterial({ color: PALETTE.tan })
);
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
  return (
    area === "outside" &&
    Math.abs(x - HOUSE_POS.x) < HOUSE_HALF_X &&
    Math.abs(z - HOUSE_POS.z) < HOUSE_HALF_Z
  );
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
    scene.fog = new THREE.Fog(PALETTE.dusk, 9, 17);
    ambient.intensity = 0.32;
    lamp.intensity = 1.3;
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
