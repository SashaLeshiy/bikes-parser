import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Загружаем .env из корня проекта
dotenv.config({ path: path.join(process.cwd(), '.env') });

export const config = {
  parser: {
    url: process.env.PARSER_URL || 'https://rentalbikes.ru',
    timeout: parseInt(process.env.PARSER_TIMEOUT) || 30000,
    retries: parseInt(process.env.PARSER_RETRIES) || 3,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  },
  
  selectors: {
    product: process.env.SELECTOR_PRODUCT || '.products__item',
    image: process.env.SELECTOR_IMAGE || '.products__item-img img',
    name: process.env.SELECTOR_NAME || '.products__item-info .products__item-name',
    link: process.env.SELECTOR_LINK || '.products__item'
  },
  
  storage: {
    outputDir: process.env.OUTPUT_DIR || './output'
  }
};

export default config;