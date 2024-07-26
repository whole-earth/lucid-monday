import * as THREE from "three";
import { OrbitControls } from "three/OrbitControls";
//import { FontLoader } from "three/FontLoader";
//import { TextGeometry } from "three/TextGeometry";

let scene, camera, renderer, images = [], controls;
let autoRotate = true;
const autoRotateSpeed = 0.05;

export function init(imageLinks) {

    // Adjust this value to change the size of the ring
    const radius = 3.3;

    sceneInit(radius);

    //textInit();

    magCoverInit(imageLinks, radius);
}

export function animate() {
    function animationLoop() {
        requestAnimationFrame(animationLoop);

        if (autoRotate) {
            scene.rotation.y += autoRotateSpeed * 0.01;
        }

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
    renderer.outputEncoding = THREE.sRGBEncoding;

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

function magCoverInit(imageLinks, radius) {
    const textureLoader = new THREE.TextureLoader();
    const imageCount = imageLinks.length * 2;
    for (let i = 0; i < imageCount; i++) {
        const texture = textureLoader.load(imageLinks[i % imageLinks.length]);

        texture.encoding = THREE.sRGBEncoding;
        texture.minFilter = THREE.LinearFilter; // or THREE.NearestFilter
        texture.magFilter = THREE.LinearFilter; // or THREE.NearestFilter
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

        const width = 1;
        const height = width * 11 / 8.4;
        const depth = width * 0.15 / 8.4;
        const geometry = new THREE.BoxGeometry(width, height, depth);

        const frontTexture = texture.clone();
        frontTexture.repeat.set(0.495, 1); // Rightmost 49.5%
        frontTexture.offset.set(0.505, 0); // Offset to start from the rightmost 49.5%
        const frontCover = new THREE.MeshBasicMaterial({ map: frontTexture,  side: THREE.FrontSide });

        const backTexture = texture.clone();
        backTexture.repeat.set(0.495, 1); // Leftmost 49.5%
        backTexture.offset.set(0, 0); // Offset to start from the leftmost 49.5%
        const backCover = new THREE.MeshBasicMaterial({ map: backTexture,  side: THREE.FrontSide });

        const leftSpineTexture = texture.clone();
        leftSpineTexture.repeat.set(0.01, 1); // Middle 1%
        leftSpineTexture.offset.set(0.495, 0); // Offset to start from the middle 2%
        const leftSpine = new THREE.MeshBasicMaterial({ map: leftSpineTexture,  side: THREE.FrontSide });

        const spineMaterial = new THREE.MeshBasicMaterial({ color: 0xE5E5E5 });

        // Order of materials for BoxGeometry:
        // [right, left, top, bottom, front, back]
        const materials = [
            spineMaterial,
            leftSpine,
            spineMaterial,
            spineMaterial,
            frontCover,
            backCover
        ];

        const magazine = new THREE.Mesh(geometry, materials);

        const angle = (i / imageCount) * Math.PI * 2;
        magazine.position.x = Math.cos(angle) * radius;
        magazine.position.z = Math.sin(angle) * radius;
        magazine.rotation.y = -angle + Math.PI / 2;

        scene.add(magazine);
        images.push(magazine);
    }
}