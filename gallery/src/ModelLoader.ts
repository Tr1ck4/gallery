// ModelLoader.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class ModelLoader {
    loadModel(path: any, onLoad: any, onError: (arg0: any) => void) {
        const loader = new GLTFLoader();

        loader.load(path, onLoad, undefined, (error: any) => {
            console.error(`Error loading model from ${path}:`, error);
            if (onError) onError(error);
        });
    }
}
