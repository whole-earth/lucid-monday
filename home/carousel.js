import * as THREE from "three";
import { OrbitControls } from "three/OrbitControls";
//import { FontLoader } from "three/FontLoader";
//import { TextGeometry } from "three/TextGeometry";
import * as TWEEN from '@tweenjs/tween.js';

let scene, camera, renderer, images = [], controls;
let autoRotate = true;
const autoRotateSpeed = 0.05;
let currentTween = null;
let isAnimating = false;
let lastClickedMagazine = null;
let inactivityTimeout;

export function init(imageLinks) {

    // Adjust this value to change the size of the ring
    const radius = 3.3;

    sceneInit(radius);

    //textInit();

    ringInit(imageLinks, radius);
}

export function animate() {
    function animationLoop() {
        requestAnimationFrame(animationLoop);
        TWEEN.update();

        if (autoRotate) {
            scene.rotation.y += autoRotateSpeed * 0.01;
            // Normalize rotation to be between -π and π
            if (scene.rotation.y > Math.PI) scene.rotation.y -= Math.PI * 2;
            if (scene.rotation.y < -Math.PI) scene.rotation.y += Math.PI * 2;
        }

        // Update each magazine to face the camera
        images.forEach(magazine => {
            magazine.lookAt(camera.position);
        });

        controls.update();
        renderer.render(scene, camera);
    }

    animationLoop();
}

function sceneInit(radius) {
    scene = new THREE.Scene();
    scene.background = null;
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / (window.innerWidth / 16 * 9), 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true, devicePixelRatio: window.devicePixelRatio, alpha: true });
    //renderer.outputEncoding = THREE.sRGBEncoding;

    function updateRendererSize() {
        const width = window.innerWidth;
        const height = width / 16 * 9;
        renderer.setSize(width, height);
        renderer.setPixelRatio(window.devicePixelRatio); // Set the pixel ratio
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    }
    updateRendererSize();
    window.addEventListener('resize', updateRendererSize);
    document.querySelector('.mag-carousel').appendChild(renderer.domElement);

    const distanceFromCenter = radius / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    camera.position.set(0, 0, distanceFromCenter);
    camera.lookAt(scene.position);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.025;
    controls.rotateSpeed = 0.2;
    controls.enableZoom = false;
    controls.enablePan = false;

    controls.minPolarAngle = Math.PI / 2;
    controls.maxPolarAngle = Math.PI / 2;

    renderer.domElement.addEventListener('mousedown', () => { autoRotate = false; });
    renderer.domElement.addEventListener('touchstart', () => { autoRotate = false; });
    renderer.domElement.addEventListener('mouseup', () => { autoRotate = true; });
    renderer.domElement.addEventListener('touchend', () => { autoRotate = true; });

    // Add raycaster for click detection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    renderer.domElement.addEventListener('click', (event) => {
        // Calculate mouse position in normalized device coordinates
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(images, true);
        
        if (intersects.length > 0) {
            const magazine = intersects[0].object;
            //handleMagazineClick(magazine, radius);
        }
    });
}

