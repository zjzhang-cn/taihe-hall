import * as THREE from 'three';
import { buildMainRoof, buildSkirtRoof } from './roof.js';

const UP = new THREE.Vector3(0, 1, 0);
const DEG = Math.PI / 180;

const FLOOR_Y = 6.3;
const BODY_W = 47.6;
const BODY_D = 21.4;
const UPPER_W = 39.6;
const UPPER_D = 21.0;
const VERANDA_W = 54.0;
const VERANDA_D = 34.0;
const BAY_WIDTHS = [3.4, 3.8, 4.2, 4.6, 5.0, 5.6, 5.0, 4.6, 4.2, 3.8, 3.4];
const SIDE_BAY_WIDTHS = [4.28, 4.28, 4.28, 4.28, 4.28];
const UPPER_BAY_WIDTHS = [5.0, 5.5, 6.0, 6.6, 6.0, 5.5, 5.0];

const TIERS = [
  { width: 104, depth: 78, height: 2.1, gap: 28 },
  { width: 92, depth: 66, height: 2.1, gap: 24 },
  { width: 80, depth: 54, height: 2.1, gap: 20 },
];

const FLIGHTS = [
  { width: 26, zTop: 39, zOut: 46, yTop: 2.1, yBottom: 0, steps: 7 },
  { width: 22, zTop: 33, zOut: 39, yTop: 4.2, yBottom: 2.1, steps: 7 },
  { width: 18, zTop: 27, zOut: 33, yTop: 6.3, yBottom: 4.2, steps: 7 },
];

function addBox(parent, material, width, height, depth, x, y, z, { cast = true, receive = true } = {}) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = cast;
  mesh.receiveShadow = receive;
  parent.add(mesh);
  return mesh;
}

function addPlane(parent, material, width, height, x, y, z, { cast = false, receive = true } = {}) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = cast;
  mesh.receiveShadow = receive;
  parent.add(mesh);
  return mesh;
}

function makeLocalGroup(side, offset) {
  const group = new THREE.Group();
  if (side === 'front') {
    group.position.z = BODY_D / 2 + offset;
  } else if (side === 'back') {
    group.position.z = -BODY_D / 2 - offset;
    group.rotation.y = Math.PI;
  } else if (side === 'right') {
    group.position.x = BODY_W / 2 + offset;
    group.rotation.y = Math.PI / 2;
  } else {
    group.position.x = -BODY_W / 2 - offset;
    group.rotation.y = -Math.PI / 2;
  }
  return group;
}

function makeUpperLocalGroup(side, offset) {
  const group = new THREE.Group();
  if (side === 'front') {
    group.position.z = UPPER_D / 2 + offset;
  } else if (side === 'back') {
    group.position.z = -UPPER_D / 2 - offset;
    group.rotation.y = Math.PI;
  } else if (side === 'right') {
    group.position.x = UPPER_W / 2 + offset;
    group.rotation.y = Math.PI / 2;
  } else {
    group.position.x = -UPPER_W / 2 - offset;
    group.rotation.y = -Math.PI / 2;
  }
  return group;
}

function bayBoundaries(widths) {
  const sum = widths.reduce((a, b) => a + b, 0);
  let cursor = -sum / 2;
  const boundaries = [cursor];
  for (const width of widths) {
    cursor += width;
    boundaries.push(cursor);
  }
  return boundaries;
}

function addDoorBay(parent, materials, centerX, width) {
  const doorHeight = 7.05;
  const yBottom = FLOOR_Y + 0.16;
  const yCenter = yBottom + doorHeight / 2;
  const leafGap = 0.13;
  const leafWidth = (width - 0.7 - leafGap) / 2;
  const outward = 0.045;

  // Dark recess around the leaves
  addBox(parent, materials.redDeep, width - 0.48, doorHeight + 0.25, 0.16, centerX, yCenter, 0.015, {
    cast: false,
  });

  for (const direction of [-1, 1]) {
    const center = direction * (leafWidth / 2 + leafGap / 2);
    const door = addPlane(parent, materials.door, leafWidth, doorHeight, centerX + center, yCenter, outward);
    door.castShadow = false;
  }

  // Gold vertical reveals, thresholds and a lattice transom.
  addBox(parent, materials.goldDark, 0.11, doorHeight + 0.2, 0.13, centerX, yCenter, 0.1, { cast: false });
  const frameZ = 0.09;
  addBox(parent, materials.redDeep, 0.19, doorHeight + 0.42, 0.18, centerX - width / 2 + 0.22, yCenter + 0.12, frameZ);
  addBox(parent, materials.redDeep, 0.19, doorHeight + 0.42, 0.18, centerX + width / 2 - 0.22, yCenter + 0.12, frameZ);
  addBox(parent, materials.gold, 0.1, doorHeight + 0.28, 0.16, centerX - width / 2 + 0.35, yCenter + 0.1, frameZ + 0.03, { cast: false });
  addBox(parent, materials.gold, 0.1, doorHeight + 0.28, 0.16, centerX + width / 2 - 0.35, yCenter + 0.1, frameZ + 0.03, { cast: false });

  const doorTop = yBottom + doorHeight;
  addBox(parent, materials.goldDark, width - 0.4, 0.12, 0.24, centerX, doorTop + 0.06, 0.09, { cast: false });
  addBox(parent, materials.redDeep, width - 0.26, 0.08, 0.2, centerX, doorTop + 0.17, 0.07, { cast: false });

  // The high transom preserves the lattice rhythm above the doors.
  const transomHeight = 0.48;
  addPlane(parent, materials.lattice, width - 0.72, transomHeight, centerX, doorTop + 0.47, 0.035);
  addBox(parent, materials.goldDark, width - 0.5, 0.07, 0.16, centerX, doorTop + 0.25, 0.08, { cast: false });
  addBox(parent, materials.goldDark, width - 0.5, 0.07, 0.16, centerX, doorTop + 0.75, 0.08, { cast: false });

  // White marble threshold
  addBox(parent, materials.marblePlain, width - 0.36, 0.16, 1.0, centerX, FLOOR_Y + 0.08, 0.45);
}

