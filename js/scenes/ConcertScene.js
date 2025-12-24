class ConcertScene {
    constructor() {
        this.container = document.getElementById('canvas-container');
        this.uiContainer = document.getElementById('concert-ui');

        // Three.js
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.mixer = null; // Stage mixer
        this.singerMixer = null; // Singer mixer
        this.clock = new THREE.Clock();
        this.controls = null;

        // Multi-planet support
        this.currentPlanet = 'Saturn'; // Default

        this.animate = this.animate.bind(this);
    }

    setPlanet(planetName) {
        this.currentPlanet = planetName;
        console.log(`Concert scene set to planet: ${planetName}`);
    }

    enter() {
        console.log("Entering Concert Scene: Saturn Stage (Vertical Rhythm)");
        this.initThreeJS();
        this.loadStageModel();

        // FORCE UI VISIBILITY
        this.uiContainer.style.display = 'block';
        this.uiContainer.style.pointerEvents = 'none';

        // Initialize Game State
        this.score = 0;
        this.notes = []; // Array of { el: DOMElement, progress: 0-1 }
        this.spawnTimer = 0;
        this.spawnInterval = 0.8; // Seconds between notes
        this.gameActive = true;

        // Create UI Overlay
        this.createUI();

        this.animate();
    }

    exit() {
        cancelAnimationFrame(this.frameId);
        this.container.innerHTML = '';
        this.uiContainer.innerHTML = '';
        this.uiContainer.style.display = 'none';

        if (this.controls) this.controls.dispose();

        // Stop audio if playing
        if (this.sound && this.sound.isPlaying) {
            this.sound.stop();
        }
    }

    initThreeJS() {
        this.scene = new THREE.Scene();

        // Camera
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 30000);
        this.camera.position.set(0, 300, 900);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.container.appendChild(this.renderer.domElement);

        // Controls
        if (typeof THREE.OrbitControls !== 'undefined') {
            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
            this.controls.minDistance = 50;
            this.controls.maxDistance = 10000;
            this.controls.target.set(0, 150, 0); // Focus on singer height
        }

        // --- Lighting Setup (WARM YELLOW THEME) ---
        const hemiLight = new THREE.HemisphereLight(0xffeeb1, 0x080820, 0.4);
        this.scene.add(hemiLight);

        const centralLight = new THREE.PointLight(0xffdd66, 2.5, 1000);
        centralLight.position.set(0, 200, 0);
        centralLight.castShadow = true;
        centralLight.shadow.bias = -0.0001;
        this.scene.add(centralLight);

        const leftFill = new THREE.PointLight(0xffaa44, 1.5, 800);
        leftFill.position.set(-300, 150, 100);
        this.scene.add(leftFill);

        const rightFill = new THREE.PointLight(0xffaa44, 1.5, 800);
        rightFill.position.set(300, 150, 100);
        this.scene.add(rightFill);

        const spotLight = new THREE.SpotLight(0xfff0dd, 2.0);
        spotLight.position.set(0, 1500, 400);
        spotLight.angle = Math.PI / 5;
        spotLight.penumbra = 0.5;
        spotLight.castShadow = true;
        spotLight.shadow.mapSize.width = 2048;
        spotLight.shadow.mapSize.height = 2048;
        this.scene.add(spotLight);

        // --- Background ---
        const starGeo = new THREE.SphereGeometry(15000, 64, 64);
        const starTex = new THREE.TextureLoader().load('assets/textures/real_planets/stars.jpg');
        const starMat = new THREE.MeshBasicMaterial({
            map: starTex,
            side: THREE.BackSide,
            fog: false
        });
        const starSphere = new THREE.Mesh(starGeo, starMat);
        this.scene.add(starSphere);

        // --- Audio Setup (Playlist System) ---
        const listener = new THREE.AudioListener();
        this.camera.add(listener);

        this.sound = new THREE.Audio(listener);
        this.audioLoader = new THREE.AudioLoader();

        // Planet-specific playlists
        const planetPlaylists = {
            'Saturn': [
                'assets/audio/saturn/smusic1.mp3',
                'assets/audio/saturn/smusic2.mp3'
            ],
            'Jupiter': [
                'assets/audio/jmusic1.mp3'
            ],
            'Mercury': [
                'assets/audio/mmusic1.mp3'
            ]
        };

        this.playlist = planetPlaylists[this.currentPlanet] || planetPlaylists['Saturn'];
        this.currentTrackIndex = 0;

        // Start playing
        this.playTrack(this.currentTrackIndex);
    }

    playTrack(index) {
        if (!this.sound) return;

        if (this.sound.isPlaying) this.sound.stop();

        const file = this.playlist[index];
        console.log(`Loading track ${index + 1}: ${file}`);

        this.audioLoader.load(file, (buffer) => {
            this.sound.setBuffer(buffer);
            this.sound.setLoop(false);
            this.sound.setVolume(0.5);
            this.sound.play();

            // CRITICAL: Bind onended after play starts
            console.log('Music started playing, setting onended callback');

            // Use a timeout to ensure source is ready
            setTimeout(() => {
                if (this.sound.source) {
                    // Use arrow function to preserve 'this' context
                    this.sound.source.onended = () => {
                        console.log('onended callback fired!');
                        console.log('Calling onTrackEnded...');
                        this.onTrackEnded();
                    };
                    console.log('onended callback set successfully');
                } else {
                    console.error('Sound source not available!');
                }
            }, 100);
        }, undefined, (err) => console.error("Audio Load Error:", err));
    }

    onTrackEnded() {
        console.log('onTrackEnded called!');

        // Don't check isPlaying here - onended only fires when audio actually ends
        // The isPlaying state may not have updated yet when this callback fires

        console.log("Track ended. Checking for next track...");
        this.currentTrackIndex++;
        console.log('Current track index:', this.currentTrackIndex, 'Playlist length:', this.playlist.length);

        // Check if we've reached the end of the playlist
        if (this.currentTrackIndex >= this.playlist.length) {
            console.log("Playlist finished. Showing completion dialog.");
            // Show mission complete dialog
            this.showMissionComplete();
            return;
        }

        // Play next track
        console.log('Playing next track...');
        this.playTrack(this.currentTrackIndex);
    }

    createUI() {
        this.uiContainer.innerHTML = ''; // Clear previous

        // 1. SCORE DISPLAY (Top Left)
        const scoreDiv = document.createElement('div');
        scoreDiv.className = 'absolute top-8 left-8 z-10 font-bold tracking-widest pointer-events-none select-none';
        scoreDiv.style.fontFamily = '"Space Grotesk", sans-serif';
        scoreDiv.innerHTML = `
            <div class="text-cyan-400 text-3xl md:text-5xl drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]">
                SCORE <span id="score-val" class="text-white ml-2">000000</span>
            </div>
        `;
        this.uiContainer.appendChild(scoreDiv);

        // 2. SETTINGS BUTTON (Top Right)
        const settingsBtn = document.createElement('div');
        settingsBtn.className = 'absolute top-6 right-6 z-20 pointer-events-auto';
        settingsBtn.innerHTML = `
            <button id="settings-btn" class="flex items-center justify-center rounded-full w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md transition-all border border-white/10">
                <svg xmlns="http://www.w3.org/2000/svg" height="24" width="24" viewBox="0 0 24 24" fill="white">
                     <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23-.41-.12-.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.58 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
                </svg>
            </button>
        `;
        this.uiContainer.appendChild(settingsBtn);

        // 3. RHYTHM LANE (Right Side)
        const lane = document.createElement('div');
        lane.id = 'rhythm-lane';
        lane.className = 'absolute top-0 bottom-0 right-4 md:right-16 w-32 z-10 flex justify-center pointer-events-none select-none';

        // Target Circle (Bottom 15%)
        lane.innerHTML = `
            <!-- Target Logic: The 'perfect' hit spot -->
            <div id="target-circle" class="absolute bottom-[15%] w-24 h-24 rounded-full border-[6px] border-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.8)] flex items-center justify-center transition-transform duration-100">
                <div class="w-full h-full rounded-full bg-cyan-400/10"></div>
            </div>
            
            <!-- Notes Container -->
            <div id="notes-container" class="absolute inset-0 overflow-hidden w-full h-full"></div>
        `;
        this.uiContainer.appendChild(lane);

        // 4. PAUSE MENU (Reused Logic)
        const pauseMenu = document.createElement('div');
        pauseMenu.id = 'pause-menu';
        pauseMenu.className = 'absolute inset-0 z-[3000] items-center justify-center bg-black/60 backdrop-blur-md p-4 flex'; // Default flex but hidden via style
        pauseMenu.style.display = 'none';
        pauseMenu.style.pointerEvents = 'auto';

        pauseMenu.innerHTML = `
            <div class="glass-panel rounded-xl p-1 w-full max-w-sm shadow-2xl">
                <div class="bg-background-dark/80 rounded-[0.8rem] p-8 flex flex-col items-center gap-6 border border-white/5">
                    <div class="text-center">
                        <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/20 text-primary mb-4">
                            <span class="material-symbols-outlined">pause</span>
                        </div>
                        <h2 class="text-2xl font-bold text-white">Paused</h2>
                    </div>
                    <div class="flex flex-col w-full gap-3">
                        <button id="continue-btn" class="rounded-full h-12 bg-primary text-white font-bold w-full hover:bg-primary/90">Continue</button>
                        <button id="restart-btn" class="rounded-full h-12 bg-white/10 text-white font-bold w-full hover:bg-white/20">Restart</button>
                        <button id="exit-btn" class="rounded-full h-12 text-red-400 font-bold w-full hover:bg-red-500/10">End Game</button>
                    </div>
                </div>
            </div>
        `;
        this.uiContainer.appendChild(pauseMenu);

        // 5. MISSION COMPLETE DIALOG
        const completeDialog = document.createElement('div');
        completeDialog.id = 'complete-dialog';
        completeDialog.className = 'absolute inset-0 z-[4000] bg-black/80 backdrop-blur-md p-4';
        completeDialog.style.display = 'none';
        completeDialog.style.justifyContent = 'center';
        completeDialog.style.alignItems = 'center';
        completeDialog.style.pointerEvents = 'auto';

        completeDialog.innerHTML = `
            <div class="glass-panel rounded-xl p-1 w-full max-w-md shadow-2xl">
                <div class="bg-background-dark/90 rounded-[0.8rem] p-12 flex flex-col items-center gap-8 border border-white/5">
                    <h1 class="text-5xl font-bold text-white tracking-wider">MISSION COMPLETE</h1>
                    
                    <div class="text-center">
                        <p class="text-white/60 text-sm font-bold uppercase tracking-widest mb-2">最終得分</p>
                        <h2 id="final-score" class="text-6xl font-bold text-cyan-400 drop-shadow-[0_0_20px_rgba(34,211,238,0.8)]">
                            0
                        </h2>
                    </div>
                    
                    <div class="flex gap-4 w-full">
                        <button id="complete-restart-btn" class="flex-1 rounded-full h-14 bg-white/10 hover:bg-white/20 text-white font-bold text-lg border-2 border-white/20 transition-all">
                            重新開始
                        </button>
                        <button id="complete-exit-btn" class="flex-1 rounded-full h-14 bg-primary hover:bg-primary/90 text-white font-bold text-lg transition-all">
                            返回主選單
                        </button>
                    </div>
                </div>
            </div>
        `;
        this.uiContainer.appendChild(completeDialog);
        console.log('Mission Complete dialog created and added to UI');
        console.log('Dialog ID check:', document.getElementById('complete-dialog'));

        // --- INPUT HANDLING ---
        // Click on the target circle
        const laneEl = document.getElementById('rhythm-lane');
        laneEl.style.pointerEvents = 'auto'; // Enable clicking on lane
        laneEl.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.handleHit();
        });

        // Spacebar
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                if (this.uiContainer.style.display !== 'none') {
                    this.handleHit();
                }
            }
        });

        // Settings Listeners
        // Settings Listeners
        document.getElementById('settings-btn').addEventListener('click', () => this.togglePause(true));
        document.getElementById('continue-btn').addEventListener('click', () => this.togglePause(false));
        document.getElementById('restart-btn').addEventListener('click', () => {
            this.restartGame();
        });
        document.getElementById('exit-btn').addEventListener('click', () => {
            if (window.game) {
                window.game.switchTo('galaxy');
            } else {
                location.reload();
            }
        });

        // Mission Complete Dialog Listeners
        document.getElementById('complete-restart-btn').addEventListener('click', () => {
            this.restartGame();
            document.getElementById('complete-dialog').style.display = 'none';
        });
        document.getElementById('complete-exit-btn').addEventListener('click', () => {
            if (window.game) {
                window.game.switchTo('galaxy');
            }
        });
    }

    restartGame() {
        // Reset game state
        this.score = 0;
        this.combo = 0;
        this.updateScoreDisplay();

        // Hide combo display
        const comboEl = document.getElementById('combo-display');
        if (comboEl) comboEl.style.opacity = '0';

        // Clear all notes
        this.notes.forEach(n => n.el.remove());
        this.notes = [];

        // Reset spawn timer
        this.spawnTimer = 0;

        // Reset music to first track
        this.currentTrackIndex = 0;
        if (this.sound) {
            this.sound.stop();
        }
        this.playTrack(0);

        // Resume game
        this.gameActive = true;

        // Close pause menu if open
        const pauseMenu = document.getElementById('pause-menu');
        if (pauseMenu) pauseMenu.style.display = 'none';
    }

    showMissionComplete() {
        console.log('showMissionComplete called! Score:', this.score);
        this.gameActive = false;

        const dialog = document.getElementById('complete-dialog');
        const finalScoreEl = document.getElementById('final-score');

        console.log('Dialog element:', dialog);
        console.log('Score element:', finalScoreEl);

        if (dialog && finalScoreEl) {
            finalScoreEl.innerText = this.score.toLocaleString();
            // Use flex display to center the content
            dialog.style.display = 'flex';
            console.log('Mission Complete dialog shown!');
        } else {
            console.error('Mission Complete elements not found!');
        }
    }

    togglePause(isPaused) {
        const menu = document.getElementById('pause-menu');
        if (isPaused) {
            menu.style.display = 'flex';
            this.gameActive = false; // Stop Game Loop
            if (this.sound && this.sound.isPlaying) {
                this.sound.pause();
            }
        } else {
            menu.style.display = 'none';
            this.gameActive = true; // Resume Game Loop
            if (this.sound && !this.sound.isPlaying) {
                this.sound.play();
            }
        }
    }

    loadStageModel() {
        const loader = new THREE.FBXLoader();
        loader.setPath('assets/models/');

        // Define planet-specific model configurations
        const planetConfig = {
            'Saturn': {
                stageFile: 'saturn_stage/base.fbx',
                singerFile: 'fjazz.fbx',
                stageScale: 5.0,
                singerScale: 0.8,
                singerPosition: { x: 0, y: 115, z: 50 },
                hasTexture: true,
                texturePath: 'saturn_stage/texture_diffuse.png'
            },
            'Jupiter': {
                combinedFile: 'fsinger.fbx',
                scale: 3.0,  // Increased from 1.0 to 3.0
                position: { x: 0, y: 50, z: 0 },
                rotation: { x: 0, y: Math.PI, z: 0 }  // Rotate 180 degrees
            },
            'Mercury': {
                combinedFile: 'msinger.fbx',
                scale: 1.0,
                position: { x: 0, y: 0, z: 0 },
                rotation: { x: 0, y: 0, z: 0 }
            }
        };

        const config = planetConfig[this.currentPlanet] || planetConfig['Saturn'];

        if (config.combinedFile) {
            // Jupiter and Mercury: Combined model with manual texture loading
            const textureLoader = new THREE.TextureLoader();

            loader.load(config.combinedFile, (object) => {
                // Try to find and load associated textures
                const modelName = config.combinedFile.replace('.fbx', '');
                console.log(`Attempting to load textures for: ${modelName}`);

                object.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;

                        if (child.material) {
                            child.material.side = THREE.DoubleSide;

                            // Adjust material properties for better rendering without changing colors
                            if (child.material.isMeshStandardMaterial) {
                                child.material.metalness = 0.05;
                                child.material.roughness = 0.95;
                            }

                            // **CRITICAL**: DO NOT modify material color at all
                            // The texture map or vertex colors will handle the appearance

                            // Add very subtle emissive only if no texture map exists
                            if (!child.material.map) {
                                child.material.emissive = new THREE.Color(0x0a0a0a);
                            }

                            // Enable vertex colors if available - this is the key for models without texture maps
                            if (child.geometry && child.geometry.attributes.color) {
                                child.material.vertexColors = true;
                                console.log(`  ${child.name}: Using vertex colors`);
                            }

                            child.material.needsUpdate = true;

                            console.log(`Material: ${child.name}, Has Map: ${!!child.material.map}, Has Vertex Colors: ${!!(child.geometry && child.geometry.attributes.color)}`);
                        }
                    }
                });

                object.scale.set(config.scale, config.scale, config.scale);
                object.position.set(config.position.x, config.position.y, config.position.z);

                // Apply rotation if specified
                if (config.rotation) {
                    object.rotation.set(config.rotation.x, config.rotation.y, config.rotation.z);
                }

                this.scene.add(object);

                // Animation
                if (object.animations && object.animations.length > 0) {
                    this.mixer = new THREE.AnimationMixer(object);
                    object.animations.forEach((clip, index) => {
                        const action = this.mixer.clipAction(clip);
                        action.play();
                    });
                }

                console.log(`${this.currentPlanet} Combined Model Loaded`);
            }, undefined, (error) => console.error(`${this.currentPlanet} Model Error:`, error));

        } else {
            // Saturn: Separate stage and singer
            // 1. Load STAGE
            loader.setPath('assets/models/saturn_stage/');
            loader.load('base.fbx', (object) => {
                const texLoader = new THREE.TextureLoader();
                texLoader.setPath('assets/models/saturn_stage/');
                const diffuse = texLoader.load('texture_diffuse.png');
                diffuse.encoding = THREE.sRGBEncoding;

                object.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        if (child.material) {
                            child.material.map = diffuse;
                            child.material.side = THREE.DoubleSide;
                            child.material.needsUpdate = true;
                            child.material.roughness = 0.6;
                            child.material.metalness = 0.1;
                        }
                    }
                });

                object.scale.set(config.stageScale, config.stageScale, config.stageScale);
                object.position.set(0, 0, 0);
                this.scene.add(object);

                if (object.animations && object.animations.length > 0) {
                    this.mixer = new THREE.AnimationMixer(object);
                    const action = this.mixer.clipAction(object.animations[0]);
                    action.play();
                }

                console.log("Saturn Stage Loaded");
            }, undefined, (error) => console.error("Stage Error:", error));

            // 2. Load SINGER
            const singerLoader = new THREE.FBXLoader();
            singerLoader.setPath('assets/models/');

            singerLoader.load(config.singerFile, (object) => {
                object.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        if (child.material) {
                            child.material.side = THREE.DoubleSide;
                            if (child.material.isMeshStandardMaterial) {
                                child.material.metalness = 0.1;
                                child.material.roughness = 0.5;
                            }
                            child.material.emissive = new THREE.Color(0x222222);
                            child.material.needsUpdate = true;
                        }
                    }
                });

                object.scale.set(config.singerScale, config.singerScale, config.singerScale);
                object.position.set(config.singerPosition.x, config.singerPosition.y, config.singerPosition.z);
                object.rotation.y = 0;

                this.scene.add(object);
                console.log("Saturn Singer Loaded");

                if (object.animations && object.animations.length > 0) {
                    this.singerMixer = new THREE.AnimationMixer(object);
                    const action = this.singerMixer.clipAction(object.animations[0]);
                    action.play();
                }
            }, undefined, (error) => console.error("Singer Error:", error));
        }
    }

    animate() {
        this.frameId = requestAnimationFrame(this.animate);

        const delta = this.clock.getDelta();

        if (this.mixer) this.mixer.update(delta);
        if (this.singerMixer) this.singerMixer.update(delta);

        if (this.controls) this.controls.update();

        // --- GAME LOOP ---
        if (this.gameActive) {
            this.updateGame(delta);
        }

        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    // --- GAMEPLAY LOGIC ---
    updateGame(delta) {
        // 1. Spawner (Only spawn if music is playing)
        if (this.sound && this.sound.isPlaying) {
            this.spawnTimer += delta;
            if (this.spawnTimer > this.spawnInterval) {
                this.spawnTimer = 0;
                // Randomize next interval (0.5s to 1.5s)
                this.spawnInterval = Math.random() * 1.0 + 0.5;
                this.spawnNote();
            }
        }

        // 2. Update Notes
        // Speed: Percent per second. 0.35 means takes ~2.8s to fall
        const speed = 0.35;

        for (let i = this.notes.length - 1; i >= 0; i--) {
            const note = this.notes[i];
            note.progress += speed * delta;

            // Visual Update (Top: 0% -> 100%)
            note.el.style.top = `${note.progress * 100}%`;

            // Remove if off screen
            if (note.progress > 1.1) {
                note.el.remove();
                this.notes.splice(i, 1);
            }
        }
    }

    spawnNote() {
        const container = document.getElementById('notes-container');
        if (!container) return;

        // Create Note Element
        const noteEl = document.createElement('div');
        // Random color
        const colors = ['bg-red-500', 'bg-yellow-400', 'bg-purple-500', 'bg-blue-400', 'bg-green-400'];
        const colorClass = colors[Math.floor(Math.random() * colors.length)];

        noteEl.className = `absolute left-1/2 transform -translate-x-1/2 w-16 h-16 pointer-events-none drop-shadow-lg`;
        // Top is handled by JS logic

        // Icon
        noteEl.innerHTML = `
            <span class="material-symbols-outlined text-[64px] ${colorClass.replace('bg-', 'text-')} drop-shadow-md">music_note</span>
        `;

        container.appendChild(noteEl);

        this.notes.push({
            el: noteEl,
            progress: 0.0 // 0 = top, 1 = bottom
        });
    }

    handleHit() {
        // Check for notes near target (Target is at 85% = 0.85)
        const targetPos = 0.85;
        const tolerance = 0.15; // Increased visual tolerance for easier hitting

        let hitIndex = -1;
        let bestDist = Infinity;

        // Find closest note
        for (let i = 0; i < this.notes.length; i++) {
            const dist = Math.abs(this.notes[i].progress - targetPos);
            if (dist < tolerance && dist < bestDist) {
                bestDist = dist;
                hitIndex = i;
            }
        }

        // Action
        const targetCircle = document.getElementById('target-circle');

        if (hitIndex !== -1) {
            // HIT!
            const note = this.notes[hitIndex];
            note.el.remove(); // Visual removal
            this.notes.splice(hitIndex, 1);

            // Score Logic
            let points = 100;
            if (bestDist < 0.05) points = 300; // Perfect window
            this.score += points;
            this.updateScoreDisplay();

            // Visual Feedback - Hit
            targetCircle.style.transform = 'scale(1.3)';
            targetCircle.style.borderColor = '#ffffff';
            targetCircle.style.boxShadow = '0 0 50px #ffffff';

            setTimeout(() => {
                targetCircle.style.transform = 'scale(1)';
                targetCircle.style.borderColor = 'rgb(34, 211, 238)';
                targetCircle.style.boxShadow = '0 0 30px rgba(34,211,238,0.8)';
            }, 100);

        } else {
            // MISS (Feedback for clicking air)
            targetCircle.style.transform = 'scale(0.9)';
            targetCircle.style.borderColor = '#ff4444';
            setTimeout(() => {
                targetCircle.style.transform = 'scale(1)';
                targetCircle.style.borderColor = 'rgb(34, 211, 238)';
            }, 100);
        }
    }

    updateScoreDisplay() {
        const scoreEl = document.getElementById('score-val');
        if (scoreEl) {
            // Pad to 6 chars
            scoreEl.innerText = this.score.toString().padStart(6, '0');
        }
    }
}
