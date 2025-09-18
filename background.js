// Simple logger to send updates to popup
function logToPopup(message) {
  try {
    chrome.runtime.sendMessage({ type: 'LOG', message });
  } catch (error) {
    // ignore if no listeners
  }
}

function progressToPopup(progress) {
  try {
    chrome.runtime.sendMessage({ type: 'PROGRESS', ...progress });
  } catch (e) {}
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Semaphore for controlling concurrent operations
class Semaphore {
  constructor(count) {
    this.count = count;
    this.waiting = [];
  }
  
  async acquire() {
    return new Promise((resolve) => {
      if (this.count > 0) {
        this.count--;
        resolve();
      } else {
        this.waiting.push(resolve);
      }
    });
  }
  
  release() {
    this.count++;
    if (this.waiting.length > 0) {
      const resolve = this.waiting.shift();
      this.count--;
      resolve();
    }
  }
}

// Adaptive rate limiter
class AdaptiveRateLimiter {
  constructor(initialDelay = 1000, maxDelay = 5000) {
    this.currentDelay = initialDelay;
    this.initialDelay = initialDelay;
    this.maxDelay = maxDelay;
    this.successCount = 0;
    this.errorCount = 0;
  }
  
  async wait() {
    await delay(this.currentDelay);
  }
  
  onSuccess() {
    this.successCount++;
    this.errorCount = 0;
    // Decrease delay if consistently successful
    if (this.successCount > 3) {
      this.currentDelay = Math.max(this.initialDelay, this.currentDelay * 0.9);
      this.successCount = 0;
    }
  }
  
  onError() {
    this.errorCount++;
    this.successCount = 0;
    // Increase delay on errors
    this.currentDelay = Math.min(this.maxDelay, this.currentDelay * 1.5);
  }
  
  getCurrentDelay() {
    return this.currentDelay;
  }
}

async function executeContentScript(tabId, file, args) {
  const [result] = await chrome.scripting.executeScript({
    target: { tabId },
    files: [file]
  });
  return result?.result || null;
}

async function waitForTabComplete(tabId) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      reject(new Error('Tab load timeout'));
    }, 60000);

    function listener(updatedTabId, info) {
      if (updatedTabId === tabId && info.status === 'complete') {
        clearTimeout(timeout);
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    }

    chrome.tabs.onUpdated.addListener(listener);
  });
}

function buildAmazonSearchUrl({ market, keyword, minPrice, maxPrice, category, primeOnly }) {
  const domain = market || 'www.amazon.com';
  const baseUrl = new URL(`https://${domain}/s`);
  if (keyword) baseUrl.searchParams.set('k', keyword);
  if (minPrice) baseUrl.searchParams.set('low-price', String(minPrice));
  if (maxPrice) baseUrl.searchParams.set('high-price', String(maxPrice));
  baseUrl.searchParams.set('i', category || 'aps');
  // Prime filter via rh param
  if (primeOnly) {
    const existingRh = baseUrl.searchParams.get('rh');
    const rh = existingRh ? `${existingRh},p_85:2470955011` : 'p_85:2470955011';
    baseUrl.searchParams.set('rh', rh);
  }
  return baseUrl.toString();
}

async function scrapeListingPagesAndQueue({ startUrl, maxPages, maxProducts, rateLimitMs }) {
  const createdTab = await chrome.tabs.create({ url: startUrl, active: false });
  const tabId = createdTab.id;
  const productQueue = [];
  let currentPage = 0;
  try {
    while (true) {
      currentPage += 1;
      logToPopup(`Scraping listing page ${currentPage}...`);
      await waitForTabComplete(tabId);
      const listingResult = await executeContentScript(tabId, 'content/amazon_listing.js');
      if (!listingResult) break;
      const { productLinks, nextPageUrl } = listingResult;

      for (const link of productLinks) {
        if (maxProducts && productQueue.length >= maxProducts) break;
        productQueue.push(link);
      }

      logToPopup(`Found ${productLinks.length} products on page ${currentPage}. Queue size: ${productQueue.length}.`);

      if ((maxPages && currentPage >= maxPages) || !nextPageUrl || (maxProducts && productQueue.length >= maxProducts)) {
        break;
      }

      await chrome.tabs.update(tabId, { url: nextPageUrl });
      if (rateLimitMs) await delay(rateLimitMs);
    }
  } finally {
    try { await chrome.tabs.remove(tabId); } catch (e) {}
  }

  return productQueue;
}

async function scrapeProductPage(url, rateLimiter, semaphore) {
  await semaphore.acquire();
  const tab = await chrome.tabs.create({ url, active: false });
  const tabId = tab.id;
  try {
    await waitForTabComplete(tabId);
    const data = await executeContentScript(tabId, 'content/amazon_product.js');
    rateLimiter.onSuccess();
    await rateLimiter.wait();
    return data;
  } catch (error) {
    rateLimiter.onError();
    await rateLimiter.wait();
    throw error;
  } finally {
    try { await chrome.tabs.remove(tabId); } catch (e) {}
    semaphore.release();
  }
}

