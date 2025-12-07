/**
 * КАТАЛОГ «ОРТОЦЕНТР» - ОСНОВНОЙ СКРИПТ
 * Версия: 4.1 (Оптимизированный рендеринг, Virtual DOM, JSDoc)
 */

// ============================================
// 1. КОНСТАНТЫ И ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
// ============================================

/**
 * Конфигурация приложения
 * @typedef {Object} AppConfig
 * @property {number} PRODUCTS_PER_PAGE
 * @property {number} SEARCH_DEBOUNCE
 * @property {number} SCROLL_THRESHOLD
 * @property {number} ANIMATION_DELAY
 * @property {string} THEME_KEY
 * @property {string} VIEW_KEY
 * @property {string} PRODUCTS_KEY
 * @property {string} UPDATE_KEY
 */

/**
 * Состояние приложения
 * @typedef {Object} AppState
 * @property {Product[]} products
 * @property {Product[]} filteredProducts
 * @property {string} currentCategory
 * @property {string} currentSort
 * @property {'grid' | 'list'} currentView
 * @property {number} currentPage
 * @property {string} searchQuery
 * @property {boolean} isLoading
 * @property {'light' | 'dark'} currentTheme
 * @property {boolean} isMenuOpen
 */

/**
 * Продукт в каталоге
 * @typedef {Object} Product
 * @property {number} id
 * @property {string} name
 * @property {number} price
 * @property {'щетки' | 'пасты' | 'ирригаторы' | 'прочее'} category
 * @property {string} description
 * @property {string[]} [features]
 * @property {boolean} [isNew]
 * @property {string} image
 */

/**
 * DOM элементы
 * @typedef {Object} AppDOM
 * @property {HTMLElement} catalogGrid
 * @property {HTMLElement} loadingState
 * @property {HTMLElement} emptyState
 * @property {HTMLElement} productsCount
 * @property {HTMLElement} currentCategoryText
 * @property {HTMLInputElement} searchInput
 * @property {HTMLElement} searchClear
 * @property {HTMLElement} resetFiltersBtn
 * @property {HTMLElement} resetFiltersCatalogBtn
 * @property {HTMLElement} sortToggle
 * @property {HTMLElement} sortMenu
 * @property {HTMLElement} sortText
 * @property {HTMLElement} viewGrid
 * @property {HTMLElement} viewList
 * @property {HTMLElement} themeToggle
 * @property {HTMLElement} themeReset
 * @property {HTMLElement} backToTop
 * @property {HTMLElement} menuToggle
 * @property {HTMLElement} mainNav
 * @property {HTMLElement} mainHeader
 * @property {HTMLElement} progressBar
 * @property {HTMLElement} skeletonContainer
 * @property {NodeList} categoryLinks
 * @property {NodeList} sortOptions
 * @property {NodeList} viewToggles
 * @property {NodeList} categoryFilterBtns
 * @property {NodeList} footerCategoryBtns
 * @property {NodeList} quickSelectBtns
 * @property {HTMLElement} searchHints
 */

const CONFIG = /** @type {AppConfig} */ ({
    PRODUCTS_PER_PAGE: 12,
    SEARCH_DEBOUNCE: 300,
    SCROLL_THRESHOLD: 100,
    ANIMATION_DELAY: 50,
    THEME_KEY: 'ortocentr-theme',
    VIEW_KEY: 'ortocentr-view',
    PRODUCTS_KEY: 'ortocentr-products',
    UPDATE_KEY: 'ortocentr-last-update'
});

/** @type {AppState} */
const STATE = {
    products: [],
    filteredProducts: [],
    currentCategory: 'all',
    currentSort: 'default',
    currentView: 'grid',
    currentPage: 1,
    searchQuery: '',
    isLoading: false,
    currentTheme: 'light',
    isMenuOpen: false
};

/** @type {AppDOM} */
const DOM = {};

const CATEGORY_MAP = {
    'щетки': { name: 'Зубные щетки', icon: 'fa-toothbrush' },
    'пасты': { name: 'Зубные пасты', icon: 'fa-paste' },
    'ирригаторы': { name: 'Ирригаторы', icon: 'fa-shower' },
    'прочее': { name: 'Прочее', icon: 'fa-boxes' },
    'all': { name: 'Все товары', icon: 'fa-th-large' }
};

/** @type {Map<string, HTMLElement>} */
const productElements = new Map();

/** @type {number} */
let renderFrameId = null;

/** @type {Array<{element: Element, event: string, handler: Function}>} */
const eventHandlers = [];

// ============================================
// 2. ИНИЦИАЛИЗАЦИЯ DOM ЭЛЕМЕНТОВ
// ============================================

