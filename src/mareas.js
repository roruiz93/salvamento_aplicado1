import * as THREE from 'three';
import { OrbitControls }             from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

const BASE = 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r158/examples/textures/planets/';

// ═══════════════════════════════════════════════════════════════════════════════
// UNIFORMS COMPARTIDAS
// ═══════════════════════════════════════════════════════════════════════════════
const waveUniforms = {
  uTime:    { value: 0.0 },
  uSpeed:   { value: 4.0 },
  uDir:     { value: -1.0 },   // dirección de corriente oceánica (ENOS)
  uWindDir: { value: -1.0 },   // dirección del viento (botón INVERTIR)
  uNino:    { value: 0.0 },
  uTide:    { value: 0.0 },
};

// ─ Vertex de olas (ambas escenas) ────────────────────────────────────────────
// NOTA: PlaneGeometry tiene vértices en plano XY (z=0). Con rotation.x=-PI/2,
// el eje local Z → world Y (altura). Por eso desplazamos p.z, no p.y.
// p.y = coordenada de profundidad (world Z tras rotación) → usada para ondas cruzadas.
const WAVE_VERT = `
  uniform float uTime;
  uniform float uSpeed;
  uniform float uWindDir;
  varying float vH;
  varying float vX;
  varying float vZ;
  void main(){
    vec3 p = position;
    float xw  = p.x * uWindDir;   // olas siguen el VIENTO, no la corriente
    float dep = p.y;
    float A   = uSpeed * 0.038;   // amplitud reducida: olas bajas y densas
    // Muchas frecuencias cruzadas (xw + dep) → superficie continua, sin crestas separadas
    p.z = A      * sin(2.20*xw               - 2.20*uTime)
        + A*0.65 * sin(3.90*xw               - 3.90*uTime + 1.10)
        + A*0.52 * sin(2.80*xw + 2.10*dep    - 4.20*uTime + 0.60)
        + A*0.42 * sin(1.60*xw - 1.90*dep    - 2.80*uTime + 2.30)
        + A*0.34 * sin(5.70*xw               - 5.70*uTime + 0.40)
        + A*0.27 * sin(4.30*xw + 3.20*dep    - 6.10*uTime + 1.70)
        + A*0.22 * sin(7.10*xw - 1.40*dep    - 7.80*uTime + 0.90)
        + A*0.18 * sin(2.40*dep              - 3.10*uTime + 0.25)
        + A*0.14 * sin(6.50*xw + 0.80*dep    - 8.90*uTime + 2.05)
        + A*0.10 * sin(9.20*xw - 2.30*dep    - 10.1*uTime + 1.55);
    vH = p.z / max(A * 3.2, 0.001);
    vX = p.x;
    vZ = dep;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

// ─ Fragment DIURNO (canvas principal + franja) ────────────────────────────────
const FRAG_DAY = `
  uniform float uSpeed;
  uniform float uNino;
  uniform float uTime;
  varying float vH;
  varying float vX;
  varying float vZ;
  void main(){
    float h01 = clamp((vH + 1.0) * 0.5, 0.0, 1.0);

    // Curva S: aplana extremos, estira medios → contraste visual pronunciado
    float hc = h01 * h01 * (3.0 - 2.0 * h01);

    // Solo tonos de azul: valle casi negro → cresta cian brillante
    vec3 trough = vec3(0.000, 0.022, 0.120);   // negro-azul (profundidad)
    vec3 slope  = vec3(0.004, 0.155, 0.480);   // azul oscuro (ladera)
    vec3 mid    = vec3(0.010, 0.400, 0.800);   // azul océano (media ola)
    vec3 crest  = vec3(0.150, 0.730, 1.000);   // cian vivo (cresta)
    vec3 foam   = vec3(0.860, 0.940, 1.000);   // blanco azulado (espuma)

    vec3 col = mix(trough, mix(slope, mix(mid, crest, hc), hc), hc);

    // Espuma estructural en crestas
    float foamA = smoothstep(0.68, 1.0, h01) * clamp(uSpeed / 5.5, 0.18, 1.0);
    col = mix(col, foam, foamA * 0.92);

    // White caps procedurales (interferencia de dos trenes de olas)
    float wc = sin(vX * 2.20 + vZ * 1.70) * sin(vX * 0.80 - vZ * 2.50)
             + sin(vX * 4.30 - vZ * 0.95) * sin(vZ * 3.10 + vX * 1.20) * 0.6;
    float caps = clamp((wc + 0.24) * 2.9, 0.0, 1.0);
    caps *= smoothstep(0.44, 0.78, h01) * clamp(uSpeed / 6.5, 0.0, 1.0);
    col = mix(col, foam, caps * 0.74);

    // Destello solar animado: reflejo que viaja sobre la superficie
    float sh1 = pow(clamp(sin(vX * 1.40 + vZ * 0.75 - uTime * 2.10) * 0.5 + 0.5, 0.0, 1.0), 7.0);
    float sh2 = pow(clamp(sin(vX * 2.90 - vZ * 1.15 - uTime * 3.40) * 0.5 + 0.5, 0.0, 1.0), 9.0);
    float shimmer = (sh1 + sh2 * 0.55) * smoothstep(0.50, 0.86, h01) * 0.62;
    col += vec3(0.42, 0.78, 1.00) * shimmer;

    // ENOS: desplaza el tono de azul (mantiene paleta azul)
    float east = clamp(vX / 11.0 + 0.5, 0.0, 1.0);
    if(uNino > 0.0)
      col = mix(col, col + vec3(0.38, 0.05, -0.10), uNino * east * 0.70);
    else if(uNino < 0.0)
      col = mix(col, col + vec3(-0.10, 0.05, 0.24), (-uNino) * east * 0.65);

    gl_FragColor = vec4(clamp(col, 0.0, 1.0), 0.98);
  }
