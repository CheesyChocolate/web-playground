const BACKGROUND = "#101010";
const FOREGROUND = "#50FF50";

const game = document.getElementById("ascii");
game.width = 800;
game.height = 800;
const ctx = game.getContext("2d");

// Font setup
const fontSize = 14;
ctx.font = `${fontSize}px monospace`;
const charWidth = ctx.measureText("A").width;
const charHeight = fontSize; // 14px

const cols = Math.floor(game.width / charWidth);
const rows = Math.floor(game.height / charHeight);

const chars = ".,-~:;=!*#$@";

let A = 0;
let B = 0;

function frame() {
  const b = new Array(cols * rows).fill(" ");
  const zBuffer = new Array(cols * rows).fill(0);
  for (let j = 0; j < 6.28; j += 0.07) {
    // theta
    for (let i = 0; i < 6.28; i += 0.02) {
      // phi
      const c = Math.sin(i);
      const d = Math.cos(j);
      const e = Math.sin(A);
      const f = Math.sin(j);
      const g = Math.cos(A);
      const h = d + 2;
      const D = 1 / (c * h * e + f * g + 5);
      const l = Math.cos(i);
      const m = Math.cos(B);
      const n = Math.sin(B);
      const t = c * h * g - f * e;
      const x = Math.floor(cols / 2 + (cols / 2) * D * (l * h * m - t * n));
      const y = Math.floor(rows / 2 + (rows / 2) * D * (l * h * n + t * m));
      const o = x + cols * y;
      const N = 8 * ((f * e - c * d * g) * m - c * d * e - f * g - l * d * n);
      if (rows > y && y > 0 && x > 0 && cols > x && D > zBuffer[o]) {
        zBuffer[o] = D;
        const luminanceIndex = Math.max(0, Math.floor(N));
        b[o] = chars[luminanceIndex] || ".";
      }
    }
  }

  ctx.fillStyle = BACKGROUND;
  ctx.fillRect(0, 0, game.width, game.height);
  ctx.fillStyle = FOREGROUND;
  ctx.textBaseline = "top";

  for (let k = 0; k < rows * cols; k++) {
    const char = b[k];
    if (char !== " ") {
      const x = (k % cols) * charWidth;
      const y = Math.floor(k / cols) * charHeight;
      ctx.fillText(char, x, y);
    }
  }

  A += 0.04;
  B += 0.02;
  setTimeout(frame, 30);
}

frame();