async function scrapeProductsConcurrently(urls, rateLimitMs, nonPrimeOnly, maxConcurrent = 3) {
  const rateLimiter = new AdaptiveRateLimiter(rateLimitMs || 1000);
  const semaphore = new Semaphore(maxConcurrent);
  const products = [];
  let processed = 0;
  let filtered = 0;
  
  // Process in batches to avoid overwhelming the browser
  const batchSize = Math.min(maxConcurrent * 2, 10);
  
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    logToPopup(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(urls.length / batchSize)} (${batch.length} products)`);
    
    const promises = batch.map(async (url) => {
      processed++;
      progressToPopup({ 
        stage: 'Ürün çekiliyor', 
        current: processed, 
        total: urls.length, 
        percent: 20 + Math.floor((processed / Math.max(1, urls.length)) * 70) 
      });
      
      try {
        const data = await scrapeProductPage(url, rateLimiter, semaphore);
        if (data) {
          // Apply Prime/Non-Prime filter
          if (nonPrimeOnly && data.prime) {
            filtered++;
            logToPopup(`Filtered out Prime product: ${data.title || data.asin}`);
            return null;
          }
          return data;
        }
        return null;
      } catch (e) {
        logToPopup(`Failed product scrape: ${e.message}`);
        return null;
      }
    });
    
    const results = await Promise.allSettled(promises);
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        products.push(result.value);
      }
    }
    
    // Log current rate limiter status
    logToPopup(`Current delay: ${Math.round(rateLimiter.getCurrentDelay())}ms`);
  }
  
  if (filtered > 0) {
    logToPopup(`Filtered out ${filtered} Prime products (Non-Prime only mode).`);
  }
  
  return products;
}

function toCsv(products) {
  const headers = [
    'asin','title','price','currency','inStock','seller','category','prime','url','imageUrls','description'
  ];
  const escape = (val) => {
    if (val === undefined || val === null) return '';
    const str = String(val).replace(/\r?\n|\r/g, ' ').trim();
    if (str.includes('"') || str.includes(',') || str.includes('\n')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  };
  const rows = [headers.join(',')];
  for (const p of products) {
    rows.push([
      escape(p.asin),
      escape(p.title),
      escape(p.price),
      escape(p.currency || 'USD'),
      escape(p.inStock),
      escape(p.seller),
      escape(p.category),
      escape(p.prime),
      escape(p.url),
      escape((p.images || []).join(' ')),
      escape(p.description)
    ].join(','));
  }
  return rows.join('\n');
}

async function downloadCsvFile(filename, csvContent) {
  const dataUrl = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
  await chrome.downloads.download({ url: dataUrl, filename, saveAs: true });
}

async function exportToApi({ apiUrl, apiToken, products, batchSize = 20, rateLimitMs = 500 }) {
  if (!apiUrl) throw new Error('API URL is required for API export');
  let index = 0;
  while (index < products.length) {
    const batch = products.slice(index, index + batchSize);
    logToPopup(`Posting batch ${index / batchSize + 1} (${batch.length} items) ...`);
    const headers = { 'Content-Type': 'application/json' };
    if (apiToken) headers['Authorization'] = `Bearer ${apiToken}`;
    try {
      await fetch(apiUrl, { method: 'POST', headers, body: JSON.stringify(batch) });
    } catch (e) {
      logToPopup(`API error: ${e.message}`);
    }
    index += batch.length;
    if (rateLimitMs) await delay(rateLimitMs);
  }
}

async function startScrape(payload) {
  const {
    keyword,
    market,
    minPrice,
    maxPrice,
    category,
    primeOnly,
    nonPrimeOnly,
    maxPages,
    maxProducts,
    rateLimitMs = 1000,
    maxConcurrent = 3,
    exportMode = 'CSV',
    apiUrl,
    apiToken
  } = payload;

  const startUrl = buildAmazonSearchUrl({ market, keyword, minPrice, maxPrice, category, primeOnly });
  logToPopup('Starting scrape: ' + startUrl);
  progressToPopup({ stage: 'Aranıyor', current: 0, total: 0, percent: 5, note: 'Arama başlatıldı' });

  const queue = await scrapeListingPagesAndQueue({ startUrl, maxPages, maxProducts, rateLimitMs });
  logToPopup(`Queued ${queue.length} product pages.`);
  progressToPopup({ stage: 'Ürünler kuyruklandı', current: 0, total: queue.length, percent: 20 });

  // Use concurrent scraping for better performance
  const products = await scrapeProductsConcurrently(queue, rateLimitMs, nonPrimeOnly, maxConcurrent);

  logToPopup(`Collected ${products.length} products. Export mode: ${exportMode}`);

  if (exportMode === 'API') {
    progressToPopup({ stage: 'API aktarımı', current: products.length, total: products.length, percent: 95 });
    await exportToApi({ apiUrl, apiToken, products });
    logToPopup('API export complete.');
  } else {
    progressToPopup({ stage: 'CSV hazırlanıyor', current: products.length, total: products.length, percent: 95 });
    const csv = toCsv(products);
    const safeKeyword = (keyword || 'amazon').replace(/[^a-z0-9-_]+/gi, '_').toLowerCase();
    const filename = `amazon_${safeKeyword}_${Date.now()}.csv`;
    await downloadCsvFile(filename, csv);
    logToPopup('CSV download triggered.');
  }

  progressToPopup({ stage: 'Bitti', current: products.length, total: products.length, percent: 100, note: 'İşlem tamamlandı' });
  return { productsCount: products.length };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === 'START_SCRAPE') {
    startScrape(message.payload)
      .then((res) => sendResponse({ ok: true, result: res }))
      .catch((err) => sendResponse({ ok: false, error: err?.message || String(err) }));
    return true; // keep channel open
  }
  
});

// Handle extension icon click to open side panel
chrome.action.onClicked.addListener(async (tab) => {
  await chrome.sidePanel.open({ windowId: tab.windowId });
});

// Enable side panel globally (always available)
chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});


