import { config } from '../config/index.js';
import logger from '../utils/logger.js';
import Processor from '../core/processor.js';
import Storage from '../services/storage.js';
import { mongoService } from '../services/mongo.js';

// Функция для генерации HTML сетки с комментариями
function generateHTMLGrid(products) {
  const cards = products.map(p => `
    <div class="product-card">
      <div class="product-image">
        <img src="${p.image}" alt="${p.name}" loading="lazy" 
             onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect width=%22200%22 height=%22200%22 fill=%22%23f0f0f0%22/%3E%3Ctext x=%2250%%22 y=%2250%%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23999%22 font-size=%2214%22 font-family=%22sans-serif%22%3ENo image%3C/text%3E%3C/svg%3E'">
      </div>
      <div class="product-info">
        <h3>${p.name}</h3>
        <div class="product-meta">
          <span class="product-id">#${p.id}</span>
          <span class="product-comments">💬 ${p.commentsCount || 0}</span>
        </div>
      </div>
    </div>
  `).join('');

  return `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Каталог продуктов</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f7fa;
            padding: 20px;
        }
        .container { max-width: 1400px; margin: 0 auto; }
        .header {
            text-align: center;
            padding: 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 12px;
            margin-bottom: 30px;
            color: white;
        }
        .header h1 { font-size: 2.5em; margin-bottom: 10px; }
        .header .count { font-size: 1.2em; opacity: 0.9; }
        .products-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 24px;
            padding: 20px 0;
        }
        .product-card {
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .product-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 24px rgba(0,0,0,0.12);
        }
        .product-image {
            width: 100%;
            height: 200px;
            background: #f0f2f5;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
        }
        .product-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.3s ease;
        }
        .product-card:hover .product-image img {
            transform: scale(1.05);
        }
        .product-info {
            padding: 16px 20px 20px;
        }
        .product-info h3 {
            font-size: 1em;
            font-weight: 600;
            color: #1a1a2e;
            line-height: 1.4;
            min-height: 44px;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
        .product-meta {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 10px;
        }
        .product-id {
            display: inline-block;
            font-size: 0.75em;
            color: #999;
            background: #f0f2f5;
            padding: 2px 10px;
            border-radius: 12px;
        }
        .product-comments {
            display: inline-block;
            font-size: 0.85em;
            color: #667eea;
            background: #eef2ff;
            padding: 2px 10px;
            border-radius: 12px;
        }
        .stats {
            display: flex;
            justify-content: space-between;
            padding: 15px 20px;
            background: white;
            border-radius: 8px;
            margin-top: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            flex-wrap: wrap;
            gap: 10px;
        }
        .stats span { font-size: 0.9em; color: #666; }
        .stats .value { font-weight: 600; color: #1a1a2e; }
        .stats .mongo-status {
            color: #10b981;
            font-weight: 600;
        }
        @media (max-width: 768px) {
            .products-grid { grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; }
            .header h1 { font-size: 1.8em; }
            .product-image { height: 150px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📦 Каталог продуктов</h1>
            <div class="count">Найдено: ${products.length} товаров</div>
        </div>
        
        <div class="products-grid">${cards}</div>
        
        <div class="stats">
            <span>📦 Всего: <span class="value">${products.length}</span></span>
            <span>🖼️ С картинками: <span class="value">${products.filter(p => p.image).length}</span></span>
            <span>💬 С комментариями: <span class="value">${products.filter(p => p.commentsCount > 0).length}</span></span>
            <span>💾 MongoDB: <span class="mongo-status">✅ сохранено</span></span>
        </div>
    </div>
</body>
</html>`;
}

export class CLI {
  constructor() {
    this.processor = new Processor();
    this.storage = new Storage({ saveToMongo: true });
  }
  
  async run(args) {
    const command = args[2] || 'parse';
    
    if (command === 'parse') {
      await this.parse(args.slice(3));
    } else if (command === 'mongo') {
      await this.mongoCommands(args.slice(3));
    } else {
      this.help();
    }
  }
  