function addWindowBay(parent, materials, centerX, width, upper = false) {
  const windowHeight = upper ? 2.35 : 4.2;
  const yCenter = upper ? 19.18 : 10.95;
  const windowWidth = width - (upper ? 0.8 : 1.15);

  addPlane(parent, materials.lattice, windowWidth, windowHeight, centerX, yCenter, 0.035);

  const halfW = windowWidth / 2 + 0.14;
  const halfH = windowHeight / 2 + 0.12;
  addBox(parent, materials.goldDark, 0.22, windowHeight + 0.26, 0.16, centerX - halfW, yCenter, 0.08);
  addBox(parent, materials.goldDark, 0.22, windowHeight + 0.26, 0.16, centerX + halfW, yCenter, 0.08);
  addBox(parent, materials.goldDark, windowWidth + 0.4, 0.2, 0.16, centerX, yCenter + halfH, 0.08);
  addBox(parent, materials.goldDark, windowWidth + 0.4, 0.2, 0.16, centerX, yCenter - halfH, 0.08);

  addBox(parent, materials.redDeep, 0.16, windowHeight, 0.11, centerX, yCenter, 0.07, { cast: false });
  addBox(parent, materials.redDeep, windowWidth, 0.13, 0.11, centerX, yCenter, 0.07, { cast: false });

  if (!upper) {
    addBox(parent, materials.redDeep, width - 0.32, 0.22, 0.26, centerX, 7.0, 0.08, { cast: false });
    addBox(parent, materials.goldDark, 0.07, 1.35, 0.13, centerX, 7.68, 0.07, { cast: false });
    addBox(parent, materials.goldDark, width - 1.8, 0.07, 0.13, centerX, 8.3, 0.07, { cast: false });
  }

  if (upper) {
    addBox(parent, materials.redDeep, windowWidth + 0.7, 0.19, 0.18, centerX, 17.72, 0.08, { cast: false });
    addBox(parent, materials.redDeep, windowWidth + 0.7, 0.15, 0.18, centerX, 20.7, 0.08, { cast: false });
  }
}

function createLowerFacades(group, materials) {
  const sides = ['front', 'back', 'right', 'left'];
  for (const side of sides) {
    const isEnd = side === 'right' || side === 'left';
    const widths = isEnd ? SIDE_BAY_WIDTHS : BAY_WIDTHS;
    const boundaries = bayBoundaries(widths);
    const facade = makeLocalGroup(side, 0.03);
    group.add(facade);

    const doorBays = !isEnd ? new Set([3, 4, 5, 6, 7]) : new Set([]);
    for (let i = 0; i < widths.length; i += 1) {
      const center = (boundaries[i] + boundaries[i + 1]) / 2;
      if (doorBays.has(i)) {
        addDoorBay(facade, materials, center, widths[i]);
      } else {
        addWindowBay(facade, materials, center, widths[i]);
      }

      // Vertical shadow line between bays
      if (i < widths.length - 1) {
        addBox(facade, materials.redDeep, 0.1, 7.4, 0.08, boundaries[i + 1], 10.35, 0.025, {
          cast: false,
          receive: true,
        });
      }
    }

    // Painted lintel and a sliver of gold beneath the veranda beam.
    addBox(facade, materials.beam, boundaries[widths.length], 0.5, 0.32, 0, 13.95, 0.11, { cast: false });
    addBox(facade, materials.goldDark, boundaries[widths.length] - 0.2, 0.09, 0.22, 0, 13.69, 0.12, {
      cast: false,
    });
  }
}

function createUpperFacades(group, materials) {
  const sides = ['front', 'back', 'right', 'left'];
  for (const side of sides) {
    const isEnd = side === 'right' || side === 'left';
    const widths = isEnd ? [4.2, 4.2, 4.2, 4.2, 4.2] : UPPER_BAY_WIDTHS;
    const boundaries = bayBoundaries(widths);
    const facade = makeUpperLocalGroup(side, 0.03);
    group.add(facade);

    for (let i = 0; i < widths.length; i += 1) {
      const center = (boundaries[i] + boundaries[i + 1]) / 2;
      addWindowBay(facade, materials, center, widths[i], true);
    }

    addBox(facade, materials.beam, boundaries[widths.length], 0.52, 0.28, 0, 21.35, 0.08, { cast: false });
    addBox(facade, materials.goldDark, boundaries[widths.length] - 0.2, 0.08, 0.2, 0, 21.08, 0.09, {
      cast: false,
    });
    addBox(facade, materials.redDeep, boundaries[widths.length], 0.24, 0.3, 0, 17.16, 0.08, {
      cast: false,
    });
  }

  // Slender upper-storey columns
  const boundaries = bayBoundaries(UPPER_BAY_WIDTHS);
  const front = makeUpperLocalGroup('front', 0.25);
  group.add(front);
  for (const x of boundaries) {
    const column = new THREE.Mesh(new THREE.CylinderGeometry(0.145, 0.18, 4.35, 10), materials.redLacquer);
    column.position.set(x, 19.12, 0);
    column.castShadow = true;
    column.receiveShadow = true;
    front.add(column);
    addBox(front, materials.gold, 0.34, 0.1, 0.34, x, 17.0, 0, { cast: false });
    addBox(front, materials.gold, 0.34, 0.1, 0.34, x, 21.22, 0, { cast: false });
  }

  // Gilded imperial plaque, hung beneath the upper eave.
  const plaque = new THREE.Group();
  plaque.position.set(0, 20.25, UPPER_D / 2 + 0.34);
  plaque.rotation.x = -0.045;
  addPlane(plaque, materials.plaque, 9.1, 2.86, 0, 0, 0, { receive: false });
  addBox(plaque, materials.goldDark, 9.46, 0.15, 0.24, 0, 1.5, 0.02, { cast: false });
  addBox(plaque, materials.goldDark, 9.46, 0.15, 0.24, 0, -1.5, 0.02, { cast: false });
  addBox(plaque, materials.goldDark, 0.17, 3.16, 0.24, -4.65, 0, 0.02, { cast: false });
  addBox(plaque, materials.goldDark, 0.17, 3.16, 0.24, 4.65, 0, 0.02, { cast: false });
  const plaqueCap = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.65, 4), materials.gold);
  plaqueCap.position.set(0, 1.95, 0);
  plaqueCap.rotation.y = Math.PI / 4;
  plaqueCap.castShadow = false;
  plaque.add(plaqueCap);
  group.add(plaque);
}

