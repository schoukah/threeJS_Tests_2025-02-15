import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(5, 0, 10);
camera.lookAt(0, 0, 0);

// Renderer setup with optimized settings
const renderer = new THREE.WebGLRenderer({ 
    canvas: document.getElementById('bg'),
    antialias: false,
    powerPreference: 'high-performance',
    precision: 'mediump'
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

// Lights setup - optimized
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0x00bbff, 6);
directionalLight.position.set(0, 3, 5);
scene.add(directionalLight);

// Model containers
const modelContainerA = new THREE.Group();
const modelContainerB = new THREE.Group();
scene.add(modelContainerA);
scene.add(modelContainerB);

// Optimization: Store DOM elements and computed values
const lightSection = document.querySelector('section.light');
const lettreBSection = document.querySelector('#lettreB');
const lastQuoteSection = document.querySelector('#lastQuote');
let lastScrollTop = 0;
let scrollTimeout = null;
let isModelALoaded = false;
let isModelBLoaded = false;

// Function to center and setup model
function setupModel(model, container, position) {
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    model.position.sub(center);
    container.add(model);
    container.position.copy(position);
}

// Load 3D models
const loader = new GLTFLoader();

// Load model A
loader.load('/A.glb', function (gltf) {
    setupModel(gltf.scene, modelContainerA, new THREE.Vector3(-8, 0, 0));
    isModelALoaded = true;
    needsRender = true;
    renderer.render(scene, camera);
});

// Load model B
loader.load('/B.glb', function (gltf) {
    const model = gltf.scene;
    
    // Scale the model if needed
    model.scale.set(1, 1, 1); // Adjust scale values as needed
    
    // Initial position - start from left
    setupModel(model, modelContainerB, new THREE.Vector3(-20, 0, 0)); // Changed from 5 to -20
    isModelBLoaded = true;
    needsRender = true;
    renderer.render(scene, camera);
});

// Throttled scroll handler
const handleScroll = () => {
    if (!isModelALoaded && !isModelBLoaded) return;

    const t = document.body.getBoundingClientRect().top;
    
    if (Math.abs(lastScrollTop - t) > 1) {
        // Handle model A
        if (isModelALoaded) {
            modelContainerA.rotation.y = t * -0.001;
            const lightSectionTop = lightSection.getBoundingClientRect().top;
            const distanceToLight = lightSectionTop - window.innerHeight;
            const moveThreshold = 300;
            
            if (distanceToLight < moveThreshold) {
                const progress = Math.max(0, Math.min(1, 1 - (distanceToLight / moveThreshold)));
                modelContainerA.position.x = -8 + (progress * 20);
                modelContainerA.position.z = progress * 10;
            } else {
                modelContainerA.position.x = -8;
                modelContainerA.position.z = 0;
            }
        }

        // Handle model B
        if (isModelBLoaded) {
            modelContainerB.rotation.y = t * 0.001;
            
            const lettreBRect = lettreBSection.getBoundingClientRect();
            const triggerPosition = window.innerHeight * 0.9; // Changed from 0.75 to 0.9 to trigger earlier

            const lastQuoteRect = lastQuoteSection.getBoundingClientRect();
            const lastQuoteTriggerPosition = window.innerHeight * 0.9; // Changed from 0.75 to 0.9 to trigger earlier
            
            if (lettreBRect.top <= triggerPosition && lastQuoteRect.top > lastQuoteTriggerPosition) {
                // Calculate progress over a larger range for smoother animation
                const progress = Math.min(1, (triggerPosition - lettreBRect.top) / (window.innerHeight * 0.8));
                
                // Animate the model moving from left to right and further back
                modelContainerB.position.x = -20 + (progress * 24);
                modelContainerB.position.z = progress * 2; // Decreased from 8 to 2 to move further back
                
                // Optional: Add some vertical movement
                modelContainerB.position.y = Math.sin(progress * Math.PI) * 2;
            } else if (lastQuoteRect.top <= lastQuoteTriggerPosition) {

                // Calculate progress over a larger range for smoother animation
                const progress = Math.min(1, (lastQuoteTriggerPosition - lastQuoteRect.top) / (window.innerHeight * 0.8));

                // Animate the model moving from current position to the left
                modelContainerB.position.x = 4 - (progress * 10); // Starts at x=4 and moves left
                modelContainerB.position.z = progress * 2; // Decreased from 8 to 2 to move further back

            } else {    

                // Reset position when scrolling back up
                modelContainerB.position.x = -20;
                modelContainerB.position.z = 0;
                modelContainerB.position.y = 0;
            }
        }
        
        lastScrollTop = t;
        needsRender = true;
    }
};

// Throttle scroll events
document.body.onscroll = () => {
    if (scrollTimeout) return;
    scrollTimeout = setTimeout(() => {
        handleScroll();
        scrollTimeout = null;
    }, 16);
};

// Optimized resize handler
let resizeTimeout;
window.addEventListener('resize', () => {
    if (resizeTimeout) clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        needsRender = true;
    }, 250);
});

// Render only when needed
let needsRender = true;
function animate() {
    requestAnimationFrame(animate);
    if (needsRender || isModelALoaded || isModelBLoaded) {
        renderer.render(scene, camera);
        needsRender = false;
    }
}

animate();