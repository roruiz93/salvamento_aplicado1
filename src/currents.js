import * as THREE from 'three';
import { earthMesh } from './scene.js';
import { ll } from './labels.js';
import { CURRENTS } from './data.js';

const R = 1.027;

// ─ HELPER INTERPOLACIÓN RGB ──────────────────────────────────────────────────
export function lerpRGB(a, b, t) {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

// ─ ESTADO INTERNO ────────────────────────────────────────────────────────────
export const animCurrents = [];  // datos para el loop de animación
export const curObjects   = [];  // { lineObj, pointsObj, f } para filtros
export const pickPoints   = [];  // puntos de picking por índice

// ─ CONSTRUIR UNA CORRIENTE ───────────────────────────────────────────────────
function buildCurrent(cur) {
  const { pts, cA, cB, n = 50, s = .0015, closed = false, f } = cur;

  const vecs  = pts.map(([la, lo]) => ll(la, lo, R));
  const curve = new THREE.CatmullRomCurve3(vecs, closed, 'catmullrom', .5);
  pickPoints.push(curve.getPoints(160));  // más densidad = picking más preciso

  // — línea base —
  const NL = 200;
  const lineP = new Float32Array((NL + 1) * 3);
  const lineC = new Float32Array((NL + 1) * 3);
  const ptsCurve = curve.getPoints(NL);

  for (let i = 0; i <= NL; i++) {
    const p = ptsCurve[Math.min(i, NL - 1)];
    const t = i / NL;
    lineP[i * 3] = p.x; lineP[i * 3 + 1] = p.y; lineP[i * 3 + 2] = p.z;
    const [r, g, b] = lerpRGB(cA, cB, t);
    lineC[i * 3] = r; lineC[i * 3 + 1] = g; lineC[i * 3 + 2] = b;
  }

  const lg = new THREE.BufferGeometry();
  lg.setAttribute('position', new THREE.BufferAttribute(lineP, 3));
  lg.setAttribute('color',    new THREE.BufferAttribute(lineC, 3));
  const lineMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: .38, depthWrite: false });
  const lineObj = closed ? new THREE.LineLoop(lg, lineMat) : new THREE.Line(lg, lineMat);
  lineObj.userData.cur = cur;
  earthMesh.add(lineObj);

  // — partículas —
  const pp  = new Float32Array(n * 3);
  const pc  = new Float32Array(n * 3);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pp, 3));
  geo.setAttribute('color',    new THREE.BufferAttribute(pc, 3));
  const pointsObj = new THREE.Points(geo, new THREE.PointsMaterial({
    vertexColors: true, size: .013, sizeAttenuation: true,
    transparent: true, opacity: .95, depthWrite: false,
  }));
  earthMesh.add(pointsObj);

  curObjects.push({ lineObj, pointsObj, f: f || null, cur });
  animCurrents.push({
    curve, geo,
    offsets: Array.from({ length: n }, (_, i) => i / n),
    s, n, closed, cA, cB,
  });
}

// ─ INICIALIZAR TODAS LAS CORRIENTES ──────────────────────────────────────────
CURRENTS.forEach(buildCurrent);

// ─ STEP DE ANIMACIÓN (llamar desde el loop principal) ────────────────────────
export function stepCurrents() {
  animCurrents.forEach(({ curve, geo, offsets, s, n, closed, cA, cB }) => {
    const p = geo.attributes.position.array;
    const c = geo.attributes.color.array;
    for (let i = 0; i < n; i++) {
      offsets[i] = (offsets[i] + s) % 1;
      const t = closed ? offsets[i] : Math.min(offsets[i], .9999);
      const v = curve.getPoint(t);
      p[i * 3] = v.x; p[i * 3 + 1] = v.y; p[i * 3 + 2] = v.z;
      const [r, g, b] = lerpRGB(cA, cB, t);
      c[i * 3] = r; c[i * 3 + 1] = g; c[i * 3 + 2] = b;
    }
    geo.attributes.position.needsUpdate = true;
    geo.attributes.color.needsUpdate    = true;
  });
}
