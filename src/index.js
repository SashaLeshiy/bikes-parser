#!/usr/bin/env node

import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import CLI from './adapters/cli.js';

// Обработка ошибок
process.on('uncaughtException', (error) => {
  logger.error('Необработанная ошибка:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Необработанный rejection:', reason);
  process.exit(1);
});

// Запуск
async function main() {
  try {
    console.log('\n📦 Парсер продуктов v1.0.0');
    console.log(`🌐 URL: ${config.parser.url}\n`);
    
    const cli = new CLI();
    await cli.run(process.argv);
    
  } catch (error) {
    logger.error('Ошибка приложения:', error);
    process.exit(1);
  }
}

main();

export { config, logger };
export { default as Processor } from './core/processor.js';
export { default as Storage } from './services/storage.js';