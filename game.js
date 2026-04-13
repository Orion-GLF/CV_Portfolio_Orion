import * as THREE from 'three';
import { OrbitControls } from 'https://unpkg.com/three@0.158.0/examples/jsm/controls/OrbitControls.js';

let controls;

console.log("GAME JS V2");

const scene = new THREE.Scene();

const activeConnectionSquares = {};

//fond dégradé
// const skyGeo = new THREE.SphereGeometry(1000, 64, 64);
const skyGeo = new THREE.SphereGeometry(35, 64, 64);

const skyMat = new THREE.ShaderMaterial({
  side: THREE.BackSide,
  uniforms: {
    topColor: { value: new THREE.Color(0x1a2a6c) },   // bleu profond
    bottomColor: { value: new THREE.Color(0x3a0ca3) }, // violet spatial
  },
  vertexShader: `
    varying vec3 vWorldPosition;
    void main() {
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 topColor;
    uniform vec3 bottomColor;

    varying vec3 vWorldPosition;

    void main() {

      vec3 dir = normalize(vWorldPosition);

      // inclinaison
      float h = dir.y + dir.x * 0.3;
      
      float wave = sin(dir.x * 6.0) * 1.55;
      h += wave;

      
      float noise =
      sin(dir.x * 4.0) * 0.05 +
      sin(dir.z * 3.0) * 0.05;
      
      h += noise;
      
      // gradient principal
      float gradient = h * 0.5 + 0.5;
      
      vec3 color = mix(bottomColor, topColor, gradient);
      
      // profondeur vers le haut et le bas
      float depthFade = pow(abs(h), 1.5);
      color *= 1.0 - depthFade * 0.6;
      
      // glow central (nébuleuse douce)
      float glow = pow(1.0 - abs(h), 3.0);
      color += glow * 0.15;

      gl_FragColor = vec4(color, 1.0);

    }
  `
});

const sky = new THREE.Mesh(skyGeo, skyMat);
scene.add(sky);

scene.fog = new THREE.FogExp2(0x020611, 0.015);

const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.3);
directionalLight.position.set(10, 20, 10);
scene.add(directionalLight);

const starsGeometry = new THREE.BufferGeometry();
const starsCount = 12000;

const positions = new Float32Array(starsCount * 3);
const colors = new Float32Array(starsCount * 3);

for (let i = 0; i < starsCount; i++) {
  const i3 = i * 3;

  // positions plus naturelles
  positions[i3] = (Math.random() - 0.5) * 80;
  positions[i3 + 1] = (Math.random() - 0.5) * 80;
  positions[i3 + 2] = (Math.random() - 0.5) * 80;

  // couleurs légèrement variées
  const r = 0.8 + Math.random() * 0.2;
  const g = 0.8 + Math.random() * 0.2;
  const b = 1;

  colors[i3] = r;
  colors[i3 + 1] = g;
  colors[i3 + 2] = b;
}

starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
starsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

const starsMaterial = new THREE.PointsMaterial({
  size: 1.2,
  vertexColors: true,
  transparent: true,
  opacity: 0.9,
});

const stars = new THREE.Points(starsGeometry, starsMaterial);
scene.add(stars);

// 🌌 étoiles lointaines
const starsFarGeometry = new THREE.BufferGeometry();
const starsFarVertices = [];

for (let i = 0; i < 4000; i++) {
  starsFarVertices.push(
    (Math.random() - 0.5) * 200,
    (Math.random() - 0.5) * 200,
    (Math.random() - 0.5) * 200
  );
}

starsFarGeometry.setAttribute(
  'position',
  new THREE.Float32BufferAttribute(starsFarVertices, 3)
);

const starsFarMaterial = new THREE.PointsMaterial({
  color: 0x88aaff,
  size: 0.6,
  transparent: true,
  opacity: 0.5,
});

const aspect = window.innerWidth / window.innerHeight;

const camera = new THREE.OrthographicCamera(
  -8 * aspect,
   8 * aspect,
   8,
  -8,
   0.1,
   1000
);

