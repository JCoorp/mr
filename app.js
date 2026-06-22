var MODEL_URL = 'models/casa-mejor.glb';
var canvas = document.getElementById('viewer');
var card = document.querySelector('.viewerCard');
var msg = document.getElementById('message');
var dot = document.getElementById('statusDot');
var loader = document.getElementById('loader');
var err = document.getElementById('errorBox');
var resetBtn = document.getElementById('resetView');
var rotateBtn = document.getElementById('toggleRotate');
var moveBtn = document.getElementById('toggleKeyboardMove');
var mouseLookBtn = document.getElementById('mouseLookBtn');
var fullscreenBtn = document.getElementById('fullscreenBtn');

function setStatus(t, type) {
  msg.textContent = t;
  dot.classList.remove('loading', 'error');
  if (type === 'loading') dot.classList.add('loading');
  if (type === 'error') dot.classList.add('error');
}
function show(el, v) { if (el) el.classList.toggle('hidden', !v); }
function canUseWebGL() {
  try {
    var c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
  } catch (e) { return false; }
}

if (!canUseWebGL()) {
  setStatus('Esta TV/navegador no soporta WebGL.', 'error');
  show(loader, false);
  show(err, true);
  throw new Error('WebGL no disponible');
}

var scene = new THREE.Scene();
scene.background = new THREE.Color(0x090b17);
scene.fog = new THREE.Fog(0x090b17, 22, 95);

var camera = new THREE.PerspectiveCamera(43, 1, 0.01, 2000);
camera.position.set(8, 5.2, 9);

var renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
  alpha: false,
  powerPreference: 'high-performance'
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

var controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.enablePan = true;
controls.screenSpacePanning = true;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.35;
controls.minDistance = 2;
controls.maxDistance = 90;
controls.target.set(0, 2, 0);

scene.add(new THREE.HemisphereLight(0xeaf0ff, 0x1b2038, 2.1));
var sun = new THREE.DirectionalLight(0xffffff, 3.2);
sun.position.set(12, 18, 10);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -35;
sun.shadow.camera.right = 35;
sun.shadow.camera.top = 35;
sun.shadow.camera.bottom = -35;
sun.shadow.camera.near = 0.5;
sun.shadow.camera.far = 80;
scene.add(sun);

var fill = new THREE.DirectionalLight(0x8fdcff, 1.15);
fill.position.set(-10, 7, -9);
scene.add(fill);

var accentLight = new THREE.PointLight(0x42f5ff, 2.8, 35, 2);
accentLight.position.set(0, 5.5, 4.5);
scene.add(accentLight);

var groundMat = new THREE.MeshStandardMaterial({ color: 0x293044, roughness: 0.92, metalness: 0 });
var ground = new THREE.Mesh(new THREE.CircleGeometry(28, 96), groundMat);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.015;
ground.receiveShadow = true;
scene.add(ground);

var grid = new THREE.GridHelper(56, 56, 0x57f7ff, 0x39415c);
grid.material.transparent = true;
grid.material.opacity = 0.12;
grid.position.y = 0.005;
scene.add(grid);

var loadedModel = null;
var initialCamera = { pos: camera.position.clone(), target: controls.target.clone() };

function applyModelQuality(root) {
  root.traverse(function (obj) {
    if (!obj.isMesh) return;
    obj.castShadow = true;
    obj.receiveShadow = true;
    if (obj.material) {
      var mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.forEach(function (m) {
        if (!m) return;
        m.side = THREE.FrontSide;
        m.needsUpdate = true;
      });
    }
  });
}

function fitModelToScene(root) {
  var box = new THREE.Box3().setFromObject(root);
  var size = new THREE.Vector3();
  var center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);

  var maxDim = Math.max(size.x, size.y, size.z) || 1;
  var targetSize = 10.5;
  var scale = targetSize / maxDim;
  root.scale.setScalar(scale);

  box.setFromObject(root);
  box.getCenter(center);
  root.position.sub(center);

  box.setFromObject(root);
  root.position.y += -box.min.y;

  box.setFromObject(root);
  box.getSize(size);
  box.getCenter(center);

  controls.target.set(0, Math.max(1.6, size.y * 0.45), 0);
  camera.position.set(size.x * 0.75 + 5, size.y * 0.55 + 3, size.z * 0.85 + 6);
  camera.lookAt(controls.target);
  controls.update();

  initialCamera = { pos: camera.position.clone(), target: controls.target.clone() };
}

