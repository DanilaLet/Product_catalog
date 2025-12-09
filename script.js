/**
 * КАТАЛОГ «ОРТОЦЕНТР» - ОСНОВНОЙ СКРИПТ
 * Версия: 4.1 (Упрощенная, надежная)
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
 * @property {HTMLElement} mobileNav
 * @property {HTMLElement} mobileNavClose
 * @property {HTMLElement} mobileNavOverlay
 * @property {HTMLElement} progressBar
 * @property {HTMLElement} skeletonContainer
 * @property {NodeList} categoryLinks
 * @property {NodeList} sortOptions
 * @property {NodeList} viewToggles
 * @property {NodeList} categoryFilterBtns
 * @property {NodeList} footerCategoryBtns
 * @property {NodeList} quickSelectBtns
 * @property {NodeList} mobileNavLinks
 * @property {HTMLElement} searchHints
 * @property {HTMLElement} mainHeader
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

// ============================================
// 2. ИНИЦИАЛИЗАЦИЯ DOM ЭЛЕМЕНТОВ
// ============================================

function initDOMReferences() {
    try {
        // Основные элементы (проверяем критически важные)
        DOM.catalogGrid = document.getElementById('catalogGrid');
        DOM.emptyState = document.getElementById('emptyState');
        DOM.mainHeader = document.querySelector('header');
        
        console.log('DOM.catalogGrid:', DOM.catalogGrid);
        console.log('DOM.emptyState:', DOM.emptyState);
        console.log('DOM.mainHeader:', DOM.mainHeader);
        
        if (!DOM.catalogGrid) {
            console.error('❌ ОШИБКА: Не найден #catalogGrid');
        }
        if (!DOM.emptyState) {
            console.error('❌ ОШИБКА: Не найден #emptyState');
        }
        if (!DOM.mainHeader) {
            console.warn('⚠️ Не найден header');
        }
        
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
        
        // Мобильное меню
        DOM.menuToggle = document.getElementById('menuToggle');
        DOM.mobileNav = document.getElementById('mobileNav');
        DOM.mobileNavClose = document.getElementById('mobileNavClose');
        DOM.mobileNavOverlay = document.getElementById('mobileNavOverlay');
        
        // Коллекции элементов
        DOM.categoryLinks = document.querySelectorAll('.nav-link');
        DOM.sortOptions = document.querySelectorAll('.sort-option');
        DOM.viewToggles = document.querySelectorAll('.view-toggle');
        DOM.categoryFilterBtns = document.querySelectorAll('.category-filter-btn');
        DOM.footerCategoryBtns = document.querySelectorAll('.footer-category-btn');
        DOM.quickSelectBtns = document.querySelectorAll('.quick-select-btn');
        DOM.mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
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

/**
 * Инициализирует скролл хэдера с фиксом для мобильных
 */
function initScrollHeader() {
    if (!DOM.mainHeader) return;
    
    let lastScrollTop = 0;
    let isMobile = window.innerWidth <= 768;
    let ticking = false;
    
    function updateHeader(scrollTop) {
        const isScrolled = scrollTop > 100;
        
        // Обновляем состояние хэдера
        DOM.mainHeader.classList.toggle('scrolled', isScrolled);
        
        // Обновляем кнопку "Наверх"
        if (DOM.backToTop) {
            DOM.backToTop.hidden = !isScrolled;
            DOM.backToTop.classList.toggle('scrolled', isScrolled);
        }
        
        // На мобильных - прячем хэдер при скролле вниз
        if (isMobile && scrollTop > 200) {
            if (scrollTop > lastScrollTop && scrollTop > 200) {
                // Скроллим вниз - прячем хэдер
                DOM.mainHeader.style.transform = 'translateY(-100%)';
            } else {
                // Скроллим вверх - показываем хэдер
                DOM.mainHeader.style.transform = 'translateY(0)';
            }
        } else {
            // На десктопе или вверху страницы - всегда показываем
            DOM.mainHeader.style.transform = 'translateY(0)';
        }
        
        lastScrollTop = scrollTop;
    }
    
    // Обработчик скролла
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                updateHeader(window.pageYOffset || document.documentElement.scrollTop);
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });
    
    // Обработчик ресайза для определения типа устройства
    window.addEventListener('resize', () => {
        isMobile = window.innerWidth <= 768;
        
        // Сбрасываем трансформацию при изменении размера
        DOM.mainHeader.style.transform = 'translateY(0)';
    });
    
    // Инициализируем начальное состояние
    setTimeout(() => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        if (scrollTop > 100) {
            DOM.mainHeader.classList.add('scrolled');
            if (DOM.backToTop) {
                DOM.backToTop.hidden = false;
                DOM.backToTop.classList.add('scrolled');
            }
        }
    }, 100);
    
    console.log('✅ Скролл хэдера инициализирован для мобильных');
}