function collectBalustradeMatrices(tiers) {
  const posts = [];
  const caps = [];
  const rails = [];
  const panels = [];
  const up = new THREE.Vector3(0, 1, 0);
  const quat = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  const matrix = new THREE.Matrix4();

  function addSegment(ax, az, bx, bz, y) {
    const length = Math.hypot(bx - ax, bz - az);
    if (length < 0.2) return;
    const dirX = (bx - ax) / length;
    const dirZ = (bz - az) / length;
    const angle = Math.atan2(-dirZ, dirX);
    quat.setFromAxisAngle(up, angle);
    const count = Math.max(1, Math.ceil(length / 2.25));
    for (let i = 0; i <= count; i += 1) {
      const t = i / count;
      const x = ax + (bx - ax) * t;
      const z = az + (bz - az) * t;
      matrix.compose(new THREE.Vector3(x, y + 0.58, z), quat, new THREE.Vector3(1, 1, 1));
      posts.push(matrix.clone());
      matrix.compose(new THREE.Vector3(x, y + 1.18, z), quat, new THREE.Vector3(1, 1, 1));
      caps.push(matrix.clone());
    }
    for (let i = 0; i < count; i += 1) {
      const t = (i + 0.5) / count;
      const x = ax + (bx - ax) * t;
      const z = az + (bz - az) * t;
      const segment = length / count;
      scale.set(segment - 0.36, 0.16, 0.22);
      matrix.compose(new THREE.Vector3(x, y + 0.91, z), quat, scale);
      rails.push(matrix.clone());
      matrix.compose(new THREE.Vector3(x, y + 0.3, z), quat, scale);
      rails.push(matrix.clone());
      scale.set(segment - 0.46, 0.58, 0.15);
      matrix.compose(new THREE.Vector3(x, y + 0.6, z), quat, scale);
      panels.push(matrix.clone());
    }
  }

  for (const tier of tiers) {
    const w = tier.width;
    const d = tier.depth;
    const y = tier.top;
    addSegment(-w / 2, -d / 2, w / 2, -d / 2, y);
    addSegment(-w / 2, -d / 2, -w / 2, d / 2, y);
    addSegment(w / 2, -d / 2, w / 2, d / 2, y);
    addSegment(-w / 2, d / 2, -tier.gap / 2, d / 2, y);
    addSegment(tier.gap / 2, d / 2, w / 2, d / 2, y);
  }

  return { posts, caps, rails, panels };
}

function addBalustrades(group, materials, tiers) {
  const data = collectBalustradeMatrices(tiers);
  const postGeometry = new THREE.BoxGeometry(0.29, 1.16, 0.29);
  const railGeometry = new THREE.BoxGeometry(1, 1, 1);
  const postMesh = new THREE.InstancedMesh(postGeometry, materials.marblePlain, data.posts.length);
  data.posts.forEach((m, i) => postMesh.setMatrixAt(i, m));
  postMesh.castShadow = true;
  postMesh.receiveShadow = true;
  postMesh.instanceMatrix.needsUpdate = true;

  const capGeometry = new THREE.LatheGeometry([
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.22, 0.02),
    new THREE.Vector2(0.22, 0.1),
    new THREE.Vector2(0.17, 0.16),
    new THREE.Vector2(0.13, 0.25),
    new THREE.Vector2(0.16, 0.34),
    new THREE.Vector2(0.1, 0.43),
    new THREE.Vector2(0.02, 0.55),
    new THREE.Vector2(0.0, 0.56),
  ], 10);
  const capMesh = new THREE.InstancedMesh(capGeometry, materials.marblePlain, data.caps.length);
  data.caps.forEach((m, i) => capMesh.setMatrixAt(i, m));
  capMesh.castShadow = true;
  capMesh.receiveShadow = true;
  capMesh.instanceMatrix.needsUpdate = true;

  const railMesh = new THREE.InstancedMesh(railGeometry, materials.marblePlain, data.rails.length);
  data.rails.forEach((m, i) => railMesh.setMatrixAt(i, m));
  railMesh.castShadow = true;
  railMesh.receiveShadow = true;
  railMesh.instanceMatrix.needsUpdate = true;

  const panelMesh = new THREE.InstancedMesh(railGeometry, materials.marble, data.panels.length);
  data.panels.forEach((m, i) => panelMesh.setMatrixAt(i, m));
  panelMesh.castShadow = true;
  panelMesh.receiveShadow = true;
  panelMesh.instanceMatrix.needsUpdate = true;

  group.add(postMesh, capMesh, railMesh, panelMesh);
}

function createTerrace(group, materials) {
  let accumulatedHeight = 0;
  const tiers = TIERS.map((tier) => {
    accumulatedHeight += tier.height;
    return { ...tier, base: accumulatedHeight - tier.height, top: accumulatedHeight };
  });

  for (const tier of tiers) {
    // Core block
    addBox(
      group,
      materials.marble,
      tier.width - 1.4,
      tier.height - 0.5,
      tier.depth - 1.4,
      0,
      tier.base + tier.height / 2 + 0.1,
      0,
    );

    // Heavy lower molding
    addBox(group, materials.marblePlain, tier.width, 0.42, tier.depth, 0, tier.base + 0.21, 0);
    // Wide carved band at the waist
    addBox(group, materials.marble, tier.width - 0.22, 0.28, tier.depth - 0.22, 0, tier.base + tier.height * 0.5, 0);
    addBox(group, materials.marblePlain, tier.width + 0.18, 0.15, tier.depth + 0.18, 0, tier.base + tier.height * 0.36, 0);
    addBox(group, materials.marblePlain, tier.width + 0.18, 0.15, tier.depth + 0.18, 0, tier.base + tier.height * 0.64, 0);
    // Dark recess line reads as an old construction joint
    addBox(group, materials.stoneDark, tier.width + 0.02, 0.05, tier.depth + 0.02, 0, tier.base + tier.height * 0.47, 0, {
      cast: false,
    });
    // Cornice and top slab
    addBox(group, materials.marblePlain, tier.width + 0.3, 0.24, tier.depth + 0.3, 0, tier.top - 0.12, 0);
    addBox(group, materials.marble, tier.width - 0.85, 0.12, tier.depth - 0.85, 0, tier.top + 0.055, 0, {
      cast: false,
    });
  }

  addBalustrades(group, materials, tiers);
  return tiers;
}

