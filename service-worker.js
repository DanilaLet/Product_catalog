/**
 * Service Worker для каталога «Ортоцентр»
 * Версия: 4.0 с оптимизированной стратегией кэширования
 */

const APP_VERSION = '4.0.0';
const CACHE_NAME = `ortocentr-v${APP_VERSION}`;
const CACHE_VERSION = APP_VERSION;
const OFFLINE_URL = '/offline.html';
const PLACEHOLDER_IMAGE = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23f0f0f0"/><text x="50" y="60" font-size="40" text-anchor="middle" fill="%23b9c8c3">🦷</text></svg>';

// Критические ресурсы для офлайн-работы
const CRITICAL_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/404.html',
  '/style.css',
  '/script.js',
  '/products.json',
  '/manifest.json',
  '/assets/images/placeholder.jpg',
  'https://fonts.googleapis.com/css2?family=Manrope:wght@400..800&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Дополнительные ресурсы для предварительного кэширования
const PRECACHE_RESOURCES = [
  ...CRITICAL_ASSETS,
  // Иконки PWA
  '/icon-192.png',
  '/icon-512.png',
  // Локальные шрифты
  '/fonts/manrope-v13-latin-regular.woff2',
  '/fonts/manrope-v13-latin-700.woff2'
];

// Динамически кэшируемые типы файлов
const CACHEABLE_TYPES = [
  'text/html',
  'text/css',
  'text/javascript',
  'application/javascript',
  'application/json',
  'image/svg+xml',
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'font/woff2',
  'font/woff',
  'font/ttf'
];

// Исключения из кэширования
const NO_CACHE_URLS = [
  '/service-worker.js',
  /\/socket\.io\//,
  /\/api\//,
  /\/admin\//,
  /\/analytics\//,
  /\/hot-update\.js$/ // Для React Hot Module Replacement
];

// ============================================
// УСТАНОВКА SERVICE WORKER
// ============================================

self.addEventListener('install', (event) => {
  console.log(`🛠️ Service Worker ${APP_VERSION}: Установка...`);
  
  event.waitUntil(
    (async () => {
      try {
        // Открываем кэш
        const cache = await caches.open(CACHE_NAME);
        console.log('📦 Service Worker: Кэшируем критические ресурсы');
        
        // Кэшируем критические ресурсы
        const cachePromises = PRECACHE_RESOURCES.map(async (resource) => {
          try {
            const isExternal = resource.startsWith('http');
            if (isExternal) {
              // Для внешних ресурсов
              const response = await fetch(resource, {
                mode: 'cors',
                credentials: 'omit'
              });
              if (response.ok) {
                await cache.put(resource, response.clone());
              }
            } else {
              // Для локальных ресурсов
              await cache.add(resource);
            }
            console.log(`✅ Закэширован: ${resource}`);
          } catch (error) {
            console.warn(`⚠️ Не удалось закэшировать: ${resource}`, error.message);
          }
        });
        
        await Promise.allSettled(cachePromises);
        console.log('✅ Service Worker: Установка завершена');
        
        // Активируем сразу
        await self.skipWaiting();
        
        // Отправляем сообщение об успешной установке
        sendMessageToClients({
          type: 'SW_INSTALLED',
          version: APP_VERSION,
          cacheName: CACHE_NAME
        });
        
      } catch (error) {
        console.error('❌ Service Worker: Критическая ошибка установки:', error);
      }
    })()
  );
});

// ============================================
// АКТИВАЦИЯ SERVICE WORKER
// ============================================

