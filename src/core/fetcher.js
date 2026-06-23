import axios from 'axios';
import { config } from '../config/index.js';
import logger from '../utils/logger.js';
import { Helpers } from '../utils/helpers.js';

export class Fetcher {
  constructor(options = {}) {
    this.options = {
      timeout: config.parser.timeout,
      retries: config.parser.retries,
      userAgent: config.parser.userAgent,
      ...options
    };
  }

  async fetch(url) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.options.retries; attempt++) {
      try {
        logger.info(`Загрузка страницы (попытка ${attempt}/${this.options.retries}): ${url}`);
        
        const response = await axios.get(url, {
          timeout: this.options.timeout,
          headers: {
            'User-Agent': this.options.userAgent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7'
          }
        });

        if (response.status !== 200) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        logger.info(`✅ Страница загружена (${response.data.length} байт)`);
        return response.data;

      } catch (error) {
        lastError = error;
        logger.warn(`⚠️ Попытка ${attempt} не удалась: ${error.message}`);
        
        if (attempt < this.options.retries) {
          const delay = 1000 * attempt;
          await Helpers.sleep(delay);
        }
      }
    }
    
    throw new Error(`Не удалось загрузить страницу: ${lastError.message}`);
  }
}

export default Fetcher;