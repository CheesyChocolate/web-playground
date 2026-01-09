const canvas = document.getElementById("smoke");
const ctx = canvas.getContext("2d");

const N = 128;
const ITER = 4;
const SCALE = 6;
const SIZE = N * SCALE;
const DIFFUSION = 0.0001;
const VISCOSITY = 0.00005;

canvas.width = SIZE;
canvas.height = SIZE;

let size = (N + 2) * (N + 2);

let u = new Float32Array(size);
let v = new Float32Array(size);
let u_prev = new Float32Array(size);
let v_prev = new Float32Array(size);

let r = new Float32Array(size);
let g = new Float32Array(size);
let b = new Float32Array(size);
let r_prev = new Float32Array(size);
let g_prev = new Float32Array(size);
let b_prev = new Float32Array(size);

const BG_COLOR = { r: 16, g: 16, b: 16 };

// IX: 2D to 1D mapping
function IX(x, y) {
  return x + (N + 2) * y;
}

function diffuse(b, x, x0, diff, dt) {
  let a = dt * diff * (N - 2) * (N - 2);
  lin_solve(b, x, x0, a, 1 + 6 * a);
}

function lin_solve(b, x, x0, a, c) {
  let cRecip = 1.0 / c;
  for (let k = 0; k < ITER; k++) {
    for (let j = 1; j <= N; j++) {
      for (let i = 1; i <= N; i++) {
        x[IX(i, j)] =
          (x0[IX(i, j)] +
            a *
              (x[IX(i + 1, j)] +
                x[IX(i - 1, j)] +
                x[IX(i, j + 1)] +
                x[IX(i, j - 1)])) *
          cRecip;
      }
    }
    set_bnd(b, x);
  }
}

function project(velocX, velocY, p, div) {
  for (let j = 1; j <= N; j++) {
    for (let i = 1; i <= N; i++) {
      div[IX(i, j)] =
        (-0.5 *
          (velocX[IX(i + 1, j)] -
            velocX[IX(i - 1, j)] +
            velocY[IX(i, j + 1)] -
            velocY[IX(i, j - 1)])) /
        N;
      p[IX(i, j)] = 0;
    }
  }
  set_bnd(0, div);
  set_bnd(0, p);
  lin_solve(0, p, div, 1, 4);

  for (let j = 1; j <= N; j++) {
    for (let i = 1; i <= N; i++) {
      velocX[IX(i, j)] -= 0.5 * (p[IX(i + 1, j)] - p[IX(i - 1, j)]) * N;
      velocY[IX(i, j)] -= 0.5 * (p[IX(i, j + 1)] - p[IX(i, j - 1)]) * N;
    }
  }
  set_bnd(1, velocX);
  set_bnd(2, velocY);
}

function advect(b, d, d0, velocX, velocY, dt) {
  let i0, j0, i1, j1;
  let x, y, s0, t0, s1, t1;
  let dt0 = dt * (N - 2);

  for (let j = 1; j <= N; j++) {
    for (let i = 1; i <= N; i++) {
      x = i - dt0 * velocX[IX(i, j)];
      y = j - dt0 * velocY[IX(i, j)];

      if (x < 0.5) x = 0.5;
      if (x > N + 0.5) x = N + 0.5;
      i0 = Math.floor(x);
      i1 = i0 + 1;

      if (y < 0.5) y = 0.5;
      if (y > N + 0.5) y = N + 0.5;
      j0 = Math.floor(y);
      j1 = j0 + 1;

      s1 = x - i0;
      s0 = 1.0 - s1;
      t1 = y - j0;
      t0 = 1.0 - t1;

      d[IX(i, j)] =
        s0 * (t0 * d0[IX(i0, j0)] + t1 * d0[IX(i0, j1)]) +
        s1 * (t0 * d0[IX(i1, j0)] + t1 * d0[IX(i1, j1)]);
    }
  }
  set_bnd(b, d);
}

function set_bnd(b, x) {
  for (let i = 1; i <= N; i++) {
    x[IX(i, 0)] = b === 2 ? -x[IX(i, 1)] : x[IX(i, 1)];
    x[IX(i, N + 1)] = b === 2 ? -x[IX(i, N)] : x[IX(i, N)];
  }
  for (let j = 1; j <= N; j++) {
    x[IX(0, j)] = b === 1 ? -x[IX(1, j)] : x[IX(1, j)];
    x[IX(N + 1, j)] = b === 1 ? -x[IX(N, j)] : x[IX(N, j)];
  }

  x[IX(0, 0)] = 0.5 * (x[IX(1, 0)] + x[IX(0, 1)]);
  x[IX(0, N + 1)] = 0.5 * (x[IX(1, N + 1)] + x[IX(0, N)]);
  x[IX(N + 1, 0)] = 0.5 * (x[IX(N, 0)] + x[IX(N + 1, 1)]);
  x[IX(N + 1, N + 1)] = 0.5 * (x[IX(N, N + 1)] + x[IX(N + 1, N)]);
}

