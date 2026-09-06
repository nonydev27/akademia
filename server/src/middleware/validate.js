/**
 * middleware/validate.js — zod request validation wrapper.
 *
 * Usage: router.post('/', validate({ body: createStudentSchema }), controller.create)
 * Parsed/coerced values are written back onto req.body/req.query/req.params so
 * controllers receive typed data.
 */

import { ApiError } from '../utils/ApiError.js';

export function validate(schemas) {
  return function (req, res, next) {
    for (const key of ['body', 'query', 'params']) {
      const schema = schemas[key];
      if (!schema) continue;
      const result = schema.safeParse(req[key]);
      if (!result.success) {
        throw ApiError.badRequest('Validation failed', result.error.flatten());
      }
      req[key] = result.data;
    }
    next();
  };
}
