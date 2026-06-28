import { MongoClient } from 'mongodb';
import { config } from '../config/index.js';
import logger from '../utils/logger.js';

class MongoDBService {
  constructor() {
    this.client = null;
    this.db = null;
    this.collection = null;
    this.connected = false;
    
    this.uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    this.dbName = process.env.MONGODB_DATABASE || 'bikes_parser';
    this.collectionName = process.env.MONGODB_COLLECTION || 'bikes';
    
    this.user = process.env.MONGODB_USER;
    this.password = process.env.MONGODB_PASSWORD;
    this.authSource = process.env.MONGODB_AUTH_SOURCE || 'admin';
  }

  async connect() {
    try {
      logger.info(`🔌 Подключение к MongoDB: ${this.uri}`);
      
      const options = {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      };

      if (this.user && this.password) {
        options.auth = {
          username: this.user,
          password: this.password
        };
        options.authSource = this.authSource;
      }

      this.client = new MongoClient(this.uri, options);
      await this.client.connect();
      
      this.db = this.client.db(this.dbName);
      this.collection = this.db.collection(this.collectionName);
      this.connected = true;
      
      logger.info(`✅ Подключено к MongoDB: ${this.dbName}/${this.collectionName}`);
      
      await this.createIndexes();
      
      return this;
    } catch (error) {
      logger.error('❌ Ошибка подключения к MongoDB:', error.message);
      throw error;
    }
  }

  async createIndexes() {
    try {
      // Индекс для уникальности по URL (если есть)
      await this.collection.createIndex({ url: 1 }, { sparse: true });
      
      // Индекс для поиска по названию
      await this.collection.createIndex({ name: 'text' });
      
      // Индекс для сортировки по дате
      await this.collection.createIndex({ parsedAt: -1 });
      
      // Индекс для поиска по id
      await this.collection.createIndex({ id: 1 });
      await this.collection.createIndex({ commentsCount: -1 });
      await this.collection.createIndex({ link: 1 }); // Индекс для поиска по ссылке
      logger.info('✅ Индексы созданы');
    } catch (error) {
      logger.warn('⚠️ Ошибка создания индексов:', error.message);
    }
  }

