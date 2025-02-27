import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const MODEL = './ECN_Logo_animation_agregation_pieces_Sarah_2025-02-24_bleues.glb'

// Create a separate renderer div that won't interfere with scrolling
const renderDiv = document.createElement('div');
renderDiv.style.position = 'fixed';
renderDiv.style.top = '0';
renderDiv.style.left = '0';
renderDiv.style.width = '100%';
renderDiv.style.height = '100%';
renderDiv.style.zIndex = '1';
renderDiv.style.pointerEvents = 'none';
document.body.prepend(renderDiv);

const scene = new THREE.Scene();

// Camera setup with better position for visibility
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
// Reset camera to original working position
camera.position.set(0, 0.5, 0.01);
camera.rotation.set(-1.5, 0, 0);

const renderer = new THREE.WebGLRenderer({ 
    alpha: true,
    antialias: true,
    powerPreference: "high-performance"
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace;

// Add this line to ensure the canvas doesn't block interaction with content
// document.querySelector('canvas').style.pointerEvents = 'none';

// Update canvas size on window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Get canvas container
const canvasContainer = document.getElementById('canvas-container');
canvasContainer.appendChild(renderer.domElement);

// Add OrbitControls back
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enableZoom = false;
controls.enablePan = false;
controls.enableRotate = true;

// Enhanced lighting setup
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0x00bbff, 5);
directionalLight.position.set(5, 5, -2);
scene.add(directionalLight);

// Add fill light from the front
const frontLight = new THREE.DirectionalLight(0xffffff, 1);
frontLight.position.set(0, 0, 5);
scene.add(frontLight);

// Add scroll tracking variables
let lastScrollTop = 0;
// let scrollDirection = 1; // 1 for forward, -1 for reverse
let isAnimationPlaying = false;
let hasPlayedReverseAnimation = false; // Add flag for tracking first reverse play

// Track scroll position and direction
window.addEventListener('scroll', () => {
    const st = window.scrollY || document.documentElement.scrollTop;
    if (st > lastScrollTop && !hasPlayedReverseAnimation) {
        scrollDirection = -1;
        hasPlayedReverseAnimation = true; // Mark that we've played the reverse animation
        if (!isAnimationPlaying && initialAnimationComplete) {
            // Resume animation from current point
            animationActions.forEach(action => {
                action.paused = false;
            });
            isAnimationPlaying = true;
        }
    }
    lastScrollTop = st;
}, false);

// Animation setup
let mixer;
const clock = new THREE.Clock();
let animationActions = [];

// Add camera position states
const cameraPositions = {
    default: new THREE.Vector3(0, 0.5, 0.01),
    closer: new THREE.Vector3(0, 0.25, 0.005)
};
let targetCameraPosition = cameraPositions.default.clone();
let cameraMoveSpeed = 0.05;

function lerpVector(start, end, alpha) {
    return start.clone().lerp(end, alpha);
}

function updateCameraPosition() {
    camera.position.copy(lerpVector(camera.position, targetCameraPosition, cameraMoveSpeed));
}

let model; // Add model reference at the top level

// Simplified animation state variables
let targetFrame = 64;
let initialAnimationComplete = false;
let hasStartedScrolling = false;

// Simplified scroll event listener
window.addEventListener('scroll', () => {
    if (initialAnimationComplete && !hasStartedScrolling) {
        hasStartedScrolling = true;
        continueAnimation();
    }
}, false);

function continueAnimation() {
    if (animationActions.length > 0) {
        animationActions.forEach(action => {
            action.paused = false;
            action.setLoop(THREE.LoopOnce);
            action.clampWhenFinished = true;
            action.play();
        });
    }
}

function playInitialAnimation() {
    if (animationActions.length > 0) {
        animationActions.forEach(action => {
            action.reset();
            action.setLoop(THREE.LoopOnce);
            action.clampWhenFinished = true;
            action.timeScale = 1;
            action.time = 0;
            action.play();
        });
    }
}

// Modified fade out function to accept duration parameter
function fadeOutModel(duration = 1000) {
    if (!model) return;
    
    const startTime = Date.now();
    
    function fade() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        if (model.traverse) {
            model.traverse((child) => {
                if (child.isMesh && child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => {
                            mat.transparent = true;
                            mat.opacity = 1 - progress;
                        });
                    } else {
                        child.material.transparent = true;
                        child.material.opacity = 1 - progress;
                    }
                }
            });
        }
        
        if (progress < 1) {
            requestAnimationFrame(fade);
        } else {
            scene.remove(model);
        }
    }
    
    fade();
}

// Modify the animation loop to check frame
function animate() {
    requestAnimationFrame(animate);
    if (mixer) {
        const delta = clock.getDelta();
        mixer.update(delta);
        
        // Check if we've reached frame 55 during initial animation
        if (!initialAnimationComplete && mixer.time >= targetFrame / 30) {
            animationActions.forEach(action => {
                action.paused = true;
            });
            initialAnimationComplete = true;
        }
    }
    updateCameraPosition();
    controls.update();
    renderer.render(scene, camera);
}

// Start animation loop
animate();

// Remove the existing animation loop if it exists
renderer.setAnimationLoop(null);

const loader = new GLTFLoader();

loader.load( MODEL, function(gltf) {
    model = gltf.scene; // Store model reference
    model.position.set(0.25, 0, 0);
    model.rotation.set(0, 0, 0);
    scene.add(model);
    
    // Make materials transparent-capable from the start
    model.traverse((child) => {
        if (child.isMesh && child.material) {
            if (Array.isArray(child.material)) {
                child.material.forEach(mat => {
                    mat.transparent = true;
                });
            } else {
                child.material.transparent = true;
            }
        }
    });
    
    // Setup animations
    mixer = new THREE.AnimationMixer(model);
    
    if (gltf.animations.length > 0) {
        gltf.animations.forEach(clip => {
            const action = mixer.clipAction(clip);
            animationActions.push(action);
        });
        // Start initial animation
        playInitialAnimation();
    }

    // Log successful model load
    console.log('Model loaded successfully');
}, 
// Add loading progress callback
(xhr) => {
    console.log((xhr.loaded / xhr.total * 100) + '% loaded');
},
(error) => {
    console.error('Error loading model:', error);
});