function addStairFlight(group, materials, flight) {
  const run = (flight.zOut - flight.zTop) / flight.steps;
  const rise = (flight.yTop - flight.yBottom) / flight.steps;
  for (let i = 0; i < flight.steps; i += 1) {
    const top = flight.yTop - (i + 1) * rise;
    const height = top - flight.yBottom;
    if (height <= 0.02) continue;
    addBox(
      group,
      materials.marble,
      flight.width,
      height,
      run + 0.02,
      0,
      flight.yBottom + height / 2,
      flight.zTop + run * (i + 0.5),
    );
    addBox(
      group,
      materials.stoneDark,
      flight.width - 0.03,
      0.035,
      0.08,
      0,
      top + 0.012,
      flight.zTop + run * (i + 0.97),
      { cast: false },
    );
  }

  const slope = Math.atan2(flight.yTop - flight.yBottom, flight.zOut - flight.zTop);
  const slopeLength = Math.hypot(flight.zOut - flight.zTop, flight.yTop - flight.yBottom) + 0.2;
  const zMid = (flight.zTop + flight.zOut) / 2;
  const yMid = (flight.yTop + flight.yBottom) / 2;

  // Low marble cheek walls that follow the stair
  for (const direction of [-1, 1]) {
    const cheek = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.7, slopeLength), materials.marblePlain);
    cheek.position.set(direction * (flight.width / 2 + 0.32), yMid + 0.35, zMid);
    cheek.rotation.x = slope;
    cheek.castShadow = true;
    cheek.receiveShadow = true;
    group.add(cheek);

    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.16, slopeLength + 0.12), materials.marblePlain);
    cap.position.set(direction * (flight.width / 2 + 0.32), yMid + 0.77, zMid);
    cap.rotation.x = slope;
    cap.castShadow = true;
    cap.receiveShadow = true;
    group.add(cap);
  }

  // Imperial ramp carved with clouds and dragons
  const ramp = new THREE.Mesh(
    new THREE.BoxGeometry(Math.min(4.1, flight.width * 0.25), 0.2, slopeLength + 0.2),
    materials.marbleCarved,
  );
  ramp.position.set(0, yMid + 0.17, zMid);
  ramp.rotation.x = slope;
  ramp.castShadow = true;
  ramp.receiveShadow = true;
  group.add(ramp);

  for (const direction of [-1, 1]) {
    const curb = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.3, slopeLength + 0.15),
      materials.marblePlain,
    );
    curb.position.set(direction * (Math.min(4.1, flight.width * 0.25) / 2 + 0.11), yMid + 0.29, zMid);
    curb.rotation.x = slope;
    curb.castShadow = true;
    curb.receiveShadow = true;
    group.add(curb);
  }

  // Newel posts punctuate the head of each flight
  for (const direction of [-1, 1]) {
    addBox(group, materials.marblePlain, 0.55, 1.5, 0.55, direction * (flight.width / 2 + 0.6), flight.yTop + 0.3, flight.zTop + 0.25);
    const newel = new THREE.Mesh(new THREE.SphereGeometry(0.34, 10, 8), materials.marblePlain);
    newel.position.set(direction * (flight.width / 2 + 0.6), flight.yTop + 1.15, flight.zTop + 0.25);
    newel.castShadow = true;
    newel.receiveShadow = true;
    group.add(newel);
  }
}

function addStairs(group, materials) {
  for (const flight of FLIGHTS) {
    addStairFlight(group, materials, flight);
  }

  // Marble posts crown the sloped cheek walls, echoing the terrace balustrade.
  const posts = [];
  const caps = [];
  const matrix = new THREE.Matrix4();
  const quat = new THREE.Quaternion();
  const unit = new THREE.Vector3(1, 1, 1);
  for (const flight of FLIGHTS) {
    const run = (flight.zOut - flight.zTop) / flight.steps;
    const rise = (flight.yTop - flight.yBottom) / flight.steps;
    for (const direction of [-1, 1]) {
      for (const fraction of [0.18, 0.5, 0.82]) {
        const z = flight.zTop + (flight.zOut - flight.zTop) * fraction;
        const lineY = flight.yTop - rise * ((z - flight.zTop) / run);
        const x = direction * (flight.width / 2 + 0.32);
        matrix.compose(new THREE.Vector3(x, lineY + 1.26, z), quat, unit);
        posts.push(matrix.clone());
        matrix.compose(new THREE.Vector3(x, lineY + 1.79, z), quat, unit);
        caps.push(matrix.clone());
      }
    }
  }

  const postMesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.26, 0.78, 0.26),
    materials.marblePlain,
    posts.length,
  );
  posts.forEach((m, i) => postMesh.setMatrixAt(i, m));
  postMesh.castShadow = true;
  postMesh.receiveShadow = true;
  postMesh.instanceMatrix.needsUpdate = true;
  group.add(postMesh);

  const capGeometry = new THREE.LatheGeometry([
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.2, 0.02),
    new THREE.Vector2(0.2, 0.08),
    new THREE.Vector2(0.14, 0.16),
    new THREE.Vector2(0.19, 0.26),
    new THREE.Vector2(0.08, 0.38),
    new THREE.Vector2(0, 0.4),
  ], 8);
  const capMesh = new THREE.InstancedMesh(capGeometry, materials.marblePlain, caps.length);
  caps.forEach((m, i) => capMesh.setMatrixAt(i, m));
  capMesh.castShadow = true;
  capMesh.receiveShadow = true;
  capMesh.instanceMatrix.needsUpdate = true;
  group.add(capMesh);
}

