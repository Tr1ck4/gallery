<template>
  <div>
    <div ref="sceneContainer" class="three-container" :class="{ 'fade-out': isFadingOut }"></div>
    <video id="fullscreen-video" controls ref="fullscreenVideo" :class="{ 'fade-in': isFadingIn}">
      <source src="/assets/random.mp4" type="video/mp4">
      Your browser does not support the video tag.
    </video>
    <button id="exit-button" ref="exitButton" @click="exitFullscreen" :class="{ 'fade-in': isButtonVisible }">
      Exit Fullscreen
    </button>
  </div>
</template>

<script>
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import wallTexture from '../assets/khazik.png';
import { camelize, render } from 'vue';

export default {
  data() {
    return {
      model: null,
      isFadingOut: false,
      isFadingIn: false,
      isButtonVisible: false,
      mixer: null,
      idleAction: null,
      walkAction: null,
      runAction: null,
      currentAction: null,
      camera: null,
      renderer: null,
    };
  },
  mounted() {
    const scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 100);
    this.camera.position.set(10, 5, 10);
    this.camera.lookAt(0, 4, 0);
    
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.shadowMap.enabled = true;
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.$refs.sceneContainer.appendChild(this.renderer.domElement);
    
    //free transform camera
    const controls = new OrbitControls(this.camera, this.renderer.domElement);

    scene.background = new THREE.Color(0xffffff);
    // scene.fog = new THREE.Fog(0xffffff, 10, 50); //fog edge

    // <----- Lighting part -----> 
    // Sun light
    // const directionLight = new THREE.DirectionalLight(0xfffffff, 0.5);
    // directionLight.castShadow = true;
    // directionLight.target.position.set(1,3,1);
    // directionLight.position.set(5,10,0);

    // directionLight.shadow.mapSize.width = 512; // default
    // directionLight.shadow.mapSize.height = 512; // default
    // directionLight.shadow.camera.near = 0.5; // default
    // directionLight.shadow.camera.far = 500; // default

    // const directionLightHelper = new THREE.DirectionalLightHelper(directionLight);
    // scene.add(directionLight);
    // scene.add(directionLightHelper);

    //Spot light
    // const spotLight = new THREE.SpotLight(0xff0000, 1, 10);
    // spotLight.position.set(1, 5, 1);

    // const spotLightTarget = new THREE.Object3D();
    // spotLightTarget.position.set(1, 1, 1);
    // scene.add(spotLightTarget);
    // spotLight.target = spotLightTarget;

    // spotLight.castShadow = true;
    // spotLight.shadow.mapSize.width = 1024;
    // spotLight.shadow.mapSize.height = 1024;

    // spotLight.shadow.camera.near = 0.5;
    // spotLight.shadow.camera.far = 100;
    // spotLight.shadow.camera.fov = 30;

    // const spotLightHelper = new THREE.SpotLightHelper(spotLight);
    // scene.add(spotLightHelper);
    // scene.add(spotLight);


    // <----- Frame resizing ----->

    window.addEventListener('resize', this.onWindowResize());

    // <------ Load model ------>
    const loader = new GLTFLoader();
    loader.load(
      'assets/Soldier.glb',
      (gltf) => {
        let model = gltf.scene;
        
        model.traverse( function (child){
          if (child.isMesh){
            child.castShadow = true;
          }
        })

        const animations = gltf.animations;
        this.mixer = new THREE.AnimationMixer(model);

        this.idleAction = this.mixer.clipAction(animations[0]);
        this.walkAction = this.mixer.clipAction(animations[3]);
        this.runAction = this.mixer.clipAction(animations[1]);

        this.idleAction.setLoop(THREE.LoopRepeat, Infinity).timeScale = 0.03;
        this.walkAction.setLoop(THREE.LoopRepeat, Infinity).timeScale = -1;
        this.runAction.setLoop(THREE.LoopRepeat, Infinity);

        this.currentAction = this.idleAction;
        this.currentAction.play();

        scene.add(model);

        const clock = new THREE.Clock();
        let keys = {};


        const animate = () => {
          const delta = clock.getDelta();
          if (this.mixer) {
            this.mixer.update(delta);
          }

          let moveDirection = new THREE.Vector3();
          if (keys['W']) moveDirection.z -= 1;
          if (keys['S']) moveDirection.z += 1;
          if (keys['A']) moveDirection.x -= 1;
          if (keys['D']) moveDirection.x += 1;

          if (moveDirection.length() > 0) {
            moveDirection.normalize().multiplyScalar(0.05); 

            model.position.add(moveDirection);

            model.rotation.y = Math.atan2(-moveDirection.x, -moveDirection.z);

            this.camera.position.x += moveDirection.x;
            this.camera.position.z += moveDirection.z;
            this.camera.lookAt(model.position);

            if (this.currentAction !== this.walkAction) {
              this.currentAction.stop();
              this.currentAction = this.walkAction;
              this.currentAction.play();
            }
          } else {
            if (this.currentAction !== this.idleAction) {
              this.currentAction.stop();
              this.currentAction = this.idleAction;
              this.currentAction.play();
            }
          }

          
        };

        document.addEventListener('keydown', (event) => {
          keys[event.key.toUpperCase()] = true;
        });

        document.addEventListener('keyup', (event) => {
          keys[event.key.toUpperCase()] = false;
        });

        this.renderer.render(scene, this.camera);
        this.renderer.setAnimationLoop(animate);
      },
      undefined,
      (error) => {
        console.error('An error happened while loading the model:', error);
      }
    );

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
		scene.add( light );
		scene.add( light.target );
    scene.add( SpotLightHelper);
  
    const mesh = new THREE.Mesh( new THREE.PlaneGeometry( 100, 100 ), new THREE.MeshPhongMaterial( { color: 0xcbcbcb, depthWrite: false } ) );
    mesh.rotation.x = - Math.PI / 2;
    mesh.receiveShadow = true;
    scene.add( mesh );

    const wall_1 = new THREE.BoxGeometry(10, 10, 1);
    const wall_1_prefab = new THREE.Mesh(wall_1, new THREE.MeshBasicMaterial({ color: '#ffff00' }));
    wall_1_prefab.position.set(0, 4.5, -5.5);
    wall_1_prefab.castShadow = true;
    scene.add(wall_1_prefab);

    const wall_2 = new THREE.BoxGeometry(1, 10, 10);
    const wall_2_prefab = new THREE.Mesh(wall_2, new THREE.MeshBasicMaterial({ color: '#ffff00' }));
    wall_2_prefab.position.set(-5.5, 4.5, 0);
    wall_2_prefab.castShadow = true;
    scene.add(wall_2_prefab);

    const frame_1 = new THREE.BoxGeometry(1, 1, 0.1);
    const frame_1_prefab = new THREE.Mesh(frame_1, wallMaterial);
    frame_1_prefab.position.set(2, 4, -5);
    scene.add(frame_1_prefab);

    const frame_2_prefab = new THREE.Mesh(frame_1, wallMaterial);
    frame_2_prefab.position.set(0, 4, -5);
    scene.add(frame_2_prefab);

    const frame_3_prefab = new THREE.Mesh(frame_1, wallMaterial);
    frame_3_prefab.position.set(-2, 4, -5);
    scene.add(frame_3_prefab);

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
    scene.add(cube);

    const animate = () => {
      if (this.mixer) {
        this.mixer.update(1);
      }
      this.renderer.render(scene, this.camera);
      requestAnimationFrame(animate);
    };

    animate();

    const onClick = (event) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, this.camera);
      const intersects = raycaster.intersectObject(cube);

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

    // Listen for click events
    window.addEventListener('click', onClick);
  },
  methods: {
    onWindowResize(){
      const width = window.innerWidth;
      const height = window.innerHeight;
      this.renderer.setSize(width, height);
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
    },
    exitFullscreen() {
      this.isFadingIn = false;
      this.isFadingOut = false;
      this.isButtonVisible = false;

      const video = this.$refs.fullscreenVideo;
      video.style.display = 'none';

      this.$refs.sceneContainer.classList.remove('fade-out');
    }
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
  
  #exit-button {
    position: absolute;
    top:0;
    z-index: 20;
    display:none;
  }

  #exit-button.fade-in{
    display:block;
  }
</style>