function setupCamera() {
  const aspect = window.innerWidth / window.innerHeight;
  const size = 8;

  camera.left = -size * aspect;
  camera.right = size * aspect;
  camera.top = size;
  camera.bottom = -size;

  camera.position.set(15, 5.5, 5);

  const target = new THREE.Vector3(6, 2, -5);

  camera.lookAt(target);

  if (controls) {
    controls.target.copy(target);
    controls.update(); 
  }

  camera.updateProjectionMatrix();
}

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

renderer.domElement.style.position = "fixed";
renderer.domElement.style.inset = "0";
renderer.domElement.style.zIndex = "1";

const bgCanvas = document.getElementById("bg-canvas");
const bgCtx = bgCanvas.getContext("2d");

function resizeBgCanvas() {
  bgCanvas.width = window.innerWidth;
  bgCanvas.height = window.innerHeight;
}
resizeBgCanvas();

const smokeParticles = [];
const mouseTrail = {
  x: window.innerWidth * 0.5,
  y: window.innerHeight * 0.5
};

let isTouching = false;

let lastMouseMoveTime = 0;

window.addEventListener("mousemove", (event) => {
  mouseTrail.x = event.clientX;
  mouseTrail.y = event.clientY;
  lastMouseMoveTime = Date.now();

  const smokePalette = [
    200, // bleu
    190, // bleu-cyan
    180, // cyan
    140, // vert
    80   // jaune-vert
  ];

  for (let i = 0; i < 10; i++) {
    const hue = smokePalette[Math.floor(Math.random() * smokePalette.length)];

    smokeParticles.push({
      x: event.clientX + (Math.random() - 0.5) * 36,
      y: event.clientY + (Math.random() - 0.5) * 36,
      vx: (Math.random() - 0.5) * 1.2,
      vy: (Math.random() - 0.5) * 1.2,
      life: 1,
      decay: 0.025 + Math.random() * 0.02,
      hue: hue
    });
  }
});

window.addEventListener("touchmove", (event) => {
  const touch = event.touches[0];

  mouseTrail.x = touch.clientX;
  mouseTrail.y = touch.clientY;
  lastMouseMoveTime = Date.now();

  const smokePalette = [200, 190, 180, 140, 80];

  for (let i = 0; i < 10; i++) {
    const hue = smokePalette[Math.floor(Math.random() * smokePalette.length)];

    smokeParticles.push({
      x: touch.clientX + (Math.random() - 0.5) * 36,
      y: touch.clientY + (Math.random() - 0.5) * 36,
      vx: (Math.random() - 0.5) * 1.2,
      vy: (Math.random() - 0.5) * 1.2,
      life: 1,
      decay: 0.025 + Math.random() * 0.02,
      hue: hue
    });
  }
});

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const cvOverlay = document.getElementById("cv-overlay");
const cvCloseButton = document.getElementById("cv-close");

function openCvOverlay() {
  cvOverlay.classList.remove("hidden");
}

function closeCvOverlay() {
  cvOverlay.classList.add("hidden");
}

cvCloseButton.addEventListener("click", closeCvOverlay);

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeCvOverlay();
  }
});

const terrainBlocks = [];

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

  terrainBlocks.push({
    id: `${x},${y},${z}`,
    x,
    y,
    z
  });
}

function createConnectionSquare(block) {
  const size = 1.05;

  const geometry = new THREE.PlaneGeometry(size, size);

  const edges = new THREE.EdgesGeometry(geometry);

  const material = new THREE.LineBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.9
  });

  const square = new THREE.LineSegments(edges, material);

  // position
  square.position.set(block.x, block.y + 0.51, block.z); 
  // 👆 légèrement au-dessus pour éviter z-fighting

  // orientation (IMPORTANT)
  square.rotation.x = -Math.PI / 2; // à plat

  return square;
}

