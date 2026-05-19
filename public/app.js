document.addEventListener('DOMContentLoaded', () => {
    // --- Welcome Toast Logic ---
    const welcomeToast = document.getElementById('welcome-toast');
    if (welcomeToast) {
        const toastGlass = welcomeToast.querySelector('.toast-glass');
        
        setTimeout(() => {
            welcomeToast.classList.add('show');
            toastGlass.classList.add('show');
        }, 100);

        setTimeout(() => {
            welcomeToast.classList.remove('show');
            toastGlass.classList.remove('show');
            setTimeout(() => {
                welcomeToast.remove(); 
            }, 500); 
        }, 3000);
    }

    // --- Advanced OGL WebGL Line Waves Animation (Fragment Shader Based) ---
    const container = document.getElementById('canvas-container');
    const { Renderer, Program, Mesh, Triangle } = ogl;

    const renderer = new Renderer({ alpha: true, premultipliedAlpha: false });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    container.appendChild(gl.canvas);

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

        float hashF(float n) {
            return fract(sin(n * 127.1) * 43758.5453123);
        }

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

            float ridge = pow(
                step(abs(nY - blended.x) * 2.0, HALF_PI) * cos(2.0 * (nY - blended.x)),
                5.0
            );

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

    const geometry = new Triangle(gl);
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

    const rotationRad = (-45 * Math.PI) / 180;
    
    const program = new Program(gl, {
        vertex: vertexShader,
        fragment: fragmentShader,
        uniforms: {
            uTime: { value: 0 },
            uResolution: { value: [window.innerWidth, window.innerHeight, window.innerWidth / window.innerHeight] },
            uSpeed: { value: 0.3 },
            uInnerLines: { value: 32.0 },
            uOuterLines: { value: 36.0 },
            uWarpIntensity: { value: 1.0 },
            uRotation: { value: rotationRad },
            uEdgeFadeWidth: { value: 0.0 },
            uColorCycleSpeed: { value: 1.0 },
            uBrightness: { value: 0.2 },
            uColor1: { value: [1.0, 1.0, 1.0] },
            uColor2: { value: [1.0, 1.0, 1.0] },
            uColor3: { value: [1.0, 1.0, 1.0] },
            uMouse: { value: new Float32Array([0.5, 0.5]) },
            uMouseInfluence: { value: 2.0 },
            uEnableMouse: { value: true }
        },
        transparent: true
    });

    const mesh = new Mesh(gl, { geometry, program });

    function resize() {
        renderer.setSize(window.innerWidth, window.innerHeight);
        if (program) {
            program.uniforms.uResolution.value = [window.innerWidth, window.innerHeight, window.innerWidth / window.innerHeight];
        }
    }
    window.addEventListener('resize', resize);
    resize();

    gl.canvas.addEventListener('mousemove', handleMouseMove);
    gl.canvas.addEventListener('mouseleave', handleMouseLeave);

    let animationFrameId;

    function update(time) {
        animationFrameId = requestAnimationFrame(update);
        program.uniforms.uTime.value = time * 0.001;

        currentMouse[0] += 0.05 * (targetMouse[0] - currentMouse[0]);
        currentMouse[1] += 0.05 * (targetMouse[1] - currentMouse[1]);
        program.uniforms.uMouse.value[0] = currentMouse[0];
        program.uniforms.uMouse.value[1] = currentMouse[1];

        renderer.render({ scene: mesh });
    }
    animationFrameId = requestAnimationFrame(update);

    // --- Form & API Logic ---
    const configForm = document.getElementById('config-form');
    const tokenInput = document.getElementById('token');
    const guildSelect = document.getElementById('guildId');
    const channelSelect = document.getElementById('channelId');
    const useRpcInput = document.getElementById('useRpc');
    
    const statusSpan = document.getElementById('bot-status');
    const btnStart = document.getElementById('btn-start');
    const btnStop = document.getElementById('btn-stop');
    const btnLoadGuilds = document.getElementById('btn-load-guilds');
    
    const startSpinner = document.getElementById('start-spinner');
    const stopSpinner = document.getElementById('stop-spinner');
    const loadSpinner = document.getElementById('load-spinner');
    
    const messageArea = document.getElementById('message-area');
    const tokenMsg = document.getElementById('token-msg');

    let savedGuildId = '';
    let savedChannelId = '';

    function showMessage(msg, isError = false) {
        messageArea.textContent = msg;
        messageArea.className = `mt-5 text-xs text-center font-bold tracking-widest transition-opacity duration-300 opacity-100 uppercase ${isError ? 'text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]' : 'text-gray-400'}`;
        setTimeout(() => { 
            messageArea.classList.remove('opacity-100');
            messageArea.classList.add('opacity-0');
        }, 3000);
    }

    fetch('/api/config')
        .then(res => res.json())
        .then(data => {
            tokenInput.value = data.token || '';
            savedGuildId = data.guildId || '';
            savedChannelId = data.channelId || '';
            useRpcInput.checked = data.useRpc !== false; 
            
            if(data.token) loadGuilds(data.token);
        })
        .catch(err => showMessage('Gagal mengambil konfigurasi.', true));

    function fetchStatus() {
        fetch('/api/status')
            .then(res => res.json())
            .then(data => {
                statusSpan.textContent = data.status;
                if (data.status === 'Online') {
                    statusSpan.className = 'px-3 py-1 rounded-md text-xs font-bold uppercase tracking-widest bg-green-500/20 text-green-400 border border-green-500/30 shadow-[0_0_10px_rgba(7ade80,0.2)] transition-colors duration-300';
                } else if (data.status === 'Disconnected') {
                    statusSpan.className = 'px-3 py-1 rounded-md text-xs font-bold uppercase tracking-widest bg-white/5 text-gray-400 border border-white/10 shadow-sm transition-colors duration-300';
                } else {
                    statusSpan.className = 'px-3 py-1 rounded-md text-xs font-bold uppercase tracking-widest bg-red-500/20 text-red-400 border border-red-500/30 shadow-[0_0_10px_rgba(248,113,113,0.2)] transition-colors duration-300';
                }
            })
            .catch(err => {
                statusSpan.textContent = 'Offline';
                statusSpan.className = 'px-3 py-1 rounded-md text-xs font-bold uppercase tracking-widest bg-red-500/20 text-red-400 border border-red-500/30 shadow-[0_0_10px_rgba(248,113,113,0.2)] transition-colors duration-300';
            });
    }

    fetchStatus();
    setInterval(fetchStatus, 3000); 

    function loadGuilds(token) {
        tokenMsg.textContent = "MEMUAT SERVER...";
        tokenMsg.className = "text-xs font-bold tracking-widest text-gray-400 mt-2 text-center";
        btnLoadGuilds.disabled = true;
        btnLoadGuilds.classList.add('opacity-50', 'cursor-not-allowed');
        loadSpinner.classList.remove('hidden');
        
        fetch('/api/guilds', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
        })
        .then(res => res.json())
        .then(data => {
            btnLoadGuilds.disabled = false;
            btnLoadGuilds.classList.remove('opacity-50', 'cursor-not-allowed');
            loadSpinner.classList.add('hidden');
            if (data.success && data.guilds) {
                tokenMsg.textContent = `BERHASIL MEMUAT ${data.guilds.length} SERVER.`;
                tokenMsg.className = "text-xs font-bold tracking-widest text-white mt-2 text-center";
                
                guildSelect.innerHTML = '<option value="" disabled selected>Pilih Server...</option>';
                data.guilds.forEach(g => {
                    const option = document.createElement('option');
                    option.value = g.id;
                    option.textContent = g.name;
                    guildSelect.appendChild(option);
                });
                guildSelect.disabled = false;
                
                if(savedGuildId) {
                    guildSelect.value = savedGuildId;
                    loadChannels(token, savedGuildId);
                }
            } else {
                tokenMsg.textContent = "TOKEN TIDAK VALID / LIMIT.";
                tokenMsg.className = "text-xs font-bold tracking-widest text-gray-500 mt-2 text-center";
                guildSelect.disabled = true;
                channelSelect.disabled = true;
            }
        })
        .catch(err => {
            btnLoadGuilds.disabled = false;
            btnLoadGuilds.classList.remove('opacity-50', 'cursor-not-allowed');
            loadSpinner.classList.add('hidden');
            tokenMsg.textContent = "GAGAL MENGHUBUNGI SERVER.";
            tokenMsg.className = "text-xs font-bold tracking-widest text-gray-500 mt-2 text-center";
        });
    }
    
    function loadChannels(token, guildId) {
        channelSelect.innerHTML = '<option value="" disabled selected>Memuat Channel...</option>';
        channelSelect.disabled = true;
        
        fetch('/api/channels', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, guildId })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success && data.channels) {
                channelSelect.innerHTML = '<option value="" disabled selected>Pilih Channel...</option>';
                if(data.channels.length === 0) {
                     channelSelect.innerHTML = '<option value="" disabled selected>TIDAK ADA VOICE CHANNEL</option>';
                     return;
                }
                data.channels.forEach(c => {
                    const option = document.createElement('option');
                    option.value = c.id;
                    option.textContent = c.name;
                    channelSelect.appendChild(option);
                });
                channelSelect.disabled = false;
                
                if(savedChannelId) {
                    channelSelect.value = savedChannelId;
                    savedChannelId = ''; 
                }
            }
        })
        .catch(err => {
            channelSelect.innerHTML = '<option value="" disabled selected>Gagal memuat channel</option>';
        });
    }

    btnLoadGuilds.addEventListener('click', () => {
        const token = tokenInput.value.trim();
        if(!token) return showMessage('Masukkan Token.', true);
        savedGuildId = '';
        savedChannelId = '';
        loadGuilds(token);
    });

    guildSelect.addEventListener('change', () => {
        const token = tokenInput.value.trim();
        const guildId = guildSelect.value;
        if(token && guildId) {
            loadChannels(token, guildId);
        }
    });

    configForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newConfig = {
            token: tokenInput.value,
            guildId: guildSelect.value,
            channelId: channelSelect.value,
            useRpc: useRpcInput.checked
        };

        if(!newConfig.guildId || !newConfig.channelId) {
             showMessage('Pilih Server dan Channel.', true);
             return;
        }

        const btnSave = document.getElementById('btn-save');
        const ogText = btnSave.textContent;
        btnSave.textContent = 'MENYIMPAN...';
        btnSave.disabled = true;

        fetch('/api/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newConfig)
        })
        .then(res => res.json())
        .then(data => {
            btnSave.textContent = ogText;
            btnSave.disabled = false;
            if (data.success) showMessage('KONFIGURASI TERSIMPAN!');
        })
        .catch(err => {
            btnSave.textContent = ogText;
            btnSave.disabled = false;
            showMessage('GAGAL MENYIMPAN.', true);
        });
    });

    btnStart.addEventListener('click', () => {
        btnStart.disabled = true;
        btnStart.classList.add('opacity-70', 'cursor-wait');
        startSpinner.classList.remove('hidden');
        fetch('/api/bot/start', { method: 'POST' })
            .then(res => res.json())
            .then(data => {
                btnStart.disabled = false;
                btnStart.classList.remove('opacity-70', 'cursor-wait');
                startSpinner.classList.add('hidden');
                showMessage(data.message.toUpperCase(), !data.success);
                fetchStatus();
            })
            .catch(err => {
                btnStart.disabled = false;
                btnStart.classList.remove('opacity-70', 'cursor-wait');
                startSpinner.classList.add('hidden');
                showMessage('GAGAL START BOT.', true);
            });
    });

    btnStop.addEventListener('click', () => {
        btnStop.disabled = true;
        btnStop.classList.add('opacity-70', 'cursor-wait');
        stopSpinner.classList.remove('hidden');
        fetch('/api/bot/stop', { method: 'POST' })
            .then(res => res.json())
            .then(data => {
                btnStop.disabled = false;
                btnStop.classList.remove('opacity-70', 'cursor-wait');
                stopSpinner.classList.add('hidden');
                showMessage(data.message.toUpperCase(), !data.success);
                fetchStatus();
            })
            .catch(err => {
                btnStop.disabled = false;
                btnStop.classList.remove('opacity-70', 'cursor-wait');
                stopSpinner.classList.add('hidden');
                showMessage('GAGAL STOP BOT.', true);
            });
    });
});
