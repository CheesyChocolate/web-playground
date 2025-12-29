const BACKGROUND = "#101010";
const FOREGROUND = "#50FF50";

const game = document.getElementById("lorenz");
game.width = 800;
game.height = 800;
const ctx = game.getContext("2d");

const sigma = 10;
const rho = 28;
const beta = 8 / 3;

let x = 0.1;
let y = 0;
let z = 0;

const points = [];
const maxPoints = 20000;

let angle = 0;

function project(p_x, p_y, p_z) {
  // Center the Z coordinate (approx center of attractor is z=25)
  const p_z_centered = p_z - 25;

  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const rotX = p_x * c - p_z_centered * s;
  const rotZ = p_x * s + p_z_centered * c;
  const rotY = p_y;

  const scale = 1.2;
  const distance = 60;
  const z_trans = rotZ + distance;

  // -1..1 => screen
  const px = (rotX * scale) / z_trans;
  const py = (rotY * scale) / z_trans;

  return {
    x: ((px + 1) / 2) * game.width,
    y: (1 - (py + 1) / 2) * game.height,
  };
}

function update(dt) {
  const dx = sigma * (y - x) * dt;
  const dy = (x * (rho - z) - y) * dt;
  const dz = (x * y - beta * z) * dt;

  x += dx;
  y += dy;
  z += dz;

  points.push({ x, y, z });
  if (points.length > maxPoints) {
    points.shift();
  }
}

function frame() {
  for (let i = 0; i < 5; i++) {
    update(0.01);
  }
  angle += 0.01;

  ctx.fillStyle = BACKGROUND;
  ctx.fillRect(0, 0, game.width, game.height);

  if (points.length > 1) {
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = project(points[i].x, points[i].y, points[i].z);
      const p2 = project(points[i + 1].x, points[i + 1].y, points[i + 1].z);

      const alpha = i / points.length;
      ctx.strokeStyle = `rgba(80, 255, 80, ${alpha})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
  }

  setTimeout(frame, 1000 / 60);
}

frame();
