/**
 * КАТАЛОГ «ОРТОЦЕНТР» - ОСНОВНОЙ СКРИПТ
 * Версия: 3.5 (Исправления кликов, меню, просмотренные товары)
 */

// ============================================
// 1. КОНСТАНТЫ И ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
// ============================================

const CONFIG = {
    PRODUCTS_PER_PAGE: 12,
    SEARCH_DEBOUNCE: 300,
    SCROLL_THRESHOLD: 100,
    ANIMATION_DELAY: 50,
    THEME_KEY: 'ortocentr-theme',
    VIEW_KEY: 'ortocentr-view',
    PRODUCTS_KEY: 'ortocentr-products',
    UPDATE_KEY: 'ortocentr-last-update',
    VIEWED_KEY: 'ortocentr-viewed'
};

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
    currentModalImageIndex: 0,
    isMenuOpen: false,
    viewedProducts: new Set()
};

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
        // Основные элементы
        DOM.catalogGrid = document.getElementById('catalogGrid');
        DOM.loadingState = document.getElementById('loadingState');
        DOM.emptyState = document.getElementById('emptyState');
        DOM.productsCount = document.getElementById('productsCount');
        DOM.currentCategoryText = document.getElementById('currentCategoryText');
        
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
        
        // Модальное окно
        DOM.imageModal = document.getElementById('imageModal');
        DOM.modalClose = document.getElementById('modalClose');
        DOM.modalPrev = document.getElementById('modalPrev');
        DOM.modalNext = document.getElementById('modalNext');
        DOM.modalImage = document.getElementById('modalImage');
        DOM.modalProductName = document.getElementById('modalProductName');
        DOM.modalProductPrice = document.getElementById('modalProductPrice');
        DOM.modalProductDescription = document.getElementById('modalProductDescription');
        DOM.modalProductCategory = document.getElementById('modalProductCategory');
        DOM.modalProductFeatures = document.getElementById('modalProductFeatures');
        DOM.modalCategoryFilter = document.getElementById('modalCategoryFilter');
        
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

function debounce(func, wait) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

function formatPrice(price) {
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(price);
}

function getCategoryName(category) {
    return CATEGORY_MAP[category]?.name || category;
}

function getRussianPlural(number) {
    const forms = ['товар', 'товара', 'товаров'];
    const cases = [2, 0, 1, 1, 1, 2];
    return forms[
        (number % 100 > 4 && number % 100 < 20) 
            ? 2 
            : cases[(number % 10 < 5) ? number % 10 : 5]
    ];
}

function formatFeatures(features) {
    return features?.length 
        ? features.map(f => `<li><i class="fas fa-check"></i> ${f}</li>`).join('')
        : '';
}

// ============================================
// 4. ПРОСМОТРЕННЫЕ ТОВАРЫ
// ============================================

function initViewedProducts() {
    try {
        const viewed = localStorage.getItem(CONFIG.VIEWED_KEY);
        if (viewed) {
            STATE.viewedProducts = new Set(JSON.parse(viewed));
        }
    } catch (error) {
        console.warn('⚠️ Не удалось загрузить просмотренные товары:', error);
    }
}

function markProductAsViewed(productId) {
    STATE.viewedProducts.add(productId.toString());
    
    try {
        localStorage.setItem(CONFIG.VIEWED_KEY, 
            JSON.stringify(Array.from(STATE.viewedProducts)));
    } catch (error) {
        console.warn('⚠️ Не удалось сохранить просмотренные товары:', error);
    }
    
    // Обновляем отображение карточки
    const card = document.querySelector(`.product-card[data-id="${productId}"]`);
    if (card) {
        card.classList.add('viewed');
    }
}

function isProductViewed(productId) {
    return STATE.viewedProducts.has(productId.toString());
}