function initDOMReferences() {
    try {
        // Основные элементы
        DOM.catalogGrid = document.getElementById('catalogGrid');
        DOM.skeletonContainer = document.getElementById('skeletonContainer');
        DOM.emptyState = document.getElementById('emptyState');
        DOM.productsCount = document.getElementById('productsCount');
        DOM.currentCategoryText = document.getElementById('currentCategoryText');
        DOM.progressBar = document.getElementById('progressBar');
        
        // Элементы поиска
        DOM.searchInput = document.getElementById('globalSearch');
        DOM.searchClear = document.getElementById('searchClear');
        
        // Элементы управления
        DOM.resetFiltersBtn = document.getElementById('resetFilters');
        DOM.resetFiltersCatalogBtn = document.getElementById('resetFiltersBtn');
        DOM.sortToggle = document.getElementById('sortToggle');
        DOM.sortMenu = document.getElementById('sortMenu');
        DOM.sortText = document.getElementById('sortText');
        DOM.viewGrid = document.getElementById('viewGrid');
        DOM.viewList = document.getElementById('viewList');
        DOM.themeToggle = document.getElementById('themeToggle');
        DOM.themeReset = document.getElementById('themeReset');
        DOM.backToTop = document.getElementById('backToTop');
        
        // Навигация
        DOM.menuToggle = document.getElementById('menuToggle');
        DOM.mainNav = document.getElementById('mainNav');
        DOM.mainHeader = document.getElementById('mainHeader');
        
        // Коллекции элементов
        DOM.categoryLinks = document.querySelectorAll('.nav-link');
        DOM.sortOptions = document.querySelectorAll('.sort-option');
        DOM.viewToggles = document.querySelectorAll('.view-toggle');
        DOM.categoryFilterBtns = document.querySelectorAll('.category-filter-btn');
        DOM.footerCategoryBtns = document.querySelectorAll('.footer-category-btn');
        DOM.quickSelectBtns = document.querySelectorAll('.quick-select-btn');
        DOM.searchHints = document.querySelector('.search-hints');
        
        console.log('✅ DOM элементы инициализированы');
    } catch (error) {
        console.error('❌ Ошибка инициализации DOM:', error);
        showError('Ошибка инициализации интерфейса');
    }
}

// ============================================
// 3. УТИЛИТЫ
// ============================================

/**
 * Создает функцию с задержкой выполнения
 * @param {Function} func
 * @param {number} wait
 * @returns {Function}
 */
function debounce(func, wait) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

/**
 * Форматирует цену в русский формат
 * @param {number} price
 * @returns {string}
 */
function formatPrice(price) {
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(price);
}

/**
 * Получает читаемое название категории
 * @param {string} category
 * @returns {string}
 */
function getCategoryName(category) {
    return CATEGORY_MAP[category]?.name || category;
}

/**
 * Возвращает правильную форму слова "товар"
 * @param {number} number
 * @returns {string}
 */
function getRussianPlural(number) {
    const forms = ['товар', 'товара', 'товаров'];
    const cases = [2, 0, 1, 1, 1, 2];
    return forms[
        (number % 100 > 4 && number % 100 < 20) 
            ? 2 
            : cases[(number % 10 < 5) ? number % 10 : 5]
    ];
}

/**
 * Форматирует список особенностей в HTML
 * @param {string[]} features
 * @returns {string}
 */
function formatFeatures(features) {
    return features?.length 
        ? features.map(f => `<li><i class="fas fa-check"></i> ${f}</li>`).join('')
        : '';
}

// Полифиллы для requestIdleCallback
window.requestIdleCallback = window.requestIdleCallback || 
    function(cb) { 
        return setTimeout(() => { 
            cb({ didTimeout: false, timeRemaining: () => 1 }); 
        }, 1); 
    };

window.cancelIdleCallback = window.cancelIdleCallback ||
    function(id) { clearTimeout(id); };

// ============================================
// 4. УПРАВЛЕНИЕ ТЕМОЙ
// ============================================

function initTheme() {
    try {
        const savedTheme = localStorage.getItem(CONFIG.THEME_KEY);
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
        setTheme(initialTheme);
        
        if (DOM.themeReset) {
            DOM.themeReset.style.display = savedTheme ? 'flex' : 'none';
        }
        
        window.matchMedia('(prefers-color-scheme: dark)').addListener((e) => {
            if (!localStorage.getItem(CONFIG.THEME_KEY)) {
                setTheme(e.matches ? 'dark' : 'light');
            }
        });
        
        console.log('✅ Тема инициализирована:', initialTheme);
    } catch (error) {
        console.error('❌ Ошибка инициализации темы:', error);
    }
}

function setTheme(theme) {
    try {
        document.documentElement.setAttribute('data-theme', theme);
        document.documentElement.style.colorScheme = theme;
        
        STATE.currentTheme = theme;
        localStorage.setItem(CONFIG.THEME_KEY, theme);
        
        if (DOM.themeToggle) {
            DOM.themeToggle.setAttribute('aria-label', 
                theme === 'light' ? 'Включить темную тему' : 'Включить светлую тему'
            );
            
            const icon = DOM.themeToggle.querySelector('.theme-icon i');
            if (icon) {
                icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
            }
        }
        
        document.body.classList.add('theme-transition');
        setTimeout(() => document.body.classList.remove('theme-transition'), 500);
        
        console.log('🎨 Тема установлена:', theme);
    } catch (error) {
        console.error('❌ Ошибка установки темы:', error);
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    localStorage.setItem(CONFIG.THEME_KEY, newTheme);
    
    if (DOM.themeReset) {
        DOM.themeReset.style.display = 'flex';
    }
    
    setTheme(newTheme);
}

function resetToSystemTheme() {
    localStorage.removeItem(CONFIG.THEME_KEY);
    
    if (DOM.themeReset) {
        DOM.themeReset.style.display = 'none';
    }
    
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(systemPrefersDark ? 'dark' : 'light');
    
    showNotification('Используется системная тема');
}

// ============================================
// 5. ХЭДЕР И МОБИЛЬНОЕ МЕНЮ
// ============================================

function initScrollHeader() {
    if (!DOM.mainHeader) return;
    
    let lastScrollTop = 0;
    let ticking = false;
    
    function updateHeader(scrollTop) {
        const isScrolled = scrollTop > CONFIG.SCROLL_THRESHOLD;
        
        if (DOM.backToTop) {
            DOM.backToTop.classList.toggle('scrolled', isScrolled);
            DOM.backToTop.hidden = !isScrolled;
        }
        
        DOM.mainHeader.classList.toggle('scrolled', isScrolled);
        
        if (scrollTop > lastScrollTop && scrollTop > 200 && !STATE.isMenuOpen) {
            DOM.mainHeader.style.transform = 'translateY(-100%)';
        } else {
            DOM.mainHeader.style.transform = 'translateY(0)';
        }
        
        lastScrollTop = scrollTop;
    }
    
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                updateHeader(window.pageYOffset || document.documentElement.scrollTop);
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });
    
    setTimeout(() => {
        if (window.pageYOffset > CONFIG.SCROLL_THRESHOLD) {
            DOM.mainHeader.classList.add('scrolled');
            if (DOM.backToTop) {
                DOM.backToTop.hidden = false;
                DOM.backToTop.classList.add('scrolled');
            }
        }
    }, 100);
    
    console.log('✅ Скролл хэдера инициализирован');
}

