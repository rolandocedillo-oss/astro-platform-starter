/*
  Robot Factory
  Version: 0.2.9
  Last Updated: 2026-01-28
  Changelog: See CHANGELOG.md.
*/

import * as THREE from 'three';

export function createRobot(color = 0x00ffcc) {
  // Container for all robot parts.
  const group = new THREE.Group();

  // Materials (glowing Tron-style body + dark joints).
  const material = new THREE.MeshStandardMaterial({ color: color, roughness: 0.2 });
  const jointMat = new THREE.MeshStandardMaterial({ color: 0x333333 });

  // 1) Torso
  const torso = new THREE.Mesh(new THREE.BoxGeometry(1, 1.5, 0.6), material);
  torso.position.y = 1.5;
  torso.castShadow = true;
  group.add(torso);

  // 2) Head (cube) with a single neon face to show facing direction.
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), material);
  head.position.y = 2.8;
  group.add(head);

  // Visor (eyes) only on the front face.
  const visorMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffff });
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.18, 0.02), visorMaterial);
  visor.position.y = 2.8;
  visor.position.z = 0.45;
  group.add(visor);

  // 3) Arms (simple pivots)
  const armGeo = new THREE.BoxGeometry(0.3, 1.2, 0.3);
  
  const leftArm = new THREE.Mesh(armGeo, material);
  leftArm.position.set(-0.8, 1.8, 0);
  group.add(leftArm);

  const rightArm = new THREE.Mesh(armGeo, material);
  rightArm.position.set(0.8, 1.8, 0);
  // Give right arm a simple sword/hammer handle placeholder.
  const swordHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.2), new THREE.MeshStandardMaterial({ color: 0xaa2222 }));
  swordHandle.rotation.x = Math.PI / 2;
  swordHandle.position.y = -0.6;
  swordHandle.position.z = 0.8;
  rightArm.add(swordHandle);

  const swordBlade = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.2, 0.06), new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0x550000 }));
  swordBlade.position.y = 0.6;
  swordHandle.add(swordBlade);

  // Hammer head (hidden by default, toggled when using hammer weapon).
  //when using THREE.BoxGeometry(Width, Height, Depth) or Width, legth, height if moving vertical like a weapon. 
  const hammerHead = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 1.0), new THREE.MeshStandardMaterial({ color: 0x888888 }));
  hammerHead.position.y = 1.0;
  hammerHead.visible = false;
  swordHandle.add(hammerHead);

  // Bow (hidden by default, toggled when using bow weapon).
  const bowFrame = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.05, 8, 24, Math.PI), material);
  bowFrame.rotation.z = Math.PI / 2;
  bowFrame.position.set(0, -0.1, 0.6);
  bowFrame.visible = false;
  rightArm.add(bowFrame);

  // Spear (hidden by default, toggled when using spear weapon).
  const spearShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.2), material);
  spearShaft.rotation.z = Math.PI / 2;
  spearShaft.position.set(0.6, -0.2, 0.4);
  spearShaft.visible = false;
  rightArm.add(spearShaft);

  const spearTip = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.3, 8), new THREE.MeshStandardMaterial({ color: 0xffdd99 }));
  spearTip.rotation.z = Math.PI / 2;
  spearTip.position.set(1.7, -0.2, 0.4);
  spearTip.visible = false;
  rightArm.add(spearTip);

  // Bomb (hidden by default, toggled when using bomb weapon).
  const heldBomb = new THREE.Mesh(new THREE.SphereGeometry(0.5),new THREE.MeshStandardMaterial({ color: 0xffaa00 }));
  heldBomb.position.set(0.0, -0.4, 1.0)
  heldBomb.visible = false;
  rightArm.add(heldBomb);

  // Shield (hidden by default, toggled when using shield weapon).
  const shield = new THREE.Mesh(new THREE.BoxGeometry(1.9, 2.1, 0.1), jointMat);
  //shield.position.set(-1.1, 1.7, 0.2); originals
  shield.position.set(-0.2, 1.7, 0.5);
  shield.visible = false;
  group.add(shield);

  group.add(rightArm);

  // Export references for animation hooks and weapon visuals.
  group.userData = { leftArm, rightArm, torso, swordBlade, hammerHead, bowFrame, spearShaft, spearTip, shield, heldBomb, visorMaterial };
  
  return group;
}
