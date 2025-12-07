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

// ============================================
// 2. ИНИЦИАЛИЗАЦИЯ DOM ЭЛЕМЕНТОВ
// ============================================

function initDOMReferences() {
    try {
        // Основные элементы (проверяем критически важные)
        DOM.catalogGrid = document.getElementById('catalogGrid');
        DOM.emptyState = document.getElementById('emptyState');
        
        console.log('DOM.catalogGrid:', DOM.catalogGrid);
        console.log('DOM.emptyState:', DOM.emptyState);
        
        if (!DOM.catalogGrid) {
            console.error('❌ ОШИБКА: Не найден #catalogGrid');
        }
        if (!DOM.emptyState) {
            console.error('❌ ОШИБКА: Не найден #emptyState');
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
    
    DOM.menuToggle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleMenu();
    });
    
    DOM.mainNav.addEventListener('click', (e) => {
        if (e.target.closest('.nav-link')) {
            if (window.innerWidth <= 768 && STATE.isMenuOpen) {
                toggleMenu();
            }
        }
    });
    
    document.addEventListener('click', (e) => {
        if (STATE.isMenuOpen && 
            !DOM.menuToggle.contains(e.target) && 
            !DOM.mainNav.contains(e.target)) {
            toggleMenu();
        }
    });
    
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            if (window.innerWidth > 768 && STATE.isMenuOpen) {
                toggleMenu();
            }
        }, 250);
    });
    
    document.addEventListener('keydown', (e) => {
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
 * Рендерит товары
 */
function renderProducts() {
    if (!DOM.catalogGrid || !DOM.emptyState) {
        console.error('❌ Не найдены необходимые DOM элементы');
        return;
    }
    
    console.log(`🎨 Рендеринг ${STATE.filteredProducts.length} товаров...`);
    
    DOM.catalogGrid.innerHTML = '';
    
    if (STATE.filteredProducts.length === 0) {
        console.log('📭 Нет товаров для отображения, показываем empty state');
        DOM.emptyState.style.display = 'flex';
        DOM.emptyState.hidden = false;
        DOM.catalogGrid.style.display = 'none';
    } else {
        console.log(`🛒 Отображаем ${STATE.filteredProducts.length} товаров`);
        DOM.emptyState.style.display = 'none';
        DOM.emptyState.hidden = true;
        DOM.catalogGrid.style.display = 'grid';
        
        const fragment = document.createDocumentFragment();
        
        STATE.filteredProducts.forEach((product, index) => {
            const card = createProductCard(product);
            fragment.appendChild(card);
        });
        
        DOM.catalogGrid.appendChild(fragment);
    }
    
    applyViewMode();
    
    console.log('✅ Рендеринг завершен');
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
    }
    
    const imageContainer = card.querySelector('.product-image-container');
    const img = card.querySelector('.product-image');
    
    if (imageContainer && img) {
        setupImageLoading(imageContainer, img);
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
        `<div class="product-badges"><span class="product-badge badge-new">Новинка</span></div>` : '';
    
    const features = product.features?.slice(0, 2).map(f => 
        `<li class="product-feature"><i class="fas fa-check"></i> ${f}</li>`
    ).join('') || '';
    
    const featuresHTML = features ? `<ul class="product-features">${features}</ul>` : '';
    
    return `
        <div class="product-card-inner">
            ${newBadge}
            <div class="product-image-container">
                <img src="${product.image}" alt="${product.name}" class="product-image" loading="lazy">
            </div>
            <div class="product-info">
                <div class="product-header">
                    <h3 class="product-title">${product.name}</h3>
                    <span class="product-category">${getCategoryName(product.category)}</span>
                </div>
                <p class="product-description">${product.description}</p>
                ${featuresHTML}
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
        `<div class="product-badges"><span class="product-badge badge-new">Новинка</span></div>` : '';
    
    return `
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
                <div class="product-footer">
                    <div class="product-price">${formatPrice(product.price)}</div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Настраивает загрузку изображения
 * @param {HTMLElement} container 
 * @param {HTMLImageElement} img 
 */
function setupImageLoading(container, img) {
    container.classList.add('image-loading');
    
    const handleLoad = () => {
        container.classList.remove('image-loading');
        container.classList.add('image-loaded');
    };
    
    const handleError = () => {
        container.classList.remove('image-loading');
        container.classList.add('image-error');
        img.src = 'assets/images/placeholder.jpg';
    };
    
    if (img.complete) {
        if (img.naturalHeight > 0) {
            handleLoad();
        } else {
            handleError();
        }
    } else {
        img.addEventListener('load', handleLoad, { once: true });
        img.addEventListener('error', handleError, { once: true });
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
    
    console.log('✅ Фильтры применены');
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
    
    DOM.sortOptions.forEach(opt => {
        opt.classList.remove('active');
        if (opt.dataset.sort === 'default') {
            opt.classList.add('active');
        }
    });
    
    applyFilters();
    
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

function initViewToggle() {
    if (!DOM.viewToggles.length) return;
    
    DOM.viewToggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
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
            renderProducts();
            
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
            initMobileMenu();
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