self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker: Активация');
  
  event.waitUntil(
    (async () => {
      try {
        // Очистка старых кэшей
        const cacheNames = await caches.keys();
        const deletionPromises = cacheNames.map(async (cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName.startsWith('ortocentr-')) {
            console.log(`🗑️ Удаление старого кэша: ${cacheName}`);
            await caches.delete(cacheName);
          }
        });
        
        await Promise.all(deletionPromises);
        console.log('✅ Старые кэши очищены');
        
        // Берем контроль над всеми клиентами
        await self.clients.claim();
        
        // Отправляем сообщение об активации
        sendMessageToClients({
          type: 'SW_ACTIVATED',
          version: APP_VERSION,
          cacheName: CACHE_NAME
        });
        
        // Запускаем фоновую синхронизацию
        startBackgroundSync();
        
      } catch (error) {
        console.error('❌ Service Worker: Ошибка активации:', error);
      }
    })()
  );
});

// ============================================
// ОБРАБОТКА ЗАПРОСОВ
// ============================================

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Пропускаем не-GET запросы и специальные протоколы
  if (request.method !== 'GET') return;
  if (url.protocol === 'chrome-extension:' || url.protocol === 'data:') return;
  
  // Пропускаем исключения
  if (NO_CACHE_URLS.some(pattern => {
    if (typeof pattern === 'string') return url.pathname === pattern;
    return pattern.test(url.pathname);
  })) return;
  
  // Стратегия выбора на основе типа запроса
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(handleHtmlRequest(request));
    return;
  }
  
  if (isStaticResource(request)) {
    event.respondWith(handleStaticRequest(request));
    return;
  }
  
  if (url.pathname.includes('products.json')) {
    event.respondWith(handleApiRequest(request));
    return;
  }
  
  // Для остальных запросов
  event.respondWith(handleDefaultRequest(request));
});

/**
 * Обработка HTML-запросов (Network First)
 */
async function handleHtmlRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  
  try {
    // Пробуем сеть с таймаутом
    const networkPromise = fetch(request);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 5000)
    );
    
    const networkResponse = await Promise.race([networkPromise, timeoutPromise]);
    
    if (networkResponse && networkResponse.ok) {
      // Клонируем и кэшируем
      const responseClone = networkResponse.clone();
      if (networkResponse.status === 200) {
        await cache.put(request, responseClone);
      }
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
  } catch (error) {
    console.log(`📄 Нет сети, ищем в кэше: ${request.url}`);
    
    // Ищем в кэше
    const cachedResponse = await cache.match(request);
    if (cachedResponse) return cachedResponse;
    
    // Пробуем главную страницу
    if (request.url !== self.location.origin + '/') {
      const mainPage = await cache.match('/');
      if (mainPage) return mainPage;
    }
    
    // Возвращаем offline страницу
    const offlineResponse = await cache.match(OFFLINE_URL);
    if (offlineResponse) return offlineResponse;
    
    // Fallback
    return new Response(
      '<h1>Офлайн</h1><p>Приложение временно недоступно</p>',
      {
        status: 503,
        headers: { 'Content-Type': 'text/html' }
      }
    );
  }
}

/**
 * Обработка статических ресурсов (Cache First)
 */
async function handleStaticRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  
  // Сначала проверяем кэш
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    // Обновляем кэш в фоне
    updateCacheInBackground(request, cache);
    return cachedResponse;
  }
  
  try {
    // Загружаем из сети
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const responseClone = networkResponse.clone();
      await cache.put(request, responseClone);
      return networkResponse;
    }
    throw new Error('Network response not ok');
  } catch (error) {
    console.log(`📦 Ресурс не в кэше: ${request.url}`);
    
    // Заменяем изображения placeholder'ом
    if (request.url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
      return new Response(PLACEHOLDER_IMAGE, {
        headers: { 'Content-Type': 'image/svg+xml' }
      });
    }
    
    // Пустые ответы для CSS/JS
    if (request.url.match(/\.css$/i)) {
      return new Response('/* Офлайн */', {
        headers: { 'Content-Type': 'text/css' }
      });
    }
    
    if (request.url.match(/\.js$/i)) {
      return new Response('// Офлайн', {
        headers: { 'Content-Type': 'application/javascript' }
      });
    }
    
    return new Response('', { status: 404 });
  }
}

