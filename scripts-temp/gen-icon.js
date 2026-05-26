/**
 * Genera el ícono de ComparaFarma:
 *   - icon.png          1024×1024  (iOS / splash / general)
 *   - adaptive-icon.png 1024×1024  (Android foreground, fondo verde en app.json)
 */
const { createCanvas } = require("@napi-rs/canvas");
const fs   = require("fs");
const path = require("path");

const ASSETS = path.join(__dirname, "..", "mobile", "assets");
const SIZE   = 1024;

// ─── Paleta ────────────────────────────────────────────────────────────────
const GREEN       = "#16a34a";
const GREEN_DARK  = "#14532d";
const GREEN_MID   = "#15803d";
const WHITE       = "#ffffff";

// ─── Helpers ───────────────────────────────────────────────────────────────
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

/**
 * Dibuja una cápsula/píldora rotada 45° con dos mitades de color.
 * cx/cy = centro, len = longitud total, thickness = grosor
 */
function drawCapsule(ctx, cx, cy, len, thickness, colorLeft, colorRight) {
  const r = thickness / 2;
  const halfLen = len / 2;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-Math.PI / 4); // 45° ↗

  // Mitad izquierda (colorLeft)
  ctx.save();
  ctx.beginPath();
  // Clip a la mitad izquierda
  ctx.rect(-halfLen - r, -r, halfLen + r, thickness);
  ctx.clip();
  ctx.fillStyle = colorLeft;
  // Cuerpo completo + semircículo izquierdo
  ctx.beginPath();
  ctx.arc(-halfLen, 0, r, Math.PI / 2, (3 * Math.PI) / 2);
  ctx.lineTo(halfLen, -r);
  ctx.lineTo(halfLen, r);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Mitad derecha (colorRight)
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

  // Línea divisoria central (separador entre mitades)
  ctx.strokeStyle = "rgba(0,0,0,0.15)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, -r - 2);
  ctx.lineTo(0, r + 2);
  ctx.stroke();

  ctx.restore();
}

/**
 * Dibuja un símbolo de precio "$" estilizado.
 */
function drawPriceSymbol(ctx, cx, cy, size, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `bold ${size}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("$", cx, cy);
  ctx.restore();
}

// ─── Ícono principal (con fondo verde gradiente) ───────────────────────────
function genIcon() {
  const canvas = createCanvas(SIZE, SIZE);
  const ctx    = canvas.getContext("2d");

  // Fondo: gradiente verde diagonal
  const grad = ctx.createLinearGradient(0, 0, SIZE, SIZE);
  grad.addColorStop(0, "#1db954");   // verde vivo arriba-izq
  grad.addColorStop(0.5, GREEN);
  grad.addColorStop(1, GREEN_DARK);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Sutil brillo radial en esquina superior izquierda
  const shine = ctx.createRadialGradient(180, 180, 0, 180, 180, 600);
  shine.addColorStop(0, "rgba(255,255,255,0.18)");
  shine.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = shine;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // ── Cápsula bicolor ──────────────────────────────────────────────────────
  // La cápsula tiene una mitad blanca pura y otra semitransparente.
  // Tamaño generoso para que sea legible en tamaños pequeños.
  const capLen       = 480;
  const capThickness = 200;
  const capCX        = SIZE / 2;
  const capCY        = SIZE / 2 - 30;

  drawCapsule(
    ctx, capCX, capCY, capLen, capThickness,
    WHITE,                       // mitad ↙ blanca
    "rgba(255,255,255,0.45)"     // mitad ↗ traslúcida
  );

  // ── Etiqueta de precio en la esquina inferior derecha ────────────────────
  // Pequeño rectángulo blanco con "↓$" para evocar "precio más bajo"
  const tagW = 248;
  const tagH = 110;
  const tagX = SIZE - tagW - 60;
  const tagY = SIZE - tagH - 60;
  const tagR = 30;

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.25)";
  ctx.shadowBlur  = 24;
  ctx.shadowOffsetY = 8;
  ctx.fillStyle = WHITE;
  roundRect(ctx, tagX, tagY, tagW, tagH, tagR);
  ctx.fill();
  ctx.restore();

  // Flecha ↓ y símbolo $ dentro del tag
  ctx.fillStyle = GREEN_MID;
  ctx.font      = `bold 68px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("↓$", tagX + tagW / 2, tagY + tagH / 2 + 3);

  // ── Texto "CF" sutil en la cápsula (legible en ≥ 60px) ──────────────────
  // Omitido: la cápsula + tag ya comunica el concepto.

  const buf = canvas.toBuffer("image/png");
  fs.writeFileSync(path.join(ASSETS, "icon.png"), buf);
  console.log("✓ icon.png");
}

// ─── Adaptive icon Android (foreground sobre fondo verde del sistema) ───────
// El fondo viene de app.json → android.adaptiveIcon.backgroundColor = "#16a34a"
// Aquí solo el foreground (cápsula + tag) sobre transparente, con margen safe-zone.
function genAdaptiveIcon() {
  const canvas = createCanvas(SIZE, SIZE);
  const ctx    = canvas.getContext("2d");

  // Fondo transparente (Android aplica el color de app.json)
  ctx.clearRect(0, 0, SIZE, SIZE);

  // Safe zone para adaptive icons: diseñar dentro de un círculo de ~66% del SIZE
  // Centers within 1024 = 682 safe.  Usamos ~70% → 716px zona segura.
  // Centramos todo en el centro del canvas con algo de margen.

  const capLen       = 430;
  const capThickness = 180;
  const capCX        = SIZE / 2;
  const capCY        = SIZE / 2 - 40;

  drawCapsule(
    ctx, capCX, capCY, capLen, capThickness,
    WHITE,
    "rgba(255,255,255,0.42)"
  );

  // Tag ↓$
  const tagW = 220;
  const tagH = 96;
  const tagX = SIZE - tagW - 90;
  const tagY = SIZE - tagH - 90;
  const tagR = 26;

  ctx.save();
  ctx.shadowColor   = "rgba(0,0,0,0.20)";
  ctx.shadowBlur    = 20;
  ctx.shadowOffsetY = 6;
  ctx.fillStyle     = WHITE;
  roundRect(ctx, tagX, tagY, tagW, tagH, tagR);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = GREEN_MID;
  ctx.font      = `bold 60px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("↓$", tagX + tagW / 2, tagY + tagH / 2 + 2);

  const buf = canvas.toBuffer("image/png");
  fs.writeFileSync(path.join(ASSETS, "adaptive-icon.png"), buf);
  console.log("✓ adaptive-icon.png");
}

genIcon();
genAdaptiveIcon();
console.log("\n✅ Íconos guardados en mobile/assets/");
