import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as dat from 'dat.gui';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.set(0, 0.5, 0.01);
camera.rotation.set(-1.5, 0, 0);
// camera.lookAt(0, -1, 0); // Look at the vertical center of the model

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

// Add OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enabled = true; // Re-enable OrbitControls
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Add GUI
const gui = new dat.GUI();
const cameraFolder = gui.addFolder('Camera');

// Create controllers
const positionControllers = {
    x: cameraFolder.add(camera.position, 'x', -10, 10).name('Position X'),
    y: cameraFolder.add(camera.position, 'y', -10, 10).name('Position Y'),
    z: cameraFolder.add(camera.position, 'z', -10, 10).name('Position Z')
};

// Rotation controls (in degrees for easier understanding)
const cameraRotation = {
    x: THREE.MathUtils.radToDeg(camera.rotation.x),
    y: THREE.MathUtils.radToDeg(camera.rotation.y),
    z: THREE.MathUtils.radToDeg(camera.rotation.z)
};

const rotationControllers = {
    x: cameraFolder.add(cameraRotation, 'x', -180, 180).name('Rotation X (deg)').onChange((value) => {
        camera.rotation.x = THREE.MathUtils.degToRad(value);
    }),
    y: cameraFolder.add(cameraRotation, 'y', -180, 180).name('Rotation Y (deg)').onChange((value) => {
        camera.rotation.y = THREE.MathUtils.degToRad(value);
    }),
    z: cameraFolder.add(cameraRotation, 'z', -180, 180).name('Rotation Z (deg)').onChange((value) => {
        camera.rotation.z = THREE.MathUtils.degToRad(value);
    })
};

cameraFolder.open();

// Add controls change handler
controls.addEventListener('change', () => {
    // Update position controllers
    Object.keys(positionControllers).forEach(axis => {
        positionControllers[axis].updateDisplay();
    });
    
    // Update rotation controllers
    cameraRotation.x = THREE.MathUtils.radToDeg(camera.rotation.x);
    cameraRotation.y = THREE.MathUtils.radToDeg(camera.rotation.y);
    cameraRotation.z = THREE.MathUtils.radToDeg(camera.rotation.z);
    Object.keys(rotationControllers).forEach(axis => {
        rotationControllers[axis].updateDisplay();
    });
});

const cameraDebug = {
    logPosition: function() {
        console.log('Camera Position:', {
            position: camera.position.toArray(),
            rotation: {
                x: THREE.MathUtils.radToDeg(camera.rotation.x),
                y: THREE.MathUtils.radToDeg(camera.rotation.y),
                z: THREE.MathUtils.radToDeg(camera.rotation.z)
            }
        });
    },
    reset: function() {
        camera.position.set(0, 0.5, 0.01);
        camera.rotation.set(-1.5, 0, 0);
        controls.update();
        
        // Update all GUI controllers
        Object.keys(positionControllers).forEach(axis => {
            positionControllers[axis].updateDisplay();
        });
        cameraRotation.x = THREE.MathUtils.radToDeg(camera.rotation.x);
        cameraRotation.y = THREE.MathUtils.radToDeg(camera.rotation.y);
        cameraRotation.z = THREE.MathUtils.radToDeg(camera.rotation.z);
        Object.keys(rotationControllers).forEach(axis => {
            rotationControllers[axis].updateDisplay();
        });
    }
};

gui.add(cameraDebug, 'logPosition').name('Log Camera Values');
gui.add(cameraDebug, 'reset').name('Reset Camera');

const directionalLight = new THREE.DirectionalLight(0x00bbff, 6);
directionalLight.position.set(0, 3, 5);
scene.add(directionalLight);

// Add animation mixer
let mixer;
const clock = new THREE.Clock();
let animationActions = [];
let isFirstAnimationComplete = false;

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

// Click event handler
renderer.domElement.addEventListener('click', () => {
    if (isFirstAnimationComplete) {
        playAnimationsOnce();
    }
});

function animate() {
    controls.update(); // Update OrbitControls
    if (mixer) {
        const delta = clock.getDelta();
        mixer.update(delta);

        // Check if first animation is complete
        if (!isFirstAnimationComplete && mixer.time > 0) {
            const anyRunning = animationActions.some(action => action.isRunning());
            if (!anyRunning) {
                isFirstAnimationComplete = true;
            }
        }
    }
    renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

const loader = new GLTFLoader();

loader.load('/ECN_tentative_animation_2.glb', function(gltf) {
    const model = gltf.scene;
    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);
    
    console.log('Model position:', model.position);
    console.log('Model bounds:', new THREE.Box3().setFromObject(model));
    console.log('Camera position:', camera.position);
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
