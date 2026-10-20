/**
 * pointer.js — Control de cámara por mouse/touch sin necesidad de arrastrar.
 *
 * Comportamiento:
 *  - Hover  (solo mover mouse):  la cámara sigue suavemente la posición del cursor.
 *  - Click + arrastrar:          OrbitControls toma el control (rotación precisa).
 *  - Scroll / pinch:             zoom.
 *  - Doble clic:                 reset de cámara.
 *  - Touch único:                sigue el dedo (igual que hover de mouse).
 *  - Touch dos dedos:            pinch zoom.
 */
import * as THREE from 'three';
import { camera, controls, renderer } from './scene.js';

const LERP    = 0.055;   // velocidad de seguimiento (0 = lento, 1 = instantáneo)
const R_MIN   = 1.5;
const R_MAX   = 10;
const R_RESET = 3.2;

// Coordenadas esféricas actuales y objetivo
const sph = new THREE.Spherical();
const tgt = new THREE.Spherical();

// Inicializar desde la posición de cámara actual
sph.setFromVector3(camera.position);
tgt.copy(sph);

// OrbitControls arranca deshabilitado; solo se activa en arrastre
controls.enabled = false;

let isDragging    = false;
let lastPinchDist = 0;

// ─ Sincronizar coordenadas esféricas desde la posición real de la cámara ───
function syncFromCamera() {
  sph.setFromVector3(camera.position);
  tgt.copy(sph);
}

// ─ Convertir posición de pantalla a ángulos objetivo ──────────────────────
function applyPointer(clientX, clientY) {
  const nx =  (clientX / window.innerWidth  - 0.5) * 2;   // -1 → 1  (izq/der)
  const ny = -(clientY / window.innerHeight - 0.5) * 2;   // -1 → 1  (abajo/arriba)
  tgt.theta = nx * Math.PI * 0.38;                         // ± ~69°  azimut
  tgt.phi   = THREE.MathUtils.clamp(
    Math.PI / 3.5 - ny * 0.22,                            // elevación base ± algo
    0.25, Math.PI * 0.70
  );
}

// ─ MOUSE ──────────────────────────────────────────────────────────────────
renderer.domElement.addEventListener('mousedown', () => {
  isDragging = true;
  controls.enabled = true;
});
window.addEventListener('mouseup', () => {
  if (!isDragging) return;
  isDragging = false;
  syncFromCamera();
  controls.enabled = false;
});
window.addEventListener('mousemove', e => {
  if (isDragging) return;
  applyPointer(e.clientX, e.clientY);
});

// ─ SCROLL ZOOM ────────────────────────────────────────────────────────────
window.addEventListener('wheel', e => {
  const delta = e.deltaY * 0.003;
  const r = THREE.MathUtils.clamp(sph.radius + delta, R_MIN, R_MAX);
  sph.radius = r;
  tgt.radius = r;
}, { passive: true });

// ─ TOUCH ──────────────────────────────────────────────────────────────────
renderer.domElement.addEventListener('touchstart', e => {
  if (e.touches.length === 1) {
    // Un dedo = seguimiento suave (igual que hover)
    applyPointer(e.touches[0].clientX, e.touches[0].clientY);
  }
}, { passive: true });

window.addEventListener('touchend', e => {
  lastPinchDist = 0;
}, { passive: true });

window.addEventListener('touchmove', e => {
  if (e.touches.length === 1) {
    // Un dedo: mover vista
    applyPointer(e.touches[0].clientX, e.touches[0].clientY);

  } else if (e.touches.length === 2) {
    // Dos dedos: pinch zoom
    const dx   = e.touches[0].clientX - e.touches[1].clientX;
    const dy   = e.touches[0].clientY - e.touches[1].clientY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (lastPinchDist) {
      const delta = (lastPinchDist - dist) * 0.012;
      const r = THREE.MathUtils.clamp(sph.radius + delta, R_MIN, R_MAX);
      sph.radius = r;
      tgt.radius = r;
    }
    lastPinchDist = dist;
  }
}, { passive: true });

// ─ DOBLE CLIC → RESET ─────────────────────────────────────────────────────
renderer.domElement.addEventListener('dblclick', () => {
  tgt.theta  = 0;
  tgt.phi    = Math.PI / 3;
  tgt.radius = R_RESET;
});

// ─ STEP (llamar en el loop de animación) ──────────────────────────────────
export function updatePointer() {
  if (isDragging) {
    // OrbitControls está activo; sincronizar nuestras coords para no perder estado
    controls.update();
    syncFromCamera();
    return;
  }
  // Interpolación suave hacia el objetivo
  sph.theta  += (tgt.theta  - sph.theta)  * LERP;
  sph.phi    += (tgt.phi    - sph.phi)    * LERP;
  sph.radius += (tgt.radius - sph.radius) * LERP;

  camera.position.setFromSpherical(sph);
  camera.lookAt(controls.target);
}