function addCourtyard(group, materials) {
  const groundGeometry = new THREE.PlaneGeometry(460, 460);
  const ground = new THREE.Mesh(groundGeometry, materials.paving);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.02;
  ground.receiveShadow = true;
  group.add(ground);

  // Imperial way
  const pathGeometry = new THREE.PlaneGeometry(16, 78);
  const uv = pathGeometry.attributes.uv;
  for (let i = 0; i < uv.count; i += 1) {
    uv.setXY(i, uv.getX(i) * 3.2, uv.getY(i) * 16);
  }
  const path = new THREE.Mesh(pathGeometry, materials.marblePlain);
  path.rotation.x = -Math.PI / 2;
  path.position.set(0, 0.025, 85);
  path.receiveShadow = true;
  group.add(path);

  const centerGeometry = new THREE.PlaneGeometry(4.2, 78);
  const centerUv = centerGeometry.attributes.uv;
  for (let i = 0; i < centerUv.count; i += 1) {
    centerUv.setXY(i, centerUv.getX(i) * 1, centerUv.getY(i) * 10);
  }
  const centerPath = new THREE.Mesh(centerGeometry, materials.marbleCarved);
  centerPath.rotation.x = -Math.PI / 2;
  centerPath.position.set(0, 0.04, 85);
  centerPath.receiveShadow = true;
  group.add(centerPath);

  for (const direction of [-1, 1]) {
    addBox(group, materials.stoneDark, 0.5, 0.06, 78, direction * 8.2, 0.03, 85, {
      cast: false,
    });
    addBox(group, materials.stoneDark, 0.3, 0.05, 78, direction * 2.2, 0.045, 85, {
      cast: false,
    });
  }

  // Stone course markers across the imperial way
  for (let z = 48; z < 124; z += 7.5) {
    addBox(group, materials.stoneDark, 16, 0.045, 0.08, 0, 0.045, z, { cast: false });
  }

  // Broad flanking apron, barely darker than the court
  for (const direction of [-1, 1]) {
    addBox(group, materials.darkPaving, 34, 0.03, 78, direction * 35, 0.012, 84, {
      cast: false,
    });
  }
}

function makePerimeterWall(materials, length, position, rotationY) {
  const group = new THREE.Group();
  group.position.copy(position);
  group.rotation.y = rotationY;

  addBox(group, materials.stoneDark, length, 0.5, 2.2, 0, 0.25, 0, { cast: false });
  addBox(group, materials.plaster, length, 6.4, 1.4, 0, 3.7, 0, { cast: false });
  addBox(group, materials.stoneDark, length, 0.16, 1.55, 0, 6.95, 0, { cast: false });

  const roofW = 2.9;
  const pitch = 0.33;
  for (const direction of [-1, 1]) {
    const slope = new THREE.Mesh(new THREE.BoxGeometry(length, 0.16, roofW), materials.roof);
    slope.position.set(0, 7.35, direction * 0.63);
    slope.rotation.x = direction * pitch;
    slope.castShadow = false;
    slope.receiveShadow = true;
    group.add(slope);
  }
  const ridge = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, length, 8), materials.ridge);
  ridge.rotation.z = Math.PI / 2;
  ridge.position.set(0, 7.7, 0);
  ridge.castShadow = false;
  group.add(ridge);

  // repeated vertical shadow reveals along the wall
  for (let x = -length / 2 + 7; x < length / 2; x += 14) {
    addBox(group, materials.redDeep, 0.12, 5.8, 0.04, x, 3.8, 0.72, { cast: false });
  }
  return group;
}

function addEnclosureWalls(group, materials) {
  group.add(makePerimeterWall(materials, 230, new THREE.Vector3(0, 0, -92), 0));
  group.add(makePerimeterWall(materials, 230, new THREE.Vector3(-115, 0, 15), Math.PI / 2));
  group.add(makePerimeterWall(materials, 230, new THREE.Vector3(115, 0, 15), Math.PI / 2));
  group.add(makePerimeterWall(materials, 230, new THREE.Vector3(0, 0, 126), 0));
}

function addColumns(group, materials) {
  const positions = [];
  const boundaries = bayBoundaries(BAY_WIDTHS);
  const zFront = 16.5;
  const zBack = -16.5;
  for (const x of boundaries) {
    positions.push([x, zFront]);
    positions.push([x, zBack]);
  }
  for (const x of [-26.75, 26.75]) {
    for (const z of [-12.6, -6.3, 0, 6.3, 12.6]) {
      positions.push([x, z]);
    }
  }
  for (const x of [-26.75, 26.75]) {
    positions.push([x, zFront]);
    positions.push([x, zBack]);
  }

  const shaftGeometry = new THREE.CylinderGeometry(0.48, 0.55, 8.9, 14, 1, false);
  const shafts = new THREE.InstancedMesh(shaftGeometry, materials.redLacquer, positions.length);
  const baseGeometry = new THREE.CylinderGeometry(0.78, 0.9, 0.3, 16);
  const bases = new THREE.InstancedMesh(baseGeometry, materials.marblePlain, positions.length);
  const plinthGeometry = new THREE.CylinderGeometry(0.96, 1.02, 0.16, 16);
  const plinths = new THREE.InstancedMesh(plinthGeometry, materials.marblePlain, positions.length);
  const collarGeometry = new THREE.TorusGeometry(0.5, 0.065, 6, 16);
  collarGeometry.rotateX(Math.PI / 2);
  const collars = new THREE.InstancedMesh(collarGeometry, materials.goldDark, positions.length);

  const matrix = new THREE.Matrix4();
  const quat = new THREE.Quaternion();
  const unit = new THREE.Vector3(1, 1, 1);
  positions.forEach(([x, z], i) => {
    matrix.compose(new THREE.Vector3(x, FLOOR_Y + 4.45, z), quat, unit);
    shafts.setMatrixAt(i, matrix);
    matrix.compose(new THREE.Vector3(x, FLOOR_Y + 0.15, z), quat, unit);
    bases.setMatrixAt(i, matrix);
    matrix.compose(new THREE.Vector3(x, FLOOR_Y - 0.01, z), quat, unit);
    plinths.setMatrixAt(i, matrix);
    matrix.compose(new THREE.Vector3(x, FLOOR_Y + 8.58, z), quat, unit);
    collars.setMatrixAt(i, matrix);
  });
  for (const mesh of [shafts, bases, plinths, collars]) {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.instanceMatrix.needsUpdate = true;
    group.add(mesh);
  }

  // Scrolling brackets at the head of each column
  const capitalGeometry = new THREE.BoxGeometry(1.35, 0.22, 1.0);
  const capitals = new THREE.InstancedMesh(capitalGeometry, materials.teal, positions.length);
  positions.forEach(([x, z], i) => {
    matrix.compose(new THREE.Vector3(x, FLOOR_Y + 8.82, z), quat, unit);
    capitals.setMatrixAt(i, matrix);
  });
  capitals.castShadow = true;
  capitals.receiveShadow = true;
  capitals.instanceMatrix.needsUpdate = true;
  group.add(capitals);
}

