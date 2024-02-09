import * as THREE from "./libs/three.module.js";
import { TWEEN } from "./libs/tween.module.min.js";
import { TrackballControls } from "./libs/TrackballControls.js";
import { CSS3DRenderer, CSS3DObject } from "./libs/CSS3dRenderer.js";


let camera, scene, renderer, objects;
let controls;

const parentElement = document.querySelector('.mag-carousel');

const targets = { helix: [] };

function init(images) {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(90, parentElement.clientWidth / parentElement.clientHeight, 0.1, 1000);
    camera.position.set(0, 0, 7500);

    objects = initImgObjects(scene, images);
    defineHelixTransform(objects);

    renderer = initRenderer();
    controls = initControls(renderer);

    transform(targets.helix, 0, 1);

    window.addEventListener('resize', onWindowResize);
}

function initControls(renderer) {
    let controls = new TrackballControls(camera, renderer.domElement);
    controls.noZoom = true;
    controls.noPan = true;
    controls.dynamicDampingFactor = .1;

    controls.addEventListener('change', render);
    return controls;
}

function initRenderer() {
    let renderer = new CSS3DRenderer();
    renderer.setSize(parentElement.clientWidth, parentElement.clientHeight);
    renderer.domElement.classList.add('scene');
    parentElement.appendChild(renderer.domElement);
    return renderer;
}

function defineHelixTransform(objects) {
    const totalObjects = objects.length;
    const angleBetweenObjects = (2 * Math.PI) / totalObjects;

    for (let i = 0; i < totalObjects; i++) {
        const theta = i * angleBetweenObjects + Math.PI;
        const y = parentElement.clientHeight * -0.2;

        const object = new THREE.Object3D();
        object.position.setFromCylindricalCoords(5000, theta, y);

        object.lookAt(new THREE.Vector3());

        targets.helix.push(object);
    }
}

function initImgObjects(scene, images) {
    let objects = [];
    for (let i = 0; i < images.length; i += 1) {
        const img = document.createElement('img');

        img.src = images[i];

        img.classList.add("render");

        const objectCSS = new CSS3DObject(img);
        objectCSS.position.x = Math.random() * 4000 - 2000;
        objectCSS.position.y = Math.random() * 4000 - 2000;
        objectCSS.position.z = Math.random() * 4000 - 2000;

        scene.add(objectCSS);
        objects.push(objectCSS);
    }
    return objects;
}

function transform(targets, duration, scale = 1) {
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
            .to({ x: scale, y: scale, z: scale })
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

function visibleOverflowStyling() {
    const sceneDiv = document.querySelector('.mag-carousel .scene');
    if (sceneDiv) {
        sceneDiv.style.overflow = 'visible';
    }
}

export { init, animate, controls };