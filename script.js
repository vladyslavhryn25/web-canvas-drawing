const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });

const drawBtn = document.getElementById('drawBtn');
const eraseBtn = document.getElementById('eraseBtn');
const stampBtn = document.getElementById('stampBtn');
const undoBtn = document.getElementById('undoBtn');
const clearBtn = document.getElementById('clearBtn');
const sizeInput = document.getElementById('sizeInput');
const sizeValue = document.getElementById('sizeValue');
const colorInput = document.getElementById('colorInput');

let mode = 'draw';
let isDrawing = false;
let lastX = 0;
let lastY = 0;
let history = [];

function resizeCanvas() {
    const saved = ctx.getImageData(0, 0, canvas.width, canvas.height);
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
    ctx.putImageData(saved, 0, 0);
}

function saveState() {
    history.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    if (history.length > 50) {
        history.shift();
    }
    undoBtn.disabled = false;
}

function undo() {
    if (history.length === 0) {
        return;
    }
    ctx.putImageData(history.pop(), 0, 0);
    undoBtn.disabled = history.length === 0;
}

function clearCanvas() {
    saveState();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function setMode(newMode) {
    mode = newMode;
    drawBtn.classList.remove('active');
    eraseBtn.classList.remove('active');
    stampBtn.classList.remove('active');

    if (mode === 'draw') {
        drawBtn.classList.add('active');
    } else if (mode === 'erase') {
        eraseBtn.classList.add('active');
    } else {
        stampBtn.classList.add('active');
    }
}

function setBrush() {
    ctx.lineWidth = sizeInput.value;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = colorInput.value;
    ctx.fillStyle = colorInput.value;

    if (mode === 'erase') {
        ctx.globalCompositeOperation = 'destination-out';
    } else {
        ctx.globalCompositeOperation = 'source-over';
    }
}

function drawStar(x, y) {
    const outer = Math.max(10, sizeInput.value * 2);
    const inner = outer * 0.45;

    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? outer : inner;
        const angle = Math.PI / 5 * i - Math.PI / 2;
        ctx.lineTo(x + Math.cos(angle) * r, y + Math.sin(angle) * r);
    }
    ctx.closePath();
    ctx.fill();
}

function startDrawing(e) {
    saveState();
    setBrush();

    if (mode === 'stamp') {
        drawStar(e.offsetX, e.offsetY);
        return;
    }

    isDrawing = true;
    lastX = e.offsetX;
    lastY = e.offsetY;

    ctx.beginPath();
    ctx.arc(lastX, lastY, sizeInput.value / 2, 0, Math.PI * 2);
    ctx.fill();
}

function draw(e) {
    if (!isDrawing) {
        return;
    }

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();

    lastX = e.offsetX;
    lastY = e.offsetY;
}

function stopDrawing() {
    isDrawing = false;
}

drawBtn.addEventListener('click', () => setMode('draw'));
eraseBtn.addEventListener('click', () => setMode('erase'));
stampBtn.addEventListener('click', () => setMode('stamp'));
undoBtn.addEventListener('click', undo);
clearBtn.addEventListener('click', clearCanvas);

sizeInput.addEventListener('input', () => {
    sizeValue.textContent = sizeInput.value;
});

canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseleave', stopDrawing);

window.addEventListener('resize', resizeCanvas);

resizeCanvas();
undoBtn.disabled = true;
