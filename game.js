import * as THREE from 'three';
import { OrbitControls } from 'https://unpkg.com/three@0.158.0/examples/jsm/controls/OrbitControls.js';

console.log("game.js chargé");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x080a0f);

const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.3);
directionalLight.position.set(10, 20, 10);
scene.add(directionalLight);

const aspect = window.innerWidth / window.innerHeight;

const camera = new THREE.OrthographicCamera(
  -8 * aspect,
   8 * aspect,
   8,
  -8,
   0.1,
   1000
);

camera.position.set(15, 5.5, 5);  // vue au lancement du site

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

function createBlock(x, y, z) {
  const geometry = new THREE.BoxGeometry(1, 1, 1);

  const material = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const cube = new THREE.Mesh(geometry, material);
  cube.position.set(x, y, z);
  scene.add(cube);

  const edges = new THREE.EdgesGeometry(geometry);
  const line = new THREE.LineSegments(
    edges,
    new THREE.LineBasicMaterial({ color: 0xffffff })
  );
  line.position.set(x, y, z);
  scene.add(line);
}

// --- LES BLOCS ---
// ligne du bas du carré
createBlock(4, 0, +1);
createBlock(5, 0, +1);
createBlock(6, 0, +1);
createBlock(7, 0, +1);
createBlock(8, 0, +1);
createBlock(9, 0, +1);

// colonne gauche du carré
createBlock(4, 0, 0);
createBlock(4, 1, -1);
createBlock(4, 2, -2);
createBlock(4, 3, -3);
createBlock(4, 4, -4);

// îlot à la fleur
createBlock(4, 0, -9);
createBlock(4, 0, -10);
createBlock(4, 0, -11);
createBlock(5, 0, -11);
createBlock(5, 0, -10);

// îlot particule
createBlock(-1, 3, -5);

// colonne droite du carré
createBlock(9, 0, 0);
createBlock(9, 0, -1);
createBlock(9, 0, -2);
createBlock(9, 0, -3);

// ligne du haut du carré
createBlock(6, 0, -4);
createBlock(7, 0, -4);
createBlock(8, 0, -4);
createBlock(9, 0, -4);

const target = new THREE.Vector3(6, 2, -5);  // plus ou moins le centre de la forme (vue centré sur le centre)
camera.lookAt(target);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enablePan = false;
controls.enableZoom = true;
controls.target.copy(target);
controls.update();

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
  const aspect = window.innerWidth / window.innerHeight;
  camera.left = -8 * aspect;
  camera.right = 8 * aspect;
  camera.top = 8;
  camera.bottom = -8;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// personnage
