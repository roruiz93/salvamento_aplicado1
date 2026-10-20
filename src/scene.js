import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';

const BASE = 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r158/examples/textures/planets/';

// ─ RENDERERS ────────────────────────────────────────────────────────────────
export const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

export const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(innerWidth, innerHeight);
labelRenderer.domElement.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;';
document.body.appendChild(labelRenderer.domElement);

// ─ ESCENA / CÁMARA ──────────────────────────────────────────────────────────
export const scene = new THREE.Scene();
export const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, .1, 1000);
camera.position.set(0, 0, 3.2);

export const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = .06;
controls.minDistance = 1.5;
controls.maxDistance = 10;

renderer.domElement.addEventListener('dblclick', () => {
  camera.position.set(0, 0, 3.2);
  controls.target.set(0, 0, 0);
  controls.update();
});

// ─ ESTRELLAS ────────────────────────────────────────────────────────────────
function buildStars() {
  const N = 8000;
  const p = new Float32Array(N * 3);
  const s = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    p[i * 3]     = (Math.random() - .5) * 300;
    p[i * 3 + 1] = (Math.random() - .5) * 300;
    p[i * 3 + 2] = (Math.random() - .5) * 300;
    s[i] = Math.random() * 1.5 + .3;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  g.setAttribute('size',     new THREE.BufferAttribute(s, 1));
  scene.add(new THREE.Points(g, new THREE.ShaderMaterial({
    vertexShader:   `attribute float size;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=size*(300./-mv.z);gl_Position=projectionMatrix*mv;}`,
    fragmentShader: `void main(){float d=distance(gl_PointCoord,vec2(.5));if(d>.5)discard;gl_FragColor=vec4(1,1,1,1.-smoothstep(.3,.5,d));}`,
    transparent: true, depthWrite: false,
  })));
}

// ─ GLOBO TERRÁQUEO ──────────────────────────────────────────────────────────
export const earthGroup = new THREE.Group();
earthGroup.rotation.z = 23.5 * Math.PI / 180;
scene.add(earthGroup);

const ldr = new THREE.TextureLoader();

export const earthMesh = new THREE.Mesh(
  new THREE.SphereGeometry(1, 64, 64),
  new THREE.MeshPhongMaterial({
    map:         ldr.load(BASE + 'earth_atmos_2048.jpg'),
    bumpMap:     ldr.load(BASE + 'earth_normal_2048.jpg'),
    bumpScale:   .05,
    specularMap: ldr.load(BASE + 'earth_specular_2048.jpg'),
    specular:    new THREE.Color(0x224488),
    shininess:   15,
  })
);
earthGroup.add(earthMesh);

// capa oceánica translúcida
earthGroup.add(new THREE.Mesh(
  new THREE.SphereGeometry(1.025, 64, 64),
  new THREE.MeshPhongMaterial({ color: 0x3366ff, transparent: true, opacity: .06, depthWrite: false })
));

// atmósfera
earthGroup.add(new THREE.Mesh(
  new THREE.SphereGeometry(1.12, 64, 64),
  new THREE.ShaderMaterial({
    vertexShader:   `varying vec3 vN;void main(){vN=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `varying vec3 vN;void main(){float i=pow(.68-dot(vN,vec3(0,0,1)),4.);gl_FragColor=vec4(.2,.5,1,1)*i;}`,
    blending: THREE.AdditiveBlending, side: THREE.BackSide, transparent: true, depthWrite: false,
  })
));

// eje de rotación
earthGroup.add(new THREE.Line(
  new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -1.5, 0), new THREE.Vector3(0, 1.5, 0)]),
  new THREE.LineBasicMaterial({ color: 0xffffff, opacity: .15, transparent: true })
));

// ─ LUCES ────────────────────────────────────────────────────────────────────
const sun  = new THREE.DirectionalLight(0xffffff, 2.5); sun.position.set(5, 2, 3);  scene.add(sun);
const fill = new THREE.DirectionalLight(0x8899cc, .6);  fill.position.set(-5, -1, -3); scene.add(fill);
scene.add(new THREE.AmbientLight(0xffffff, .5));

// ─ RESIZE ───────────────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  labelRenderer.setSize(innerWidth, innerHeight);
});

// init
buildStars();
