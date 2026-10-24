import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createTextures } from './textures.js';
import { createMaterials } from './materials.js';
import { createTaiheHall } from './hall.js';
import { createSky, computeSunState } from './sky.js';

const canvas = document.querySelector('#scene');
const loader = document.querySelector('#loader');
const loaderBar = document.querySelector('#loader-bar');
const errorPanel = document.querySelector('#webgl-error');
const sunReadout = document.querySelector('#sun-readout');
const timeSlider = document.querySelector('#time-slider');
const timeOutput = document.querySelector('#time-output');
const autoRotateButton = document.querySelector('#auto-rotate');
const shadowButton = document.querySelector('#shadow-toggle');
const viewButtons = [...document.querySelectorAll('[data-view]')];
const lightButtons = [...document.querySelectorAll('[data-light]')];

let renderer;
try {
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
    stencil: false,
  });
} catch (error) {
  errorPanel.hidden = false;
  loader.classList.add('is-done');
  throw error;
}

const isMobile = window.matchMedia('(max-width: 720px)').matches;
const maxPixelRatio = isMobile ? 1.7 : 2;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxPixelRatio));
renderer.setSize(window.innerWidth, window.innerHeight, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.toneMappingExposure = 0.97;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.shadowMap.autoUpdate = true;

const scene = new THREE.Scene();

function fovForAspect(aspect) {
  if (aspect < 0.75) return 40;
  if (aspect < 1.0) return 39;
  return 37;
}

function framingScaleForAspect(aspect) {
  if (aspect >= 1.35) return 1;
  if (aspect >= 1.0) return 1 + (1.35 - aspect) * 0.55;
  return Math.min(1.6, 1.19 + (1.0 - aspect) * 0.8);
}

const camera = new THREE.PerspectiveCamera(
  fovForAspect(window.innerWidth / window.innerHeight),
  window.innerWidth / window.innerHeight,
  0.5,
  1800,
);
camera.position.set(66, 43, 104);

const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 15.5, 2);
controls.enableDamping = true;
controls.dampingFactor = 0.055;
controls.rotateSpeed = 0.55;
controls.zoomSpeed = 0.72;
controls.panSpeed = 0.62;
controls.minDistance = 34;
controls.maxDistance = camera.aspect < 0.75 ? 360 : 205;
controls.minPolarAngle = 0.17;
controls.maxPolarAngle = Math.PI / 2 - 0.022;
controls.autoRotateSpeed = 0.38;
controls.update();

const textures = createTextures(renderer);
const materials = createMaterials(textures);
const hall = createTaiheHall(materials);
scene.add(hall);

const skySystem = createSky(scene, renderer, textures);

const sun = new THREE.DirectionalLight(0xffe2b0, 3.2);
sun.castShadow = true;
sun.shadow.mapSize.set(isMobile ? 2048 : 4096, isMobile ? 2048 : 4096);
sun.shadow.camera.left = -82;
sun.shadow.camera.right = 82;
sun.shadow.camera.top = 92;
sun.shadow.camera.bottom = -82;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 380;
sun.shadow.bias = -0.00022;
sun.shadow.normalBias = 0.035;
sun.shadow.radius = 1.25;
scene.add(sun);
scene.add(sun.target);
sun.target.position.set(0, 8, 0);

const fillLight = new THREE.DirectionalLight(0xacc8e2, 0.2);
fillLight.position.set(-60, 32, -75);
scene.add(fillLight);

const frontBounce = new THREE.DirectionalLight(0xffd8b2, 0.18);
frontBounce.position.set(35, 18, 85);
scene.add(frontBounce);

const hemisphere = new THREE.HemisphereLight(0xc3d7ec, 0x7d674b, 0.5);
scene.add(hemisphere);

const ambient = new THREE.AmbientLight(0xfff0da, 0.035);
scene.add(ambient);

const viewPresets = {
  front: {
    position: new THREE.Vector3(12, 33, 116),
    target: new THREE.Vector3(0, 16, 2),
  },
  corner: {
    position: new THREE.Vector3(66, 43, 104),
    target: new THREE.Vector3(0, 15.5, 2),
  },
  profile: {
    position: new THREE.Vector3(112, 32, 16),
    target: new THREE.Vector3(0, 16, 0),
  },
  aerial: {
    position: new THREE.Vector3(74, 114, 125),
    target: new THREE.Vector3(0, 6, -2),
  },
};