`;

// helper: crea escena de océano diurna ----------------------------------------
function buildDayOcean(geoW, geoH, geoSegW, geoSegH) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x4b9fd5);
  scene.fog = new THREE.FogExp2(0x6bb8e8, 0.018);
  const sun = new THREE.DirectionalLight(0xfff5cc, 3.5);
  sun.position.set(8,18,10); scene.add(sun);
  scene.add(new THREE.AmbientLight(0x88bbdd, 1.2));
  const fill = new THREE.DirectionalLight(0x99ccff, 0.8);
  fill.position.set(-10,5,-5); scene.add(fill);

  // Fondo marino arenoso — FIJO en world space, visible en bajamar
  const seabed = new THREE.Mesh(
    new THREE.PlaneGeometry(geoW+18, geoH+8),
    new THREE.MeshLambertMaterial({color: 0xb08850})
  );
  seabed.rotation.x = -Math.PI/2;
  seabed.position.y = -1.0;
  scene.add(seabed);

  // Sol visual
  const sunSph = new THREE.Mesh(new THREE.SphereGeometry(.9,16,16),
    new THREE.MeshBasicMaterial({color:0xffffaa}));
  sunSph.position.set(8,10,-14); scene.add(sunSph);
  sunSph.add(new THREE.Mesh(new THREE.SphereGeometry(1.7,16,16),
    new THREE.MeshBasicMaterial({color:0xffff88,transparent:true,opacity:.10,depthWrite:false,side:THREE.BackSide})));

  // Grupo que sube/baja con la marea: contiene el océano Y su respaldo oscuro
  const tideGroup = new THREE.Group();
  scene.add(tideGroup);

  // Respaldo azul profundo — se mueve con el agua para no ver el cielo entre olas
  const bg = new THREE.Mesh(
    new THREE.PlaneGeometry(geoW+16, geoH+8),
    new THREE.MeshBasicMaterial({color: 0x001530})
  );
  bg.rotation.x = -Math.PI/2;
  bg.position.y = -0.14;   // local: siempre debajo de la superficie
  tideGroup.add(bg);

  // Malla del océano con shader de olas
  const mat  = new THREE.ShaderMaterial({uniforms:waveUniforms,vertexShader:WAVE_VERT,fragmentShader:FRAG_DAY,side:THREE.DoubleSide});
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(geoW,geoH,geoSegW,geoSegH), mat);
  mesh.rotation.x = -Math.PI/2;
  tideGroup.add(mesh);

  return { scene, mat, mesh: tideGroup };
}

// ═══════════════════════════════════════════════════════════════════════════════
// CANVAS PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════
const mainCanvas   = document.getElementById('mareas-canvas');
const mainRenderer = new THREE.WebGLRenderer({antialias:true, canvas:mainCanvas});
mainRenderer.setPixelRatio(Math.min(devicePixelRatio,2));

const labelRenderer = new CSS2DRenderer();
labelRenderer.domElement.style.cssText =
  'position:absolute;top:0;left:0;pointer-events:none;width:100%;height:100%;';
mainCanvas.parentElement.appendChild(labelRenderer.domElement);

const mainCamera = new THREE.PerspectiveCamera(45,1,.1,500);
mainCamera.position.set(0,5,10);
const mainControls = new OrbitControls(mainCamera,mainCanvas);
mainControls.enableDamping=true; mainControls.dampingFactor=.06;
mainControls.minDistance=3; mainControls.maxDistance=22;

// ─ ESCENA ESPACIO ────────────────────────────────────────────────────────────
const spaceScene = new THREE.Scene();
const sunLight = new THREE.DirectionalLight(0xfff8e0,3); sunLight.position.set(14,1,0); spaceScene.add(sunLight);
spaceScene.add(new THREE.AmbientLight(0x223355,.9));
const rimLight = new THREE.DirectionalLight(0x4488ff,.35); rimLight.position.set(-6,3,-4); spaceScene.add(rimLight);
;(()=>{
  const N=6000,p=new Float32Array(N*3),s=new Float32Array(N);
  for(let i=0;i<N;i++){p[i*3]=(Math.random()-.5)*300;p[i*3+1]=(Math.random()-.5)*300;p[i*3+2]=(Math.random()-.5)*300;s[i]=Math.random()*1.4+.3;}
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.BufferAttribute(p,3));g.setAttribute('size',new THREE.BufferAttribute(s,1));
  spaceScene.add(new THREE.Points(g,new THREE.ShaderMaterial({
    vertexShader:`attribute float size;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=size*(280./-mv.z);gl_Position=projectionMatrix*mv;}`,
    fragmentShader:`void main(){float d=distance(gl_PointCoord,vec2(.5));if(d>.5)discard;gl_FragColor=vec4(1,1,1,1.-smoothstep(.3,.5,d));}`,
    transparent:true,depthWrite:false,
  })));
})();
const ldr=new THREE.TextureLoader();
const earthGroup=new THREE.Group(); earthGroup.rotation.z=23.5*Math.PI/180; spaceScene.add(earthGroup);
const earthMesh=new THREE.Mesh(new THREE.SphereGeometry(1,64,64),new THREE.MeshPhongMaterial({
  map:ldr.load(BASE+'earth_atmos_2048.jpg'),bumpMap:ldr.load(BASE+'earth_normal_2048.jpg'),
  bumpScale:.05,specularMap:ldr.load(BASE+'earth_specular_2048.jpg'),specular:new THREE.Color(0x224488),shininess:20,
}));
earthGroup.add(earthMesh);
earthGroup.add(new THREE.Mesh(new THREE.SphereGeometry(1.12,32,32),new THREE.ShaderMaterial({
  vertexShader:`varying vec3 vN;void main(){vN=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`varying vec3 vN;void main(){float i=pow(.68-dot(vN,vec3(0,0,1)),4.);gl_FragColor=vec4(.15,.45,1,1)*i;}`,
  blending:THREE.AdditiveBlending,side:THREE.BackSide,transparent:true,depthWrite:false,
})));
const tideMat=new THREE.MeshPhongMaterial({color:0x22aaff,emissive:0x002244,transparent:true,opacity:.22,depthWrite:false,side:THREE.DoubleSide});
const tideMesh=new THREE.Mesh(new THREE.SphereGeometry(1,40,40),tideMat);
tideMesh.scale.set(1.10,1.0,1.0); spaceScene.add(tideMesh);
const tideWire=new THREE.Mesh(new THREE.SphereGeometry(1.001,20,20),
  new THREE.MeshBasicMaterial({color:0x3399ff,wireframe:true,transparent:true,opacity:.07,depthWrite:false}));
