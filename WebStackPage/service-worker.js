// 缓存名称
const CACHE_NAME = 'web-navigation-cache-v1';

// 需要缓存的资源列表
const urlsToCache = [
  '/',
  '/index.html',
  '/cn/index.html',
  '/en/index.html',
  '/manifest.json',
  '/assets/css/fonts/linecons/css/linecons.css',
  '/assets/css/fonts/fontawesome/css/font-awesome.min.css',
  '/assets/css/bootstrap.css',
  '/assets/css/xenon-core.css',
  '/assets/css/xenon-components.css',
  '/assets/css/xenon-skins.css',
  '/assets/css/nav.css',
  '/assets/js/jquery-1.11.1.min.js',
  '/assets/js/pwa-install.js',
  '/assets/images/logo@2x.png',
  '/assets/images/logo-collapsed@2x.png',
  '/assets/images/favicon.png',
  '/assets/images/icons/icon-192x192.png'
];

// 安装 Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('缓存已打开');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// 激活 Service Worker
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 处理请求
self.addEventListener('fetch', event => {
  // 网络优先策略
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // 复制响应，因为响应是流且只能使用一次
        const responseToCache = response.clone();
        
        // 将响应添加到缓存
        caches.open(CACHE_NAME)
          .then(cache => {
            // 仅缓存成功的请求
            if (event.request.method === 'GET' && response.status === 200) {
              cache.put(event.request, responseToCache);
            }
          });
          
        return response;
      })
      .catch(() => {
        // 网络请求失败时从缓存中获取
        return caches.match(event.request)
          .then(response => {
            // 如果在缓存中找到响应，则返回缓存的响应
            if (response) {
              return response;
            }
            
            // 如果是API请求，并且没有缓存可用，可以提供一个默认响应
            if (event.request.url.includes('/api/')) {
              return new Response(JSON.stringify({ 
                error: '当前处于离线状态，无法获取最新数据' 
              }), {
                headers: { 'Content-Type': 'application/json' }
              });
            }
            
            // 如果是HTML页面请求且没有缓存，返回离线页面
            const url = new URL(event.request.url);
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/offline.html');
            }
            
            // 如果既不是API请求也不是HTML页面，且没有缓存，则返回404
            return new Response('资源不可用，请检查网络连接', {
              status: 404,
              statusText: 'Not Found'
            });
          });
      })
  );
});

// 后台同步
self.addEventListener('sync', event => {
  if (event.tag === 'sync-favorites') {
    event.waitUntil(syncFavorites());
  }
});

// 同步收藏夹数据的函数
async function syncFavorites() {
  const storedFavorites = await getStoredFavorites();
  if (storedFavorites.length > 0) {
    try {
      const response = await fetch('/api/sync-favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(storedFavorites)
      });
      
      if (response.ok) {
        await clearStoredFavorites();
      }
    } catch (error) {
      console.error('同步收藏夹失败:', error);
    }
  }
}

// 模拟获取和清除存储的收藏夹数据的函数
async function getStoredFavorites() {
  // 实际实现应该从IndexedDB或其他存储中获取数据
  return [];
}

async function clearStoredFavorites() {
  // 实际实现应该清除IndexedDB或其他存储中的数据
} 