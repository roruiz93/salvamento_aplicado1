import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { earthMesh, camera } from './scene.js';
import * as THREE from 'three';
import { lang, onLangChange } from './i18n.js';

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

function addLabel(es, en, lat, lon, cls) {
  const div = document.createElement('div');
  div.className  = cls;
  div.textContent = lang === 'es' ? es : en;
  div.dataset.es = es;
  div.dataset.en = en;
  const obj = new CSS2DObject(div);
  obj.position.copy(ll(lat, lon));
  earthMesh.add(obj);
  labelObjects.push(obj);
}

// Continentes
addLabel('NORTE AMÉRICA', 'NORTH AMERICA',  48, -100, 'continent-label');
addLabel('SUR AMÉRICA',   'SOUTH AMERICA', -14,  -56, 'continent-label');
addLabel('EUROPA',        'EUROPE',        52,   18, 'continent-label');
addLabel('ÁFRICA',        'AFRICA',         5,   22, 'continent-label');
addLabel('ASIA',          'ASIA',          47,   95, 'continent-label');
addLabel('OCEANÍA',       'OCEANIA',      -27,  134, 'continent-label');
addLabel('ANTÁRTIDA',     'ANTARCTICA',   -80,    0, 'continent-label');

// Océanos
addLabel('OCÉANO PACÍFICO NORTE',  'NORTH PACIFIC OCEAN',  28, -155, 'ocean-label');
addLabel('OCÉANO PACÍFICO SUR',    'SOUTH PACIFIC OCEAN', -32, -138, 'ocean-label');
addLabel('OCÉANO ATLÁNTICO NORTE', 'NORTH ATLANTIC OCEAN',  40,  -35, 'ocean-label');
addLabel('OCÉANO ATLÁNTICO SUR',   'SOUTH ATLANTIC OCEAN', -28,  -16, 'ocean-label');
addLabel('OCÉANO ÍNDICO',          'INDIAN OCEAN',         -20,   78, 'ocean-label');
addLabel('OCÉANO ÁRTICO',          'ARCTIC OCEAN',          85,    0, 'ocean-label');
addLabel('OCÉANO AUSTRAL',         'SOUTHERN OCEAN',       -62,   50, 'ocean-label');

onLangChange(l => labelObjects.forEach(o => { o.element.textContent = o.element.dataset[l]; }));

// ─ ACTUALIZAR OPACIDAD SEGÚN VISIBILIDAD ─────────────────────────────────────
const _wp = new THREE.Vector3();
export function updateLabelVisibility() {
  const camDir = camera.position.clone().normalize();
  labelObjects.forEach(o => {
    o.getWorldPosition(_wp);
    o.element.style.opacity = _wp.clone().normalize().dot(camDir) > .1 ? '1' : '0';
  });
}
