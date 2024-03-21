import * as THREE from 'three';
import { OrbitControls } from './node_modules/three/examples/jsm/controls/OrbitControls.js';
import { Engine } from './engine.js';

const mouse = {
    x: 0,
    y: 0
}

// Create a renderer
const renderer = new THREE.WebGLRenderer({ canvas: document.querySelector('canvas') });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// Create a camera
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 6;

let controls = new OrbitControls(camera, renderer.domElement);
controls.enableZoom = true;
controls.enablePan = false;
controls.minDistance = 5;
controls.maxDistance = 10;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xefffff);

// Lighting
scene.add(new THREE.AmbientLight(0xffffff, .5));
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
scene.add(directionalLight);


// Canvas resize
window.addEventListener('resize', () => {
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

const g = new THREE.IcosahedronGeometry(0.25, 0);
const gray = new THREE.MeshBasicMaterial( { color: 0x777777, wireframe: false, side: THREE.DoubleSide } );
const points = [];
for (let i = 0; i < 8; i++)
{
    const material = new THREE.MeshStandardMaterial( { color: 0x000000, wireframe: false, side: THREE.DoubleSide } );

    points[i] = new THREE.Mesh(g, material);
    points[i].position.x = i > 3 ? -1 : 1;
    points[i].position.y = i < 4          ? (i + 1) % 2 * 2 - 1 : i % 2 * 2 - 1;
    points[i].position.z = i > 1 && i < 6 ? (i + 1) % 2 * 2 - 1 : i % 2 * 2 - 1;
    
    scene.add(points[i]);
}

function onPointerMove( event ) {
	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}

addEventListener('mousemove', onPointerMove);

for (let i = 0; i < points.length; i++)
    points[i].selected = false;

let intersects = {};
const cursor = {
    pressed: false,
    raycaster: new THREE.Raycaster(),
    update() {

        this.raycaster.setFromCamera(mouse, camera);
        intersects = this.raycaster.intersectObjects( scene.children );

        for (let i = 0; i < points.length; i++)
            if (!points[i].selected)
                points[i].material.color.set(0xfefeff);
        
        if (intersects.length > 0 && intersects[0].object.selectable == undefined)
            intersects[0].object.material.color.set( 0xff0000 );
    }
}

let triVerts = new Float32Array(0);
console.log(triVerts)
let triangle = {}
let x = [];
let verts = 3;

document.querySelector('div').addEventListener('click', () => {
    verts = (verts - 2) % 2 + 3;
    document.querySelector('div').innerHTML = `Vertices: ${verts}`;
})

addEventListener('mousedown', () => cursor.pressed = true);
addEventListener('mousemove', () => cursor.pressed = false);
addEventListener('mouseup', () => {
    
    if (cursor.pressed)
    {
        if (intersects.length == 0) return;

        if (x.length >= verts*3)
        {
            for (let i = 0; i < points.length; i++)
                points[i].selected = false;
            x=[];
            scene.remove(triangle);
        }

        intersects[0].object.selected = true;
        x.push(intersects[0].object.position.x, intersects[0].object.position.y, intersects[0].object.position.z);
        if (x.length == verts*3)
        {
            const tG = new THREE.BufferGeometry();

            triVerts = new Float32Array(x);

            const indeces = [
                0, 1, 2,
                1, 2, 3
            ];

            tG.setIndex(indeces);
            tG.setAttribute( 'position', new THREE.BufferAttribute( triVerts, 3 ) );
            triangle = new THREE.Mesh(tG, gray);
            triangle.selectable = false;
            scene.add(triangle);
        }
    }
    
    cursor.pressed = false;
});

const update = () => {
    cursor.update();
}
const render = () => {
    renderer.render(scene, camera);
}
const engine = new Engine(30, update, render);
engine.start();