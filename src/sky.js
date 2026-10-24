import * as THREE from 'three';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const smoothstep = (min, max, value) => {
  const x = clamp((value - min) / (max - min), 0, 1);
  return x * x * (3 - 2 * x);
};

export function computeSunState(hour) {
  const dayT = clamp((hour - 6.0) / 12.0, 0, 1);
  const elevationDeg = 1.5 + 64 * Math.sin(Math.PI * dayT);
  const azimuthDeg = 62 - 124 * dayT;
  const elevation = THREE.MathUtils.degToRad(elevationDeg);
  const azimuth = THREE.MathUtils.degToRad(azimuthDeg);
  const direction = new THREE.Vector3(
    Math.cos(elevation) * Math.sin(azimuth),
    Math.sin(elevation),
    Math.cos(elevation) * Math.cos(azimuth),
  ).normalize();

  const warm = new THREE.Color('#ffb36b');
  const neutral = new THREE.Color('#ffe7b8');
  const high = new THREE.Color('#fff7e7');
  const ascent = smoothstep(0.1, 0.8, Math.sin(elevation));
  const color = warm.clone().lerp(neutral, smoothstep(0, 0.55, ascent)).lerp(high, smoothstep(0.48, 1, ascent));
  const intensity = 1.5 + 3.0 * Math.pow(Math.sin(elevation), 0.52);

  return {
    dayT,
    elevation,
    azimuth,
    direction,
    color,
    intensity,
    isGolden: dayT > 0.72 || dayT < 0.18,
  };
}

