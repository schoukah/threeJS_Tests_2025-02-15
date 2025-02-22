import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111); // Dark background

const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer({ 
    antialias: false,
    powerPreference: 'low-power' // Prefer power saving over performance
});
renderer.setPixelRatio(1); // Force 1:1 pixel ratio
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Set a better camera position
camera.position.set(0, 1, 5); // Lowered Y position
camera.lookAt(0, 0, 0); // Looking slightly downward

// Initialize controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Smooth animation
controls.dampingFactor = 0.05;
controls.rotateSpeed = 0.5;
controls.zoomSpeed = 1.2;
controls.panSpeed = 0.8;
controls.enableZoom = true;
controls.enablePan = true;
controls.maxPolarAngle = Math.PI * 0.85; // Limit vertical rotation
controls.minPolarAngle = 0.1; // Prevent looking completely from above
controls.screenSpacePanning = true;

// Add stronger ambient light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const spotLight = new THREE.SpotLight(0xffffff, 1);
spotLight.position.set(5, 5, 5);
scene.add(spotLight);

const directionalLight = new THREE.DirectionalLight(0x00bbff, 6);
directionalLight.position.set(0, 3, 5); // Position of the light in the X, Y, Z axes (5 units from the origin in each direction)
scene.add(directionalLight);

const loader = new GLTFLoader();

loader.load( '/A.glb', function ( gltf ) {

	const model = gltf.scene;
	scene.add(model);
	const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    model.position.sub(center);
    
    // Move model down
    // model.position.y -= 1; // Adjust this value to move model lower
    
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    camera.position.z = maxDim * 2;
    
    // Adjust camera to look at the lowered model
    camera.lookAt(0, -2, 0);

}, undefined, function ( error ) {

	console.error( error );

} );

function animate() {
    controls.update();
	renderer.render( scene, camera );
}
renderer.setAnimationLoop( animate );