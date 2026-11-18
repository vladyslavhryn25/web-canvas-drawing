'use strict';

/* ==========================================================
   Canvas Drawing App
   Tools: pencil (D), eraser (E), stamp (S), undo, clean canvas
   ========================================================== */

const MAX_HISTORY = 50;
const TOOLS = { DRAW: 'draw', ERASE: 'erase', STAMP: 'stamp' };

// ---------- DOM ----------
const canvas = document.getElementById('canvas');
const canvasWrap = document.getElementById('canvasWrap');
const ctx = canvas.getContext('2d', { willReadFrequently: true });

const drawBtn = document.getElementById('drawBtn');
const eraseBtn = document.getElementById('eraseBtn');
const stampBtn = document.getElementById('stampBtn');
const undoBtn = document.getElementById('undoBtn');
const clearBtn = document.getElementById('clearBtn');
const sizeInput = document.getElementById('sizeInput');
const sizeValue = document.getElementById('sizeValue');
const colorInput = document.getElementById('colorInput');

const toolButtons = {
    [TOOLS.DRAW]: drawBtn,
    [TOOLS.ERASE]: eraseBtn,
    [TOOLS.STAMP]: stampBtn
};

// ---------- State ----------
const state = {
    tool: TOOLS.DRAW,
    size: Number(sizeInput.value),
    color: colorInput.value,
    isDrawing: false,
    lastPoint: null,
    history: []
};

// ---------- Canvas setup ----------
function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const { width, height } = canvasWrap.getBoundingClientRect();
    const newWidth = Math.max(1, Math.floor(width * dpr));
    const newHeight = Math.max(1, Math.floor(height * dpr));

    if (canvas.width === newWidth && canvas.height === newHeight) {
        return;
    }

    // Keep the current drawing when the canvas size changes.
    const backup = document.createElement('canvas');
    backup.width = canvas.width;
    backup.height = canvas.height;
    backup.getContext('2d').drawImage(canvas, 0, 0);

    canvas.width = newWidth;
    canvas.height = newHeight;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(backup, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function getPointerPosition(event) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };
}

// ---------- History (undo) ----------
function saveSnapshot() {
    state.history.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    if (state.history.length > MAX_HISTORY) {
        state.history.shift();
    }
    updateUndoButton();
}

function undo() {
    const snapshot = state.history.pop();
    if (!snapshot) {
        return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.putImageData(snapshot, 0, 0);
    updateUndoButton();
}

function updateUndoButton() {
    undoBtn.disabled = state.history.length === 0;
}

// ---------- Drawing ----------
function applyStrokeStyle() {
    ctx.lineWidth = state.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (state.tool === TOOLS.ERASE) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = '#000';
        ctx.fillStyle = '#000';
    } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = state.color;
        ctx.fillStyle = state.color;
    }
}

function drawDot(point) {
    ctx.beginPath();
    ctx.arc(point.x, point.y, state.size / 2, 0, Math.PI * 2);
    ctx.fill();
}

function drawLine(from, to) {
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
}

// Predefined monochrome stamp: a five-pointed star.
function drawStamp(point) {
    const outerRadius = Math.max(10, state.size * 2);
    const innerRadius = outerRadius * 0.45;
    const spikes = 5;

    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = state.color;
    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (Math.PI / spikes) * i - Math.PI / 2;
        const x = point.x + Math.cos(angle) * radius;
        const y = point.y + Math.sin(angle) * radius;
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.closePath();
    ctx.fill();
}

// ---------- Pointer handlers ----------
function handlePointerDown(event) {
    if (event.button !== 0) {
        return;
    }
    event.preventDefault();

    const point = getPointerPosition(event);
    saveSnapshot();

    if (state.tool === TOOLS.STAMP) {
        drawStamp(point);
        return;
    }

    canvas.setPointerCapture(event.pointerId);
    state.isDrawing = true;
    state.lastPoint = point;
    applyStrokeStyle();
    drawDot(point);
}

function handlePointerMove(event) {
    if (!state.isDrawing) {
        return;
    }
    const point = getPointerPosition(event);
    drawLine(state.lastPoint, point);
    state.lastPoint = point;
}

function handlePointerUp(event) {
    if (!state.isDrawing) {
        return;
    }
    state.isDrawing = false;
    state.lastPoint = null;
    if (canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
    }
}

// ---------- Toolbar ----------
function setTool(tool) {
    state.tool = tool;
    Object.entries(toolButtons).forEach(([name, button]) => {
        const isActive = name === tool;
        button.classList.toggle('active', isActive);
        button.setAttribute('aria-pressed', String(isActive));
    });
    canvas.style.cursor = tool === TOOLS.STAMP ? 'copy' : 'crosshair';
}

function clearCanvas() {
    saveSnapshot();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function handleKeyDown(event) {
    const target = event.target;
    if (target instanceof HTMLInputElement) {
        return;
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        undo();
        return;
    }
    if (event.ctrlKey || event.metaKey || event.altKey) {
        return;
    }

    switch (event.key.toLowerCase()) {
        case 'd':
            setTool(TOOLS.DRAW);
            break;
        case 'e':
            setTool(TOOLS.ERASE);
            break;
        case 's':
            setTool(TOOLS.STAMP);
            break;
        case 'c':
            clearCanvas();
            break;
        default:
            break;
    }
}

// ---------- Init ----------
function bindEvents() {
    drawBtn.addEventListener('click', () => setTool(TOOLS.DRAW));
    eraseBtn.addEventListener('click', () => setTool(TOOLS.ERASE));
    stampBtn.addEventListener('click', () => setTool(TOOLS.STAMP));
    undoBtn.addEventListener('click', undo);
    clearBtn.addEventListener('click', clearCanvas);

    sizeInput.addEventListener('input', () => {
        state.size = Number(sizeInput.value);
        sizeValue.textContent = sizeInput.value;
    });
    colorInput.addEventListener('input', () => {
        state.color = colorInput.value;
    });

    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('pointercancel', handlePointerUp);

    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', resizeCanvas);
}

function init() {
    resizeCanvas();
    bindEvents();
    setTool(TOOLS.DRAW);
    updateUndoButton();
}

init();