tideWire.scale.copy(tideMesh.scale); spaceScene.add(tideWire);
const moonOrbit=new THREE.Group(); spaceScene.add(moonOrbit);
const moonMesh=new THREE.Mesh(new THREE.SphereGeometry(.27,40,40),
  new THREE.MeshPhongMaterial({color:0xddddee,shininess:3,specular:new THREE.Color(0x111111)}));
moonMesh.position.set(4.5,0,0); moonOrbit.add(moonMesh);
const phaseDiv=document.createElement('div'); phaseDiv.className='space-label moon-label'; phaseDiv.style.cssText='text-align:center;line-height:1.5;';
const phaseLabel=new CSS2DObject(phaseDiv); phaseLabel.position.set(4.5,.55,0); moonOrbit.add(phaseLabel);
const orbitPts=[];
for(let i=0;i<=80;i++){const a=(i/80)*Math.PI*2;orbitPts.push(new THREE.Vector3(Math.cos(a)*4.5,0,Math.sin(a)*4.5));}
spaceScene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(orbitPts),
  new THREE.LineBasicMaterial({color:0x334466,opacity:.45,transparent:true})));
const PHASES=[
  {name:'LUNA NUEVA',emoji:'🌑',min:-22.5,max:22.5},{name:'CRECIENTE INICIAL',emoji:'🌒',min:22.5,max:67.5},
  {name:'CUARTO CRECIENTE',emoji:'🌓',min:67.5,max:112.5},{name:'GIBOSA CRECIENTE',emoji:'🌔',min:112.5,max:157.5},
  {name:'LUNA LLENA',emoji:'🌕',min:157.5,max:202.5},{name:'GIBOSA MENGUANTE',emoji:'🌖',min:202.5,max:247.5},
  {name:'CUARTO MENGUANTE',emoji:'🌗',min:247.5,max:292.5},{name:'MENGUANTE FINAL',emoji:'🌘',min:292.5,max:337.5},
];
PHASES.forEach((ph,i)=>{
  const a=(i/8)*Math.PI*2,dot=document.createElement('div');
  dot.style.cssText='font-size:13px;pointer-events:none;opacity:.55;';dot.textContent=ph.emoji;
  const obj=new CSS2DObject(dot);obj.position.set(Math.cos(a)*5.1,0,Math.sin(a)*5.1);spaceScene.add(obj);
});
const sunMeshS=new THREE.Mesh(new THREE.SphereGeometry(.6,16,16),new THREE.MeshBasicMaterial({color:0xffee88}));
sunMeshS.position.set(14,0,0); spaceScene.add(sunMeshS);
sunMeshS.add(new THREE.Mesh(new THREE.SphereGeometry(1,16,16),
  new THREE.MeshBasicMaterial({color:0xffee44,transparent:true,opacity:.08,depthWrite:false,side:THREE.BackSide})));
const slDiv=document.createElement('div');slDiv.className='space-label sun-label';slDiv.textContent='SOL';
const slObj=new CSS2DObject(slDiv);slObj.position.set(14,1,0);spaceScene.add(slObj);
const mk=(t,c)=>{const d=document.createElement('div');d.className=`tide-label ${c}`;d.textContent=t;return new CSS2DObject(d);};
const tideHighObj=mk('▲ MAREA ALTA','tide-high');spaceScene.add(tideHighObj);
const tideHighObj2=mk('▲ MAREA ALTA','tide-high');spaceScene.add(tideHighObj2);
const tideLowObj=mk('▼ MAREA BAJA','tide-low');spaceScene.add(tideLowObj);

function getPhase(wp){
  let d=THREE.MathUtils.radToDeg(Math.atan2(wp.z,wp.x)),p=(-d+360)%360;
  for(const ph of PHASES){if(ph.min<0){if(p>=360+ph.min||p<ph.max)return ph;}else{if(p>=ph.min&&p<ph.max)return ph;}}
  return PHASES[0];
}
const phaseHUD=document.getElementById('phase-hud'),tidalTypeHUD=document.getElementById('tidal-type');
const tidalExplain=document.getElementById('tidal-explain'),teWhy=document.getElementById('te-why'),teName=document.getElementById('te-name');
const TIDAL_INFO={
  'LUNA NUEVA':{type:'viva',label:'🌊 MAREA VIVA',why:'Sol, Tierra y Luna alineados. Sus fuerzas se suman: máxima amplitud.',name:'Pleamar y bajamar más pronunciadas del ciclo.'},
  'LUNA LLENA':{type:'viva',label:'🌊 MAREA VIVA',why:'Tierra entre Sol y Luna. Fuerzas vuelven a sumarse.',name:'Mayor energía del ciclo: mareas muy activas.'},
  'CUARTO CRECIENTE':{type:'muerta',label:'〰 MAREA MUERTA',why:'Sol y Luna a 90°. Fuerzas se anulan parcialmente.',name:'Menor diferencia pleamar-bajamar.'},
  'CUARTO MENGUANTE':{type:'muerta',label:'〰 MAREA MUERTA',why:'De nuevo a 90°. Fuerzas contrarrestadas.',name:'Mínima amplitud del ciclo.'},
};
const TIDAL_GEN={
  viva:{label:'🌊 MAREA VIVA',why:'La Luna se acerca a la alineación. Fuerzas en aumento.',name:'Diferencia pleamar-bajamar creciente.'},
  muerta:{label:'〰 MAREA MUERTA',why:'Ángulo Sol-Luna mayor de 45°. Fuerzas se compensan.',name:'Mareas menos pronunciadas.'},
};
let _lp='';
function updateTidalType(name){
  const isV=name==='LUNA NUEVA'||name==='LUNA LLENA';
  if(name===_lp)return;_lp=name;
  const info=TIDAL_INFO[name]||TIDAL_GEN[isV?'viva':'muerta'];
  if(tidalTypeHUD){tidalTypeHUD.textContent=info.label;tidalTypeHUD.className=isV?'tide-viva':'tide-muerta';}
  if(tidalExplain){tidalExplain.className=isV?'viva':'muerta';teWhy.textContent=info.why;teName.textContent=info.name;}
  tideMat.opacity=isV?.44:.22;
  tideMesh.scale.set(isV?1.26:1.10, isV?.86:.96, isV?1.26:1.10);
  tideWire.scale.copy(tideMesh.scale);
}

