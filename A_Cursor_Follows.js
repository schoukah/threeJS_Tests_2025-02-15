import * as THREE from 'three';
import WebGL from 'three/addons/capabilities/WebGL.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111); // Dark background

// Lower FOV for less rendering overhead
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);

const renderer = new THREE.WebGLRenderer({ 
    antialias: false,
    powerPreference: 'low-power' // Prefer power saving over performance
});
renderer.setPixelRatio(1); // Force 1:1 pixel ratio
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Set a better camera position
camera.position.set(0, 1, 5); // Lowered Y position
camera.lookAt(0, -1, 0); // Looking slightly downward

// Add stronger ambient light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// Add directional light
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

// Add cursor light with optimized settings
const cursorLight = new THREE.PointLight(0xffffff, 2, 5);
cursorLight.decay = 2;
// Simpler geometry for light indicator
const sphereGeometry = new THREE.SphereGeometry(0.05, 6, 6);
const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
const lightSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
cursorLight.add(lightSphere);
scene.add(cursorLight);

// Mouse position tracking with more aggressive throttling
const mouse = new THREE.Vector2();
let lastMouseUpdate = 0;
const mouseUpdateDelay = 32; // Reduce to 30fps for mouse updates

// Reuse vectors to avoid garbage collection
const raycaster = new THREE.Raycaster();
const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
const intersectionPoint = new THREE.Vector3();
let isMouseMoving = false;
let mouseTimeout;

document.addEventListener('mousemove', (event) => {
    const now = performance.now();
    if (now - lastMouseUpdate < mouseUpdateDelay) return;
    
    lastMouseUpdate = now;
    isMouseMoving = true;
    
    // Clear previous timeout
    if (mouseTimeout) clearTimeout(mouseTimeout);
    
    // Set timeout to detect when mouse stops moving
    mouseTimeout = setTimeout(() => {
        isMouseMoving = false;
    }, 150);
    
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    raycaster.ray.intersectPlane(plane, intersectionPoint);
    
    if (intersectionPoint) {
        cursorLight.position.copy(intersectionPoint);
        cursorLight.position.z += 0.1;
    }
});

// Handle window resize with more aggressive throttling
let resizeTimeout;
window.addEventListener('resize', () => {
    if (resizeTimeout) clearTimeout(resizeTimeout);
    
    resizeTimeout = setTimeout(() => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }, 250); // Longer delay for resize events
});

const loader = new GLTFLoader();

loader.load('/A.glb', function(gltf) {
    const model = gltf.scene;
    
    // More aggressive model optimization
    model.traverse((node) => {
        if (node.isMesh) {
            node.material.flatShading = true;
            node.frustumCulled = true;
            // Reduce material quality
            if (node.material) {
                node.material.precision = 'lowp';
                node.material.fog = false;
            }
        }
    });
    
    scene.add(model);
    
    // Adjust camera and model position
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    model.position.sub(center);
    
    // Move model down
    model.position.y -= 2; // Adjust this value to move model lower
    
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    camera.position.z = maxDim * 2;
    
    // Adjust camera to look at the lowered model
    camera.lookAt(0, -2, 0);
}, undefined, function(error) {
    console.error('Error loading model:', error);
});

// Optimize render loop
let animationFrameId;
let lastRenderTime = 0;
const minRenderInterval = 32; // Cap at 30fps

function animate(currentTime) {
    animationFrameId = requestAnimationFrame(animate);
    
    // Skip frame if not enough time has passed or tab is hidden
    if (document.hidden || (currentTime - lastRenderTime < minRenderInterval && !isMouseMoving)) {
        return;
    }
    
    lastRenderTime = currentTime;
    renderer.render(scene, camera);
}

// Start animation
animate();

// Cleanup function to stop animation when tab is not visible
window.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        cancelAnimationFrame(animationFrameId);
    } else {
        animate();
    }
});

if (WebGL.isWebGL2Available()) {
    renderer.setAnimationLoop(animate);
} else {
    const warning = WebGL.getWebGL2ErrorMessage();
    document.getElementById('container').appendChild(warning);
}