function spawnSquareParticles3D(block) {

  const size = 0.5;
  const pixelCount = 6;

  const edges = [
    [[-size, size, -size], [size, size, -size]],
    [[size, size, -size], [size, size, size]],
    [[size, size, size], [-size, size, size]],
    [[-size, size, size], [-size, size, -size]],
  ];

  edges.forEach(edge => {
    const [start, end] = edge;

    const t = Math.random();

    const x = THREE.MathUtils.lerp(start[0], end[0], t);
    const z = THREE.MathUtils.lerp(start[2], end[2], t);

    const particle = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.06, 0.06), // ⚠️ cube, pas plane
      new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.9
      })
    );

    particle.position.set(
      block.x + x,
      block.y + size + 0.02, // posé sur la surface
      block.z + z
    );

    scene.add(particle);

    setTimeout(() => {
      scene.remove(particle);
    }, 250);
  });
}

function startPixelEffect(block) {

  const interval = setInterval(() => {
    spawnSquareParticles3D(block);
  }, 120); // vitesse

  // stocker pour cleanup
  if (!block.intervals) block.intervals = [];
  block.intervals.push(interval);
}

function updateVisualConnectionsEffects() {
  for (const key in visualConnections) {
    const [id1, id2] = key.split("|");

    const blockA = terrainBlocks.find(b => b.id === id1);
    const blockB = terrainBlocks.find(b => b.id === id2);

    if (!blockA || !blockB) continue;

    const aligned = isVisuallyAligned(blockA, blockB);

    if (aligned) {

      if (!activeConnectionSquares[key]) {
        const squareA = createConnectionSquare(blockA);
        const squareB = createConnectionSquare(blockB);

        scene.add(squareA);
        scene.add(squareB);

        activeConnectionSquares[key] = [squareA, squareB];
      }

    } 
    
    if (aligned) {

      if (!activeConnectionSquares[key]) {
        const squareA = createConnectionSquare(blockA);
        const squareB = createConnectionSquare(blockB);

        scene.add(squareA);
        scene.add(squareB);

        activeConnectionSquares[key] = [squareA, squareB];
      }

      // 👇 AJOUT ICI
      if (!activeConnectionSquares[key].particlesStarted) {
        startPixelEffect(blockA);
        startPixelEffect(blockB);
        activeConnectionSquares[key].particlesStarted = true;
      }

    } else {

      if (activeConnectionSquares[key]) {

        // 🧼 STOP LES PARTICULES
        if (blockA.intervals) {
          blockA.intervals.forEach(i => clearInterval(i));
          blockA.intervals = [];
        }

        if (blockB.intervals) {
          blockB.intervals.forEach(i => clearInterval(i));
          blockB.intervals = [];
        }

        // 🧹 supprimer les carrés
        activeConnectionSquares[key].forEach(obj => scene.remove(obj));
        delete activeConnectionSquares[key];
      }

    }
  }
}

const visualConnections = {};

function makeConnectionKey(id1, id2) {
  return [id1, id2].sort().join("|");
}

function connectVisually(id1, id2) {
  visualConnections[makeConnectionKey(id1, id2)] = true;
}

function hasVisualConnection(blockA, blockB) {
  if (!blockA || !blockB) return false;

  const declared =
    visualConnections[makeConnectionKey(blockA.id, blockB.id)] === true;

  if (!declared) return false;

  return isVisuallyAligned(blockA, blockB);
}

function getBlockAt(x, y, z) {
  return terrainBlocks.find(block =>
    block.x === x && block.y === y && block.z === z
  );
}

function arePhysicallyConnected(blockA, blockB) {
  if (!blockA || !blockB) return false;

  const dx = Math.abs(blockA.x - blockB.x);
  const dy = Math.abs(blockA.y - blockB.y);
  const dz = Math.abs(blockA.z - blockB.z);

  // voisin plat : gauche/droite/devant/derrière
  const flatNeighbor = (dx + dz === 1 && dy === 0);

  // voisin escalier : une marche plus haut ou plus bas + avance d'une case
  const stairNeighbor = (dy === 1 && dx + dz === 1);

  return flatNeighbor || stairNeighbor;
}

function getProjectedBlockPosition(block) {
  const vector = new THREE.Vector3(block.x, block.y + 0.5, block.z);
  vector.project(camera);

  return {
    x: vector.x,
    y: vector.y
  };
}

