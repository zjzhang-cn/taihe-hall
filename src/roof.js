import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

function makeSurfaceGeometry(descriptor, rows, cols, tileColumns, tileRows) {
  const positions = [];
  const uvs = [];
  const indices = [];
  const stride = cols + 1;

  for (let i = 0; i <= rows; i += 1) {
    for (let j = 0; j <= cols; j += 1) {
      const u = (i / rows) * 2 - 1;
      const v = j / cols;
      const point = descriptor.plan(u, v);
      positions.push(point.x, point.y, point.z);
      uvs.push(((u + 1) / 2) * tileColumns, (1 - v) * tileRows);
    }
  }

  for (let i = 0; i < rows; i += 1) {
    for (let j = 0; j < cols; j += 1) {
      const a = i * stride + j;
      const b = (i + 1) * stride + j;
      const c = i * stride + j + 1;
      const d = (i + 1) * stride + j + 1;
      indices.push(a, c, d, a, d, b);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Main hip roof: a long central ridge with four concave, up-turned faces.
 */
export function createMainRoofGeometry({
  eaveWidth,
  eaveDepth,
  eaveY,
  ridgeLength,
  ridgeY,
  eaveLift = 1.2,
  rows = 70,
  cols = 22,
}) {
  const heightAt = (v) => {
    const slope = 1 - Math.pow(1 - v, 1.62);
    return ridgeY - (ridgeY - eaveY) * slope;
  };
  const liftAt = (u, v) => {
    return Math.pow(v, 4.2) * eaveLift * (0.08 + 0.92 * Math.pow(Math.abs(u), 3.2));
  };
  const px = eaveWidth / 2;
  const pz = eaveDepth / 2;
  const r = ridgeLength / 2;

  const faces = [];
  for (const zSign of [1, -1]) {
    faces.push(makeSurfaceGeometry({
      plan: (u, v) => {
        const spread = r + (px - r) * v;
        return new THREE.Vector3(
          u * spread,
          heightAt(v) + liftAt(u, v),
          zSign * pz * v,
        );
      },
    }, rows, cols, 5.2, 5.5));
  }

  for (const xSign of [1, -1]) {
    faces.push(makeSurfaceGeometry({
      plan: (u, v) => {
        const spread = r + (px - r) * v;
        return new THREE.Vector3(
          xSign * spread,
          heightAt(v) + liftAt(u, v),
          u * pz * v,
        );
      },
    }, rows, cols, 4.2, 5.5));
  }

  const geometry = mergeGeometries(faces);
  faces.forEach((face) => face.dispose());

  // Four hip curves. Sampled from the ridge ends down to the eave corners.
  const hips = [];
  for (const zSign of [1, -1]) {
    for (const xSign of [1, -1]) {
      const pts = [];
      for (let i = 0; i <= 28; i += 1) {
        const v = i / 28;
        const spread = r + (px - r) * v;
        pts.push(new THREE.Vector3(
          xSign * spread,
          heightAt(v) + liftAt(xSign, v) + 0.08,
          zSign * pz * v,
        ));
      }
      const corner = pts[pts.length - 1].clone();
      const outward = new THREE.Vector3(xSign * 0.72, 0, zSign * 0.72).normalize();
      pts.push(corner.clone().addScaledVector(outward, 0.55).add(new THREE.Vector3(0, 0.25, 0)));
      pts.push(corner.clone().addScaledVector(outward, 1.1).add(new THREE.Vector3(0, 0.95, 0)));
      hips.push(new THREE.CatmullRomCurve3(pts, false, 'centripetal'));
    }
  }

  const eaveLoop = [];
  const edgeY = (t) => eaveY + eaveLift * (0.08 + 0.92 * Math.pow(Math.abs(t), 3.2));
  const addEaveEdge = (side, from, to, points = 28) => {
    for (let i = 0; i < points; i += 1) {
      const t = from + (to - from) * (i / points);
      let x;
      let z;
      if (side === 'front') {
        x = t * px;
        z = pz;
      } else if (side === 'right') {
        x = px;
        z = t * pz;
      } else if (side === 'back') {
        x = t * px;
        z = -pz;
      } else {
        x = -px;
        z = t * pz;
      }
      eaveLoop.push(new THREE.Vector3(x, edgeY(t), z));
    }
  };
  // Walk the eave perimeter without duplicated corners.
  addEaveEdge('front', -1, 1);
  addEaveEdge('right', 1, -1);
  addEaveEdge('back', 1, -1);
  addEaveEdge('left', -1, 1);

  return {
    geometry,
    hips,
    eaveLoop,
    eaveWidth,
    eaveDepth,
    eaveY,
    ridgeY,
    ridgeLength,
    eaveLift,
    eaveLiftAt: (t) => eaveY + eaveLift * (0.08 + 0.92 * Math.pow(Math.abs(t), 3.2)),
  };
}

/**
 * Skirt roof of the lower eave: a mitered roof ring around the upper storey.
 */
export function createSkirtRoofGeometry({
  innerWidth,
  innerDepth,
  innerY,
  eaveWidth,
  eaveDepth,
  eaveY,
  eaveLift = 0.9,
  rows = 38,
  cols = 16,
}) {
  const heightAt = (v) => {
    const slope = 1 - Math.pow(1 - v, 1.48);
    return innerY - (innerY - eaveY) * slope;
  };
  const liftAt = (u, v) => {
    return Math.pow(v, 4.3) * eaveLift * (0.06 + 0.94 * Math.pow(Math.abs(u), 3.0));
  };
  const iw = innerWidth / 2;
  const id = innerDepth / 2;
  const ow = eaveWidth / 2;
  const od = eaveDepth / 2;

  const faces = [];
  for (const zSign of [1, -1]) {
    faces.push(makeSurfaceGeometry({
      plan: (u, v) => {
        const halfWidth = iw + (ow - iw) * v;
        return new THREE.Vector3(
          u * halfWidth,
          heightAt(v) + liftAt(u, v),
          zSign * (id + (od - id) * v),
        );
      },
    }, rows, cols, 4.6, 4.0));
  }

  for (const xSign of [1, -1]) {
    faces.push(makeSurfaceGeometry({
      plan: (u, v) => {
        const halfDepth = id + (od - id) * v;
        return new THREE.Vector3(
          xSign * (iw + (ow - iw) * v),
          heightAt(v) + liftAt(u, v),
          u * halfDepth,
        );
      },
    }, rows, cols, 3.8, 4.0));
  }

  const geometry = mergeGeometries(faces);
  faces.forEach((face) => face.dispose());

  const hips = [];
  for (const zSign of [1, -1]) {
    for (const xSign of [1, -1]) {
      const pts = [];
      for (let i = 0; i <= 22; i += 1) {
        const v = i / 22;
        pts.push(new THREE.Vector3(
          xSign * (iw + (ow - iw) * v),
          heightAt(v) + liftAt(xSign, v) + 0.06,
          zSign * (id + (od - id) * v),
        ));
      }
      const corner = pts[pts.length - 1].clone();
      const outward = new THREE.Vector3(xSign * 0.7, 0, zSign * 0.7).normalize();
      pts.push(corner.clone().addScaledVector(outward, 0.7).add(new THREE.Vector3(0, 0.55, 0)));
      hips.push(new THREE.CatmullRomCurve3(pts, false, 'centripetal'));
    }
  }

  const eaveLoop = [];
  const yAt = (t) => eaveY + eaveLift * (0.06 + 0.94 * Math.pow(Math.abs(t), 3));
  const addEdge = (side, from, to, samples = 26) => {
    for (let i = 0; i < samples; i += 1) {
      const t = from + (to - from) * (i / samples);
      let x;
      let z;
      if (side === 'front') {
        x = t * ow;
        z = od;
      } else if (side === 'right') {
        x = ow;
        z = t * od;
      } else if (side === 'back') {
        x = t * ow;
        z = -od;
      } else {
        x = -ow;
        z = t * od;
      }
      eaveLoop.push(new THREE.Vector3(x, yAt(t), z));
    }
  };
  addEdge('front', -1, 1);
  addEdge('right', 1, -1);
  addEdge('back', 1, -1);
  addEdge('left', -1, 1);

  return {
    geometry,
    hips,
    eaveLoop,
    eaveWidth,
    eaveDepth,
    eaveY,
    eaveLift,
    ridgeY: innerY,
    eaveLiftAt: yAt,
  };
}

function makeFasciaGeometry(eaveLoop) {
  const points = eaveLoop.concat([eaveLoop[0]]);
  const positions = [];
  const uvs = [];
  const indices = [];
  const height = 0.62;
  const outward = 0.08;
  for (let i = 0; i < points.length; i += 1) {
    const p = points[i];
    const radial = new THREE.Vector2(p.x, p.z);
    if (radial.lengthSq() > 0.0001) radial.normalize();
    positions.push(p.x + radial.x * outward, p.y - 0.04, p.z + radial.y * outward);
    positions.push(p.x + radial.x * outward, p.y - height, p.z + radial.y * outward);
    uvs.push(i / points.length * 10, 1, i / points.length * 10, 0);
  }
  for (let i = 0; i < points.length - 1; i += 1) {
    const a = i * 2;
    indices.push(a, a + 2, a + 3, a, a + 3, a + 1);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function makeTileEnds(roof, material) {
  const spacing = 0.92;
  const instances = [];
  const outward = new THREE.Vector3();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const matrix = new THREE.Matrix4();
  const scale = new THREE.Vector3(1, 1, 1);

  const pushSide = (points) => {
    for (let i = 0; i < points.length - 1; i += 1) {
      const p = points[i];
      const next = points[i + 1];
      const length = p.distanceTo(next);
      const count = Math.max(1, Math.round(length / spacing));
      for (let j = 0; j < count; j += 1) {
        const t = j / count;
        const pos = p.clone().lerp(next, t);
        outward.set(pos.x, 0, pos.z).normalize();
        q.setFromUnitVectors(up, outward);
        matrix.compose(
          pos.clone().addScaledVector(outward, 0.02).add(new THREE.Vector3(0, -0.28, 0)),
          q,
          scale,
        );
        instances.push(matrix.clone());
      }
    }
  };

  const loop = roof.eaveLoop.concat([roof.eaveLoop[0]]);
  pushSide(loop);

  const geometry = new THREE.CylinderGeometry(0.115, 0.13, 0.17, 8);
  const mesh = new THREE.InstancedMesh(geometry, material, instances.length);
  instances.forEach((m, i) => mesh.setMatrixAt(i, m));
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  mesh.instanceMatrix.needsUpdate = true;
  return mesh;
}

function makeRafters(roof, material, tipMaterial) {
  const spacing = 1.25;
  const matrices = [];
  const tipMatrices = [];
  const up = new THREE.Vector3(0, 1, 0);
  const outward = new THREE.Vector3();
  const q = new THREE.Quaternion();
  const base = new THREE.Matrix4();
  const local = new THREE.Matrix4();
  const scale = new THREE.Vector3(0.14, 0.14, 0.95);
  const tipScale = new THREE.Vector3(0.19, 0.19, 0.15);
  const loop = roof.eaveLoop.concat([roof.eaveLoop[0]]);

  for (let i = 0; i < loop.length - 1; i += 1) {
    const p = loop[i];
    const next = loop[i + 1];
    const length = p.distanceTo(next);
    const count = Math.max(1, Math.round(length / spacing));
    for (let j = 0; j < count; j += 1) {
      const t = (j + 0.5) / count;
      const pos = p.clone().lerp(next, t);
      outward.set(pos.x, 0, pos.z).normalize();
      q.setFromAxisAngle(up, Math.atan2(outward.x, outward.z));
      // Rafter tail lies under the eave, pointing into the building.
      base.compose(
        pos.clone().addScaledVector(outward, -0.48).add(new THREE.Vector3(0, -0.34, 0)),
        q,
        scale,
      );
      matrices.push(base.clone());
      local.compose(
        pos.clone().addScaledVector(outward, 0.02).add(new THREE.Vector3(0, -0.34, 0)),
        q,
        tipScale,
      );
      tipMatrices.push(local.clone());
    }
  }

  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const mesh = new THREE.InstancedMesh(geometry, material, matrices.length);
  matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
  mesh.instanceMatrix.needsUpdate = true;
  mesh.castShadow = false;
  mesh.receiveShadow = true;

  const tips = new THREE.InstancedMesh(geometry, tipMaterial, tipMatrices.length);
  tipMatrices.forEach((m, i) => tips.setMatrixAt(i, m));
  tips.instanceMatrix.needsUpdate = true;
  tips.castShadow = false;
  tips.receiveShadow = true;

  const group = new THREE.Group();
  group.add(mesh, tips);
  return group;
}

function makeHipRidges(roof, material) {
  const group = new THREE.Group();
  for (const curve of roof.hips) {
    const geometry = new THREE.TubeGeometry(curve, 42, 0.155, 6, false);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }
  return group;
}

function makeBeastGeometry() {
  const body = new THREE.SphereGeometry(0.18, 6, 5);
  body.scale(0.85, 1.35, 0.95);
  body.translate(0, 0.28, 0);

  const head = new THREE.SphereGeometry(0.13, 6, 5);
  head.translate(0, 0.57, 0.04);

  const snout = new THREE.ConeGeometry(0.075, 0.22, 5);
  snout.rotateX(Math.PI / 2);
  snout.translate(0, 0.53, 0.2);

  const earLeft = new THREE.ConeGeometry(0.045, 0.16, 4);
  earLeft.translate(-0.08, 0.71, 0.01);
  const earRight = earLeft.clone();
  earRight.translate(0.16, 0, 0);

  const tail = new THREE.ConeGeometry(0.065, 0.33, 4);
  tail.rotateX(-0.6);
  tail.translate(0, 0.48, -0.16);

  const base = new THREE.BoxGeometry(0.28, 0.1, 0.34);
  base.translate(0, 0.08, 0);

  return mergeGeometries([base, body, head, snout, earLeft, earRight, tail]);
}

export function addRoofBeasts(roof, material, { count = 4, start = 0.66, end = 0.88, scale = 0.56 } = {}) {
  const geometry = makeBeastGeometry();
  const matrices = [];
  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const forward = new THREE.Vector3();
  const point = new THREE.Vector3();
  const scaleVector = new THREE.Vector3(scale, scale, scale);

  for (const curve of roof.hips) {
    for (let i = 0; i < count; i += 1) {
      const t = start + ((end - start) * i) / Math.max(1, count - 1);
      curve.getPointAt(t, point);
      curve.getTangentAt(t, forward);
      forward.y = 0;
      forward.normalize();
      quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), forward);
      matrix.compose(point.clone().add(new THREE.Vector3(0, 0.16, 0)), quaternion, scaleVector);
      matrices.push(matrix.clone());
    }
  }

  const mesh = new THREE.InstancedMesh(geometry, material, matrices.length);
  matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
  mesh.instanceMatrix.needsUpdate = true;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function makeChiwenGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(-1.0, 0);
  shape.lineTo(0.94, 0);
  shape.lineTo(0.92, 0.54);
  shape.bezierCurveTo(0.82, 1.16, 0.29, 1.58, -0.18, 1.74);
  shape.bezierCurveTo(-0.76, 1.95, -1.19, 1.44, -0.91, 1.02);
  shape.bezierCurveTo(-0.67, 0.66, -0.18, 0.98, -0.13, 1.27);
  shape.bezierCurveTo(-0.16, 0.83, -0.45, 0.53, -1.0, 0.42);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.42,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.06,
    bevelThickness: 0.07,
    curveSegments: 12,
  });
  geometry.translate(0, 0, -0.21);
  return geometry;
}

function addMainRidge(group, roof, materials) {
  const r = roof.ridgeLength / 2;
  const ridgePoints = [];
  for (let i = 0; i <= 36; i += 1) {
    const t = i / 36;
    const x = -r + t * roof.ridgeLength;
    const endLift = 0.11 * Math.pow(Math.abs((x / r)), 4);
    ridgePoints.push(new THREE.Vector3(x, roof.ridgeY + 0.2 + endLift, 0));
  }
  const ridgeCurve = new THREE.CatmullRomCurve3(ridgePoints);
  const ridge = new THREE.Mesh(new THREE.TubeGeometry(ridgeCurve, 110, 0.36, 8, false), materials.ridge);
  ridge.castShadow = true;
  ridge.receiveShadow = true;
  group.add(ridge);

  const highlightPoints = ridgePoints.map((p) => p.clone().add(new THREE.Vector3(0, 0.29, 0)));
  const highlight = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(highlightPoints), 100, 0.055, 5, false),
    materials.gold,
  );
  highlight.castShadow = false;
  group.add(highlight);

  const chiwenGeometry = makeChiwenGeometry();
  for (const side of [-1, 1]) {
    const chiwen = new THREE.Mesh(chiwenGeometry, materials.ridge);
    chiwen.position.set(side * r, roof.ridgeY + 0.18, 0);
    chiwen.scale.set(side * 1.35, 1.35, 1.35);
    chiwen.castShadow = true;
    chiwen.receiveShadow = true;
    group.add(chiwen);

    const jewel = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), materials.gold);
    jewel.position.set(side * r * 0.91, roof.ridgeY + 1.58, 0);
    jewel.castShadow = false;
    group.add(jewel);
  }
}

