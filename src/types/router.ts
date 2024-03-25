import type {
  RouteConfig,
  ZodRequestBody,
} from '@asteasolutions/zod-to-openapi';
import type { Router } from 'hono/router';
import type { Env, MiddlewareHandler, RouterRoute } from 'hono/types';
import type { AnyZodObject } from 'zod';
import type { RecordUnknown } from './helper';
import type { Method } from './rest';

export interface CreateBlazeOption {
  router?: Router<[never, RouterRoute]>;
  path?: string | null;
  autoStart?: boolean | null;
}

export interface OpenAPIRequest {
  body?: ZodRequestBody;
  params?: AnyZodObject;
  headers?: AnyZodObject;
}

export interface BlazeOpenAPIOption
  extends Omit<RouteConfig, 'request' | 'method'> {
  request: OpenAPIRequest;
  method: Method;
  handler: MiddlewareHandler;
}

export interface BlazeFetch<E extends Env = Env> {
  (
    request: Request,
    Env?: E['Bindings'] | RecordUnknown,
    executionCtx?: RecordUnknown
  ): Response | Promise<Response>;
}
