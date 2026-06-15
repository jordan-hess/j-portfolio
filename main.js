import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// HTML elements
const popup = document.getElementById('popup');
const closePopupButton = document.getElementById('popup-exit-button');

const loading = document.getElementById('loading');

const welcome = document.getElementById('welcome');
const closeWelcomeButton = document.getElementById('welcome-exit-button');

const hobbiesPopup = document.getElementById('hobbies-popup');
const closeHobbiesButton = document.getElementById('hobbies-exit-button');
const matPopup = document.getElementById('mat-popup');
const closeMatButton = document.getElementById('mat-exit-button');
const storyPopup = document.getElementById('story-popup');
const closeStoryButton = document.getElementById('story-exit-button');
const floatText = document.getElementById('float-text');
const floatTextContent = document.getElementById('float-text-content');
let floatTextTimeout = null;

// Typing animation — cascade through all popup sections
const sectionData = Array.from(document.querySelectorAll('#popup .portfolio-section')).map(section => ({
    h2: section.querySelector('h2'),
    text: section.querySelector('h2').textContent.trim(),
    content: section.querySelector('h2').nextElementSibling
}));
let typingTimeouts = [];

function clearAllTypingTimeouts() {
    typingTimeouts.forEach(clearTimeout);
    typingTimeouts = [];
}

function startTyping() {
    clearAllTypingTimeouts();
    sectionData.forEach(({ h2, content }) => {
        h2.textContent = '';
        h2.classList.add('typing-h2');
        if (content) { content.style.transition = 'none'; content.style.opacity = '0'; }
    });

    const CHAR_MS = 30;
    let time = 0;

    sectionData.forEach(({ h2, text, content }) => {
        for (let i = 0; i < text.length; i++) {
            const ch = text[i];
            typingTimeouts.push(setTimeout(() => { h2.textContent += ch; }, time + i * CHAR_MS));
        }
        const headingDone = time + text.length * CHAR_MS;
        typingTimeouts.push(setTimeout(() => h2.classList.remove('typing-h2'), headingDone));
        if (content) {
            typingTimeouts.push(setTimeout(() => {
                content.style.transition = 'opacity 200ms ease';
                content.style.opacity = '1';
            }, headingDone + 50));
        }
        time = headingDone + 350;
    });
}

function resetTyping() {
    clearAllTypingTimeouts();
    sectionData.forEach(({ h2, text, content }) => {
        h2.textContent = text;
        h2.classList.remove('typing-h2');
        if (content) { content.style.opacity = '1'; content.style.transition = 'none'; }
    });
}

// Base three.js set up
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xFFFFFF);
const canvas = document.getElementById('portfolio-canvas');
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
};

const renderer = new THREE.WebGLRenderer({canvas: canvas, antialias: true});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));

const raycaster = new THREE.Raycaster();
const mouseVec = new THREE.Vector2();
let lastRaycastTime = 0;

// Config renderer so things look better
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

// Load 3D model
let intersectedObjectName = "";
let intersectedObject;
const intersectObjects = [];
const intersectObjectsNames = [
    "Portfolio",
    // Links
    "Github",
    "TwitterX",
    // Jump
    "Backpack",
    "Book",
    "Cactus",
    "Can1",
    "Can2",
    "Can3",
    "Mat",
    "Mug",
    "Pokeball",
    "Rubix Cube",
    "Skateboard",
    // Spin
    "Chair"
]

