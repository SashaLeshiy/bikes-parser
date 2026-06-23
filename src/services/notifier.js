import logger from '../utils/logger.js';
import { config } from '../config/index.js';

export class Notifier {
  constructor(options = {}) {
    this.options = {
      enabled: config.notification.email,
      ...options
    };
  }
  
  async sendSuccess(data) {
    if (!this.options.enabled) {
      logger.debug('Notifications disabled');
      return;
    }
    
    const message = `
✅ Парсинг завершен успешно!
📊 Собрано продуктов: ${data.products}
⏱️ Время выполнения: ${data.duration}s
📁 Файлы: ${JSON.stringify(data.files, null, 2)}
    `;
    
    await this.sendNotification('Успешный парсинг', message);
  }
  
  async sendError(data) {
    if (!this.options.enabled) {
      logger.debug('Notifications disabled');
      return;
    }
    
    const message = `
❌ Ошибка при парсинге!
🕐 Время: ${data.time}
⚠️ Ошибка: ${data.error}
    `;
    
    await this.sendNotification('Ошибка парсинга', message);
  }
  
  async sendNotification(subject, message) {
    // Здесь можно реализовать отправку email, Telegram, Slack и т.д.
    logger.info(`Notification: ${subject}`, { message });
    
    // Пример отправки email
    // if (config.notification.smtp) {
    //   await this.sendEmail(subject, message);
    // }
    
    // Пример Telegram
    // await this.sendTelegram(message);
  }
  
  // Методы для разных каналов уведомлений
  async sendEmail(subject, message) {
    // Реализация отправки email
    logger.info(`Email sent: ${subject}`);
  }
  
  async sendTelegram(message) {
    // Реализация отправки в Telegram
    logger.info(`Telegram message sent`);
  }
}

export default Notifier;