// ─ ESCENA OCÉANO DIURNA (canvas principal) ───────────────────────────────────
const { scene: oceanSceneMain, mesh: oceanMeshMain } = buildDayOcean(22,12,160,80);

// Flechas viento
const windArrows=[];
for(let i=0;i<7;i++){
  const arr=new THREE.ArrowHelper(new THREE.Vector3(-1,0,0),new THREE.Vector3(-9+i*3,2.6,0),1.8,0xffffff,.52,.32);
  arr.line.material.transparent=true; arr.cone.material.transparent=true;
  oceanSceneMain.add(arr); windArrows.push(arr);
}

const oceanCameraMain=new THREE.PerspectiveCamera(50,1,.1,300);
oceanCameraMain.position.set(0,5.5,14);
const oceanControlsMain=new OrbitControls(oceanCameraMain,mainCanvas);
oceanControlsMain.enableDamping=true; oceanControlsMain.dampingFactor=.06;
oceanControlsMain.minDistance=4; oceanControlsMain.maxDistance=25;
oceanControlsMain.maxPolarAngle=Math.PI*.45;

// ═══════════════════════════════════════════════════════════════════════════════
// CANVAS FRANJA — misma textura de mar diurno + flechas móviles de corriente
// ═══════════════════════════════════════════════════════════════════════════════
const stripCanvas  =document.getElementById('ocean-strip-canvas');
const stripRenderer=new THREE.WebGLRenderer({antialias:true,canvas:stripCanvas});
stripRenderer.setPixelRatio(Math.min(devicePixelRatio,2));

const { scene: oceanSceneStrip, mesh: oceanMeshStrip } = buildDayOcean(30,10,200,80);

// ─ Referencias de marea: líneas full-width + postes ─────────────────────────
{
  const TIDE_AMP = 0.72;
  const Z_REF    = 0.5;   // frente a la cámara, bien visible

  // Línea roja de PLEAMAR — atraviesa todo el ancho
  const hiLine = new THREE.Mesh(
    new THREE.BoxGeometry(28, 0.07, 0.18),
    new THREE.MeshBasicMaterial({color:0xff2200})
  );
  hiLine.position.set(0, TIDE_AMP, Z_REF);
  oceanSceneStrip.add(hiLine);

  // Línea azul de BAJAMAR — atraviesa todo el ancho
  const loLine = new THREE.Mesh(
    new THREE.BoxGeometry(28, 0.07, 0.18),
    new THREE.MeshBasicMaterial({color:0x1188ff})
  );
  loLine.position.set(0, -TIDE_AMP, Z_REF);
  oceanSceneStrip.add(loLine);

  // Postes verticales de referencia (más gruesos y visibles)
  const poleMat = new THREE.MeshLambertMaterial({color:0xddddbb});
  for(const xPos of [-13, -6, 0, 6, 13]){
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, TIDE_AMP*2 + 0.3, 8), poleMat);
    pole.position.set(xPos, 0, Z_REF);
    oceanSceneStrip.add(pole);
  }
}

// ─ Flechas de corriente submarina ────────────────────────────────────────────
const COLS=10, ROWS=4;
const STRIP_W=28, STRIP_H=8;

const tempArrows=[];
for(let r=0;r<ROWS;r++){
  for(let c=0;c<COLS;c++){
    const z    = -STRIP_H/2 + (r+.5)*(STRIP_H/ROWS);
    const xIni = -STRIP_W/2 + (c/COLS)*STRIP_W;
    const arr  = new THREE.ArrowHelper(
      new THREE.Vector3(-1,0,0),
      new THREE.Vector3(xIni, -0.45, z),  // bajo la superficie del agua
      1.2, 0x2277cc, 0.36, 0.22
    );
    arr.line.material.transparent=true;
    arr.cone.material.transparent=true;
    oceanMeshStrip.add(arr);
    tempArrows.push({ arr, xCur:xIni, z });
  }
}

// ─ Flechas de viento (sobre la superficie, en world space) ───────────────────
const windArrowsStrip=[];
for(let i=0;i<7;i++){
  const xPos = -13 + i*(26/6);
  const arr  = new THREE.ArrowHelper(
    new THREE.Vector3(-1,0,0),
    new THREE.Vector3(xPos, 1.4, 0),
    1.8, 0xffffff, 0.50, 0.32
  );
  arr.line.material.transparent=true;
  arr.cone.material.transparent=true;
  arr.line.material.opacity=0.80;
  arr.cone.material.opacity=0.80;
  oceanSceneStrip.add(arr);
  windArrowsStrip.push(arr);
}

