/** Rendu d'une vignette de modèle 3D (utilisé par scripts/model-thumbs.mjs, dans un navigateur sans écran). */
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setSize(480, 480); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.1;
const scene = new THREE.Scene(), pm = new THREE.PMREMGenerator(renderer);
scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
const sun = new THREE.DirectionalLight("#fff6ea", 1.6); sun.position.set(-1, 2, 1.5); scene.add(sun);
const cam = new THREE.PerspectiveCamera(30, 1, 0.01, 100);
const loader = new GLTFLoader();
(window as unknown as { shoot: (f: string) => Promise<string> }).shoot = async (file: string) => {
  const gltf = await loader.loadAsync(file), obj = gltf.scene;
  scene.add(obj);
  const box = new THREE.Box3().setFromObject(obj), c = box.getCenter(new THREE.Vector3()), r = box.getBoundingSphere(new THREE.Sphere()).radius;
  const d = r / Math.sin(THREE.MathUtils.degToRad(15)) * 1.05;
  cam.position.set(c.x + d * 0.55, c.y + d * 0.42, c.z + d * 0.72); cam.lookAt(c); cam.updateProjectionMatrix();
  renderer.render(scene, cam);
  const big = renderer.domElement, out = document.createElement("canvas"); out.width = out.height = 240;
  out.getContext("2d")!.drawImage(big, 0, 0, 240, 240);
  scene.remove(obj);
  return out.toDataURL("image/webp", 0.9);
};
