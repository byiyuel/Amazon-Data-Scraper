const els = {
  keyword: document.getElementById('keyword'),
  category: document.getElementById('category'),
  market: document.getElementById('market'),
  minPrice: document.getElementById('minPrice'),
  maxPrice: document.getElementById('maxPrice'),
  primeOnly: document.getElementById('primeOnly'),
  nonPrimeOnly: document.getElementById('nonPrimeOnly'),
  maxPages: document.getElementById('maxPages'),
  maxProducts: document.getElementById('maxProducts'),
  rateLimitMs: document.getElementById('rateLimitMs'),
  maxConcurrent: document.getElementById('maxConcurrent'),
  exportMode: document.getElementById('exportMode'),
  apiUrl: document.getElementById('apiUrl'),
  apiToken: document.getElementById('apiToken'),
  start: document.getElementById('start'),
  logs: document.getElementById('logs'),
  apiRow: document.getElementById('apiRow'),
  tokenRow: document.getElementById('tokenRow'),
  progressInner: document.getElementById('progressInner'),
  statusStage: document.getElementById('statusStage'),
  statusCurrent: document.getElementById('statusCurrent'),
  statusTotal: document.getElementById('statusTotal')
};

function appendLog(message) {
  if (!els.logs) return;
  const time = new Date().toLocaleTimeString();
  const line = document.createElement('div');
  line.textContent = `[${time}] ${message}`;
  els.logs.appendChild(line);
  els.logs.scrollTop = els.logs.scrollHeight;
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === 'LOG') {
    appendLog(msg.message);
  }
  if (msg?.type === 'PROGRESS') {
    const { stage, current, total, percent, note } = msg;
    if (typeof percent === 'number' && els.progressInner) {
      els.progressInner.style.width = `${Math.max(0, Math.min(100, percent))}%`;
    }
    if (typeof current === 'number' && els.statusCurrent) els.statusCurrent.textContent = String(current);
    if (typeof total === 'number' && els.statusTotal) els.statusTotal.textContent = String(total);
    if (stage && els.statusStage) els.statusStage.textContent = stage;
    if (note) appendLog(note);
  }
});

function updateExportVisibility() {
  if (!els.exportMode) return;
  const isApi = els.exportMode.value === 'API';
  if (els.apiRow) {
    els.apiRow.style.display = isApi ? 'block' : 'none';
    els.apiRow.className = isApi ? 'form-row api-fields' : 'form-row api-fields';
  }
  if (els.tokenRow) {
    els.tokenRow.style.display = isApi ? 'block' : 'none';
    els.tokenRow.className = isApi ? 'form-row api-fields' : 'form-row api-fields';
  }
}

// Handle Prime filter conflicts
function handlePrimeFilters() {
  if (!els.primeOnly || !els.nonPrimeOnly) return;
  if (els.primeOnly.checked && els.nonPrimeOnly.checked) {
    if (this === els.primeOnly) {
      els.nonPrimeOnly.checked = false;
    } else {
      els.primeOnly.checked = false;
    }
  }
}

// Language translations
const translations = {
  en: {
    appTitle: 'Amazon Pro Scraper',
    appSubtitle: 'Professional Amazon Data Extraction Tool',
    searchConfig: 'Search Configuration',
    searchKeywords: 'Search Keywords',
    searchPlaceholder: 'e.g. wireless bluetooth headphones',
    targetMarket: 'Target Market',
    productCategory: 'Product Category',
    allDepartments: 'All Departments',
    electronics: 'Electronics',
    fashion: 'Fashion',
    toysGames: 'Toys & Games',
    garden: 'Garden & Outdoor',
    smartFilters: 'Smart Filters',
    minimumPrice: 'Minimum Price',
    maximumPrice: 'Maximum Price',
    noLimit: 'No limit',
    primeOnly: 'Prime Products Only',
    excludePrime: 'Exclude Prime Products',
    performanceSettings: 'Performance Settings',
    maxPages: 'Max Pages to Scan',
    maxProducts: 'Max Products to Extract',
    delayRequests: 'Delay Between Requests (ms)',
    concurrentTabs: 'Concurrent Tabs',
    exportOptions: 'Export Options',
    outputFormat: 'Output Format',
    csvSpreadsheet: 'CSV Spreadsheet',
    apiIntegration: 'API Integration',
    apiEndpoint: 'API Endpoint URL',
    authToken: 'Authorization Token',
    tokenPlaceholder: 'Bearer your-api-token...',
    liveProgress: 'Live Progress',
    readyToStart: 'Ready to Start',
    products: 'products',
    startExtraction: 'Start Professional Extraction',
    language: 'Language'
  },
  tr: {
    appTitle: 'Amazon Pro Scraper',
    appSubtitle: 'Profesyonel Amazon Veri Çıkarım Aracı',
    searchConfig: 'Arama Yapılandırması',
    searchKeywords: 'Arama Anahtar Kelimeleri',
    searchPlaceholder: 'örn. kablosuz bluetooth kulaklık',
    targetMarket: 'Hedef Pazar',
    productCategory: 'Ürün Kategorisi',
    allDepartments: 'Tüm Departmanlar',
    electronics: 'Elektronik',
    fashion: 'Moda',
    toysGames: 'Oyuncak ve Oyun',
    garden: 'Bahçe ve Dış Mekan',
    smartFilters: 'Akıllı Filtreler',
    minimumPrice: 'Minimum Fiyat',
    maximumPrice: 'Maksimum Fiyat',
    noLimit: 'Sınır yok',
    primeOnly: 'Sadece Prime Ürünler',
    excludePrime: 'Prime Ürünleri Hariç Tut',
    performanceSettings: 'Performans Ayarları',
    maxPages: 'Taranacak Maksimum Sayfa',
    maxProducts: 'Çıkarılacak Maksimum Ürün',
    delayRequests: 'İstekler Arası Gecikme (ms)',
    concurrentTabs: 'Eşzamanlı Sekmeler',
    exportOptions: 'Dışa Aktarım Seçenekleri',
    outputFormat: 'Çıktı Formatı',
    csvSpreadsheet: 'CSV Elektronik Tablo',
    apiIntegration: 'API Entegrasyonu',
    apiEndpoint: 'API Uç Nokta URL\'si',
    authToken: 'Yetkilendirme Tokeni',
    tokenPlaceholder: 'Bearer your-api-token...',
    liveProgress: 'Canlı İlerleme',
    readyToStart: 'Başlamaya Hazır',
    products: 'ürün',
    startExtraction: 'Profesyonel Çıkarımı Başlat',
    language: 'Dil'
  }
};

