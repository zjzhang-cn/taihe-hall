import * as THREE from 'three';

export function createMaterials(textures) {
  const roofMap = textures.roof;
  const roofBump = textures.roof;

  const roof = new THREE.MeshStandardMaterial({
    map: roofMap,
    bumpMap: roofBump,
    bumpScale: 0.17,
    color: 0xf4d59a,
    roughness: 0.48,
    metalness: 0.07,
    envMapIntensity: 0.5,
    side: THREE.DoubleSide,
  });

  const roofUnder = new THREE.MeshStandardMaterial({
    color: 0x19322e,
    roughness: 0.74,
    metalness: 0.06,
    side: THREE.DoubleSide,
    envMapIntensity: 0.5,
  });

  const marble = new THREE.MeshStandardMaterial({
    map: textures.marble,
    color: 0xfffbf1,
    roughness: 0.68,
    metalness: 0.0,
    envMapIntensity: 0.4,
  });

  const marblePlain = new THREE.MeshStandardMaterial({
    map: textures.marblePlain,
    color: 0xf8f4e9,
    roughness: 0.7,
    metalness: 0.0,
    envMapIntensity: 0.35,
  });

  const marbleCarved = new THREE.MeshStandardMaterial({
    map: textures.carving,
    color: 0xfffbf1,
    roughness: 0.76,
    metalness: 0.0,
    envMapIntensity: 0.25,
  });

  const paving = new THREE.MeshStandardMaterial({
    map: textures.paving,
    color: 0xc8c2b5,
    roughness: 0.88,
    metalness: 0.0,
    envMapIntensity: 0.25,
  });

  const darkPaving = new THREE.MeshStandardMaterial({
    map: textures.paving,
    color: 0x8e8b82,
    roughness: 0.9,
    metalness: 0.0,
    envMapIntensity: 0.2,
  });

  const plaster = new THREE.MeshStandardMaterial({
    map: textures.plaster,
    color: 0xffffff,
    roughness: 0.63,
    metalness: 0.0,
    envMapIntensity: 0.33,
  });

  const redLacquer = new THREE.MeshPhysicalMaterial({
    color: 0x8f2016,
    roughness: 0.34,
    metalness: 0.03,
    clearcoat: 0.42,
    clearcoatRoughness: 0.32,
    envMapIntensity: 0.75,
  });

  const redDeep = new THREE.MeshStandardMaterial({
    color: 0x51110d,
    roughness: 0.66,
    metalness: 0.0,
  });

  const door = new THREE.MeshStandardMaterial({
    map: textures.door,
    color: 0xffffff,
    roughness: 0.43,
    metalness: 0.12,
    envMapIntensity: 0.65,
    emissive: 0x2b0c05,
    emissiveMap: textures.door,
    emissiveIntensity: 0.24,
  });

  const lattice = new THREE.MeshStandardMaterial({
    map: textures.lattice,
    color: 0xffffff,
    roughness: 0.41,
    metalness: 0.3,
    envMapIntensity: 0.7,
    emissive: 0x10211c,
    emissiveMap: textures.lattice,
    emissiveIntensity: 0.28,
  });

  const beam = new THREE.MeshStandardMaterial({
    map: textures.beam,
    color: 0xffffff,
    roughness: 0.5,
    metalness: 0.18,
    envMapIntensity: 0.55,
  });

  const plaque = new THREE.MeshStandardMaterial({
    map: textures.plaque,
    color: 0xffffff,
    roughness: 0.37,
    metalness: 0.3,
    envMapIntensity: 0.8,
    emissive: 0x4a3212,
    emissiveMap: textures.plaque,
    emissiveIntensity: 0.34,
  });

  const gold = new THREE.MeshStandardMaterial({
    color: 0xd2a34d,
    roughness: 0.29,
    metalness: 0.86,
    envMapIntensity: 1.4,
  });

  const goldDark = new THREE.MeshStandardMaterial({
    color: 0x8c6426,
    roughness: 0.35,
    metalness: 0.78,
    envMapIntensity: 1.1,
  });

  const ridge = new THREE.MeshStandardMaterial({
    color: 0x9a6c1f,
    roughness: 0.33,
    metalness: 0.55,
    envMapIntensity: 1.05,
  });

  const bronze = new THREE.MeshStandardMaterial({
    color: 0x796039,
    roughness: 0.47,
    metalness: 0.58,
    envMapIntensity: 1.18,
  });

  const bronzeHighlight = new THREE.MeshStandardMaterial({
    color: 0xb69455,
    roughness: 0.39,
    metalness: 0.7,
    envMapIntensity: 1.25,
  });

  const teal = new THREE.MeshStandardMaterial({
    color: 0x1d4b44,
    roughness: 0.58,
    metalness: 0.08,
    envMapIntensity: 0.35,
  });

  const tealDark = new THREE.MeshStandardMaterial({
    color: 0x153530,
    roughness: 0.63,
    metalness: 0.04,
  });

  const interior = new THREE.MeshStandardMaterial({
    color: 0x140c09,
    roughness: 0.9,
    metalness: 0.0,
  });

  const stoneDark = new THREE.MeshStandardMaterial({
    color: 0x5f5b53,
    roughness: 0.84,
    metalness: 0.02,
  });

  const wood = new THREE.MeshStandardMaterial({
    color: 0x3a2218,
    roughness: 0.62,
    metalness: 0.03,
  });

  return {
    roof,
    roofUnder,
    marble,
    marblePlain,
    marbleCarved,
    paving,
    darkPaving,
    plaster,
    redLacquer,
    redDeep,
    door,
    lattice,
    beam,
    plaque,
    gold,
    goldDark,
    ridge,
    bronze,
    bronzeHighlight,
    teal,
    tealDark,
    interior,
    stoneDark,
    wood,
  };
}
