<template>
  <div>
    <canvas id="canvas1" ref="sceneContainer" class="three-container" :class="{ 'fade-out': isFadingOut }"></canvas>
    <canvas id="canvas2" ref="fpsContainer" class="fps-container" :class="{ 'fade-out': !isFadingOut }"></canvas>
    <video id="fullscreen-video" controls ref="fullscreenVideo" :class="{ 'fade-in': isFadingIn }">
      <source src="/assets/random.mp4" type="video/mp4">
      Your browser does not support the video tag.
    </video>
    <button id="exit-button" ref="exitButton" @click="exitFullscreen" :class="{ 'fade-in': isButtonVisible }">
      Exit Fullscreen
    </button>
    <!-- <button id="toggle-button" ref="toggleButton" @click="enterFPSMode">
      something
    </button> -->

    <div class="tooltip" :class="{ 'visible': isTooltip }"> Press space to enter new mode</div>
  </div>
</template>


<script>
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import wallTexture from '../assets/khazik.png';
import texture_1 from '../assets/1.jpeg';
import texture_2 from '../assets/2.jpg';
import texture_3 from '../assets/3.jpg';

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
    };
  },
  mounted() {
    this.initThreeScene();
    this.loadModel();
    this.initFPSScene();
    window.addEventListener('resize', this.onWindowResize);
    window.addEventListener('keydown', this.onKeyDown);

    document.addEventListener('keydown', this.keyDownHandler);
    document.addEventListener('keyup', this.keyUpHandler);
  },
  methods: {
    initThreeScene() {
      const canvas = document.getElementById('canvas1');
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0xffffff);

      // Camera Setup
      this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 100);
      this.camera.position.set(10, 5, 10);
      this.camera.lookAt(0, 4, 0);

      // Renderer Setup
      this.renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvas });
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.shadowMap.enabled = true;
      // this.$refs.sceneContainer.appendChild(this.renderer.domElement);

      // Orbit Controls
      this.controls = new OrbitControls(this.camera, this.renderer.domElement);

      // Lighting
      const spotLight = new THREE.SpotLight(0xff0000, 10, 10);
      spotLight.position.set(1, 5, 1);
      spotLight.castShadow = true;
      this.scene.add(spotLight);

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
      this.scene.add( light );
      this.scene.add( light.target );
      this.scene.add( SpotLightHelper);
    
      const mesh = new THREE.Mesh( new THREE.PlaneGeometry( 100, 100 ), new THREE.MeshPhongMaterial( { color: 0xcbcbcb, depthWrite: false } ) );
      mesh.rotation.x = - Math.PI / 2;
      mesh.receiveShadow = true;
      this.scene.add( mesh );

      const wall_1 = new THREE.BoxGeometry(10, 10, 1);
      const wall_1_prefab = new THREE.Mesh(wall_1, new THREE.MeshBasicMaterial({ color: '#ffff00' }));
      wall_1_prefab.position.set(0, 4.5, -5.5);
      wall_1_prefab.castShadow = true;
      this.scene.add(wall_1_prefab);

      const wall_2 = new THREE.BoxGeometry(1, 10, 10);
      const wall_2_prefab = new THREE.Mesh(wall_2, new THREE.MeshBasicMaterial({ color: '#ffff00' }));
      wall_2_prefab.position.set(-5.5, 4.5, 0);
      wall_2_prefab.castShadow = true;
      this.scene.add(wall_2_prefab);

      const frame_1 = new THREE.BoxGeometry(1, 1, 0.1);
      const frame_1_prefab = new THREE.Mesh(frame_1, wallMaterial);
      frame_1_prefab.position.set(2, 4, -5);
      this.scene.add(frame_1_prefab);

      const frame_2_prefab = new THREE.Mesh(frame_1, wallMaterial);
      frame_2_prefab.position.set(0, 4, -5);
      this.scene.add(frame_2_prefab);

      const frame_3_prefab = new THREE.Mesh(frame_1, wallMaterial);
      frame_3_prefab.position.set(-2, 4, -5);
      this.scene.add(frame_3_prefab);

      const area = new THREE.TorusGeometry(1,0.1,16,100);
      const material = new THREE.MeshBasicMaterial({color: 0xffff00});
      const torus = new THREE.Mesh(area, material);
      torus.position.set(1,0,3);
      torus.rotation.x = 1.6;

      this.scene.add(torus);
      this.torus = torus;


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
      this.scene.add(cube);

      const onClick = (event) => {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObject(cube);
        if (intersects.length > 0) {
          this.isFadingOut = true;

          setTimeout(() => {
            document.getElementById('fullscreen-video').style.display = 'block';
            this.isFadingIn = true;
            document.getElementById('fullscreen-video').play();
            this.isButtonVisible = true;
          }, 1000);
        }
      }
      window.addEventListener('click', onClick);

      const animate = () => {
        const clock = new THREE.Clock();
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

          const bounder = new THREE.Box3().setFromObject(this.torus);
          if( this.model != null) this.checkCollider(this.torus, bounder, this.model);
          // Render the scene
          this.renderer.render(this.scene, this.camera);
          requestAnimationFrame(renderLoop);
        };
        renderLoop();
      }
      animate();
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
    
    onWindowResize() {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    },
    onKeyDown(event) {
      if (event.code === 'Space' && (this.isTooltip || !this.isFPSMode )) {
        this.toggleFPSMode();
      }
    },
    toggleFPSMode() {
      if (this.isFPSMode) {
        this.isFPSMode = false;
        this.isFadingOut = true;
        document.getElementById("canvas1").style.display = "none";
        document.getElementById("canvas2").style.display = "flex";

      } else {
        this.isFPSMode = true;
        this.isFadingOut = false;
        
        document.getElementById("canvas1").style.display = "flex";
        document.getElementById("canvas2").style.display = "none";
      }
    },
    initFPSScene() {
      const canvas = document.getElementById('canvas2');
      this.fpsscene = new THREE.Scene();
      this.fpsscene.background = new THREE.Color(0x000000); 
      this.fpscamera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 100);
      document.removeEventListener('keydown', this.keyDownHandler);
      document.removeEventListener('keyup', this.keyUpHandler);

      this.fpsrenderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvas});
      this.fpsrenderer.setSize(window.innerWidth, window.innerHeight);
      this.fpsrenderer.shadowMap.enabled = true;
      // this.$refs.fpsContainer.appendChild(this.fpsrenderer.domElement);

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

        this.fpsscene.add(block);
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
        this.fpsrenderer.render(this.fpsscene, this.fpscamera);
        updateBlocks();
        requestAnimationFrame(animate);
      };

      animate();
      this.controls.dispose();

      // this.model.position.set(1, 0, 3);
      this.fpscamera.position.set(1, 2, 3);
      this.fpscamera.lookAt(1, 2, 0); // Look towards the center

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

    
    exitFullscreen() {
      this.isFadingIn = false;
      this.isFadingOut = false;
      this.isButtonVisible = false;

      const video = this.$refs.fullscreenVideo;
      video.style.display = 'none';

      this.$refs.sceneContainer.classList.remove('fade-out');
      this.initThreeScene();
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

  .fps-container {
    display: none;
    width: 100vw;
    height: 100vh;
    position: relative;
    background-color: #000;
    transition: opacity 1s ease-out;
    opacity: 1;
    z-index: 1;
  }

  .three-container {
    display:flex;
    width: 100vw;
    height: 100vh;
    position: relative;
    background-color: #000;
    transition: opacity 1s ease-out;
    opacity: 1;
    z-index: 1;
  }

  .three-container.fade-out {
    opacity: 0;
    z-index: -1;
  }

  .fps-container.fade-out {
    opacity: 0;
    z-index: -1;
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
    display: flex;
    z-index: 2;
  }
</style>