function addBracketBand(group, materials, { width, depth, y, spacing = 1.65, scale = 1 }) {
  const tealMatrices = [];
  const goldMatrices = [];
  const quat = new THREE.Quaternion();
  const matrix = new THREE.Matrix4();
  const up = new THREE.Vector3(0, 1, 0);

  function placeAt(x, z, yaw) {
    quat.setFromAxisAngle(up, yaw);
    const tangent = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
    const outward = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
    const origin = new THREE.Vector3(x, y, z);
    const addPart = (target, sx, sy, sz, ox, oy, oz) => {
      const position = origin.clone()
        .addScaledVector(tangent, ox)
        .addScaledVector(outward, oz)
        .add(new THREE.Vector3(0, oy, 0));
      matrix.compose(position, quat, new THREE.Vector3(sx * scale, sy * scale, sz * scale));
      target.push(matrix.clone());
    };
    addPart(tealMatrices, 0.62, 0.22, 0.52, 0, 0.08, 0.12);
    addPart(tealMatrices, 1.35, 0.15, 0.22, 0, 0.24, 0.32);
    addPart(tealMatrices, 0.2, 0.15, 0.9, 0, 0.4, 0.46);
    addPart(goldMatrices, 0.26, 0.2, 0.22, 0, 0.1, 0.57);
    addPart(goldMatrices, 1.5, 0.07, 0.1, 0, 0.33, 0.4);
  }

  const sides = [
    { from: [-width / 2, depth / 2], to: [width / 2, depth / 2], yaw: 0 },
    { from: [width / 2, -depth / 2], to: [width / 2, depth / 2], yaw: Math.PI / 2 },
    { from: [width / 2, -depth / 2], to: [-width / 2, -depth / 2], yaw: Math.PI },
    { from: [-width / 2, depth / 2], to: [-width / 2, -depth / 2], yaw: -Math.PI / 2 },
  ];

  for (const side of sides) {
    const length = Math.hypot(side.to[0] - side.from[0], side.to[1] - side.from[1]);
    const count = Math.max(2, Math.floor(length / spacing));
    for (let i = 0; i <= count; i += 1) {
      const t = i / count;
      const x = side.from[0] + (side.to[0] - side.from[0]) * t;
      const z = side.from[1] + (side.to[1] - side.from[1]) * t;
      placeAt(x, z, side.yaw);
    }
  }

  const unit = new THREE.BoxGeometry(1, 1, 1);
  const tealMesh = new THREE.InstancedMesh(unit, materials.teal, tealMatrices.length);
  tealMatrices.forEach((m, i) => tealMesh.setMatrixAt(i, m));
  tealMesh.castShadow = true;
  tealMesh.receiveShadow = true;
  tealMesh.instanceMatrix.needsUpdate = true;
  group.add(tealMesh);

  const goldMesh = new THREE.InstancedMesh(unit, materials.goldDark, goldMatrices.length);
  goldMatrices.forEach((m, i) => goldMesh.setMatrixAt(i, m));
  goldMesh.castShadow = true;
  goldMesh.receiveShadow = true;
  goldMesh.instanceMatrix.needsUpdate = true;
  group.add(goldMesh);
}

function addBeamRings(group, materials) {
  // Lower storey bracket band
  addBox(group, materials.beam, 55.8, 0.88, 0.7, 0, 14.7, 16.5, { cast: false });
  addBox(group, materials.beam, 55.8, 0.88, 0.7, 0, 14.7, -16.5, { cast: false });
  addBox(group, materials.beam, 0.7, 0.88, 34.0, 26.75, 14.7, 0, { cast: false });
  addBox(group, materials.beam, 0.7, 0.88, 34.0, -26.75, 14.7, 0, { cast: false });
  addBox(group, materials.goldDark, 56.2, 0.07, 0.74, 0, 15.18, 16.5, { cast: false });
  addBox(group, materials.goldDark, 56.2, 0.07, 0.74, 0, 15.18, -16.5, { cast: false });
  addBox(group, materials.goldDark, 0.74, 0.07, 34.4, 26.75, 15.18, 0, { cast: false });
  addBox(group, materials.goldDark, 0.74, 0.07, 34.4, -26.75, 15.18, 0, { cast: false });
  addBracketBand(group, materials, { width: 54, depth: 33, y: 15.1, spacing: 1.7 });

  // Upper storey band
  addBox(group, materials.beam, 42.2, 0.82, 0.62, 0, 21.43, 11.0, { cast: false });
  addBox(group, materials.beam, 42.2, 0.82, 0.62, 0, 21.43, -11.0, { cast: false });
  addBox(group, materials.beam, 0.62, 0.82, 22.2, 20.8, 21.43, 0, { cast: false });
  addBox(group, materials.beam, 0.62, 0.82, 22.2, -20.8, 21.43, 0, { cast: false });
  addBracketBand(group, materials, { width: 40.8, depth: 20.6, y: 21.62, spacing: 1.35, scale: 0.74 });
}

function addUpperStorey(group, materials) {
  addBox(group, materials.plaster, UPPER_W, 6.0, UPPER_D, 0, 19.6, 0);
  addBox(group, materials.stoneDark, UPPER_W + 0.5, 0.28, UPPER_D + 0.5, 0, 16.64, 0, { cast: false });
  addBox(group, materials.marblePlain, UPPER_W + 0.7, 0.24, UPPER_D + 0.7, 0, 16.8, 0, { cast: false });
  addBox(group, materials.beam, UPPER_W + 2.0, 0.54, UPPER_D + 2.0, 0, 21.63, 0, { cast: false });
  createUpperFacades(group, materials);
}

function addLowerBody(group, materials) {
  // Main hall wall
  addBox(group, materials.plaster, BODY_W, 8.35, BODY_D, 0, FLOOR_Y + 4.175, 0);
  // Plinth and cornice
  addBox(group, materials.stoneDark, BODY_W + 0.55, 0.45, BODY_D + 0.55, 0, FLOOR_Y + 0.22, 0);
  addBox(group, materials.marblePlain, BODY_W + 0.75, 0.22, BODY_D + 0.75, 0, FLOOR_Y + 0.46, 0, { cast: false });
  addBox(group, materials.beam, BODY_W + 1.4, 0.45, BODY_D + 1.4, 0, 14.52, 0, { cast: false });

  // Veranda floor
  addBox(group, materials.marble, VERANDA_W, 0.28, VERANDA_D, 0, FLOOR_Y - 0.14, 0);
  addBox(group, materials.stoneDark, VERANDA_W + 0.55, 0.16, VERANDA_D + 0.55, 0, FLOOR_Y - 0.32, 0, {
    cast: false,
  });
  addBox(group, materials.marblePlain, VERANDA_W - 1.1, 0.06, VERANDA_D - 1.1, 0, FLOOR_Y + 0.03, 0, {
    cast: false,
  });

  createLowerFacades(group, materials);
  addColumns(group, materials);
}

