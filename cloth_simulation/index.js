const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const BACKGROUND = "#101010";
const FOREGROUND = "#50FF50";
const SPHERE_COLOR = "#308030";

canvas.width = 800;
canvas.height = 800;

const GRAVITY = 0.2;
const FRICTION = 0.99;
const ITERATIONS = 5;

let particles = [];
let constraints = [];

const sphere = {
  x: 0,
  y: -4,
  z: 0,
  radius: 6,
};

const ROWS = 25;
const COLS = 25;
const SPACING = 0.8;
const START_Y = 10;

let camDist = 250;
let angle = 0;
let pitch = -1.0;

function init() {
  particles = [];
  constraints = [];

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const px = (x - COLS / 2) * SPACING;
      const pz = (y - ROWS / 2) * SPACING;

      particles.push({
        x: px,
        y: START_Y,
        z: pz,
        ox: px,
        oy: START_Y,
        oz: pz,
        pinned: false,
      });
    }
  }

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const i = y * COLS + x;
      if (x < COLS - 1) constraints.push([i, i + 1, SPACING]);
      if (y < ROWS - 1) constraints.push([i, i + COLS, SPACING]);
    }
  }
}

function updatePoints() {
  for (const p of particles) {
    if (p.pinned) continue;
    const vx = (p.x - p.ox) * FRICTION;
    const vy = (p.y - p.oy) * FRICTION;
    const vz = (p.z - p.oz) * FRICTION;
    p.ox = p.x;
    p.oy = p.y;
    p.oz = p.z;
    p.x += vx;
    p.y += vy;
    p.z += vz;
    p.y -= GRAVITY * 0.1;
  }
}

function constrainPoints() {
  for (let i = 0; i < ITERATIONS; i++) {
    for (const [idx1, idx2, len] of constraints) {
      const p1 = particles[idx1],
        p2 = particles[idx2];
      const dx = p2.x - p1.x,
        dy = p2.y - p1.y,
        dz = p2.z - p1.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const diff = (dist - len) / dist;
      const offsetX = dx * diff * 0.5,
        offsetY = dy * diff * 0.5,
        offsetZ = dz * diff * 0.5;
      if (!p1.pinned) {
        p1.x += offsetX;
        p1.y += offsetY;
        p1.z += offsetZ;
      }
      if (!p2.pinned) {
        p2.x -= offsetX;
        p2.y -= offsetY;
        p2.z -= offsetZ;
      }
    }
    for (const p of particles) {
      const dx = p.x - sphere.x,
        dy = p.y - sphere.y,
        dz = p.z - sphere.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < sphere.radius) {
        const f = sphere.radius / dist;
        p.x = sphere.x + dx * f;
        p.y = sphere.y + dy * f;
        p.z = sphere.z + dz * f;
      }
    }
  }
}

function project(p) {
  const c1 = Math.cos(angle),
    s1 = Math.sin(angle);
  const rx1 = p.x * c1 - p.z * s1,
    rz1 = p.x * s1 + p.z * c1,
    ry1 = p.y;

  const c2 = Math.cos(pitch),
    s2 = Math.sin(pitch);
  const ry2 = ry1 * c2 - rz1 * s2,
    rz2 = ry1 * s2 + rz1 * c2;

  const z = rz2 + camDist;
  const fov = 800;
  const scale = fov / z;

  return {
    x: canvas.width / 2 + rx1 * scale * 8,
    y: canvas.height / 2 - ry2 * scale * 8,
    scale: scale,
    visible: z > 0,
  };
}

function drawSphere() {
  ctx.strokeStyle = "rgba(48, 128, 48, 0.4)";
  ctx.lineWidth = 1;
  const segments = 32;
  const rings = 12;

  for (let j = 1; j < rings; j++) {
    const phi = (j / rings) * Math.PI;
    const r = sphere.radius * Math.sin(phi);
    const y = sphere.y + sphere.radius * Math.cos(phi);

    ctx.beginPath();
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      const p = {
        x: sphere.x + Math.cos(theta) * r,
        y: y,
        z: sphere.z + Math.sin(theta) * r,
      };
      const proj = project(p);
      if (i === 0) ctx.moveTo(proj.x, proj.y);
      else ctx.lineTo(proj.x, proj.y);
    }
    ctx.stroke();
  }

  for (let j = 0; j < rings; j++) {
    const theta = (j / rings) * Math.PI;
    ctx.beginPath();
    for (let i = 0; i <= segments; i++) {
      const phi = (i / segments) * Math.PI * 2;
      const p = {
        x: sphere.x + sphere.radius * Math.sin(phi) * Math.cos(theta),
        y: sphere.y + sphere.radius * Math.cos(phi),
        z: sphere.z + sphere.radius * Math.sin(phi) * Math.sin(theta),
      };
      const proj = project(p);
      if (i === 0) ctx.moveTo(proj.x, proj.y);
      else ctx.lineTo(proj.x, proj.y);
    }
    ctx.stroke();
  }
}

function frame() {
  updatePoints();
  constrainPoints();
  angle += 0.005;

  ctx.fillStyle = BACKGROUND;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawSphere();

  ctx.strokeStyle = FOREGROUND;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (const [idx1, idx2] of constraints) {
    const p1 = project(particles[idx1]),
      p2 = project(particles[idx2]);
    if (p1.visible && p2.visible) {
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
    }
  }
  ctx.stroke();
  requestAnimationFrame(frame);
}

document.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === "r") init();
});
init();
frame();
