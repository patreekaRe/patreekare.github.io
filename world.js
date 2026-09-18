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

const app = document.getElementById("app");
const promptEl = document.getElementById("prompt");
const promptTextEl = document.getElementById("prompt-text");
const panelOverlay = document.getElementById("panelOverlay");
const panelEyebrow = document.getElementById("panelEyebrow");
const panelTitle = document.getElementById("panelTitle");
const panelBody = document.getElementById("panelBody");
const panelClose = document.getElementById("panelClose");
const fadeEl = document.getElementById("fade");
const hintEl = document.getElementById("hint-text");

// ---------- Scene setup ----------

const scene = new THREE.Scene();
scene.background = new THREE.Color(PALETTE.cream);
scene.fog = new THREE.Fog(PALETTE.cream, 18, 38);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
const OUTSIDE_CAM_OFFSET = new THREE.Vector3(0, 7.5, 9);
const INSIDE_CAM_OFFSET = new THREE.Vector3(0, 5.2, 6.4);
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

const OUTSIDE_BOUND_X = 13;
const OUTSIDE_BOUND_Z = 13;
const SPAWN_OUTSIDE = new THREE.Vector3(0, 0, 6);

const groundSize = 30;
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
  [-9, -2],
  [9, -2],
  [-6, 8],
  [6, 8],
].forEach(([x, z]) => {
  const bush = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.7, 0),
    new THREE.MeshLambertMaterial({ color: PALETTE.olive })
  );
  bush.position.set(x, 0.6, z);
  outsideGroup.add(bush);
});

// House exterior
const HOUSE_POS = new THREE.Vector3(0, 0, -9);
const DOOR_POS = new THREE.Vector3(0, 0, -6.3);
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

const ROOM_HALF_X = 4.2;
const ROOM_HALF_Z = 4.2;
const SPAWN_INSIDE = new THREE.Vector3(0, 0, 3.2);

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 10),
  new THREE.MeshLambertMaterial({ color: 0x6b4a2c })
);
floor.rotation.x = -Math.PI / 2;
insideGroup.add(floor);

const rug = new THREE.Mesh(
  new THREE.CircleGeometry(2.6, 24),
  new THREE.MeshLambertMaterial({ color: PALETTE.rust })
);
rug.rotation.x = -Math.PI / 2;
rug.position.y = 0.01;
insideGroup.add(rug);
const rugInner = new THREE.Mesh(
  new THREE.CircleGeometry(1.9, 24),
  new THREE.MeshLambertMaterial({ color: PALETTE.tan })
);
rugInner.rotation.x = -Math.PI / 2;
rugInner.position.y = 0.02;
insideGroup.add(rugInner);

const wallMat = new THREE.MeshLambertMaterial({ color: 0x4a3a2a });
const backWall = new THREE.Mesh(new THREE.PlaneGeometry(9, 4.2), wallMat);
backWall.position.set(0, 2.1, -4.5);
insideGroup.add(backWall);
const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(9, 4.2), wallMat);
leftWall.position.set(-4.5, 2.1, 0);
leftWall.rotation.y = Math.PI / 2;
insideGroup.add(leftWall);
const rightWall = leftWall.clone();
rightWall.position.x = 4.5;
insideGroup.add(rightWall);

// Turntable — centerpiece against the back wall
const turntableGroup = new THREE.Group();
turntableGroup.position.set(0, 0, -3.6);
const ttBase = new THREE.Mesh(
  new THREE.BoxGeometry(1.4, 0.35, 1.1),
  new THREE.MeshLambertMaterial({ color: PALETTE.ink })
);
ttBase.position.y = 0.575;
turntableGroup.add(ttBase);
const ttRecord = new THREE.Mesh(
  new THREE.CylinderGeometry(0.42, 0.42, 0.03, 24),
  new THREE.MeshLambertMaterial({ color: 0x111111 })
);
ttRecord.position.y = 0.77;
turntableGroup.add(ttRecord);
const ttArm = new THREE.Mesh(
  new THREE.BoxGeometry(0.6, 0.05, 0.05),
  new THREE.MeshLambertMaterial({ color: PALETTE.tan })
);
ttArm.position.set(0.5, 0.8, -0.3);
ttArm.rotation.y = 0.4;
turntableGroup.add(ttArm);
insideGroup.add(turntableGroup);
makeLabel(insideGroup, "Music & Production", 0, 1.6, -3.6);

// Guitar — leaning near the west wall
const guitarGroup = new THREE.Group();
guitarGroup.position.set(-3.7, 0, 1.6);
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
makeLabel(insideGroup, "About", -3.7, 2.9, 1.6);

// Retro TV / arcade corner — west wall
const tvGroup = new THREE.Group();
tvGroup.position.set(-3.6, 0, -1.6);
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
makeLabel(insideGroup, "Featured Work", -3.6, 1.7, -1.6);

// Desk with laptop — east wall
const deskGroup = new THREE.Group();
deskGroup.position.set(3.6, 0, -1.6);
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
makeLabel(insideGroup, "Coursework", 3.6, 1.7, -1.6);

// Side table with rotary phone — east wall, near entrance
const phoneGroup = new THREE.Group();
phoneGroup.position.set(3.7, 0, 1.8);
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
makeLabel(insideGroup, "Contact", 3.7, 1.3, 1.8);

// Doormat marking the exit back outside
const exitMat = new THREE.Mesh(
  new THREE.PlaneGeometry(1.4, 0.6),
  new THREE.MeshLambertMaterial({ color: PALETTE.tan })
);
exitMat.rotation.x = -Math.PI / 2;
exitMat.position.set(0, 0.015, 3.6);
insideGroup.add(exitMat);

// ---------- Interactables ----------