// Currency symbols by market
const currencyByMarket = {
  'www.amazon.com': '$',
  'www.amazon.ca': 'C$',
  'www.amazon.co.uk': '£',
  'www.amazon.de': '€',
  'www.amazon.fr': '€',
  'www.amazon.it': '€',
  'www.amazon.es': '€',
  'www.amazon.com.tr': '₺',
  'www.amazon.ae': 'د.إ',
  'www.amazon.in': '₹',
  'www.amazon.com.au': 'A$',
  'www.amazon.co.jp': '¥'
};

// Current language
let currentLanguage = 'en';

function updateLanguage(lang) {
  currentLanguage = lang;
  const t = translations[lang];
  
  // Update all text elements
  const elements = {
    'appTitle': document.querySelector('h1'),
    'appSubtitle': document.querySelector('.subtitle'),
    'searchConfig': document.querySelector('.search-section .section-title'),
    'searchKeywords': document.querySelector('label[for="keyword"]'),
    'targetMarket': document.querySelector('label[for="market"]'),
    'productCategory': document.querySelector('label[for="category"]'),
    'smartFilters': document.querySelector('.filter-section .section-title'),
    'performanceSettings': document.querySelector('.settings-section .section-title'),
    'exportOptions': document.querySelector('.export-section .section-title'),
    'liveProgress': document.querySelector('.progress-section .section-title'),
    'startExtraction': document.querySelector('#start')
  };
  
  // Update main elements
  Object.entries(elements).forEach(([key, element]) => {
    if (element && t[key]) {
      element.textContent = t[key];
    }
  });
  
  // Update form labels
  const labelUpdates = [
    ['keyword', 'searchKeywords'],
    ['market', 'targetMarket'], 
    ['category', 'productCategory'],
    ['maxPages', 'maxPages'],
    ['maxProducts', 'maxProducts'],
    ['rateLimitMs', 'delayRequests'],
    ['maxConcurrent', 'concurrentTabs'],
    ['exportMode', 'outputFormat'],
    ['apiUrl', 'apiEndpoint'],
    ['apiToken', 'authToken']
  ];
  
  labelUpdates.forEach(([fieldId, translationKey]) => {
    const label = document.querySelector(`label[for="${fieldId}"]`);
    if (label && t[translationKey]) {
      label.textContent = t[translationKey];
    }
  });
  
  // Update category options
  const categorySelect = document.getElementById('category');
  if (categorySelect) {
    const options = categorySelect.querySelectorAll('option');
    if (options[0]) options[0].textContent = `🛍️ ${t.allDepartments}`;
    if (options[1]) options[1].textContent = `💻 ${t.electronics}`;
    if (options[2]) options[2].textContent = `👕 ${t.fashion}`;
    if (options[3]) options[3].textContent = `🎮 ${t.toysGames}`;
    if (options[4]) options[4].textContent = `🌱 ${t.garden}`;
  }
  
  // Update export mode options
  const exportSelect = document.getElementById('exportMode');
  if (exportSelect) {
    const options = exportSelect.querySelectorAll('option');
    if (options[0]) options[0].textContent = `📈 ${t.csvSpreadsheet}`;
    if (options[1]) options[1].textContent = `🔗 ${t.apiIntegration}`;
  }
  
  // Update checkbox labels
  const primeLabel = document.querySelector('label[for="primeOnly"]');
  const nonPrimeLabel = document.querySelector('label[for="nonPrimeOnly"]');
  if (primeLabel) primeLabel.textContent = t.primeOnly;
  if (nonPrimeLabel) nonPrimeLabel.textContent = t.excludePrime;
  
  // Update placeholders
  const keywordInput = document.getElementById('keyword');
  const apiTokenInput = document.getElementById('apiToken');
  if (keywordInput) keywordInput.placeholder = t.searchPlaceholder;
  if (apiTokenInput) apiTokenInput.placeholder = t.tokenPlaceholder;
  
  // Update status
  const statusStage = document.getElementById('statusStage');
  if (statusStage && statusStage.textContent.includes('Ready')) {
    statusStage.textContent = t.readyToStart;
  }
  
  // Update currency labels
  updateCurrencyLabels();
  
  // Save language preference
  chrome.storage.sync.set({ language: lang });
}

