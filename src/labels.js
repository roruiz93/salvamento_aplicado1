import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { earthMesh, camera } from './scene.js';
import * as THREE from 'three';

// ─ HELPER lat/lon → Vector3 ──────────────────────────────────────────────────
export function ll(lat, lon, r = 1.08) {
  const phi   = (90 - lat) * Math.PI / 180;
  const theta = (lon + 180) * Math.PI / 180;
  return new THREE.Vector3(
    -(r * Math.sin(phi) * Math.cos(theta)),
      r * Math.cos(phi),
      r * Math.sin(phi) * Math.sin(theta)
  );
}

// ─ ETIQUETAS ────────────────────────────────────────────────────────────────
export const labelObjects = [];

function addLabel(text, lat, lon, cls) {
  const div = document.createElement('div');
  div.className  = cls;
  div.textContent = text;
  const obj = new CSS2DObject(div);
  obj.position.copy(ll(lat, lon));
  earthMesh.add(obj);
  labelObjects.push(obj);
}

// Continentes
addLabel('NORTE AMÉRICA',  48, -100, 'continent-label');
addLabel('SUR AMÉRICA',   -14,  -56, 'continent-label');
addLabel('EUROPA',         52,   18, 'continent-label');
addLabel('ÁFRICA',          5,   22, 'continent-label');
addLabel('ASIA',           47,   95, 'continent-label');
addLabel('OCEANÍA',       -27,  134, 'continent-label');
addLabel('ANTÁRTIDA',     -80,    0, 'continent-label');

// Océanos
addLabel('OCÉANO PACÍFICO NORTE',    28, -155, 'ocean-label');
addLabel('OCÉANO PACÍFICO SUR',     -32, -138, 'ocean-label');
addLabel('OCÉANO ATLÁNTICO NORTE',   40,  -35, 'ocean-label');
addLabel('OCÉANO ATLÁNTICO SUR',    -28,  -16, 'ocean-label');
addLabel('OCÉANO ÍNDICO',           -20,   78, 'ocean-label');
addLabel('OCÉANO ÁRTICO',            85,    0, 'ocean-label');
addLabel('OCÉANO AUSTRAL',          -62,   50, 'ocean-label');

// ─ ACTUALIZAR OPACIDAD SEGÚN VISIBILIDAD ─────────────────────────────────────
const _wp = new THREE.Vector3();
export function updateLabelVisibility() {
  const camDir = camera.position.clone().normalize();
  labelObjects.forEach(o => {
    o.getWorldPosition(_wp);
    o.element.style.opacity = _wp.clone().normalize().dot(camDir) > .1 ? '1' : '0';
  });
}
