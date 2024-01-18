import * as THREE from "./libs/three.module.js";
import { TWEEN } from "./libs/tween.module.min.js";
import { TrackballControls } from "./libs/TrackballControls.js";
import { CSS3DRenderer, CSS3DObject } from "./libs/CSS3dRenderer.js";

let camera, scene, renderer, objects, vector;
let controls;

const parentElement = document.querySelector('.mag-carousel');

const targets = { helix: [] };

function init(images) {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(80, parentElement.clientWidth / parentElement.clientHeight, 1, 10000);
    camera.position.set(0, 0, 7500);
    vector = new THREE.Vector3();

    objects = initImgObjects(scene, images)
    defineHelixTransform(objects, vector);

    renderer = initRenderer();
    controls = initControls(renderer);

    transform(targets.helix, 0, 1, 1, 1);

    window.addEventListener('resize', onWindowResize);
}

function initControls(renderer) {
    let controls = new TrackballControls(camera, renderer.domElement);
    controls.noZoom = true;
    controls.noPan = true;
    controls.dynamicDampingFactor = .1;

    controls.addEventListener('change', render);
    return controls
}

function initRenderer() {
    let renderer = new CSS3DRenderer();
    renderer.setSize(parentElement.clientWidth, parentElement.clientHeight);
    renderer.domElement.classList.add('scene');
    parentElement.appendChild(renderer.domElement);
    return renderer
}

function defineHelixTransform(objects, vector) {
    const totalObjects = objects.length;
    const angleBetweenObjects = (2 * Math.PI) / totalObjects;

    for (let i = 0; i < totalObjects; i++) {
        const theta = i * angleBetweenObjects + Math.PI;
        const y = parentElement.clientHeight * -0.4;

        const object = new THREE.Object3D();
        object.position.setFromCylindricalCoords(5500, theta, y);

        vector.x = object.position.x * 2;
        vector.y = object.position.y;
        vector.z = object.position.z * 2;

        object.lookAt(vector);

        targets.helix.push(object);
    }
}


function initImgObjects(scene, images) {
    let objects = [];
    for (let i = 0; i < images.length; i += 1) {
        const img = document.createElement('img');

        img.src = images[i];

        // Hack: Android Chromium browsers don't render properly if the <img>
        // is embedded in an <a> or if the <img> has certain CSS (border-radius, hover
        // effect, etc.)
        if (getOS() === "Android") {
            img.classList.add("render--android");
        } else {
            img.classList.add("render");
        }

        const objectCSS = new CSS3DObject(img);
        objectCSS.position.x = Math.random() * 4000 - 2000;
        objectCSS.position.y = Math.random() * 4000 - 2000;
        objectCSS.position.z = Math.random() * 4000 - 2000;

        scene.add(objectCSS)
        objects.push(objectCSS)
    }
    return objects
}

function transform(targets, duration, x_scale = 1, y_scale = 1, z_scale = 1) {
    TWEEN.removeAll();

    for (let i = 0; i < objects.length; i++) {

        const object = objects[i];
        const target = targets[i];

        new TWEEN.Tween(object.position)
            .to({ x: target.position.x, y: target.position.y, z: target.position.z }, Math.random() * duration + duration)
            .easing(TWEEN.Easing.Exponential.InOut)
            .start();

        new TWEEN.Tween(object.rotation)
            .to({ x: target.rotation.x, y: target.rotation.y, z: target.rotation.z }, Math.random() * duration + duration)
            .easing(TWEEN.Easing.Exponential.InOut)
            .start();
        new TWEEN.Tween(object.scale)
            .to({ x: x_scale, y: y_scale, z: z_scale })
            .easing(TWEEN.Easing.Exponential.InOut)
            .start();
    }

    new TWEEN.Tween(this)
        .to({}, duration * 2)
        .onUpdate(render)
        .start();
}

function onWindowResize() {
    camera.aspect = parentElement.clientWidth / parentElement.clientHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(parentElement.clientWidth, parentElement.clientHeight);
    render();
}

function animate() {
    requestAnimationFrame(animate);
    TWEEN.update();
    controls.update();
}

function render() {
    renderer.render(scene, camera);
    visibleOverflowStyling();
}

function getOS() {
    let userAgent = window.navigator.userAgent,
        platform = window.navigator.platform,
        macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'],
        windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'],
        iosPlatforms = ['iPhone', 'iPad', 'iPod'],
        os = null;

    if (macosPlatforms.indexOf(platform) !== -1) {
        os = 'Mac OS';
    } else if (iosPlatforms.indexOf(platform) !== -1) {
        os = 'iOS';
    } else if (windowsPlatforms.indexOf(platform) !== -1) {
        os = 'Windows';
    } else if (/Android/.test(userAgent)) {
        os = 'Android';
    } else if (!os && /Linux/.test(platform)) {
        os = 'Linux';
    }

    return os;
}

function visibleOverflowStyling() {
    const sceneDiv = document.querySelector('.mag-carousel .scene');
    if (sceneDiv) {
        sceneDiv.style.overflow = 'visible';
    }
}

export { init, animate, controls };