/**
 * Обработка API-запросов (Stale-While-Revalidate)
 */
async function handleApiRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  
  // Сначала возвращаем из кэша если есть
  const cachedResponse = await cache.match(request);
  
  // Фоновое обновление
  const fetchPromise = fetch(request, {
    headers: {
      'Cache-Control': 'no-cache',
      'X-Requested-With': 'XMLHttpRequest'
    }
  })
    .then(async (networkResponse) => {
      if (networkResponse.ok) {
        const responseClone = networkResponse.clone();
        await cache.put(request, responseClone);
        
        const headers = new Headers(networkResponse.headers);
        headers.set('X-Data-Source', 'network');
        headers.set('X-Cache-Version', APP_VERSION);
        
        return new Response(networkResponse.body, {
          status: networkResponse.status,
          statusText: networkResponse.statusText,
          headers
        });
      }
      throw new Error('Network response not ok');
    })
    .catch(error => {
      console.warn('⚠️ Нет сети для обновления данных:', error);
      return null;
    });
  
  // Если есть кэшированные данные, возвращаем их сразу
  if (cachedResponse) {
    // Запускаем фоновое обновление
    fetchPromise.catch(() => {});
    
    const headers = new Headers(cachedResponse.headers);
    headers.set('X-Data-Source', 'cache');
    headers.set('X-Cache-Version', APP_VERSION);
    headers.set('X-Cache-Date', new Date().toISOString());
    
    return new Response(cachedResponse.body, {
      status: cachedResponse.status,
      statusText: cachedResponse.statusText,
      headers
    });
  }
  
  // Если нет кэша, ждем сетевой ответ
  try {
    const networkResponse = await fetchPromise;
    if (networkResponse) return networkResponse;
    throw new Error('No network response');
  } catch (error) {
    // Fallback данные
    return new Response(JSON.stringify({ 
      products: [],
      message: 'Офлайн режим: данные временно недоступны',
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Data-Source': 'fallback',
        'X-Cache-Version': APP_VERSION
      }
    });
  }
}

/**
 * Обработка остальных запросов (Network First)
 */
async function handleDefaultRequest(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) return cachedResponse;
    
    return new Response('Сеть недоступна', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

/**
 * Проверка статического ресурса
 */
function isStaticResource(request) {
  const url = request.url;
  return (
    url.includes('/assets/') ||
    url.includes('/css/') ||
    url.includes('/js/') ||
    url.includes('/fonts/') ||
    url.includes('/icons/') ||
    url.includes('cdnjs.cloudflare.com') ||
    url.includes('fonts.googleapis.com') ||
    url.includes('fonts.gstatic.com') ||
    /\.(css|js|woff2|woff|ttf|eot|svg|png|jpg|jpeg|gif|webp|ico)$/i.test(url)
  );
}

/**
 * Фоновое обновление кэша
 */
async function updateCacheInBackground(request, cache) {
  const CACHE_REFRESH_TIME = 24 * 60 * 60 * 1000; // 24 часа
  
  try {
    const cachedResponse = await cache.match(request);
    if (!cachedResponse) return;
    
    const cachedDate = cachedResponse.headers.get('date');
    const cacheAge = cachedDate ? Date.now() - new Date(cachedDate).getTime() : Infinity;
    
    if (cacheAge > CACHE_REFRESH_TIME) {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        await cache.put(request, networkResponse.clone());
      }
    }
  } catch (error) {
    // Игнорируем ошибки фонового обновления
  }
}

// ============================================
// ФОНОВАЯ СИНХРОНИЗАЦИЯ
// ============================================

