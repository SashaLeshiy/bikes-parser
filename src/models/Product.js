export class Product {
  constructor(data) {
    this.id = data.id || null;
    this.name = data.name || '';
    this.image = data.image || '';
    this.commentsCount = data.commentsCount || 0;  // Добавлено
    this.parsedAt = data.parsedAt || new Date().toISOString();
  }
  
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      image: this.image,
      commentsCount: this.commentsCount,  // Добавлено
      parsedAt: this.parsedAt
    };
  }
  
  static fromRaw(rawData, index, baseUrl, helpers) {
    const imageSrc = helpers.safeAttr(rawData, 'img', 'src');
    
    const product = new Product({
      id: index + 1,
      name: helpers.safeText(rawData, ''),
      image: imageSrc ? helpers.normalizeUrl(imageSrc, baseUrl) : '',
      commentsCount: 0,  // По умолчанию 0, будет обновляться через API
      parsedAt: new Date().toISOString()
    });
    
    return product;
  }
  
  static fromArray(rawDataArray, baseUrl, helpers) {
    return rawDataArray.map((item, index) => 
      Product.fromRaw(item, index, baseUrl, helpers)
    );
  }
}

export default Product;