const loader = new GLTFLoader();
loader.load(
    "/portfolio_room.glb",
    function(glb){
        console.log(intersectObjects);
        const meshColors = {
            "Wall":       0x8892B0,  // light grey wall
            // "Text001":  0xF43535, //HELLO WRLD TXT              
            // "Text002_1":  0xc8c8c8,  // portfolio 
            // "Cube018_1":  0x000000,  // TwitterX
            "Table":     0x8892B0,  // light grey
            "Mousepad":  0xF43535,  // Red
            "Plane001":  0x171717,   // black top
            "FloorPlanks":    0x8892B0,   // light grey floor
            "Plane002":  0x171717,   // black
            "Plane003" :  0x8892B0,   // dark grey left
            "Drawer020": 0x8892B0,   // 
            "Drawer021": 0x8892B0,   // 
            "Drawer022": 0x8892B0,   //
            "Drawer":   0x6c748b,   // 
            "BookCactus": 0x6c748b,   //
            "Plane028": 0x171717,
            "Cube070": 0x171717,
            "Cube070_1": 0x228B22,
            "Cube060": 0x171717,
            "Cube060_1": 0x000000,
            "Cube060_2": 0x171717,
            "Cube060_3": 0xF43535,
            "Cube060_4": 0x6c748b, //books
            "Cube060_5": 0xF43535,
            "Cube060_6": 0xFFFFFF,
            "Cube084_2": 0x000000,
            "Cube084_1": 0xF43535,
            "Cube084": 0xFFFFFF,
            "Cube004": 0xFFFFFF, //cup
            "Plane029_1": 0x171717,
            "Plane029": 0xFFFFFF, //window
            "Plane022": 0x171717,
            "Plane022_1": 0xF43535,
            "Plane023_1": 0xF43535,
            "Plane023": 0x171717,
            "Cube073": 0x171717,
            "Cube073_1": 0xF43535,
            "Cube073_2": 0xFFFFFF,
            "Cube048_1"  : 0x228B22, //book
            "Cube005_3": 0x171717,
            "Cube005_1": 0x228B22,//green rubix
            "Poster": 0xFFFFFF,
            "Cube092_1": 0x228B22, //skateboard
            "Cube093": 0xFFFFFF,
            "Cube093_1": 0x171717,
            "Cube006": 0xFFFFFF,
            "Cube017_1": 0xFFFFFF,

            
        };

        const hsl = {};
        glb.scene.traverse(child => {
            if (intersectObjectsNames.includes(child.name)) {
                intersectObjects.push(child);
            }
            if (child.name === "Plane030" || child.name === "Plane030_1" || child.name === "Plane030_2" ||
                child.name === "Cube018" || child.name === "Cube018_1") {
                child.visible = false;
            }
            if (!child.isMesh) return;
            child.castShadow = true;
            child.receiveShadow = true;
            if (meshColors[child.name] !== undefined) {
                child.material = child.material.clone();
                child.material.color.set(meshColors[child.name]);
            } else {
                const mats = Array.isArray(child.material) ? child.material : [child.material];
                mats.forEach((mat, i) => {
                    if (!mat.color) return;
                    mat.color.getHSL(hsl);
                    if (hsl.h >= 0.65 && hsl.h <= 0.85 && hsl.s > 0.15) {
                        const newMat = mat.clone();
                        newMat.color.set(0xF43535);
                        if (Array.isArray(child.material)) child.material[i] = newMat;
                        else child.material = newMat;
                    }
                });
            }
        });

        scene.add(glb.scene);
        setupLights();
        loading.classList.toggle('hidden');
    },
    undefined,
    function(error){
        console.error();
    }
);

// Set up lights
function setupLights(){
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xB2BEB5, 0.3);
    scene.add(ambientLight);

    // Main/Sun light
    const sun = new THREE.DirectionalLight(0xffffd0, 1.5);
    sun.position.set(15, 25, 10);
    sun.castShadow = true;

    sun.shadow.camera.near = 0.1;
    sun.shadow.camera.far = 50;
    sun.shadow.camera.left = -10;
    sun.shadow.camera.right = 10;
    sun.shadow.camera.top = 10;
    sun.shadow.camera.bottom = -10;
    const shadowMapSize = sizes.width < 800 ? 1024 : 2048;
    sun.shadow.mapSize.width = shadowMapSize;
    sun.shadow.mapSize.height = shadowMapSize;
    sun.shadow.bias = -0.001;

    scene.add(sun);

    // Secondary light
    const fillLight = new THREE.DirectionalLight(0xD3D3D3, 0.5);
    fillLight.position.set(-8, 12, 0);
    scene.add(fillLight);
}

// Set up camera and camera controls
const camera = new THREE.PerspectiveCamera(
    45,
    sizes.width / sizes.height,
    0.1,
    1000
);
const controls = new OrbitControls(camera, canvas);
// no moving camera around
controls.enablePan = false;
// smoother movement
controls.enableDamping = true;
controls.dampingFactor = 0.05;
// limit camera rotation
controls.minPolarAngle = Math.PI / 4; 
controls.maxPolarAngle = Math.PI / 2;
controls.minAzimuthAngle = 0;
controls.maxAzimuthAngle = Math.PI / 2;
// limit camera zooming
controls.minDistance = 10; 
controls.maxDistance = 30;

camera.position.x = 14.7;
camera.position.y = 8.2;
camera.position.z = 6.1;

if(sizes.width < 800){
    camera.position.x = 25;   
    camera.position.y = 8;    
    camera.position.z = 15;  
    controls.maxDistance = 30;
}

controls.target.set(-1, 3, -1.5); 
controls.update();

// GSAP Animations
function jumpObject(object) {
    gsap.timeline()
        .to(object.position, { 
            y: object.position.y+0.5, 
            duration: 0.3, 
            ease: "power2.out" 
        })
        .to(object.position, { 
            y: object.position.y, 
            duration: 0.3, 
            ease: "bounce.out" 
        });
}

