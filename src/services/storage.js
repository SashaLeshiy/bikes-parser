import fs from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';
import { config } from '../config/index.js';
import logger from '../utils/logger.js';
import mongoService from './mongo.js';

export class Storage {
  constructor(options = {}) {
    this.options = {
      outputDir: config.storage.outputDir,
      saveToMongo: options.saveToMongo !== false, // По умолчанию true
      ...options
    };
    
    this.ensureDirectories();
  }
  
  ensureDirectories() {
    const dirs = [
      this.options.outputDir,
      path.join(this.options.outputDir, 'json'),
      path.join(this.options.outputDir, 'html')
    ];
    
    for (const dir of dirs) {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    }
  }
  
  async saveJSON(data, filename = null) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = filename || `products_${timestamp}.json`;
    const filePath = path.join(this.options.outputDir, 'json', fileName);
    
    try {
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
      logger.info(`💾 JSON сохранен: ${filePath}`);
      return filePath;
    } catch (error) {
      logger.error('Ошибка сохранения JSON:', error);
      throw error;
    }
  }
  
  async saveHTML(html, filename = null) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = filename || `products_${timestamp}.html`;
    const filePath = path.join(this.options.outputDir, 'html', fileName);
    
    try {
      await fs.writeFile(filePath, html, 'utf-8');
      logger.info(`💾 HTML сохранен: ${filePath}`);
      return filePath;
    } catch (error) {
      logger.error('Ошибка сохранения HTML:', error);
      throw error;
    }
  }
  
  async saveToMongo(products) {
    if (!this.options.saveToMongo) {
      logger.info('⏭️ Сохранение в MongoDB отключено');
      return null;
    }
    
    try {
      // Подключаемся к MongoDB если еще не подключены
      if (!mongoService.connected) {
        await mongoService.connect();
      }
      
      const result = await mongoService.saveProducts(products);
      return result;
      
    } catch (error) {
      logger.error('❌ Ошибка сохранения в MongoDB:', error.message);
      return null;
    }
  }
  
  async saveAll(data, htmlGenerator) {
    const results = {
      json: null,
      html: null,
      mongo: null
    };
    
    try {
      // Сохраняем JSON
      results.json = await this.saveJSON(data);
      
      // Сохраняем HTML
      if (htmlGenerator) {
        const html = htmlGenerator(data);
        results.html = await this.saveHTML(html);
      }
      
      // Сохраняем в MongoDB
      results.mongo = await this.saveToMongo(data);
      
      return results;
      
    } catch (error) {
      logger.error('Ошибка сохранения данных:', error);
      throw error;
    }
  }
  
  // Получение данных из MongoDB
  async getFromMongo(filter = {}, options = {}) {
    try {
      if (!mongoService.connected) {
        await mongoService.connect();
      }
      return await mongoService.getProducts(filter, options);
    } catch (error) {
      logger.error('Ошибка получения данных из MongoDB:', error);
      throw error;
    }
  }
}

export default Storage;