function isVisuallyAligned(blockA, blockB) {
  if (!blockA || !blockB) return false;

  const screenA = getProjectedBlockPosition(blockA);
  const screenB = getProjectedBlockPosition(blockB);

  const dx = Math.abs(screenA.x - screenB.x);
  const dy = Math.abs(screenA.y - screenB.y);

  const threshold = 0.12; // à ajuster

  return dx < threshold && dy < threshold;
}

function canMoveBetween(blockA, blockB) {
  if (!blockA || !blockB) return false;

  // autoriser le déplacement sur le même bloc
  if (blockA.id === blockB.id) return true;

  return (
    arePhysicallyConnected(blockA, blockB) ||
    hasVisualConnection(blockA, blockB)
  );
}

function findVisualTarget(currentBlock, forward) {
  const connectedBlocks = terrainBlocks.filter(block =>
    hasVisualConnection(currentBlock, block)
  );

  if (connectedBlocks.length === 0) return null;

  for (const block of connectedBlocks) {
    const directionToBlock = new THREE.Vector3(
      block.x - currentBlock.x,
      0,
      block.z - currentBlock.z
    );

    if (directionToBlock.lengthSq() === 0) continue;

    directionToBlock.normalize();

    const dot = forward.dot(directionToBlock);

    if (dot > 0.5) {
      return block;
    }
  }

  return null;
}

const playerRadius = 0;
const playerHeightOffset = 0.129;

function getBlockUnderPlayer(position) {
  const matchingBlocks = terrainBlocks.filter(block => {
    const minX = block.x - 0.5 + playerRadius;
    const maxX = block.x + 0.5 - playerRadius;
    const minZ = block.z - 0.5 + playerRadius;
    const maxZ = block.z + 0.5 - playerRadius;

    return (
      position.x >= minX &&
      position.x <= maxX &&
      position.z >= minZ &&
      position.z <= maxZ
    );
  });

  if (matchingBlocks.length === 0) return null;

  matchingBlocks.sort((a, b) => b.y - a.y);
  return matchingBlocks[0];
}

function snapPlayerToSurface() {
  const block = getBlockUnderPlayer(player.position);

  if (block) {
    player.position.y = block.y + 0.5 + playerHeightOffset;
  }
}