function initMobileMenu() {
    if (!DOM.menuToggle || !DOM.mainNav) {
        console.warn('⚠️ Элементы мобильного меню не найдены');
        return;
    }
    
    function toggleMenu() {
        STATE.isMenuOpen = !STATE.isMenuOpen;
        const expanded = STATE.isMenuOpen.toString();
        
        DOM.menuToggle.setAttribute('aria-expanded', expanded);
        DOM.menuToggle.classList.toggle('active');
        DOM.mainNav.classList.toggle('active');
        document.body.classList.toggle('menu-open');
        
        console.log('📱 Меню:', STATE.isMenuOpen ? 'открыто' : 'закрыто');
    }
    
    addTrackedEventListener(DOM.menuToggle, 'click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleMenu();
    });
    
    addTrackedEventListener(DOM.mainNav, 'click', (e) => {
        if (e.target.closest('.nav-link')) {
            if (window.innerWidth <= 768 && STATE.isMenuOpen) {
                toggleMenu();
            }
        }
    });
    
    addTrackedEventListener(document, 'click', (e) => {
        if (STATE.isMenuOpen && 
            !DOM.menuToggle.contains(e.target) && 
            !DOM.mainNav.contains(e.target)) {
            toggleMenu();
        }
    });
    
    let resizeTimeout;
    addTrackedEventListener(window, 'resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            if (window.innerWidth > 768 && STATE.isMenuOpen) {
                toggleMenu();
            }
        }, 250);
    });
    
    addTrackedEventListener(document, 'keydown', (e) => {
        if (e.key === 'Escape' && STATE.isMenuOpen) {
            toggleMenu();
        }
    });
    
    console.log('✅ Мобильное меню инициализировано');
}

function closeMobileMenu() {
    if (STATE.isMenuOpen && DOM.menuToggle && DOM.mainNav) {
        STATE.isMenuOpen = false;
        DOM.menuToggle.setAttribute('aria-expanded', 'false');
        DOM.menuToggle.classList.remove('active');
        DOM.mainNav.classList.remove('active');
        document.body.classList.remove('menu-open');
    }
}

// ============================================
// 6. СКЕЛЕТОНЫ И ПРОГРЕСС-БАР
// ============================================

function showSkeleton() {
    if (DOM.catalogGrid) {
        DOM.catalogGrid.style.display = 'none';
    }
    if (DOM.emptyState) {
        DOM.emptyState.style.display = 'none';
        DOM.emptyState.hidden = true;
    }
    if (DOM.skeletonContainer) {
        DOM.skeletonContainer.hidden = false;
        DOM.skeletonContainer.style.display = 'block';
    }
}

function hideSkeleton() {
    if (DOM.skeletonContainer) {
        DOM.skeletonContainer.hidden = true;
        DOM.skeletonContainer.style.display = 'none';
    }
    if (DOM.catalogGrid) {
        DOM.catalogGrid.style.display = 'grid';
        DOM.catalogGrid.hidden = false;
    }
}

function initProgressBar() {
    if (!DOM.progressBar) return;
    
    function updateProgressBar() {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        
        DOM.progressBar.style.width = scrolled + '%';
        
        if (scrolled > 0) {
            DOM.progressBar.classList.add('active');
        } else {
            DOM.progressBar.classList.remove('active');
        }
    }
    
    addTrackedEventListener(window, 'scroll', () => {
        requestAnimationFrame(updateProgressBar);
    }, { passive: true });
    
    console.log('✅ Прогресс-бар инициализирован');
}

// ============================================
// 7. РАБОТА С ДАННЫМИ
// ============================================

/**
 * Загружает продукты с оптимизациями
 * @returns {Promise<void>}
 */
