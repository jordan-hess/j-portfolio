import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { drawPosterLogo, loadPosterFonts } from './posterLogo.js';

// HTML elements
const $ = (id) => document.getElementById(id);
const popup = $('popup');
const loading = $('loading');
const progressBar = $('progress-bar');
const progressLabel = $('progress-label');
const welcome = $('welcome');
const hobbiesPopup = $('hobbies-popup');
const matPopup = $('mat-popup');
const storyPopup = $('story-popup');
const quickNav = $('quick-nav');
const floatText = $('float-text');
const floatTextContent = $('float-text-content');
let floatTextTimeout = null;

const allPopups = [welcome, popup, hobbiesPopup, matPopup, storyPopup];
const isOpen = (p) => !p.classList.contains('hidden');
const anyPopupOpen = () => allPopups.some(isOpen);

// ---------- Popups ----------
let focusBeforePopup = null;
let introPulseDone = false;

function openPopup(el) {
    closeAllPopups({ restoreFocus: false });
    if (!focusBeforePopup) focusBeforePopup = document.activeElement;
    el.classList.remove('hidden');
    clearHover();
    el.querySelector('.popup-close')?.focus({ preventScroll: true });
}

function closeAllPopups({ restoreFocus = true } = {}) {
    const welcomeWasOpen = isOpen(welcome);
    allPopups.forEach(p => p.classList.add('hidden'));
    resetTyping();
    if (restoreFocus) {
        if (focusBeforePopup && document.contains(focusBeforePopup)) focusBeforePopup.focus?.({ preventScroll: true });
        focusBeforePopup = null;
    }
    if (welcomeWasOpen && !introPulseDone) {
        introPulseDone = true;
        pulseKeyObjects();
        revealPosterLogo();
    }
}

function openPortfolio(sectionId) {
    openPopup(popup);
    if (sectionId) {
        scrollToSection(sectionId, 'auto');
    } else {
        monitorContent.scrollTop = 0;
        startTyping();
    }
}

function scrollToSection(sectionId, behavior = 'smooth') {
    resetTyping();
    const tab = tabButtons.find(btn => btn.dataset.section === sectionId);
    if (tab) {
        spyLockedUntil = performance.now() + 1200;
        setActiveTab(tab);
    }
    document.getElementById(sectionId)?.scrollIntoView({ behavior, block: 'start' });
}

// Called from index.html once the logo animation finishes
window.showWelcome = () => {
    openPopup(welcome);
    quickNav.classList.remove('hidden');
};

// Close buttons, backdrop clicks and Escape
allPopups.forEach(overlay => {
    overlay.querySelector('.popup-close').addEventListener('click', () => closeAllPopups());
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeAllPopups();
    });
});
$('welcome-go').addEventListener('click', () => closeAllPopups());
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && anyPopupOpen()) closeAllPopups();
});

$('story-yes').addEventListener('click', () => {
    window.open('https://lifechoices.co.za/jordan-hess/', '_blank', 'noopener');
    closeAllPopups();
});
$('story-no').addEventListener('click', () => closeAllPopups());

// Section tabs inside the monitor, with the current section highlighted
const monitorContent = popup.querySelector('.monitor-content');
const tabButtons = [...popup.querySelectorAll('.popup-tabs button')];
tabButtons.forEach(btn => {
    btn.addEventListener('click', () => scrollToSection(btn.dataset.section));
});

// While a tab-triggered scroll is running, keep that tab highlighted instead of
// flicking through every section the scroll passes.
let spyLockedUntil = 0;
function setActiveTab(current) {
    tabButtons.forEach(btn => {
        btn.classList.toggle('is-active', btn === current);
        if (btn === current) btn.setAttribute('aria-current', 'true');
        else btn.removeAttribute('aria-current');
    });
    const strip = current.parentElement;
    const left = current.offsetLeft; // .popup-tabs is position: relative
    if (left < strip.scrollLeft || left + current.offsetWidth > strip.scrollLeft + strip.clientWidth) {
        strip.scrollLeft = left - 12;
    }
}