export function buildMainRoof(options, materials) {
  const group = new THREE.Group();
  const roof = createMainRoofGeometry(options);
  const mesh = new THREE.Mesh(roof.geometry, materials.roof);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);

  const undersideGeometry = roof.geometry.clone();
  undersideGeometry.translate(0, -0.32, 0);
  const underside = new THREE.Mesh(undersideGeometry, materials.roofUnder);
  underside.castShadow = false;
  underside.receiveShadow = true;
  group.add(underside);

  const fasciaMaterial = materials.tealDark.clone();
  fasciaMaterial.side = THREE.DoubleSide;
  const fascia = new THREE.Mesh(makeFasciaGeometry(roof.eaveLoop), fasciaMaterial);
  fascia.castShadow = true;
  fascia.receiveShadow = true;
  group.add(fascia);

  const rimPoints = roof.eaveLoop.map((p) => p.clone());
  const rimCurve = new THREE.CatmullRomCurve3(rimPoints, true, 'centripetal');
  const rim = new THREE.Mesh(new THREE.TubeGeometry(rimCurve, 240, 0.13, 6, true), materials.goldDark);
  rim.castShadow = true;
  rim.receiveShadow = true;
  group.add(rim);

  group.add(makeTileEnds(roof, materials.gold));
  group.add(makeRafters(roof, materials.teal, materials.goldDark));
  group.add(makeHipRidges(roof, materials.ridge));
  group.add(addRoofBeasts(roof, materials.ridge, { count: 5, start: 0.62, end: 0.88, scale: 0.65 }));
  addMainRidge(group, roof, materials);

  group.userData.roof = roof;
  return group;
}