async function loadProducts() {
    try {
        STATE.isLoading = true;
        showSkeleton();
        
        console.log('📦 Загрузка товаров...');
        
        const response = await fetch('products.json', {
            cache: 'no-cache',
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        STATE.products = data?.products ?? [];
        STATE.filteredProducts = [...STATE.products];
        
        console.log(`✅ Загружено ${STATE.products.length} товаров`);
        
        try {
            localStorage.setItem(CONFIG.PRODUCTS_KEY, JSON.stringify(STATE.products));
            localStorage.setItem(CONFIG.UPDATE_KEY, new Date().toISOString());
        } catch (error) {
            console.warn('⚠️ Не удалось сохранить в localStorage:', error.message);
        }
        
        applyFilters();
        setupEventListeners();
        
    } catch (error) {
        console.error('❌ Ошибка загрузки товаров:', error);
        
        const cachedProducts = localStorage.getItem(CONFIG.PRODUCTS_KEY);
        const lastUpdate = localStorage.getItem(CONFIG.UPDATE_KEY);
        
        if (cachedProducts) {
            console.log('📦 Используем кэшированные товары из localStorage');
            STATE.products = JSON.parse(cachedProducts);
            STATE.filteredProducts = [...STATE.products];
            applyFilters();
            setupEventListeners();
            
            const updateDate = lastUpdate 
                ? new Date(lastUpdate).toLocaleDateString() 
                : 'неизвестно';
            
            showNotification(`Используем кэшированные данные (обновлено: ${updateDate})`, 'info');
        } else {
            showError('Не удалось загрузить каталог. Пожалуйста, проверьте соединение и обновите страницу.');
        }
    } finally {
        STATE.isLoading = false;
        hideSkeleton();
    }
}

/**
 * Сортирует продукты по выбранному критерию
 * @param {Product[]} products
 * @returns {Product[]}
 */
function sortProducts(products) {
    const sorted = [...products];
    
    switch (STATE.currentSort) {
        case 'price-asc': return sorted.sort((a, b) => a.price - b.price);
        case 'price-desc': return sorted.sort((a, b) => b.price - a.price);
        case 'new': return sorted.sort((a, b) => {
            if (a.isNew && !b.isNew) return -1;
            if (!a.isNew && b.isNew) return 1;
            return 0;
        });
        case 'name': return sorted.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
        default: return sorted.sort((a, b) => b.id - a.id);
    }
}

// ============================================
// 8. ОПТИМИЗИРОВАННЫЙ РЕНДЕРИНГ
// ============================================

/**
 * Оптимизированный рендеринг продуктов
 * @param {Product[]} productsToRender
 */
function renderProductsOptimized(productsToRender) {
    if (!DOM.catalogGrid) return;
    
    if (renderFrameId) {
        cancelAnimationFrame(renderFrameId);
    }
    
    renderFrameId = requestAnimationFrame(() => {
        performOptimizedRender(productsToRender);
        renderFrameId = null;
    });
}

/**
 * Выполняет оптимизированный рендеринг с дифференциальным обновлением
 * @param {Product[]} productsToRender
 */
function performOptimizedRender(productsToRender) {
    const startTime = performance.now();
    const fragment = document.createDocumentFragment();
    const newElements = new Map();
    
    productElements.forEach((element, id) => {
        if (!productsToRender.some(p => p.id.toString() === id)) {
            element.remove();
            productElements.delete(id);
        }
    });
    
    productsToRender.forEach((product, index) => {
        const productId = product.id.toString();
        
        if (productElements.has(productId)) {
            const existingElement = productElements.get(productId);
            updateProductElement(existingElement, product, index);
            newElements.set(productId, existingElement);
        } else {
            const newElement = STATE.currentView === 'list' 
                ? createListProductCard(product)
                : createProductCard(product);
            
            setupProductCardEvents(newElement, product);
            applyElementAnimation(newElement, index);
            
            fragment.appendChild(newElement);
            newElements.set(productId, newElement);
        }
    });
    
    if (fragment.children.length > 0) {
        DOM.catalogGrid.appendChild(fragment);
    }
    
    productElements.clear();
    newElements.forEach((element, id) => productElements.set(id, element));
    
    const renderTime = performance.now() - startTime;
    console.log(`⚡ Рендеринг ${productsToRender.length} товаров за ${renderTime.toFixed(1)}ms`);
}

/**
 * Обновляет существующий элемент продукта
 * @param {HTMLElement} element
 * @param {Product} product
 * @param {number} index
 */
function updateProductElement(element, product, index) {
    const title = element.querySelector('.product-title');
    const price = element.querySelector('.product-price');
    const category = element.querySelector('.product-category');
    
    if (title && title.textContent !== product.name) {
        title.textContent = product.name;
    }
    
    if (price && price.textContent !== formatPrice(product.price)) {
        price.textContent = formatPrice(product.price);
    }
    
    if (category && category.textContent !== getCategoryName(product.category)) {
        category.textContent = getCategoryName(product.category);
    }
    
    const badges = element.querySelector('.product-badges');
    if (badges) {
        if (product.isNew) {
            if (!badges.querySelector('.badge-new')) {
                badges.innerHTML = '<span class="product-badge badge-new">Новинка</span>';
            }
        } else {
            badges.innerHTML = '';
        }
    }
}

/**
 * Настраивает события для карточки товара
 * @param {HTMLElement} card
 * @param {Product} product
 */
function setupProductCardEvents(card, product) {
    addTrackedEventListener(card, 'mouseenter', () => {
        if (window.matchMedia('(hover: hover)').matches) {
            card.style.transform = 'translateY(-5px)';
        }
    });
    
    addTrackedEventListener(card, 'mouseleave', () => {
        card.style.transform = '';
    });
    
    addTrackedEventListener(card, 'touchstart', () => {
        card.style.opacity = '0.9';
    }, { passive: true });
    
    addTrackedEventListener(card, 'touchend', () => {
        card.style.opacity = '';
    }, { passive: true });
}

/**
 * Применяет анимацию появления элемента
 * @param {HTMLElement} element
 * @param {number} index
 */
function applyElementAnimation(element, index) {
    element.style.opacity = '0';
    element.style.transform = 'translateY(20px)';
    
    requestAnimationFrame(() => {
        element.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        setTimeout(() => {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, index * 20);
    });
}

/**
 * Создает карточку товара для вида сетки
 * @param {Product} product
 * @returns {HTMLElement}
 */
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.dataset.id = product.id;
    card.dataset.category = product.category;
    
    const newBadge = product.isNew ? `<span class="product-badge badge-new">Новинка</span>` : '';
    const features = formatFeatures(product.features?.slice(0, 3));
    const featuresList = features ? `<ul class="product-features">${features}</ul>` : '';
    
    card.innerHTML = `
        <div class="product-card-inner">
            <div class="product-badges">${newBadge}</div>
            <div class="product-image-container">
                <img src="${product.image}" alt="${product.name}" class="product-image" loading="lazy">
            </div>
            <div class="product-info">
                <div class="product-header">
                    <h3 class="product-title">${product.name}</h3>
                    <span class="product-category">${getCategoryName(product.category)}</span>
                </div>
                <p class="product-description">${product.description}</p>
                ${featuresList}
                <div class="product-footer">
                    <div class="product-price">${formatPrice(product.price)}</div>
                </div>
            </div>
        </div>
    `;
    
    const imageContainer = card.querySelector('.product-image-container');
    const img = card.querySelector('.product-image');
    
    if (imageContainer) imageContainer.classList.add('image-loading');
    
    if (img) {
        addTrackedEventListener(img, 'load', () => {
            if (imageContainer) {
                imageContainer.classList.remove('image-loading');
                imageContainer.classList.add('image-loaded');
            }
        }, { once: true });
        
        addTrackedEventListener(img, 'error', () => {
            if (imageContainer) {
                imageContainer.classList.remove('image-loading');
                imageContainer.classList.add('image-error');
                if (img.src !== 'assets/images/placeholder.jpg') {
                    img.src = 'assets/images/placeholder.jpg';
                }
            }
        }, { once: true });
    }
    
    return card;
}

/**
 * Создает карточку товара для вида списка
 * @param {Product} product
 * @returns {HTMLElement}
 */
function createListProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.dataset.id = product.id;
    card.dataset.category = product.category;
    
    const newBadge = product.isNew 
        ? `<div class="product-badges"><span class="product-badge badge-new">Новинка</span></div>` 
        : '';
    
    card.innerHTML = `
        <div class="product-card-inner">
            ${newBadge}
            <div class="product-image-container" aria-hidden="true">
                <img src="${product.image}" alt="${product.name}" class="product-image" loading="lazy">
            </div>
            <div class="product-info">
                <div class="product-header">
                    <h3 class="product-title">${product.name}</h3>
                    <span class="product-category">${getCategoryName(product.category)}</span>
                </div>
                <div class="product-description" aria-hidden="true">${product.description}</div>
                <div class="product-footer">
                    <div class="product-price">${formatPrice(product.price)}</div>
                </div>
            </div>
        </div>
    `;
    
    const imageContainer = card.querySelector('.product-image-container');
    const img = card.querySelector('.product-image');
    
    if (imageContainer && img) {
        imageContainer.classList.add('image-loading');
        
        addTrackedEventListener(img, 'load', () => {
            imageContainer.classList.remove('image-loading');
            imageContainer.classList.add('image-loaded');
        }, { once: true });
        
        addTrackedEventListener(img, 'error', () => {
            imageContainer.classList.remove('image-loading');
            imageContainer.classList.add('image-error');
            img.src = 'assets/images/placeholder.jpg';
        }, { once: true });
    }
    
    return card;
}

function updateProductsCount() {
    if (!DOM.productsCount) return;
    
    const count = STATE.filteredProducts.length;
    const text = `(${count} ${getRussianPlural(count)})`;
    DOM.productsCount.textContent = text;
}

function updateCategoryText() {
    if (DOM.currentCategoryText) {
        DOM.currentCategoryText.textContent = getCategoryName(STATE.currentCategory);
    }
}

// ============================================
// 9. ФИЛЬТРАЦИЯ И СОРТИРОВКА
// ============================================

/**
 * Выполняет фильтрацию продуктов
 * @returns {Product[]}
 */
function performFiltering() {
    let result = [...STATE.products];
    
    if (STATE.currentCategory !== 'all') {
        result = result.filter(product => product.category === STATE.currentCategory);
    }
    
    if (STATE.searchQuery.trim()) {
        const query = STATE.searchQuery.toLowerCase().trim();
        result = result.filter(product => 
            product.name.toLowerCase().includes(query) ||
            product.description.toLowerCase().includes(query) ||
            (product.features?.some(f => f.toLowerCase().includes(query)) ?? false)
        );
    }
    
    return sortProducts(result);
}

/**
 * Обновляет UI после фильтрации
 * @param {Product[]} filteredProducts
 */
function updateUI(filteredProducts) {
    STATE.filteredProducts = filteredProducts;
    
    if (STATE.filteredProducts.length === 0) {
        showEmptyState();
    } else {
        hideEmptyState();
        renderProductsOptimized(STATE.filteredProducts);
    }
    
    updateProductsCount();
    updateCategoryText();
    updateActiveCategory();
    updateActiveSort();
    updateFooterFilters();
    updateQuickSelectButtons();
}

/**
 * Применяет фильтры и оптимизирует рендеринг
 */
function applyFilters() {
    if (STATE.isLoading) return;
    
    if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
            const filtered = performFiltering();
            requestAnimationFrame(() => {
                updateUI(filtered);
            });
        }, { timeout: 100 });
    } else {
        const filtered = performFiltering();
        requestAnimationFrame(() => {
            updateUI(filtered);
        });
    }
}

