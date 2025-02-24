import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0.5, 0.01);
camera.rotation.set(-1.5, 0, 0);

const renderer = new THREE.WebGLRenderer({ 
    alpha: true,
    antialias: true,
    premultipliedAlpha: false,
    logarithmicDepthBuffer: true  // Added for better depth handling
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0);
renderer.sortObjects = false;  // Disabled automatic sorting
renderer.outputColorSpace = THREE.SRGBColorSpace;

// Get canvas container
const canvasContainer = document.getElementById('canvas-container');
canvasContainer.appendChild(renderer.domElement);

// Add OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

const directionalLight = new THREE.DirectionalLight(0x00bbff, 6);
directionalLight.position.set(0, 3, 5);
scene.add(directionalLight);

// Animation setup
let mixer;
const clock = new THREE.Clock();
let animationActions = [];

function playAnimationsOnce() {
    if (animationActions.length > 0) {
        animationActions.forEach(action => {
            action.reset();
            action.setLoop(THREE.LoopOnce);
            action.clampWhenFinished = true;
            action.play();
        });
    }
}

function animate() {
    controls.update();
    
    if (mixer) {
        const delta = clock.getDelta();
        mixer.update(delta);
    }
    renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

const loader = new GLTFLoader();

loader.load('/ECN_tentative_animation_2.glb', function(gltf) {
    const model = gltf.scene;
    model.position.set(0.25, 0, 0);
    
    // Smaller rotation adjustment in opposite direction
    model.rotation.set(0, 0.028, 0);
    
    scene.add(model);

    // Setup animations
    mixer = new THREE.AnimationMixer(model);
    
    if (gltf.animations.length > 0) {
        gltf.animations.forEach(clip => {
            const action = mixer.clipAction(clip);
            animationActions.push(action);
        });
        // Play animations immediately once
        playAnimationsOnce();
    }
}, undefined, function(error) {
    console.error(error);
});