  async parse(args) {
    console.log('\n🚀 Запуск парсера продуктов...\n');
    
    try {
      const url = args[0] || config.parser.url;
      
      console.log('🔌 Проверка MongoDB...');
      try {
        await mongoService.connect();
        console.log('✅ MongoDB подключена');
      } catch (error) {
        console.log('⚠️ MongoDB не доступна, данные будут сохранены только в файлы');
      }
      
      const products = await this.processor.process(url);
      
      if (products.length === 0) {
        console.log('\n⚠️ Продукты не найдены. Проверьте селекторы в .env файле.\n');
        return;
      }
      
      console.log('\n📋 Примеры продуктов:');
      products.slice(0, 5).forEach((p, i) => {
        console.log(`\n  ${i + 1}. ${p.name}`);
        console.log(`     🖼️ ${p.image}`);
        console.log(`     💬 Комментариев: ${p.commentsCount || 0}`);
      });
      
      if (products.length > 5) {
        console.log(`\n  ... и еще ${products.length - 5} продуктов`);
      }
      
      console.log('\n💾 Сохранение результатов...');
      const files = await this.storage.saveAll(products, generateHTMLGrid);
      
      console.log('\n✅ Парсинг завершен!');
      console.log(`📊 Собрано продуктов: ${products.length}`);
      
      console.log('\n📁 Файлы сохранены:');
      if (files.json) console.log(`   📄 JSON: ${files.json}`);
      if (files.html) console.log(`   📄 HTML: ${files.html}`);
      
      if (files.mongo) {
        console.log(`\n💾 MongoDB: ✅ Сохранено ${files.mongo.total} продуктов`);
        console.log(`   Новых: ${files.mongo.inserted}, Обновлено: ${files.mongo.updated}`);
      } else {
        console.log('\n⚠️ MongoDB: ❌ Не сохранено');
      }
      
      console.log('');
      
      const stats = await mongoService.getStats().catch(() => null);
      if (stats) {
        console.log('📊 Всего в базе:');
        console.log(`   📦 ${stats.total} продуктов`);
        console.log(`   🖼️ ${stats.withImages} с картинками`);
        console.log(`   💬 ${stats.withComments} с комментариями`);
      }
      
      await mongoService.disconnect();
      
    } catch (error) {
      console.error('\n❌ Ошибка:', error.message);
      await mongoService.disconnect().catch(() => {});
    }
  }
  
  async mongoCommands(args) {
    const subCommand = args[0] || 'stats';
    
    try {
      await mongoService.connect();
      
      if (subCommand === 'stats') {
        const stats = await mongoService.getStats();
        console.log('\n📊 Статистика MongoDB:');
        console.log(`  📦 Всего продуктов: ${stats.total}`);
        console.log(`  🖼️ С картинками: ${stats.withImages}`);
        console.log(`  📝 Без картинок: ${stats.withoutImages}`);
        console.log(`  💬 С комментариями: ${stats.withComments}`);
        console.log(`  ⏱️ Последний парсинг: ${stats.lastParsed || 'Нет'}`);
        if (stats.lastProduct) {
          console.log(`\n  📋 Последний продукт:`);
          console.log(`     Название: ${stats.lastProduct.name}`);
          console.log(`     Картинка: ${stats.lastProduct.image || 'Нет'}`);
          console.log(`     💬 Комментариев: ${stats.lastProduct.commentsCount || 0}`);
        }
      } else if (subCommand === 'list') {
        const limit = parseInt(args[1]) || 10;
        const result = await mongoService.getProducts({}, { limit, sort: { parsedAt: -1 } });
        console.log(`\n📋 Последние ${result.products.length} продуктов (из ${result.total}):`);
        result.products.forEach((p, i) => {
          console.log(`\n  ${i + 1}. ${p.name}`);
          console.log(`     🖼️ ${p.image || 'Нет'}`);
          console.log(`     💬 Комментариев: ${p.commentsCount || 0}`);
          console.log(`     ⏱️ ${p.parsedAt}`);
        });
      } else if (subCommand === 'clean') {
        const days = parseInt(args[1]) || 30;
        const deleted = await mongoService.deleteOldProducts(days);
        console.log(`\n🗑️ Удалено ${deleted} продуктов старше ${days} дней`);
      } else if (subCommand === 'comment') {
        // Команда для тестового обновления комментариев
        const productId = parseInt(args[1]);
        const count = parseInt(args[2]) || 1;
        if (!productId) {
          console.log('\n⚠️ Укажите ID продукта: npm start mongo comment 1 5');
          return;
        }
        const result = await mongoService.updateCommentsCount(productId, count);
        if (result) {
          console.log(`\n✅ Обновлен commentsCount для продукта ${productId}: ${count}`);
        }
      } else if (subCommand === 'increment') {
        // Команда для инкремента комментариев
        const productId = parseInt(args[1]);
        if (!productId) {
          console.log('\n⚠️ Укажите ID продукта: npm start mongo increment 1');
          return;
        }
        const result = await mongoService.incrementCommentsCount(productId);
        if (result) {
          console.log(`\n✅ Инкрементирован commentsCount для продукта ${productId}`);
        }
      } else {
        console.log(`
Команды MongoDB:
  stats              - Показать статистику
  list [n]           - Показать последние n продуктов
  clean [days]       - Удалить продукты старше N дней
  comment [id] [n]   - Установить количество комментариев для продукта
  increment [id]     - Увеличить количество комментариев на 1
        `);
      }
      
    } catch (error) {
      console.error('❌ Ошибка:', error.message);
    } finally {
      await mongoService.disconnect();
    }
  }
  
  help() {
    console.log(`
📦 Парсер продуктов с MongoDB

Использование:
  npm start parse [url]              - Парсинг и сохранение в MongoDB
  npm start mongo stats              - Статистика MongoDB
  npm start mongo list [n]           - Последние n продуктов
  npm start mongo clean [days]       - Очистка старых записей
  npm start mongo comment [id] [n]   - Установить кол-во комментариев
  npm start mongo increment [id]     - Увеличить кол-во комментариев на 1

Пример:
  npm start parse https://rentalbikes.ru
  npm start mongo stats
  npm start mongo list 5
  npm start mongo comment 1 10
  npm start mongo increment 1
    `);
  }
}

export default CLI;