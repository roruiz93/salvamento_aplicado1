import { CURRENTS } from './data.js';
import { curObjects } from './currents.js';
import { earthMesh, camera, renderer } from './scene.js';
import * as THREE from 'three';
import { t, curName, onLangChange } from './i18n.js';

// ─ FILTER CONTROLS ───────────────────────────────────────────────────────────
const btnAll  = document.getElementById('btn-all');
const btnWarm = document.getElementById('btn-warm');
const btnCold = document.getElementById('btn-cold');
const curPanel = document.getElementById('cur-panel');
let activeFilter = 'all';

function buildPanel(mode) {
  const isW  = mode === 'w';
  const named = CURRENTS
    .filter(c => c.f === mode && c.nm)
    .sort((a, b) => b.sv - a.sv);
  const maxSv  = named[0]?.sv || 1;
  const barCol = isW ? '#ffb060' : '#5aadff';

  let h = `<div class="cp-ttl ${mode}">${isW ? t('panelWarm') : t('panelCold')}</div>`;
  named.forEach(c => {
    const [r, g, b] = c.cA.map(v => Math.round(v * 255));
    const pct = Math.round(c.sv / maxSv * 100);
    h += `<div class="cp-row">
            <div class="cp-dot" style="background:rgb(${r},${g},${b})"></div>
            <span class="cp-nm">${curName(c)}</span>
            <span class="cp-sv">${c.sv} Sv</span>
          </div>
          <div class="cp-bw"><div class="cp-bf" style="width:${pct}%;background:${barCol}"></div></div>
          <div class="cp-tr">${c.tr}</div>`;
  });
  const total = named.reduce((s, c) => s + c.sv, 0);
  h += `<div class="cp-foot">1 Sv = 1 000 000 m³/s<br>${named.length} ${t('currents')} · ${total} Sv ${t('approx')}</div>`;
  curPanel.innerHTML = h;
  curPanel.style.display = 'block';
}

export function setFilter(mode) {
  activeFilter = mode;
  btnAll.classList.toggle('act',  mode === 'all');
  btnWarm.classList.toggle('act', mode === 'w');
  btnCold.classList.toggle('act', mode === 'c');

  curObjects.forEach(({ lineObj, pointsObj, f }) => {
    const show = mode === 'all' || f === mode;
    lineObj.visible   = show;
    pointsObj.visible = show;
  });

  if (mode === 'all') { curPanel.style.display = 'none'; return; }
  buildPanel(mode);
}

btnAll.addEventListener('click',  () => setFilter('all'));
btnWarm.addEventListener('click', () => setFilter('w'));
btnCold.addEventListener('click', () => setFilter('c'));

// ─ CARD / TOOLTIP ────────────────────────────────────────────────────────────
const curCard = document.getElementById('cur-card');

const PROCESO = {
  afloramiento: { lbl: 'procAf', desc: 'procAfD', cls: 'af' },
  hundimiento:  { lbl: 'procHu', desc: 'procHuD', cls: 'hu' },
  convergencia: { lbl: 'procCv', desc: 'procCvD', cls: 'cv' },
};
let tipCur = null;

function hideTip() {
  curCard.classList.remove('show');
  setTimeout(() => { if (!curCard.classList.contains('show')) curCard.style.display = 'none'; }, 270);
}

function showCurrentTip(cur) {
  if (!cur?.nm) { hideTip(); return; }
  tipCur = cur;
  const p = cur.proceso ? PROCESO[cur.proceso] : null;

  let h = `<div class="crd-head ${cur.f}">
    <div class="crd-title">
      <div class="crd-name">${curName(cur)}</div>
      <div class="crd-badge ${cur.f}">${cur.f === 'w' ? t('warm') : t('cold')}</div>
    </div>
    <button class="crd-close">×</button>
  </div>
  <div class="crd-body">`;

  if (cur.tr) h += `<div class="crd-stat"><span class="crd-slabel">${t('temp')}</span><span class="crd-sval">${cur.tr}</span></div>`;
  if (cur.sv) h += `<div class="crd-stat"><span class="crd-slabel">${t('transport')}</span><span class="crd-sval">${cur.sv} Sv</span></div>`;
  h += `<div class="crd-stat"><span class="crd-slabel">${t('svEq')}</span><span class="crd-sval">1 000 000 m³/s</span></div>`;
  if (p) h += `<div class="crd-proc ${p.cls}"><div class="crd-plbl">${t(p.lbl)}</div><div class="crd-pdesc">${t(p.desc)}</div></div>`;
  h += `</div>`;

  curCard.innerHTML = h;
  curCard.style.display = 'block';
  requestAnimationFrame(() => curCard.classList.add('show'));
  curCard.querySelector('.crd-close').addEventListener('click', hideTip, { once: true });
}

// Re-render de panel y card al cambiar idioma
onLangChange(() => {
  if (activeFilter !== 'all') buildPanel(activeFilter);
  if (tipCur && curCard.classList.contains('show')) showCurrentTip(tipCur);
});

// ─ PICKING (clic en corriente) ────────────────────────────────────────────────
const _ray = new THREE.Raycaster();
const _mv  = new THREE.Vector2();

renderer.domElement.addEventListener('click', e => {
  _mv.x =  (e.clientX / innerWidth)  * 2 - 1;
  _mv.y = -(e.clientY / innerHeight) * 2 + 1;
  _ray.setFromCamera(_mv, camera);

  // Distancia al punto de impacto en la esfera → filtra líneas del lado trasero
  const sphereHits = _ray.intersectObject(earthMesh);
  if (!sphereHits.length) { hideTip(); return; }
  const sphereDist = sphereHits[0].distance;

  // Colectar sólo las líneas visibles con nombre
  const namedLines = curObjects
    .filter(o => o.lineObj.visible && o.cur?.nm)
    .map(o => o.lineObj);

  _ray.params.Line = { threshold: 0.022 };
  const lineHits = _ray.intersectObjects(namedLines, false);

  // Primera línea cuyo hit está frente a la esfera (no detrás del globo)
  const hit = lineHits.find(h => h.distance < sphereDist + 0.12);
  if (!hit) { hideTip(); return; }

  showCurrentTip(hit.object.userData.cur);
});