async function startBackgroundSync() {
  // Периодическая синхронизация
  if ('periodicSync' in self.registration) {
    try {
      await self.registration.periodicSync.register('update-products', {
        minInterval: 24 * 60 * 60 * 1000,
      });
      console.log('🔄 Периодическая синхронизация зарегистрирована');
    } catch (error) {
      console.log('⚠️ Периодическая синхронизация не поддерживается:', error);
    }
  }
  
  // Фоновая синхронизация
  if ('sync' in self.registration) {
    try {
      await self.registration.sync.register('sync-products');
      console.log('🔄 Фоновая синхронизация зарегистрирована');
    } catch (error) {
      console.log('⚠️ Фоновая синхронизация не поддерживается:', error);
    }
  }
}

self.addEventListener('sync', (event) => {
  console.log(`🔄 Синхронизация "${event.tag}"`);
  
  if (event.tag === 'sync-products') {
    event.waitUntil(syncProductsData());
  }
  
  if (event.tag === 'sync-cache') {
    event.waitUntil(syncCache());
  }
});

async function syncProductsData() {
  try {
    console.log('🔄 Начинаем синхронизацию данных каталога...');
    
    const cache = await caches.open(CACHE_NAME);
    const response = await fetch('/products.json', {
      headers: {
        'Cache-Control': 'no-cache',
        'If-Modified-Since': new Date().toUTCString()
      }
    });
    
    if (response.ok) {
      await cache.put('/products.json', response.clone());
      const data = await response.json();
      
      console.log(`✅ Синхронизировано ${data.products?.length || 0} товаров`);
      
      sendMessageToClients({
        type: 'DATA_UPDATED',
        count: data.products?.length || 0,
        timestamp: new Date().toISOString()
      });
      
      return true;
    }
  } catch (error) {
    console.error('❌ Ошибка синхронизации:', error);
  }
  
  return false;
}

async function syncCache() {
  try {
    console.log('🔄 Фоновая синхронизация кэша...');
    
    const cache = await caches.open(CACHE_NAME);
    const cachedRequests = await cache.keys();
    let updatedCount = 0;
    
    for (const request of cachedRequests) {
      if (request.url.includes('products.json')) continue;
      
      try {
        const networkResponse = await fetch(request, {
          headers: { 'Cache-Control': 'max-age=0' }
        });
        
        if (networkResponse.ok) {
          await cache.put(request, networkResponse.clone());
          updatedCount++;
        }
      } catch (error) {
        // Пропускаем ошибки
      }
    }
    
    console.log(`✅ Обновлено: ${updatedCount} ресурсов`);
    
    sendMessageToClients({
      type: 'CACHE_UPDATED',
      updatedCount,
      timestamp: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('❌ Ошибка синхронизации кэша:', error);
    return false;
  }
}

// ============================================
// PUSH-УВЕДОМЛЕНИЯ
// ============================================

self.addEventListener('push', (event) => {
  console.log('📨 Получено push-уведомление');
  
  let data;
  try {
    data = event.data?.json() || {};
  } catch (error) {
    data = {
      title: 'Ортоцентр',
      body: event.data?.text() || 'Новые поступления в каталоге!'
    };
  }
  
  const options = {
    body: data.body || 'Новые товары в каталоге Ортоцентра',
    icon: data.icon || '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'catalog-update',
    vibrate: [200, 100, 200],
    actions: [
      { action: 'open-catalog', title: '📂 Открыть каталог' },
      { action: 'dismiss', title: '❌ Закрыть' }
    ],
    data: {
      url: data.url || '/',
      timestamp: new Date().toISOString()
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Ортоцентр', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('🖱️ Клик по уведомлению:', event.action);
  
  event.notification.close();
  
  let url = event.notification.data?.url || '/';
  if (event.action === 'open-catalog') {
    url = '/#all-products';
  }
  
  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true
      });
      
      for (const client of clients) {
        if (client.url === url || client.url.startsWith(self.location.origin)) {
          await client.focus();
          return client.navigate(url);
        }
      }
      
      return self.clients.openWindow(url);
    })()
  );
});

// ============================================
// ОБРАБОТКА СООБЩЕНИЙ ОТ КЛИЕНТОВ
// ============================================

