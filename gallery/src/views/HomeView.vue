<template>
  <div>
    <div ref="sceneContainer" class="three-container" @click="playAnimation"></div>
  </div>
</template>

<script>
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export default {
  data() {
    return {
      mixer: null,
      idleAction: null,
      walkAction: null,
      runAction: null,
    };
  },
  mounted() {
    const scene = new THREE.Scene();

    let camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 100);
    camera.position.set(10, 5, 10);
    camera.lookAt(0, 4, 0);

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    this.$refs.sceneContainer.appendChild(renderer.domElement);

    scene.background = new THREE.Color(0xa0a0a0);
    scene.fog = new THREE.Fog(0xa0a0a0, 10, 50);

    const dirLight = new THREE.DirectionalLight(0xffffff, 3);
    dirLight.position.set(-3, 10, -10);
    dirLight.castShadow = true;
    dirLight.shadow.camera.top = 2;
    dirLight.shadow.camera.bottom = -2;
    dirLight.shadow.camera.left = -2;
    dirLight.shadow.camera.right = 2;
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 40;
    scene.add(dirLight);

    const onWindowResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    window.addEventListener('resize', onWindowResize);

    const loader = new GLTFLoader();
    loader.load(
      'assets/Soldier.glb',
      (gltf) => {
        let model = gltf.scene;
        scene.add(model);

        model.traverse((object) => {
          if (object.isMesh) object.castShadow = true;
        });

        const animations = gltf.animations;

        this.mixer = new THREE.AnimationMixer(model);

        this.idleAction = this.mixer.clipAction(animations[0]);
        this.walkAction = this.mixer.clipAction(animations[3]); 
        this.runAction = this.mixer.clipAction(animations[1]); 

        this.idleAction.play();

        renderer.setAnimationLoop(animate);
      },
      undefined,
      (error) => {
        console.error('An error happened while loading the model:', error);
      }
    );

    // const texture = new THREE.TextureLoader().load(wallTexture);
    // texture.wrapS = THREE.RepeatWrapping;
    // texture.wrapT = THREE.RepeatWrapping;

    // const wallMaterial = new THREE.MeshBasicMaterial({ map: texture });

    // const mesh = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshPhongMaterial({ color: '#FFFFFFFF', depthWrite: false }));
    // mesh.rotation.x = -Math.PI / 2;
    // mesh.receiveShadow = true;
    // scene.add(mesh);

    // const wall_1 = new THREE.BoxGeometry(10, 10, 1);
    // const wall_1_prefab = new THREE.Mesh(wall_1, new THREE.MeshBasicMaterial({ color: '#ffff00' }));
    // wall_1_prefab.position.set(0, 4.5, -5.5);
    // scene.add(wall_1_prefab);

    // const wall_2 = new THREE.BoxGeometry(1, 10, 10);
    // const wall_2_prefab = new THREE.Mesh(wall_2, new THREE.MeshBasicMaterial({ color: '#ffff00' }));
    // wall_2_prefab.position.set(-5.5, 4.5, 0);
    // scene.add(wall_2_prefab);

    // const frame_1 = new THREE.BoxGeometry(1, 1, 0.1);
    // const frame_1_prefab = new THREE.Mesh(frame_1, wallMaterial);
    // frame_1_prefab.position.set(2, 4, -5);
    // scene.add(frame_1_prefab);

    // const frame_2_prefab = new THREE.Mesh(frame_1, wallMaterial);
    // frame_2_prefab.position.set(0, 4, -5);
    // scene.add(frame_2_prefab);

    // const frame_3_prefab = new THREE.Mesh(frame_1, wallMaterial);
    // frame_3_prefab.position.set(-2, 4, -5);
    // scene.add(frame_3_prefab);

    const animate = () => {
      if (this.mixer) {
        this.mixer.update(0.01); // Update the mixer
      }
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };

    animate();
  },
  methods: {
    playAnimation() {
      if (this.idleAction && this.walkAction && this.runAction) {
        this.idleAction.stop();
        this.walkAction.play();
      }
    }
  }
};
</script>