function scrollToCatalog() {
    requestAnimationFrame(() => {
        const catalogSection = document.querySelector('.catalog-section');
        if (catalogSection) {
            const headerHeight = DOM.mainHeader?.offsetHeight || 70;
            const catalogTop = catalogSection.getBoundingClientRect().top + window.pageYOffset;
            
            window.scrollTo({
                top: catalogTop - headerHeight - 20,
                behavior: 'smooth'
            });
        }
    });
}

function filterProductsByCategory(category) {
    if (category === STATE.currentCategory && !STATE.searchQuery) return;
    
    STATE.currentCategory = category;
    STATE.searchQuery = '';
    
    if (DOM.searchInput) {
        DOM.searchInput.value = '';
        if (DOM.searchClear) {
            DOM.searchClear.style.display = 'none';
        }
    }
    
    applyFilters();
    scrollToCatalog();
    closeMobileMenu();
    
    console.log(`🎯 Фильтр: ${getCategoryName(category)}`);
}

function resetFilters() {
    STATE.currentCategory = 'all';
    STATE.searchQuery = '';
    STATE.currentSort = 'default';
    
    if (DOM.searchInput) DOM.searchInput.value = '';
    if (DOM.searchClear) DOM.searchClear.style.display = 'none';
    if (DOM.sortText) DOM.sortText.textContent = 'По популярности';
    
    applyFilters();
    scrollToCatalog();
    showNotification('Фильтры сброшены');
    
    console.log('🔄 Фильтры сброшены');
}