function updatePlayer() {
  const moveSpeed = 0.05;
  const turnSpeed = 0.04;

  player.userData.anim.mode = "idle";

  if (keys.ArrowLeft) {
    player.rotation.y += turnSpeed;
    player.userData.anim.mode = "turnLeft";
  }

  if (keys.ArrowRight) {
    player.rotation.y -= turnSpeed;
    player.userData.anim.mode = "turnRight";
  }

  const forward = new THREE.Vector3(0, 0, 1);
  forward.applyQuaternion(player.quaternion);
  forward.y = 0;
  forward.normalize();

  let movement = new THREE.Vector3(0, 0, 0);

  if (keys.ArrowUp) {
    movement.addScaledVector(forward, moveSpeed);
    player.userData.anim.mode = "walk";
  }

  if (keys.ArrowDown) {
    movement.addScaledVector(forward, -moveSpeed);
    player.userData.anim.mode = "back";
  }

  const currentBlock = getBlockUnderPlayer(player.position);

  if (movement.lengthSq() > 0) {
    const nextPosition = player.position.clone().add(movement);
    const nextBlock = getBlockUnderPlayer(nextPosition);

    if (currentBlock && nextBlock && canMoveBetween(currentBlock, nextBlock)) {
      player.position.x = nextPosition.x;
      player.position.z = nextPosition.z;
      player.position.y = nextBlock.y + 0.5 + playerHeightOffset;
    } else if (currentBlock) {
      const visualTarget = findVisualTarget(currentBlock, forward);

      if (visualTarget) {
        player.position.x = visualTarget.x;
        player.position.z = visualTarget.z;
        player.position.y = visualTarget.y + 0.5 + playerHeightOffset;
      }
    }
  } else {
    snapPlayerToSurface();
  }
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

//connexion entre les bloques pour bouger sur les îlots
connectVisually("4,4,-4", "-1,3,-5"); //ilot particule <--> escalier
connectVisually("4,4,-4", "4,0,-9"); //ilot au cristal <--> escalier
connectVisually("4,4,-4", "6,0,-4"); //boucle
connectVisually("6,0,-4", "-1,3,-5"); //ilot particule <--> ligne du haut du carré
connectVisually("9,0,-4", "5,0,-10"); //ilot au cristal <--> ligne du haut du carré

const crystalAccessIds = new Set([
  "4,0,-11",
  "4,0,-10",
  "5,0,-11",
  "5,0,-10"
]);

const target = new THREE.Vector3(6, 2, -5);  // plus ou moins le centre de la forme (vue centré sur le centre)

controls = new OrbitControls(camera, renderer.domElement);

setupCamera(); // UNE seule fois, après controls
controls.update();

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
  function addArm(side, name) {
  const s = side;
  const armGroup = new THREE.Group();
  armGroup.position.set(0.24 * s, 1.34, 0);
  astronaut.add(armGroup);

  function addToArm(
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
      armGroup.add(mesh);
      return mesh;
    }

    // épaule
    addToArm(
      new THREE.SphereGeometry(0.11, 18, 18),
      suitMat,
      0, 0, 0
    );

    // haut du bras
    addToArm(
      new THREE.CylinderGeometry(0.06, 0.08, 0.40, 18),
      suitMat,
      0.05 * s, -0.13, 0,
      0, 0, 0.12 * s
    );

    // bas du bras
    addToArm(
      new THREE.CylinderGeometry(0.085, 0.10, 0.30, 18),
      suitMat,
      0.10 * s, -0.56, 0,
      0, 0, 0.08 * s
    );

    // main
    addToArm(
      new THREE.SphereGeometry(0.075, 18, 18),
      suitMat,
      0.15 * s, -0.74, 0.01,
      0, 0, 0,
      0.9, 1.15, 0.8
    );

    astronaut.userData[name] = armGroup;
  }
  
  addArm(-1, "leftArm");
  addArm(1, "rightArm");
  
  // jambes
  function addLeg(side, name) {
    const s = side;
    const legGroup = new THREE.Group();
    legGroup.position.set(0.11 * s, 0.64, 0);
    astronaut.add(legGroup);

    function addToLeg(
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
      legGroup.add(mesh);
      return mesh;
    }

    // cuisse
    addToLeg(
      new THREE.CylinderGeometry(0.10, 0.105, 0.38, 18),
      suitMat,
      0, -0.19, 0
    );

    // bas de jambe
    addToLeg(
      new THREE.CylinderGeometry(0.10, 0.10, 0.34, 18),
      suitMat,
      0, -0.60, 0
    );

    astronaut.userData[name] = legGroup;
  }
  
  addLeg(-1, "leftLeg");
  addLeg(1, "rightLeg");
  
  astronaut.position.set(x, y, z);
  scene.add(astronaut);
  
  return astronaut;
}

const player = createAstronaut(9, 0.63, 1);
// le -2 c'est le sens d'apparition là il est orienté vers la gauche (donc la droite du perso)
player.rotation.y = Math.PI / -2;  
snapPlayerToSurface();

function canInteractWithCrystal() {
  const currentBlock = getBlockUnderPlayer(player.position);

  if (!currentBlock) return false;

  return crystalAccessIds.has(currentBlock.id);
}

player.userData.anim = {
  mode: "idle", // idle, walk, back, turnLeft, turnRight, reach
  phase: 0,
  reaching: false
};

