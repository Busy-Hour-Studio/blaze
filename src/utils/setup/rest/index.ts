import type { Context as HonoCtx, MiddlewareHandler } from 'hono';
import { BlazeContext } from '../../../internal';
import { BlazeError } from '../../../internal/error';
import { Logger } from '../../../internal/logger';
import type { BlazeAction } from '../../../types/action';
import type { BlazeOpenAPIRequest } from '../../../types/openapi';
import type { ExposedBlazeRestMethod, StatusCode } from '../../../types/rest';
import type { BlazeService } from '../../../types/service';
import { isNil, resolvePromise } from '../../common';
import { REST_METHOD } from '../../constant/rest';
import { eventHandler } from '../../helper/handler';
import {
  extractRestParams,
  handleRestError,
  handleRestResponse,
} from '../../helper/rest';
import type { BlazeServiceRestOption } from './types';

export class BlazeServiceRest {
  public readonly path: string;
  public readonly method: ExposedBlazeRestMethod | null;
  public readonly service: BlazeService | null;
  private action: BlazeAction;

  constructor(options: BlazeServiceRestOption) {
    const { router, action, service } = options;

    if (!action.rest) {
      throw Logger.throw('Rest property is required');
    }

    const [method, path] = extractRestParams(action.rest);

    this.path = path;
    this.method = method;
    this.action = action;
    this.service = service;

    const { request, responses } = this.openAPIConfig;

    const middlewares: MiddlewareHandler[] = [
      ...options.middlewares,
      ...(action.middlewares ?? []),
    ];

    const tags: string[] = [];

    if (this.service.tags) {
      if (typeof this.service.tags === 'string') {
        tags.push(this.service.tags);
      } else {
        tags.push(...this.service.tags);
      }
    } else if (this.service.name) {
      tags.push(this.service.name);
    }

    router.openapi({
      method: method || REST_METHOD.ALL,
      handler: this.restHandler.bind(this),
      path,
      request,
      responses,
      middlewares,
      tags,
    });
  }

  public async restHandler(honoCtx: HonoCtx) {
    const [context, error] = await resolvePromise(
      BlazeContext.create({
        honoCtx,
        // NULL => automatically use honoCtx value instead
        body: null,
        headers: null,
        params: null,
        query: null,
        validator: this.action.validator ?? null,
        meta: this.action.meta ?? null,
        onValidationError: this.action.onValidationError ?? null,
      })
    );

    if (error || !context) {
      let status: StatusCode = 500;

      if (error instanceof BlazeError) {
        status = error.status;
      }

      return honoCtx.json(error as Error, status as never);
    }

    const [restResult, restError] = await resolvePromise(
      eventHandler(this.action, context)
    );

    if (restError) {
      return handleRestError({
        ctx: context,
        err: restError,
        honoCtx,
      });
    }

    if (isNil(restResult)) {
      return honoCtx.body(null, 204);
    }

    return handleRestResponse({
      ctx: context,
      honoCtx,
      result: restResult,
    });
  }

  private get openAPIConfig() {
    if (!this.action.openapi)
      return {
        request: {},
        responses: {},
      };

    const { openapi, validator } = this.action;

    const request: BlazeOpenAPIRequest = {};
    const responses = openapi.responses ?? {};

    if (validator?.body && openapi.body) {
      request.body = {
        content: {
          [openapi.body.type]: {
            schema: validator.body,
          },
        },
        description: openapi.body?.description,
        required: openapi.body?.required,
      };
    }

    if (validator?.params) {
      request.params = validator.params;
    }

    if (validator?.query) {
      request.query = validator.query;
    }

    if (validator?.header) {
      request.headers = validator.header;
    }

    return {
      request,
      responses,
    };
  }
}