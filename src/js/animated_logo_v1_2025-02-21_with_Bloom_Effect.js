import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0.5, 0.01);
camera.rotation.set(-1.5, 0, 0);

// Find the specific container we added in HTML
const canvasContainer = document.getElementById('canvas-container');
canvasContainer.style.position = 'fixed';
canvasContainer.style.top = '0';
canvasContainer.style.left = '0';
canvasContainer.style.width = '100%';
canvasContainer.style.height = '100%';
canvasContainer.style.pointerEvents = 'auto';

// Enhanced renderer setup
const renderer = new THREE.WebGLRenderer({ 
    alpha: true,
    antialias: true,
    powerPreference: "high-performance",
    premultipliedAlpha: false,
    stencil: false,
    depth: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
canvasContainer.appendChild(renderer.domElement); // Append to specific container instead

// Separate bloom setup
const bloomLayer = new THREE.Layers();
bloomLayer.set(1);

const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.2,    // strength
    1.0,    // radius
    0.1     // threshold
);

// Create two composers
const bloomComposer = new EffectComposer(renderer);
bloomComposer.renderToScreen = false;
bloomComposer.addPass(new RenderPass(scene, camera));
bloomComposer.addPass(bloomPass);

const finalComposer = new EffectComposer(renderer);
const finalPass = new RenderPass(scene, camera);
finalComposer.addPass(finalPass);

// Add OrbitControls with specific constraints
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enableZoom = true;  // Enable zoom
controls.enablePan = true;   // Enable panning
controls.minDistance = 0.1;  // Set minimum zoom distance
controls.maxDistance = 10;   // Set maximum zoom distance
controls.target.set(0, 0, 0);  // Set the target point to look at

const directionalLight = new THREE.DirectionalLight(0x00bbff, 5);
directionalLight.position.set(9, 4, 9);
scene.add(directionalLight);

// Add ambient light for better overall illumination
// const ambientLight = new THREE.AmbientLight(0x404040, 2);
// scene.add(ambientLight);

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
    
    // Render both passes
    bloomComposer.render();
    finalComposer.render();
}

renderer.setAnimationLoop(animate);

const loader = new GLTFLoader();

loader.load('/ECN_tentative_animation_2.glb', function(gltf) {
    const model = gltf.scene;
    model.position.set(0.25, 0, 0);
    model.rotation.set(0, 0.028, 0);
    
    // Material setup
    model.traverse((child) => {
        if (child.isMesh && child.material) {
            const mat = child.material.clone();
            mat.emissive = new THREE.Color(0x00bbff);
            mat.emissiveIntensity = 0.3;
            mat.toneMapped = false;
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
