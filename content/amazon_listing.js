(function () {
  function absoluteUrl(path) {
    try {
      return new URL(path, window.location.origin).toString();
    } catch (e) {
      return path;
    }
  }

  function extractAsinFromElement(el) {
    const asin = el.getAttribute('data-asin');
    if (asin && asin.length > 0) return asin;
    const link = el.querySelector('h2 a');
    if (link && link.href) {
      const match = link.href.match(/\/dp\/([A-Z0-9]{10})/i) || link.href.match(/\/gp\/product\/([A-Z0-9]{10})/i);
      if (match) return match[1];
    }
    return null;
  }

  const items = Array.from(document.querySelectorAll('div.s-result-item[data-asin]'));
  const productLinks = [];
  for (const item of items) {
    const asin = extractAsinFromElement(item);
    if (!asin) continue;
    const url = `${window.location.origin}/dp/${asin}`;
    productLinks.push(url);
  }

  // Deduplicate
  const uniqueLinks = Array.from(new Set(productLinks));

  // Next page
  let nextPageUrl = null;
  const nextBtn = document.querySelector('a.s-pagination-next:not([aria-disabled="true"])');
  if (nextBtn && nextBtn.getAttribute('href')) {
    nextPageUrl = absoluteUrl(nextBtn.getAttribute('href'));
  }

  return { productLinks: uniqueLinks, nextPageUrl };
})();