// Color de flecha según posición X y fenómeno ENOS
function flowColor(xPos, nino){
  const east = xPos / (STRIP_W/2);   // -1 (oeste/Asia) → +1 (este/América)
  const col  = new THREE.Color();

  if(nino > 0.05){
    // El Niño: toda la franja se calienta, gradiente cálido-ardiente hacia el este
    const t = Math.min(1, 0.35 + Math.max(0, (east + 1) / 2) * 0.65);
    col.setHSL(0.60 - t * 0.60, 0.98, 0.50 + t * 0.13);
  } else if(nino < -0.05){
    // La Niña: toda la franja fría, este helado cian-blanco
    const t = Math.min(1, 0.28 + Math.max(0, (east + 1) / 2) * 0.72);
    col.setHSL(0.57 + t * 0.13, 0.98, 0.58 + t * 0.30);
  } else {
    col.setHSL(0.60, 0.85, 0.52);   // azul normal
  }
  return col;
}

// Cámara de la franja: frontal, mirando hacia las referencias roja/azul
const stripCamera=new THREE.PerspectiveCamera(60,1,.1,200);
stripCamera.position.set(0, 1.2, 9);
stripCamera.lookAt(0, 0, 0.5);
const stripControls=new OrbitControls(stripCamera,stripCanvas);
stripControls.enableDamping=true; stripControls.dampingFactor=.07;
stripControls.minDistance=3; stripControls.maxDistance=18;
stripControls.maxPolarAngle=Math.PI*.55;
stripControls.target.set(0, 0, 0.5);

function resizeStrip(){
  const w=stripCanvas.parentElement.clientWidth,h=stripCanvas.parentElement.clientHeight;
  if(w<1||h<1)return;
  stripRenderer.setSize(w,h,false);
  stripCamera.aspect=w/h; stripCamera.updateProjectionMatrix();
}

