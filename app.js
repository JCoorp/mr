var canvas = document.getElementById('viewer');
var card = document.querySelector('.viewerCard');
var msg = document.getElementById('message');
var dot = document.getElementById('statusDot');
var loader = document.getElementById('loader');
var err = document.getElementById('errorBox');
var resetBtn = document.getElementById('resetView');
var rotateBtn = document.getElementById('toggleRotate');
var moveBtn = document.getElementById('toggleKeyboardMove');
var fullscreenBtn = document.getElementById('fullscreenBtn');

function setStatus(t, type) {
  msg.textContent = t;
  dot.classList.remove('loading', 'error');
  if (type === 'loading') dot.classList.add('loading');
  if (type === 'error') dot.classList.add('error');
}
function show(el, v) { el.classList.toggle('hidden', !v); }
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
scene.fog = new THREE.Fog(0x090b17, 18, 75);

var camera = new THREE.PerspectiveCamera(43, 1, 0.01, 2000);
camera.position.set(9, 6, 10);

var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
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
controls.autoRotateSpeed = 0.45;
controls.minDistance = 3;
controls.maxDistance = 60;

scene.add(new THREE.HemisphereLight(0xeaf0ff, 0x1b2038, 2.3));
var sun = new THREE.DirectionalLight(0xffffff, 3.2);
sun.position.set(10, 14, 9);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = -20;
sun.shadow.camera.right = 20;
sun.shadow.camera.top = 20;
sun.shadow.camera.bottom = -20;
scene.add(sun);
var fill = new THREE.DirectionalLight(0x8fdcff, 1.25);
fill.position.set(-8, 5, -7);
scene.add(fill);
var neonLight = new THREE.PointLight(0x42f5ff, 4, 18, 2);
neonLight.position.set(0, 5, 4);
scene.add(neonLight);

