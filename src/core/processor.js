import logger from '../utils/logger.js';
import Fetcher from './fetcher.js';
import Parser from './parser.js';

export class Processor {
  constructor(options = {}) {
    this.options = options;
    this.fetcher = new Fetcher(options);
    this.parser = new Parser(options);
    this.results = [];
  }
  
  async process(url) {
    const startTime = Date.now();
    logger.info(`🚀 Начинаем парсинг: ${url}`);
    
    try {
      // Загружаем HTML
      const html = await this.fetcher.fetch(url);
      
      // Парсим продукты
      const products = this.parser.parse(html, url);
      
      // Сохраняем результаты
      this.results = products;
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      logger.info(`✅ Парсинг завершен за ${duration} секунд`);
      logger.info(`📊 Найдено продуктов: ${products.length}`);
      
      return products;
      
    } catch (error) {
      logger.error('❌ Парсинг не удался:', error.message);
      throw error;
    }
  }
}

export default Processor;