function updateActiveCategory() {
    const isActive = (element) => element.dataset.category === STATE.currentCategory;
    
    DOM.categoryLinks.forEach(link => {
        const active = isActive(link);
        link.classList.toggle('active', active);
        link.setAttribute('aria-current', active ? 'page' : 'false');
    });
    
    DOM.categoryFilterBtns.forEach(btn => btn.classList.toggle('active', isActive(btn)));
    DOM.footerCategoryBtns.forEach(btn => btn.classList.toggle('active', isActive(btn)));
}

function updateQuickSelectButtons() {
    DOM.quickSelectBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === STATE.currentCategory);
    });
}

function updateFooterFilters() {
    DOM.footerCategoryBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === STATE.currentCategory);
    });
}

// ============================================
// 10. ДРОПДАУН КАТЕГОРИЙ
// ============================================

function initCategoryDropdown() {
    const categoryToggle = document.getElementById('categoryToggle');
    const categoryMenu = document.getElementById('categoryMenu');
    const categoryText = document.getElementById('categoryText');
    const categoryOptions = document.querySelectorAll('.category-option');
    
    if (!categoryToggle || !categoryMenu || !categoryText) {
        console.warn('⚠️ Элементы дропдауна категорий не найдены');
        return;
    }
    
    addTrackedEventListener(categoryToggle, 'click', (e) => {
        e.stopPropagation();
        const isExpanded = categoryToggle.getAttribute('aria-expanded') === 'true';
        categoryToggle.setAttribute('aria-expanded', !isExpanded);
        categoryMenu.hidden = isExpanded;
    });
    
    addTrackedEventListener(document, 'click', (e) => {
        if (!categoryToggle.contains(e.target) && !categoryMenu.contains(e.target)) {
            categoryToggle.setAttribute('aria-expanded', 'false');
            categoryMenu.hidden = true;
        }
    });
    
    categoryOptions.forEach(option => {
        addTrackedEventListener(option, 'click', () => {
            const category = option.dataset.category;
            filterProductsByCategory(category);
            
            categoryText.textContent = option.textContent;
            
            categoryOptions.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
            
            categoryToggle.setAttribute('aria-expanded', 'false');
            categoryMenu.hidden = true;
            
            console.log(`🎯 Выбрана категория: ${option.textContent}`);
        });
    });
    
    console.log('✅ Дропдаун категорий инициализирован');
}

function updateCategoryDropdown() {
    const categoryText = document.getElementById('categoryText');
    const categoryOptions = document.querySelectorAll('.category-option');
    
    if (!categoryText || !categoryOptions.length) return;
    
    const activeOption = Array.from(categoryOptions).find(
        option => option.dataset.category === STATE.currentCategory
    );
    
    if (activeOption) {
        categoryText.textContent = activeOption.textContent;
        
        categoryOptions.forEach(option => {
            option.classList.toggle('active', option.dataset.category === STATE.currentCategory);
        });
    }
}

// ============================================
// 11. СОРТИРОВКА И ВИДЫ
// ============================================