self.addEventListener('message', (event) => {
  const { data, ports } = event;
  
  console.log('📩 Сообщение от клиента:', data?.type || data);
  
  // Поддержка простых строковых команд
  if (data === 'skipWaiting') {
    self.skipWaiting();
  }
  
  if (data === 'clearCache') {
    caches.delete(CACHE_NAME);
  }
  
  // Расширенный формат сообщений
  if (data && typeof data === 'object') {
    switch (data.type) {
      case 'GET_CACHE_INFO':
        if (ports?.[0]) {
          ports[0].postMessage({
            cacheName: CACHE_NAME,
            version: APP_VERSION,
            isOnline: navigator.onLine,
            timestamp: new Date().toISOString()
          });
        }
        break;
        
      case 'CLEAR_CACHE':
        caches.delete(CACHE_NAME)
          .then(() => caches.open(CACHE_NAME))
          .then(cache => cache.addAll(CRITICAL_ASSETS))
          .then(() => {
            if (ports?.[0]) {
              ports[0].postMessage({ 
                success: true,
                message: 'Кэш очищен и пересоздан'
              });
            }
          })
          .catch(error => {
            if (ports?.[0]) {
              ports[0].postMessage({ 
                success: false, 
                error: error.message 
              });
            }
          });
        break;
        
      case 'CHECK_UPDATE':
        checkForUpdates()
          .then(hasUpdate => {
            if (ports?.[0]) {
              ports[0].postMessage({ hasUpdate });
            }
          });
        break;
        
      case 'SYNC_NOW':
        syncProductsData().then(success => {
          if (ports?.[0]) {
            ports[0].postMessage({ success });
          }
        });
        break;
        
      case 'GET_CACHE_STATS':
        getCacheStats().then(stats => {
          if (ports?.[0]) {
            ports[0].postMessage(stats);
          }
        });
        break;
    }
  }
});

async function checkForUpdates() {
  try {
    const response = await fetch('/version.json', { 
      cache: 'no-store',
      headers: { 'X-Cache-Check': 'true' }
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.version !== APP_VERSION;
    }
  } catch (error) {
    // Игнорируем ошибки проверки обновлений
  }
  
  return false;
}

async function getCacheStats() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const requests = await cache.keys();
    
    const stats = {
      total: requests.length,
      html: requests.filter(r => r.url.match(/\.html?$/i)).length,
      css: requests.filter(r => r.url.match(/\.css$/i)).length,
      js: requests.filter(r => r.url.match(/\.js$/i)).length,
      images: requests.filter(r => r.url.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i)).length,
      fonts: requests.filter(r => r.url.match(/\.(woff2|woff|ttf|eot)$/i)).length,
      other: requests.filter(r => !r.url.match(/\.(html?|css|js|png|jpg|jpeg|gif|webp|svg|woff2|woff|ttf|eot)$/i)).length
    };
    
    return {
      success: true,
      stats,
      cacheName: CACHE_NAME,
      version: APP_VERSION
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// ============================================
// УТИЛИТЫ
// ============================================

/**
 * Отправка сообщения всем клиентам
 */
async function sendMessageToClients(message) {
  try {
    const clients = await self.clients.matchAll();
    
    clients.forEach(client => {
      try {
        client.postMessage({
          ...message,
          from: 'service-worker',
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        // Игнорируем ошибки отправки
      }
    });
  } catch (error) {
    console.error('❌ Ошибка отправки сообщений клиентам:', error);
  }
}

// ============================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================

console.log(`🚀 Service Worker ${APP_VERSION} загружен и готов к работе`);
console.log(`📦 Имя кэша: ${CACHE_NAME}`);
console.log(`🔧 Критических ресурсов: ${CRITICAL_ASSETS.length}`);

// Обработка ошибок
self.addEventListener('error', (event) => {
  console.error('🚨 Ошибка в Service Worker:', event.error);
});