function ringInit(imageLinks, radius) {
    const textureLoader = new THREE.TextureLoader();
    const imageCount = imageLinks.length * 2;
    for (let i = 0; i < imageCount; i++) {
        const texture = textureLoader.load(imageLinks[i % imageLinks.length]);
        
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.generateMipmaps = false;

        const width = 1;
        const height = width * 11 / 8.4;
        const depth = width * 0.22 / 8.4;
        const geometry = new THREE.BoxGeometry(width, height, depth);

        const frontTexture = texture.clone();
        frontTexture.repeat.set(0.495, 1); // Rightmost 49.5%
        frontTexture.offset.set(0.505, 0); // Offset to start from the rightmost 49.5%
        const frontCover = new THREE.MeshBasicMaterial({ 
            map: frontTexture,
            side: THREE.FrontSide,
            toneMapped: false
        });

        const backTexture = texture.clone();
        backTexture.repeat.set(0.495, 1); // Leftmost 49.5%
        backTexture.offset.set(0, 0); // Offset to start from the leftmost 49.5%
        const backCover = new THREE.MeshBasicMaterial({ 
            map: backTexture,
            side: THREE.FrontSide,
            toneMapped: false
        });

        const leftSpineTexture = texture.clone();
        leftSpineTexture.repeat.set(0.008, 1);
        leftSpineTexture.offset.set(0.496, 0);
        const leftSpine = new THREE.MeshBasicMaterial({ 
            map: leftSpineTexture,
            side: THREE.FrontSide,
            toneMapped: false
        });

        const spineMaterial = new THREE.MeshBasicMaterial({ color: 0xE5E5E5 });

        const materials = [
            spineMaterial,
            leftSpine,
            spineMaterial,
            spineMaterial,
            frontCover,
            backCover
        ];

        const magazine = new THREE.Mesh(geometry, materials);
        
        // Calculate angle first
        const angle = (i / imageCount) * Math.PI * 2;
        
        // Then use it in userData
        magazine.userData = {
            angle: angle,
            originalScale: new THREE.Vector3(1, 1, 1)
        };
        
        magazine.callback = () => handleMagazineClick(magazine, radius);

        // Position using the angle
        magazine.position.x = Math.cos(angle) * radius;
        magazine.position.z = Math.sin(angle) * radius;

                magazine.rotation.x = THREE.MathUtils.degToRad(70);
        
                // Lean the magazine slightly towards the center of the ring along the z-axis
                magazine.rotation.z = THREE.MathUtils.degToRad(0); // Adjust the angle as needed

        scene.add(magazine);
        images.push(magazine);
    }
}

function handleMagazineClick(magazine, radius) {
    if (isAnimating) return;
    isAnimating = true;
    
    if (currentTween) currentTween.stop();
    if (inactivityTimeout) clearTimeout(inactivityTimeout);
    
    // Stop auto rotation
    autoRotate = false;
    
    // Calculate target rotation
    let targetRotation = -magazine.userData.angle;
    
    // Normalize current rotation
    let currentRotation = scene.rotation.y % (Math.PI * 2);
    if (currentRotation > Math.PI) currentRotation -= Math.PI * 2;
    if (currentRotation < -Math.PI) currentRotation += Math.PI * 2;

    // Calculate shortest rotation path
    let rotationDiff = targetRotation - currentRotation;
    if (rotationDiff > Math.PI) rotationDiff -= Math.PI * 2;
    if (rotationDiff < -Math.PI) rotationDiff += Math.PI * 2;

    targetRotation = currentRotation + rotationDiff;
    
    // Rotate to center the clicked magazine
    currentTween = new TWEEN.Tween({ rotation: currentRotation })
        .to({ rotation: targetRotation }, 1000)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onUpdate(obj => {
            scene.rotation.y = obj.rotation;
        })
        .onComplete(() => {
            // Scale up the clicked magazine
            magazine.scale.set(1.1, 1.1, 1.1);
            lastClickedMagazine = magazine;
            
            // Set inactivity timeout
            inactivityTimeout = setTimeout(resetToNormal, 4000);
            
            isAnimating = false;
        })
        .start();
}

function resetToNormal() {
    if (lastClickedMagazine) {
        lastClickedMagazine.scale.set(1, 1, 1);
        autoRotate = true;
        lastClickedMagazine = null;
    }
}

function textInit() {
    const fontLoader = new FontLoader();
    fontLoader.load('path/to/font.json', function (font) {
        const textGeometry = new TextGeometry('Hello, Three.js!', {
            font: font,
            size: 0.5,
            height: 0.1,
            curveSegments: 12,
            bevelEnabled: true,
            bevelThickness: 0.03,
            bevelSize: 0.02,
            bevelOffset: 0,
            bevelSegments: 5
        });

        const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);

        textMesh.position.set(0, 1, 0); // Adjust position as needed
        scene.add(textMesh);
    });
}
