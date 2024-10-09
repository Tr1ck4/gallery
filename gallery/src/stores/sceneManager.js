import * as THREE from 'three';

function makeScene(elem) {
    const scene = new THREE.Scene();
   
    const fov = 45;
    const aspect = 2;  // the canvas default
    const near = 0.1;
    const far = 5;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.z = 2;
    camera.position.set(0, 1, 2);
    camera.lookAt(0, 0, 0);
   
    {
      const color = 0xFFFFFF;
      const intensity = 1;
      const light = new THREE.DirectionalLight(color, intensity);
      light.position.set(-1, 2, 4);
      scene.add(light);
    }
   
    return {scene, camera, elem};
}

function setScene1(){
const sceneInfo = makeScene(document.querySelector("#mainscene"));
const spotLight = new THREE.SpotLight(0xff0000, 10, 10);
spotLight.position.set(1, 5, 1);
spotLight.castShadow = true;
sceneInfo.scene.add(spotLight);

const texture = new THREE.TextureLoader().load(wallTexture);
texture.wrapS = THREE.RepeatWrapping;
texture.wrapT = THREE.RepeatWrapping;

const wallMaterial = new THREE.MeshBasicMaterial({ map: texture });

const color = 0xFFFFFF;
const intensity = 100;
const light = new THREE.SpotLight( color, intensity );
light.castShadow = true;
light.position.set( 5, 20, 5 );
light.target.position.set( - 4, 0, - 4 );

const SpotLightHelper = new THREE.SpotLightHelper(light);
sceneInfo.scene.add( light );
sceneInfo.scene.add( light.target );
sceneInfo.scene.add( SpotLightHelper);

const mesh = new THREE.Mesh( new THREE.PlaneGeometry( 100, 100 ), new THREE.MeshPhongMaterial( { color: 0xcbcbcb, depthWrite: false } ) );
mesh.rotation.x = - Math.PI / 2;
mesh.receiveShadow = true;
sceneInfo.scene.add( mesh );

const wall_1 = new THREE.BoxGeometry(10, 10, 1);
const wall_1_prefab = new THREE.Mesh(wall_1, new THREE.MeshBasicMaterial({ color: '#ffff00' }));
wall_1_prefab.position.set(0, 4.5, -5.5);
wall_1_prefab.castShadow = true;
sceneInfo.scene.add(wall_1_prefab);

const wall_2 = new THREE.BoxGeometry(1, 10, 10);
const wall_2_prefab = new THREE.Mesh(wall_2, new THREE.MeshBasicMaterial({ color: '#ffff00' }));
wall_2_prefab.position.set(-5.5, 4.5, 0);
wall_2_prefab.castShadow = true;
sceneInfo.scene.add(wall_2_prefab);

const frame_1 = new THREE.BoxGeometry(1, 1, 0.1);
const frame_1_prefab = new THREE.Mesh(frame_1, wallMaterial);
frame_1_prefab.position.set(2, 4, -5);
sceneInfo.scene.add(frame_1_prefab);

const frame_2_prefab = new THREE.Mesh(frame_1, wallMaterial);
frame_2_prefab.position.set(0, 4, -5);
sceneInfo.scene.add(frame_2_prefab);

const frame_3_prefab = new THREE.Mesh(frame_1, wallMaterial);
frame_3_prefab.position.set(-2, 4, -5);
sceneInfo.scene.add(frame_3_prefab);

const area = new THREE.TorusGeometry(1,0.1,16,100);
const material = new THREE.MeshBasicMaterial({color: 0xffff00});
const torus = new THREE.Mesh(area, material);
torus.position.set(1,0,3);
torus.rotation.x = 1.6;

sceneInfo.scene.add(torus);


const video = document.createElement('video');
video.src = 'assets/random.mp4'; 
video.crossOrigin = 'anonymous'; 
video.loop = true;
video.muted = true;
video.playsInline = true;
video.autoplay = true;
video.play();

const videoTexture = new THREE.VideoTexture(video);

const videoMaterial = new THREE.MeshBasicMaterial({ map: videoTexture });

const sideMaterial1 = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const sideMaterial2 = new THREE.MeshBasicMaterial({ color: 0x00ff00 }); 
const sideMaterial3 = new THREE.MeshBasicMaterial({ color: 0x0000ff }); 
const sideMaterial4 = new THREE.MeshBasicMaterial({ color: 0xffff00 }); 
const sideMaterial5 = new THREE.MeshBasicMaterial({ color: 0x00ffff }); 

const materials = [
videoMaterial,  
sideMaterial2,  
sideMaterial1,  
sideMaterial3,  
sideMaterial4,  
sideMaterial5   
];

const geometry = new THREE.BoxGeometry(0.5, 6, 9);
const cube = new THREE.Mesh(geometry, materials);
cube.position.set(-5,5,0);
sceneInfo.scene.add(cube);

return sceneInfo;
}

function setupScene2() {
    const sceneInfo = makeScene(document.querySelector('#pyramid'));
    const radius = .8;
    const widthSegments = 4;
    const heightSegments = 2;
    const geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
    const material = new THREE.MeshPhongMaterial({
        color: 'blue',
        flatShading: true,
    });
    const mesh = new THREE.Mesh(geometry, material);
    sceneInfo.scene.add(mesh);
    sceneInfo.mesh = mesh;
    return sceneInfo;
}

function renderSceneInfo(sceneInfo) {
  const {scene, camera, elem} = sceneInfo;
 
  // get the viewport relative position of this element
  const {left, right, top, bottom, width, height} =
      elem.getBoundingClientRect();
 
  const isOffscreen =
      bottom < 0 ||
      top > renderer.domElement.clientHeight ||
      right < 0 ||
      left > renderer.domElement.clientWidth;
 
  if (isOffscreen) {
    return;
  }
 
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
 
  const positiveYUpBottom = canvasRect.height - bottom;
  renderer.setScissor(left, positiveYUpBottom, width, height);
  renderer.setViewport(left, positiveYUpBottom, width, height);
 
  renderer.render(scene, camera);
}

function render(time) {
time *= 0.001;

resizeRendererToDisplaySize(renderer);

renderer.setScissorTest(false);
renderer.clear(true, true);
renderer.setScissorTest(true);

sceneInfo1.mesh.rotation.y = time * .1;
sceneInfo2.mesh.rotation.y = time * .1;

renderSceneInfo(sceneInfo1);
renderSceneInfo(sceneInfo2);

requestAnimationFrame(render);
}