function animatePlayerBody(deltaTime = 0.016) {
  const anim = player.userData.anim;
  const t = performance.now() * 0.008;

  const leftArm = player.userData.leftArm;
  const rightArm = player.userData.rightArm;
  const leftLeg = player.userData.leftLeg;
  const rightLeg = player.userData.rightLeg;

  if (!leftArm || !rightArm || !leftLeg || !rightLeg) return;

  // reset doux
  leftArm.rotation.x *= 0.8;
  rightArm.rotation.x *= 0.8;
  leftLeg.rotation.x *= 0.8;
  rightLeg.rotation.x *= 0.8;
  player.rotation.z *= 0.8;

  if (anim.mode === "walk") {
    leftArm.rotation.x = Math.sin(t) * 0.5;
    rightArm.rotation.x = -Math.sin(t) * 0.5;
    leftLeg.rotation.x = -Math.sin(t) * 0.6;
    rightLeg.rotation.x = Math.sin(t) * 0.6;
  }

  if (anim.mode === "back") {
    leftArm.rotation.x = -Math.sin(t) * 0.25;
    rightArm.rotation.x = Math.sin(t) * 0.25;
    leftLeg.rotation.x = Math.sin(t) * 0.35;
    rightLeg.rotation.x = -Math.sin(t) * 0.35;
  }

  if (anim.mode === "turnLeft") {
    player.rotation.z = Math.sin(t * 0.5) * 0.05;
    leftArm.rotation.x = 0.08;
    rightArm.rotation.x = -0.08;
  }

  if (anim.mode === "turnRight") {
    player.rotation.z = -Math.sin(t * 0.5) * 0.05;
    leftArm.rotation.x = 0.08;
    rightArm.rotation.x = -0.08;
  }

  if (anim.mode === "reach") {
    rightArm.rotation.x = -1.2;
    rightArm.rotation.z = -0.25;
    leftArm.rotation.x = 0.15;
    leftLeg.rotation.x = 0.08;
    rightLeg.rotation.x = -0.08;
  }
}

//position sur la map
const cvCrystal = createCvCrystal(4, 1.4, -11);

window.addEventListener("click", (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObject(cvCrystal, true);

  if (intersects.length > 0 && canInteractWithCrystal()) {
    openCvOverlay();
  }
});

function createCvCrystal(x, y, z) {
  const crystal = new THREE.Group();

  const mat = new THREE.LineBasicMaterial({ color: 0xffffff });

  const points = [
    new THREE.Vector3(0, 1.2, 0),   // top
    new THREE.Vector3(0, -1.2, 0),  // bottom
    new THREE.Vector3(-0.8, 0, 0),  // left
    new THREE.Vector3(0.8, 0, 0),   // right
    new THREE.Vector3(0, 0, 0.5),   // front
    new THREE.Vector3(0, 0, -0.5),  // back
  ];

  function line(a, b) {
    const geo = new THREE.BufferGeometry().setFromPoints([a, b]);
    const l = new THREE.Line(geo, mat);
    crystal.add(l);
  }

  const [top, bottom, left, right, front, back] = points;

  // structure diamant
  line(top, left);
  line(top, right);
  line(top, front);
  line(top, back);

  line(bottom, left);
  line(bottom, right);
  line(bottom, front);
  line(bottom, back);

  line(left, front);
  line(front, right);
  line(right, back);
  line(back, left);

  // coeur lumineux
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 20, 20),
    new THREE.MeshBasicMaterial({ color: 0x7fefff })
  );
  crystal.add(core);

  // glow léger
  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(0.30, 20, 20),
    new THREE.MeshBasicMaterial({
      color: 0x33ccff,
      transparent: true,
      opacity: 0.2
    })
  );
  crystal.add(glow);

  // flare / étoile
  const flare = new THREE.Sprite(
    new THREE.SpriteMaterial({
      color: 0x66ddff,
      transparent: true,
      opacity: 0.6
    })
  );
  flare.scale.set(0.8, 0.8, 0.8);
  crystal.add(flare);

  const clickHitbox = new THREE.Mesh(
    new THREE.SphereGeometry(1.2, 16, 16),
    new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0
    })
  );
  crystal.add(clickHitbox);

  crystal.position.set(x, y, z);
  crystal.scale.set(0.5, 0.5, 0.5);

  crystal.userData.core = core;
  crystal.userData.glow = glow;
  crystal.userData.flare = flare;
  crystal.userData.clickHitbox = clickHitbox;
  crystal.userData.baseY = y;

  scene.add(crystal);
  return crystal;
}

