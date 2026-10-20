/**
 * sinking.js — Marcadores visuales de hundimiento termohalino
 * Muestra anillos pulsantes + etiqueta CSS2D en cada punto donde
 * el agua superficial se enfría, se vuelve densa y desciende.
 */
import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { earthMesh } from './scene.js';
import { ll } from './labels.js';
import { CURRENTS } from './data.js';

const RINGS_PER_POINT = 3;   // anillos en fases distintas
const sinkRings = [];         // { mesh, mat, phase, color }

/**
 * Devuelve el punto geográfico donde ocurre el hundimiento:
 *  - Corrientes cálidas (f:'w'): el agua se enfría al llegar al polo → último punto
 *  - Corrientes frías   (f:'c'): son producto del agua ya hundida → primer punto (fuente)
 */
function getSinkPoint(cur) {
  return cur.f === 'w'
    ? cur.pts[cur.pts.length - 1]
    : cur.pts[0];
}

// ─ Construir marcadores ──────────────────────────────────────────────────────
CURRENTS.forEach(cur => {
  if (cur.proceso !== 'hundimiento') return;

  const [lat, lon] = getSinkPoint(cur);
  const pos     = ll(lat, lon, 1.032);
  const normal  = pos.clone().normalize();
  const color   = cur.f === 'w' ? 0xff6600 : 0x0099ff;

  // — Etiqueta CSS2D —
  const div = document.createElement('div');
  div.className = 'sinking-label';
  div.innerHTML = `<span class="sk-arrow">⬇</span><span class="sk-text">HUNDIMIENTO</span>`;
  const label = new CSS2DObject(div);
  label.position.copy(ll(lat, lon, 1.14));
  earthMesh.add(label);

  // — Anillos Three.js —
  for (let i = 0; i < RINGS_PER_POINT; i++) {
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const geo  = new THREE.RingGeometry(0.012, 0.022, 40);
    const ring = new THREE.Mesh(geo, mat);
    ring.position.copy(pos);
    // Orientar el anillo tangente a la superficie (normal = radial)
    ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
    earthMesh.add(ring);
    sinkRings.push({ ring, mat, phase: i / RINGS_PER_POINT });
  }
});

// ─ Step de animación (llamar desde main.js) ──────────────────────────────────
let _t = 0;
export function stepSinking(delta = 0.008) {
  _t += delta;
  sinkRings.forEach(({ ring, mat, phase }) => {
    const p = ((_t + phase) % 1);           // 0 → 1 cíclico por fase
    const s = 1 + p * 9;                    // escala 1 → 10
    ring.scale.setScalar(s);
    mat.opacity = Math.max(0, (1 - p) * 0.75);
  });
}