function mat(color, rough, metal) {
  return new THREE.MeshStandardMaterial({ color: color, roughness: rough === undefined ? 0.75 : rough, metalness: metal || 0 });
}
var MAT = {
  grass: mat(0x2f7d43, 0.95, 0),
  wall: mat(0xd8d1c3, 0.82, 0),
  roof: mat(0x282c34, 0.68, 0.05),
  glass: new THREE.MeshStandardMaterial({ color: 0x6fc8ff, roughness: 0.08, metalness: 0.05, transparent: true, opacity: 0.48 }),
  black: mat(0x11141b, 0.55, 0.02),
  wood: mat(0x7a4a28, 0.58, 0),
  concrete: mat(0xe6e0d8, 0.45, 0.01),
  column: mat(0xf3f0e8, 0.55, 0),
  neonBlue: new THREE.MeshStandardMaterial({ color: 0x31f4ff, emissive: 0x31f4ff, emissiveIntensity: 2.2 }),
  neonPink: new THREE.MeshStandardMaterial({ color: 0xff4bd8, emissive: 0xff4bd8, emissiveIntensity: 2.1 })
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
function cyl(name, x, y, z, r, h, material) {
  var geo = new THREE.CylinderGeometry(r, r, h, 24);
  var mesh = new THREE.Mesh(geo, material);
  mesh.name = name;
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}
function windowBlock(x, y, z, w, h, side) {
  var frameDepth = 0.10;
  if (side === 'front') {
    box('ventana vidrio', x, y, z, w, h, 0.06, MAT.glass);
    box('marco superior', x, y + h/2 + .06, z + .01, w + .18, .08, frameDepth, MAT.black);
    box('marco inferior', x, y - h/2 - .06, z + .01, w + .18, .08, frameDepth, MAT.black);
    box('marco izq', x - w/2 - .06, y, z + .01, .08, h + .18, frameDepth, MAT.black);
    box('marco der', x + w/2 + .06, y, z + .01, .08, h + .18, frameDepth, MAT.black);
  } else {
    box('ventana lateral vidrio', x, y, z, 0.06, h, w, MAT.glass);
    box('marco lateral sup', x, y + h/2 + .06, z, frameDepth, .08, w + .18, MAT.black);
    box('marco lateral inf', x, y - h/2 - .06, z, frameDepth, .08, w + .18, MAT.black);
    box('marco lateral a', x, y, z - w/2 - .06, frameDepth, h + .18, .08, MAT.black);
    box('marco lateral b', x, y, z + w/2 + .06, frameDepth, h + .18, .08, MAT.black);
  }
}

function createHouse() {
  box('terreno', 0, -0.06, 0, 14, .12, 10, MAT.grass);
  box('camino', 0, 0.01, 4.25, 2.2, .08, 3.9, MAT.concrete);
  box('banqueta frente', 0, 0.02, 2.45, 7.4, .10, .65, MAT.concrete);

  box('planta baja', 0, 1.15, 0, 6.6, 2.3, 4.7, MAT.wall);
  box('segundo piso', 0, 3.55, -0.12, 6.3, 2.25, 4.35, MAT.wall);

  box('techo primer nivel', 0, 2.42, 0, 7.05, .32, 5.12, MAT.roof);
  box('techo superior', 0, 4.83, -0.12, 6.85, .35, 4.85, MAT.roof);
  box('volado frontal', 0, 4.72, 2.75, 7.15, .22, .7, MAT.roof);

  box('puerta', 0, 0.9, 2.39, 1.05, 1.75, .10, MAT.wood);
  box('marco puerta', 0, 0.92, 2.46, 1.28, 1.98, .12, MAT.black);
  box('panel puerta', 0, 0.9, 2.52, .85, 1.55, .06, MAT.wood);
  cyl('manija', .36, .92, 2.58, .055, .08, MAT.black).rotation.x = Math.PI/2;

  windowBlock(-2.0, 1.18, 2.42, 1.2, .85, 'front');
  windowBlock(2.05, 1.18, 2.42, 1.2, .85, 'front');
  windowBlock(-1.8, 3.58, 2.23, 1.25, .82, 'front');
  windowBlock(1.8, 3.58, 2.23, 1.25, .82, 'front');
  windowBlock(3.35, 1.3, -.75, 1.2, .85, 'side');
  windowBlock(3.2, 3.62, -.9, 1.25, .85, 'side');

  box('balcon base', 0, 2.72, 2.55, 3.9, .16, .75, MAT.concrete);
  box('barandal balcon', 0, 3.12, 2.92, 3.75, .16, .10, MAT.black);
  for (var i = -3; i <= 3; i++) box('barrote balcon', i * .55, 2.95, 2.92, .08, .5, .08, MAT.black);

  cyl('columna izquierda', -2.85, 1.25, 2.62, .16, 2.3, MAT.column);
  cyl('columna derecha', 2.85, 1.25, 2.62, .16, 2.3, MAT.column);

  box('neon azul', 0, 2.58, 2.66, 5.5, .055, .055, MAT.neonBlue);
  box('neon rosa', 0, 2.75, 2.68, 3.8, .055, .055, MAT.neonPink);

  for (var s = 0; s < 4; s++) box('escalon '+s, 0, .06 + s*.10, 3.15 + s*.28, 1.8 + s*.18, .10, .35, MAT.concrete);

  box('jardinera izquierda', -4.7, .25, 1.4, 1.05, .5, .55, MAT.concrete);
  box('jardinera derecha', 4.7, .25, -1.7, 1.05, .5, .55, MAT.concrete);
  for (var p = 0; p < 5; p++) {
    cyl('planta izq '+p, -5.05 + p*.18, .68, 1.35, .035, .55 + Math.random()*.25, MAT.grass);
    cyl('planta der '+p, 4.35 + p*.18, .68, -1.7, .035, .55 + Math.random()*.25, MAT.grass);
  }

  var grid = new THREE.GridHelper(18, 18, 0x57f7ff, 0x39415c);
  grid.material.transparent = true;
  grid.material.opacity = .12;
  grid.position.y = .01;
  scene.add(grid);
}

createHouse();

var initialCamera = { pos: camera.position.clone(), target: new THREE.Vector3(0, 2.4, 0) };
controls.target.copy(initialCamera.target);
controls.update();
show(loader, false);
setStatus('Casa simple lista.', 'ready');

var keyboardMoveEnabled = true;
var pressed = {};
var clock = new THREE.Clock();

function resize() {
  var w = card.clientWidth;
  var h = card.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
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
  if (move.lengthSq() === 0) return;
  move.normalize().multiplyScalar((pressed.shift ? 5 : 2.1) * dt);
  camera.position.add(move);
  controls.target.add(move);
  controls.update();
}
window.addEventListener('keydown', function(e) {
  var k = e.key.toLowerCase();
  if (['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d','shift'].indexOf(k) >= 0) {
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
  controls.update();
  renderer.render(scene, camera);
}
resize();
animate();