function initSorting() {
    if (!DOM.sortOptions.length || !DOM.sortToggle || !DOM.sortMenu || !DOM.sortText) return;
    
    addTrackedEventListener(DOM.sortToggle, 'click', (e) => {
        e.stopPropagation();
        const isExpanded = DOM.sortMenu.classList.toggle('show');
        DOM.sortToggle.setAttribute('aria-expanded', isExpanded);
    });
    
    addTrackedEventListener(document, 'click', (e) => {
        if (!DOM.sortToggle.contains(e.target) && !DOM.sortMenu.contains(e.target)) {
            DOM.sortMenu.classList.remove('show');
            DOM.sortToggle.setAttribute('aria-expanded', 'false');
        }
    });
    
    DOM.sortOptions.forEach(option => {
        addTrackedEventListener(option, 'click', () => {
            const sortType = option.dataset.sort;
            if (sortType === STATE.currentSort) return;
            
            STATE.currentSort = sortType;
            applyFilters();
            
            DOM.sortText.textContent = option.textContent;
            DOM.sortMenu.classList.remove('show');
            DOM.sortToggle.setAttribute('aria-expanded', 'false');
            
            console.log(`📊 Сортировка: ${option.textContent}`);
        });
    });
    
    console.log('✅ Сортировка инициализирована');
}

function updateActiveSort() {
    DOM.sortOptions.forEach(option => {
        option.classList.toggle('active', option.dataset.sort === STATE.currentSort);
    });
}

function initViewToggle() {
    if (!DOM.viewToggles.length) return;
    
    DOM.viewToggles.forEach(toggle => {
        addTrackedEventListener(toggle, 'click', () => {
            const viewType = toggle.id === 'viewGrid' ? 'grid' : 'list';
            if (viewType === STATE.currentView) return;
            
            STATE.currentView = viewType;
            applyViewMode();
            
            DOM.viewToggles.forEach(t => {
                const isActive = t === toggle;
                t.classList.toggle('active', isActive);
                t.setAttribute('aria-pressed', isActive);
            });
            
            localStorage.setItem(CONFIG.VIEW_KEY, viewType);
            
            renderProductsOptimized(STATE.filteredProducts);
            
            console.log(`👁️ Вид: ${viewType}`);
        });
    });
    
    const savedView = localStorage.getItem(CONFIG.VIEW_KEY);
    if (savedView === 'grid' || savedView === 'list') {
        STATE.currentView = savedView;
        applyViewMode();
        
        DOM.viewToggles.forEach(t => {
            const isActive = (savedView === 'grid' && t.id === 'viewGrid') || 
                            (savedView === 'list' && t.id === 'viewList');
            t.classList.toggle('active', isActive);
            t.setAttribute('aria-pressed', isActive);
        });
    }
    
    console.log('✅ Переключение видов инициализировано');
}

function applyViewMode() {
    if (!DOM.catalogGrid) return;
    
    DOM.catalogGrid.classList.toggle('list-view', STATE.currentView === 'list');
    DOM.catalogGrid.classList.toggle('grid-view', STATE.currentView === 'grid');
}

// ============================================
// 12. ПОИСК
// ============================================

function initSearch() {
    if (!DOM.searchInput) return;
    
    const debouncedSearch = debounce(() => {
        STATE.searchQuery = DOM.searchInput.value;
        
        if (DOM.searchClear) {
            DOM.searchClear.style.display = STATE.searchQuery ? 'flex' : 'none';
        }
        
        applyFilters();
        
        console.log(`🔍 Поиск: "${STATE.searchQuery}"`);
    }, CONFIG.SEARCH_DEBOUNCE);
    
    addTrackedEventListener(DOM.searchInput, 'input', debouncedSearch);
    
    if (DOM.searchClear) {
        addTrackedEventListener(DOM.searchClear, 'click', () => {
            DOM.searchInput.value = '';
            STATE.searchQuery = '';
            DOM.searchClear.style.display = 'none';
            applyFilters();
            DOM.searchInput.focus();
            console.log('❌ Поиск очищен');
        });
    }
    
    addTrackedEventListener(DOM.searchInput, 'keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            debouncedSearch();
        }
    });
    
    console.log('✅ Поиск инициализирован');
}

// ============================================
// 13. ОПТИМИЗИРОВАННОЕ УПРАВЛЕНИЕ СОБЫТИЯМИ
// ============================================

/**
 * Добавляет обработчик события с отслеживанием
 * @param {Element} element
 * @param {string} event
 * @param {Function} handler
 * @param {AddEventListenerOptions} [options]
 */
function addTrackedEventListener(element, event, handler, options) {
    element.addEventListener(event, handler, options);
    eventHandlers.push({ element, event, handler });
}

/**
 * Очищает все отслеживаемые обработчики событий
 */
function cleanupEventListeners() {
    eventHandlers.forEach(({ element, event, handler }) => {
        element.removeEventListener(event, handler);
    });
    eventHandlers.length = 0;
    console.log('🧹 Все обработчики событий очищены');
}

/**
 * Настраивает обработчики событий с отслеживанием
 */
