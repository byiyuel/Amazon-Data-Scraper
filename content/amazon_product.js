(function () {
  function text(selectorList) {
    for (const selector of selectorList) {
      const el = document.querySelector(selector);
      if (el && el.textContent) return el.textContent.trim();
    }
    return '';
  }

  function pickPrice() {
    const candidates = [
      '#corePrice_feature_div .a-offscreen',
      '#priceblock_ourprice',
      '#priceblock_dealprice',
      '#sns-base-price',
      '#newBuyBoxPrice',
      '.a-price .a-offscreen',
      '.a-price-whole',
      '#apex_desktop .a-price .a-offscreen',
      '#buybox .a-price .a-offscreen',
      '.a-price-range .a-offscreen'
    ];
    
    const t = text(candidates);
    if (!t) return { price: '', currency: '' };
    
    // Enhanced currency mapping with more symbols and patterns
    const currencyMap = {
      '$': 'USD', '€': 'EUR', '£': 'GBP', '¥': 'JPY', '₹': 'INR',
      '₺': 'TRY', 'د.إ': 'AED', 'C$': 'CAD', 'A$': 'AUD', '¢': 'USD',
      'USD': 'USD', 'EUR': 'EUR', 'GBP': 'GBP', 'JPY': 'JPY', 
      'TRY': 'TRY', 'AED': 'AED', 'CAD': 'CAD', 'AUD': 'AUD',
      'TL': 'TRY', 'DH': 'AED'
    };
    
    // Try multiple regex patterns for different currency formats
    let match = t.match(/([$€£¥₹₺¢])\s*([0-9,.]+)/);
    if (!match) match = t.match(/([A-Z]{3})\s*([0-9,.]+)/); // USD 123.45
    if (!match) match = t.match(/([0-9,.]+)\s*([$€£¥₹₺¢TL|DH])/); // 123.45 €
    if (!match) match = t.match(/(د\.إ|C\$|A\$)\s*([0-9,.]+)/); // Special symbols
    if (!match) match = t.match(/([0-9,.]+)\s*([A-Z]{3})/); // 123.45 USD
    
    if (match) {
      const symbol = match[1];
      const amount = match[2];
      const currency = currencyMap[symbol] || symbol;
      return { price: amount, currency };
    }
    
    // If no currency found, try to infer from domain
    const domain = window.location.hostname;
    let defaultCurrency = 'USD';
    if (domain.includes('.co.uk')) defaultCurrency = 'GBP';
    else if (domain.includes('.de') || domain.includes('.fr') || domain.includes('.it') || domain.includes('.es')) defaultCurrency = 'EUR';
    else if (domain.includes('.com.tr')) defaultCurrency = 'TRY';
    else if (domain.includes('.ae')) defaultCurrency = 'AED';
    else if (domain.includes('.in')) defaultCurrency = 'INR';
    else if (domain.includes('.ca')) defaultCurrency = 'CAD';
    else if (domain.includes('.com.au')) defaultCurrency = 'AUD';
    else if (domain.includes('.co.jp')) defaultCurrency = 'JPY';
    
    // Extract just numbers if currency symbol not found
    const numMatch = t.match(/([0-9,.]+)/);
    return {
      price: numMatch ? numMatch[1] : t,
      currency: defaultCurrency
    };
  }

  function getAsin() {
    const meta = document.querySelector('#ASIN');
    if (meta && meta.value) return meta.value;
    const urlMatch = location.href.match(/\/dp\/([A-Z0-9]{10})/i);
    if (urlMatch) return urlMatch[1];
    const detailBullets = document.querySelector('#detailBullets_feature_div');
    if (detailBullets) {
      const asinLi = Array.from(detailBullets.querySelectorAll('li')).find(li => /ASIN/i.test(li.textContent || ''));
      if (asinLi) {
        const txt = asinLi.textContent || '';
        const mt = txt.match(/([A-Z0-9]{10})/);
        if (mt) return mt[1];
      }
    }
    return '';
  }

  function getImages() {
    const images = new Set();
    const imgEls = document.querySelectorAll('#altImages img, #imgTagWrapperId img, img[src*="images-I"][srcset], img[src*="SL1500"]');
    imgEls.forEach((img) => {
      let src = img.getAttribute('data-old-hires') || img.getAttribute('data-src') || img.src || '';
      if (!src) return;
      // Upgrade to full size when possible
      src = src.replace(/_SR\d{2,4},\d{2,4}_/g, '').replace(/_SS\d{2,4}_/g, '').replace(/._AC_..../g, '');
      images.add(src);
    });
    return Array.from(images);
  }

  function getStock() {
    const availabilityEl = document.querySelector('#availability, #availabilityInsideBuyBox_feature_div, #outOfStock');
    const availabilityText = (availabilityEl?.textContent || '').trim();

    const positivePhrases = [
      'in stock', 'available', 'ready to ship',
      'stokta', 'stokta var',
      'auf lager', 'lieferbar',
      'en stock', 'disponible',
      'disponibile',
      'disponible',
      'em estoque',
      '現在在庫あり', '在庫あり',
      '有庫存', '有货'
    ];
    const negativePhrases = [
      'out of stock', 'unavailable', 'temporarily unavailable', 'currently unavailable',
      'stokta yok', 'geçici olarak temin edilemiyor',
      'nicht auf lager', 'derzeit nicht verfügbar', 'momentan nicht verfügbar',
      'actuellement indisponible', 'indisponible',
      'non disponibile',
      'no disponible',
      'sem estoque',
      '一時的に在庫切れ', '在庫切れ',
      '无货', '暂时无货'
    ];

    const textLower = availabilityText.toLowerCase();
    const hasPositive = positivePhrases.some(p => textLower.includes(p));
    const hasNegative = negativePhrases.some(p => textLower.includes(p));

    const addToCartBtn = document.querySelector('#add-to-cart-button, #buy-now-button');
    const addToCartVisible = !!(addToCartBtn && !addToCartBtn.hasAttribute('disabled') && addToCartBtn.offsetParent !== null);

    const inStock = (addToCartVisible || hasPositive) && !hasNegative;
    return { inStock, availabilityText };
  }

  function getSeller() {
    // 1) Direct seller profile trigger
    const trigger = document.querySelector('#sellerProfileTriggerId');
    if (trigger && trigger.textContent) return trigger.textContent.trim();

    // 2) Tabular buybox (new layout)
    const buyboxContainers = Array.from(document.querySelectorAll('#tabular-buybox .tabular-buybox-container, #tabular-buybox [tabular-attribute-name]'));
    for (const container of buyboxContainers) {
      const textContent = (container.getAttribute('tabular-attribute-name') || container.textContent || '').toLowerCase();
      if (/sold by|vendu par|verkauft|venditore|vendedor|satıcı/.test(textContent)) {
        const link = container.querySelector('a[href*="/sp?"] , a[href*="/stores/"], a[href*="/seller/"], a[href*="/s?me="]');
        if (link && link.textContent) return link.textContent.trim();
        const t = container.textContent?.split(':').pop()?.trim();
        if (t) return t;
      }
    }

    // 3) Merchant info block
    const merchant = document.querySelector('#merchant-info');
    if (merchant) {
      const link = merchant.querySelector('a[href*="/sp?"], a[href*="/stores/"], a[href*="/seller/"], a[href*="/s?me="]');
      if (link && link.textContent) return link.textContent.trim();
      const txt = merchant.textContent || '';
      // Try extracting between "Sold by" and a period
      const mt = txt.match(/Sold by\s+([^.|,]+)/i) || txt.match(/Vendu par\s+([^.|,]+)/i) || txt.match(/Verkauf.*?durch\s+([^.|,]+)/i) || txt.match(/Satıcı[:\s]+([^.|,]+)/i);
      if (mt) return mt[1].trim();
    }

    // 4) Fallback to Amazon if fulfilled by Amazon appears
    const fba = document.querySelector('#fulfillerBadge_feature_div, .fulfilled-by-amazon, .a-icon-prime');
    if (fba) return 'Amazon';

    return '';
  }

  function getCategory() {
    const crumbs = Array.from(document.querySelectorAll('#wayfinding-breadcrumbs_feature_div ul a'))
      .map(a => (a.textContent || '').trim())
      .filter(Boolean);
    return crumbs.join(' > ');
  }

  function getDescription() {
    const bullets = Array.from(document.querySelectorAll('#feature-bullets li'))
      .map(li => (li.textContent || '').trim())
      .filter(Boolean)
      .join(' | ');
    const dp = document.querySelector('#productDescription')?.textContent?.trim() || '';
    return [bullets, dp].filter(Boolean).join(' | ');
  }

  const title = text(['#productTitle', '#title']);
  const { price, currency } = pickPrice();
  const { inStock } = getStock();
  const seller = getSeller();
  const images = getImages();
  const asin = getAsin();
  const category = getCategory();
  const description = getDescription();
  function getPrime() {
    // Direct Prime icon/badge selectors
    const primeSelectors = [
      '#primeBadgeIcon',
      '.a-icon-prime',
      '.prime-tag',
      '.a-icon-prime-badge', 
      '.prime-logo',
      'i[aria-label*="Prime"]',
      '[data-a-badge-type="prime"]',
      '.a-badge-prime',
      '#deliveryDisplayFeature .a-icon-prime',
      '#mir-layout-DELIVERY_BLOCK .a-icon-prime',
      '.prime-checkout-tooltip'
    ];
    
    for (const selector of primeSelectors) {
      if (document.querySelector(selector)) return true;
    }
    
    // Check for Prime text in delivery/shipping messages
    const shippingSelectors = [
      '#mir-layout-DELIVERY_BLOCK-slot-PRIMARY_DELIVERY_MESSAGE_LARGE',
      '#fast-track-message', 
      '#promise-ship-date',
      '#deliveryBlockMessage',
      '#deliveryDisplayFeature',
      '#delivery-block-msg',
      '.a-color-success',
      '#mir-layout-DELIVERY_BLOCK'
    ];
    
    for (const selector of shippingSelectors) {
      const el = document.querySelector(selector);
      if (el && el.textContent) {
        const txt = el.textContent.toLowerCase();
        if (/prime|ücretsiz teslimat|free shipping|livraison gratuite|kostenlose lieferung|spedizione gratuita|envío gratis/.test(txt)) {
          return true;
        }
      }
    }
    
    // Check for Prime membership requirement text
    const pageText = document.body.textContent.toLowerCase();
    if (/prime membership|prime üyelik|prime members|prime member/.test(pageText)) {
      return true;
    }
    
    // Check for FBA (Fulfilled by Amazon) which often has Prime
    const fbaElements = document.querySelectorAll('#fulfillerBadge_feature_div, .fulfilled-by-amazon, [data-feature-name="merchant"]');
    for (const fba of fbaElements) {
      if (fba.textContent && /amazon|fulfilled.*amazon/.test(fba.textContent.toLowerCase())) {
        return true;
      }
    }
    
    return false;
  }

  const prime = getPrime();

  return {
    asin,
    title,
    price,
    currency,
    inStock,
    seller,
    images,
    category,
    description,
    prime,
    url: location.href
  };
})();