function updateBackgroundEffect() {

  if (isTouching) {
    for (let i = 0; i < 5; i++) {
      smokeParticles.push({
        x: mouseTrail.x + (Math.random() - 0.5) * 20,
        y: mouseTrail.y + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5),
        vy: (Math.random() - 0.5),
        life: 1,
        decay: 0.02,
        hue: 190
      });
    }
  }

  bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);

  for (let i = smokeParticles.length - 1; i >= 0; i--) {
    const p = smokeParticles[i];

    p.x += p.vx;
    p.y += p.vy;
    p.life -= p.decay;

    if (p.life <= 0) {
      smokeParticles.splice(i, 1);
      continue;
    }

    const pixelSize = 4 + Math.floor(Math.random() * 3); // 4 à 6 px
    const snappedX = Math.floor(p.x / pixelSize) * pixelSize;
    const snappedY = Math.floor(p.y / pixelSize) * pixelSize;

    // cube / pixel principal
    bgCtx.fillStyle = `hsla(${p.hue}, 100%, 62%, ${p.life * 0.34})`;
    bgCtx.shadowBlur = 14;
    bgCtx.shadowColor = `hsla(${p.hue}, 100%, 60%, ${p.life * 0.7})`;
    bgCtx.fillRect(snappedX, snappedY, pixelSize, pixelSize);

    // face lumineuse interne
    bgCtx.fillStyle = `hsla(${p.hue}, 100%, 78%, ${p.life * 0.22})`;
    bgCtx.fillRect(snappedX + 1, snappedY + 1, pixelSize - 2, pixelSize - 2);

    // paillette
    if (Math.random() > 0.72) {
      bgCtx.fillStyle = `rgba(255,255,255,${p.life * 0.5})`;
      bgCtx.fillRect(snappedX + pixelSize / 2, snappedY, 1, pixelSize);
      bgCtx.fillRect(snappedX, snappedY + pixelSize / 2, pixelSize, 1);
    }

    bgCtx.shadowBlur = 0;
  }
}

function updateCvCrystal() {
  const time = performance.now() * 0.001;

  cvCrystal.rotation.y += 0.01;

  // flottement
  cvCrystal.position.y = cvCrystal.userData.baseY + Math.sin(time * 1.5) * 0.1;

  // respiration globale
  cvCrystal.scale.setScalar(0.5 + Math.sin(time * 2) * 0.02);

  // coeur et glow
  const pulse = 1 + Math.sin(time * 3) * 0.15;
  cvCrystal.userData.core.scale.setScalar(pulse);
  cvCrystal.userData.glow.scale.setScalar(1.3 + Math.sin(time * 3) * 0.1);

  // flare scintillant
  cvCrystal.userData.flare.scale.setScalar(0.8 + Math.sin(time * 4) * 0.2);
  cvCrystal.userData.flare.material.opacity = 0.5 + Math.sin(time * 4) * 0.2;
}

// animation du perso , cristal
function animate() {
  requestAnimationFrame(animate);

  updateBackgroundEffect();
  updatePlayer();
  animatePlayerBody();
  updateCvCrystal();
  updateVisualConnectionsEffects();

  stars.rotation.y += 0.0002;
  stars.rotation.x += 0.00005;

  // Fixé le fond "bulle"
  sky.position.copy(camera.position);

  controls.update();
  renderer.render(scene, camera);
}
  // faire bouger le perso
  const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false
  };

  window.addEventListener('resize', () => {
    setupCamera();
    renderer.setSize(window.innerWidth, window.innerHeight);
    resizeBgCanvas();
  });

  window.addEventListener("keydown", (event) => {
    if (event.key in keys) {
      keys[event.key] = true;
    }
  });

  window.addEventListener("keyup", (event) => {
    if (event.key in keys) {
      keys[event.key] = false;
    }
  });

  document.body.addEventListener("touchmove", (e) => {
    e.preventDefault();
  }, { passive: false });
  
  window.addEventListener("touchstart", () => {
    isTouching = true;
  });

  window.addEventListener("touchend", () => {
    isTouching = false;
  });

animate();