function loadHouseModel() {
  if (!THREE.GLTFLoader) {
    setStatus('GLTFLoader no cargó. Mostrando respaldo simple.', 'error');
    createFallbackHouse();
    return;
  }

  setStatus('Cargando modelo 3D...', 'loading');
  show(loader, true);
  show(err, false);

  var gltfLoader = new THREE.GLTFLoader();
  gltfLoader.load(
    MODEL_URL,
    function (gltf) {
      loadedModel = gltf.scene;
      loadedModel.name = 'Casa mejor GLB';
      applyModelQuality(loadedModel);
      scene.add(loadedModel);
      fitModelToScene(loadedModel);
      show(loader, false);
      setStatus('Modelo 3D cargado.', 'ready');
    },
    function (xhr) {
      if (!xhr || !xhr.lengthComputable) return;
      var pct = Math.round((xhr.loaded / xhr.total) * 100);
      setStatus('Cargando modelo 3D... ' + pct + '%', 'loading');
    },
    function (error) {
      console.warn('No se pudo cargar el modelo GLB:', error);
      show(loader, false);
      setStatus('No se encontró models/casa-mejor.glb. Mostrando respaldo.', 'error');
      createFallbackHouse();
    }
  );
}

function mat(color, rough, metal) {
  return new THREE.MeshStandardMaterial({ color: color, roughness: rough === undefined ? 0.75 : rough, metalness: metal || 0 });
}
var MAT = {
  wall: mat(0xd8d1c3, 0.82, 0),
  roof: mat(0x282c34, 0.68, 0.05),
  glass: new THREE.MeshStandardMaterial({ color: 0x6fc8ff, roughness: 0.08, metalness: 0.05, transparent: true, opacity: 0.48 }),
  black: mat(0x11141b, 0.55, 0.02),
  wood: mat(0x7a4a28, 0.58, 0),
  concrete: mat(0xe6e0d8, 0.45, 0.01)
};
function box(name, x, y, z, w, h, d, material) {
  var geo = new THREE.BoxGeometry(w, h, d);
  var mesh = new THREE.Mesh(geo, material);
  mesh.name = name;
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}
function createFallbackHouse() {
  box('planta baja respaldo', 0, 1.15, 0, 6.6, 2.3, 4.7, MAT.wall);
  box('segundo piso respaldo', 0, 3.55, -0.12, 6.3, 2.25, 4.35, MAT.wall);
  box('techo primer nivel respaldo', 0, 2.42, 0, 7.05, .32, 5.12, MAT.roof);
  box('techo superior respaldo', 0, 4.83, -0.12, 6.85, .35, 4.85, MAT.roof);
  box('puerta respaldo', 0, 0.9, 2.39, 1.05, 1.75, .10, MAT.wood);
  box('ventana respaldo izquierda', -2, 1.2, 2.42, 1.2, .85, .08, MAT.glass);
  box('ventana respaldo derecha', 2, 1.2, 2.42, 1.2, .85, .08, MAT.glass);
  box('ventana respaldo superior izquierda', -1.8, 3.58, 2.23, 1.25, .82, .08, MAT.glass);
  box('ventana respaldo superior derecha', 1.8, 3.58, 2.23, 1.25, .82, .08, MAT.glass);
  controls.target.set(0, 2.4, 0);
  controls.update();
  initialCamera = { pos: camera.position.clone(), target: controls.target.clone() };
}

var keyboardMoveEnabled = true;
var mouseLookEnabled = true;
var isPointerLocked = false;
var yaw = 0;
var pitch = 0;
var mouseSensitivity = 0.0022;
var pressed = {};
var clock = new THREE.Clock();