let bronzeShared = null;

function getBronzeGeometry() {
  if (bronzeShared) return bronzeShared;
  bronzeShared = {
    body: new THREE.SphereGeometry(1, 16, 12),
    sphereSmall: new THREE.SphereGeometry(1, 10, 8),
    cylinder: new THREE.CylinderGeometry(1, 1, 1, 12),
    cone: new THREE.ConeGeometry(1, 1, 12),
    torus: new THREE.TorusGeometry(1, 0.08, 6, 16),
  };
  return bronzeShared;
}

function addCrane(group, materials, x, z, rotationY) {
  const container = new THREE.Group();
  container.position.set(x, FLOOR_Y, z);
  container.rotation.y = rotationY;

  const pedestal = addBox(container, materials.marblePlain, 1.9, 0.35, 1.5, 0, 0.175, 0);
  pedestal.receiveShadow = true;

  const bronze = materials.bronze;
  const highlight = materials.bronzeHighlight;
  const legs = [
    [-0.24, 0.05, 0.28],
    [0.25, -0.02, 0.2],
  ];
  for (const [lx, lz, foot] of legs) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.075, 1.4, 6), bronze);
    leg.position.set(lx, 1.0, lz);
    leg.rotation.z = lx * 0.1;
    leg.castShadow = true;
    container.add(leg);
    const footMesh = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.055, 0.42), bronze);
    footMesh.position.set(lx, 0.36, lz + foot);
    footMesh.castShadow = true;
    container.add(footMesh);
  }

  const body = new THREE.Mesh(getBronzeGeometry().body, bronze);
  body.scale.set(0.78, 0.48, 0.48);
  body.position.set(0, 1.75, -0.04);
  body.rotation.z = -0.08;
  body.castShadow = true;
  body.receiveShadow = true;
  container.add(body);

  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.36, 1.2, 7), bronze);
  tail.rotation.x = -1.9;
  tail.position.set(0, 1.73, -0.78);
  tail.castShadow = true;
  container.add(tail);

  const neckCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.08, 1.92, 0.28),
    new THREE.Vector3(0.05, 2.4, 0.46),
    new THREE.Vector3(-0.06, 2.78, 0.58),
    new THREE.Vector3(-0.11, 2.92, 0.74),
  ]);
  const neck = new THREE.Mesh(new THREE.TubeGeometry(neckCurve, 18, 0.1, 7, false), bronze);
  neck.castShadow = true;
  container.add(neck);

  const head = new THREE.Mesh(getBronzeGeometry().sphereSmall, bronze);
  head.scale.setScalar(0.18);
  head.position.set(-0.11, 2.95, 0.79);
  head.castShadow = true;
  container.add(head);

  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.42, 6), bronze);
  beak.rotation.x = Math.PI / 2;
  beak.position.set(-0.11, 2.93, 1.06);
  beak.castShadow = true;
  container.add(beak);

  for (const direction of [-1, 1]) {
    const wing = new THREE.Mesh(getBronzeGeometry().body, bronze);
    wing.scale.set(0.36, 0.19, 0.58);
    wing.position.set(direction * 0.35, 1.92, -0.18);
    wing.rotation.z = direction * 0.36;
    wing.rotation.x = -0.12;
    wing.castShadow = true;
    container.add(wing);

    const crest = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.24, 4), highlight);
    crest.position.set(-0.11 + direction * 0.05, 3.12, 0.78);
    crest.rotation.z = direction * 0.15;
    container.add(crest);
  }

  // A tall, slender silhouette reads as a crane from a distance.
  const feather = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.8, 6), bronze);
  feather.position.set(0, 1.75, -0.65);
  feather.rotation.x = -1.0;
  feather.castShadow = true;
  container.add(feather);

  group.add(container);
}

function addDing(group, materials, x, y, z, scale = 1, rotationY = 0) {
  const container = new THREE.Group();
  container.position.set(x, y, z);
  container.rotation.y = rotationY;
  container.scale.setScalar(scale);

  const bronze = materials.bronze;
  const highlight = materials.bronzeHighlight;

  const bodyProfile = [
    new THREE.Vector2(0.35, 0.0),
    new THREE.Vector2(1.05, 0.13),
    new THREE.Vector2(1.35, 0.6),
    new THREE.Vector2(1.42, 1.05),
    new THREE.Vector2(1.28, 1.46),
    new THREE.Vector2(0.95, 1.62),
  ];
  const body = new THREE.Mesh(new THREE.LatheGeometry(bodyProfile, 24), bronze);
  body.position.y = 1.02;
  body.castShadow = true;
  body.receiveShadow = true;
  container.add(body);

  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.98, 0.09, 8, 28), highlight);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 2.63;
  rim.castShadow = true;
  container.add(rim);

  const lid = new THREE.Mesh(new THREE.ConeGeometry(1.12, 0.45, 16), bronze);
  lid.position.y = 2.88;
  lid.castShadow = true;
  container.add(lid);
  const lidTier = new THREE.Mesh(new THREE.CylinderGeometry(0.74, 0.93, 0.22, 20), bronze);
  lidTier.position.y = 2.63;
  lidTier.castShadow = true;
  container.add(lidTier);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), highlight);
  knob.position.y = 3.2;
  knob.castShadow = true;
  container.add(knob);

  for (let i = 0; i < 3; i += 1) {
    const angle = (i / 3) * Math.PI * 2 + Math.PI / 6;
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.19, 1.1, 8), bronze);
    leg.position.set(Math.cos(angle) * 0.9, 0.56, Math.sin(angle) * 0.9);
    leg.castShadow = true;
    container.add(leg);
  }

  for (const direction of [-1, 1]) {
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.37, 0.08, 6, 14, Math.PI * 1.1), highlight);
    handle.position.set(direction * 1.32, 2.0, 0);
    handle.rotation.y = direction * Math.PI / 2;
    handle.rotation.z = 0.35;
    handle.castShadow = true;
    container.add(handle);
  }

  group.add(container);
}

