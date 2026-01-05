const BACKGROUND = "#101010";

const canvas = document.getElementById("lorenz");
const ctx = canvas.getContext("2d");
const container = document.getElementById("container");

let width, height;

function resize() {
    width = container.clientWidth;
    height = container.clientHeight;
    canvas.width = width;
    canvas.height = height;
}
window.addEventListener('resize', resize);
resize();

const ui = {
    s1: {
        sigma: document.getElementById('s1-sigma'),
        rho: document.getElementById('s1-rho'),
        beta: document.getElementById('s1-beta'),
        x: document.getElementById('s1-x'),
        y: document.getElementById('s1-y'),
        z: document.getElementById('s1-z'),
    },
    s2: {
        sigma: document.getElementById('s2-sigma'),
        rho: document.getElementById('s2-rho'),
        beta: document.getElementById('s2-beta'),
        x: document.getElementById('s2-x'),
        y: document.getElementById('s2-y'),
        z: document.getElementById('s2-z'),
    },
    btnPause: document.getElementById('btn-pause'),
    btnReset: document.getElementById('btn-reset'),
    viewBtns: document.querySelectorAll('.view-btn'),
    legend: document.getElementById('legend')
};

let viewMode = 'single'; // 'single', 'overlap', 'side-by-side'
let paused = false;
let angle = 0;

class LorenzSystem {
    constructor(x, y, z, color, sigma, rho, beta) {
        this.initial = { x, y, z };
        this.params = { sigma, rho, beta };
        this.reset();
        this.color = color;
    }

    reset() {
        this.x = this.initial.x;
        this.y = this.initial.y;
        this.z = this.initial.z;
        this.points = [];
        this.maxPoints = 3000;
    }

    update(dt) {
        const dx = this.params.sigma * (this.y - this.x) * dt;
        const dy = (this.x * (this.params.rho - this.z) - this.y) * dt;
        const dz = (this.x * this.y - this.params.beta * this.z) * dt;

        this.x += dx;
        this.y += dy;
        this.z += dz;

        this.points.push({ x: this.x, y: this.y, z: this.z });
        if (this.points.length > this.maxPoints) {
            this.points.shift();
        }
    }
}

const system1 = new LorenzSystem(0.1, 0, 0, '#50FF50', 10, 28, 8/3);
const system2 = new LorenzSystem(0.101, 0, 0, '#FF5050', 10, 28, 8/3);

const systems = [system1, system2];

function project(p, cx, cy, w, h, angle) {
    const p_z_centered = p.z - 25;

    const c = Math.cos(angle);
    const s = Math.sin(angle);

    // Rotate around Y axis
    const rotX = p.x * c - p_z_centered * s;
    const rotZ = p.x * s + p_z_centered * c;
    const rotY = p.y;

    // Perspective projection
    const scale = 0.8;
    const distance = 60;
    const z_trans = rotZ + distance;

    if (z_trans <= 0) return null; // Behind camera

    const px = (rotX * scale) / z_trans;
    const py = (rotY * scale) / z_trans;

    const minDim = Math.min(w, h);

    return {
        x: cx + px * minDim,
        y: cy - py * minDim // Flip Y for screen coords
    };
}

function drawSystem(system, cx, cy, w, h) {
    if (system.points.length < 2) return;

    ctx.strokeStyle = system.color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();

    let started = false;

    for (let i = 0; i < system.points.length; i++) {
        const p3 = system.points[i];
        const p2 = project(p3, cx, cy, w, h, angle);

        if (!p2) {
            started = false;
            continue;
        }

        if (!started) {
            ctx.moveTo(p2.x, p2.y);
            started = true;
        } else {
            ctx.lineTo(p2.x, p2.y);
        }
    }
    ctx.stroke();

    // Draw head
    const head3 = system.points[system.points.length - 1];
    const head2 = project(head3, cx, cy, w, h, angle);
    if(head2) {
        ctx.fillStyle = system.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = system.color;
        ctx.fillRect(head2.x - 3, head2.y - 3, 6, 6);
        ctx.shadowBlur = 0;
    }
}

function loop() {
    if (!paused) {
        // Update physics multiple times per frame
        const steps = 5;
        const dt = 0.005;

        for (let s = 0; s < steps; s++) {
            if (viewMode === 'single') {
                system1.update(dt);
            } else {
                system1.update(dt);
                system2.update(dt);
            }
        }
        angle += 0.005;
    }

    // Render
    ctx.fillStyle = BACKGROUND;
    ctx.fillRect(0, 0, width, height);

    if (viewMode === 'single') {
        drawSystem(system1, width / 2, height / 2, width, height);
    } else if (viewMode === 'overlap') {
        ctx.globalCompositeOperation = 'screen';
        drawSystem(system1, width / 2, height / 2, width, height);
        drawSystem(system2, width / 2, height / 2, width, height);
        ctx.globalCompositeOperation = 'source-over';
    } else if (viewMode === 'side-by-side') {
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(width / 2, 0);
        ctx.lineTo(width / 2, height);
        ctx.stroke();

        drawSystem(system1, width / 4, height / 2, width / 2, height);
        drawSystem(system2, (width * 3) / 4, height / 2, width / 2, height);
    }

    requestAnimationFrame(loop);
}

function updateParams() {
    system1.params.sigma = parseFloat(ui.s1.sigma.value);
    system1.params.rho = parseFloat(ui.s1.rho.value);
    system1.params.beta = parseFloat(ui.s1.beta.value);
    system1.initial.x = parseFloat(ui.s1.x.value);
    system1.initial.y = parseFloat(ui.s1.y.value);
    system1.initial.z = parseFloat(ui.s1.z.value);

    system2.params.sigma = parseFloat(ui.s2.sigma.value);
    system2.params.rho = parseFloat(ui.s2.rho.value);
    system2.params.beta = parseFloat(ui.s2.beta.value);
    system2.initial.x = parseFloat(ui.s2.x.value);
    system2.initial.y = parseFloat(ui.s2.y.value);
    system2.initial.z = parseFloat(ui.s2.z.value);
}

// Bind listeners
['sigma', 'rho', 'beta', 'x', 'y', 'z'].forEach(key => {
    ui.s1[key].addEventListener('input', updateParams);
    ui.s2[key].addEventListener('input', updateParams);
});

ui.btnPause.addEventListener('click', () => {
    paused = !paused;
    ui.btnPause.textContent = paused ? "Resume" : "Pause";
});

ui.btnReset.addEventListener('click', () => {
    systems.forEach(s => s.reset());
});

ui.viewBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        ui.viewBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        viewMode = btn.dataset.mode;

        if (viewMode === 'overlap' || viewMode === 'side-by-side') {
            ui.legend.style.display = 'block';
        } else {
            ui.legend.style.display = 'none';
        }
    });
});

// Start
updateParams();
loop();