function resize() {
  var w = card.clientWidth;
  var h = card.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
function syncMouseLookFromCamera() {
  var euler = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ');
  pitch = euler.x;
  yaw = euler.y;
}
function enterMouseLook() {
  if (!mouseLookEnabled) return;
  syncMouseLookFromCamera();
  if (canvas.requestPointerLock) canvas.requestPointerLock();
}
function updatePointerLockState() {
  isPointerLocked = document.pointerLockElement === canvas;
  controls.enabled = !isPointerLocked;
  if (mouseLookBtn) mouseLookBtn.textContent = isPointerLocked ? 'Mirada mouse: Activa' : 'Mirada mouse: Clic';
  if (!isPointerLocked) syncMouseLookFromCamera();
}
document.addEventListener('pointerlockchange', updatePointerLockState);
document.addEventListener('mousemove', function(e) {
  if (!isPointerLocked || !mouseLookEnabled) return;
  yaw -= e.movementX * mouseSensitivity;
  pitch -= e.movementY * mouseSensitivity;
  var limit = Math.PI / 2 - 0.06;
  pitch = Math.max(-limit, Math.min(limit, pitch));
  camera.quaternion.setFromEuler(new THREE.Euler(pitch, yaw, 0, 'YXZ'));
  var forward = new THREE.Vector3();
  camera.getWorldDirection(forward);
  controls.target.copy(camera.position).add(forward.multiplyScalar(5));
});
canvas.addEventListener('click', enterMouseLook);
mouseLookBtn.addEventListener('click', enterMouseLook);

function updateMove(dt) {
  if (!keyboardMoveEnabled) return;
  var forward = new THREE.Vector3();
  camera.getWorldDirection(forward);
  forward.y = 0;
  if (forward.lengthSq() > 0) forward.normalize();
  var right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();
  var move = new THREE.Vector3();
  if (pressed.arrowup || pressed.w) move.add(forward);
  if (pressed.arrowdown || pressed.s) move.sub(forward);
  if (pressed.arrowright || pressed.d) move.add(right);
  if (pressed.arrowleft || pressed.a) move.sub(right);
  if (pressed.q) move.y += 1;
  if (pressed.e) move.y -= 1;
  if (move.lengthSq() === 0) return;
  move.normalize().multiplyScalar((pressed.shift ? 5 : 2.1) * dt);
  camera.position.add(move);
  controls.target.add(move);
  camera.position.y = Math.max(0.75, camera.position.y);
  if (!isPointerLocked) controls.update();
}

window.addEventListener('keydown', function(e) {
  var k = e.key.toLowerCase();
  if (['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d','q','e','shift'].indexOf(k) >= 0) {
    e.preventDefault();
    pressed[k] = true;
  }
});
window.addEventListener('keyup', function(e) { pressed[e.key.toLowerCase()] = false; });
window.addEventListener('blur', function() { pressed = {}; });

resetBtn.addEventListener('click', function() {
  camera.position.copy(initialCamera.pos);
  controls.target.copy(initialCamera.target);
  controls.update();
  syncMouseLookFromCamera();
});
rotateBtn.addEventListener('click', function(e) {
  controls.autoRotate = !controls.autoRotate;
  e.target.textContent = 'Auto-rotación: ' + (controls.autoRotate ? 'On' : 'Off');
});
moveBtn.addEventListener('click', function(e) {
  keyboardMoveEnabled = !keyboardMoveEnabled;
  pressed = {};
  e.target.textContent = 'Movimiento libre: ' + (keyboardMoveEnabled ? 'On' : 'Off');
});
fullscreenBtn.addEventListener('click', function() {
  if (!document.fullscreenElement && card.requestFullscreen) card.requestFullscreen();
  else if (document.exitFullscreen) document.exitFullscreen();
});

window.addEventListener('resize', resize);
function animate() {
  requestAnimationFrame(animate);
  updateMove(clock.getDelta());
  if (!isPointerLocked) controls.update();
  renderer.render(scene, camera);
}

resize();
syncMouseLookFromCamera();
loadHouseModel();
animate();