function addVat(group, materials, x, z, scale = 1) {
  const container = new THREE.Group();
  container.position.set(x, 0, z);
  container.scale.setScalar(scale);

  addBox(container, materials.marblePlain, 3.2, 0.32, 3.2, 0, 0.16, 0);

  const bodyProfile = [
    new THREE.Vector2(0.25, 0),
    new THREE.Vector2(1.15, 0.14),
    new THREE.Vector2(1.48, 0.68),
    new THREE.Vector2(1.55, 1.7),
    new THREE.Vector2(1.38, 2.12),
  ];
  const body = new THREE.Mesh(new THREE.LatheGeometry(bodyProfile, 26), materials.bronze);
  body.position.y = 0.58;
  body.castShadow = true;
  body.receiveShadow = true;
  container.add(body);

  for (const y of [1.2, 1.95, 2.58]) {
    const band = new THREE.Mesh(new THREE.TorusGeometry(1.52, 0.07, 6, 28), materials.bronzeHighlight);
    band.rotation.x = Math.PI / 2;
    band.position.y = y;
    band.castShadow = true;
    container.add(band);
  }

  for (const direction of [-1, 1]) {
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.1, 7, 16), materials.bronzeHighlight);
    handle.position.set(direction * 1.55, 2.05, 0);
    handle.rotation.y = Math.PI / 2;
    handle.castShadow = true;
    container.add(handle);
  }

  for (let i = 0; i < 3; i += 1) {
    const angle = (i / 3) * Math.PI * 2;
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.23, 0.72, 8), materials.bronze);
    leg.position.set(Math.cos(angle) * 0.82, 0.36, Math.sin(angle) * 0.82);
    leg.castShadow = true;
    container.add(leg);
  }

  group.add(container);
}

function addSundial(group, materials) {
  const container = new THREE.Group();
  container.position.set(-15.5, FLOOR_Y, 23.2);
  const base = addBox(container, materials.marblePlain, 1.5, 0.24, 1.5, 0, 0.12, 0);
  base.castShadow = true;
  addBox(container, materials.marblePlain, 0.8, 1.8, 0.8, 0, 1.02, 0);

  const dial = new THREE.Group();
  dial.position.set(0, 2.0, 0);
  dial.rotation.x = 0.62;
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 0.15, 32), materials.bronze);
  disc.material = materials.bronze;
  disc.castShadow = true;
  disc.receiveShadow = true;
  dial.add(disc);

  const face = new THREE.Mesh(new THREE.CircleGeometry(0.96, 32), materials.bronzeHighlight);
  face.rotation.x = -Math.PI / 2;
  face.position.y = 0.08;
  dial.add(face);

  const gnomonShape = new THREE.Shape();
  gnomonShape.moveTo(-0.1, -0.55);
  gnomonShape.lineTo(-0.1, 0.8);
  gnomonShape.lineTo(0.32, -0.55);
  gnomonShape.closePath();
  const gnomon = new THREE.Mesh(
    new THREE.ExtrudeGeometry(gnomonShape, { depth: 0.06, bevelEnabled: false }),
    materials.bronze,
  );
  gnomon.rotation.x = -Math.PI / 2;
  gnomon.position.set(0, 0.16, 0);
  gnomon.castShadow = true;
  dial.add(gnomon);
  container.add(dial);
  group.add(container);
}

function addJialiang(group, materials) {
  const container = new THREE.Group();
  container.position.set(15.5, FLOOR_Y, 23.2);
  addBox(container, materials.marblePlain, 1.6, 0.35, 1.6, 0, 0.175, 0);
  addBox(container, materials.marblePlain, 1.05, 1.5, 1.05, 0, 0.95, 0);
  addBox(container, materials.bronze, 0.98, 0.74, 0.98, 0, 1.92, 0);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(0.85, 0.6, 4), materials.bronze);
  roof.position.set(0, 2.63, 0);
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  container.add(roof);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), materials.bronzeHighlight);
  knob.position.y = 3.0;
  knob.castShadow = true;
  container.add(knob);
  group.add(container);
}

function addBronzeOrnaments(group, materials) {
  addCrane(group, materials, -28.5, 22.0, 0.22);
  addCrane(group, materials, 28.5, 22.0, -0.22);
  addSundial(group, materials);
  addJialiang(group, materials);
  addDing(group, materials, -22, 0, 56, 1.25, 0.2);
  addDing(group, materials, 22, 0, 56, 1.25, -0.2);
  addVat(group, materials, -43, 37, 1.1);
  addVat(group, materials, 43, 37, 1.1);
}

export function createTaiheHall(materials) {
  const root = new THREE.Group();
  root.name = 'TaiheHall';

  const terrace = new THREE.Group();
  terrace.name = 'Three-tier terrace';
  createTerrace(terrace, materials);
  addStairs(terrace, materials);
  root.add(terrace);

  const hall = new THREE.Group();
  hall.name = 'Hall body';
  addLowerBody(hall, materials);
  addUpperStorey(hall, materials);
  addBeamRings(hall, materials);
  root.add(hall);

  const lowerRoof = buildSkirtRoof({
    innerWidth: 42.0,
    innerDepth: 23.0,
    innerY: 18.35,
    eaveWidth: 64.0,
    eaveDepth: 42.0,
    eaveY: 15.62,
    eaveLift: 1.15,
  }, materials);
  lowerRoof.name = 'Lower eave roof';
  root.add(lowerRoof);

  const upperRoof = buildMainRoof({
    eaveWidth: 59.0,
    eaveDepth: 37.0,
    eaveY: 22.0,
    ridgeLength: 32.0,
    ridgeY: 33.2,
    eaveLift: 1.4,
    rows: 72,
    cols: 22,
  }, materials);
  upperRoof.name = 'Upper hip roof';
  root.add(upperRoof);

  const court = new THREE.Group();
  court.name = 'Courtyard';
  addCourtyard(court, materials);
  addEnclosureWalls(court, materials);
  addBronzeOrnaments(court, materials);
  root.add(court);

  return root;
}
