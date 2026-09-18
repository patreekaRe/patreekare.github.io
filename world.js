import * as THREE from "three";
import { CSS2DRenderer, CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";

const PALETTE = {
  cream: 0xfefae0,
  ink: 0x283618,
  olive: 0x606c38,
  rust: 0xbc6c25,
  tan: 0xdda15e,
};

const EXHIBITS = [
  {
    key: "work",
    label: "Featured Work",
    position: new THREE.Vector3(-8, 0, -6),
    color: PALETTE.rust,
    eyebrow: "Selected work",
    title: "Marvel Champions: Spider-Man vs. Rhino",
    body:
      "A digital solo app for Marvel Champions: The Card Game, built from scratch while learning Unity and C# — a singleton manager architecture with interrupt-driven card effects and async player choices.",
  },
  {
    key: "coursework",
    label: "Coursework",
    position: new THREE.Vector3(8, 0, -6),
    color: PALETTE.olive,
    eyebrow: "Fundamentals",
    title: "Coursework Projects",
    body:
      "Eight focused builds covering layout, responsive design, CSS Grid, and animation — each one targeting a specific front-end skill from the ground up.",
  },
  {
    key: "about",
    label: "About",
    position: new THREE.Vector3(-8, 0, 6),
    color: PALETTE.tan,
    eyebrow: "Background",
    title: "Music Educator, Now Building for the Web",
    body:
      "A BM in Music Education from CSULB and years of teaching and producing music shape how I approach code: break a big unfamiliar system into parts, then rebuild it into something that holds up.",
  },
  {
    key: "contact",
    label: "Contact",
    position: new THREE.Vector3(8, 0, 6),
    color: PALETTE.ink,
    eyebrow: "Let's talk",
    title: "Get in Touch",
    body: "patricklawrosal@gmail.com — open to entry-level front-end and full-stack roles in the LA area.",
  },
];

const INTERACT_RADIUS = 3.2;

const app = document.getElementById("app");
const promptEl = document.getElementById("prompt");
const promptTextEl = document.getElementById("prompt-text");
const panelOverlay = document.getElementById("panelOverlay");
const panelEyebrow = document.getElementById("panelEyebrow");
const panelTitle = document.getElementById("panelTitle");
const panelBody = document.getElementById("panelBody");
const panelClose = document.getElementById("panelClose");

// ---------- Scene setup ----------

const scene = new THREE.Scene();
scene.background = new THREE.Color(PALETTE.cream);
scene.fog = new THREE.Fog(PALETTE.cream, 18, 38);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
const cameraOffset = new THREE.Vector3(0, 7.5, 9);
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

// ---------- Lighting ----------

scene.add(new THREE.AmbientLight(0xffffff, 0.75));
const sun = new THREE.DirectionalLight(0xffffff, 0.9);
sun.position.set(8, 14, 6);
scene.add(sun);

// ---------- Ground ----------

const groundSize = 30;
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(groundSize, groundSize),
  new THREE.MeshLambertMaterial({ color: PALETTE.tan })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

const grid = new THREE.GridHelper(groundSize, 20, PALETTE.olive, PALETTE.olive);
grid.position.y = 0.01;
grid.material.transparent = true;
grid.material.opacity = 0.12;
scene.add(grid);

const boundary = groundSize / 2 - 1;

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

character.position.set(0, 0, 4);
scene.add(character);

// ---------- Exhibits ----------

EXHIBITS.forEach((exhibit) => {
  const pedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(1.1, 1.3, 0.6, 8),
    new THREE.MeshLambertMaterial({ color: PALETTE.cream })
  );
  pedestal.position.copy(exhibit.position);
  pedestal.position.y = 0.3;
  scene.add(pedestal);

  const marker = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.55, 0),
    new THREE.MeshLambertMaterial({ color: exhibit.color })
  );
  marker.position.copy(exhibit.position);
  marker.position.y = 1.5;
  scene.add(marker);
  exhibit.marker = marker;

  const labelDiv = document.createElement("div");
  labelDiv.className = "label";
  labelDiv.textContent = exhibit.label;
  const labelObj = new CSS2DObject(labelDiv);
  labelObj.position.set(exhibit.position.x, 2.6, exhibit.position.z);
  scene.add(labelObj);
});

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

let nearestExhibit = null;

function tryInteract() {
  if (nearestExhibit) openPanel(nearestExhibit);
}

function openPanel(exhibit) {
  panelEyebrow.textContent = exhibit.eyebrow;
  panelTitle.textContent = exhibit.title;
  panelBody.textContent = exhibit.body;
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
const SPEED = 5.5;

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.1);
  const t = clock.getElapsedTime();

  moveDir.set(0, 0, 0);
  if (keys.has("up")) moveDir.z -= 1;
  if (keys.has("down")) moveDir.z += 1;
  if (keys.has("left")) moveDir.x -= 1;
  if (keys.has("right")) moveDir.x += 1;

  if (moveDir.lengthSq() > 0) {
    moveDir.normalize();
    character.position.x += moveDir.x * SPEED * delta;
    character.position.z += moveDir.z * SPEED * delta;
    character.position.x = THREE.MathUtils.clamp(character.position.x, -boundary, boundary);
    character.position.z = THREE.MathUtils.clamp(character.position.z, -boundary, boundary);

    const targetAngle = Math.atan2(moveDir.x, moveDir.z);
    let angleDiff = targetAngle - character.rotation.y;
    angleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
    character.rotation.y += angleDiff * Math.min(delta * 10, 1);

    body.position.y = 1.05 + Math.abs(Math.sin(t * 10)) * 0.06;
  }

  // Nearest exhibit / interaction prompt
  let closest = null;
  let closestDist = Infinity;
  EXHIBITS.forEach((exhibit) => {
    exhibit.marker.rotation.y += delta * 0.6;
    exhibit.marker.position.y = 1.5 + Math.sin(t * 2 + exhibit.position.x) * 0.08;
    const dist = character.position.distanceTo(exhibit.position);
    if (dist < closestDist) {
      closestDist = dist;
      closest = exhibit;
    }
  });

  if (closest && closestDist < INTERACT_RADIUS) {
    nearestExhibit = closest;
    promptTextEl.textContent = closest.label;
    promptEl.classList.add("visible");
  } else {
    nearestExhibit = null;
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
