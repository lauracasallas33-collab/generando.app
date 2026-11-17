// Probador virtual de Oro & Nudo Joyería (RF-14 y RF-15)
// Sigue el pseudocódigo "ProbadorRealidadAumentada" del proyecto ADSO.
"use strict";

// ---------- Catálogo ----------
const ZONA = { pulsera: "muñeca", anillo: "dedo", topos: "orejas", cadena: "cuello" };
const DETECTADA = { "muñeca": "muñeca detectada", dedo: "dedo detectado", orejas: "orejas detectadas", cuello: "cuello detectado" };
const MATERIALES = {
  "oro 18k":          { base: "#D4AF37", brillo: "#FAE6AA", borde: "#A0781E" },
  "oro laminado 18k": { base: "#DCB946", brillo: "#FAEBB4", borde: "#AA8228" },
  "oro blanco 18k":   { base: "#D2D7D7", brillo: "#FAFAFA", borde: "#919696" },
  "oro rosa 18k":     { base: "#D79682", brillo: "#F5D2C8", borde: "#A06450" },
  "plata 925":        { base: "#C0C0C0", brillo: "#F5F5F5", borde: "#787878" },
};
const PIEDRAS = {
  "ninguna": null, "aventurina": "#3C8C5A", "cuarzo rosa": "#F0AABE", "turmalina": "#A03C78",
  "amatista": "#8246A0", "perla natural": "#F5F0EB", "esmeralda": "#00875A", "zafiro": "#1E3C96",
  "diamante": "#EBF5FA", "topacio": "#78C8E6", "citrino": "#EBA028",
};
const CONSEJO = {
  pulsera: "Muestra la mano completa, con la muñeca visible, a unos 40 cm de la cámara.",
  anillo: "Muestra la mano abierta con los dedos separados; el anillo va en el dedo anular.",
  topos: "Ponte de frente, con las orejas descubiertas y buena luz.",
  cadena: "Ponte de frente, a un metro de la cámara, con los hombros visibles.",
};

const estadoApp = { tipo: "pulsera", material: "oro 18k", piedra: "aventurina", pedido: 0 };
const $ = (id) => document.getElementById(id);
const lienzo = $("lienzo"), ctx = lienzo.getContext("2d"), video = $("video");

// ---------- Selección de joya ----------
function chips(cont, opciones, clave) {
  $(cont).innerHTML = "";
  opciones.forEach((op) => {
    const b = document.createElement("button");
    b.className = "chip" + (estadoApp[clave] === op ? " sel" : "");
    b.textContent = op;
    b.onclick = () => { estadoApp[clave] = op; pintarSelectores(); if (clave === "tipo") cambiarTipo(); else if (modo === "sin_camara") vistaSinCamara(); };
    $(cont).appendChild(b);
  });
}
function pintarSelectores() {
  chips("tipos", Object.keys(ZONA), "tipo");
  chips("materiales", Object.keys(MATERIALES), "material");
  chips("piedras", Object.keys(PIEDRAS), "piedra");
  $("consejo").textContent = "Consejo: " + CONSEJO[estadoApp.tipo];
}
function toast(msg) { const t = $("toast"); t.textContent = msg; t.style.display = "block"; clearTimeout(t._h); t._h = setTimeout(() => (t.style.display = "none"), 2800); }
function estado(texto, clase) { const e = $("estado"); e.style.display = "block"; e.textContent = texto; e.className = "estado " + (clase || ""); }