const lightPresets = {
  morning: 8.35,
  noon: 12.35,
  dusk: 16.55,
};

function framedView(name, preset) {
  let scale = framingScaleForAspect(camera.aspect);
  // The bird's-eye view should crop in on the hall on tall screens rather than
  // pulling back far enough to turn the courtyard into empty foreground.
  if (name === 'aerial' && camera.aspect < 0.75) scale = 1.0;
  const position = preset.target.clone().addScaledVector(preset.position.clone().sub(preset.target), scale);
  return { position, target: preset.target.clone() };
}

function setInitialView(name = 'corner') {
  const preset = framedView(name, viewPresets[name]);
  camera.position.copy(preset.position);
  controls.target.copy(preset.target);
  controls.maxDistance = camera.aspect < 0.75 ? 360 : 205;
  controls.update();
}

// Let a portrait screen begin with the hall fully in frame.
setInitialView('corner');

let currentHour = 16.55;
let hourTween = null;
let cameraTween = null;
let shadowsEnabled = true;

const branchNames = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

function chineseHour(hour) {
  const index = Math.floor(((hour + 1) % 24) / 2);
  return `${branchNames[index]}时`;
}

function formatClock(hour) {
  const h = Math.floor(hour);
  const m = Math.round((hour - h) * 60);
  if (m === 60) return `${String((h + 1) % 24).padStart(2, '0')}:00`;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function timeOfDayLabel(hour) {
  if (hour < 9) return '晨光初染';
  if (hour < 11.2) return '朝晖满庭';
  if (hour < 13.4) return '日正当中';
  if (hour < 15.5) return '斜阳穿殿';
  if (hour < 17.1) return '夕照熔金';
  return '暮色渐合';
}

function updateReadout() {
  const label = timeOfDayLabel(currentHour);
  sunReadout.textContent = `晴 · ${chineseHour(currentHour)} · ${label}`;
  timeOutput.textContent = formatClock(currentHour);
  timeSlider.value = String(currentHour);
}

function applySun(hour, immediate = false) {
  const state = computeSunState(hour);
  const direction = state.direction;
  sun.position.copy(direction).multiplyScalar(165);
  sun.color.copy(state.color);
  sun.intensity = state.intensity;
  sun.target.position.set(0, 9, 0);
  sun.target.updateMatrixWorld();
  skySystem.update(hour);

  const daylight = THREE.MathUtils.smoothstep(Math.sin(state.elevation), 0, 0.9);
  fillLight.intensity = 0.16 + daylight * 0.1;
  frontBounce.intensity = 0.12 + daylight * 0.1;
  hemisphere.intensity = 0.3 + daylight * 0.18;
  ambient.intensity = 0.02 + daylight * 0.02;
  renderer.toneMappingExposure = 0.93 + daylight * 0.055;
  if (immediate) renderer.shadowMap.needsUpdate = true;

  updateReadout();
}

function clearActiveViews() {
  viewButtons.forEach((button) => {
    button.classList.remove('active');
    button.setAttribute('aria-pressed', 'false');
  });
}

function clearActiveLights() {
  lightButtons.forEach((button) => {
    button.classList.remove('active');
    button.setAttribute('aria-pressed', 'false');
  });
}

function stopHourTween() {
  hourTween = null;
}

function setHour(hour, { animate = false, markPreset = null } = {}) {
  const clamped = THREE.MathUtils.clamp(hour, 7, 17.8);
  if (animate) {
    hourTween = {
      from: currentHour,
      to: clamped,
      startedAt: performance.now(),
      duration: 950,
    };
    clearActiveLights();
    if (markPreset) {
      const button = lightButtons.find((item) => item.dataset.light === markPreset);
      if (button) {
        button.classList.add('active');
        button.setAttribute('aria-pressed', 'true');
      }
    }
  } else {
    stopHourTween();
    currentHour = clamped;
    applySun(currentHour);
  }
}

function setShadows(enabled) {
  shadowsEnabled = enabled;
  sun.castShadow = enabled;
  renderer.shadowMap.enabled = enabled;
  shadowButton.classList.toggle('is-on', enabled);
  shadowButton.setAttribute('aria-pressed', String(enabled));
  // Changing the shadowing light count requires the Lambert/PBR programs to be rebuilt.
  scene.traverse((object) => {
    if (!object.material) return;
    const mats = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of mats) {
      if (material && 'needsUpdate' in material) material.needsUpdate = true;
    }
  });
  if (enabled) renderer.shadowMap.needsUpdate = true;
}

