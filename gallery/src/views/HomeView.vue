<template>
  <div>
    <div ref="sceneContainer" class="three-container" :class="{ 'fade-out': isFadingOut }"></div>
    <video id="fullscreen-video" controls ref="fullscreenVideo" :class="{ 'fade-in': isFadingIn }">
      <source src="/assets/random.mp4" type="video/mp4">
      Your browser does not support the video tag.
    </video>

    <div class="tooltip" :class="{ 'visible': isTooltip }"> Press space to enter new mode</div>
  </div>
</template>


<script>
import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MapControls } from 'three/addons/controls/MapControls.js';
import wallTexture from '../assets/khazik.png';
import texture_1 from '../assets/1.jpeg';
import texture_2 from '../assets/2.jpg';
import texture_3 from '../assets/3.jpg';
import wall_1 from '../assets/wall1.jpg';
import wall_2 from '../assets/wall2.jpg';
import wall_3 from '../assets/wall3.jpg';

export default {
  data() {
    return {
      mouse: new THREE.Vector2(),
      model: null,
      mixer: null,
      actions: {
        idle: null,
        walk: null,
        run: null
      },
      currentAction: null,
      camera: null,
      renderer: null,
      raycaster: new THREE.Raycaster(),
      pointer: new THREE.Vector2(),
      controls: null,
      isFPSMode: false,
      isFadingIn: false,
      isFadingOut: false,
      isButtonVisible: false,
      isTooltip: false,
      torus: null,
      keys: {},
      INTERSECTED: null,
      stats: new Stats(),
    };
  },
  mounted() {
    this.initThreeScene();
    window.addEventListener('resize', this.onWindowResize);
    document.addEventListener( 'mousemove', this.onMouseMove );
    // window.addEventListener('keydown', this.onKeyDown);

    document.addEventListener('keydown', this.keyDownHandler);
    document.addEventListener('keyup', this.keyUpHandler);
  },
  methods: {
    onMouseMove(event){
      this.pointer.x = (event.clientX / window.innerWidth) *2 -1;
      this.pointer.y = - (event.clientY / window.innerHeight) *2 + 1;
      
    },
    initThreeScene() {
      
      const scene = new THREE.Scene();
      scene.background = new THREE.Color( 0xcccccc );
      scene.fog = new THREE.FogExp2( 0xcccccc, 0.02 );

      // Renderer Setup
      this.renderer = new THREE.WebGLRenderer({ antialias: false });
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setPixelRatio( window.devicePixelRatio);
      this.renderer.setAnimationLoop( this.animate );
      this.$refs.sceneContainer.appendChild(this.renderer.domElement);

      this.stats = new Stats();
      this.$refs.sceneContainer.appendChild( this.stats.dom );
      
      // Camera Setup
      // this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 100);
      // this.camera.position.set(10, 5, 10);
      // this.camera.lookAt(0, 4, 0);

      this.camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 100 );
      this.camera.position.set( 0, 20, - 40 );

      // Orbit Controls
      this.controls = new MapControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.screenSpacePanning = false;
      this.controls.minDistance = 50;
      this.controls.maxDistance = 100;

      this.controls.maxPolarAngle = Math.PI/2;

      // Importing map texture
      const texture_1 = new THREE.TextureLoader().load(wall_1);
      texture_1.colorSpace = THREE.SRGBColorSpace;
      
      const texture_2 = new THREE.TextureLoader().load(wall_2);
      texture_2.colorSpace = THREE.SRGBColorSpace;
      
      const texture_3 = new THREE.TextureLoader().load(wall_3);
      texture_3.colorSpace = THREE.SRGBColorSpace;

      const house_1 = new THREE.MeshLambertMaterial({ map: texture_1, flatShading: true });
      const house_2 = new THREE.MeshLambertMaterial({ map: texture_2, flatShading: true });
      const house_3 = new THREE.MeshLambertMaterial({ map: texture_3, flatShading: true });
      const house_texture = [house_1, house_2, house_3];

      // Init house value
      const block = new THREE.BoxGeometry();
			block.translate( 0, 0.5, 0 );

      // Generating map
      for (let i = 0 ; i < 500 ; i++) {
        const mesh = new THREE.Mesh(block, house_texture[Math.random( house_texture.length)]);
        mesh.position.x = Math.random() * 160 - 80;
        mesh.position.y = 0;
        mesh.position.z = Math.random() * 160 - 80;
        mesh.scale.x = 2;
        mesh.scale.y = Math.random() * 8 + 1;
        mesh.scale.z = 2;
        mesh.updateMatrix();
        mesh.matrixAutoUpdate = false;
        scene.add(mesh);

      }

      // Lighting
      const dirLight1 = new THREE.DirectionalLight( 0xffffff, 3 );
      dirLight1.position.set( 1, 1, 1 );
      scene.add( dirLight1 );

      const dirLight2 = new THREE.DirectionalLight( 0x002288, 3 );
      dirLight2.position.set( - 1, - 1, - 1 );
      scene.add( dirLight2 );

      const ambientLight = new THREE.AmbientLight( 0x555555 );
      scene.add( ambientLight );

      // const area = new THREE.TorusGeometry(1,0.1,16,100);
      // const material = new THREE.MeshBasicMaterial({color: 0xffff00});
      // const torus = new THREE.Mesh(area, material);
      // torus.position.set(1,0,3);
      // torus.rotation.x = 1.6;

      // scene.add(torus);
      // this.torus = torus;


      // const video = document.createElement('video');
      // video.src = 'assets/random.mp4'; 
      // video.crossOrigin = 'anonymous'; 
      // video.loop = true;
      // video.muted = true;
      // video.playsInline = true;
      // video.autoplay = true;
      // video.play();

      // const videoTexture = new THREE.VideoTexture(video);

      // const videoMaterial = new THREE.MeshBasicMaterial({ map: videoTexture });

      // const sideMaterial1 = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      // const sideMaterial2 = new THREE.MeshBasicMaterial({ color: 0x00ff00 }); 
      // const sideMaterial3 = new THREE.MeshBasicMaterial({ color: 0x0000ff }); 
      // const sideMaterial4 = new THREE.MeshBasicMaterial({ color: 0xffff00 }); 
      // const sideMaterial5 = new THREE.MeshBasicMaterial({ color: 0x00ffff }); 

      // const materials = [
      //   videoMaterial,  
      //   sideMaterial2,  
      //   sideMaterial1,  
      //   sideMaterial3,  
      //   sideMaterial4,  
      //   sideMaterial5   
      // ];

      // const geometry = new THREE.BoxGeometry(0.5, 6, 9);
      // const cube = new THREE.Mesh(geometry, materials);
      // cube.position.set(-5,5,0);
      // scene.add(cube);

      // const onClick = (event) => {
      //   this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      //   this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      //   this.raycaster.setFromCamera(this.mouse, this.camera);
      //   const intersects = this.raycaster.intersectObject(cube);
      //   if (intersects.length > 0) {
      //     this.isFadingOut = true;

      //     setTimeout(() => {
      //       document.getElementById('fullscreen-video').style.display = 'block';
      //       this.isFadingIn = true;
      //       document.getElementById('fullscreen-video').play();
      //       this.isButtonVisible = true;
      //     }, 1000);
      //   }
      // }
      // window.addEventListener('click', onClick);

      // Attach the scene to this
      this.scene = scene;

      // Start rendering
      this.animate();
    },
    animate() {
      const clock = new THREE.Clock();
      
      this.raycaster.setFromCamera( this.pointer, this.camera );
      const intersects = this.raycaster.intersectObjects(this.scene.children, false);
      if ( intersects.length > 0 ) {

      if ( this.INTERSECTED != intersects[ 0 ].object ) {

        if ( this.INTERSECTED ) this.INTERSECTED.material.color.setHex( this.INTERSECTED.currentHex );

        this.INTERSECTED = intersects[ 0 ].object;
        this.INTERSECTED.currentHex = this.INTERSECTED.material.color.getHex();
        this.INTERSECTED.material.color.setHex( 0xff0000 );

      }

      } else {

      if ( this.INTERSECTED ) this.INTERSECTED.material.color.setHex( this.INTERSECTED.currentHex );

      this.INTERSECTED = null;

      }

      this.controls.update();
      this.renderer.render(this.scene, this.camera);
      this.stats.update();
    },
    onWindowResize() {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    },
    onKeyDown(event) {
      if (event.code === 'Space' && this.isTooltip) {
        this.toggleFPSMode();
      }
    },
    checkCollider(torus, bounder, object){
      bounder.setFromObject(torus);
      const objectBounder = new THREE.Box3().setFromObject(object);

      if( bounder.intersectsBox(objectBounder)){
        this.isTooltip = true;
      }else{
        this.isTooltip = false;
      }
    },
    keyDownHandler(event){
      this.keys[event.key.toUpperCase()] = true;
    },
    keyUpHandler(event){
      this.keys[event.key.toUpperCase()] = false;
    },
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.onWindowResize);
    window.removeEventListener('keydown', this.onKeyDown);
  }
};
</script>


<style scoped>
  body { margin: 0; overflow: hidden; }
  canvas { display: block; }
  
  #fullscreen-video {
    position: absolute;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    display: none; 
    z-index: 10;
    opacity: 0; 
    transition: opacity 1s ease-in;
  }

  #fullscreen-video.fade-in {
    opacity: 1;
  }

  .three-container {
    width: 100vw;
    height: 100vh;
    position: relative;
    background-color: #000;
    transition: opacity 1s ease-out;
    opacity: 1;
  }

  .three-container.fade-out {
    opacity: 0;
  }

  #toggle-button {
    position: absolute;
    top:0;
    z-index: 20;
  }
  
  #exit-button {
    position: absolute;
    top:0;
    z-index: 20;
    display:none;
  }

  #exit-button.fade-in{
    display:block;
  }
  .tooltip{
    background-color: white;
    color: black;
    position: absolute;
    text-align: center;
    margin-top: 1rem;
    top:0;
    left: 50%;
    transform: translate(-50%, 0%);
    padding: 1em;
    width: fit-content;
    justify-self: center;
    height: auto;
    display: none;
  }
  .tooltip.visible{
    display: block;
  }
</style>