function updateActiveTab() {
    if (performance.now() < spyLockedUntil) return;
    const top = monitorContent.scrollTop + 90;
    const atBottom = monitorContent.scrollTop + monitorContent.clientHeight >= monitorContent.scrollHeight - 4;
    let current = tabButtons[0];
    for (const btn of tabButtons) {
        const section = document.getElementById(btn.dataset.section);
        if (section.offsetTop <= top) current = btn;
    }
    if (atBottom) current = tabButtons[tabButtons.length - 1];
    if (!current.classList.contains('is-active')) setActiveTab(current);
}
monitorContent.addEventListener('scroll', updateActiveTab, { passive: true });
monitorContent.addEventListener('scrollend', () => { spyLockedUntil = 0; });
updateActiveTab();

// Hotbar (outside the 3D scene). Number keys 1-4 work like a game hotbar.
const hotbarSlots = [...quickNav.querySelectorAll('.slot')];
quickNav.querySelectorAll('button[data-section]').forEach(btn => {
    btn.addEventListener('click', () => openPortfolio(btn.dataset.section));
});
window.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || anyPopupOpen() || quickNav.classList.contains('hidden')) return;
    const slot = hotbarSlots[Number(e.key) - 1];
    if (!slot) return;
    slot.classList.add('is-pressed');
    setTimeout(() => slot.classList.remove('is-pressed'), 150);
    slot.click();
});

// ---------- Typing animation (cascades through all portfolio sections) ----------
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

// ---------- Three.js setup ----------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xFFFFFF);
const canvas = $('portfolio-canvas');
const sizes = { width: window.innerWidth, height: window.innerHeight };

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

const raycaster = new THREE.Raycaster();
const pointerVec = new THREE.Vector2();
let lastRaycastTime = 0;

// ---------- Interactive objects ----------
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
];
const KEY_OBJECTS = ["Portfolio", "Skateboard", "Book", "Mat"];
const GLOW_COLOR = new THREE.Color(0xF43535);
const HOVER_INTENSITY = 0.35;

// Walk up from a hit mesh to the interactive object it belongs to
function findInteractive(obj) {
    while (obj) {
        if (obj.userData.interactive) return obj;
        obj = obj.parent;
    }
    return null;
}

function setGlow(group, intensity) {
    group.userData.glowMaterials?.forEach(mat => {
        if (intensity > 0) {
            mat.emissive.copy(GLOW_COLOR);
            mat.emissiveIntensity = intensity;
        } else {
            mat.emissive.copy(mat.userData.baseEmissive);
            mat.emissiveIntensity = mat.userData.baseEmissiveIntensity;
        }
    });
}

// Glow from the intro pulse, so hover doesn't fight with it
const pulseLevels = new Map();
let hovered = null;

function setHover(group) {
    if (group === hovered) return;
    if (hovered) setGlow(hovered, pulseLevels.get(hovered) ?? 0);
    hovered = group;
    if (hovered) setGlow(hovered, HOVER_INTENSITY);
    canvas.style.cursor = hovered ? 'pointer' : 'default';
}
function clearHover() { setHover(null); }

function pulseKeyObjects() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    intersectObjects
        .filter(o => KEY_OBJECTS.includes(o.name))
        .forEach(group => {
            const level = { v: 0 };
            gsap.to(level, {
                v: 0.55,
                duration: 0.65,
                repeat: 5,
                yoyo: true,
                ease: 'sine.inOut',
                onUpdate: () => {
                    pulseLevels.set(group, level.v);
                    if (group !== hovered) setGlow(group, level.v);
                },
                onComplete: () => {
                    pulseLevels.delete(group);
                    if (group !== hovered) setGlow(group, 0);
                }
            });
        });
}