function step(dt) {
  diffuse(1, u_prev, u, VISCOSITY, dt);
  diffuse(2, v_prev, v, VISCOSITY, dt);

  project(u_prev, v_prev, u, v);

  advect(1, u, u_prev, u_prev, v_prev, dt);
  advect(2, v, v_prev, u_prev, v_prev, dt);

  project(u, v, u_prev, v_prev);

  diffuse(0, r_prev, r, DIFFUSION, dt);
  diffuse(0, g_prev, g, DIFFUSION, dt);
  diffuse(0, b_prev, b, DIFFUSION, dt);

  advect(0, r, r_prev, u, v, dt);
  advect(0, g, g_prev, u, v, dt);
  advect(0, b, b_prev, u, v, dt);
}

function draw() {
  // TODO: Clear with background color
  // ctx.fillStyle = "#101010";
  // ctx.fillRect(0, 0, canvas.width, canvas.height);

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  for (let j = 1; j <= N; j++) {
    for (let i = 1; i <= N; i++) {
      const idx_grid = IX(i, j);

      let valR = r[idx_grid];
      let valG = g[idx_grid];
      let valB = b[idx_grid];

      const x = (i - 1) * SCALE;
      const y = (j - 1) * SCALE;

      const pixelR = Math.min(BG_COLOR.r + valR * 255, 255);
      const pixelG = Math.min(BG_COLOR.g + valG * 255, 255);
      const pixelB = Math.min(BG_COLOR.b + valB * 255, 255);

      for (let py = 0; py < SCALE; py++) {
        for (let px = 0; px < SCALE; px++) {
          const idx = ((y + py) * canvas.width + (x + px)) * 4;
          data[idx] = pixelR;
          data[idx + 1] = pixelG;
          data[idx + 2] = pixelB;
          data[idx + 3] = 255;
        }
      }
    }
  }
  ctx.putImageData(imgData, 0, 0);
}

function updateEmitters(dt) {
  const centerY = Math.floor(N / 2);
  const spread = 6;
  const force = 100 * dt;
  const dense = 2000 * dt;

  for (let j = centerY - spread; j <= centerY + spread; j++) {
    let i = 10;
    if (j > 0 && j <= N) {
      u[IX(i, j)] += force;
      g[IX(i, j)] += dense;
    }
  }

  for (let j = centerY - spread; j <= centerY + spread; j++) {
    let i = N - 10;
    if (j > 0 && j <= N) {
      u[IX(i, j)] -= force;
      r[IX(i, j)] += dense;
      b[IX(i, j)] += dense;
    }
  }
}

let isMouseDown = false;
let lastX = 0;
let lastY = 0;

canvas.addEventListener("mousedown", (e) => {
  isMouseDown = true;
  const rect = canvas.getBoundingClientRect();
  lastX = e.clientX - rect.left;
  lastY = e.clientY - rect.top;
});

canvas.addEventListener("mouseup", () => {
  isMouseDown = false;
});

canvas.addEventListener("mousemove", (e) => {
  if (!isMouseDown) return;

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const i = Math.floor(x / SCALE) + 1;
  const j = Math.floor(y / SCALE) + 1;

  if (i >= 1 && i <= N && j >= 1 && j <= N) {
    const amt = 500;
    r[IX(i, j)] += amt;
    g[IX(i, j)] += amt;
    b[IX(i, j)] += amt;

    const force = 10.0;
    u[IX(i, j)] += (x - lastX) * force;
    v[IX(i, j)] += (y - lastY) * force;
  }

  lastX = x;
  lastY = y;
});

let lastTime = Date.now();
function loop() {
  const now = Date.now();
  const dt = (now - lastTime) / 1000;
  lastTime = now;

  for (let i = 0; i < size; i++) {
    r[i] *= 0.98;
    g[i] *= 0.98;
    b[i] *= 0.98;
  }

  updateEmitters(Math.min(dt, 0.1));
  step(Math.min(dt, 0.1));
  draw();
  requestAnimationFrame(loop);
}

loop();
