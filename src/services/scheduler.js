import cron from 'node-cron';
import { config } from '../config/index.js';
import logger from '../utils/logger.js';
import Processor from '../core/processor.js';
import Storage from './storage.js';
import Notifier from './notifier.js';

export class Scheduler {
  constructor(options = {}) {
    this.options = {
      cron: config.schedule.cron,
      timezone: config.schedule.timezone,
      ...options
    };
    
    this.processor = new Processor(options);
    this.storage = new Storage(options);
    this.notifier = new Notifier(options);
    this.isRunning = false;
    this.lastRun = null;
    this.task = null;
  }
  
  // Запуск по расписанию
  start() {
    if (this.task) {
      logger.warn('Scheduler already running');
      return;
    }
    
    logger.info(`Starting scheduler with cron: ${this.options.cron}`);
    
    this.task = cron.schedule(
      this.options.cron,
      async () => {
        await this.runJob();
      },
      {
        scheduled: true,
        timezone: this.options.timezone
      }
    );
    
    logger.info('Scheduler started');
  }
  
  // Остановка расписания
  stop() {
    if (this.task) {
      this.task.stop();
      this.task = null;
      logger.info('Scheduler stopped');
    }
  }
  
  // Выполнение задачи
  async runJob() {
    if (this.isRunning) {
      logger.warn('Job already running, skipping...');
      return;
    }
    
    this.isRunning = true;
    const startTime = new Date();
    
    logger.info(`Starting scheduled job at ${startTime.toISOString()}`);
    
    try {
      const url = config.parser.url;
      
      // Парсим данные
      const products = await this.processor.process(url);
      
      // Сохраняем результаты
      const stats = this.processor.getStats();
      const files = await this.storage.saveAll(products, {
        prefix: `scheduled_${startTime.getTime()}`,
        stats,
        htmlGenerator: this.generateHTMLGrid
      });
      
      this.lastRun = {
        time: startTime,
        duration: (new Date() - startTime) / 1000,
        products: products.length,
        files
      };
      
      // Отправляем уведомление
      await this.notifier.sendSuccess({
        products: products.length,
        files,
        duration: this.lastRun.duration
      });
      
      logger.info(`Job completed: ${products.length} products saved`);
      
    } catch (error) {
      logger.error('Job failed:', error);
      
      // Отправляем уведомление об ошибке
      await this.notifier.sendError({
        error: error.message,
        time: startTime
      });
      
    } finally {
      this.isRunning = false;
    }
  }
  
  // Запуск вручную
  async runNow() {
    logger.info('Manual run requested');
    await this.runJob();
  }
  
  // Получение статуса
  getStatus() {
    return {
      running: this.isRunning,
      lastRun: this.lastRun,
      schedulerActive: this.task !== null,
      cron: this.options.cron
    };
  }
  
  // Генерация HTML сетки (используется для сохранения)
  generateHTMLGrid(products) {
    // Здесь можно использовать код из предыдущего примера
    // или вынести в отдельный модуль
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Products Grid</title>
    <style>
        /* Стили из предыдущего примера */
    </style>
</head>
<body>
    <div class="container">
        <h1>Products (${products.length})</h1>
        <div class="grid">
            ${products.map(p => `
                <div class="card">
                    <img src="${p.image}" alt="${p.name}">
                    <h3>${p.name}</h3>
                    ${p.price ? `<p>${p.price}</p>` : ''}
                </div>
            `).join('')}
        </div>
    </div>
</body>
</html>`;
  }
}

export default Scheduler;