function setupEventListeners() {
    cleanupEventListeners();
    
    try {
        if (DOM.resetFiltersBtn) {
            addTrackedEventListener(DOM.resetFiltersBtn, 'click', resetFilters);
        }
        
        if (DOM.resetFiltersCatalogBtn) {
            addTrackedEventListener(DOM.resetFiltersCatalogBtn, 'click', resetFilters);
        }
        
        if (DOM.themeToggle) {
            addTrackedEventListener(DOM.themeToggle, 'click', toggleTheme);
        }
        
        if (DOM.themeReset) {
            addTrackedEventListener(DOM.themeReset, 'click', resetToSystemTheme);
        }
        
        if (DOM.backToTop) {
            addTrackedEventListener(DOM.backToTop, 'click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }
        
        const categoryHandlers = (btn) => {
            addTrackedEventListener(btn, 'click', () => {
                filterProductsByCategory(btn.dataset.category);
                scrollToCatalog();
            });
        };
        
        DOM.categoryFilterBtns.forEach(categoryHandlers);
        DOM.footerCategoryBtns.forEach(categoryHandlers);
        DOM.quickSelectBtns.forEach(categoryHandlers);
        
        DOM.categoryLinks.forEach(link => {
            addTrackedEventListener(link, 'click', (e) => {
                e.preventDefault();
                filterProductsByCategory(link.dataset.category);
                scrollToCatalog();
            });
        });
        
        initSorting();
        initViewToggle();
        initSearch();
        initMobileMenu();
        initProgressBar();
        initScrollHeader();
        initCategoryDropdown();
        
        const yearElement = document.getElementById('currentYear');
        if (yearElement) {
            yearElement.textContent = new Date().getFullYear();
        }
        
        const footerScrollTop = document.getElementById('footerScrollTop');
        if (footerScrollTop) {
            addTrackedEventListener(footerScrollTop, 'click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }
        
        document.querySelectorAll('a[href^="http"]').forEach(link => {
            if (!link.href.includes(window.location.hostname)) {
                link.setAttribute('target', '_blank');
                link.setAttribute('rel', 'noopener noreferrer');
            }
        });
        
        console.log('✅ Все обработчики событий настроены с отслеживанием');
        
    } catch (error) {
        console.error('❌ Ошибка настройки обработчиков событий:', error);
    }
}

// ============================================
// 14. УВЕДОМЛЕНИЯ И СОСТОЯНИЯ
// ============================================

function showNotification(message, type = 'info') {
    document.querySelectorAll('.notification').forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.setAttribute('role', 'alert');
    notification.setAttribute('aria-live', 'polite');
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
    
    console.log(`📢 Уведомление: ${message}`);
}

function showEmptyState() {
    if (DOM.emptyState) {
        DOM.emptyState.style.display = 'flex';
        DOM.emptyState.hidden = false;
    }
    if (DOM.catalogGrid) {
        DOM.catalogGrid.style.display = 'none';
        DOM.catalogGrid.hidden = true;
    }
}

function hideEmptyState() {
    if (DOM.emptyState) {
        DOM.emptyState.style.display = 'none';
        DOM.emptyState.hidden = true;
    }
    if (DOM.catalogGrid) {
        DOM.catalogGrid.style.display = 'grid';
        DOM.catalogGrid.hidden = false;
    }
}

function showError(message) {
    if (DOM.catalogGrid) {
        DOM.catalogGrid.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Ошибка загрузки</h3>
                <p>${message}</p>
                <button class="btn btn-accent" onclick="window.location.reload()">
                    <i class="fas fa-redo"></i> Обновить страницу
                </button>
            </div>
        `;
    }
    
    console.error('❌ Ошибка:', message);
}

// ============================================
// 15. PWA И SERVICE WORKER
// ============================================

function initPWA() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/service-worker.js')
                .then(registration => {
                    console.log('✅ Service Worker зарегистрирован:', registration.scope);
                    
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        console.log('🔄 Найдено обновление Service Worker');
                        
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                showNotification('Доступно обновление! Обновите страницу.', 'info');
                            }
                        });
                    });
                })
                .catch(error => {
                    console.log('⚠️ Service Worker не зарегистрирован:', error);
                });
        });
    }
    
    if (window.matchMedia('(display-mode: standalone)').matches) {
        document.body.classList.add('pwa-installed');
        console.log('📱 Запущено как PWA');
    }
    
    addTrackedEventListener(window, 'online', () => {
        showNotification('Соединение восстановлено', 'success');
        console.log('🌐 Онлайн');
    });
    
    addTrackedEventListener(window, 'offline', () => {
        showNotification('Вы в офлайн-режиме', 'error');
        console.log('📴 Офлайн');
    });
    
    console.log('✅ PWA инициализирован');
}

// ============================================
// 16. ОСНОВНАЯ ИНИЦИАЛИЗАЦИЯ
// ============================================

/**
 * Инициализирует приложение с оптимизациями
 * @returns {Promise<void>}
 */
async function init() {
    console.log('🚀 Инициализация каталога «Ортоцентр» версии 4.1...');
    
    try {
        initDOMReferences();
        showSkeleton();
        initTheme();
        
        const loadPromise = loadProducts();
        
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => {
                initScrollHeader();
                initProgressBar();
                initMobileMenu();
            }, { timeout: 1000 });
        } else {
            setTimeout(() => {
                initScrollHeader();
                initProgressBar();
                initMobileMenu();
            }, 100);
        }
        
        await loadPromise;
        
        setTimeout(() => {
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('/service-worker.js')
                    .catch(error => {
                        console.warn('⚠️ Service Worker не зарегистрирован:', error);
                    });
            }
        }, 2000);
        
        console.log('✅ Каталог готов к работе!');
        
    } catch (error) {
        console.error('❌ Критическая ошибка инициализации:', error);
        hideSkeleton();
        showError('Критическая ошибка при загрузке каталога');
    }
}

// ============================================
// 17. ЗАПУСК ПРИЛОЖЕНИЯ И ГЛОБАЛЬНЫЙ ЭКСПОРТ
// ============================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

window.addEventListener('error', (event) => {
    console.error('🚨 Глобальная ошибка:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('🚨 Необработанный Promise:', event.reason);
});

window.CatalogApp = {
    STATE,
    toggleTheme,
    resetFilters,
    filterProductsByCategory,
    setTheme,
    getVersion: () => '4.1'
};

console.log('📦 CatalogApp v4.1 загружен');