export function buildSkirtRoof(options, materials) {
  const group = new THREE.Group();
  const roof = createSkirtRoofGeometry(options);
  const mesh = new THREE.Mesh(roof.geometry, materials.roof);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);

  const undersideGeometry = roof.geometry.clone();
  undersideGeometry.translate(0, -0.3, 0);
  const underside = new THREE.Mesh(undersideGeometry, materials.roofUnder);
  underside.castShadow = false;
  underside.receiveShadow = true;
  group.add(underside);

  const fasciaMaterial = materials.tealDark.clone();
  fasciaMaterial.side = THREE.DoubleSide;
  const fascia = new THREE.Mesh(makeFasciaGeometry(roof.eaveLoop), fasciaMaterial);
  fascia.castShadow = true;
  fascia.receiveShadow = true;
  group.add(fascia);

  const rimPoints = roof.eaveLoop.map((p) => p.clone());
  const rimCurve = new THREE.CatmullRomCurve3(rimPoints, true, 'centripetal');
  const rim = new THREE.Mesh(new THREE.TubeGeometry(rimCurve, 210, 0.12, 6, true), materials.goldDark);
  rim.castShadow = true;
  rim.receiveShadow = true;
  group.add(rim);

  group.add(makeTileEnds(roof, materials.gold));
  group.add(makeRafters(roof, materials.teal, materials.goldDark));
  group.add(makeHipRidges(roof, materials.ridge));
  group.add(addRoofBeasts(roof, materials.ridge, { count: 4, start: 0.64, end: 0.88, scale: 0.5 }));

  group.userData.roof = roof;
  return group;
}

export function disposeRoofGroup(group) {
  group.traverse((object) => {
    if (object.isMesh) {
      object.geometry?.dispose();
    }
  });
}

