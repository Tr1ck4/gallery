<template>
  <div>
    <div ref="sceneContainer" class="three-container" :class="{ 'fade-out': isFadingOut }"></div>
    <video id="fullscreen-video" controls ref="fullscreenVideo" :class="{ 'fade-in': isFadingIn }">
      <source src="/assets/random.mp4" type="video/mp4">
      Your browser does not support the video tag.
    </video>
    <button id="exit-button" ref="exitButton" @click="exitFullscreen" :class="{ 'fade-in': isButtonVisible }">
      Exit Fullscreen
    </button>
    <button id="toggle-button" ref="toggleButton" @click="enterFPSMode">
      something
    </button>

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
      controls: null,
      isFPSMode: false,
      isFadingIn: false,
      isFadingOut: false,
      isButtonVisible: false,
      isTooltip: false,
      torus: null,
      keys: {},
      stats: new Stats(),
    };
  },
  mounted() {
    this.initThreeScene();
    this.loadModel();
    //window.addEventListener('resize', this.onWindowResize);
    // window.addEventListener('keydown', this.onKeyDown);

    document.addEventListener('keydown', this.keyDownHandler);
    document.addEventListener('keyup', this.keyUpHandler);
  },
  methods: {
    initThreeScene() {
      
      const scene = new THREE.Scene();
      scene.background = new THREE.Color( 0xcccccc );
      scene.fog = new THREE.FogExp2( 0xcccccc, 0.002 );

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
      this.controls.maxDistance = 500;

      this.controls.maxPolarAngle = Math.PI/2;

      // Importing map texture
      const texture_1 = new THREE.TextureLoader().load(wall_1);
      texture_1.colorSpace = THREE.SRGBColorSpace;
      
      const texture_2 = new THREE.TextureLoader().load(wall_2);
      texture_2.colorSpace = THREE.SRGBColorSpace;
      
      const texture_3 = new THREE.TextureLoader().load(wall_3);
      texture_3.colorSpace = THREE.SRGBColorSpace;

      const house_1 = new THREE.MeshPhongMaterial({ map: texture_1, flatShading: true });
      const house_2 = new THREE.MeshPhongMaterial({ map: texture_2, flatShading: true });
      const house_3 = new THREE.MeshPhongMaterial({ map: texture_3, flatShading: true });
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
    loadModel() {
      const loader = new GLTFLoader();
      loader.load('assets/Soldier.glb', (gltf) => {
        let model = gltf.scene;

        if (gltf.animations.length > 0) {
          this.mixer = new THREE.AnimationMixer(model);

          // Access animations by their index or name
          this.actions.idle = this.mixer.clipAction(gltf.animations[0]); 
          this.actions.walk = this.mixer.clipAction(gltf.animations[3]); 
          this.actions.run = this.mixer.clipAction(gltf.animations[1]); 

          // Play idle action
          this.actions.idle.play();
          this.currentAction = this.actions.idle;
        } else {
          console.error("No animations found in the model.");
        }

        model.traverse((child) => {
          if (child.isMesh) child.castShadow = true;
        });

        this.model = model;
        this.scene.add(model);
      });

    },
    animate() {
      
      const clock = new THREE.Clock();
      this.controls.update();
      const renderLoop = () => {
        const delta = clock.getDelta();
        if (this.mixer) this.mixer.update(delta);

        let moveDirection = new THREE.Vector3();
        if (this.keys['W']) moveDirection.z -= 1;
        if (this.keys['S']) moveDirection.z += 1;
        if (this.keys['A']) moveDirection.x -= 1;
        if (this.keys['D']) moveDirection.x += 1;


        if (moveDirection.length() > 0) {
          moveDirection.normalize().multiplyScalar(0.05);
          this.model.position.add(moveDirection);

          // Rotate the model to face the direction of movement
          this.model.rotation.y = Math.atan2(-moveDirection.x, -moveDirection.z);

          if (this.currentAction !== this.actions.walk) {
            this.currentAction.stop();
            this.currentAction = this.actions.walk;
            this.currentAction.play();
          }
        } else {
          if (this.currentAction !== this.actions.idle) {
            this.currentAction.stop();
            this.currentAction = this.actions.idle;
            this.currentAction.play();
          }
        }

        // const bounder = new THREE.Box3().setFromObject(this.torus);
        // if( this.model != null) this.checkCollider(this.torus, bounder, this.model);
        // Render the scene
        this.renderer.render(this.scene, this.camera);
        this.stats.update();
        requestAnimationFrame(renderLoop);
      };
      renderLoop();
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
    toggleFPSMode() {
      if (this.isFPSMode) {
        this.exitFPSMode();
      } else {
        this.enterFPSMode();
      }
    },
    enterFPSMode() {
      document.removeEventListener('keydown', this.keyDownHandler);
      document.removeEventListener('keyup', this.keyUpHandler);

      let textures = [texture_1, texture_2, texture_3, texture_3, texture_3];
      let materials = [];
      for (let i = 0; i < textures.length; i++) {
        const texture = new THREE.TextureLoader().load(textures[i]);
        const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: 1 });
        materials.push(material);
      }

      const cubeGeometry = new THREE.BoxGeometry(2, 1, 0.1);
      let blocks = [];
      for (let i = 0; i < materials.length; i++) {
        const block = new THREE.Mesh(cubeGeometry, materials[i]);
        blocks.push(block);
      }

      const a = 0.2;
      const b = 0;
      const c = 0;    

      const positions = [
        { x: -1.2 },
        { x: 1 },
        { x: 3.2 },
        { x: 5.4 },
        { x: 8 }
      ];

      positions.forEach((pos, index) => {
        const z = a * Math.pow(pos.x - 1, 2) + b * pos.x + c;
        const block = blocks[index];
        block.position.set(pos.x, 2, z);

        const slope = 2 * a * (pos.x - 1) + b;
        const angle = Math.atan(slope);
        block.rotation.y = -angle;

        this.scene.add(block);
      });

      let isDragging = false;
      let prevMousePosition = { x: 0, y: 0 };

      const onMouseDown = (event) => {
        isDragging = true;
        prevMousePosition = { x: event.clientX || event.touches[0].clientX, y: event.clientY || event.touches[0].clientY };
      };

      const onMouseMove = (event) => {
        if (!isDragging) return;

        // Use touch or mouse coordinates
        const currentX = event.clientX || event.touches[0].clientX;
        const deltaX = currentX - prevMousePosition.x;

        positions.forEach((pos) => {
          pos.x += deltaX * 0.01; // Adjust sensitivity
        });

        prevMousePosition = { x: currentX, y: event.clientY || event.touches[0].clientY };
      };

      const onMouseUp = () => {
        isDragging = false;
      };

      // Add both mouse and touch event listeners
      document.addEventListener('mousedown', onMouseDown);
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);

      // Add touch event listeners
      document.addEventListener('touchstart', onMouseDown);
      document.addEventListener('touchmove', onMouseMove);
      document.addEventListener('touchend', onMouseUp);


      const updateBlocks = () => {
        positions.forEach((pos, index) => {
          const z = a * Math.pow(pos.x - 1, 2) + b * pos.x + c;
          const block = blocks[index];
          const currentPos = block.position;

          block.position.x += (pos.x - currentPos.x) * 0.1;
          block.position.z += (z - currentPos.z) * 0.1;

          const slope = 2 * a * (pos.x - 1) + b;
          const angle = Math.atan(slope);
          block.rotation.y += (-angle - block.rotation.y) * 0.1;
        });
      };

      const animate = () => {
        requestAnimationFrame(animate);
        updateBlocks();
        this.renderer.render(this.scene, this.camera);
      };

      animate();


      // Switch to FPS mode
      this.isFPSMode = true;
      this.controls.dispose();

      this.model.position.set(1, 0, 3);
      this.camera.position.set(1, 2, 3);
      this.camera.lookAt(1, 2, 0); // Look towards the center

      // Add buttons for the carousel
      const nextButton = document.createElement('button');
      nextButton.innerHTML = 'Next';
      nextButton.style.position = 'absolute';
      nextButton.style.top = '20px';
      nextButton.style.right = '20px';
      document.body.appendChild(nextButton);

      const prevButton = document.createElement('button');
      prevButton.innerHTML = 'Previous';
      prevButton.style.position = 'absolute';
      prevButton.style.top = '20px';
      prevButton.style.right = '80px';
      document.body.appendChild(prevButton);
    },

    exitFPSMode() {
      if (this.nextButton && this.prevButton) {
        document.body.removeChild(this.nextButton);
        document.body.removeChild(this.prevButton);
      }
      document.addEventListener('keydown', (event) => {
        this.keys[event.key.toUpperCase()] = true;
      });

      document.addEventListener('keyup', (event) => {
        this.keys[event.key.toUpperCase()] = false;
      });
      this.isFPSMode = false;
      // Restore OrbitControls
      this.controls.dispose();
      this.controls = new OrbitControls(this.camera, this.renderer.domElement);

      this.camera.position.set(10, 5, 10);
      this.camera.lookAt(0, 4, 0);

    },
    // movePlayer() {
    //   const speed = 0.1;
    //   const moveVector = new THREE.Vector3();
    //   if (this.movement.forward) moveVector.z -= speed;
    //   if (this.movement.backward) moveVector.z += speed;
    //   if (this.movement.left) moveVector.x -= speed;
    //   if (this.movement.right) moveVector.x += speed;

    //   if (moveVector.length() > 0) {
    //     moveVector.normalize();
    //     this.controls.object.position.add(moveVector);
    //     this.model.position.add(moveVector);
    //   }
    // },
    exitFullscreen() {
      this.isFadingIn = false;
      this.isFadingOut = false;
      this.isButtonVisible = false;

      const video = this.$refs.fullscreenVideo;
      video.style.display = 'none';

      this.$refs.sceneContainer.classList.remove('fade-out');
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