function createEnvironmentTexture() {
  const width = 1024;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  const skyGradient = ctx.createLinearGradient(0, 0, 0, height * 0.56);
  skyGradient.addColorStop(0, '#3f6d98');
  skyGradient.addColorStop(0.36, '#7d9db4');
  skyGradient.addColorStop(0.72, '#c5c9be');
  skyGradient.addColorStop(1, '#f0d8b2');
  ctx.fillStyle = skyGradient;
  ctx.fillRect(0, 0, width, height * 0.56);

  const groundGradient = ctx.createLinearGradient(0, height * 0.56, 0, height);
  groundGradient.addColorStop(0, '#9a8d78');
  groundGradient.addColorStop(1, '#4b4a43');
  ctx.fillStyle = groundGradient;
  ctx.fillRect(0, height * 0.56, width, height * 0.44);

  const sunX = width * 0.68;
  const sunY = height * 0.22;
  const sunGlow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, width * 0.23);
  sunGlow.addColorStop(0, 'rgba(255,252,226,0.98)');
  sunGlow.addColorStop(0.045, 'rgba(255,239,190,0.86)');
  sunGlow.addColorStop(0.2, 'rgba(255,220,158,0.24)');
  sunGlow.addColorStop(1, 'rgba(255,217,150,0)');
  ctx.fillStyle = sunGlow;
  ctx.fillRect(0, 0, width, height);

  for (const [x, y, rx, ry, alpha] of [
    [230, 176, 260, 34, 0.08],
    [610, 208, 300, 28, 0.075],
    [840, 136, 240, 22, 0.06],
  ]) {
    const cloud = ctx.createRadialGradient(x, y, 0, x, y, rx);
    cloud.addColorStop(0, `rgba(255,247,230,${alpha})`);
    cloud.addColorStop(1, 'rgba(255,247,230,0)');
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, ry / rx);
    ctx.fillStyle = cloud;
    ctx.beginPath();
    ctx.arc(0, 0, rx, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function createSkyDome() {
  const vertexShader = /* glsl */ `
    varying vec3 vWorldPosition;
    void main() {
      vec4 world = modelMatrix * vec4(position, 1.0);
      vWorldPosition = world.xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;
  const fragmentShader = /* glsl */ `
    uniform vec3 uSunDirection;
    uniform vec3 uSunColor;
    uniform vec3 uZenith;
    uniform vec3 uHorizon;
    uniform vec3 uGround;
    uniform float uHaze;
    varying vec3 vWorldPosition;

    void main() {
      vec3 direction = normalize(vWorldPosition - cameraPosition);
      float height = direction.y;

      float skyMix = pow(smoothstep(0.0, 0.135, max(height, 0.0)), 0.72);
      vec3 color = mix(uHorizon, uZenith, skyMix);

      // Bright band of scattered light around the horizon
      float horizonBand = exp(-abs(height) * 15.0) * uHaze;
      color += uSunColor * horizonBand * 0.12;

      // Below the horizon, settle into a dusty ground haze.
      color = mix(uGround, color, smoothstep(-0.075, 0.025, height));

      float sunDot = max(dot(direction, uSunDirection), 0.0);
      float halo = pow(sunDot, 9.0) * 0.24;
      float glow = pow(sunDot, 75.0) * 0.36;
      float disc = smoothstep(0.99968, 0.99992, sunDot);
      color += uSunColor * (halo + glow);
      color = mix(color, vec3(1.0, 0.97, 0.86), disc * 0.9);

      // Whisper of high cirrus, tinted by the sun.
      float band = sin(direction.x * 18.0 + direction.z * 11.0 + direction.y * 5.0);
      float cirrus = smoothstep(0.72, 1.0, band) * smoothstep(0.02, 0.2, height) * (1.0 - smoothstep(0.34, 0.64, height));
      color += vec3(1.0, 0.93, 0.82) * cirrus * 0.035;

      float dither = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
      color += (dither - 0.5) / 255.0;

      gl_FragColor = vec4(color, 1.0);
    }
  `;

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uSunDirection: { value: new THREE.Vector3(0, 1, 0) },
      uSunColor: { value: new THREE.Vector3(1.0, 0.88, 0.66) },
      uZenith: { value: new THREE.Vector3(0.27, 0.49, 0.72) },
      uHorizon: { value: new THREE.Vector3(0.92, 0.77, 0.58) },
      uGround: { value: new THREE.Vector3(0.58, 0.54, 0.47) },
      uHaze: { value: 1.0 },
    },
    vertexShader,
    fragmentShader,
    side: THREE.BackSide,
    depthWrite: false,
    depthTest: false,
    fog: false,
    toneMapped: false,
  });

  const geometry = new THREE.SphereGeometry(880, 48, 28);
  const dome = new THREE.Mesh(geometry, material);
  dome.frustumCulled = false;
  dome.renderOrder = -100;
  dome.name = 'Sky dome';
  return dome;
}

function createClouds(scene, texture) {
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    opacity: 0.82,
    depthWrite: false,
    depthTest: true,
    fog: false,
    color: 0xfff2dd,
    blending: THREE.NormalBlending,
    toneMapped: false,
  });

  const group = new THREE.Group();
  const clouds = [
    { position: [-285, 220, -390], scale: [420, 140, 1], opacity: 0.9 },
    { position: [290, 270, -440], scale: [490, 160, 1], opacity: 0.8 },
    { position: [-250, 24, -550], scale: [520, 140, 1], opacity: 0.76 },
    { position: [270, 30, -505], scale: [460, 125, 1], opacity: 0.64 },
    { position: [430, 105, -210], scale: [360, 115, 1], opacity: 0.5 },
    { position: [-445, 96, -230], scale: [340, 112, 1], opacity: 0.5 },
    { position: [395, 150, 235], scale: [350, 120, 1], opacity: 0.6 },
    { position: [-430, 165, 265], scale: [390, 132, 1], opacity: 0.58 },
    { position: [95, 42, -560], scale: [330, 100, 1], opacity: 0.48 },
    { position: [0, 82, 590], scale: [400, 120, 1], opacity: 0.4 },
  ];

  for (const item of clouds) {
    const sprite = new THREE.Sprite(material.clone());
    sprite.material.opacity = item.opacity;
    sprite.position.set(...item.position);
    sprite.scale.set(...item.scale);
    sprite.userData.baseOpacity = item.opacity;
    group.add(sprite);
  }
  group.renderOrder = -20;
  scene.add(group);
  return group;
}

function mixColor3(a, b, t) {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

const PALETTES = {
  zenithNoon: [0.25, 0.49, 0.76],
  zenithGolden: [0.22, 0.43, 0.68],
  horizonNoon: [0.78, 0.86, 0.91],
  horizonDawn: [0.93, 0.69, 0.46],
  horizonDusk: [0.96, 0.63, 0.37],
  groundNoon: [0.66, 0.63, 0.56],
  groundGolden: [0.58, 0.49, 0.39],
};

export function createSky(scene, renderer, textures) {
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();
  const envSource = createEnvironmentTexture();
  const envTarget = pmremGenerator.fromEquirectangular(envSource);
  scene.environment = envTarget.texture;
  scene.environmentIntensity = 0.55;
  envSource.dispose();
  pmremGenerator.dispose();

  const dome = createSkyDome();
  scene.add(dome);
  const uniforms = dome.material.uniforms;

  const clouds = createClouds(scene, textures.cloud);
  const fog = new THREE.Fog(0xcec9bd, 240, 780);
  scene.fog = fog;

  function update(hour) {
    const state = computeSunState(hour);
    const evening = state.dayT >= 0.5;
    const goldWeight = Math.pow(Math.abs(state.dayT - 0.5) * 2, 1.28);
    const zenith = mixColor3(PALETTES.zenithNoon, PALETTES.zenithGolden, goldWeight * 0.92);
    const warmHorizon = evening ? PALETTES.horizonDusk : PALETTES.horizonDawn;
    const horizon = mixColor3(PALETTES.horizonNoon, warmHorizon, goldWeight);
    const ground = mixColor3(PALETTES.groundNoon, PALETTES.groundGolden, goldWeight);
    const sunWarmth = 1 - smoothstep(0.18, 0.8, Math.sin(state.elevation));
    const sunColor = mixColor3([1.0, 0.92, 0.72], [1.0, 0.68, 0.33], sunWarmth);

    uniforms.uSunDirection.value.copy(state.direction);
    uniforms.uSunColor.value.set(sunColor[0], sunColor[1], sunColor[2]);
    uniforms.uZenith.value.set(...zenith);
    uniforms.uHorizon.value.set(...horizon);
    uniforms.uGround.value.set(...ground);
    uniforms.uHaze.value = 0.6 + goldWeight * 0.7;

    fog.color.setRGB(horizon[0] * 0.84, horizon[1] * 0.84, horizon[2] * 0.82, THREE.SRGBColorSpace);
    fog.near = 210;
    fog.far = 760;

    const cloudTint = new THREE.Color(1.0, 0.93, 0.83).lerp(new THREE.Color(1.0, 0.76, 0.55), goldWeight * 0.45);
    for (const sprite of clouds.children) {
      sprite.material.color.copy(cloudTint);
      sprite.material.opacity = sprite.userData.baseOpacity * (0.78 + goldWeight * 0.2);
    }
    return state;
  }

  return { update, dome, clouds, envTarget, fog };
}