// ============================================
// 5. УПРАВЛЕНИЕ ТЕМОЙ
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
// 6. ХЭДЕР И МОБИЛЬНОЕ МЕНЮ
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
    
    // Закрытие меню при клике на ссылку
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768 && STATE.isMenuOpen) {
                toggleMenu();
            }
        });
    });
    
    // Закрытие меню при клике вне его
    document.addEventListener('click', (e) => {
        if (STATE.isMenuOpen && 
            !DOM.menuToggle.contains(e.target) && 
            !DOM.mainNav.contains(e.target)) {
            toggleMenu();
        }
    });
    
    // Автоматическое закрытие при ресайзе
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768 && STATE.isMenuOpen) {
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
// 7. РАБОТА С ДАННЫМИ
// ============================================

async function loadProducts() {
    try {
        STATE.isLoading = true;
        showLoading();
        
        console.log('📦 Загрузка товаров...');
        
        const response = await fetch('products.json', {
            cache: 'no-cache',
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        STATE.products = data.products || [];
        STATE.filteredProducts = [...STATE.products];
        
        console.log(`✅ Загружено ${STATE.products.length} товаров`);
        
        initViewedProducts();
        applyFilters();
        setupEventListeners();
        
        try {
            localStorage.setItem(CONFIG.PRODUCTS_KEY, JSON.stringify(STATE.products));
            localStorage.setItem(CONFIG.UPDATE_KEY, new Date().toISOString());
        } catch (e) {
            console.warn('⚠️ Не удалось сохранить в localStorage:', e.message);
        }
        
    } catch (error) {
        console.error('❌ Ошибка загрузки товаров:', error);
        
        try {
            const cachedProducts = localStorage.getItem(CONFIG.PRODUCTS_KEY);
            const lastUpdate = localStorage.getItem(CONFIG.UPDATE_KEY);
            
            if (cachedProducts) {
                console.log('📦 Используем кэшированные товары из localStorage');
                STATE.products = JSON.parse(cachedProducts);
                STATE.filteredProducts = [...STATE.products];
                initViewedProducts();
                applyFilters();
                setupEventListeners();
                
                const updateDate = lastUpdate ? new Date(lastUpdate).toLocaleDateString() : 'неизвестно';
                showNotification(`Используем кэшированные данные (обновлено: ${updateDate})`, 'info');
            } else {
                showError('Не удалось загрузить каталог. Пожалуйста, проверьте соединение и обновите страницу.');
            }
        } catch {
            showError('Не удалось загрузить каталог. Пожалуйста, обновите страницу.');
        }
    } finally {
        STATE.isLoading = false;
        hideLoading();
    }
}

function filterProducts() {
    let result = [...STATE.products];
    
    if (STATE.currentCategory !== 'all') {
        result = result.filter(product => product.category === STATE.currentCategory);
    }
    
    if (STATE.searchQuery.trim()) {
        const query = STATE.searchQuery.toLowerCase().trim();
        result = result.filter(product => 
            product.name.toLowerCase().includes(query) ||
            product.description.toLowerCase().includes(query) ||
            product.features?.some(f => f.toLowerCase().includes(query))
        );
    }
    
    STATE.filteredProducts = sortProducts(result);
    updateProductsCount();
    renderProducts();
}

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

function renderProducts() {
    if (!DOM.catalogGrid) return;
    
    while (DOM.catalogGrid.firstChild) {
        DOM.catalogGrid.removeChild(DOM.catalogGrid.firstChild);
    }
    
    if (STATE.filteredProducts.length === 0) {
        showEmptyState();
        return;
    }
    
    hideEmptyState();
    
    STATE.filteredProducts.forEach((product, index) => {
        const card = STATE.currentView === 'list' 
            ? createListProductCard(product)
            : createProductCard(product);
        
        DOM.catalogGrid.appendChild(card);
        
        // Добавляем класс для просмотренных товаров
        if (isProductViewed(product.id)) {
            card.classList.add('viewed');
        }
        
        // Обработчик клика
        card.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            showImageModal(product.id);
            markProductAsViewed(product.id);
        });
        
        // Анимация появления
        requestAnimationFrame(() => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
                card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            }, index * CONFIG.ANIMATION_DELAY);
        });
    });
    
    applyViewMode();
}

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
    
    // Обработка изображения
    const imageContainer = card.querySelector('.product-image-container');
    const img = card.querySelector('.product-image');
    
    if (imageContainer) imageContainer.classList.add('image-loading');
    
    if (img) {
        img.addEventListener('load', () => {
            if (imageContainer) {
                imageContainer.classList.remove('image-loading');
                imageContainer.classList.add('image-loaded');
            }
        });
        
        img.addEventListener('error', () => {
            if (imageContainer) {
                imageContainer.classList.remove('image-loading');
                imageContainer.classList.add('image-error');
                if (img.src !== 'assets/images/placeholder.jpg') {
                    img.src = 'assets/images/placeholder.jpg';
                }
            }
        });
    }
    
    return card;
}

function createListProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.dataset.id = product.id;
    card.dataset.category = product.category;
    
    const newBadge = product.isNew ? `<span class="product-badge badge-new">Новинка</span>` : '';
    
    card.innerHTML = `
        <div class="product-card-inner">
            ${newBadge ? `<div class="product-badges">${newBadge}</div>` : ''}
            <div class="product-image-container">
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

function applyFilters() {
    filterProducts();
    updateCategoryText();
    updateActiveCategory();
    updateActiveSort();
    updateFooterFilters();
    updateQuickSelectButtons();
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
// 13. МОДАЛЬНОЕ ОКНО
// ============================================

function initImageModal() {
    if (!DOM.imageModal) return;
    
    window.showImageModal = function(productId) {
        const product = STATE.products.find(p => p.id === productId);
        if (!product) {
            console.error('❌ Товар не найден:', productId);
            return;
        }
        
        STATE.currentModalImageIndex = STATE.filteredProducts.findIndex(p => p.id === productId);
        fillModalData(product);
        
        DOM.imageModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', handleModalKeydown);
        
        console.log('🖼️ Модальное окно открыто:', product.name);
    };
    
    DOM.modalClose.addEventListener('click', closeImageModal);
    DOM.imageModal.querySelector('.modal-overlay').addEventListener('click', closeImageModal);
    DOM.modalPrev.addEventListener('click', showPrevImage);
    DOM.modalNext.addEventListener('click', showNextImage);
    
    if (DOM.modalCategoryFilter) {
        DOM.modalCategoryFilter.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            if (category) {
                filterProductsByCategory(category);
                closeImageModal();
            }
        });
    }
    
    console.log('✅ Модальное окно инициализировано');
}

function fillModalData(product) {
    if (!product) return;
    
    DOM.modalImage.src = product.image;
    DOM.modalImage.alt = product.name;
    
    DOM.modalImage.addEventListener('error', function() {
        if (this.src !== 'assets/images/placeholder.jpg') {
            this.src = 'assets/images/placeholder.jpg';
        }
    });
    
    DOM.modalProductName.textContent = product.name;
    DOM.modalProductPrice.textContent = formatPrice(product.price);
    DOM.modalProductDescription.textContent = product.description;
    DOM.modalProductCategory.textContent = getCategoryName(product.category);
    DOM.modalProductFeatures.innerHTML = formatFeatures(product.features);
    
    if (DOM.modalCategoryFilter) {
        DOM.modalCategoryFilter.setAttribute('data-category', product.category);
        DOM.modalCategoryFilter.innerHTML = `
            <i class="fas fa-filter"></i>
            Показать все в категории "${getCategoryName(product.category)}"
        `;
    }
    
    const showNav = STATE.filteredProducts.length > 1;
    DOM.modalPrev.style.display = showNav ? 'flex' : 'none';
    DOM.modalNext.style.display = showNav ? 'flex' : 'none';
}

function showPrevImage() {
    if (STATE.filteredProducts.length <= 1) return;
    
    STATE.currentModalImageIndex--;
    if (STATE.currentModalImageIndex < 0) {
        STATE.currentModalImageIndex = STATE.filteredProducts.length - 1;
    }
    
    const product = STATE.filteredProducts[STATE.currentModalImageIndex];
    fillModalData(product);
    
    DOM.modalImage.style.animation = 'none';
    requestAnimationFrame(() => {
        DOM.modalImage.style.animation = 'fadeIn 0.3s ease';
    });
}

function showNextImage() {
    if (STATE.filteredProducts.length <= 1) return;
    
    STATE.currentModalImageIndex++;
    if (STATE.currentModalImageIndex >= STATE.filteredProducts.length) {
        STATE.currentModalImageIndex = 0;
    }
    
    const product = STATE.filteredProducts[STATE.currentModalImageIndex];
    fillModalData(product);
    
    DOM.modalImage.style.animation = 'none';
    requestAnimationFrame(() => {
        DOM.modalImage.style.animation = 'fadeIn 0.3s ease';
    });
}

function closeImageModal() {
    DOM.imageModal.classList.remove('active');
    document.body.style.overflow = '';
    document.removeEventListener('keydown', handleModalKeydown);
    console.log('❌ Модальное окно закрыто');
}

function handleModalKeydown(e) {
    if (!DOM.imageModal.classList.contains('active')) return;
    
    switch (e.key) {
        case 'ArrowLeft': showPrevImage(); break;
        case 'ArrowRight': showNextImage(); break;
        case 'Escape': closeImageModal(); break;
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

function showLoading() {
    if (DOM.loadingState) DOM.loadingState.style.display = 'flex';
    if (DOM.catalogGrid) {
        DOM.catalogGrid.style.opacity = '0.5';
        DOM.catalogGrid.style.pointerEvents = 'none';
    }
}

function hideLoading() {
    if (DOM.loadingState) DOM.loadingState.style.display = 'none';
    if (DOM.catalogGrid) {
        DOM.catalogGrid.style.opacity = '1';
        DOM.catalogGrid.style.pointerEvents = 'auto';
    }
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
// 16. НАСТРОЙКА ОБРАБОТЧИКОВ СОБЫТИЙ
// ============================================

function setupEventListeners() {
    // Основные кнопки
    if (DOM.resetFiltersBtn) DOM.resetFiltersBtn.addEventListener('click', resetFilters);
    if (DOM.resetFiltersCatalogBtn) DOM.resetFiltersCatalogBtn.addEventListener('click', resetFilters);
    if (DOM.themeToggle) DOM.themeToggle.addEventListener('click', toggleTheme);
    if (DOM.themeReset) DOM.themeReset.addEventListener('click', resetToSystemTheme);
    
    // Кнопка "Наверх"
    if (DOM.backToTop) {
        DOM.backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
    
    // Обработчики категорий
    const categoryHandlers = (btn) => {
        btn.addEventListener('click', () => {
            filterProductsByCategory(btn.dataset.category);
            scrollToCatalog();
        });
    };
    
    DOM.categoryFilterBtns.forEach(categoryHandlers);
    DOM.footerCategoryBtns.forEach(categoryHandlers);
    DOM.quickSelectBtns.forEach(categoryHandlers);
    
    // Навигационные ссылки
    DOM.categoryLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            filterProductsByCategory(link.dataset.category);
            scrollToCatalog();
        });
    });
    
    // Инициализация компонентов
    initSorting();
    initViewToggle();
    initSearch();
    initMobileMenu();
    initImageModal();
    initScrollHeader();
    initPWA();
    initCategoryDropdown();
    
    // Обновление года в футере
    const yearElement = document.getElementById('currentYear');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
    
    // Кнопка "Наверх" в футере
    const footerScrollTop = document.getElementById('footerScrollTop');
    if (footerScrollTop) {
        footerScrollTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
    
    // Добавление атрибутов безопасности для внешних ссылок
    document.querySelectorAll('a[href^="http"]').forEach(link => {
        if (!link.href.includes(window.location.hostname)) {
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer');
        }
    });
    
    console.log('✅ Все обработчики событий настроены');
}

// ============================================
// 17. ОСНОВНАЯ ИНИЦИАЛИЗАЦИЯ
// ============================================

async function init() {
    console.log('🚀 Инициализация каталога «Ортоцентр» версии 3.5...');
    
    try {
        initDOMReferences();
        initTheme();
        await loadProducts();
        
        document.title = `Ортоцентр | ${STATE.products.length} товаров`;
        
        console.log('✅ Каталог готов к работе!');
        console.log('📊 Статистика:', {
            товаров: STATE.products.length,
            просмотрено: STATE.viewedProducts.size,
            тема: STATE.currentTheme,
            вид: STATE.currentView,
            версия: '3.5'
        });
        
    } catch (error) {
        console.error('❌ Критическая ошибка инициализации:', error);
        showError('Критическая ошибка при загрузке каталога');
    }
}

// ============================================
// 18. ЗАПУСК ПРИЛОЖЕНИЯ И ГЛОБАЛЬНЫЙ ЭКСПОРТ
// ============================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Глобальная обработка ошибок
window.addEventListener('error', (event) => {
    console.error('🚨 Глобальная ошибка:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('🚨 Необработанный Promise:', event.reason);
});

// Глобальный экспорт API приложения
window.CatalogApp = {
    STATE,
    toggleTheme,
    resetFilters,
    showImageModal,
    filterProductsByCategory,
    setTheme,
    getVersion: () => '3.5'
};

console.log('📦 CatalogApp v3.5 загружен');