// ═══════════════════════════════════════════════════════════════════════════════
// DATOS FENÓMENOS
// ═══════════════════════════════════════════════════════════════════════════════
const PHENO={
  normal:{cls:'pheno-normal',title:'ESTADO NORMAL DEL PACÍFICO',
    desc:'Los <strong>vientos alisios</strong> soplan de este a oeste. Empujan agua cálida hacia el oeste y permiten el <em>afloramiento</em> de agua fría frente a América. La termoclina está inclinada.',
    fx:'· Temperatura equilibrada (~27 °C oeste, ~22 °C este).<br>· Afloramiento activo → pesca abundante en Perú.<br>· Lluvias regulares según la estación.',
    nino:0,speed:4,dir:-1,
  },
  nino:{cls:'pheno-nino',title:'🔥 EL NIÑO — ENOS CÁLIDO',
    desc:'Los vientos alisios se <strong>debilitan o invierten</strong>. El agua cálida migra al este. La temperatura del Pacífico oriental sube <strong>3–5 °C por encima de lo normal</strong>.',
    fx:'· Inundaciones en costas del Pacífico americano.<br>· Sequías en Australia, Indonesia, Filipinas.<br>· Colapso del afloramiento → crisis pesquera en Perú.<br>· Huracanes atlánticos menos activos.',
    nino:1,speed:2,dir:1,
  },
  nina:{cls:'pheno-nina',title:'❄ LA NIÑA — ENOS FRÍO',
    desc:'Los vientos alisios se <strong>intensifican</strong>. Afloramiento de agua fría en el este muy intenso. La temperatura del Pacífico oriental baja <strong>3–5 °C por debajo de lo normal</strong>.',
    fx:'· Inundaciones en Australia, Indonesia y sur de Asia.<br>· Sequías en Perú, Ecuador y sur de EE.UU.<br>· Huracanes atlánticos muy activos.<br>· Pesca muy abundante en Perú.',
    nino:-1,speed:8,dir:-1,
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// ESTADO
// ═══════════════════════════════════════════════════════════════════════════════
let currentTab='mareas', waveTime=0, tideT=0;
const _arrowDir=new THREE.Vector3(), _moonWP=new THREE.Vector3();

function applyPheno(key){
  const d=PHENO[key];
  waveUniforms.uNino.value=d.nino; waveUniforms.uSpeed.value=d.speed; waveUniforms.uDir.value=d.dir;
  const pi=document.getElementById('pheno-info');
  if(pi){pi.className=`info-block pheno-block ${d.cls}`;
    document.getElementById('pheno-title').textContent=d.title;
    document.getElementById('pheno-desc').innerHTML=d.desc;}
  const pf=document.getElementById('pheno-effects-text'); if(pf)pf.innerHTML=d.fx;
  document.querySelectorAll('.pheno-btn').forEach(b=>b.classList.toggle('act',b.dataset.p===key));
  const sl=document.getElementById('wind-slider');if(sl)sl.value=d.speed;
  const wv=document.getElementById('wind-val');if(wv)wv.textContent=`${d.speed} m/s`;
  const mk=document.getElementById('ts-marker');
  if(mk){const pct=(d.nino+1)/2*100;mk.style.left=`${pct}%`;
    mk.style.background=d.nino>0?'#ff4411':d.nino<0?'#00ccff':'#44ffcc';}
  const ts=document.getElementById('ts-state');
  if(ts){ts.textContent=d.nino>0?'🔥 Anomalía cálida en el este':d.nino<0?'❄ Anomalía fría en el este':'〰 Temperatura normal';
    ts.className='ts-state'+(d.nino>0?' nino':d.nino<0?' nina':'');}
  const sc=document.getElementById('strip-center-lbl');
  if(sc)sc.textContent=d.nino>0?'🔥 AGUA CÁLIDA — El Niño':d.nino<0?'❄ AGUA FRÍA — La Niña':'OCÉANO PACÍFICO TROPICAL';
  const ov=document.getElementById('strip-overlay');
  if(ov)ov.style.background=d.nino>0?'rgba(210,70,0,0.13)':d.nino<0?'rgba(0,120,230,0.14)':'transparent';
  // Sincronizar slider de viento del strip
  const sw=document.getElementById('strip-wind-slider');
  if(sw){sw.value=d.speed;const sv=document.getElementById('strip-wind-val');if(sv)sv.textContent=`${d.speed} m/s`;}
}

// ═══════════════════════════════════════════════════════════════════════════════
// TABS
// ═══════════════════════════════════════════════════════════════════════════════
const CANVAS_DESC={
  mareas:'<strong>Sistema Tierra–Luna</strong> · Los abultamientos azules muestran las dos zonas de marea alta simultáneas',
  olas:'<strong>Océano de día</strong> · Ajustá el viento y los fenómenos para ver el comportamiento del mar',
  corrientes:'<strong>Océano — Vista cenital de corrientes superficiales</strong>',
};
function switchTab(tab){
  currentTab=tab;
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('act'));
  document.querySelectorAll('.info-section').forEach(s=>s.classList.remove('active'));
  document.querySelector(`.tab-btn.${tab}`).classList.add('act');
  document.getElementById(`sec-${tab}`).classList.add('active');
  const isM=tab==='mareas',isO=tab==='olas';
  const strip=document.getElementById('ocean-strip');if(strip)strip.style.display=isM?'block':'none';
  const pb=document.getElementById('phase-bar'),te=document.getElementById('tidal-explain');
  if(pb)pb.style.display=isM?'':'none'; if(te)te.style.display=isM?'':'none';
  const wh=document.getElementById('wave-hud');if(wh)wh.style.display=isO?'flex':'none';
  const wl=document.getElementById('wave-labels');if(wl)wl.style.display=isO?'flex':'none';
  if(!isM){
    const p=tab==='corrientes'?[0,14,6]:[0,5.5,14];
    oceanCameraMain.position.set(...p); oceanControlsMain.target.set(0,0,0); oceanControlsMain.update();
  } else {
    mainCamera.position.set(0,5,10); mainControls.target.set(0,0,0); mainControls.update();
  }
  windArrows.forEach(a=>{a.visible=isO;});
  const cd=document.getElementById('canvas-desc');if(cd)cd.innerHTML=CANVAS_DESC[tab];
  resizeMain(); if(isM)resizeStrip(); if(isO)setTimeout(resizeDiagram,50);
}

// ═══════════════════════════════════════════════════════════════════════════════
// RESIZE
// ═══════════════════════════════════════════════════════════════════════════════
function resizeMain(){
  const w=mainCanvas.parentElement.clientWidth,h=mainCanvas.parentElement.clientHeight;
  if(w<1||h<1)return;
  mainRenderer.setSize(w,h,false);
  [mainCamera,oceanCameraMain].forEach(c=>{c.aspect=w/h;c.updateProjectionMatrix();});
  labelRenderer.setSize(w,h);
}
window.addEventListener('resize',()=>{resizeMain();resizeStrip();resizeDiagram();});

// ═══════════════════════════════════════════════════════════════════════════════
// CONTROLES
// ═══════════════════════════════════════════════════════════════════════════════
const windSlider=document.getElementById('wind-slider');
if(windSlider)windSlider.addEventListener('input',()=>{
  waveUniforms.uSpeed.value=parseFloat(windSlider.value);
  const wv=document.getElementById('wind-val');if(wv)wv.textContent=`${windSlider.value} m/s`;
});
// Tabs
document.querySelectorAll('.tab-btn').forEach(btn=>btn.addEventListener('click',()=>switchTab(btn.dataset.tab)));

// Botón dirección viento (OLAS tab) — usa uWindDir, no uDir
const wdb=document.getElementById('wind-dir-btn');
if(wdb)wdb.addEventListener('click',()=>{waveUniforms.uWindDir.value*=-1;});
document.querySelectorAll('.pheno-btn').forEach(btn=>btn.addEventListener('click',()=>applyPheno(btn.dataset.p)));

// ═══════════════════════════════════════════════════════════════════════════════
// ANIMACIÓN
// ═══════════════════════════════════════════════════════════════════════════════
;(function animate(){
  requestAnimationFrame(animate);
  const dt=0.016;
  waveTime+=dt*(waveUniforms.uSpeed.value*0.20+0.5);
  waveUniforms.uTime.value=waveTime;

  if(currentTab==='mareas'){
    // ── Espacio ──────────────────────────────────────────────────────────────
    earthMesh.rotation.y+=.002;
    moonOrbit.rotation.y+=.0025;
    moonMesh.getWorldPosition(_moonWP);
    const toMoon=_moonWP.clone().normalize();
    const phase=getPhase(_moonWP);
    phaseDiv.textContent=`${phase.emoji} ${phase.name}`;
    if(phaseHUD){phaseHUD.textContent=`${phase.emoji} ${phase.name}`;
      phaseHUD.className=(phase.name==='LUNA NUEVA'||phase.name==='LUNA LLENA')?'phase-highlight':'';}
    updateTidalType(phase.name);
    tideMesh.quaternion.setFromUnitVectors(new THREE.Vector3(1,0,0),toMoon);
    tideWire.quaternion.copy(tideMesh.quaternion);
    const h1=toMoon.clone().multiplyScalar(1.18),h2=toMoon.clone().multiplyScalar(-1.18);
    tideHighObj.position.copy(h1).setY(h1.y+.14);
    tideHighObj2.position.copy(h2).setY(h2.y+.14);
    const perp=new THREE.Vector3(-toMoon.z,0,toMoon.x).normalize().multiplyScalar(1.06);
    tideLowObj.position.copy(perp).setY(.14);
    mainControls.update();
    mainRenderer.render(spaceScene,mainCamera);
    labelRenderer.render(spaceScene,mainCamera);

    // ── Franja océano ─────────────────────────────────────────────────────────
    tideT+=dt*0.32;
    const tideFactor=Math.sin(tideT);
    const TIDE_AMP=0.72;
    oceanMeshStrip.position.y = tideFactor * TIDE_AMP;
    waveUniforms.uTide.value=tideFactor * 0.18;
    const pct=(tideFactor+1)/2*100;
    const fill=document.getElementById('tide-fill');if(fill)fill.style.width=`${pct}%`;
    const tlbl=document.getElementById('tide-lbl');
    if(tlbl)tlbl.textContent=tideFactor>.5?'▲ PLEAMAR':tideFactor<-.5?'▼ BAJAMAR':'〰 MAREA MEDIA';

    const nino    = waveUniforms.uNino.value;
    const curDir  = waveUniforms.uDir.value;      // corriente ENOS → flechas submarinas
    const windDir = waveUniforms.uWindDir.value;  // viento → flechas superficie + olas
    const spd     = waveUniforms.uSpeed.value;
    const halfW   = STRIP_W/2+1;

    // Flechas submarinas (siguen la corriente ENOS)
    const velocity = curDir*(spd*0.22+0.4)*dt;
    _arrowDir.set(curDir,0,0);
    tempArrows.forEach(({arr,z},idx)=>{
      arr.position.x+=velocity;
      if(curDir<0 && arr.position.x < -halfW) arr.position.x = halfW;
      if(curDir>0 && arr.position.x >  halfW) arr.position.x =-halfW;
      arr.setDirection(_arrowDir);
      const len=0.7+spd*0.10;
      arr.setLength(len, len*.34, len*.22);
      const col=flowColor(arr.position.x, nino);
      arr.setColor(col);
      const opBase=nino<-0.05?0.72:nino>0.05?0.42:0.55;
      const op=opBase+Math.sin(waveTime*0.7+idx*0.5)*0.12;
      arr.line.material.opacity=op; arr.cone.material.opacity=op;
      arr.position.y=-0.45+Math.sin(waveTime*0.5+idx*0.4)*0.06;
    });

    // Flechas de viento (siguen el viento, independiente de la corriente)
    const wLen=0.8+spd*0.18;
    const wOp=0.50+Math.min(spd/10,1)*0.40;
    _arrowDir.set(windDir,0,0);
    windArrowsStrip.forEach((arr,i)=>{
      arr.setDirection(_arrowDir);
      arr.setLength(wLen, wLen*.32, wLen*.20);
      arr.line.material.opacity=wOp+Math.sin(waveTime*0.6+i*0.9)*0.10;
      arr.cone.material.opacity=wOp+Math.sin(waveTime*0.6+i*0.9)*0.10;
      arr.position.y=oceanMeshStrip.position.y+1.15+Math.sin(waveTime*0.4+i*0.7)*0.06;
    });

    // Cuadro viento vs corriente: windDir (botón) vs curDir (fenómeno ENOS)
    {
      const _favor = windDir * curDir > 0;
      const _bf=document.getElementById('wtb-favor'), _bc=document.getElementById('wtb-contra');
      if(_bf) _bf.classList.toggle('active', _favor);
      if(_bc) _bc.classList.toggle('active', !_favor);
    }

    stripControls.update();
    stripRenderer.render(oceanSceneStrip,stripCamera);

  } else {
    // ── Océano principal ──────────────────────────────────────────────────────
    waveUniforms.uTide.value=0;
    if(currentTab==='olas'){
      const spd=waveUniforms.uSpeed.value,dir=waveUniforms.uDir.value;
      const aLen=.5+spd*.17, op=Math.min(spd/10,1)*.85+.10;
      _arrowDir.set(dir,0,0);
      windArrows.forEach((arr,i)=>{
        arr.setDirection(_arrowDir); arr.setLength(aLen,aLen*.34,aLen*.20);
        arr.line.material.opacity=op; arr.cone.material.opacity=op;
        arr.position.y=2.6+Math.sin(waveTime*1.1+i*.9)*.22;
      });
    }
    oceanControlsMain.update();
    mainRenderer.render(oceanSceneMain,oceanCameraMain);
    // Diagrama 2D de ola (solo cuando el tab OLAS está activo)
    if(currentTab==='olas') drawWaveDiagram();
  }
})();

// ═══════════════════════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════════════════════
// Overlay de temperatura en la franja oceánica
const _stripOv=document.createElement('div');
_stripOv.id='strip-overlay';
_stripOv.style.cssText='position:absolute;inset:0;pointer-events:none;z-index:2;transition:background .7s ease;';
document.getElementById('ocean-strip').appendChild(_stripOv);

// ═══════════════════════════════════════════════════════════════════════════════
// DIAGRAMA 2D — ANATOMÍA DE OLA (tab OLAS, panel derecho)
// ═══════════════════════════════════════════════════════════════════════════════
const _diagCanvas = document.getElementById('wave-diagram');
const _diagCtx    = _diagCanvas ? _diagCanvas.getContext('2d') : null;

function resizeDiagram(){
  if(!_diagCanvas) return;
  _diagCanvas.width  = _diagCanvas.offsetWidth  || 400;
  _diagCanvas.height = _diagCanvas.offsetHeight || 200;
}

function drawWaveDiagram(){
  if(!_diagCtx || !_diagCanvas || _diagCanvas.width < 10) return;
  const W = _diagCanvas.width, H = _diagCanvas.height;
  const spd  = waveUniforms.uSpeed.value;
  const wDir = waveUniforms.uWindDir.value;
  const t    = waveTime;

  // ── Fondo cielo ───────────────────────────────────────────────────────────
  _diagCtx.fillStyle = '#050e1a';
  _diagCtx.fillRect(0, 0, W, H);

  // ── Agua profunda ─────────────────────────────────────────────────────────
  const waterY = H * 0.42;
  const waterGrad = _diagCtx.createLinearGradient(0, waterY, 0, H);
  waterGrad.addColorStop(0,   '#003a7a');
  waterGrad.addColorStop(0.5, '#001d4a');
  waterGrad.addColorStop(1,   '#000c22');
  _diagCtx.fillStyle = waterGrad;
  _diagCtx.fillRect(0, waterY, W, H - waterY);

  // ── Ola ───────────────────────────────────────────────────────────────────
  const amp = 6 + spd * 3.0;
  const lam = W * 0.38;

  function waveY(x){
    const ph = (x / lam) * Math.PI * 2 - t * 2.8 * wDir;
    return waterY + Math.sin(ph) * amp + Math.sin(ph * 1.7 - t * 0.9) * amp * 0.28;
  }

  _diagCtx.beginPath();
  for(let x = 0; x <= W; x += 2){
    x === 0 ? _diagCtx.moveTo(x, waveY(x)) : _diagCtx.lineTo(x, waveY(x));
  }
  _diagCtx.lineTo(W, H); _diagCtx.lineTo(0, H);
  _diagCtx.closePath();
  const wgr = _diagCtx.createLinearGradient(0, waterY - amp, 0, waterY + amp * 2);
  wgr.addColorStop(0, '#1a6fd4'); wgr.addColorStop(1, '#00286e');
  _diagCtx.fillStyle = wgr;
  _diagCtx.fill();

  // Línea de cresta
  _diagCtx.beginPath();
  for(let x = 0; x <= W; x += 2){
    x === 0 ? _diagCtx.moveTo(x, waveY(x)) : _diagCtx.lineTo(x, waveY(x));
  }
  _diagCtx.strokeStyle = 'rgba(100,210,255,0.85)';
  _diagCtx.lineWidth = 1.8;
  _diagCtx.stroke();

  // ── Partículas en órbita (movimiento circular dentro del agua) ─────────────
  for(let layer = 0; layer < 3; layer++){
    const depth  = (layer + 0.8) * H * 0.14;
    const orbitR = Math.max(1, amp * Math.pow(0.52, layer));
    _diagCtx.fillStyle = `rgba(60,150,255,${0.55 - layer * 0.14})`;
    for(let p = 0; p < 7; p++){
      const bx   = (p + 0.5) / 7 * W;
      const ph   = (bx / lam) * Math.PI * 2 - t * 2.8 * wDir;
      const px   = bx  + Math.sin(ph)  * orbitR * 0.85;
      const py   = waterY + depth - Math.cos(ph) * orbitR;
      _diagCtx.beginPath();
      _diagCtx.arc(px, py, Math.max(1, 2.8 - layer * 0.7), 0, Math.PI * 2);
      _diagCtx.fill();
    }
  }

  // ── Flechas de viento (animadas) ───────────────────────────────────────────
  const wY = H * 0.19;
  const aLen = 16 + spd * 2.2;
  const wOp  = 0.30 + spd / 10 * 0.55;
  const step = W / 5;
  for(let i = 0; i < 5; i++){
    const offset = ((t * 55 * wDir % step) + step) % step;
    const ax = i * step + offset;
    _diagCtx.globalAlpha = wOp;
    _diagCtx.strokeStyle = '#88ccff';
    _diagCtx.lineWidth = 1.4;
    _diagCtx.beginPath();
    if(wDir >= 0){
      _diagCtx.moveTo(ax, wY); _diagCtx.lineTo(ax + aLen, wY);
      _diagCtx.lineTo(ax + aLen - 7, wY - 4);
      _diagCtx.moveTo(ax + aLen, wY); _diagCtx.lineTo(ax + aLen - 7, wY + 4);
    } else {
      _diagCtx.moveTo(ax + aLen, wY); _diagCtx.lineTo(ax, wY);
      _diagCtx.lineTo(ax + 7, wY - 4);
      _diagCtx.moveTo(ax, wY); _diagCtx.lineTo(ax + 7, wY + 4);
    }
    _diagCtx.stroke();
  }
  _diagCtx.globalAlpha = 1;

  // ── Etiquetas ──────────────────────────────────────────────────────────────
  _diagCtx.font = 'bold 10px Segoe UI';

  // VIENTO
  _diagCtx.fillStyle = 'rgba(136,204,255,0.70)';
  _diagCtx.fillText(wDir >= 0 ? 'VIENTO →' : '← VIENTO', 10, H * 0.09);

  // H (altura de ola, indicador verde)
  const hx = W * 0.88;
  _diagCtx.strokeStyle = 'rgba(0,255,150,0.65)';
  _diagCtx.lineWidth = 1;
  _diagCtx.beginPath();
  _diagCtx.moveTo(hx, waterY - amp - 2);
  _diagCtx.lineTo(hx, waterY + amp + 2);
  _diagCtx.stroke();
  _diagCtx.fillStyle = 'rgba(0,255,150,0.90)';
  _diagCtx.fillText('H', hx + 4, waterY + 4);

  // FETCH (línea punteada)
  _diagCtx.setLineDash([4, 3]);
  _diagCtx.strokeStyle = 'rgba(255,200,80,0.45)';
  _diagCtx.lineWidth = 1;
  _diagCtx.beginPath();
  _diagCtx.moveTo(W * 0.05, H * 0.35);
  _diagCtx.lineTo(W * 0.82, H * 0.35);
  _diagCtx.stroke();
  _diagCtx.setLineDash([]);
  _diagCtx.fillStyle = 'rgba(255,200,80,0.65)';
  _diagCtx.font = '9px Segoe UI';
  _diagCtx.fillText('FETCH', W * 0.40, H * 0.33);
}

// Slider de viento del strip (mareas tab)
const _swSlider=document.getElementById('strip-wind-slider');
if(_swSlider)_swSlider.addEventListener('input',()=>{
  waveUniforms.uSpeed.value=parseFloat(_swSlider.value);
  const sv=document.getElementById('strip-wind-val');if(sv)sv.textContent=`${_swSlider.value} m/s`;
});
const _swDir=document.getElementById('strip-wind-dir-btn');
if(_swDir)_swDir.addEventListener('click',()=>{ waveUniforms.uWindDir.value*=-1; });

applyPheno('normal');
switchTab('mareas');
resizeMain();
resizeStrip();