function flyTo(presetName) {
  const preset = viewPresets[presetName];
  if (!preset) return;
  if (controls.autoRotate) {
    controls.autoRotate = false;
    autoRotateButton.classList.remove('is-on');
    autoRotateButton.setAttribute('aria-pressed', 'false');
  }
  const framed = framedView(presetName, preset);
  cameraTween = {
    fromPosition: camera.position.clone(),
    fromTarget: controls.target.clone(),
    toPosition: framed.position,
    toTarget: framed.target,
    startedAt: performance.now(),
    duration: 1350,
  };
  clearActiveViews();
  const button = viewButtons.find((item) => item.dataset.view === presetName);
  if (button) {
    button.classList.add('active');
    button.setAttribute('aria-pressed', 'true');
  }
  controls.enabled = false;
}

viewButtons.forEach((button) => {
  button.addEventListener('click', () => flyTo(button.dataset.view));
});

lightButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const presetName = button.dataset.light;
    const hour = lightPresets[presetName];
    if (hour === undefined) return;
    setHour(hour, { animate: true, markPreset: presetName });
  });
});

timeSlider.addEventListener('input', (event) => {
  clearActiveLights();
  setHour(Number(event.target.value));
});

autoRotateButton.addEventListener('click', () => {
  controls.autoRotate = !controls.autoRotate;
  autoRotateButton.classList.toggle('is-on', controls.autoRotate);
  autoRotateButton.setAttribute('aria-pressed', String(controls.autoRotate));
  if (controls.autoRotate) clearActiveViews();
});

shadowButton.addEventListener('click', () => {
  setShadows(!shadowsEnabled);
});

controls.addEventListener('start', () => {
  cameraTween = null;
  controls.enabled = true;
  clearActiveViews();
});

window.addEventListener('keydown', (event) => {
  if (event.target instanceof HTMLInputElement) return;
  const map = { 1: 'front', 2: 'corner', 3: 'profile', 4: 'aerial' };
  if (map[event.key]) flyTo(map[event.key]);
  if (event.code === 'Space') {
    event.preventDefault();
    autoRotateButton.click();
  }
  if (event.key.toLowerCase() === 's') shadowButton.click();
});

function onWindowResize() {
  const pixelRatio = Math.min(window.devicePixelRatio, maxPixelRatio);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.fov = fovForAspect(camera.aspect);
  camera.updateProjectionMatrix();
  controls.maxDistance = camera.aspect < 0.75 ? 360 : 205;
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight, false);
}

window.addEventListener('resize', onWindowResize);

const clock = new THREE.Clock();
const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

let initialized = false;

function animate(now) {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.05);

  if (hourTween) {
    const progress = Math.min(1, (now - hourTween.startedAt) / hourTween.duration);
    currentHour = THREE.MathUtils.lerp(hourTween.from, hourTween.to, easeInOutCubic(progress));
    applySun(currentHour);
    if (progress >= 1) {
      currentHour = hourTween.to;
      hourTween = null;
    }
  }

  if (cameraTween) {
    const progress = Math.min(1, (now - cameraTween.startedAt) / cameraTween.duration);
    const eased = easeInOutCubic(progress);
    camera.position.lerpVectors(cameraTween.fromPosition, cameraTween.toPosition, eased);
    controls.target.lerpVectors(cameraTween.fromTarget, cameraTween.toTarget, eased);
    camera.lookAt(controls.target);
    if (progress >= 1) {
      cameraTween = null;
      controls.enabled = true;
      controls.update();
    }
  } else {
    controls.update();
  }

  skySystem.clouds.rotation.y += delta * 0.0032;

  renderer.render(scene, camera);

  if (!initialized) {
    initialized = true;
    loaderBar.style.width = '100%';
    applySun(currentHour);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.body.classList.add('is-ready');
        loader.classList.add('is-done');
      });
    });
  }
}

applySun(currentHour, true);
loaderBar.style.width = '64%';
requestAnimationFrame(() => {
  loaderBar.style.width = '82%';
  requestAnimationFrame(() => {
    loaderBar.style.width = '94%';
    requestAnimationFrame(animate);
  });
});
