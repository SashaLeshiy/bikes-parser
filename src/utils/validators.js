import Joi from 'joi';

export const validators = {
  // Валидация URL
  url: Joi.string().uri().required(),
  
  // Валидация продукта
  product: Joi.object({
    id: Joi.number().integer().positive(),
    name: Joi.string().min(1).max(500),
    image: Joi.string().uri().allow(''),
    price: Joi.string().allow('', null),
    description: Joi.string().allow('', null),
    rating: Joi.string().allow('', null),
    reviews: Joi.string().allow('', null),
    url: Joi.string().uri().allow('', null),
    parsedAt: Joi.date().iso()
  }),
  
  // Валидация массива продуктов
  products: Joi.array().items(Joi.object()),
  
  // Валидация опций парсинга
  parseOptions: Joi.object({
    url: Joi.string().uri(),
    selectors: Joi.object({
      product: Joi.string(),
      image: Joi.string(),
      name: Joi.string(),
      price: Joi.string()
    }),
    maxItems: Joi.number().integer().min(1).max(10000)
  })
};

export const validate = (schema, data) => {
  const { error, value } = schema.validate(data, { abortEarly: false });
  if (error) {
    throw new Error(`Validation error: ${error.message}`);
  }
  return value;
};

export default validators;