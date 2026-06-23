export class Product {
  constructor(data) {
    this.id = data.id || null;
    this.name = data.name || '';
    this.image = data.image || '';
    this.parsedAt = data.parsedAt || new Date().toISOString();
  }
  
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      image: this.image,
      parsedAt: this.parsedAt
    };
  }
  
  static fromRaw(rawData, index, baseUrl, helpers) {
    const imageSrc = helpers.safeAttr(rawData, 'img', 'src');
    
    const product = new Product({
      id: index + 1,
      name: helpers.safeText(rawData, ''),
      image: imageSrc ? helpers.normalizeUrl(imageSrc, baseUrl) : '',
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