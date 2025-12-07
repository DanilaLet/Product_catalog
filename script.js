/**
 * КАТАЛОГ «ОРТОЦЕНТР» - ОСНОВНОЙ СКРИПТ
 * Версия: 3.2 с исправлениями хэдера и кнопок
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
    EASTER_EGG_CODE: 'СТОМАТОЛОГИЯ',
    CACHE_NAME: 'ortocentr-cache-v2.0'
};

// Состояние приложения
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
    logoClickCount: 0,
    isEasterEggActive: false,
    isMenuOpen: false
};

// DOM элементы
const DOM = {
    // Основные контейнеры
    catalogGrid: null,
    loadingState: null,
    emptyState: null,
    
    // Управление
    searchInput: null,
    searchClear: null,
    resetFiltersBtn: null,
    resetFiltersCatalogBtn: null, // Новая кнопка в catalog-controls
    
    // Навигация
    categoryLinks: [],
    sortOptions: [],
    viewToggles: [],
    
    // Информация
    productsCount: null,
    currentCategoryText: null,
    
    // Кнопка наверх
    backToTop: null,
    
    // Мобильное меню
    menuToggle: null,
    mainNav: null,
    
    // Переключатель темы
    themeToggle: null,
    
    // Сортировка
    sortToggle: null,
    sortMenu: null,
    sortText: null,
    
    // Виды
    viewGrid: null,
    viewList: null,
    
    // Модальное окно изображений
    imageModal: null,
    modalClose: null,
    modalPrev: null,
    modalNext: null,
    modalImage: null,
    modalProductName: null,
    modalProductPrice: null,
    modalProductDescription: null,
    modalProductCategory: null,
    modalProductFeatures: null,
    modalCategoryFilter: null,
    
    // Хэдер и футер
    mainHeader: null,
    mainLogo: null,
    
    // Кнопки фильтров
    categoryFilterBtns: [],
    footerCategoryBtns: [],
    
    // Поиск
    searchHints: null,

    // Быстрый выбор категорий
    quickSelectBtns: []
};

// ============================================
// 2. ИНИЦИАЛИЗАЦИЯ DOM ЭЛЕМЕНТОВ
// ============================================

function initDOMReferences() {
    try {
        // Основные контейнеры
        DOM.catalogGrid = document.getElementById('catalogGrid');
        DOM.loadingState = document.getElementById('loadingState');
        DOM.emptyState = document.getElementById('emptyState');
        
        // Управление
        DOM.searchInput = document.getElementById('globalSearch');
        DOM.searchClear = document.getElementById('searchClear');
        DOM.resetFiltersBtn = document.getElementById('resetFilters');
        DOM.resetFiltersCatalogBtn = document.getElementById('resetFiltersBtn'); // Новая кнопка
        
        // Навигация
        DOM.categoryLinks = document.querySelectorAll('.nav-link');
        DOM.sortOptions = document.querySelectorAll('.sort-option');
        DOM.viewToggles = document.querySelectorAll('.view-toggle');
        
        // Информация
        DOM.productsCount = document.getElementById('productsCount');
        DOM.currentCategoryText = document.getElementById('currentCategoryText');
        
        // Кнопка наверх
        DOM.backToTop = document.getElementById('backToTop');
        
        // Мобильное меню
        DOM.menuToggle = document.getElementById('menuToggle');
        DOM.mainNav = document.getElementById('mainNav');
        
        // Переключатель темы
        DOM.themeToggle = document.getElementById('themeToggle');
        
        // Сортировка
        DOM.sortToggle = document.getElementById('sortToggle');
        DOM.sortMenu = document.getElementById('sortMenu');
        DOM.sortText = document.getElementById('sortText');
        
        // Виды
        DOM.viewGrid = document.getElementById('viewGrid');
        DOM.viewList = document.getElementById('viewList');
        
        // Модальное окно изображений
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
        
        // Хэдер и футер
        DOM.mainHeader = document.getElementById('mainHeader');
        DOM.mainLogo = document.getElementById('mainLogo');
        
        // Кнопки фильтров
        DOM.categoryFilterBtns = document.querySelectorAll('.category-filter-btn');
        DOM.footerCategoryBtns = document.querySelectorAll('.footer-category-btn');
        
        // Поиск
        DOM.searchHints = document.querySelector('.search-hints');

        // Быстрый выбор категорий
        DOM.quickSelectBtns = document.querySelectorAll('.quick-select-btn');
        
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
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
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
    const categories = {
        'щетки': 'Зубные щетки',
        'пасты': 'Зубные пасты',
        'ирригаторы': 'Ирригаторы',
        'прочее': 'Прочее',
        'all': 'Все товары'
    };
    return categories[category] || category;
}

function getCategoryIcon(category) {
    const icons = {
        'щетки': 'fa-toothbrush',
        'пасты': 'fa-paste',
        'ирригаторы': 'fa-shower',
        'прочее': 'fa-boxes',
        'all': 'fa-th-large'
    };
    return icons[category] || 'fa-box';
}

function getRussianPlural(number, forms) {
    const cases = [2, 0, 1, 1, 1, 2];
    return forms[
        (number % 100 > 4 && number % 100 < 20) 
            ? 2 
            : cases[(number % 10 < 5) ? number % 10 : 5]
    ];
}

function formatFeatures(features) {
    if (!features || !features.length) return '';
    
    return features.map(feature => 
        `<li><i class="fas fa-check"></i> ${feature}</li>`
    ).join('');
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
        
        // Слушатель изменения системной темы
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
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
        
        // Анимация перехода темы
        document.body.classList.add('theme-transition');
        setTimeout(() => {
            document.body.classList.remove('theme-transition');
        }, 500);
        
        console.log('🎨 Тема установлена:', theme);
    } catch (error) {
        console.error('❌ Ошибка установки темы:', error);
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
}

// ============================================
// 5. ХЭДЕР ПРИ СКРОЛЛЕ И МОБИЛЬНОЕ МЕНЮ
// ============================================

function initScrollHeader() {
    if (!DOM.mainHeader) return;
    
    let lastScrollTop = 0;
    let isScrolling = false;
    
    function handleScroll() {
        if (isScrolling) return;
        
        isScrolling = true;
        requestAnimationFrame(() => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            // Кнопка "Наверх"
            if (DOM.backToTop) {
                if (scrollTop > CONFIG.SCROLL_THRESHOLD) {
                    DOM.backToTop.classList.add('scrolled');
                } else {
                    DOM.backToTop.classList.remove('scrolled');
                }
            }
            
            // Уменьшение хэдера
            if (scrollTop > CONFIG.SCROLL_THRESHOLD) {
                DOM.mainHeader.classList.add('scrolled');
            } else {
                DOM.mainHeader.classList.remove('scrolled');
            }
            
            // Плавное появление/исчезновение при скролле вниз/вверх
            if (scrollTop > lastScrollTop && scrollTop > 200 && !STATE.isMenuOpen) {
                DOM.mainHeader.style.transform = 'translateY(-100%)';
            } else {
                DOM.mainHeader.style.transform = 'translateY(0)';
            }
            
            lastScrollTop = scrollTop;
            isScrolling = false;
        });
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Изначальная проверка
    setTimeout(() => {
        if (window.pageYOffset > CONFIG.SCROLL_THRESHOLD) {
            DOM.mainHeader.classList.add('scrolled');
        }
    }, 100);
    
    console.log('✅ Скролл хэдера инициализирован');
}

function initMobileMenu() {
    if (!DOM.menuToggle || !DOM.mainNav) return;
    
    function toggleMenu() {
        STATE.isMenuOpen = !STATE.isMenuOpen;
        DOM.menuToggle.setAttribute('aria-expanded', STATE.isMenuOpen);
        DOM.mainNav.classList.toggle('active');
        document.body.classList.toggle('menu-open');
        
        // Обновляем иконку бургера
        const bars = DOM.menuToggle.querySelectorAll('.bar');
        if (STATE.isMenuOpen) {
            bars[0].style.transform = 'rotate(45deg) translate(6px, 6px)';
            bars[1].style.opacity = '0';
            bars[2].style.transform = 'rotate(-45deg) translate(6px, -6px)';
        } else {
            bars[0].style.transform = 'none';
            bars[1].style.opacity = '1';
            bars[2].style.transform = 'none';
        }
        
        console.log('📱 Меню:', STATE.isMenuOpen ? 'открыто' : 'закрыто');
    }
    
    DOM.menuToggle.addEventListener('click', toggleMenu);
    
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
    
    // Закрытие меню при ресайзе
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
        DOM.mainNav.classList.remove('active');
        document.body.classList.remove('menu-open');
        
        // Сброс иконки бургера
        const bars = DOM.menuToggle.querySelectorAll('.bar');
        bars[0].style.transform = 'none';
        bars[1].style.opacity = '1';
        bars[2].style.transform = 'none';
    }
}

// ============================================
// 6. РАБОТА С ДАННЫМИ
// ============================================

async function loadProducts() {
    try {
        STATE.isLoading = true;
        showLoading();
        
        console.log('📦 Загрузка товаров...');
        
        const response = await fetch('products.json', {
            cache: 'no-cache',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        STATE.products = data.products || [];
        STATE.filteredProducts = [...STATE.products];
        
        console.log(`✅ Загружено ${STATE.products.length} товаров`);
        
        applyFilters();
        setupEventListeners();
        
        // Сохраняем данные в localStorage для офлайн-работы
        try {
            localStorage.setItem('ortocentr-products', JSON.stringify(STATE.products));
            localStorage.setItem('ortocentr-last-update', new Date().toISOString());
        } catch (e) {
            console.warn('⚠️ Не удалось сохранить в localStorage:', e.message);
        }
        
    } catch (error) {
        console.error('❌ Ошибка загрузки товаров:', error);
        
        // Пробуем загрузить из localStorage
        try {
            const cachedProducts = localStorage.getItem('ortocentr-products');
            const lastUpdate = localStorage.getItem('ortocentr-last-update');
            
            if (cachedProducts) {
                console.log('📦 Используем кэшированные товары из localStorage');
                STATE.products = JSON.parse(cachedProducts);
                STATE.filteredProducts = [...STATE.products];
                applyFilters();
                setupEventListeners();
                
                showNotification(`Используем кэшированные данные (обновлено: ${new Date(lastUpdate).toLocaleDateString()})`, 'info');
            } else {
                showError('Не удалось загрузить каталог. Пожалуйста, проверьте соединение и обновите страницу.');
            }
        } catch (cacheError) {
            showError('Не удалось загрузить каталог. Пожалуйста, обновите страницу.');
        }
    } finally {
        STATE.isLoading = false;
        hideLoading();
    }
}

function filterProducts() {
    let result = [...STATE.products];
    
    // Фильтр по категории
    if (STATE.currentCategory !== 'all') {
        result = result.filter(product => 
            product.category === STATE.currentCategory
        );
    }
    
    // Фильтр по поисковому запросу
    if (STATE.searchQuery.trim()) {
        const query = STATE.searchQuery.toLowerCase().trim();
        result = result.filter(product => 
            product.name.toLowerCase().includes(query) ||
            product.description.toLowerCase().includes(query) ||
            (product.features && product.features.some(f => 
                f.toLowerCase().includes(query)
            ))
        );
    }
    
    // Сортировка
    result = sortProducts(result);
    
    STATE.filteredProducts = result;
    updateProductsCount();
    renderProducts();
}

function sortProducts(products) {
    const sorted = [...products];
    
    switch (STATE.currentSort) {
        case 'price-asc':
            return sorted.sort((a, b) => a.price - b.price);
            
        case 'price-desc':
            return sorted.sort((a, b) => b.price - a.price);
            
        case 'new':
            return sorted.sort((a, b) => {
                if (a.isNew && !b.isNew) return -1;
                if (!a.isNew && b.isNew) return 1;
                return 0;
            });
            
        case 'name':
            return sorted.sort((a, b) => 
                a.name.localeCompare(b.name, 'ru')
            );
            
        default: // 'default' - по порядку добавления
            return sorted.sort((a, b) => b.id - a.id);
    }
}

// ============================================
// 7. РЕНДЕРИНГ
// ============================================

function renderProducts() {
    if (!DOM.catalogGrid) return;
    
    // Очищаем контейнер
    while (DOM.catalogGrid.firstChild) {
        DOM.catalogGrid.removeChild(DOM.catalogGrid.firstChild);
    }
    
    if (STATE.filteredProducts.length === 0) {
        showEmptyState();
        return;
    }
    
    hideEmptyState();
    
    STATE.filteredProducts.forEach((product, index) => {
        const card = createProductCard(product);
        DOM.catalogGrid.appendChild(card);
        
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
    
    // Бейдж "Новинка"
    const newBadge = product.isNew ? 
        `<span class="product-badge badge-new">Новинка</span>` : '';
    
    // Особенности (первые 3)
    const features = product.features ? 
        product.features.slice(0, 3).map(f => 
            `<li class="product-feature">
                <i class="fas fa-check"></i> ${f}
            </li>`
        ).join('') : '';
    
    const featuresList = features ? 
        `<ul class="product-features">${features}</ul>` : '';
    
    card.innerHTML = `
        <div class="product-card-inner">
            <!-- Бейджи -->
            <div class="product-badges">
                ${newBadge}
            </div>
            
            <!-- Изображение -->
            <div class="product-image-container">
                <img 
                    src="${product.image}" 
                    alt="${product.name}" 
                    class="product-image"
                    loading="lazy"
                >
            </div>
            
            <!-- Информация -->
            <div class="product-info">
                <div class="product-header">
                    <h3 class="product-title">${product.name}</h3>
                    <span class="product-category">
                        ${getCategoryName(product.category)}
                    </span>
                </div>
                
                <p class="product-description">${product.description}</p>
                
                ${featuresList}
                
                <div class="product-footer">
                    <div class="product-price">
                        ${formatPrice(product.price)}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Обработчик клика по изображению
    const imageContainer = card.querySelector('.product-image-container');
    const img = card.querySelector('.product-image');
    
    // Управление состоянием загрузки изображения
    imageContainer.classList.add('image-loading');
    
    img.addEventListener('load', function() {
        imageContainer.classList.remove('image-loading');
        imageContainer.classList.add('image-loaded');
    });
    
    img.addEventListener('error', function() {
        imageContainer.classList.remove('image-loading');
        imageContainer.classList.add('image-error');
        // Если не удалось загрузить, пробуем загрузить placeholder
        if (this.src !== 'assets/images/placeholder.jpg' && this.src !== '/assets/images/placeholder.jpg') {
            this.src = 'assets/images/placeholder.jpg';
        }
    });
    
    imageContainer.addEventListener('click', () => {
        showImageModal(product.id);
    });
    
    // Обработчик клика по всей карточке
    card.addEventListener('click', (e) => {
        if (e.target.closest('.product-image-container') || 
            e.target.closest('.product-badges')) return;
        showImageModal(product.id);
    });
    
    return card;
}

function updateProductsCount() {
    if (!DOM.productsCount) return;
    
    const count = STATE.filteredProducts.length;
    const text = `(${count} ${getRussianPlural(count, ['товар', 'товара', 'товаров'])})`;
    
    DOM.productsCount.textContent = text;
}

function updateCategoryText() {
    if (!DOM.currentCategoryText) return;
    
    DOM.currentCategoryText.textContent = getCategoryName(STATE.currentCategory);
}

// ============================================
// 8. ФИЛЬТРАЦИЯ И СОРТИРОВКА
// ============================================

function applyFilters() {
    filterProducts();
    updateCategoryText();
    updateActiveCategory();
    updateActiveSort();
    updateFooterFilters();
    updateQuickSelectButtons();
    
    // Прокрутка к каталогу если нужно
    if (STATE.currentCategory !== 'all' || STATE.searchQuery) {
        requestAnimationFrame(() => {
            const catalogSection = document.querySelector('.catalog-section');
            if (catalogSection) {
                const headerHeight = DOM.mainHeader?.offsetHeight || 70;
                const catalogTop = catalogSection.getBoundingClientRect().top + window.pageYOffset;
                
                if (window.pageYOffset < catalogTop - headerHeight - 20) {
                    window.scrollTo({
                        top: catalogTop - headerHeight - 20,
                        behavior: 'smooth'
                    });
                }
            }
        });
    }
}

function filterProductsByCategory(category) {
    if (category === STATE.currentCategory && STATE.searchQuery === '') return;
    
    STATE.currentCategory = category;
    STATE.searchQuery = '';
    
    if (DOM.searchInput) {
        DOM.searchInput.value = '';
        DOM.searchClear.style.display = 'none';
    }
    
    applyFilters();
    closeMobileMenu();
    
    console.log(`🎯 Фильтр: ${getCategoryName(category)}`);
}

function resetFilters() {
    STATE.currentCategory = 'all';
    STATE.searchQuery = '';
    STATE.currentSort = 'default';
    
    if (DOM.searchInput) {
        DOM.searchInput.value = '';
        DOM.searchClear.style.display = 'none';
    }
    
    if (DOM.sortText) {
        DOM.sortText.textContent = 'По популярности';
    }
    
    applyFilters();
    showNotification('Фильтры сброшены');
    
    console.log('🔄 Фильтры сброшены');
}

function updateActiveCategory() {
    // Навигация в хэдере
    DOM.categoryLinks.forEach(link => {
        const isActive = link.dataset.category === STATE.currentCategory;
        link.classList.toggle('active', isActive);
        link.setAttribute('aria-current', isActive ? 'page' : 'false');
    });
    
    // Кнопки в категориях
    DOM.categoryFilterBtns.forEach(btn => {
        const isActive = btn.dataset.category === STATE.currentCategory;
        btn.classList.toggle('active', isActive);
    });

    // Кнопки в футере
    DOM.footerCategoryBtns.forEach(btn => {
        const isActive = btn.dataset.category === STATE.currentCategory;
        btn.classList.toggle('active', isActive);
    });
}

function updateQuickSelectButtons() {
    if (!DOM.quickSelectBtns.length) return;
    
    DOM.quickSelectBtns.forEach(btn => {
        const isActive = btn.dataset.category === STATE.currentCategory;
        btn.classList.toggle('active', isActive);
    });
}

function updateFooterFilters() {
    if (!DOM.footerCategoryBtns.length) return;
    
    DOM.footerCategoryBtns.forEach(btn => {
        const isActive = btn.dataset.category === STATE.currentCategory;
        btn.classList.toggle('active', isActive);
    });
}

// ============================================
// 9. СОРТИРОВКА И ВИДЫ
// ============================================

function initSorting() {
    if (!DOM.sortOptions.length || !DOM.sortToggle || !DOM.sortMenu || !DOM.sortText) return;
    
    // Открытие/закрытие меню сортировки
    DOM.sortToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        DOM.sortMenu.classList.toggle('show');
        DOM.sortToggle.setAttribute('aria-expanded', 
            DOM.sortMenu.classList.contains('show')
        );
    });
    
    // Закрытие меню при клике вне его
    document.addEventListener('click', (e) => {
        if (!DOM.sortToggle.contains(e.target) && !DOM.sortMenu.contains(e.target)) {
            DOM.sortMenu.classList.remove('show');
            DOM.sortToggle.setAttribute('aria-expanded', 'false');
        }
    });
    
    // Обработчики для опций сортировки
    DOM.sortOptions.forEach(option => {
        option.addEventListener('click', () => {
            const sortType = option.dataset.sort;
            if (sortType === STATE.currentSort) return;
            
            STATE.currentSort = sortType;
            applyFilters();
            
            // Обновляем текст в кнопке сортировки
            DOM.sortText.textContent = option.textContent;
            
            // Закрываем меню
            DOM.sortMenu.classList.remove('show');
            DOM.sortToggle.setAttribute('aria-expanded', 'false');
            
            console.log(`📊 Сортировка: ${option.textContent}`);
        });
    });
    
    console.log('✅ Сортировка инициализирована');
}

function updateActiveSort() {
    if (!DOM.sortOptions.length) return;
    
    DOM.sortOptions.forEach(option => {
        const isActive = option.dataset.sort === STATE.currentSort;
        option.classList.toggle('active', isActive);
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
            
            // Обновляем активные кнопки
            DOM.viewToggles.forEach(t => {
                const isActive = t === toggle;
                t.classList.toggle('active', isActive);
                t.setAttribute('aria-pressed', isActive);
            });
            
            // Сохраняем настройку
            localStorage.setItem('ortocentr-view', viewType);
            
            console.log(`👁️ Вид: ${viewType}`);
        });
    });
    
    // Восстанавливаем сохраненный вид
    const savedView = localStorage.getItem('ortocentr-view');
    if (savedView && (savedView === 'grid' || savedView === 'list')) {
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
// 10. ПОИСК И ПАСХАЛКА
// ============================================

function initSearch() {
    if (!DOM.searchInput) return;
    
    // Debounce поиска
    const debouncedSearch = debounce(() => {
        STATE.searchQuery = DOM.searchInput.value;
        
        // Показываем/скрываем кнопку очистки
        if (DOM.searchClear) {
            DOM.searchClear.style.display = STATE.searchQuery ? 'flex' : 'none';
        }
        
        // Проверка пасхалки
        checkEasterEgg();
        
        applyFilters();
        
        console.log(`🔍 Поиск: "${STATE.searchQuery}"`);
    }, CONFIG.SEARCH_DEBOUNCE);
    
    DOM.searchInput.addEventListener('input', debouncedSearch);
    
    // Кнопка очистки
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
    
    // Поиск по Enter
    DOM.searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            debouncedSearch();
        }
    });
    
    console.log('✅ Поиск инициализирован');
}

function initEasterEgg() {
    if (!DOM.mainLogo) return;
    
    let lastClickTime = 0;
    const clickTimeout = 2000; // 2 секунды для серии кликов
    
    DOM.mainLogo.addEventListener('click', () => {
        const now = Date.now();
        
        // Сбрасываем счетчик если прошло больше timeout
        if (now - lastClickTime > clickTimeout) {
            STATE.logoClickCount = 0;
        }
        
        STATE.logoClickCount++;
        lastClickTime = now;
        
        console.log(`🎯 Логотип кликнут: ${STATE.logoClickCount} раз`);
        
        // Визуальная обратная связь
        if (STATE.logoClickCount >= 3) {
            DOM.mainLogo.style.transform = 'scale(1.1)';
            setTimeout(() => {
                DOM.mainLogo.style.transform = '';
            }, 200);
        }
        
        if (STATE.logoClickCount >= 5) {
            console.log('🎉 Пасхалка готова! Введите "СТОМАТОЛОГИЯ" в поиске');
            
            // Сброс через 30 секунд
            setTimeout(() => {
                if (STATE.logoClickCount >= 5) {
                    STATE.logoClickCount = 0;
                    console.log('⏰ Пасхалка деактивирована (таймаут)');
                }
            }, 30000);
        }
    });
    
    console.log('✅ Пасхалка инициализирована');
}

function checkEasterEgg() {
    if (STATE.searchQuery.toUpperCase() === CONFIG.EASTER_EGG_CODE && STATE.logoClickCount >= 5) {
        activateEasterEgg();
        STATE.searchQuery = '';
        if (DOM.searchInput) {
            DOM.searchInput.value = '';
        }
        applyFilters();
    }
}

function activateEasterEgg() {
    if (STATE.isEasterEggActive) return;
    
    STATE.isEasterEggActive = true;
    document.body.classList.add('easter-egg-active');
    
    console.log('🎉🎉🎉 ПАСХАЛКА АКТИВИРОВАНА! 🎉🎉🎉');
    
    // Специальное уведомление
    showNotification('🎉 Пасхалка найдена! Специальный режим активирован', 'success');
    
    // Анимация для всех карточек товаров
    document.querySelectorAll('.product-card').forEach((card, index) => {
        setTimeout(() => {
            card.style.transform = 'rotateY(360deg)';
            card.style.transition = 'transform 1s ease';
            
            setTimeout(() => {
                card.style.transform = '';
            }, 1000);
        }, index * 100);
    });
    
    // Музыка или звук (опционально)
    try {
        const audio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAZGF0YQQ=');
        audio.volume = 0.1;
        audio.play().catch(() => {});
    } catch (e) {
        // Игнорируем ошибки аудио
    }
    
    // Автоматическое отключение через 10 секунд
    setTimeout(() => {
        deactivateEasterEgg();
    }, 10000);
}

function deactivateEasterEgg() {
    STATE.isEasterEggActive = false;
    document.body.classList.remove('easter-egg-active');
    STATE.logoClickCount = 0;
    
    showNotification('Пасхалка завершена', 'info');
    console.log('🎯 Пасхалка деактивирована');
}

// ============================================
// 11. МОДАЛЬНОЕ ОКНО ИЗОБРАЖЕНИЙ
// ============================================

function initImageModal() {
    if (!DOM.imageModal) return;
    
    // Показ модального окна
    window.showImageModal = function(productId) {
        const product = STATE.products.find(p => p.id === productId);
        if (!product) {
            console.error('❌ Товар не найден:', productId);
            return;
        }
        
        // Находим индекс товара в текущем фильтре
        STATE.currentModalImageIndex = STATE.filteredProducts.findIndex(p => p.id === productId);
        
        // Заполняем данные
        fillModalData(product);
        
        // Показываем модальное окно
        DOM.imageModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Добавляем обработчики клавиатуры
        document.addEventListener('keydown', handleModalKeydown);
        
        console.log('🖼️ Модальное окно открыто:', product.name);
    };
    
    // Закрытие модального окна
    DOM.modalClose.addEventListener('click', closeImageModal);
    
    // Клик по оверлею для закрытия
    DOM.imageModal.querySelector('.modal-overlay').addEventListener('click', closeImageModal);
    
    // Навигация по изображениям
    DOM.modalPrev.addEventListener('click', showPrevImage);
    DOM.modalNext.addEventListener('click', showNextImage);
    
    // Кнопка фильтра по категории
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
    
    // Основные данные
    DOM.modalImage.src = product.image;
    DOM.modalImage.alt = product.name;
    
    // Обработка ошибок для модального изображения
    DOM.modalImage.addEventListener('error', function() {
        if (this.src !== 'assets/images/placeholder.jpg' && this.src !== '/assets/images/placeholder.jpg') {
            this.src = 'assets/images/placeholder.jpg';
        }
    });
    
    DOM.modalProductName.textContent = product.name;
    DOM.modalProductPrice.textContent = formatPrice(product.price);
    DOM.modalProductDescription.textContent = product.description;
    DOM.modalProductCategory.textContent = getCategoryName(product.category);
    
    // Особенности
    DOM.modalProductFeatures.innerHTML = formatFeatures(product.features);
    
    // Устанавливаем категорию для кнопки фильтра
    if (DOM.modalCategoryFilter) {
        DOM.modalCategoryFilter.setAttribute('data-category', product.category);
        DOM.modalCategoryFilter.innerHTML = `
            <i class="fas fa-filter"></i>
            Показать все в категории "${getCategoryName(product.category)}"
        `;
    }
    
    // Показываем/скрываем кнопки навигации
    DOM.modalPrev.style.display = STATE.filteredProducts.length > 1 ? 'flex' : 'none';
    DOM.modalNext.style.display = STATE.filteredProducts.length > 1 ? 'flex' : 'none';
}

function showPrevImage() {
    if (STATE.filteredProducts.length <= 1) return;
    
    STATE.currentModalImageIndex--;
    if (STATE.currentModalImageIndex < 0) {
        STATE.currentModalImageIndex = STATE.filteredProducts.length - 1;
    }
    
    const product = STATE.filteredProducts[STATE.currentModalImageIndex];
    fillModalData(product);
    
    // Анимация
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
    
    // Анимация
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
        case 'ArrowLeft':
            showPrevImage();
            break;
        case 'ArrowRight':
            showNextImage();
            break;
        case 'Escape':
            closeImageModal();
            break;
    }
}

// ============================================
// 12. УВЕДОМЛЕНИЯ И СОСТОЯНИЯ
// ============================================

function showNotification(message, type = 'info') {
    // Удаляем старые уведомления
    const oldNotifications = document.querySelectorAll('.notification');
    oldNotifications.forEach(n => n.remove());
    
    // Создаем уведомление
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.setAttribute('role', 'alert');
    notification.setAttribute('aria-live', 'polite');
    
    document.body.appendChild(notification);
    
    // Автоматическое скрытие
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 3000);
    
    console.log(`📢 Уведомление: ${message}`);
}

function showLoading() {
    if (DOM.loadingState) {
        DOM.loadingState.style.display = 'flex';
    }
    if (DOM.catalogGrid) {
        DOM.catalogGrid.style.opacity = '0.5';
        DOM.catalogGrid.style.pointerEvents = 'none';
    }
}

function hideLoading() {
    if (DOM.loadingState) {
        DOM.loadingState.style.display = 'none';
    }
    if (DOM.catalogGrid) {
        DOM.catalogGrid.style.opacity = '1';
        DOM.catalogGrid.style.pointerEvents = 'auto';
    }
}

function showEmptyState() {
    if (DOM.emptyState) {
        DOM.emptyState.style.display = 'flex';
    }
    if (DOM.catalogGrid) {
        DOM.catalogGrid.style.display = 'none';
    }
}

function hideEmptyState() {
    if (DOM.emptyState) {
        DOM.emptyState.style.display = 'none';
    }
    if (DOM.catalogGrid) {
        DOM.catalogGrid.style.display = 'grid';
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
// 13. PWA И SERVICE WORKER
// ============================================

function initPWA() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/service-worker.js')
                .then(registration => {
                    console.log('✅ Service Worker зарегистрирован:', registration.scope);
                    
                    // Проверка обновлений
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        console.log('🔄 Найдено обновление Service Worker');
                        
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed') {
                                if (navigator.serviceWorker.controller) {
                                    // Новый контент доступен
                                    showNotification('Доступно обновление! Обновите страницу.', 'info');
                                }
                            }
                        });
                    });
                })
                .catch(error => {
                    console.log('⚠️ Service Worker не зарегистрирован:', error);
                });
        });
    }
    
    // Проверка установки PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
        document.body.classList.add('pwa-installed');
        console.log('📱 Запущено как PWA');
    }
    
    // Офлайн-статус
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
// 14. НАСТРОЙКА ОБРАБОТЧИКОВ СОБЫТИЙ
// ============================================

function setupEventListeners() {
    // Кнопка сброса фильтров (в empty state)
    if (DOM.resetFiltersBtn) {
        DOM.resetFiltersBtn.addEventListener('click', resetFilters);
    }
    
    // Новая кнопка сброса фильтров (в catalog controls)
    if (DOM.resetFiltersCatalogBtn) {
        DOM.resetFiltersCatalogBtn.addEventListener('click', resetFilters);
        console.log('✅ Кнопка сброса фильтров в catalog controls подключена');
    }
    
    // Переключатель темы
    if (DOM.themeToggle) {
        DOM.themeToggle.addEventListener('click', toggleTheme);
    }
    
    // Кнопки фильтров в категориях
    DOM.categoryFilterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterProductsByCategory(btn.dataset.category);
        });
    });
    
    // Кнопки фильтров в футере
    DOM.footerCategoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterProductsByCategory(btn.dataset.category);
        });
    });
    
    // Навигация по категориям
    DOM.categoryLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            filterProductsByCategory(link.dataset.category);
        });
    });
    
    // Кнопка "Наверх"
    if (DOM.backToTop) {
        DOM.backToTop.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
    
    // Инициализация компонентов
    initSorting();
    initViewToggle();
    initSearch();
    initMobileMenu();
    initImageModal();
    initEasterEgg();
    initScrollHeader();
    initPWA();
    
    // Обновление года в футере
    const yearElement = document.getElementById('currentYear');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
    
    // Кнопка скролла в футере
    const footerScrollTop = document.getElementById('footerScrollTop');
    if (footerScrollTop) {
        footerScrollTop.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
    
    // Обработка внешних ссылок
    document.querySelectorAll('a[href^="http"]').forEach(link => {
        if (!link.href.includes(window.location.hostname)) {
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer');
        }
    });

    // Обработчики для быстрого выбора категорий
    document.querySelectorAll('.quick-select-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            filterProductsByCategory(btn.dataset.category);
        });
    });
    
    console.log('✅ Все обработчики событий настроены');
}

// ============================================
// 15. ОСНОВНАЯ ИНИЦИАЛИЗАЦИЯ
// ============================================

async function init() {
    console.log('🚀 Инициализация каталога «Ортоцентр» версии 3.2...');
    
    try {
        // 1. Инициализируем ссылки на DOM элементы
        initDOMReferences();
        
        // 2. Инициализируем тему
        initTheme();
        
        // 3. Загружаем товары
        await loadProducts();
        
        // 4. Устанавливаем заголовок страницы с количеством товаров
        document.title = `Ортоцентр | ${STATE.products.length} товаров`;
        
        console.log('✅ Каталог готов к работе!');
        console.log('📊 Статистика:', {
            товаров: STATE.products.length,
            категорий: 4,
            тема: STATE.currentTheme,
            вид: STATE.currentView,
            версия: '3.2'
        });
        
    } catch (error) {
        console.error('❌ Критическая ошибка инициализации:', error);
        showError('Критическая ошибка при загрузке каталога');
    }
}

// ============================================
// 16. ЗАПУСК ПРИЛОЖЕНИЯ
// ============================================

// Запуск когда DOM готов
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Обработка ошибок
window.addEventListener('error', function(event) {
    console.error('🚨 Глобальная ошибка:', event.error);
});

window.addEventListener('unhandledrejection', function(event) {
    console.error('🚨 Необработанный Promise:', event.reason);
});

// Экспортируем функции для глобального доступа
window.CatalogApp = {
    STATE,
    toggleTheme,
    resetFilters,
    showImageModal,
    filterProductsByCategory,
    setTheme: (theme) => setTheme(theme),
    getVersion: () => '3.2'
};


console.log('📦 CatalogApp v3.2 загружен');


