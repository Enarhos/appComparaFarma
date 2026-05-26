/**
 * Genera splash.png para ComparaFarma
 * Expo usa resizeMode:"contain" + backgroundColor:"#16a34a"
 * → el contenido queda centrado; el fondo lo pone el app.json.
 * Usamos fondo transparente con el logo centrado.
 */
const { createCanvas } = require("@napi-rs/canvas");
const fs   = require("fs");
const path = require("path");

const ASSETS = path.join(__dirname, "..", "mobile", "assets");
const W = 1242;
const H = 2436;

const GREEN      = "#16a34a";
const GREEN_MID  = "#15803d";
const WHITE      = "#ffffff";

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawCapsule(ctx, cx, cy, len, thickness, colorLeft, colorRight) {
  const r       = thickness / 2;
  const halfLen = len / 2;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-Math.PI / 4);

  // Left half
  ctx.save();
  ctx.beginPath();
  ctx.rect(-halfLen - r, -r, halfLen + r, thickness);
  ctx.clip();
  ctx.fillStyle = colorLeft;
  ctx.beginPath();
  ctx.arc(-halfLen, 0, r, Math.PI / 2, (3 * Math.PI) / 2);
  ctx.lineTo(halfLen, -r);
  ctx.lineTo(halfLen, r);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Right half
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, -r, halfLen + r, thickness);
  ctx.clip();
  ctx.fillStyle = colorRight;
  ctx.beginPath();
  ctx.arc(halfLen, 0, r, -Math.PI / 2, Math.PI / 2);
  ctx.lineTo(-halfLen, r);
  ctx.lineTo(-halfLen, -r);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth   = 5;
  ctx.beginPath();
  ctx.moveTo(0, -r - 2);
  ctx.lineTo(0, r + 2);
  ctx.stroke();

  ctx.restore();
}

const canvas = createCanvas(W, H);
const ctx    = canvas.getContext("2d");

// Fondo verde degradado (completa lo que app.json pondría en transparente)
const grad = ctx.createLinearGradient(0, 0, W, H);
grad.addColorStop(0, "#1db954");
grad.addColorStop(0.5, GREEN);
grad.addColorStop(1, "#0d4024");
ctx.fillStyle = grad;
ctx.fillRect(0, 0, W, H);

const CX = W / 2;
const CY = H / 2 - 80;

// ── Cápsula ────────────────────────────────────────────────────────────────
drawCapsule(ctx, CX, CY - 60, 520, 210, WHITE, "rgba(255,255,255,0.42)");

// ── Tag ↓$ ─────────────────────────────────────────────────────────────────
const tagW = 210, tagH = 90, tagR = 24;
const tagX = CX + 100, tagY = CY + 80;
ctx.save();
ctx.shadowColor = "rgba(0,0,0,0.22)"; ctx.shadowBlur = 20; ctx.shadowOffsetY = 8;
ctx.fillStyle = WHITE;
roundRect(ctx, tagX, tagY, tagW, tagH, tagR);
ctx.fill();
ctx.restore();

ctx.fillStyle = GREEN_MID;
ctx.font = `bold 60px sans-serif`;
ctx.textAlign = "center";
ctx.textBaseline = "middle";
ctx.fillText("↓$", tagX + tagW / 2, tagY + tagH / 2 + 2);

// ── Nombre de la app ────────────────────────────────────────────────────────
ctx.fillStyle = WHITE;
ctx.font      = `bold 110px sans-serif`;
ctx.textAlign = "center";
ctx.textBaseline = "top";
ctx.fillText("ComparaFarma", CX, CY + 220);

// ── Tagline ─────────────────────────────────────────────────────────────────
ctx.fillStyle  = "rgba(255,255,255,0.75)";
ctx.font       = `46px sans-serif`;
ctx.textBaseline = "top";
ctx.fillText("Compara precios de medicamentos", CX, CY + 350);

const buf = canvas.toBuffer("image/png");
fs.writeFileSync(path.join(ASSETS, "splash.png"), buf);
console.log("✓ splash.png");
