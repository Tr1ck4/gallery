<template>
  <div id="map"></div>
</template>

<script>
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import mapboxgl from 'mapbox-gl';

export default {
  data() {
    return {
      modelLocations: [
        { lng: 2.3542, lat: 48.8557, altitude: 0 },  // Location 1
        { lng: 2.3542, lat: 48.8566, altitude: 0 },  // Location 2
        { lng: 2.3542, lat: 48.8586, altitude: 0 }   // Location 3
      ],
    };
  },
  mounted() {
    this.$nextTick(() => {
      mapboxgl.accessToken = 'pk.eyJ1IjoiZDEwcyIsImEiOiJjaWwyZnl6ZDYwMGF1eDFtMDZlcGlkNWFtIn0.pDSmUI2h4seh9Tuvu6digg';
      this.map = new mapboxgl.Map({
        container: 'map', 
        style: 'mapbox://styles/d10s/cm2vud95h00lr01pk7c60epoi',
        zoom: 18,
        center: [2.3542, 48.8566],
        pitch: 60,
        antialias: true,
      });


      // Load models when style is loaded
      this.map.on('style.load', () => {
        const layers = this.map.getStyle().layers;
        console.log(layers)

        this.modelLocations.forEach((location, index) => {
          this.addModel(location, index);
        });
      });

      this.map.on('idle', () => {
        const buildingFeatures = this.map.queryRenderedFeatures({
            layers: ['building'], // Ensure this matches your layer name
        });

        if (buildingFeatures.length === 0) {
            console.log('No building features found.');
        } else {
            buildingFeatures.forEach(feature => {
                console.log("Starting building feature processing");
                const coordinates = feature.geometry.coordinates;
                const height = feature.properties.height || 0;
                console.log('Building Coordinates:', coordinates);
                console.log('Building Height:', height);

                // Convert these coordinates into 3D positions for Three.js
                if (this.scene) this.addBuildingToScene(coordinates, height);
            });
        }
    });


    });
  },
  methods: {
    addBuildingToScene(coordinates, height) {
      coordinates.forEach(coordSet => {
        coordSet.forEach(coord => {
          const lon = coord[0];
          const lat = coord[1];

          // Convert lon/lat to 3D coordinates
          const position = this.convertLngLatTo3D(lon, lat, height);

          // Create a box geometry or other representation for each building
          const buildingGeometry = new THREE.BoxGeometry(10, height, 10); // Width and depth can be adjusted
          const buildingMaterial = new THREE.MeshBasicMaterial({ color: 0x888888 });
          const buildingMesh = new THREE.Mesh(buildingGeometry, buildingMaterial);

          // Set the position in 3D space
          buildingMesh.position.set(position.x, position.y, position.z);
          this.scene.add(buildingMesh);
        });
      });
    },
    convertLngLatTo3D(lon, lat, height) {
      const mercator = mapboxgl.MercatorCoordinate.fromLngLat([lon, lat], height);
      return {
          x: mercator.x,
          y: mercator.y,
          z: mercator.z
      };
    },

    addModel(location, index) {
      // Define map coordinates
      const modelAsMercatorCoordinate = mapboxgl.MercatorCoordinate.fromLngLat(
        [location.lng, location.lat],
        location.altitude
      );

      // Model transform
      const modelTransform = {
        translateX: modelAsMercatorCoordinate.x,
        translateY: modelAsMercatorCoordinate.y,
        translateZ: modelAsMercatorCoordinate.z,
        rotateX: Math.PI / 2,
        rotateY: 0,
        rotateZ: 0,
        scale: modelAsMercatorCoordinate.meterInMercatorCoordinateUnits(),
      };

      // Custom layer for the 3D model
      const customLayer = {
        id: `3d-model-${index}`,
        type: 'custom',
        renderingMode: '3d',
        onAdd: function (map, gl) {
          this.camera = new THREE.Camera();
          this.scene = new THREE.Scene();

          const directionalLight = new THREE.DirectionalLight(0xffffff);
          directionalLight.position.set(0, -70, 100).normalize();
          this.scene.add(directionalLight);

          // Load the model
          const loader = new GLTFLoader();
          loader.load('https://docs.mapbox.com/mapbox-gl-js/assets/34M_17/34M_17.gltf', (gltf) => {

            this.scene.add(gltf.scene);
        
          });



          this.renderer = new THREE.WebGLRenderer({
            canvas: map.getCanvas(),
            context: gl,
            antialias: true,
          });

          this.renderer.autoClear = false;
          this.renderer.localClippingEnabled = true;  // Enable clipping globally

          // Make sure renderer and map are accessible globally within custom layer
          this.map = map;
        },
        render: function (gl, matrix) {
          if (!this.renderer || !this.map) {
            console.error("Renderer or map is not initialized.");
            return;
          }

          const rotationX = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(1, 0, 0), modelTransform.rotateX);
          const rotationY = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 1, 0), modelTransform.rotateY);
          const rotationZ = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 0, 1), modelTransform.rotateZ);

          const m = new THREE.Matrix4().fromArray(matrix);
          const l = new THREE.Matrix4()
            .makeTranslation(modelTransform.translateX, modelTransform.translateY, modelTransform.translateZ)
            .scale(new THREE.Vector3(modelTransform.scale, -modelTransform.scale, modelTransform.scale))
            .multiply(rotationX)
            .multiply(rotationY)
            .multiply(rotationZ);

          this.camera.projectionMatrix = m.multiply(l);
          this.renderer.resetState();
          this.renderer.render(this.scene, this.camera);
          this.map.triggerRepaint();  // Trigger the map to repaint the layer
        },
      };

      // Add the custom layer to the map
      this.map.addLayer(customLayer);
    },
  },
};
</script>
<style >
#map {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 100%;
}
.custom-marker {
  width: 50px;
  height: 50px;
  background-color: white;
  border: 5px solid black;
  border-radius: 50%;
  cursor: pointer;
  z-index: 999;
  position: relative;
  display: flex;
  justify-content: center; 
  align-items: center; 
  transition: width 0.3s ease, border-radius 0.3s ease;
}

.custom-marker:hover {
  width: 100px; 
  border-radius: 2rem; 
}

</style>