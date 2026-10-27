import * as THREE from "three";

/**
 * Environnement de studio photo pour les échantillons : pièce gris chaud, grande boîte à lumière
 * derrière et au-dessus de l'échantillon (son reflet glisse sur les émaux et les vernis), réflecteur latéral.
 */
export function studioEnvironment(renderer: THREE.WebGLRenderer): THREE.Texture {
  const scene = new THREE.Scene();
  const room = new THREE.Mesh(new THREE.BoxGeometry(10, 6, 10), new THREE.MeshBasicMaterial({ color: new THREE.Color("#7d766c").multiplyScalar(0.55), side: THREE.BackSide }));
  room.position.y = 2.5; scene.add(room);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.MeshBasicMaterial({ color: new THREE.Color("#a59d91").multiplyScalar(0.6) }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -0.5; scene.add(floor);
  const panel = (w: number, h: number, intensity: number, pos: [number, number, number], color = "#fff6ea") => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide }));
    m.position.set(...pos); m.lookAt(0, 0, 0); scene.add(m);
  };
  panel(4.2, 2.2, 3.2, [0, 3.2, -3.4]);          // boîte à lumière principale, en reflet
  panel(1.6, 2.6, 1.6, [-4.2, 1.8, 0.6]);        // réflecteur à gauche
  panel(1.2, 1.2, 0.9, [3.8, 2.6, 2.4], "#eef3ff"); // touche froide, pour le relief
  const pm = new THREE.PMREMGenerator(renderer);
  const tex = pm.fromScene(scene, 0.02).texture;
  pm.dispose();
  scene.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) { m.geometry.dispose(); (m.material as THREE.Material).dispose(); } });
  return tex;
}
