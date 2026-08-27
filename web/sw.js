//=============================================================================
// Service Worker for 买个可乐饼吧！
// 支持离线缓存 + 版本更新机制
// 版本: v1.0.0
//=============================================================================

const SW_VERSION = 'v1.0.0';
const CACHE_NAME = 'game-cache-' + SW_VERSION;

// 核心文件 - 优先网络（确保获取最新版本）
const CORE_FILES = [
    '/',
    '/index.html',
    '/manifest.json',
    '/js/main.js',
    '/js/plugins.js',
    '/js/rpg_core.js',
    '/js/rpg_managers.js',
    '/js/rpg_objects.js',
    '/js/rpg_scenes.js',
    '/js/rpg_sprites.js',
    '/js/rpg_windows.js'
];

// 库文件 - 缓存优先
const LIB_FILES = [
    '/js/libs/pixi.js',
    '/js/libs/pixi-tilemap.js',
    '/js/libs/pixi-picture.js',
    '/js/libs/fpsmeter.js',
    '/js/libs/lz-string.js',
    '/js/libs/iphone-inline-video.browser.js'
];

// 字体文件
const FONT_FILES = [
    '/fonts/gamefont.css',
    '/fonts/Siyuanrouhei.ttf',
    '/fonts/ComicNeue-Regular.ttf',
    '/fonts/KiwiMaru-Regular.ttf'
];

// 图标文件
const ICON_FILES = [
    '/icon/icon.png'
];

// 需要预缓存的所有文件
const PRECACHE_FILES = [...CORE_FILES, ...LIB_FILES, ...FONT_FILES, ...ICON_FILES];

//=============================================================================
// 安装事件 - 预缓存核心文件
//=============================================================================
self.addEventListener('install', (event) => {
    console.log('[SW] Installing Service Worker ' + SW_VERSION);

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Pre-caching core files');
                // 逐个添加，忽略单个失败
                return Promise.all(
                    PRECACHE_FILES.map((url) => {
                        return cache.add(url).catch((err) => {
                            console.warn('[SW] Failed to cache:', url, err);
                        });
                    })
                );
            })
            .then(() => {
                console.log('[SW] Pre-cache complete');
                return self.skipWaiting();
            })
    );
});

//=============================================================================
// 激活事件 - 清理旧缓存，通知客户端更新
//=============================================================================
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating Service Worker ' + SW_VERSION);

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name.startsWith('game-cache-') && name !== CACHE_NAME)
                        .map((name) => {
                            console.log('[SW] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => {
                console.log('[SW] Claiming clients');
                return self.clients.claim();
            })
            .then(() => {
                // 通知所有客户端有新版本
                return self.clients.matchAll();
            })
            .then((clients) => {
                clients.forEach((client) => {
                    client.postMessage({
                        type: 'SW_UPDATE_AVAILABLE',
                        version: SW_VERSION
                    });
                });
            })
    );
});

//=============================================================================
// 请求拦截 - 混合缓存策略
//=============================================================================
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // 只处理同源请求
    if (url.origin !== location.origin) {
        return;
    }

    // 核心HTML/JS文件 - Network First（确保最新）
    if (isCoreFile(url.pathname)) {
        event.respondWith(networkFirst(event.request));
        return;
    }

    // 图片、音频、数据 - Cache First（优先缓存，后台更新）
    if (isStaticAsset(url.pathname)) {
        event.respondWith(cacheFirst(event.request));
        return;
    }

    // 其他请求 - Network First with Cache Fallback
    event.respondWith(networkFirst(event.request));
});

//=============================================================================
// 判断文件类型
//=============================================================================
function isCoreFile(pathname) {
    return CORE_FILES.some((file) => pathname === file || pathname === file.replace('/', ''));
}

function isStaticAsset(pathname) {
    const staticExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.ogg', '.mp3', '.m4a', '.wav', '.json', '.ttf', '.woff', '.woff2'];
    return staticExtensions.some((ext) => pathname.toLowerCase().endsWith(ext));
}

//=============================================================================
// Network First 策略 - 优先网络，离线用缓存
//=============================================================================
async function networkFirst(request) {
    const cache = await caches.open(CACHE_NAME);

    try {
        // 尝试从网络获取
        const networkResponse = await fetch(request);

        // 成功则更新缓存
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        // 网络失败，使用缓存
        console.log('[SW] Network failed, using cache for:', request.url);
        const cachedResponse = await cache.match(request);

        if (cachedResponse) {
            return cachedResponse;
        }

        // 无缓存，返回离线页面
        return new Response('离线状态，无法加载资源', {
            status: 503,
            statusText: 'Service Unavailable'
        });
    }
}

//=============================================================================
// Cache First 策略 - 优先缓存，后台静默更新
//=============================================================================
async function cacheFirst(request) {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);

    // 后台更新（不阻塞响应）
    const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    }).catch(() => {
        // 网络失败，静默忽略
    });

    // 有缓存立即返回
    if (cachedResponse) {
        return cachedResponse;
    }

    // 无缓存，等待网络
    return fetchPromise || new Response('资源未找到', {
        status: 404,
        statusText: 'Not Found'
    });
}

//=============================================================================
// 消息处理 - 手动检查更新
//=============================================================================
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'CHECK_UPDATE') {
        // 检查是否有新版本
        self.registration.update().then(() => {
            console.log('[SW] Update check complete');
        });
    }

    if (event.data && event.data.type === 'SKIP_WAITING') {
        // 跳过等待，立即激活新版本
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'GET_VERSION') {
        // 返回当前版本号
        event.ports[0].postMessage({ version: SW_VERSION });
    }
});

//=============================================================================
// 后台同步（可选）
//=============================================================================
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-save') {
        console.log('[SW] Background sync triggered');
    }
});

console.log('[SW] Service Worker loaded, version:', SW_VERSION);