function updateCurrencyLabels() {
  if (!els.market) return;
  const selectedMarket = els.market.value;
  const currencySymbol = currencyByMarket[selectedMarket] || '$';
  const t = translations[currentLanguage];
  
  // Update price field labels
  const minPriceLabel = document.getElementById('minPriceLabel');
  const maxPriceLabel = document.getElementById('maxPriceLabel');
  
  if (minPriceLabel && t) {
    minPriceLabel.textContent = `${t.minimumPrice} (${currencySymbol})`;
  }
  if (maxPriceLabel && t) {
    maxPriceLabel.textContent = `${t.maximumPrice} (${currencySymbol})`;
  }
  
  // Update placeholders
  if (els.minPrice) els.minPrice.placeholder = `0.00 ${currencySymbol}`;
  if (els.maxPrice && t) els.maxPrice.placeholder = t.noLimit;
}

// Add language selector to elements
els.languageSelect = document.getElementById('languageSelect');

if (els.primeOnly) els.primeOnly.addEventListener('change', handlePrimeFilters);
if (els.nonPrimeOnly) els.nonPrimeOnly.addEventListener('change', handlePrimeFilters);
if (els.exportMode) els.exportMode.addEventListener('change', updateExportVisibility);
if (els.market) els.market.addEventListener('change', updateCurrencyLabels);
if (els.languageSelect) els.languageSelect.addEventListener('change', (e) => updateLanguage(e.target.value));

// Load saved language
chrome.storage.sync.get(['language']).then(({ language }) => {
  const savedLanguage = language || 'en';
  currentLanguage = savedLanguage;
  if (els.languageSelect) els.languageSelect.value = savedLanguage;
  updateLanguage(savedLanguage);
});

updateExportVisibility();

// Load saved settings
chrome.storage.sync.get(['settings']).then(({ settings }) => {
  if (!settings) return;
  for (const [key, value] of Object.entries(settings)) {
    if (key in els && els[key] instanceof HTMLInputElement) {
      const input = els[key];
      if (input.type === 'checkbox') input.checked = !!value; else input.value = value ?? '';
    } else if (key in els && els[key] instanceof HTMLSelectElement) {
      els[key].value = value ?? '';
    }
  }
  updateExportVisibility();
});

function collectSettings() {
  return {
    keyword: els.keyword?.value?.trim() || '',
    market: els.market?.value || 'www.amazon.com',
    category: els.category?.value || 'aps',
    minPrice: els.minPrice?.value ? Number(els.minPrice.value) : undefined,
    maxPrice: els.maxPrice?.value ? Number(els.maxPrice.value) : undefined,
    primeOnly: els.primeOnly?.checked || false,
    nonPrimeOnly: els.nonPrimeOnly?.checked || false,
    maxPages: els.maxPages?.value ? Number(els.maxPages.value) : undefined,
    maxProducts: els.maxProducts?.value ? Number(els.maxProducts.value) : undefined,
    rateLimitMs: els.rateLimitMs?.value ? Number(els.rateLimitMs.value) : 1000,
    maxConcurrent: els.maxConcurrent?.value ? Number(els.maxConcurrent.value) : 3,
    exportMode: els.exportMode?.value || 'CSV',
    apiUrl: els.apiUrl?.value?.trim() || '',
    apiToken: els.apiToken?.value?.trim() || ''
  };
}

if (els.start) {
  els.start.addEventListener('click', async () => {
    const payload = collectSettings();
    els.start.disabled = true;
    appendLog('Starting...');
    await chrome.storage.sync.set({ settings: payload });
    chrome.runtime.sendMessage({ type: 'START_SCRAPE', payload }, (resp) => {
      els.start.disabled = false;
      if (!resp?.ok) {
        appendLog('Hata: ' + (resp?.error || 'Bilinmeyen'));
      } else {
        appendLog('Tamamlandı. Ürün sayısı: ' + (resp?.result?.productsCount ?? 0));
      }
    });
  });
}


