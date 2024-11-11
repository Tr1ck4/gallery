<template>
  <div id="map"></div>
</template>

<script>
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export default {
  data() {
    return {
      modelLocations: [
        { lng: 2.3542, lat: 48.8557, altitude: 0 },  // Location 1 in Paris
        { lng: 2.1232, lat: 48.4246, altitude: 0 },  // Location 2 in Paris
        { lng: 2.3542, lat: 48.8586, altitude: 0 }   // Location 3 in Paris
      ],
    };
  },
  mounted() {
    mapboxgl.accessToken = 'pk.eyJ1IjoiZGFudmsiLCJhIjoiY2lrZzJvNDR0MDBhNXR4a2xqNnlsbWx3ciJ9.myJhweYd_hrXClbKk8XLgQ'; // Add your Mapbox token here
    this.map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/standard',
      zoom: 18,
      center: [2.3542, 48.8557],
      pitch: 75,
      antialias: true
    });

    this.map.on('style.load', () => {
      this.modelLocations.forEach((location, index) => {
        this.addModel(location, index);
      });
    });

    this.addMarker(2.3522, 48.8566, 'First marker in Paris');  // Marker 1
    this.addMarker(2.3532, 48.8576, 'Second marker in Paris'); // Marker 2

  },
  methods: {
    addModel(location, index) {
      const modelAsMercatorCoordinate = mapboxgl.MercatorCoordinate.fromLngLat(
        [location.lng, location.lat],
        location.altitude
      );

      const modelTransform = {
        translateX: modelAsMercatorCoordinate.x,
        translateY: modelAsMercatorCoordinate.y,
        translateZ: modelAsMercatorCoordinate.z,
        rotateX: Math.PI / 2,
        rotateY: 0,
        rotateZ: 0,
        scale: modelAsMercatorCoordinate.meterInMercatorCoordinateUnits()
      };

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

          const directionalLight2 = new THREE.DirectionalLight(0xffffff);
          directionalLight2.position.set(0, 70, 100).normalize();
          this.scene.add(directionalLight2);

          // Define the clipping plane
          const clippingPlane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 10); // Clipping at Z=10
          const loader = new GLTFLoader();
          loader.load('https://docs.mapbox.com/mapbox-gl-js/assets/34M_17/34M_17.gltf', (gltf) => {
            this.scene.add(gltf.scene);
          });

          this.map = map;
          this.renderer = new THREE.WebGLRenderer({
            canvas: map.getCanvas(),
            context: gl,
            antialias: true
          });

          this.renderer.autoClear = false;
          this.renderer.localClippingEnabled = true; // Enable clipping
        },
        render: function (gl, matrix) {
          const rotationX = new THREE.Matrix4().makeRotationAxis(
            new THREE.Vector3(1, 0, 0),
            modelTransform.rotateX
          );
          const rotationY = new THREE.Matrix4().makeRotationAxis(
            new THREE.Vector3(0, 1, 0),
            modelTransform.rotateY
          );
          const rotationZ = new THREE.Matrix4().makeRotationAxis(
            new THREE.Vector3(0, 0, 1),
            modelTransform.rotateZ
          );

          const m = new THREE.Matrix4().fromArray(matrix);
          const l = new THREE.Matrix4()
            .makeTranslation(
              modelTransform.translateX,
              modelTransform.translateY,
              modelTransform.translateZ
            )
            .scale(
              new THREE.Vector3(
                modelTransform.scale,
                -modelTransform.scale,
                modelTransform.scale
              )
            )
            .multiply(rotationX)
            .multiply(rotationY)
            .multiply(rotationZ);

          this.camera.projectionMatrix = m.multiply(l);
          this.renderer.resetState();
          this.renderer.render(this.scene, this.camera);
          this.map.triggerRepaint();
        }
      };


      // Add the custom 3D layer
      this.map.addLayer(customLayer);

    },
    addMarker(lng, lat, popupText) {
      // Ensure `this.map` is used correctly
      const markerElement = document.createElement('div');
      markerElement.className = 'custom-marker'; // Apply the default marker style

      // Create the marker
      const marker = new mapboxgl.Marker(markerElement)
        .setLngLat([lng, lat]) // Set position
        .addTo(this.map); // Add marker to the correct map instance

      if (popupText) {
        const popup = new mapboxgl.Popup({ offset: 25 }).setText(popupText);
        marker.setPopup(popup);
      }
    }
  }
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
