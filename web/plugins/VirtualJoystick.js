//=============================================================================
// Virtual Joystick for RPG Maker MV - 响应式布局版
// 移动端虚拟手柄（适配全屏/非全屏）- 摇杆轮盘模式
//=============================================================================

(function() {
    'use strict';

    // 检测是否为移动设备
    var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (!isMobile) return;

    //=============================================================================
    // 响应式配置
    //=============================================================================
    var Config = {
        // 根据屏幕宽度和方向计算按钮大小
        getButtonSize: function() {
            var width = window.innerWidth;
            var height = window.innerHeight;
            var isLandscape = width > height;

            if (isLandscape) {
                // 横屏模式 - 保持原样
                if (width >= 800) return 55;
                return 50;
            }
            // 竖屏模式 - 横屏的1.2倍大小
            if (width >= 768) return 66;  // 55 * 1.2
            return 60;  // 50 * 1.2
        },
        // 确定按钮更大
        getActionButtonSize: function() {
            return this.getButtonSize() + 25;
        },
        // 菜单按钮比确定小
        getFuncButtonSize: function() {
            return this.getButtonSize() - 5;
        },
        getSmallButtonSize: function() {
            return this.getButtonSize() * 0.45;
        },
        // 摇杆半径 - 更小巧
        getJoystickRadius: function() {
            var btnSize = this.getButtonSize();
            return btnSize * 1.3;
        },
        opacity: 0.5,
        margin: 8
    };

    var VirtualJoystickContainer = null;
    var audioUnlocked = false;
    var activeTouches = {};
    var isJoystickMode = true; // 默认摇杆模式
    var leftAreaElement = null; // 左侧区域元素

    //=============================================================================
    // 创建虚拟手柄
    //=============================================================================
    function createVirtualJoystick() {
        if (VirtualJoystickContainer) {
            VirtualJoystickContainer.remove();
        }

        // 清理旧的左上角按钮区域，避免重复创建
        var oldTopLeftArea = document.getElementById('top-left-buttons-area');
        if (oldTopLeftArea) {
            oldTopLeftArea.remove();
        }

        var btnSize = Config.getButtonSize();
        var actionSize = Config.getActionButtonSize();
        var funcSize = Config.getFuncButtonSize();
        var smallSize = Config.getSmallButtonSize();

        // 检测横屏/竖屏
        var isLandscape = window.innerWidth > window.innerHeight;

        // 根据方向设置容器高度 - 横屏减少遮挡
        var containerHeight = isLandscape ? 110 : 160;

        VirtualJoystickContainer = document.createElement('div');
        VirtualJoystickContainer.id = 'virtual-joystick-container';
        VirtualJoystickContainer.style.cssText = `
            position: fixed;
            bottom: 5px;
            left: 0;
            right: 0;
            height: ${containerHeight}px;
            pointer-events: none;
            z-index: 9999;
            display: flex;
            justify-content: space-between;
            padding: 0 10px;
        `;

        // 创建左侧区域 - 根据模式选择摇杆或方向键
        if (isJoystickMode) {
            createLeftJoystickArea(isLandscape);
        } else {
            createLeftDPadArea(isLandscape);
        }

        // 创建右侧区域 - 菜单在上，确定在下（确定更大）
        createRightArea(actionSize, funcSize, isLandscape);

        document.body.appendChild(VirtualJoystickContainer);

        // 创建左上角小按钮 - 音乐、全屏
        createTopLeftButtons(smallSize, isLandscape);

        unlockAudio();
    }

    //=============================================================================
    // 创建左侧摇杆区域 - 更小巧
    //=============================================================================
    function createLeftJoystickArea(isLandscape) {
        var joystickRadius = Config.getJoystickRadius();
        var stickRadius = joystickRadius * 0.35;

        leftAreaElement = document.createElement('div');
        var areaWidth = joystickRadius * 2.2;
        leftAreaElement.style.cssText = `
            position: relative;
            width: ${areaWidth}px;
            height: 100%;
            pointer-events: none;
        `;

        // 摇杆底座 - 半透明灰色
        var joystickBase = document.createElement('div');
        joystickBase.id = 'joystick-base';
        joystickBase.style.cssText = `
            position: absolute;
            left: 0;
            bottom: 5px;
            width: ${joystickRadius * 2}px;
            height: ${joystickRadius * 2}px;
            border-radius: 50%;
            background: rgba(200, 200, 200, 0.25);
            border: 1px solid rgba(255, 255, 255, 0.3);
            pointer-events: auto;
            touch-action: none;
        `;

        // 摇杆把手 - 半透明白色
        var joystickStick = document.createElement('div');
        joystickStick.id = 'joystick-stick';
        joystickStick.style.cssText = `
            position: absolute;
            left: 50%;
            top: 50%;
            width: ${stickRadius * 2}px;
            height: ${stickRadius * 2}px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.6);
            border: 1px solid rgba(255, 255, 255, 0.8);
            transform: translate(-50%, -50%);
            pointer-events: none;
            box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        `;

        joystickBase.appendChild(joystickStick);
        leftAreaElement.appendChild(joystickBase);

        // 添加摇杆事件
        setupJoystickEvents(joystickBase, joystickStick, joystickRadius, stickRadius);

        VirtualJoystickContainer.appendChild(leftAreaElement);
    }

    //=============================================================================
    // 创建左侧方向键区域
    //=============================================================================
    function createLeftDPadArea(isLandscape) {
        var btnSize = Config.getButtonSize();
        var dPadSize = btnSize * 0.9;
        var gap = 4;

        leftAreaElement = document.createElement('div');
        var areaWidth = dPadSize * 3 + gap * 2 + 20;
        var areaHeight = dPadSize * 3 + gap * 2 + 10;
        leftAreaElement.style.cssText = `
            position: relative;
            width: ${areaWidth}px;
            height: 100%;
            pointer-events: none;
        `;

        // 方向键容器
        var dPadContainer = document.createElement('div');
        dPadContainer.style.cssText = `
            position: absolute;
            left: 0;
            bottom: 5px;
            width: ${dPadSize * 3 + gap * 2}px;
            height: ${dPadSize * 3 + gap * 2}px;
            pointer-events: none;
        `;

        // 创建四个方向按钮
        var directions = [
            { id: 'up', label: '▲', x: 1, y: 0 },
            { id: 'down', label: '▼', x: 1, y: 2 },
            { id: 'left', label: '◀', x: 0, y: 1 },
            { id: 'right', label: '▶', x: 2, y: 1 }
        ];

        directions.forEach(function(dir) {
            var btn = document.createElement('div');
            btn.id = 'dpad-' + dir.id;
            btn.innerHTML = dir.label;
            btn.style.cssText = `
                position: absolute;
                left: ${dir.x * (dPadSize + gap)}px;
                top: ${dir.y * (dPadSize + gap)}px;
                width: ${dPadSize}px;
                height: ${dPadSize}px;
                background: rgba(200, 200, 200, 0.35);
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: ${Math.floor(dPadSize * 0.4)}px;
                color: #333;
                pointer-events: auto;
                user-select: none;
                -webkit-user-select: none;
                touch-action: none;
                border: 1px solid rgba(255,255,255,0.3);
            `;

            // 触摸事件
            btn.addEventListener('touchstart', function(e) {
                e.preventDefault();
                this.style.transform = 'scale(0.9)';
                this.style.background = 'rgba(200, 200, 200, 0.5)';
                simulateKey(dir.id, true);
            }, { passive: false });

            btn.addEventListener('touchend', function(e) {
                e.preventDefault();
                this.style.transform = 'scale(1)';
                this.style.background = 'rgba(200, 200, 200, 0.35)';
                simulateKey(dir.id, false);
            }, { passive: false });

            btn.addEventListener('touchcancel', function(e) {
                this.style.transform = 'scale(1)';
                this.style.background = 'rgba(200, 200, 200, 0.35)';
                simulateKey(dir.id, false);
            });

            dPadContainer.appendChild(btn);
        });

        leftAreaElement.appendChild(dPadContainer);
        VirtualJoystickContainer.appendChild(leftAreaElement);
    }

    //=============================================================================
    // 摇杆事件处理
    //=============================================================================
    function setupJoystickEvents(base, stick, maxRadius, stickRadius) {
        var activeTouchId = null;
        var centerX = maxRadius;
        var centerY = maxRadius;
        var currentDirection = null;

        function getTouchPos(touch) {
            var rect = base.getBoundingClientRect();
            return {
                x: touch.clientX - rect.left,
                y: touch.clientY - rect.top
            };
        }

        function updateStick(pos) {
            var dx = pos.x - centerX;
            var dy = pos.y - centerY;
            var distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > maxRadius - stickRadius) {
                var ratio = (maxRadius - stickRadius) / distance;
                dx *= ratio;
                dy *= ratio;
            }

            stick.style.left = (centerX + dx) + 'px';
            stick.style.top = (centerY + dy) + 'px';
            stick.style.transform = 'translate(-50%, -50%)';

            // 判断方向
            var threshold = 15;
            var newDirection = null;

            if (distance > threshold) {
                var angle = Math.atan2(dy, dx) * 180 / Math.PI;
                if (angle >= -45 && angle < 45) newDirection = 'right';
                else if (angle >= 45 && angle < 135) newDirection = 'down';
                else if (angle >= -135 && angle < -45) newDirection = 'up';
                else newDirection = 'left';
            }

            if (newDirection !== currentDirection) {
                if (currentDirection) simulateKey(currentDirection, false);
                if (newDirection) simulateKey(newDirection, true);
                currentDirection = newDirection;
            }
        }

        function resetStick() {
            stick.style.left = '50%';
            stick.style.top = '50%';
            stick.style.transform = 'translate(-50%, -50%)';
            if (currentDirection) {
                simulateKey(currentDirection, false);
                currentDirection = null;
            }
        }

        base.addEventListener('touchstart', function(e) {
            e.preventDefault();
            if (activeTouchId === null) {
                var touch = e.changedTouches[0];
                activeTouchId = touch.identifier;
                updateStick(getTouchPos(touch));
            }
        }, { passive: false });

        base.addEventListener('touchmove', function(e) {
            e.preventDefault();
            if (activeTouchId !== null) {
                for (var i = 0; i < e.changedTouches.length; i++) {
                    if (e.changedTouches[i].identifier === activeTouchId) {
                        updateStick(getTouchPos(e.changedTouches[i]));
                        break;
                    }
                }
            }
        }, { passive: false });

        base.addEventListener('touchend', function(e) {
            for (var i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === activeTouchId) {
                    activeTouchId = null;
                    resetStick();
                    break;
                }
            }
        });

        base.addEventListener('touchcancel', function(e) {
            for (var i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === activeTouchId) {
                    activeTouchId = null;
                    resetStick();
                    break;
                }
            }
        });
    }

    //=============================================================================
    // 创建右侧区域 - 确定在右下，菜单在确定斜左上方
    //=============================================================================
    function createRightArea(actionSize, funcSize, isLandscape) {
        var rightArea = document.createElement('div');
        var areaWidth = isLandscape ? actionSize * 2.5 : actionSize * 3;
        rightArea.style.cssText = `
            position: relative;
            width: ${areaWidth}px;
            height: 100%;
            pointer-events: none;
        `;

        // 确定按钮 - 右下（最大的按钮）
        var okBtn = createButton('ok', '确定', {
            width: actionSize,
            height: actionSize,
            right: isLandscape ? 10 : 5,
            bottom: 0,
            color: 'rgba(200, 200, 200, 0.35)',
            fontSize: Math.floor(actionSize * 0.28) + 'px',
            borderRadius: '50%'
        });
        rightArea.appendChild(okBtn);

        // 菜单按钮 - 确定按钮斜左上方（确定按钮的80%大小）
        // 斜左上方：向左偏移超过确定按钮宽度，确保不遮挡
        var menuSize = actionSize * 0.8;  // 菜单按钮为确定按钮的80%
        var menuOffsetLeft = actionSize * 0.85;  // 向左偏移，稍微靠右一点
        var menuOffsetBottom = actionSize * 0.9;  // 向上偏移更多，避免挡住游戏画面
        var menuBtn = createButton('escape', '菜单', {
            width: menuSize,
            height: menuSize,
            right: isLandscape ? 10 + menuOffsetLeft : 5 + menuOffsetLeft,
            bottom: menuOffsetBottom,
            color: 'rgba(200, 200, 200, 0.35)',
            fontSize: Math.floor(menuSize * 0.28) + 'px',
            borderRadius: '50%'
        });
        rightArea.appendChild(menuBtn);

        VirtualJoystickContainer.appendChild(rightArea);
    }

    //=============================================================================
    // 创建左上角小按钮（切换和全屏）
    //=============================================================================
    function createTopLeftButtons(smallSize, isLandscape) {
        var topLeftArea = document.createElement('div');
        topLeftArea.id = 'top-left-buttons-area';
        topLeftArea.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            z-index: 10000;
            pointer-events: none;
            display: flex;
            gap: 8px;
        `;

        // 切换按钮 - 摇杆/方向键切换
        var toggleBtn = document.createElement('div');
        toggleBtn.id = 'vbtn-toggle';
        toggleBtn.innerHTML = '⌨️';
        toggleBtn.style.cssText = `
            width: ${smallSize * 1.1}px;
            height: ${smallSize * 1.1}px;
            background: rgba(200, 200, 200, 0.4);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: ${Math.floor(smallSize * 0.55)}px;
            pointer-events: auto;
            user-select: none;
            -webkit-user-select: none;
            touch-action: none;
            box-shadow: 0 2px 6px rgba(0,0,0,0.2);
            border: 1px solid rgba(255,255,255,0.3);
            transition: all 0.15s ease;
        `;

        toggleBtn.addEventListener('touchstart', function(e) {
            e.preventDefault();
            e.stopPropagation();
            this.style.transform = 'scale(0.9)';
        }, { passive: false });

        toggleBtn.addEventListener('touchend', function(e) {
            e.preventDefault();
            e.stopPropagation();
            this.style.transform = 'scale(1)';
            toggleControlMode();
        }, { passive: false });

        topLeftArea.appendChild(toggleBtn);

        // 全屏按钮
        var fullscreenBtn = createSmallButton('f4', '⛶', {
            width: smallSize,
            height: smallSize,
            color: 'rgba(200, 200, 200, 0.4)'
        });
        topLeftArea.appendChild(fullscreenBtn);

        document.body.appendChild(topLeftArea);
    }

    //=============================================================================
    // 切换控制模式（摇杆/方向键）
    //=============================================================================
    function toggleControlMode() {
        isJoystickMode = !isJoystickMode;
        
        // 重新创建手柄
        createVirtualJoystick();
        
        // 显示提示
        showToast(isJoystickMode ? '摇杆模式' : '方向键模式');
    }

    //=============================================================================
    // 创建小按钮（左上角用）
    //=============================================================================
    function createSmallButton(id, label, options) {
        var btn = document.createElement('div');
        btn.id = 'vbtn-' + id;
        btn.innerHTML = label;

        var css = `
            width: ${options.width}px;
            height: ${options.height}px;
            background: ${options.color};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: ${Math.floor(options.width * 0.5)}px;
            color: #333;
            pointer-events: auto;
            user-select: none;
            -webkit-user-select: none;
            touch-action: none;
            box-shadow: 0 2px 6px rgba(0,0,0,0.2);
            border: 1px solid rgba(255,255,255,0.3);
            transition: all 0.08s ease;
        `;

        btn.style.cssText = css;

        var key = id === 'f4' ? 'f4' : id;

        // 触摸事件
        btn.addEventListener('touchstart', function(e) {
            e.preventDefault();
            e.stopPropagation();
            this.style.transform = 'scale(0.92)';
            simulateKey(key, true);
            unlockAudio();
        }, { passive: false });

        btn.addEventListener('touchend', function(e) {
            e.preventDefault();
            e.stopPropagation();
            this.style.transform = 'scale(1)';
            simulateKey(key, false);
        }, { passive: false });

        btn.addEventListener('touchcancel', function(e) {
            this.style.transform = 'scale(1)';
            simulateKey(key, false);
        });

        return btn;
    }

    //=============================================================================
    // 创建按钮（主按钮用）- 文字加粗清晰
    //=============================================================================
    function createButton(id, label, options) {
        var btn = document.createElement('div');
        btn.id = 'vbtn-' + id;
        btn.innerHTML = label;

        var css = `
            position: absolute;
            width: ${options.width}px;
            height: ${options.height}px;
            background: ${options.color};
            border-radius: ${options.borderRadius};
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: ${options.fontSize};
            color: #222;
            font-weight: 700;
            pointer-events: auto;
            user-select: none;
            -webkit-user-select: none;
            touch-action: none;
            box-shadow: 0 2px 6px rgba(0,0,0,0.15);
            border: 1px solid rgba(255,255,255,0.3);
            transition: all 0.08s ease;
            text-shadow: 0 1px 1px rgba(255,255,255,0.5);
        `;

        if (options.left !== undefined) css += `left: ${options.left}px;`;
        if (options.right !== undefined) css += `right: ${options.right}px;`;
        if (options.top !== undefined) css += `top: ${options.top}px;`;
        if (options.bottom !== undefined) css += `bottom: ${options.bottom}px;`;

        btn.style.cssText = css;

        var key = id === 'f4' ? 'f4' : id;

        // 触摸事件
        btn.addEventListener('touchstart', function(e) {
            e.preventDefault();
            e.stopPropagation();
            this.style.transform = 'scale(0.92)';
            this.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
            simulateKey(key, true);
            unlockAudio();
        }, { passive: false });

        btn.addEventListener('touchend', function(e) {
            e.preventDefault();
            e.stopPropagation();
            this.style.transform = 'scale(1)';
            this.style.boxShadow = '0 2px 6px rgba(0,0,0,0.15)';
            simulateKey(key, false);
        }, { passive: false });

        btn.addEventListener('touchcancel', function(e) {
            this.style.transform = 'scale(1)';
            this.style.boxShadow = '0 2px 6px rgba(0,0,0,0.15)';
            simulateKey(key, false);
        });

        return btn;
    }

    //=============================================================================
    // 模拟按键
    //=============================================================================
    function simulateKey(key, pressed) {
        var keyCodes = {
            'up': 38, 'down': 40, 'left': 37, 'right': 39,
            'ok': 13, 'escape': 27, 'shift': 16, 'f4': 115
        };

        var code = keyCodes[key];
        if (!code) return;

        var event = new KeyboardEvent(pressed ? 'keydown' : 'keyup', {
            keyCode: code, which: code, bubbles: true, cancelable: true
        });
        document.dispatchEvent(event);

        // 更新 Input
        if (typeof Input !== 'undefined') {
            var keys = { 'up': 'up', 'down': 'down', 'left': 'left', 'right': 'right',
                        'ok': 'ok', 'escape': 'escape', 'shift': 'shift' };
            if (keys[key]) {
                Input._currentState[keys[key]] = pressed;
            }
        }

        // F4 全屏
        if (key === 'f4' && pressed) {
            toggleFullscreen();
        }
    }

    //=============================================================================
    // 全屏切换
    //=============================================================================
    function toggleFullscreen() {
        var doc = document;
        if (!doc.fullscreenElement && !doc.mozFullScreenElement &&
            !doc.webkitFullscreenElement && !doc.msFullscreenElement) {
            var el = doc.documentElement;
            if (el.requestFullscreen) el.requestFullscreen();
            else if (el.mozRequestFullScreen) el.mozRequestFullScreen();
            else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
            else if (el.msRequestFullscreen) el.msRequestFullscreen();
        } else {
            if (doc.exitFullscreen) doc.exitFullscreen();
            else if (doc.mozCancelFullScreen) doc.mozCancelFullScreen();
            else if (doc.webkitExitFullscreen) doc.webkitExitFullscreen();
            else if (doc.msExitFullscreen) doc.msExitFullscreen();
        }
    }

    //=============================================================================
    // 解锁音频 - 更积极的解锁策略
    //=============================================================================
    function unlockAudio() {
        // 即使已解锁，也检查context状态
        var ctx = null;

        // 优先使用 RPG Maker 的 WebAudio context
        if (typeof WebAudio !== 'undefined' && WebAudio._context) {
            ctx = WebAudio._context;
        }

        // 如果 WebAudio 存在但 context 是 suspended，尝试 resume
        if (ctx && ctx.state === 'suspended') {
            ctx.resume().then(function() {
                playUnlockSound(ctx);
                audioUnlocked = true;
                console.log('[Audio] Unlocked via WebAudio resume');
            }).catch(function(e) {
                console.warn('[Audio] Resume failed:', e);
            });
        } else if (ctx && ctx.state === 'running') {
            playUnlockSound(ctx);
            audioUnlocked = true;
        }

        // 兜底：创建临时 AudioContext 解锁
        if (!audioUnlocked) {
            try {
                var AC = window.AudioContext || window.webkitAudioContext;
                if (AC) {
                    var tmpCtx = new AC();
                    playUnlockSound(tmpCtx);
                    audioUnlocked = true;
                    console.log('[Audio] Unlocked via temp AudioContext');
                }
            } catch(e) {
                console.warn('[Audio] Temp context failed:', e);
            }
        }

        // HTML5 Audio 兜底解锁
        try {
            var audio = new Audio();
            audio.src = 'data:audio/mp3;base64,//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqq';
            audio.volume = 0.001;
            audio.play().then(function() {
                audio.pause();
            }).catch(function() {});
        } catch(e) {}
    }

    // 播放解锁音频
    function playUnlockSound(ctx) {
        try {
            if (!WebAudio._unlocked && typeof WebAudio !== 'undefined') {
                var buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
                var source = ctx.createBufferSource();
                source.buffer = buffer;
                source.connect(ctx.destination);
                source.start(0);
                WebAudio._unlocked = true;
            }
        } catch(e) {}
    }

    //=============================================================================
    // 强制解锁音频 - resume 原始 context 并重新播放 BGM
    //=============================================================================
    function forceUnlockAudio() {
        var success = false;

        // 方法1: 恢复 RPG Maker 的 WebAudio 上下文
        try {
            if (typeof WebAudio !== 'undefined' && WebAudio._context) {
                var context = WebAudio._context;

                // 如果已经在运行，直接返回成功
                if (context.state === 'running') {
                    success = true;
                    audioUnlocked = true;
                }
                // 如果是挂起状态，尝试恢复
                else if (context.state === 'suspended' && context.resume) {
                    // iOS Safari 上 resume() 是异步的，必须在 resume 完成后再操作
                    context.resume().then(function() {
                        console.log('[Audio] Context resumed in forceUnlock');

                        // resume 完成后再播放静音 buffer
                        if (!WebAudio._unlocked) {
                            try {
                                var buffer = context.createBuffer(1, 1, context.sampleRate);
                                var source = context.createBufferSource();
                                source.buffer = buffer;
                                source.connect(context.destination);
                                source.start(0);
                                WebAudio._unlocked = true;
                            } catch(e) {}
                        }

                        // 重播 BGM（context 恢复后需要重播才能听到声音）
                        try {
                            if (typeof AudioManager !== 'undefined') {
                                var currentBgm = AudioManager._currentBgm;
                                if (currentBgm && currentBgm.name) {
                                    setTimeout(function() {
                                        try {
                                            if (AudioManager._bgmBuffer) {
                                                try { AudioManager._bgmBuffer.stop(); } catch(e) {}
                                                AudioManager._bgmBuffer = null;
                                            }
                                            AudioManager.playBgm(currentBgm);
                                            console.log('[Audio] BGM restarted:', currentBgm.name);
                                        } catch(err) {
                                            console.log('[Audio] BGM restart error:', err);
                                        }
                                    }, 200);
                                }
                            }
                        } catch(e) { console.log('[Audio] AudioManager error:', e); }
                    });
                    success = true;
                    audioUnlocked = true;
                }
            }
        } catch(e) { console.log('[Audio] WebAudio error:', e); }

        // 方法3: 使用 HTML5 Audio 播放静音（作为兜底解锁方式）
        try {
            var audio = new Audio();
            audio.src = 'data:audio/mp3;base64,//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq';
            audio.volume = 0.01;
            var playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.then(function() {
                    success = true;
                    audioUnlocked = true;
                    audio.pause();
                }).catch(function() {});
            }
        } catch(e) {}

        return success;
    }

    //=============================================================================
    // 显示提示信息
    //=============================================================================
    function showToast(message) {
        // 移除旧的提示
        var oldToast = document.getElementById('virtual-toast');
        if (oldToast) oldToast.remove();

        var toast = document.createElement('div');
        toast.id = 'virtual-toast';
        toast.innerHTML = message;
        toast.style.cssText = `
            position: fixed;
            top: 30%;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 10px 20px;
            border-radius: 20px;
            font-size: 14px;
            z-index: 10001;
            pointer-events: none;
            white-space: nowrap;
        `;
        document.body.appendChild(toast);

        // 2秒后消失
        setTimeout(function() {
            if (toast.parentNode) toast.remove();
        }, 2000);
    }

    //=============================================================================
    // 初始化
    //=============================================================================
    var joystickCreated = false; // 标记是否已创建
    
    var _Scene_Base_start = Scene_Base.prototype.start;
    Scene_Base.prototype.start = function() {
        _Scene_Base_start.call(this);
        
        // 只创建一次，避免重复
        if (!joystickCreated) {
            joystickCreated = true;
            setTimeout(createVirtualJoystick, 100);
        }
    };

    // 窗口大小改变时重新布局
    var resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            if (VirtualJoystickContainer) {
                createVirtualJoystick();
            }
        }, 250);
    });

    // 首次触摸解锁音频 - 积极策略
    document.addEventListener('touchstart', function() {
        unlockAudio();
    }, { once: true });

    // 首次点击也解锁
    document.addEventListener('click', function() {
        unlockAudio();
    }, { once: true });

    // 页面可见时再次检查音频
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            unlockAudio();
        }
    });

    // 暴露全局解锁函数供外部调用
    window.forceUnlockGameAudio = function() {
        audioUnlocked = false;
        unlockAudio();
        return audioUnlocked;
    };

})();