function spinObject(object) {
    gsap.to(object.rotation, {
        y: object.rotation.y + Math.PI * 2,
        duration: 1,
        ease: "power2.inOut"
    });
}

function showFloatText(message) {
    floatTextContent.textContent = message;
    floatText.classList.remove('hidden');
    floatText.getBoundingClientRect(); // force reflow so transition fires
    floatText.classList.add('visible');
    clearTimeout(floatTextTimeout);
    floatTextTimeout = setTimeout(() => {
        floatText.classList.remove('visible');
        setTimeout(() => floatText.classList.add('hidden'), 600);
    }, 3000);
}

// Resize canvas responsively
function onResize(){
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;
    camera.aspect = sizes.width/sizes.height;
    camera.updateProjectionMatrix();

    renderer.setSize(sizes.width, sizes.height);
}
window.addEventListener("resize", onResize);

function onMouseMove(event) {
    if (!popup.classList.contains('hidden')) return;
    const now = performance.now();
    if (now - lastRaycastTime < 50) return;
    lastRaycastTime = now;
    const rect = canvas.getBoundingClientRect();
    mouseVec.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
    raycaster.setFromCamera(mouseVec, camera);
    const hits = raycaster.intersectObjects(intersectObjects, true);
    canvas.style.cursor = hits.length > 0 ? 'pointer' : 'default';
}
window.addEventListener('pointermove', onMouseMove);

// Interact with 3D objects
function onClick(event){
   // Prevent default touch behavior to avoid scrolling
   event.preventDefault();

   let clientX, clientY;

   // Check if the event is a touch event
   if (event.touches) {
       clientX = event.touches[0].clientX;
       clientY = event.touches[0].clientY;
   } else {
       clientX = event.clientX;
       clientY = event.clientY;
   }

   // Get the canvas's position and size
   const rect = canvas.getBoundingClientRect();
   const x = ((clientX - rect.left) / rect.width) * 2 - 1;
   const y = -((clientY - rect.top) / rect.height) * 2 + 1;

   // Update the raycaster with the current pointer position
   mouseVec.set(x, y);
   raycaster.setFromCamera(mouseVec, camera);

   // Find intersections
   const intersects = raycaster.intersectObjects(intersectObjects, true);

   if (intersects.length > 0) {
       const intersectedObject = intersects[0].object.parent;
       const name = intersectedObject.name;

       if (name === "Portfolio") {
           const isOpening = popup.classList.contains("hidden");
           popup.classList.toggle("hidden");
           if (isOpening) startTyping(); else resetTyping();
       } else if (name === "Github") {
           window.open('https://github.com/jordan-hess', '_blank');
       } else if (name === "Instagram") {
           window.open('https://www.instagram.com/jordnhess/', '_blank');
       } else if (name === "Skateboard") {
           jumpObject(intersectedObject);
           hobbiesPopup.classList.remove('hidden');
       } else if (name === "Mug") {
           jumpObject(intersectedObject);
           showFloatText("if you clicked this I probably already had coffee");
       } else if (name === "Mat") {
           jumpObject(intersectedObject);
           matPopup.classList.remove('hidden');
       } else if (name === "Book") {
           jumpObject(intersectedObject);
           storyPopup.classList.remove('hidden');
       } else if (name === "Chair") {
           spinObject(intersectedObject);
           showFloatText("thats my spot.");
       } else {
           jumpObject(intersectedObject);
       }
   }
}
window.addEventListener("pointerdown", onClick);

closePopupButton.addEventListener("click", () => {
    popup.classList.toggle('hidden');
    resetTyping();
});

closeWelcomeButton.addEventListener("click", () =>{
    welcome.classList.toggle('hidden');
});

closeHobbiesButton.addEventListener("click", () => {
    hobbiesPopup.classList.add('hidden');
});

closeMatButton.addEventListener("click", () => {
    matPopup.classList.add('hidden');
});

closeStoryButton.addEventListener("click", () => {
    storyPopup.classList.add('hidden');
});

document.getElementById('story-yes').addEventListener("click", () => {
    window.open('https://lifechoices.co.za/jordan-hess/', '_blank');
    storyPopup.classList.add('hidden');
});

document.getElementById('story-no').addEventListener("click", () => {
    storyPopup.classList.add('hidden');
});

// Click outside any popup overlay to close it
[welcome, popup, hobbiesPopup, matPopup, storyPopup].forEach(overlay => {
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            if (overlay === popup) resetTyping();
            overlay.classList.add('hidden');
        }
    });
});

// Animation Loop
function animate(){
    controls.update(); 
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}
animate();