const ROOM_ITEMS = [
  {
    key: "work",
    label: "Featured Work",
    position: new THREE.Vector3(-3.6, 0, -1.6),
    eyebrow: "Selected work",
    title: "Marvel Champions: Spider-Man vs. Rhino",
    body: "A digital solo app for Marvel Champions: The Card Game, built from scratch while learning Unity and C# — a singleton manager architecture with interrupt-driven card effects and async player choices.",
  },
  {
    key: "music",
    label: "Music & Production",
    position: new THREE.Vector3(0, 0, -3.6),
    eyebrow: "Independent work",
    title: "Music & Production",
    body: "Writing, producing, and mixing my own music, with releases on Spotify. Current work runs through Reaper using FabFilter, Valhalla, and Serum 2.",
  },
  {
    key: "coursework",
    label: "Coursework",
    position: new THREE.Vector3(3.6, 0, -1.6),
    eyebrow: "Fundamentals",
    title: "Coursework Projects",
    body: "Eight focused builds covering layout, responsive design, CSS Grid, and animation — each one targeting a specific front-end skill from the ground up.",
  },
  {
    key: "about",
    label: "About",
    position: new THREE.Vector3(-3.7, 0, 1.6),
    eyebrow: "Background",
    title: "Music Educator, Now Building for the Web",
    body: "A BM in Music Education from CSULB and years of teaching and producing music shape how I approach code: break a big unfamiliar system into parts, then rebuild it into something that holds up.",
  },
  {
    key: "contact",
    label: "Contact",
    position: new THREE.Vector3(3.7, 0, 1.8),
    eyebrow: "Let's talk",
    title: "Get in Touch",
    body: "patricklawrosal@gmail.com — open to entry-level front-end and full-stack roles in the LA area.",
  },
];

const DOOR_IN = { key: "door-in", label: "Enter the House", position: DOOR_POS, action: "enter" };
const DOOR_OUT = { key: "door-out", label: "Exit", position: new THREE.Vector3(0, 0, 3.6), action: "exit" };

let area = "outside";
let boundX = OUTSIDE_BOUND_X;
let boundZ = OUTSIDE_BOUND_Z;
insideLabels.forEach((l) => (l.visible = false));

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
  if (KEY_MAP[e.code]) keys.add(KEY_MAP[e.code]);
  if (e.code === "KeyE" || e.code === "Enter") tryInteract();
  if (e.code === "Escape") closePanel();
});

window.addEventListener("keyup", (e) => {
  if (KEY_MAP[e.code]) keys.delete(KEY_MAP[e.code]);
});

const bindHold = (id, dir) => {
  const el = document.getElementById(id);
  const press = (e) => {
    e.preventDefault();
    keys.add(dir);
  };
  const release = (e) => {
    e.preventDefault();
    keys.delete(dir);
  };
  el.addEventListener("pointerdown", press);
  el.addEventListener("pointerup", release);
  el.addEventListener("pointerleave", release);
  el.addEventListener("pointercancel", release);
};

bindHold("btn-up", "up");
bindHold("btn-down", "down");
bindHold("btn-left", "left");
bindHold("btn-right", "right");

let nearestItem = null;

function tryInteract() {
  if (!nearestItem || transitioning) return;
  if (nearestItem.action === "enter") enterHouse();
  else if (nearestItem.action === "exit") exitHouse();
  else openPanel(nearestItem);
}

function openPanel(item) {
  panelEyebrow.textContent = item.eyebrow;
  panelTitle.textContent = item.title;
  panelBody.textContent = item.body;
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
const clock = new THREE.Clock();
const SPEED = 5.2;

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.1);
  const t = clock.getElapsedTime();

  moveDir.set(0, 0, 0);
  if (!transitioning && !panelOverlay.classList.contains("open")) {
    if (keys.has("up")) moveDir.z -= 1;
    if (keys.has("down")) moveDir.z += 1;
    if (keys.has("left")) moveDir.x -= 1;
    if (keys.has("right")) moveDir.x += 1;
  }

  if (moveDir.lengthSq() > 0) {
    moveDir.normalize();
    character.position.x += moveDir.x * SPEED * delta;
    character.position.z += moveDir.z * SPEED * delta;
    character.position.x = THREE.MathUtils.clamp(character.position.x, -boundX, boundX);
    character.position.z = THREE.MathUtils.clamp(character.position.z, -boundZ, boundZ);

    const targetAngle = Math.atan2(moveDir.x, moveDir.z);
    let angleDiff = targetAngle - character.rotation.y;
    angleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
    character.rotation.y += angleDiff * Math.min(delta * 10, 1);

    body.position.y = 1.05 + Math.abs(Math.sin(t * 10)) * 0.06;
  } else {
    body.position.y = 1.05;
  }

  // Turntable spin + guitar/label idle motion
  ttRecord.rotation.y += delta * (area === "inside" ? 2.2 : 0);

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

  if (closest && closestDist < radius && !transitioning) {
    nearestItem = closest;
    promptTextEl.textContent = closest.action === "enter" ? "Enter" : closest.action === "exit" ? "Exit" : closest.label;
    promptEl.classList.add("visible");
  } else {
    nearestItem = null;
    promptEl.classList.remove("visible");
  }

  // Camera follow (fixed-angle, Animal Crossing style)
  targetCamPos.set(
    character.position.x + cameraOffset.x,
    cameraOffset.y,
    character.position.z + cameraOffset.z
  );
  camera.position.lerp(targetCamPos, 1 - Math.pow(0.001, delta));

  targetLookAt.set(
    character.position.x + cameraLookOffset.x,
    cameraLookOffset.y,
    character.position.z + cameraLookOffset.z
  );
  camera.lookAt(targetLookAt);

  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
}

animate();
