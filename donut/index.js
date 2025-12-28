const BACKGROUND = "#101010";
const FOREGROUND = "#50FF50";

const game = document.getElementById("donut");
console.log(game);
game.width = 800;
game.height = 800;
const ctx = game.getContext("2d");
console.log(ctx);

function clear() {
  ctx.fillStyle = BACKGROUND;
  ctx.fillRect(0, 0, game.width, game.height);
}

function point({ x, y }) {
  const s = 20;
  ctx.fillStyle = FOREGROUND;
  ctx.fillRect(x - s / 2, y - s / 2, s, s);
}

function line(p1, p2) {
  ctx.lineWidth = 3;
  ctx.strokeStyle = FOREGROUND;
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.stroke();
}

function screen(p) {
  // -1..1 => 0..2 => 0..1 => 0..w
  return {
    x: ((p.x + 1) / 2) * game.width,
    y: (1 - (p.y + 1) / 2) * game.height,
  };
}

function project({ x, y, z }) {
  return {
    x: x / z,
    y: y / z,
  };
}

const FPS = 60;

function translate_z({ x, y, z }, dz) {
  return { x, y, z: z + dz };
}

function rotate_x({ x, y, z }, angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return {
    x,
    y: y * c - z * s,
    z: y * s + z * c,
  };
}

function rotate_y({ x, y, z }, angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return {
    x: x * c - z * s,
    y,
    z: x * s + z * c,
  };
}

function rotate_z({ x, y, z }, angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return {
    x: x * c - y * s,
    y: x * s + y * c,
    z,
  };
}

function generateDonut(R1, R2, segments, tubes) {
  // R1 = radius from center of torus to center of tube
  // R2 = radius of the tube itself
  const vertices = [];
  const faces = [];

  for (let i = 0; i < segments; i++) {
    const theta = (i / segments) * 2 * Math.PI; // angle around torus
    for (let j = 0; j < tubes; j++) {
      const phi = (j / tubes) * 2 * Math.PI; // angle around tube

      // Parametric equations for a torus
      const x = (R1 + R2 * Math.cos(phi)) * Math.cos(theta);
      const y = (R1 + R2 * Math.cos(phi)) * Math.sin(theta);
      const z = R2 * Math.sin(phi);

      vertices.push({ x, y, z });
    }
  }

  // quad faces
  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < tubes; j++) {
      const current = i * tubes + j;
      const next_i = ((i + 1) % segments) * tubes + j;
      const next_j = i * tubes + ((j + 1) % tubes);
      const next_both = ((i + 1) % segments) * tubes + ((j + 1) % tubes);

      faces.push([current, next_i, next_both, next_j]);
    }
  }

  return { vertices, faces };
}

const { vertices: vs, faces: fs } = generateDonut(1.0, 0.4, 30, 20);

let A = 0;
let B = 0;

function frame() {
  const dt = 1 / FPS;
  A += Math.PI * 0.5 * dt; // Rotate around X
  B += Math.PI * dt; // Rotate around Z

  clear();

  for (const f of fs) {
    for (let i = 0; i < f.length; ++i) {
      const a = vs[f[i]];
      const b = vs[f[(i + 1) % f.length]];

      const a_rot = rotate_z(rotate_x(a, A), B);
      const b_rot = rotate_z(rotate_x(b, A), B);

      const a_proj = project(translate_z(a_rot, 5));
      const b_proj = project(translate_z(b_rot, 5));

      line(screen(a_proj), screen(b_proj));
    }
  }

  setTimeout(frame, 1000 / FPS);
}

setTimeout(frame, 1000 / FPS);