// ---------- Dibujo de las joyas ----------
function circulo(x, y, r, relleno, borde, grosor) {
  ctx.beginPath(); ctx.arc(x, y, Math.max(1, r), 0, Math.PI * 2);
  if (relleno) { ctx.fillStyle = relleno; ctx.fill(); }
  if (borde) { ctx.strokeStyle = borde; ctx.lineWidth = grosor || 1; ctx.stroke(); }
}
function gema(x, y, r, color) {
  if (!color) return;
  const g = ctx.createRadialGradient(x - r / 3, y - r / 3, r / 6, x, y, r);
  g.addColorStop(0, "#ffffff"); g.addColorStop(0.35, color); g.addColorStop(1, color);
  circulo(x, y, r, g, "rgba(0,0,0,.35)", Math.max(1, r / 6));
}
function balin(x, y, r, mat) {
  const m = MATERIALES[mat];
  const g = ctx.createRadialGradient(x - r / 3, y - r / 3, r / 8, x, y, r);
  g.addColorStop(0, m.brillo); g.addColorStop(0.5, m.base); g.addColorStop(1, m.borde);
  circulo(x, y, r, g, m.borde, Math.max(1, r / 5));
}
function pulsera(cx, cy, ancho, ang, mat, piedra) {
  const alto = Math.max(6, ancho * 0.16), ex = Math.cos(ang), ey = Math.sin(ang);
  ctx.save(); ctx.lineCap = "round";
  ctx.strokeStyle = "#191919"; ctx.lineWidth = alto;
  ctx.beginPath(); ctx.moveTo(cx - ex * ancho / 2, cy - ey * ancho / 2); ctx.lineTo(cx + ex * ancho / 2, cy + ey * ancho / 2); ctx.stroke();
  ctx.strokeStyle = "#4a4a4a"; ctx.lineWidth = 1;                                   // nudos del macramé
  for (let k = 0; k < 14; k++) { const t = (k + 0.5) / 14 - 0.5; ctx.beginPath(); ctx.ellipse(cx + ex * ancho * t, cy + ey * ancho * t, alto / 2, alto / 3, ang + 0.6, 0, Math.PI * 2); ctx.stroke(); }
  ctx.restore();
  const r = Math.max(3, ancho * 0.065), paso = r * 2.15;
  [-3, -2, -1, 1, 2, 3].forEach((k) => { const d = k * paso + (k > 0 ? 0.25 : -0.25) * paso; balin(cx + ex * d, cy + ey * d, r, mat); });
  if (PIEDRAS[piedra]) gema(cx, cy, r * 1.35, PIEDRAS[piedra]); else balin(cx, cy, r * 1.2, mat);
}
function anillo(cx, cy, ancho, ang, mat, piedra) {
  const m = MATERIALES[mat];
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(ang);
  ctx.beginPath(); ctx.ellipse(0, 0, ancho / 2, Math.max(3, ancho * 0.18), 0, 0, Math.PI * 2);
  ctx.strokeStyle = m.borde; ctx.lineWidth = Math.max(3, ancho * 0.16); ctx.stroke();
  ctx.strokeStyle = m.base; ctx.lineWidth = Math.max(2, ancho * 0.11); ctx.stroke();
  ctx.restore();
  if (PIEDRAS[piedra]) { const rg = Math.max(4, ancho * 0.22); circulo(cx, cy, rg + 3, m.base, m.borde, 1); gema(cx, cy, rg, PIEDRAS[piedra]); }
}
function topo(x, y, r, mat, piedra) {
  const m = MATERIALES[mat];
  circulo(x, y, r + 2, m.borde); balin(x, y, r, mat);
  if (PIEDRAS[piedra]) gema(x, y, r * 0.65, PIEDRAS[piedra]);
}
function cadena(h1, h2, mat, piedra) {
  const m = MATERIALES[mat], ancho = Math.hypot(h2.x - h1.x, h2.y - h1.y);
  const cx = (h1.x + h2.x) / 2, cy = (h1.y + h2.y) / 2 - ancho * 0.12, ang = Math.atan2(h2.y - h1.y, h2.x - h1.x);
  const ax = ancho * 0.22, ay = ancho * 0.20, rr = Math.max(2, ancho * 0.010);
  for (let k = 0; k <= 180; k += 6) {
    const a = (k * Math.PI) / 180, px = ax * Math.cos(a), py = ay * Math.sin(a);
    circulo(cx + px * Math.cos(ang) - py * Math.sin(ang), cy + px * Math.sin(ang) + py * Math.cos(ang), rr, m.base, m.borde, 1);
  }
  topo(cx - ay * Math.sin(ang), cy + ay * Math.cos(ang) + ancho * 0.03, Math.max(5, ancho * 0.035), mat, piedra);
}