  async saveProducts(products) {
    if (!this.connected) {
      await this.connect();
    }

    if (!products || products.length === 0) {
      logger.warn('⚠️ Нет продуктов для сохранения');
      return { inserted: 0, updated: 0 };
    }

    try {
      logger.info(`💾 Сохранение ${products.length} продуктов в MongoDB...`);
      
      let inserted = 0;
      let updated = 0;
      
      for (const product of products) {
        // Проверяем, существует ли продукт
        const existing = await this.collection.findOne({ 
          id: product.id
        });
        
        if (existing) {
          // Обновляем существующий продукт
          const updateData = {
            name: product.name,
            image: product.image,
            url: product.url || config.parser.url,
            link: product.link || '',
            parsedAt: product.parsedAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          // Если есть commentsCount в данных - обновляем его
          if (product.commentsCount !== undefined) {
            updateData.commentsCount = product.commentsCount;
          }
          
          await this.collection.updateOne(
            { id: product.id },
            { $set: updateData }
          );
          updated++;
        } else {
          // Создаем новый продукт
          const newProduct = {
            id: product.id,
            name: product.name || 'Без названия',
            image: product.image || '',
            url: product.url || config.parser.url,
            link: product.link || '',
            commentsCount: product.commentsCount || 0,
            parsedAt: product.parsedAt || new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          await this.collection.insertOne(newProduct);
          inserted++;
        }
      }
      
      logger.info(`✅ Сохранено: ${inserted} новых, ${updated} обновлено`);
      
      return {
        inserted,
        updated,
        total: products.length
      };
      
    } catch (error) {
      logger.error('❌ Ошибка сохранения в MongoDB(mongo.js):', error.message);
      throw error;
    }
  }

  // Метод для обновления количества комментариев
  async updateCommentsCount(productId, newCount) {
    if (!this.connected) {
      await this.connect();
    }

    try {
      const result = await this.collection.updateOne(
        { id: parseInt(productId) },
        { 
          $set: { 
            commentsCount: newCount,
            updatedAt: new Date().toISOString()
          } 
        }
      );
      
      if (result.matchedCount === 0) {
        logger.warn(`⚠️ Продукт с id ${productId} не найден`);
        return null;
      }
      
      logger.info(`✅ Обновлен commentsCount для продукта ${productId}: ${newCount}`);
      return result;
      
    } catch (error) {
      logger.error('❌ Ошибка обновления комментариев:', error.message);
      throw error;
    }
  }

  // Метод для инкремента комментариев
  async incrementCommentsCount(productId) {
    if (!this.connected) {
      await this.connect();
    }

    try {
      const result = await this.collection.updateOne(
        { id: parseInt(productId) },
        { 
          $inc: { commentsCount: 1 },
          $set: { updatedAt: new Date().toISOString() }
        }
      );
      
      if (result.matchedCount === 0) {
        logger.warn(`⚠️ Продукт с id ${productId} не найден`);
        return null;
      }
      
      logger.info(`✅ Инкрементирован commentsCount для продукта ${productId}`);
      return result;
      
    } catch (error) {
      logger.error('❌ Ошибка инкремента комментариев:', error.message);
      throw error;
    }
  }

  // Метод для декремента комментариев (на случай удаления комментария)
  async decrementCommentsCount(productId) {
    if (!this.connected) {
      await this.connect();
    }

    try {
      const result = await this.collection.updateOne(
        { id: parseInt(productId) },
        { 
          $inc: { commentsCount: -1 },
          $set: { updatedAt: new Date().toISOString() }
        }
      );
      
      if (result.matchedCount === 0) {
        logger.warn(`⚠️ Продукт с id ${productId} не найден`);
        return null;
      }
      
      logger.info(`✅ Декрементирован commentsCount для продукта ${productId}`);
      return result;
      
    } catch (error) {
      logger.error('❌ Ошибка декремента комментариев:', error.message);
      throw error;
    }
  }

  async getProducts(filter = {}, options = {}) {
    if (!this.connected) {
      await this.connect();
    }

    try {
      const limit = options.limit || 100;
      const skip = options.skip || 0;
      const sort = options.sort || { parsedAt: -1 };

      const products = await this.collection
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .toArray();

      const total = await this.collection.countDocuments(filter);

      return {
        products,
        total,
        limit,
        skip
      };
      
    } catch (error) {
      logger.error('❌ Ошибка получения продуктов:', error.message);
      throw error;
    }
  }

  async getProductById(id) {
    if (!this.connected) {
      await this.connect();
    }

    try {
      return await this.collection.findOne({ id: parseInt(id) });
    } catch (error) {
      logger.error('❌ Ошибка получения продукта:', error.message);
      throw error;
    }
  }

  async deleteOldProducts(days = 30) {
    if (!this.connected) {
      await this.connect();
    }

    try {
      const date = new Date();
      date.setDate(date.getDate() - days);
      
      const result = await this.collection.deleteMany({
        parsedAt: { $lt: date.toISOString() }
      });
      
      logger.info(`🗑️ Удалено ${result.deletedCount} старых продуктов`);
      return result.deletedCount;
      
    } catch (error) {
      logger.error('❌ Ошибка удаления:', error.message);
      throw error;
    }
  }

  async getStats() {
    if (!this.connected) {
      await this.connect();
    }

    try {
      const total = await this.collection.countDocuments();
      const withImages = await this.collection.countDocuments({ 
        image: { $ne: '' } 
      });
      const withComments = await this.collection.countDocuments({ 
        commentsCount: { $gt: 0 } 
      });
      const lastProduct = await this.collection
        .find({})
        .sort({ parsedAt: -1 })
        .limit(1)
        .toArray();

      return {
        total,
        withImages,
        withoutImages: total - withImages,
        withComments,
        lastParsed: lastProduct.length > 0 ? lastProduct[0].parsedAt : null,
        lastProduct: lastProduct.length > 0 ? lastProduct[0] : null
      };
      
    } catch (error) {
      logger.error('❌ Ошибка получения статистики:', error.message);
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
      this.connected = false;
      logger.info('🔌 Отключено от MongoDB');
    }
  }
}

export const mongoService = new MongoDBService();

export async function checkMongoConnection() {
  try {
    await mongoService.connect();
    const stats = await mongoService.getStats();
    logger.info('📊 Статистика MongoDB:', stats);
    return true;
  } catch (error) {
    logger.error('❌ MongoDB недоступна:', error.message);
    return false;
  }
}

export default mongoService;