/**
 * Фиксирует позицию мобильного меню относительно хэдера
 */
function fixMobileMenuPosition() {
    if (!DOM.mobileNav || !DOM.mainHeader) return;
    
    // Получаем высоту хэдера
    const headerHeight = DOM.mainHeader.offsetHeight;
    
    // Устанавливаем отступ сверху для мобильного меню
    DOM.mobileNav.style.top = `${headerHeight}px`;
    DOM.mobileNav.style.height = `calc(100vh - ${headerHeight}px)`;
    
    console.log(`📏 Высота хэдера: ${headerHeight}px`);
}

/**
 * Инициализирует мобильное меню
 */
function initMobileMenu() {
    if (!DOM.menuToggle || !DOM.mobileNav || !DOM.mobileNavClose || !DOM.mobileNavOverlay) {
        console.warn('⚠️ Элементы мобильного меню не найдены');
        return;
    }
    
    let isMobileMenuOpen = false;
    
    function toggleMobileMenu() {
        isMobileMenuOpen = !isMobileMenuOpen;
        
        // Фиксируем позицию меню перед открытием
        if (isMobileMenuOpen) {
            fixMobileMenuPosition();
        }
        
        // Обновляем состояние кнопки
        DOM.menuToggle.classList.toggle('active', isMobileMenuOpen);
        DOM.menuToggle.setAttribute('aria-expanded', isMobileMenuOpen.toString());
        
        // Показываем/скрываем меню
        DOM.mobileNav.hidden = !isMobileMenuOpen;
        DOM.mobileNavOverlay.hidden = !isMobileMenuOpen;
        
        // Добавляем/убираем класс active
        if (isMobileMenuOpen) {
            DOM.mobileNav.classList.add('active');
            DOM.mobileNavOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Блокируем скролл хэдера при открытом меню
            DOM.mainHeader.style.position = 'fixed';
            DOM.mainHeader.style.top = '0';
            DOM.mainHeader.style.left = '0';
            DOM.mainHeader.style.right = '0';
        } else {
            DOM.mobileNav.classList.remove('active');
            DOM.mobileNavOverlay.classList.remove('active');
            document.body.style.overflow = '';
            
            // Восстанавливаем хэдер
            DOM.mainHeader.style.position = '';
        }
        
        console.log('📱 Мобильное меню:', isMobileMenuOpen ? 'открыто' : 'закрыто');
    }
    
    function closeMobileMenu() {
        if (isMobileMenuOpen) {
            toggleMobileMenu();
        }
    }
    
    DOM.menuToggle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleMobileMenu();
    });
    
    DOM.mobileNavClose.addEventListener('click', closeMobileMenu);
    DOM.mobileNavOverlay.addEventListener('click', closeMobileMenu);
    
    DOM.mobileNavLinks.forEach(link => {
        link.addEventListener('click', () => {
            const category = link.dataset.category;
            if (category) {
                filterProductsByCategory(category);
                closeMobileMenu();
                scrollToCatalog();
            }
        });
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isMobileMenuOpen) {
            closeMobileMenu();
        }
    });
    
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768 && isMobileMenuOpen) {
            closeMobileMenu();
        }
    });
    
    console.log('✅ Мобильное меню инициализировано');
}