// ---------- Detección (MediaPipe) ----------
let manos = null, cuerpo = null, ultimo = null, complejidad = 1;
function detector() {
  if (ZONA[estadoApp.tipo] === "muñeca" || ZONA[estadoApp.tipo] === "dedo") {
    if (!manos) {
      manos = new Hands({ locateFile: (f) => "https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/" + f });
      manos.setOptions({ maxNumHands: 1, modelComplexity: complejidad, minDetectionConfidence: 0.6, minTrackingConfidence: 0.5 });
      manos.onResults((r) => { ultimo = { tipo: "manos", lm: r.multiHandLandmarks && r.multiHandLandmarks[0] }; });
    }
    return manos;
  }
  if (!cuerpo) {
    cuerpo = new Pose({ locateFile: (f) => "https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/" + f });
    cuerpo.setOptions({ modelComplexity: 0, smoothLandmarks: true, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
    cuerpo.onResults((r) => { ultimo = { tipo: "cuerpo", lm: r.poseLandmarks }; });
  }
  return cuerpo;
}

// Convierte puntos normalizados a píxeles del lienzo (con efecto espejo en la cámara frontal)
function px(p) { const W = lienzo.width, H = lienzo.height; return { x: espejo ? (1 - p.x) * W : p.x * W, y: p.y * H, v: p.visibility }; }
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

function ubicarYDibujar() {
  const zona = ZONA[estadoApp.tipo], { material: mat, piedra } = estadoApp;
  if (!ultimo || !ultimo.lm) return false;
  const L = ultimo.lm;
  if ((zona === "muñeca" || zona === "dedo") && ultimo.tipo === "manos") {
    const P = L.map(px);
    if (zona === "muñeca") {
      const dx = P[0].x - P[9].x, dy = P[0].y - P[9].y, n = Math.hypot(dx, dy) || 1, palma = dist(P[5], P[17]);
      pulsera(P[0].x + (dx / n) * palma * 0.15, P[0].y + (dy / n) * palma * 0.15, palma * 1.15, Math.atan2(dy, dx) + Math.PI / 2, mat, piedra);
    } else {
      const b = P[13], k = P[14];
      anillo(b.x + (k.x - b.x) * 0.4, b.y + (k.y - b.y) * 0.4, dist(P[13], P[9]) * 0.95, Math.atan2(k.y - b.y, k.x - b.x) + Math.PI / 2, mat, piedra);
    }
    return true;
  }
  if ((zona === "orejas" || zona === "cuello") && ultimo.tipo === "cuerpo") {
    const P = L.map(px), vis = (i) => (L[i].visibility || 0) > 0.5;
    if (zona === "orejas") {
      const orejas = [7, 8].filter(vis);
      if (!orejas.length) return false;
      const d = dist(P[7], P[8]);
      orejas.forEach((i) => { const afuera = P[i].x > P[0].x ? 1 : -1; topo(P[i].x + afuera * d * 0.10, P[i].y + d * 0.18, Math.max(4, d * 0.035), mat, piedra); });
      return true;
    }
    if (!(vis(11) && vis(12))) return false;
    cadena(P[11], P[12], mat, piedra);
    return true;
  }
  return false;
}

// ---------- Flujo del probador ----------
let modo = "inicio", stream = null, activo = false, espejo = true, camaraFrontal = true;
let ultimaDeteccion = 0, cuadros = [], fpsBajoDesde = 0;

async function iniciar() {
  // 2. Validaciones antes de abrir la cámara
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    vistaSinCamara("Tu navegador no permite usar la cámara."); return;
  }
  try {
    estado("Pidiendo permiso para usar la cámara…", "aviso");
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: camaraFrontal ? "user" : "environment", width: { ideal: 960 }, height: { ideal: 720 } }, audio: false });
  } catch (e) {
    vistaSinCamara("No se dio permiso para usar la cámara."); return;
  }
  video.srcObject = stream; await video.play();
  lienzo.width = video.videoWidth || 960; lienzo.height = video.videoHeight || 720;
  espejo = camaraFrontal;
  $("inicio").style.display = "none"; $("fps").style.display = "block";
  ["btnFoto", "btnGirar", "btnSalir"].forEach((b) => ($(b).disabled = false));
  modo = "camara"; activo = true; ultimaDeteccion = performance.now(); ultimo = null;
  estado("Cargando el detector… (la primera vez tarda unos segundos)", "aviso");
  requestAnimationFrame(cuadro);
}

async function cuadro() {
  if (!activo) return;
  const t0 = performance.now();
  // dibuja la imagen de la cámara
  ctx.save();
  if (espejo) { ctx.translate(lienzo.width, 0); ctx.scale(-1, 1); }
  ctx.drawImage(video, 0, 0, lienzo.width, lienzo.height);
  ctx.restore();
  // detecta la zona del cuerpo
  try { await detector().send({ image: video }); } catch (e) { console.error(e); }
  if (!activo) return;
  const zona = ZONA[estadoApp.tipo];
  if (ubicarYDibujar()) {
    ultimaDeteccion = performance.now();
    estado(`● Cámara activa · ${DETECTADA[zona]}`, "ok");
    $("guia").style.display = "none";
  } else {
    const seg = (performance.now() - ultimaDeteccion) / 1000;
    estado(`Buscando tu ${zona}…`, "aviso");
    if (seg > 5) { $("guia").textContent = `👉 Ubica tu ${zona} frente a la cámara`; $("guia").style.display = "block"; }   // hallazgo H-03
  }
  // velocidad (RNF-04: mínimo 20 cuadros por segundo)
  const ahora = performance.now(); cuadros.push(ahora); cuadros = cuadros.filter((t) => ahora - t < 1000);
  const fps = cuadros.length; $("fps").textContent = fps + " cuadros/s";
  if (fps < 20 && complejidad === 1 && manos) {
    if (!fpsBajoDesde) fpsBajoDesde = ahora;
    if (ahora - fpsBajoDesde > 3000) { complejidad = 0; manos.setOptions({ modelComplexity: 0 }); toast("Se redujo la calidad del modelo para mantener la fluidez (RNF-04)"); }
  } else fpsBajoDesde = 0;
  requestAnimationFrame(cuadro);
}

