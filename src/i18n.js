// ─ TEXTOS ES / EN ────────────────────────────────────────────────────────────
export const TR = {
  es: {
    title:    'Tierra 3D – Corrientes Marinas',
    h1:       'El Mundo',
    subtitle: 'Corrientes marinas · inclinación axial real 23.5°',
    hint:     'ARRASTRAR · RUEDA = ZOOM · DOBLE CLIC = RESET',
    speed:    'VELOCIDAD',
    legTitle: 'Temperatura superficial',
    legCold:  '← Fría (0°C)',
    legHot:   'Cálida (30°C) →',
    legWarm:  'Corriente cálida',
    legCold2: 'Corriente fría',
    legGyre:  'Giro oceánico (circuito)',
    btnAll:   'TODAS',
    btnWarm:  'CÁLIDAS',
    btnCold:  'FRÍAS',
    btnMareas:'🌊 MAREAS',
    panelWarm:'CORRIENTES CÁLIDAS',
    panelCold:'CORRIENTES FRÍAS',
    currents: 'corrientes',
    approx:   'aprox.',
    warm:     'Cálida',
    cold:     'Fría',
    temp:     'Temperatura',
    transport:'Transporte',
    svEq:     '1 Sv equivale a',
    procAf:   '⬆ AFLORAMIENTO',
    procAfD:  'Agua fría y rica en nutrientes asciende desde las profundidades a la superficie, impulsada por los vientos costeros.',
    procHu:   '⬇ HUNDIMIENTO',
    procHuD:  'Agua densa, fría o salina se hunde hacia las profundidades, impulsando la circulación termohalina global.',
    procCv:   '↕ CONVERGENCIA',
    procCvD:  'Masas de agua de distinta temperatura y densidad se encuentran, generando mezcla intensa y gran productividad biológica.',
  },
  en: {
    title:    '3D Earth – Ocean Currents',
    h1:       'The World',
    subtitle: 'Ocean currents · real axial tilt 23.5°',
    hint:     'DRAG · WHEEL = ZOOM · DOUBLE CLICK = RESET',
    speed:    'SPEED',
    legTitle: 'Surface temperature',
    legCold:  '← Cold (0°C)',
    legHot:   'Warm (30°C) →',
    legWarm:  'Warm current',
    legCold2: 'Cold current',
    legGyre:  'Oceanic gyre (circuit)',
    btnAll:   'ALL',
    btnWarm:  'WARM',
    btnCold:  'COLD',
    btnMareas:'🌊 TIDES',
    panelWarm:'WARM CURRENTS',
    panelCold:'COLD CURRENTS',
    currents: 'currents',
    approx:   'approx.',
    warm:     'Warm',
    cold:     'Cold',
    temp:     'Temperature',
    transport:'Transport',
    svEq:     '1 Sv equals',
    procAf:   '⬆ UPWELLING',
    procAfD:  'Cold, nutrient-rich water rises from the depths to the surface, driven by coastal winds.',
    procHu:   '⬇ DOWNWELLING',
    procHuD:  'Dense, cold or salty water sinks into the depths, driving the global thermohaline circulation.',
    procCv:   '↕ CONVERGENCE',
    procCvD:  'Water masses of different temperature and density meet, causing intense mixing and high biological productivity.',
  },
};

export let lang = 'es';
export const t = key => TR[lang][key];
export const curName = c => lang === 'es' ? c.nm : (c.nm_en || c.nm);

// ─ SUSCRIPTORES (etiquetas, panel, card) ─────────────────────────────────────
const listeners = [];
export function onLangChange(fn) { listeners.push(fn); }

// id del elemento → clave de TR
const STATIC = {
  'txt-title': 'h1', 'txt-subtitle': 'subtitle', 'controls-hint': 'hint', 'txt-speed': 'speed',
  'txt-leg-title': 'legTitle', 'txt-leg-cold': 'legCold', 'txt-leg-hot': 'legHot',
  'txt-leg-warm': 'legWarm', 'txt-leg-cold2': 'legCold2', 'txt-leg-gyre': 'legGyre',
  'btn-all': 'btnAll', 'btn-warm': 'btnWarm', 'btn-cold': 'btnCold', 'btn-mareas': 'btnMareas',
};

export function applyLang(l) {
  lang = l;
  document.documentElement.lang = l;
  document.title = t('title');
  for (const [id, key] of Object.entries(STATIC)) {
    const el = document.getElementById(id);
    if (el) el.textContent = t(key);
  }
  document.getElementById('btn-es').classList.toggle('act', l === 'es');
  document.getElementById('btn-en').classList.toggle('act', l === 'en');
  listeners.forEach(fn => fn(l));
}

document.getElementById('btn-es').addEventListener('click', () => applyLang('es'));
document.getElementById('btn-en').addEventListener('click', () => applyLang('en'));
