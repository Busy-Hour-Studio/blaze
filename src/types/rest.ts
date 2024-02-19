import type { BlazeContext } from '@/event/BlazeContext';
import type { Hono, Context as HonoCtx } from 'hono';
import type { Action } from './action';

export type Method =
  | 'ALL'
  | 'POST'
  | 'GET'
  | 'PUT'
  | 'PATCH'
  | 'OPTIONS'
  | 'DELETE'
  | 'USE';

export type RestRoute = `${Method} /${string}` | `/${string}`;

export interface RestParamOption {
  method?: Method | null;
  path: string;
}

export type RestParam = RestParamOption | RestRoute;

export interface RestHandlerOption extends Omit<Action, 'name' | 'rest'> {
  router: Hono;
  rest: RestParam;
}

export interface CreateRestHandlerOption extends Omit<Action, 'rest'> {}

export interface RestErrorHandlerOption {
  err: Error | unknown;
  ctx: BlazeContext;
  honoCtx: HonoCtx;
}