// ---------- Load model ----------
function setProgress(pct) {
    progressBar.style.width = `${pct}%`;
    progressLabel.textContent = `${Math.round(pct)}%`;
}

const loader = new GLTFLoader();
loader.load(
    "/portfolio_room.glb",
    function (glb) {
        const meshColors = {
            "Wall":       0x8892B0,  // light grey wall
            "Table":      0x8892B0,  // light grey
            "Mousepad":   0xF43535,  // red
            "Plane001":   0x171717,  // black top
            "FloorPlanks":0x8892B0,  // light grey floor
            "Plane002":   0x171717,  // black floor
            "Plane003":   0x8892B0,  // back walls
            "Drawer020":  0x8892B0,
            "Drawer021":  0x8892B0,
            "Drawer022":  0x8892B0,
            "Drawer":     0x6c748b,
            "BookCactus": 0x6c748b,
            "Plane028":   0x171717,
            "Cube070":    0x171717,
            "Cube070_1":  0x228B22,
            "Cube060":    0x171717,
            "Cube060_1":  0x000000,
            "Cube060_2":  0x171717,
            "Cube060_3":  0xF43535,
            "Cube060_4":  0x6c748b,  // books
            "Cube060_5":  0xF43535,
            "Cube060_6":  0xFFFFFF,
            "Cube084_2":  0x000000,
            "Cube084_1":  0xF43535,
            "Cube084":    0xFFFFFF,
            "Cube004":    0xFFFFFF,  // cup
            "Plane029_1": 0x171717,
            "Plane029":   0xFFFFFF,  // window
            "Plane022":   0x171717,
            "Plane022_1": 0xF43535,
            "Plane023_1": 0xF43535,
            "Plane023":   0x171717,
            "Cube073":    0x171717,
            "Cube073_1":  0xF43535,
            "Cube073_2":  0xFFFFFF,  // backpack
            "Cube048_1":  0x228B22,  // book
            "Cube048":    0x171717,  // book pages
            "Cube005_3":  0x171717,
            "Cube005_1":  0x228B22,  // green rubix
            "Poster":     0xFFFFFF,
            "Cube092_1":  0x228B22,  // skateboard
            "Cube093":    0xFFFFFF,
            "Cube093_1":  0x171717,
            "Cube006":    0xFFFFFF,
            "Cube017_1":  0xFFFFFF,
        };
        const hidden = new Set(["Plane030", "Plane030_1", "Plane030_2", "Cube018", "Cube018_1"]);

        const hsl = {};
        glb.scene.traverse(child => {
            if (intersectObjectsNames.includes(child.name)) {
                child.userData.interactive = true;
                intersectObjects.push(child);
            }
            if (hidden.has(child.name)) child.visible = false;
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

        // Give each interactive object its own materials so glow doesn't leak onto shared ones
        intersectObjects.forEach(group => {
            const glowMaterials = [];
            group.traverse(mesh => {
                if (!mesh.isMesh) return;
                const clone = (m) => {
                    const c = m.clone();
                    if (c.emissive) {
                        c.userData.baseEmissive = c.emissive.clone();
                        c.userData.baseEmissiveIntensity = c.emissiveIntensity;
                        glowMaterials.push(c);
                    }
                    return c;
                };
                mesh.material = Array.isArray(mesh.material) ? mesh.material.map(clone) : clone(mesh.material);
            });
            group.userData.glowMaterials = glowMaterials;
        });

        scene.add(glb.scene);
        addPosterLogo(glb.scene);
        setupLights();
        setProgress(100);
        loading.classList.add('hidden');
        if (window.startLogoAnimation) window.startLogoAnimation();
        else window.showWelcome();
    },
    function (xhr) {
        if (xhr.lengthComputable && xhr.total > 0) {
            progressBar.parentElement.classList.remove('indeterminate');
            setProgress((xhr.loaded / xhr.total) * 100);
        } else {
            progressBar.parentElement.classList.add('indeterminate');
            progressLabel.textContent = `${(xhr.loaded / 1024).toFixed(0)} KB`;
        }
    },
    function (error) {
        console.error(error);
        loading.querySelector('h2').textContent = "Couldn't load the room";
        loading.querySelector('p').textContent = 'Please refresh the page, or use the bar at the bottom of the screen.';
        quickNav.classList.remove('hidden');
    }
);

// ---------- Wall poster: blank until the welcome closes, then the intro logo ----------
// The model's "HELLO, WORLD." is 3D text geometry, so it's hidden as soon as the
// room loads. A canvas-textured panel sits over the poster's front face (the face
// pointing toward +x) and appears when revealPosterLogo() runs.
const posterSwap = { panel: null, pending: false };

async function addPosterLogo(root) {
    const oldText = root.getObjectByName('Text001') || root.getObjectByName('Text.001');
    if (oldText) oldText.visible = false;

    const poster = root.getObjectByName('Poster');
    if (!poster) return;
    const box = new THREE.Box3().setFromObject(poster);
    const width = (box.max.z - box.min.z) * 0.94;
    const height = (box.max.y - box.min.y) * 0.94;

    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = Math.round(1024 * (height / width));
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

    const panel = new THREE.Mesh(
        new THREE.PlaneGeometry(width, height),
        new THREE.MeshStandardMaterial({ map: texture, transparent: true, roughness: 1 })
    );
    panel.rotation.y = Math.PI / 2; // face +x, toward the camera
    panel.position.set(box.max.x + 0.004, (box.min.y + box.max.y) / 2, (box.min.z + box.max.z) / 2);
    panel.receiveShadow = true;
    panel.visible = false;
    scene.add(panel);
    posterSwap.panel = panel;
    if (posterSwap.pending) revealPosterLogo();

    // Canvas text needs the web fonts to be ready, or it falls back to system fonts
    await loadPosterFonts();
    drawPosterLogo(canvas);
    texture.needsUpdate = true;
}

function revealPosterLogo() {
    const { panel } = posterSwap;
    if (!panel) { posterSwap.pending = true; return; }
    posterSwap.pending = false;
    if (panel.visible) return;
    panel.visible = true;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    panel.material.opacity = 0;
    panel.scale.setScalar(0.85);
    gsap.to(panel.material, { opacity: 1, duration: 0.5, ease: 'power1.out' });
    gsap.to(panel.scale, { x: 1, y: 1, z: 1, duration: 0.6, ease: 'back.out(2)' });
}

// ---------- Lights ----------
function setupLights() {
    scene.add(new THREE.AmbientLight(0xB2BEB5, 0.3));

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

    const fillLight = new THREE.DirectionalLight(0xD3D3D3, 0.5);
    fillLight.position.set(-8, 12, 0);
    scene.add(fillLight);
}

// ---------- Camera ----------
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 1000);
const controls = new OrbitControls(camera, canvas);
controls.enablePan = false;
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minPolarAngle = Math.PI / 4;
controls.maxPolarAngle = Math.PI / 2;
controls.minAzimuthAngle = 0;
controls.maxAzimuthAngle = Math.PI / 2;

controls.target.set(-1, 3, -1.5);
camera.position.set(14.7, 8.2, 6.1);

// Desktop framing is ~18 units away. The room is width-limited on portrait
// screens, so move back just enough to keep most of it in view, accepting a
// slight crop at the edges rather than leaving the room tiny.
const BASE_DISTANCE = 18.2;
function idealDistance(aspect) {
    if (aspect >= 1.3) return BASE_DISTANCE;
    return BASE_DISTANCE * Math.pow(1.3 / aspect, 0.5);
}

function frameCamera() {
    const dist = idealDistance(sizes.width / sizes.height);
    controls.minDistance = Math.min(10, dist * 0.6);
    controls.maxDistance = Math.max(30, dist * 1.4);
    const dir = camera.position.clone().sub(controls.target).normalize();
    camera.position.copy(controls.target).addScaledVector(dir, dist);
    controls.update();
}
frameCamera();

// ---------- GSAP animations ----------
function jumpObject(object) {
    if (gsap.isTweening(object.position)) return;
    const y = object.position.y;
    gsap.timeline()
        .to(object.position, { y: y + 0.5, duration: 0.3, ease: "power2.out" })
        .to(object.position, { y, duration: 0.3, ease: "bounce.out" });
}

function spinObject(object) {
    if (gsap.isTweening(object.rotation)) return;
    gsap.to(object.rotation, {
        y: object.rotation.y + Math.PI * 2,
        duration: 1,
        ease: "power2.inOut"
    });
}

function showFloatText(message) {
    floatTextContent.textContent = message;
    floatText.classList.remove('hidden');
    floatText.getBoundingClientRect(); // force reflow so the transition fires
    floatText.classList.add('visible');
    clearTimeout(floatTextTimeout);
    floatTextTimeout = setTimeout(() => {
        floatText.classList.remove('visible');
        floatTextTimeout = setTimeout(() => floatText.classList.add('hidden'), 600);
    }, 3000);
}

// ---------- Resize ----------
function onResize() {
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();
    renderer.setSize(sizes.width, sizes.height);
    frameCamera();
}
window.addEventListener("resize", onResize);

// ---------- Pointer interaction ----------
function pickAt(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    pointerVec.set(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1
    );
    raycaster.setFromCamera(pointerVec, camera);
    const hits = raycaster.intersectObjects(intersectObjects, true);
    return hits.length ? findInteractive(hits[0].object) : null;
}

canvas.addEventListener('pointermove', (event) => {
    if (event.pointerType !== 'mouse' || anyPopupOpen()) return;
    const now = performance.now();
    if (now - lastRaycastTime < 50) return;
    lastRaycastTime = now;
    setHover(pickAt(event.clientX, event.clientY));
});
canvas.addEventListener('pointerleave', clearHover);

// Treat a press as a click only if the pointer barely moved (so orbiting doesn't trigger objects)
let pressStart = null;
canvas.addEventListener('pointerdown', (e) => { pressStart = { x: e.clientX, y: e.clientY }; });
canvas.addEventListener('pointerup', (e) => {
    if (!pressStart) return;
    const moved = Math.hypot(e.clientX - pressStart.x, e.clientY - pressStart.y);
    pressStart = null;
    if (moved > 8 || anyPopupOpen()) return;
    const hit = pickAt(e.clientX, e.clientY);
    if (hit) handleObjectClick(hit);
});

const FLOAT_LINES = {
    Mug: "if you clicked this I probably already had coffee",
    Chair: "thats my spot.",
    Backpack: "Couldn't think of a bag joke",
    Can1: "Fuel for late-night debugging.",
    Can2: "Fuel for late-night debugging.",
    Can3: "Fuel for late-night debugging.",
    Cactus: "The only plant I haven't killed.",
    "Rubix Cube": "Still faster at CSS than solving this.",
    Pokeball: "Gotta commit 'em all.",
};
const SPINNERS = new Set(["Chair", "Backpack"]);

function handleObjectClick(hit) {
    const name = hit.name;

    if (name === "Portfolio") return openPortfolio();
    if (name === "Github") return window.open('https://github.com/jordan-hess', '_blank', 'noopener');

    if (SPINNERS.has(name)) spinObject(hit);
    else jumpObject(hit);

    if (name === "Skateboard") openPopup(hobbiesPopup);
    else if (name === "Mat") openPopup(matPopup);
    else if (name === "Book") openPopup(storyPopup);
    else if (FLOAT_LINES[name]) showFloatText(FLOAT_LINES[name]);
}

// ---------- Render loop ----------
function animate() {
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}
animate();
