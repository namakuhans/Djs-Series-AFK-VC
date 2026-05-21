import { Renderer, Program, Mesh, Triangle } from 'https://esm.sh/ogl@0.0.117';

document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------------------------------
    // INITIALIZATION & STATE
    // ----------------------------------------------------
    const API_URL = 'http://localhost:3000/api';
    
    let config = {
        token: '',
        guildId: '',
        channelId: '',
        rpcEnabled: false,
        isActive: false
    };
    
    let state = {
        authStatus: 'none', // none, checking, online, offline
        guilds: [],
        channels: [],
        rpcInterval: null
    };

    // ----------------------------------------------------
    // DOM ELEMENTS
    // ----------------------------------------------------
    
    // Welcome Modal
    const welcomeModal = document.getElementById('welcome-modal');
    const welcomeModalContent = document.getElementById('welcome-modal-content');
    const welcomeProgress = document.getElementById('welcome-progress');
    const btnSkipWelcome = document.getElementById('btn-skip-welcome');
    const btnJoinDiscord = document.getElementById('btn-join-discord');

    // Auth & Token
    const discordTokenInput = document.getElementById('discord-token');
    const btnAuth = document.getElementById('btn-auth');
    const authStatusBadge = document.getElementById('auth-status-badge');

    // Guilds
    const guildList = document.getElementById('guild-list');
    
    // Channels
    const channelContainer = document.getElementById('channel-container');
    const channelListContainer = document.getElementById('channel-list-container');
    const channelList = document.getElementById('channel-list');

    // RPC
    const rpcToggle = document.getElementById('rpc-toggle');
    const rpcIconBg = document.getElementById('rpc-icon-bg');
    const rpcImage = document.getElementById('rpc-image');
    const rpcDetails = document.getElementById('rpc-details');
    const rpcStatusText = document.getElementById('rpc-status-text');
    const rpcTime = document.getElementById('rpc-time');
    const rpcTimeText = document.getElementById('rpc-time-text');
    const rpcBtnMock = document.getElementById('rpc-btn-mock');
    const rpcBar = document.getElementById('rpc-bar');

    // System Core
    const systemToggle = document.getElementById('system-toggle');
    const systemCoreContainer = document.getElementById('system-core-container');
    const systemIconWrapper = document.getElementById('system-icon-wrapper');
    const systemStateLabel = document.getElementById('system-state-label');
    const systemStateText = document.getElementById('system-state-text');

    // ----------------------------------------------------
    // WELCOME MODAL LOGIC
    // ----------------------------------------------------
    let progressValue = 100;
    const duration = 8000;
    const intervalTime = 10;
    const step = (intervalTime / duration) * 100;
    let progressTimer;

    function closeWelcomeModal() {
        welcomeModalContent.classList.remove('scale-100', 'opacity-100', 'translate-y-0');
        welcomeModalContent.classList.add('scale-90', 'opacity-0', 'translate-y-8');
        welcomeModal.classList.remove('bg-black/95', 'backdrop-blur-md');
        welcomeModal.classList.add('bg-transparent', 'pointer-events-none');
        
        setTimeout(() => {
            welcomeModal.style.display = 'none';
        }, 700);
        
        if (progressTimer) clearInterval(progressTimer);
    }

    progressTimer = setInterval(() => {
        progressValue -= step;
        if (progressValue <= 0) {
            progressValue = 0;
            closeWelcomeModal();
        }
        welcomeProgress.style.width = `${progressValue}%`;
    }, intervalTime);

    btnSkipWelcome.addEventListener('click', closeWelcomeModal);
    btnJoinDiscord.addEventListener('click', () => {
        window.open('https://discord.gg', '_blank');
    });

    // ----------------------------------------------------
    // TRUEFOCUS LOGIC (Vanilla JS implementation)
    // ----------------------------------------------------
    const words = document.querySelectorAll('.focus-word');
    const focusFrame = document.getElementById('focus-frame');
    const trueFocusContainer = document.getElementById('true-focus-container');
    let currentFocusIndex = 0;

    function updateFocusFrame(index) {
        if (!words[index]) return;
        const parentRect = trueFocusContainer.getBoundingClientRect();
        const activeElement = words[index];
        const activeRect = activeElement.getBoundingClientRect();

        const x = activeRect.left - parentRect.left;
        const y = activeRect.top - parentRect.top;

        focusFrame.style.transform = `translate(${x}px, ${y}px)`;
        focusFrame.style.width = `${activeRect.width}px`;
        focusFrame.style.height = `${activeRect.height}px`;
        focusFrame.classList.add('visible');

        words.forEach((w, i) => {
            if (i === index) {
                w.classList.add('active');
            } else {
                w.classList.remove('active');
            }
        });
    }

    // Auto animate Focus
    setInterval(() => {
        updateFocusFrame(currentFocusIndex);
        currentFocusIndex = (currentFocusIndex + 1) % words.length;
    }, 1500);
    // Init first frame
    setTimeout(() => updateFocusFrame(0), 100);

    // ----------------------------------------------------
    // GRADUAL BLUR LOGIC
    // ----------------------------------------------------
    const blurLayersContainer = document.getElementById('blur-layers-container');
    const divCount = 6;
    const increment = 100 / divCount;
    const strength = 2.5;

    // Bezier curve equivalent approximation for visual
    function bezierCurve(p) {
        return p * p * (3 - 2 * p);
    }

    for (let i = 1; i <= divCount; i++) {
        let progress = i / divCount;
        progress = bezierCurve(progress);
        
        let blurValue = 0.0625 * (progress * divCount + 1) * strength;
        
        const p1 = Math.round((increment * i - increment) * 10) / 10;
        const p2 = Math.round(increment * i * 10) / 10;
        const p3 = Math.round((increment * i + increment) * 10) / 10;
        const p4 = Math.round((increment * i + increment * 2) * 10) / 10;

        let gradient = `transparent ${p1}%, black ${p2}%`;
        if (p3 <= 100) gradient += `, black ${p3}%`;
        if (p4 <= 100) gradient += `, transparent ${p4}%`;

        const div = document.createElement('div');
        div.className = 'gradual-blur-layer';
        div.style.maskImage = `linear-gradient(to bottom, ${gradient})`;
        div.style.webkitMaskImage = `linear-gradient(to bottom, ${gradient})`;
        div.style.backdropFilter = `blur(${blurValue.toFixed(3)}rem)`;
        div.style.webkitBackdropFilter = `blur(${blurValue.toFixed(3)}rem)`;
        
        blurLayersContainer.appendChild(div);
    }


    // ----------------------------------------------------
    // LINEWAVES LOGIC (OGL WebGL)
    // ----------------------------------------------------
    function initLineWaves() {
        const container = document.getElementById('linewaves-container');
        if (!container) return;
        
        const renderer = new Renderer({ alpha: true, premultipliedAlpha: false });
        const gl = renderer.gl;
        gl.clearColor(0, 0, 0, 0);

        function hexToVec3(hex) {
            const h = hex.replace('#', '');
            return [
                parseInt(h.slice(0, 2), 16) / 255,
                parseInt(h.slice(2, 4), 16) / 255,
                parseInt(h.slice(4, 6), 16) / 255
            ];
        }

        const vertexShader = `
            attribute vec2 uv;
            attribute vec2 position;
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = vec4(position, 0, 1);
            }
        `;

        const fragmentShader = `
            precision highp float;
            uniform float uTime;
            uniform vec3 uResolution;
            uniform float uSpeed;
            uniform float uInnerLines;
            uniform float uOuterLines;
            uniform float uWarpIntensity;
            uniform float uRotation;
            uniform float uEdgeFadeWidth;
            uniform float uColorCycleSpeed;
            uniform float uBrightness;
            uniform vec3 uColor1;
            uniform vec3 uColor2;
            uniform vec3 uColor3;
            uniform vec2 uMouse;
            uniform float uMouseInfluence;
            uniform bool uEnableMouse;

            #define HALF_PI 1.5707963

            float hashF(float n) { return fract(sin(n * 127.1) * 43758.5453123); }
            float smoothNoise(float x) {
                float i = floor(x);
                float f = fract(x);
                float u = f * f * (3.0 - 2.0 * f);
                return mix(hashF(i), hashF(i + 1.0), u);
            }
            float displaceA(float coord, float t) {
                float result = sin(coord * 2.123) * 0.2;
                result += sin(coord * 3.234 + t * 4.345) * 0.1;
                result += sin(coord * 0.589 + t * 0.934) * 0.5;
                return result;
            }
            float displaceB(float coord, float t) {
                float result = sin(coord * 1.345) * 0.3;
                result += sin(coord * 2.734 + t * 3.345) * 0.2;
                result += sin(coord * 0.189 + t * 0.934) * 0.3;
                return result;
            }
            vec2 rotate2D(vec2 p, float angle) {
                float c = cos(angle);
                float s = sin(angle);
                return vec2(p.x * c - p.y * s, p.x * s + p.y * c);
            }

            void main() {
                vec2 coords = gl_FragCoord.xy / uResolution.xy;
                coords = coords * 2.0 - 1.0;
                coords = rotate2D(coords, uRotation);

                float halfT = uTime * uSpeed * 0.5;
                float fullT = uTime * uSpeed;

                float mouseWarp = 0.0;
                if (uEnableMouse) {
                    vec2 mPos = rotate2D(uMouse * 2.0 - 1.0, uRotation);
                    float mDist = length(coords - mPos);
                    mouseWarp = uMouseInfluence * exp(-mDist * mDist * 4.0);
                }

                float warpAx = coords.x + displaceA(coords.y, halfT) * uWarpIntensity + mouseWarp;
                float warpAy = coords.y - displaceA(coords.x * cos(fullT) * 1.235, halfT) * uWarpIntensity;
                float warpBx = coords.x + displaceB(coords.y, halfT) * uWarpIntensity + mouseWarp;
                float warpBy = coords.y - displaceB(coords.x * sin(fullT) * 1.235, halfT) * uWarpIntensity;

                vec2 fieldA = vec2(warpAx, warpAy);
                vec2 fieldB = vec2(warpBx, warpBy);
                vec2 blended = mix(fieldA, fieldB, mix(fieldA, fieldB, 0.5));

                float fadeTop = smoothstep(uEdgeFadeWidth, uEdgeFadeWidth + 0.4, blended.y);
                float fadeBottom = smoothstep(-uEdgeFadeWidth, -(uEdgeFadeWidth + 0.4), blended.y);
                float vMask = 1.0 - max(fadeTop, fadeBottom);

                float tileCount = mix(uOuterLines, uInnerLines, vMask);
                float scaledY = blended.y * tileCount;
                float nY = smoothNoise(abs(scaledY));

                float ridge = pow(step(abs(nY - blended.x) * 2.0, HALF_PI) * cos(2.0 * (nY - blended.x)), 5.0);

                float lines = 0.0;
                for (float i = 1.0; i < 3.0; i += 1.0) {
                    lines += pow(max(fract(scaledY), fract(-scaledY)), i * 2.0);
                }
                float pattern = vMask * lines;
                float cycleT = fullT * uColorCycleSpeed;
                float rChannel = (pattern + lines * ridge) * (cos(blended.y + cycleT * 0.234) * 0.5 + 1.0);
                float gChannel = (pattern + vMask * ridge) * (sin(blended.x + cycleT * 1.745) * 0.5 + 1.0);
                float bChannel = (pattern + lines * ridge) * (cos(blended.x + cycleT * 0.534) * 0.5 + 1.0);

                vec3 col = (rChannel * uColor1 + gChannel * uColor2 + bChannel * uColor3) * uBrightness;
                float alpha = clamp(length(col), 0.0, 1.0);
                gl_FragColor = vec4(col, alpha);
            }
        `;

        let currentMouse = [0.5, 0.5];
        let targetMouse = [0.5, 0.5];

        function handleMouseMove(e) {
            const rect = gl.canvas.getBoundingClientRect();
            targetMouse = [
                (e.clientX - rect.left) / rect.width,
                1.0 - (e.clientY - rect.top) / rect.height
            ];
        }
        function handleMouseLeave() {
            targetMouse = [0.5, 0.5];
        }

        const program = new Program(gl, {
            vertex: vertexShader,
            fragment: fragmentShader,
            uniforms: {
                uTime: { value: 0 },
                uResolution: { value: [gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height] },
                uSpeed: { value: 0.2 },
                uInnerLines: { value: 32.0 },
                uOuterLines: { value: 36.0 },
                uWarpIntensity: { value: 0.8 },
                uRotation: { value: (-45 * Math.PI) / 180 },
                uEdgeFadeWidth: { value: 0.0 },
                uColorCycleSpeed: { value: 0.0 },
                uBrightness: { value: 0.15 },
                uColor1: { value: hexToVec3('#ffffff') },
                uColor2: { value: hexToVec3('#ffffff') },
                uColor3: { value: hexToVec3('#ffffff') },
                uMouse: { value: new Float32Array([0.5, 0.5]) },
                uMouseInfluence: { value: 1.5 },
                uEnableMouse: { value: true }
            }
        });

        function resize() {
            renderer.setSize(container.offsetWidth, container.offsetHeight);
            if (program) {
                program.uniforms.uResolution.value = [gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height];
            }
        }
        window.addEventListener('resize', resize);
        resize();

        const geometry = new Triangle(gl);
        const mesh = new Mesh(gl, { geometry, program });
        container.appendChild(gl.canvas);

        gl.canvas.addEventListener('mousemove', handleMouseMove);
        gl.canvas.addEventListener('mouseleave', handleMouseLeave);

        function update(time) {
            requestAnimationFrame(update);
            program.uniforms.uTime.value = time * 0.001;
            
            currentMouse[0] += 0.05 * (targetMouse[0] - currentMouse[0]);
            currentMouse[1] += 0.05 * (targetMouse[1] - currentMouse[1]);
            program.uniforms.uMouse.value[0] = currentMouse[0];
            program.uniforms.uMouse.value[1] = currentMouse[1];

            renderer.render({ scene: mesh });
        }
        requestAnimationFrame(update);
    }
    
    initLineWaves();


    // ----------------------------------------------------
    // API CONFIG LOAD/SAVE
    // ----------------------------------------------------
    async function loadConfig() {
        try {
            const response = await fetch(`${API_URL}/config`);
            if (response.ok) {
                config = await response.json();
                updateUIFromConfig();
            }
        } catch (error) {
            console.error('Failed to load config:', error);
        }
    }

    async function saveConfig() {
        try {
            await fetch(`${API_URL}/config`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });
        } catch (error) {
            console.error('Failed to save config:', error);
        }
    }


    // ----------------------------------------------------
    // UI UPDATES
    // ----------------------------------------------------
    function updateUIFromConfig() {
        if (config.token) {
            discordTokenInput.value = config.token;
            // Only auto-authenticate if it doesn't look like a masked token
            if (!config.token.includes('***HIDDEN***') && !config.token.includes('...')) {
                authenticateToken(config.token);
            }
        }

        setRpcUI(config.rpcEnabled);
        setSystemUI(config.isActive);
    }

    function setAuthStatusUI(status) {
        state.authStatus = status;
        authStatusBadge.className = 'border rounded-full flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold';
        authStatusBadge.classList.remove('hidden');
        
        let html = '';
        if (status === 'checking') {
            authStatusBadge.classList.add('bg-yellow-500/10', 'text-yellow-500', 'border-yellow-500/20');
            html = `<i data-lucide="activity" class="w-3 h-3 animate-spin"></i> CHECKING`;
            btnAuth.disabled = true;
            btnAuth.textContent = 'Connecting...';
        } else if (status === 'online') {
            authStatusBadge.classList.add('bg-green-500/10', 'text-green-500', 'border-green-500/20');
            html = `<span class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> ONLINE`;
            btnAuth.disabled = false;
            btnAuth.textContent = 'Session Connected';
        } else {
            authStatusBadge.classList.add('bg-red-500/10', 'text-red-500', 'border-red-500/20');
            html = `OFFLINE`;
            btnAuth.disabled = false;
            btnAuth.textContent = 'Connect Session';
        }
        authStatusBadge.innerHTML = html;
        lucide.createIcons();
    }

    // ----------------------------------------------------
    // AUTHENTICATION & DISCORD DATA FETCH
    // ----------------------------------------------------
    async function authenticateToken(token) {
        if (!token) return;
        setAuthStatusUI('checking');
        
        try {
            const response = await fetch(`${API_URL}/guilds`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token })
            });
            
            if (response.ok) {
                const data = await response.json();
                state.guilds = data.guilds || [];
                setAuthStatusUI('online');
                renderGuilds();
                
                config.token = token;
                saveConfig();
            } else {
                setAuthStatusUI('offline');
            }
        } catch (error) {
            console.error(error);
            setAuthStatusUI('offline');
        }
    }

    btnAuth.addEventListener('click', () => {
        const token = discordTokenInput.value.trim();
        if (token) authenticateToken(token);
    });

    // ----------------------------------------------------
    // RENDER GUILDS
    // ----------------------------------------------------
    function renderGuilds() {
        guildList.innerHTML = '';
        
        if (state.guilds.length === 0) {
            guildList.innerHTML = '<div class="flex h-full items-center justify-center opacity-30 text-sm font-bold uppercase tracking-widest text-center">No Servers Found</div>';
            return;
        }
        
        state.guilds.forEach(guild => {
            const isSelected = config.guildId === guild.id;
            
            const btn = document.createElement('button');
            btn.className = `w-full text-left p-3 rounded-xl transition-all border flex items-center gap-3 group mb-2
                ${isSelected 
                  ? 'bg-white text-black border-white' 
                  : 'bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/10'}`;
            
            const iconUrl = guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png` : '';
            const iconHtml = iconUrl 
                ? `<img src="${iconUrl}" class="w-full h-full rounded-full object-cover">`
                : `<span class="truncate px-1">${guild.name.charAt(0)}</span>`;
            
            btn.innerHTML = `
                <div class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-transform group-hover:scale-110 shrink-0
                    ${isSelected ? 'bg-black text-white' : 'bg-white/10 text-white/60'}">
                    ${iconHtml}
                </div>
                <div class="flex-1 min-w-0">
                    <div class="font-bold truncate text-sm">${guild.name}</div>
                    <div class="flex items-center gap-2 text-[10px] font-bold opacity-60 mt-1">
                        <span class="flex items-center gap-1">
                            <i data-lucide="hash" class="w-3 h-3"></i> ID: ${guild.id.substring(0, 8)}...
                        </span>
                    </div>
                </div>
            `;
            
            btn.onclick = () => selectGuild(guild.id);
            guildList.appendChild(btn);
        });
        
        lucide.createIcons();
    }

    async function selectGuild(id) {
        config.guildId = id;
        config.channelId = ''; // Reset channel on guild change
        renderGuilds();
        
        // Scroll newly selected into view smoothly
        setTimeout(() => {
            const activeBtn = guildList.querySelector('.bg-white.text-black');
            if (activeBtn) activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 50);
        saveConfig();
        
        // Fetch Channels
        try {
            channelContainer.classList.add('hidden');
            channelListContainer.classList.remove('hidden');
            channelList.innerHTML = '<div class="text-center text-white/50 text-xs py-4">Loading channels...</div>';
            
            const response = await fetch(`${API_URL}/channels`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: config.token, guildId: id })
            });
            
            if (response.ok) {
                const data = await response.json();
                state.channels = data.channels || [];
                renderChannels();
            }
        } catch (error) {
            console.error(error);
            channelList.innerHTML = '<div class="text-center text-red-500 text-xs py-4">Error loading channels</div>';
        }
    }

    // ----------------------------------------------------
    // RENDER CHANNELS
    // ----------------------------------------------------
    function renderChannels() {
        channelList.innerHTML = '';
        
        if (state.channels.length === 0) {
            channelList.innerHTML = '<div class="flex h-full items-center justify-center opacity-30 text-sm font-bold uppercase tracking-widest text-center py-10">No Voice Channels Found</div>';
            return;
        }
        
        state.channels.forEach(channel => {
            const isSelected = config.channelId === channel.id;
            
            const btn = document.createElement('button');
            btn.className = `w-full text-left p-3 rounded-xl transition-all border flex items-center gap-3 group
                ${isSelected 
                  ? 'bg-white/20 border-white/40' 
                  : 'bg-white/5 border-transparent hover:border-white/10 hover:bg-white/10'}`;
            
            const iconClass = isSelected ? 'text-white' : 'text-white/40';
            
            btn.innerHTML = `
                <i data-lucide="mic" class="w-4 h-4 ${iconClass}"></i>
                <span class="font-bold text-sm truncate">${channel.name}</span>
            `;
            
            btn.onclick = () => {
                config.channelId = channel.id;
                renderChannels();
                saveConfig();
                
                setTimeout(() => {
                    const activeBtn = channelList.querySelector('.bg-white\\/20');
                    if (activeBtn) activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }, 50);
            };
            
            channelList.appendChild(btn);
        });
        
        lucide.createIcons();
    }


    // ----------------------------------------------------
    // RPC LOGIC
    // ----------------------------------------------------
    function setRpcUI(enabled) {
        config.rpcEnabled = enabled;
        rpcToggle.setAttribute('data-state', enabled ? 'checked' : 'unchecked');
        
        if (enabled) {
            rpcIconBg.className = 'p-2 rounded-lg transition-colors bg-white/10 text-white';
            rpcImage.classList.remove('opacity-20', 'grayscale');
            rpcDetails.classList.remove('opacity-40');
            rpcStatusText.textContent = "Enjoying the view with iHannsy Script 🌊";
            rpcTime.classList.remove('text-white/20');
            rpcTime.classList.add('text-green-500');
            rpcBtnMock.classList.remove('opacity-20', 'cursor-not-allowed');
            rpcBar.classList.remove('opacity-0');
            
            startRpcTimer();
        } else {
            rpcIconBg.className = 'p-2 rounded-lg transition-colors bg-white/5 text-white/20';
            rpcImage.classList.add('opacity-20', 'grayscale');
            rpcDetails.classList.add('opacity-40');
            rpcStatusText.textContent = "Offline";
            rpcTime.classList.remove('text-green-500');
            rpcTime.classList.add('text-white/20');
            rpcTimeText.textContent = "00:00";
            rpcBtnMock.classList.add('opacity-20', 'cursor-not-allowed');
            rpcBar.classList.add('opacity-0');
            
            stopRpcTimer();
        }
    }

    let rpcSeconds = 0;
    function startRpcTimer() {
        if (state.rpcInterval) clearInterval(state.rpcInterval);
        rpcSeconds = 0;
        state.rpcInterval = setInterval(() => {
            rpcSeconds++;
            const m = Math.floor(rpcSeconds / 60).toString().padStart(2, '0');
            const s = (rpcSeconds % 60).toString().padStart(2, '0');
            rpcTimeText.textContent = `${m}:${s} elapsed`;
        }, 1000);
    }
    
    function stopRpcTimer() {
        if (state.rpcInterval) clearInterval(state.rpcInterval);
    }

    rpcToggle.addEventListener('click', () => {
        const newState = !config.rpcEnabled;
        setRpcUI(newState);
        saveConfig();
    });

    // ----------------------------------------------------
    // SYSTEM CORE LOGIC (START BOT)
    // ----------------------------------------------------
    function setSystemUI(active) {
        config.isActive = active;
        systemToggle.setAttribute('data-state', active ? 'checked' : 'unchecked');
        
        if (active) {
            systemIconWrapper.className = 'p-5 rounded-2xl transition-all duration-700 bg-white text-black shadow-[0_0_40px_rgba(255,255,255,0.2)]';
            systemStateLabel.className = 'text-[10px] font-bold uppercase tracking-[0.4em] mb-1 transition-colors text-white';
            systemStateText.textContent = 'Running';
        } else {
            systemIconWrapper.className = 'p-5 rounded-2xl transition-all duration-700 bg-white/5 text-white/40 border border-white/5';
            systemStateLabel.className = 'text-[10px] font-bold uppercase tracking-[0.4em] mb-1 transition-colors text-white/40';
            systemStateText.textContent = 'Standby';
        }
    }

    systemToggle.addEventListener('click', async () => {
        if (!config.token || !config.guildId || !config.channelId) {
            alert('Please complete Token, Server, and Channel selection before starting.');
            return;
        }

        const newState = !config.isActive;
        
        try {
            const endpoint = newState ? '/bot/start' : '/bot/stop';
            const response = await fetch(`${API_URL}${endpoint}`, { method: 'POST' });
            
            if (response.ok) {
                setSystemUI(newState);
                saveConfig();
            } else {
                alert(`Failed to ${newState ? 'start' : 'stop'} bot.`);
            }
        } catch (error) {
            console.error(error);
            alert('Server error.');
        }
    });

    // INITIAL LOAD
    loadConfig();
});
