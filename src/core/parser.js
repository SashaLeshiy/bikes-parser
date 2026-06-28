import * as cheerio from 'cheerio';
import { config } from '../config/index.js';
import logger from '../utils/logger.js';
import { Helpers } from '../utils/helpers.js';
import Product from '../models/Product.js';

export class Parser {
  constructor(options = {}) {
    this.options = {
      selectors: config.selectors,
      ...options
    };
  }
  
  parse(html, baseUrl) {
    logger.info('🔍 Начинаем парсинг продуктов...');
    const $ = cheerio.load(html);
    const products = [];
    
    // Находим все элементы продуктов
    const productElements = $(this.options.selectors.product);
    logger.info(`📦 Найдено элементов продуктов: ${productElements.length}`);
    
    if (productElements.length === 0) {
      logger.warn('⚠️ Продукты не найдены. Проверьте селекторы.');
      this.debugPageStructure($);
      return products;
    }
    
    productElements.each((index, element) => {
      try {
        const $element = $(element);
        
        // Извлекаем image
        const imageSrc = Helpers.safeAttr($element, this.options.selectors.image, 'src');
        const image = imageSrc ? Helpers.normalizeUrl(imageSrc, baseUrl) : '';
        
        // Извлекаем name
        const name = Helpers.safeText($element, this.options.selectors.name);

        let productLink = '';
        const href = $element.attr('href');
        if (href) {
          productLink = Helpers.normalizeUrl(href, baseUrl);
          logger.info(`🔗 Найдена ссылка для продукта ${index + 1}: ${productLink}`);
        } else {
          logger.warn(`⚠️ Ссылка (href) не найдена для продукта ${index + 1}`);
        }
        
        // Создаем продукт
        const product = new Product({
          id: index + 1,
          name: name || `Товар ${index + 1}`,
          link: productLink, 
          image: image,
          parsedAt: new Date().toISOString()
        });
        
        products.push(product.toJSON());
        
      } catch (error) {
        logger.error(`❌ Ошибка при парсинге продукта #${index + 1}:`, error.message);
      }
    });
    
    logger.info(`✅ Успешно спарсено: ${products.length} продуктов`);
    return products;
  }
  
  debugPageStructure($) {
    logger.info('🔍 Отладка структуры страницы:');
    
    const selectors = this.options.selectors;
    for (const [key, selector] of Object.entries(selectors)) {
      const elements = $(selector);
      logger.info(`  Селектор "${key}" (${selector}): ${elements.length} элементов`);
      
      if (elements.length > 0) {
        const sample = elements.first().text().trim().substring(0, 100);
        logger.info(`  Пример: ${sample}`);

        // Для ссылок показываем атрибут href
        if (key === 'link') {
          const href = elements.first().attr('href');
          logger.info(`  href: ${href}`);
        }
      }
    }
  }
}

export default Parser;