// ─ MÓDULOS ──────────────────────────────────────────────────────────────────
import { renderer, labelRenderer, scene, camera, controls, earthMesh } from './scene.js';
import { updateLabelVisibility } from './labels.js';
import { stepCurrents } from './currents.js';
import { stepSinking } from './sinking.js';
import './ui.js';

// ─ CONTROL DE VELOCIDAD ──────────────────────────────────────────────────────
const speedSlider = document.getElementById('speedSlider');

// ─ LOOP DE ANIMACIÓN ─────────────────────────────────────────────────────────
(function animate() {
  requestAnimationFrame(animate);

  earthMesh.rotation.y += parseFloat(speedSlider.value) * .001;

  controls.update();
  updateLabelVisibility();
  stepCurrents();
  stepSinking();

  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
})();
