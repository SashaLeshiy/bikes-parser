export class Helpers {
  // Нормализация URL
  static normalizeUrl(url, baseUrl) {
    if (!url) return '';
    
    try {
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
      }
      
      const base = new URL(baseUrl);
      const baseDomain = `${base.protocol}//${base.host}`;
      
      if (url.startsWith('/')) {
        return baseDomain + url;
      }
      
      return new URL(url, baseUrl).href;
    } catch (error) {
      return url;
    }
  }
  
  // Сон
  static sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // Безопасное извлечение текста
  static safeText($element, selector) {
    try {
      const el = $element.find(selector);
      return el.length ? el.text().trim() : '';
    } catch {
      return '';
    }
  }
  
  // Безопасное извлечение атрибута
  static safeAttr($element, selector, attr = 'src') {
    try {
      const el = $element.find(selector);
      if (el.length) {
        return el.attr(attr) || el.attr('data-src') || '';
      }
      return '';
    } catch {
      return '';
    }
  }
}

export default Helpers;