/**
 * Обновляет активные ссылки в мобильном меню
 */
function updateMobileMenuActiveLinks() {
    if (!DOM.mobileNavLinks.length) return;
    
    DOM.mobileNavLinks.forEach(link => {
        const isActive = link.dataset.category === STATE.currentCategory;
        link.classList.toggle('active', isActive);
    });
}

// ============================================
// 6. ПРОГРЕСС-БАР
// ============================================

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
    
    window.addEventListener('scroll', () => {
        requestAnimationFrame(updateProgressBar);
    }, { passive: true });
    
    console.log('✅ Прогресс-бар инициализирован');
}

// ============================================
// 7. РАБОТА С ДАННЫМИ
// ============================================

/**
 * Загружает продукты
 * @returns {Promise<void>}
 */
async function loadProducts() {
    console.log('📦 Загрузка товаров...');
    
    try {
        const response = await fetch('products.json');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        
        if (!data || !data.products) {
            throw new Error('Некорректный формат данных');
        }
        
        STATE.products = data.products;
        STATE.filteredProducts = [...STATE.products];
        
        console.log(`✅ Загружено ${STATE.products.length} товаров`);
        
        renderProducts();
        updateProductsCount();
        updateCategoryText();
        
        localStorage.setItem(CONFIG.PRODUCTS_KEY, JSON.stringify(STATE.products));
        localStorage.setItem(CONFIG.UPDATE_KEY, new Date().toISOString());
        
    } catch (error) {
        console.error('❌ Ошибка загрузки:', error);
        
        try {
            const cached = localStorage.getItem(CONFIG.PRODUCTS_KEY);
            if (cached) {
                console.log('📦 Используем кэшированные данные');
                STATE.products = JSON.parse(cached);
                STATE.filteredProducts = [...STATE.products];
                renderProducts();
                updateProductsCount();
                updateCategoryText();
            } else {
                showEmptyStateWithError('Не удалось загрузить каталог');
            }
        } catch (cacheError) {
            console.error('❌ Ошибка кэша:', cacheError);
            showEmptyStateWithError('Не удалось загрузить каталог');
        }
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
// 8. РЕНДЕРИНГ ТОВАРОВ
// ============================================

/**
 * Проверяет поддержку object-fit и добавляет fallback
 */
function checkObjectFitSupport() {
    const testEl = document.createElement('div');
    testEl.style.objectFit = 'cover';
    
    if (testEl.style.objectFit !== undefined) {
        console.log('✅ Браузер поддерживает object-fit');
    } else {
        console.log('⚠️ Браузер НЕ поддерживает object-fit, добавляем fallback');
        document.documentElement.classList.add('no-objectfit');
    }
}

/**
 * Рендерит товары
 */
function renderProducts() {
    if (!DOM.catalogGrid || !DOM.emptyState) return;
    
    DOM.catalogGrid.innerHTML = '';
    
    if (STATE.filteredProducts.length === 0) {
        DOM.catalogGrid.style.display = 'none';
        DOM.emptyState.style.display = 'flex';
        return;
    }
    
    DOM.emptyState.style.display = 'none';
    DOM.catalogGrid.style.display = 'grid';
    
    const fragment = document.createDocumentFragment();
    
    STATE.filteredProducts.forEach((product, index) => {
        const card = createProductCard(product);
        
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        
        fragment.appendChild(card);
        
        setTimeout(() => {
            card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 50);
    });
    
    DOM.catalogGrid.appendChild(fragment);
    
    applyViewMode();
}

/**
 * Создает карточку товара
 * @param {Product} product 
 * @returns {HTMLElement}
 */
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.dataset.id = product.id;
    card.dataset.category = product.category;
    
    const isListView = STATE.currentView === 'list';
    
    if (isListView) {
        card.innerHTML = createListCardHTML(product);
    } else {
        card.innerHTML = createGridCardHTML(product);
        
        // Оптимизированная загрузка изображения для grid view
        const img = card.querySelector('.product-image');
        if (img) {
            setupProductImageOptimization(img, product);
        }
    }
    
    return card;
}

/**
 * Создает HTML для карточки в виде сетки
 * @param {Product} product 
 * @returns {string}
 */
function createGridCardHTML(product) {
    const newBadge = product.isNew ? 
        '<span class="product-badge badge-new">Новинка</span>' : '';
    
    const features = product.features ? 
        product.features.slice(0, 2).map(f => `<li class="product-feature"><i class="fas fa-check"></i> ${f}</li>`).join('') : '';
    
    return `
        <div class="product-card-inner">
            ${newBadge ? `<div class="product-badges">${newBadge}</div>` : ''}
            <div class="product-image-container">
                <img src="${product.image}" 
                     alt="${product.name}" 
                     class="product-image" 
                     loading="lazy"
                     width="300"
                     height="225">
            </div>
            <div class="product-info">
                <div class="product-header">
                    <h3 class="product-title">${product.name}</h3>
                    <span class="product-category">${getCategoryName(product.category)}</span>
                </div>
                <p class="product-description">${product.description}</p>
                ${features ? `<ul class="product-features">${features}</ul>` : ''}
                <div class="product-footer">
                    <div class="product-price">${formatPrice(product.price)}</div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Создает HTML для карточки в виде списка
 * @param {Product} product 
 * @returns {string}
 */
function createListCardHTML(product) {
    const newBadge = product.isNew ? 
        '<span class="product-badge badge-new">Новинка</span>' : '';
    
    return `
        <div class="product-card-inner">
            ${newBadge ? `<div class="product-badges">${newBadge}</div>` : ''}
            <div class="product-info">
                <div class="product-header">
                    <h3 class="product-title">${product.name}</h3>
                    <span class="product-category">${getCategoryName(product.category)}</span>
                </div>
                <div class="product-footer">
                    <div class="product-price">${formatPrice(product.price)}</div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Настраивает оптимизированную загрузку изображения
 * @param {HTMLImageElement} img 
 * @param {Product} product 
 */
function setupProductImageOptimization(img, product) {
    const imageContainer = img.parentElement;
    
    if (!imageContainer) return;
    
    // Предзагрузка в низком качестве (LQIP)
    img.style.backgroundColor = 'var(--color-surface)';
    
    img.addEventListener('load', function() {
        this.classList.add('loaded');
        if (imageContainer) {
            imageContainer.classList.add('image-loaded');
        }
    });
    
    img.addEventListener('error', function() {
        // Замена изображения на SVG fallback
        this.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="225" viewBox="0 0 300 225"><rect width="300" height="225" fill="%23f0f0f0"/><text x="150" y="120" font-size="40" text-anchor="middle" fill="%23b9c8c3">🦷</text></svg>';
        this.classList.add('loaded');
        if (imageContainer) {
            imageContainer.classList.add('image-loaded');
        }
    });
    
    // Если изображение уже загружено
    if (img.complete && img.naturalHeight > 0) {
        img.classList.add('loaded');
        imageContainer.classList.add('image-loaded');
    }
}

/**
 * Применяет режим просмотра
 */
function applyViewMode() {
    if (!DOM.catalogGrid) return;
    
    DOM.catalogGrid.classList.remove('grid-view', 'list-view');
    
    if (STATE.currentView === 'list') {
        DOM.catalogGrid.classList.add('list-view');
    } else {
        DOM.catalogGrid.classList.add('grid-view');
    }
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
 * Применяет фильтры и сортировку
 */
function applyFilters() {
    console.log('🔧 Применение фильтров...');
    
    let result = [...STATE.products];
    
    if (STATE.currentCategory !== 'all') {
        result = result.filter(product => product.category === STATE.currentCategory);
    }
    
    if (STATE.searchQuery.trim()) {
        const query = STATE.searchQuery.toLowerCase().trim();
        result = result.filter(product => 
            product.name.toLowerCase().includes(query) ||
            product.description.toLowerCase().includes(query) ||
            (product.features?.some(f => f.toLowerCase().includes(query)) || false)
        );
    }
    
    STATE.filteredProducts = sortProducts(result);
    
    console.log(`📊 После фильтрации: ${STATE.filteredProducts.length} товаров`);
    
    renderProducts();
    
    updateProductsCount();
    updateCategoryText();
    updateActiveCategory();
    updateMobileMenuActiveLinks();
    
    console.log('✅ Фильтры применены');
}

function scrollToCatalog() {
    requestAnimationFrame(() => {
        const catalogSection = document.querySelector('.catalog-section');
        if (catalogSection) {
            const headerHeight = DOM.menuToggle?.offsetHeight || 70;
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
    
    updateMobileMenuActiveLinks();
    
    console.log(`🎯 Категория: ${getCategoryName(category)}`);
}

/**
 * Сбрасывает фильтры
 */
function resetFilters() {
    console.log('🔄 Сброс фильтров...');
    
    STATE.currentCategory = 'all';
    STATE.searchQuery = '';
    STATE.currentSort = 'default';
    
    if (DOM.searchInput) DOM.searchInput.value = '';
    if (DOM.searchClear) DOM.searchClear.style.display = 'none';
    if (DOM.sortText) DOM.sortText.textContent = 'По популярности';
    
    applyFilters();
    
    updateMobileMenuActiveLinks();
    
    console.log('✅ Фильтры сброшены');
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
    
    categoryToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const isExpanded = categoryToggle.getAttribute('aria-expanded') === 'true';
        categoryToggle.setAttribute('aria-expanded', !isExpanded);
        categoryMenu.hidden = isExpanded;
    });
    
    document.addEventListener('click', (e) => {
        if (!categoryToggle.contains(e.target) && !categoryMenu.contains(e.target)) {
            categoryToggle.setAttribute('aria-expanded', 'false');
            categoryMenu.hidden = true;
        }
    });
    
    categoryOptions.forEach(option => {
        option.addEventListener('click', () => {
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
    
    DOM.sortToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const isExpanded = DOM.sortMenu.classList.toggle('show');
        DOM.sortToggle.setAttribute('aria-expanded', isExpanded);
    });
    
    document.addEventListener('click', (e) => {
        if (!DOM.sortToggle.contains(e.target) && !DOM.sortMenu.contains(e.target)) {
            DOM.sortMenu.classList.remove('show');
            DOM.sortToggle.setAttribute('aria-expanded', 'false');
        }
    });
    
    DOM.sortOptions.forEach(option => {
        option.addEventListener('click', () => {
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

/**
 * Инициализирует переключение режимов просмотра
 */
function initViewToggle() {
    if (!DOM.viewToggles.length) return;
    
    DOM.viewToggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            const viewType = toggle.id === 'viewGrid' ? 'grid' : 'list';
            
            if (viewType === STATE.currentView) return;
            
            STATE.currentView = viewType;
            
            DOM.viewToggles.forEach(t => {
                const isActive = t === toggle;
                t.classList.toggle('active', isActive);
                t.setAttribute('aria-pressed', isActive);
            });
            
            localStorage.setItem(CONFIG.VIEW_KEY, viewType);
            
            renderProducts();
            
            console.log(`👁️ Режим просмотра: ${viewType}`);
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
    
    DOM.searchInput.addEventListener('input', debouncedSearch);
    
    if (DOM.searchClear) {
        DOM.searchClear.addEventListener('click', () => {
            DOM.searchInput.value = '';
            STATE.searchQuery = '';
            DOM.searchClear.style.display = 'none';
            applyFilters();
            DOM.searchInput.focus();
            console.log('❌ Поиск очищен');
        });
    }
    
    DOM.searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            debouncedSearch();
        }
    });
    
    console.log('✅ Поиск инициализирован');
}

// ============================================
// 13. НАСТРОЙКА ОБРАБОТЧИКОВ СОБЫТИЙ
// ============================================

function setupEventListeners() {
    if (DOM.resetFiltersBtn) DOM.resetFiltersBtn.addEventListener('click', resetFilters);
    if (DOM.resetFiltersCatalogBtn) DOM.resetFiltersCatalogBtn.addEventListener('click', resetFilters);
    if (DOM.themeToggle) DOM.themeToggle.addEventListener('click', toggleTheme);
    if (DOM.themeReset) DOM.themeReset.addEventListener('click', resetToSystemTheme);
    
    if (DOM.backToTop) {
        DOM.backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
    
    const categoryHandlers = (btn) => {
        btn.addEventListener('click', () => {
            filterProductsByCategory(btn.dataset.category);
            scrollToCatalog();
        });
    };
    
    DOM.categoryFilterBtns.forEach(categoryHandlers);
    DOM.footerCategoryBtns.forEach(categoryHandlers);
    DOM.quickSelectBtns.forEach(categoryHandlers);
    
    DOM.categoryLinks.forEach(link => {
        link.addEventListener('click', (e) => {
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
        footerScrollTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
    
    document.querySelectorAll('a[href^="http"]').forEach(link => {
        if (!link.href.includes(window.location.hostname)) {
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer');
        }
    });
    
    console.log('✅ Все обработчики событий настроены');
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

/**
 * Показывает ошибку в empty state
 * @param {string} message 
 */
function showEmptyStateWithError(message) {
    if (!DOM.emptyState || !DOM.catalogGrid) return;
    
    console.log(`🚨 Показываем ошибку: ${message}`);
    
    DOM.emptyState.innerHTML = `
        <div class="empty-icon">
            <i class="fas fa-exclamation-triangle"></i>
        </div>
        <h3 class="empty-title">Ошибка загрузки</h3>
        <p class="empty-description">${message}</p>
        <button class="btn btn-accent empty-action" onclick="window.location.reload()">
            <i class="fas fa-redo"></i>
            Обновить страницу
        </button>
    `;
    
    DOM.emptyState.style.display = 'flex';
    DOM.emptyState.hidden = false;
    DOM.catalogGrid.style.display = 'none';
}

function showError(message) {
    console.error('🚨 Ошибка:', message);
    
    if (DOM.emptyState) {
        DOM.emptyState.innerHTML = `
            <div class="empty-icon">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <h3 class="empty-title">Ошибка загрузки</h3>
            <p class="empty-description">${message}</p>
            <button class="btn btn-accent empty-action" onclick="window.location.reload()">
                <i class="fas fa-redo"></i>
                Обновить страницу
            </button>
        `;
        
        DOM.emptyState.style.display = 'flex';
        DOM.emptyState.hidden = false;
    }
    
    if (DOM.catalogGrid) {
        DOM.catalogGrid.style.display = 'none';
    }
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
    
    window.addEventListener('online', () => {
        showNotification('Соединение восстановлено', 'success');
        console.log('🌐 Онлайн');
    });
    
    window.addEventListener('offline', () => {
        showNotification('Вы в офлайн-режиме', 'error');
        console.log('📴 Офлайн');
    });
    
    console.log('✅ PWA инициализирован');
}

// ============================================
// 16. ОСНОВНАЯ ИНИЦИАЛИЗАЦИЯ
// ============================================

/**
 * Инициализирует приложение
 */
async function init() {
    console.log('🚀 Инициализация каталога «Ортоцентр»...');
    
    try {
        // Проверяем поддержку object-fit
        checkObjectFitSupport();
        
        initDOMReferences();
        
        if (!DOM.catalogGrid) {
            throw new Error('Не найден элемент #catalogGrid');
        }
        
        initTheme();
        await loadProducts();
        setupEventListeners();
        
        setTimeout(() => {
            initScrollHeader();
            initProgressBar();
            
            // Фиксируем позицию мобильного меню
            setTimeout(fixMobileMenuPosition, 100);
        }, 100);
        
        console.log('✅ Приложение инициализировано успешно!');
        
    } catch (error) {
        console.error('❌ Ошибка инициализации:', error);
        showError('Ошибка загрузки каталога. Пожалуйста, обновите страницу.');
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

// Вызывать при ресайзе и после загрузки для фиксации позиции мобильного меню
window.addEventListener('resize', fixMobileMenuPosition);
window.addEventListener('load', fixMobileMenuPosition);
