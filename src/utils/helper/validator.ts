import type { ZodObject, ZodRawShape } from 'zod';
import { BlazeError } from '../../errors/BlazeError';
import type { DataValidatorOption } from '../../types/helper';
import type { Method } from '../../types/rest';
import { getReqBody } from './context';

export function validateInput<T extends ZodObject<ZodRawShape>>(
  input: unknown,
  schema: T
) {
  const result = schema.passthrough().safeParse(input);

  return result;
}

export function validateHeader(options: DataValidatorOption) {
  const { data, honoCtx, schema, validations, throwOnValidationError } =
    options;

  if (!data.get('headers') && honoCtx) {
    data.set('headers', honoCtx.req.header());
  }

  const result = validateInput(data.get('headers'), schema);

  validations.set('header', result.success);

  if (result.success) data.set('headers', result.data);
  else if (!result.success && throwOnValidationError)
    throw new BlazeError({
      errors: result.error,
      message: 'Invalid header',
      status: 400,
      name: 'Invalid header',
    });
}

export function validateParams(options: DataValidatorOption) {
  const { data, honoCtx, schema, validations, throwOnValidationError } =
    options;

  if (!data.get('params') && honoCtx) {
    data.set('params', honoCtx.req.header());
  }

  const result = validateInput(data.get('params'), schema);

  validations.set('params', result.success);

  if (result.success) data.set('params', result.data);
  else if (!result.success && throwOnValidationError)
    throw new BlazeError({
      errors: result.error,
      message: 'Invalid params',
      status: 400,
      name: 'Invalid params',
    });
}

export async function validateBody(options: DataValidatorOption) {
  const { data, honoCtx, schema, validations, throwOnValidationError } =
    options;

  if (!data.get('body') && honoCtx) {
    const method = honoCtx.req.method.toUpperCase() as Method;

    switch (method) {
      case 'GET':
      case 'DELETE':
      case 'USE':
        return;

      default:
        data.set('body', await getReqBody(honoCtx));
        break;
    }
  }

  const result = validateInput(data.get('body'), schema);

  validations.set('body', result.success);

  if (result.success) data.set('body', result.data);
  else if (!result.success && throwOnValidationError)
    throw new BlazeError({
      errors: result.error,
      message: 'Invalid body',
      status: 400,
      name: 'Invalid body',
    });
}