function detener() {
  activo = false;
  if (stream) stream.getTracks().forEach((t) => t.stop());
  stream = null;
}
function salir() {
  detener(); modo = "inicio";
  ctx.clearRect(0, 0, lienzo.width, lienzo.height);
  $("inicio").style.display = "flex"; $("estado").style.display = "none"; $("fps").style.display = "none"; $("guia").style.display = "none";
  ["btnFoto", "btnGirar", "btnSalir"].forEach((b) => ($(b).disabled = true));
}
function cambiarTipo() {
  ultimo = null; ultimaDeteccion = performance.now(); $("guia").style.display = "none";
  if (modo === "sin_camara") vistaSinCamara();
}

// ---------- RF-15: vista previa sin cámara ----------
function vistaSinCamara(motivo) {
  detener(); modo = "sin_camara";
  lienzo.width = 960; lienzo.height = 720; espejo = false;
  $("inicio").style.display = "none"; $("fps").style.display = "none"; $("guia").style.display = "none";
  ["btnFoto", "btnSalir"].forEach((b) => ($(b).disabled = false)); $("btnGirar").disabled = true;
  ctx.fillStyle = "#EAF0F3"; ctx.fillRect(0, 0, 960, 720);
  const piel = "#E0BA98", { tipo, material: mat, piedra } = estadoApp;
  ctx.fillStyle = piel;
  const rect = (x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill(); };
  if (tipo === "pulsera" || tipo === "anillo") {
    rect(420, 430, 130, 290, 10);                                         // antebrazo
    ctx.beginPath(); ctx.ellipse(485, 360, 100, 110, 0, 0, Math.PI * 2); ctx.fill();   // palma
    [[-72, 120], [-26, 150], [20, 145], [64, 120]].forEach(([dx, l]) => rect(485 + dx - 17, 280 - l, 34, l + 20, 17));
    rect(370, 330, 34, 110, 17);                                          // pulgar
    if (tipo === "pulsera") pulsera(485, 470, 150, 0, mat, piedra);
    else anillo(505, 200, 40, 0, mat, piedra);
  } else {
    ctx.beginPath(); ctx.ellipse(480, 720, 280, 150, 0, Math.PI, 2 * Math.PI); ctx.fill();   // hombros
    rect(430, 440, 100, 140, 10);                                          // cuello
    ctx.beginPath(); ctx.ellipse(480, 300, 120, 150, 0, 0, Math.PI * 2); ctx.fill();     // cabeza
    ctx.beginPath(); ctx.ellipse(358, 310, 18, 32, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(602, 310, 18, 32, 0, 0, Math.PI * 2); ctx.fill();
    if (tipo === "topos") { topo(358, 336, 11, mat, piedra); topo(602, 336, 11, mat, piedra); }
    else cadena({ x: 260, y: 600 }, { x: 700, y: 600 }, mat, piedra);
  }
  estado("Vista previa sin cámara (RF-15)", "");
  if (motivo) toast(motivo + " Se muestra la vista previa sin cámara.");
}

// ---------- Acciones ----------
$("btnIniciar").onclick = () => { if (activo) return; iniciar(); };
$("linkSinCamara").onclick = (e) => { e.preventDefault(); vistaSinCamara(); };
$("btnSalir").onclick = salir;
$("btnGirar").onclick = async () => { camaraFrontal = !camaraFrontal; detener(); await iniciar(); };
$("btnFoto").onclick = () => {                                    // la foto se guarda solo en el dispositivo (RNF-08)
  const a = document.createElement("a");
  a.download = "mi-joya-oro-y-nudo.png"; a.href = lienzo.toDataURL("image/png"); a.click();
  toast("📸 Foto guardada en tu dispositivo; no se envía a ningún servidor.");
};
$("btnPedido").onclick = () => {                                  // el probador sigue abierto para probar otra joya
  estadoApp.pedido++; $("carrito").textContent = `Carrito (${estadoApp.pedido})`;
  toast(`🛒 Agregado: ${estadoApp.tipo} en ${estadoApp.material} con ${estadoApp.piedra}`);
};

pintarSelectores();
// para pruebas automáticas
window.__probador = { estadoApp, vistaSinCamara, iniciar, get modo() { return modo; } };
