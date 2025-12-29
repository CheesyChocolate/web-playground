const BACKGROUND = "#101010";
const FOREGROUND = "#50FF50";

const game = document.getElementById("quantum");
game.width = 800;
game.height = 800;
const ctx = game.getContext("2d");

const slit_x = 400;
const slit_width = 10;
const slit_spacing = 60;

let time = 0;

function frame() {
  time += 0.2;

  ctx.fillStyle = BACKGROUND;
  ctx.fillRect(0, 0, game.width, game.height);

  const imageData = ctx.createImageData(game.width, game.height);
  const data = imageData.data;

  const s1_y = game.height / 2 - slit_spacing / 2;
  const s2_y = game.height / 2 + slit_spacing / 2;
  const source_y = game.height / 2;

  for (let y = 0; y < game.height; y++) {
    for (let x = 0; x < game.width; x++) {
      let intensity = 0;

      if (x < slit_x) {
        const d = Math.sqrt(x ** 2 + (y - source_y) ** 2);
        intensity = Math.sin(d * 0.2 - time);
      } else {
        const d1 = Math.sqrt((x - slit_x) ** 2 + (y - s1_y) ** 2);
        const d2 = Math.sqrt((x - slit_x) ** 2 + (y - s2_y) ** 2);
        const wave1 = Math.sin(d1 * 0.2 - time);
        const wave2 = Math.sin(d2 * 0.2 - time);
        intensity = (wave1 + wave2) / 2;
      }

      const index = (x + y * game.width) * 4;
      const brightness = Math.max(0, intensity * 255);

      data[index] = 80 * (brightness / 255);
      data[index + 1] = 255 * (brightness / 255);
      data[index + 2] = 80 * (brightness / 255);
      data[index + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);

  ctx.fillStyle = "#333";
  ctx.fillRect(slit_x - 5, 0, 10, s1_y - slit_width / 2);
  ctx.fillRect(
    slit_x - 5,
    s1_y + slit_width / 2,
    10,
    slit_spacing - slit_width,
  );
  ctx.fillRect(
    slit_x - 5,
    s2_y + slit_width / 2,
    10,
    game.height - (s2_y + slit_width / 2),
  );

  setTimeout(frame, 1000 / 30);
}

frame();