function createAstronaut(x, y, z) {
  const astronaut = new THREE.Group();


  const suitMat = new THREE.MeshPhongMaterial({
    color: 0xf1efe8,
    shininess: 55,
    specular: 0x444444
  });

  const visorMat = new THREE.MeshPhongMaterial({
    color: 0x000000,
    shininess: 180,
    specular: 0xffffff
  });

  const antennaMat = new THREE.MeshPhongMaterial({
    color: 0xb3202a,
    shininess: 120,
    specular: 0xffffff
  });

  const lineMat = new THREE.LineBasicMaterial({ color: 0x111111 });

  function addMesh(
    geometry,
    material,
    px, py, pz,
    rx = 0, ry = 0, rz = 0,
    sx = 1, sy = 1, sz = 1
  ) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(px, py, pz);
    mesh.rotation.set(rx, ry, rz);
    mesh.scale.set(sx, sy, sz);
    astronaut.add(mesh);
    return mesh;
  }

  function addArc(px, py, pz, rx, ry, start, end, rotX = 0, rotY = 0, rotZ = 0) {
    const curve = new THREE.EllipseCurve(0, 0, rx, ry, start, end, false, 0);
    const points = curve.getPoints(40);
    const geometry = new THREE.BufferGeometry().setFromPoints(
      points.map(p => new THREE.Vector3(p.x, p.y, 0))
    );
    const line = new THREE.Line(geometry, lineMat);
    line.position.set(px, py, pz);
    line.rotation.set(rotX, rotY, rotZ);
    astronaut.add(line);
    return line;
  }

  function addEllipse(px, py, pz, sx, sy, rotX = 0, rotY = 0, rotZ = 0) {
    const curve = new THREE.EllipseCurve(0, 0, 1, 1, 0, Math.PI * 2, false, 0);
    const points = curve.getPoints(64);
    const geometry = new THREE.BufferGeometry().setFromPoints(
      points.map(p => new THREE.Vector3(p.x, p.y, 0))
    );
    const line = new THREE.LineLoop(geometry, lineMat);
    line.position.set(px, py, pz);
    line.rotation.set(rotX, rotY, rotZ);
    line.scale.set(sx, sy, 1);
    astronaut.add(line);
    return line;
  }

  // casque
  addMesh(
    new THREE.SphereGeometry(0.36, 32, 32),
    suitMat,
    0, 1.78, 0
  );

  // visière plus intégrée
  addMesh(
    new THREE.SphereGeometry(0.22, 32, 32),
    visorMat,
    0, 1.75, 0.315,
    0, -0.18, 0,
    1.25, 0.8, 0.55
  );

  // contour de visière
  addEllipse(
    0, 1.75, 0.32675,
    0.31, 0.19,
    0, -0.18, 0
  );

  // antenne
  addMesh(
    new THREE.CylinderGeometry(0.012, 0.012, 0.24, 12),
    suitMat,
    0, 2.12, -0.09,
    0, 3, -0.24
  );

  // boule de l'antenne
  addMesh(
    new THREE.SphereGeometry(0.045, 16, 16),
    antennaMat,
    -0.0225, 2.24, -0.09
  );

  // torse
  addMesh(
    new THREE.CylinderGeometry(0.22, 0.24, 0.72, 24),
    suitMat,
    0, 1.13, 0
  );

  // bassin 
  addMesh(
    new THREE.CylinderGeometry(0.23, 0.20, 0.22, 20),
    suitMat,
    0, 0.72, 0
  );

  // sac à dos
  addMesh(
    new THREE.BoxGeometry(0.27, 0.42, 0.16),
    suitMat,
    -0.03, 1.30, -0.26
  );

  const packEdges = new THREE.EdgesGeometry(
    new THREE.BoxGeometry(0.27, 0.42, 0.16)
  );
  const packLine = new THREE.LineSegments(packEdges, lineMat);
  packLine.position.set(-0.03, 1.30, -0.26);
  astronaut.add(packLine);

  // bras
  function addArm(side) {
    const s = side;

    // épaules
    addMesh(
      new THREE.SphereGeometry(0.11, 18, 18),
      suitMat,
      0.24 * s, 1.34, 0
    );

    // haut du bras
    addMesh(
      new THREE.CylinderGeometry(0.06, 0.08, 0.40, 18),
      suitMat,
      0.29 * s, 1.211, 0,
      0, 0, 0.12 * s
    );

    // bas du bras
    addMesh(
      new THREE.CylinderGeometry(0.085, 0.10, 0.30, 18),
      suitMat,
      0.3425 * s, 0.78, 0,
      0, 0, 0.08 * s
    );

    // main
    addMesh(
      new THREE.SphereGeometry(0.075, 18, 18),
      suitMat,
      0.39 * s, 0.60, 0.01,
      0, 0, 0,
      0.9, 1.15, 0.8
    );
  }

  addArm(-1);
  addArm(1);

  // jambes
  function addLeg(side) {
    const s = side;

    // cuisses
    addMesh(
      new THREE.CylinderGeometry(0.10, 0.105, 0.38, 18),
      suitMat,
      0.11 * s, 0.45, 0
    );

    // bas de jambe
    addMesh(
      new THREE.CylinderGeometry(0.10, 0.10, 0.34, 18),
      suitMat,
      0.11 * s, 0.04, 0
    );

    // pied
    addMesh(
      new THREE.SphereGeometry(0.085, 18, 18),
      suitMat,
      0.11 * s, -0.16, 0.05,
      0, 0, 0,
      1.0, 0.55, 1.35
    );
  }

  addLeg(-1);
  addLeg(1);

  astronaut.position.set(x, y, z);
  scene.add(astronaut);

  return astronaut;
}

const player = createAstronaut(9, 0.5, 1);
player.rotation.y = Math.PI / -2;  // sens d'apparition là il est orienté vers la gauche (donc la droite du perso)