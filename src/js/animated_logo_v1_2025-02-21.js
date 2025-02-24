import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0.5, 0.01);
camera.rotation.set(-1.5, 0, 0);

// Create a container for the WebGL canvas with specific blend mode
const container = document.createElement('div');
container.style.position = 'fixed';
container.style.top = '0';
container.style.left = '0';
container.style.width = '100%';
container.style.height = '100%';
container.style.zIndex = '1';
container.style.pointerEvents = 'none';
document.body.appendChild(container);

const renderer = new THREE.WebGLRenderer({ 
    alpha: true,
    antialias: true,
    premultipliedAlpha: false,
    stencil: false,
    depth: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0);
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.5;
container.appendChild(renderer.domElement);

// Bloom setup with two separate passes
const bloomParams = {
    threshold: 0.1,
    strength: 2,
    radius: 2.5,
    exposure: 10
};

const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    bloomParams.strength,
    bloomParams.radius,
    bloomParams.threshold
);

// Create primary composer
const bloomComposer = new EffectComposer(renderer);
bloomComposer.renderToScreen = false;
bloomComposer.addPass(renderScene);
bloomComposer.addPass(bloomPass);

// Create final composer
const finalComposer = new EffectComposer(renderer);
finalComposer.addPass(renderScene);

// Add OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

const directionalLight = new THREE.DirectionalLight(0x00bbff, 6);
directionalLight.position.set(0, 3, 5);
scene.add(directionalLight);

// Add ambient light for better overall illumination
const ambientLight = new THREE.AmbientLight(0x404040, 2);
scene.add(ambientLight);

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

    // Render bloom effect
    bloomComposer.render();
    
    // Final render
    finalComposer.render();
}

renderer.setAnimationLoop(animate);

const loader = new GLTFLoader();

loader.load('/ECN_tentative_animation_2.glb', function(gltf) {
    const model = gltf.scene;
    model.position.set(0.25, 0, 0);
    model.rotation.set(0, 0.028, 0);
    
    // Enhanced material setup for better bloom
    model.traverse((child) => {
        if (child.isMesh && child.material) {
            const mat = child.material.clone();
            mat.emissive = new THREE.Color(0x00bbff);
            mat.emissiveIntensity = 10; // Much stronger emission
            mat.toneMapped = false; // Prevent tone mapping from reducing brightness
            child.material = mat;
        }
    });
    
    scene.add(model);

    // Setup animations
    mixer = new THREE.AnimationMixer(model);
    
    if (gltf.animations.length > 0) {
        gltf.animations.forEach(clip => {
            const action = mixer.clipAction(clip);
            animationActions.push(action);
        });
        playAnimationsOnce();
    }
}, undefined, function(error) {
    console.error(error);
});

// Handle window resize
window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
    bloomComposer.setSize(width, height);
    finalComposer.setSize(width, height);
});
