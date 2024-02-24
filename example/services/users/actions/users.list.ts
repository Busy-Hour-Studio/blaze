import { BlazeCreator } from '../../../../src';
import { validateUserHeader } from '../hooks/users.validate.header';
import { USER_DB } from '../utils/constants';
import { parseLimitPageQuery } from '../utils/helper';
import { userHeaderSchema } from '../utils/schemas';

export const listUserOpenApi = BlazeCreator.action.openapi({
  responses: {
    200: {
      description: 'Get N users',
    },
    400: {
      description: 'Bad Request',
    },
  },
});

export const listUserValidator = BlazeCreator.action.validator({
  header: userHeaderSchema,
});

export const onListUser = BlazeCreator.action({
  // Set the rest route
  rest: 'GET /',
  openapi: listUserOpenApi,
  validator: listUserValidator,
  hooks: {
    before: validateUserHeader,
  },
  async handler(ctx) {
    const { limit, offset, page } = parseLimitPageQuery(ctx.request.query);

    const users = Array.from(USER_DB.values())
      .slice(offset, offset + limit)
      .map((user) => ({
        name: user.name,
        email: user.email,
      }));

    return {
      data: users,
      page: {
        limit,
        offset,
        page,
        total: USER_DB.size,
      },
    };
  },
});