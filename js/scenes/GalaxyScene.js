class GalaxyScene {
    constructor() {
        this.container = document.getElementById('canvas-container');
        this.uiContainer = document.getElementById('galaxy-ui');

        // Three.js
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.currentPlanetMesh = null;

        // Data
        this.planetData = {
            'Mercury': { texture: 'real_planets/mercury.jpg', desc: '電子超載 – 感受Trance的迷幻脈動，體驗Techno的重力加速度。', color: 'text-blue-400' },
            'Venus': { texture: 'real_planets/venus.jpg', desc: '金星熱浪 – 在炙熱節奏中搖擺，釋放最奔放的靈魂。', color: 'text-yellow-400' },
            'Earth': { texture: 'real_planets/earth.jpg', desc: '地球共鳴 – 來自全球的獨立之聲，探索音樂的無限可能。', color: 'text-green-400' },
            'Mars': { texture: 'real_planets/mars.jpg', desc: '火星核心 – 點燃腎上腺素，感受重金屬的原始爆發力。', color: 'text-red-500' },
            'Jupiter': { texture: 'real_planets/jupiter.jpg', desc: '木星雲圖 – 嘻哈疆域，掌握潮流脈動，領略街頭文化的多元風貌。', color: 'text-orange-400' },
            'Saturn': { texture: 'real_planets/saturn.jpg', desc: '土星光環 – 爵士迴廊，在光環下沉醉，品味藍調的醇厚與爵士的即興。', hasRing: true, ringTexture: 'real_planets/saturn_ring_alpha.png', color: 'text-yellow-200' },
            'Uranus': { texture: 'real_planets/uranus.jpg', desc: '天王星稜鏡 – 實驗音波，挑戰聽覺極限，解鎖前衛聲響的新維度。', color: 'text-cyan-300' },
            'Neptune': { texture: 'real_planets/neptune.jpg', desc: '海王星深淵 – 迷幻迴聲，潛入深藍夢境，讓音符帶你進入冥想。', color: 'text-blue-600' }
        };

        this.targetPlanet = 'Jupiter'; // Build start with Jupiter
        this.animate = this.animate.bind(this);

        // Background music
        this.bgMusic = null;
    }

    enter() {
        this.initThreeJS();
        this.renderDashboardUI();
        this.loadPlanet(this.targetPlanet);
        this.animate();

        // Play background music
        if (!this.bgMusic) {
            this.bgMusic = new Audio('assets/audio/bmusic.mp3');
            this.bgMusic.loop = true;
            this.bgMusic.volume = 0.5;
        }
        this.bgMusic.play().catch(err => console.log('Audio play failed:', err));
    }

    exit() {
        cancelAnimationFrame(this.frameId);
        this.container.innerHTML = '';
        this.uiContainer.innerHTML = '';
        this.uiContainer.style.display = 'none';

        // Stop background music
        if (this.bgMusic) {
            this.bgMusic.pause();
            this.bgMusic.currentTime = 0;
        }
    }

    initThreeJS() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.z = 25; // Closer view for single planet

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.container.appendChild(this.renderer.domElement);

        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(ambientLight);
        const dirLight = new THREE.DirectionalLight(0xffffff, 1);
        dirLight.position.set(5, 3, 5);
        this.scene.add(dirLight);

        // Skybox
        const loader = new THREE.CubeTextureLoader();
        loader.setPath('assets/textures/');
        const textureCube = loader.load(['px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png']);
        this.scene.background = textureCube;
    }

    loadPlanet(planetName) {
        if (this.currentPlanetMesh) {
            this.scene.remove(this.currentPlanetMesh);
        }

        const data = this.planetData[planetName];
        if (!data) return;

        const geometry = new THREE.SphereGeometry(6, 64, 64); // Bigger planet
        const texture = new THREE.TextureLoader().load(`assets/textures/${data.texture}`);
        const material = new THREE.MeshStandardMaterial({ map: texture }); // Revert to Standard for better look
        this.currentPlanetMesh = new THREE.Mesh(geometry, material);

        if (data.hasRing) {
            const ringGeo = new THREE.RingGeometry(8, 12, 64);
            // Use specific ring texture if available, else planet texture
            const ringTexPath = data.ringTexture ? `assets/textures/${data.ringTexture}` : `assets/textures/${data.texture}`;
            const ringTexture = new THREE.TextureLoader().load(ringTexPath);

            const ringMat = new THREE.MeshStandardMaterial({
                map: ringTexture,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.9,
                color: 0xffffff
            });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.rotation.x = Math.PI / 2; // Flat ring
            this.currentPlanetMesh.add(ring);
        }

        this.scene.add(this.currentPlanetMesh);

        // Update UI Text
        const titleEl = document.getElementById('dashboard-title');
        const descEl = document.getElementById('dashboard-desc');
        if (titleEl) titleEl.innerText = planetName.toUpperCase();
        if (descEl) descEl.innerText = data.desc;
    }

    renderDashboardUI() {
        this.uiContainer.className = "absolute inset-0 z-10 flex w-full h-full pointer-events-none text-white font-sans";
        this.uiContainer.style.display = 'flex';

        this.uiContainer.innerHTML = `
            <!-- Close Button (Top Right) -->
            <button id="galaxy-close-btn" class="absolute top-6 right-6 z-20 flex items-center justify-center w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition-all border border-white/10 pointer-events-auto">
                <svg xmlns="http://www.w3.org/2000/svg" height="24" width="24" viewBox="0 0 24 24" fill="white">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
            </button>
            
            <!-- Left Panel: Planet list -->
            <div class="w-1/3 flex flex-col justify-center p-8 pointer-events-auto bg-gradient-to-r from-black/80 to-transparent">
                <h3 class="text-white/60 text-sm font-medium uppercase tracking-widest mb-6">SELECT DESTINATION</h3>
                <div class="flex flex-col gap-3" id="planet-list">
                    <!-- Buttons generated below -->
                </div>
            </div>

            <!-- Center: 3D View (Empty div to let clicks pass through if needed, but here mostly visual) -->
            <div class="flex-1"></div>

            <!-- Right Panel: Info -->
            <div class="w-1/3 p-8 flex flex-col justify-center items-end pointer-events-auto bg-gradient-to-l from-black/80 to-transparent">
                <div class="glass-panel p-8 rounded-[2.5rem] flex flex-col w-full max-w-md relative group">
                    <div class="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/30 blur-[60px] rounded-full pointer-events-none"></div>
                    
                    <div class="flex items-center gap-2 mb-2">
                         <span class="inline-block size-2 rounded-full bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.6)]"></span>
                         <span class="text-green-400 text-xs font-bold tracking-widest uppercase">Live Signal</span>
                    </div>
                    
                    <h1 id="dashboard-title" class="text-6xl font-bold mb-4 tracking-tighter">JUPITER</h1>
                    <p id="dashboard-desc" class="text-gray-300 text-lg leading-relaxed mb-8">
                        Loading system data...
                    </p>

                    <div class="grid grid-cols-2 gap-4 mb-8">
                        <div class="bg-white/10 rounded-2xl p-4">
                            <span class="text-white/40 text-xs font-bold uppercase block mb-1">Status</span>
                            <span class="text-white font-medium">Hosting Concert</span>
                        </div>
                        <div class="bg-white/10 rounded-2xl p-4">
                            <span class="text-white/40 text-xs font-bold uppercase block mb-1">Distance</span>
                            <span class="text-white font-medium">Unknown</span>
                        </div>
                    </div>

                    <button id="dashboard-warp-btn" class="w-full py-4 rounded-full bg-blue-600 hover:bg-blue-500 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(37,99,235,0.4)] group-hover:shadow-[0_0_50px_rgba(37,99,235,0.6)]">
                         <span class="font-bold tracking-widest text-lg">INITIATE JUMP</span>
                    </button>
                </div>
            </div>
        `;

        // Generate Planet Buttons
        const listContainer = document.getElementById('planet-list');
        Object.keys(this.planetData).forEach(name => {
            const btn = document.createElement('button');
            btn.className = "flex items-center gap-4 p-4 rounded-2xl hover:bg-white/10 transition-all text-left group border-l-4 border-transparent hover:border-blue-500";
            btn.innerHTML = `
                <div class="w-2 h-2 rounded-full bg-white/50 group-hover:bg-blue-400 transition-colors"></div>
                <span class="text-xl font-bold tracking-wider">${name.toUpperCase()}</span>
            `;
            btn.onclick = () => {
                this.targetPlanet = name;
                this.loadPlanet(name);
            };
            listContainer.appendChild(btn);
        });

        // Close Button Logic
        document.getElementById('galaxy-close-btn').onclick = () => {
            window.game.switchTo('spaceship');
        };

        // Warp Button Logic
        document.getElementById('dashboard-warp-btn').onclick = () => {
            // Define available planets
            const availablePlanets = ['Saturn', 'Jupiter', 'Mercury'];

            if (availablePlanets.includes(this.targetPlanet)) {
                // Planet is unlocked - proceed to concert with planet context
                const concertScene = window.game.scenes['concert'];
                if (concertScene) {
                    concertScene.setPlanet(this.targetPlanet);
                }
                window.game.switchTo('concert');
            } else {
                // Planet is locked - show alert
                alert('區域尚未通行');
            }
        };
    }

    animate() {
        this.frameId = requestAnimationFrame(this.animate);
        if (this.currentPlanetMesh) {
            this.currentPlanetMesh.rotation.y += 0.002; // Slow rotation
        }
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }
}
