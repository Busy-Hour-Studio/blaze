import { ActionValidation } from '@/types/action';
import type { CreateContextOption } from '@/types/context';
import type { RecordString, RecordUnknown } from '@/types/helper';
import { hasOwnProperty } from '@/utils/common';
import { getReqBody } from '@/utils/helper/context';
import type { Context as HonoCtx } from 'hono';
import qs from 'node:querystring';
import { ZodTypeAny } from 'zod';
import { BlazeBroker } from './BlazeBroker';

export class BlazeContext<
  Meta extends RecordUnknown = RecordUnknown,
  Body extends RecordUnknown = RecordUnknown,
  Params extends RecordUnknown = RecordUnknown,
  Validation extends RecordUnknown = RecordUnknown,
  Headers extends RecordString = RecordString,
> {
  private $honoCtx: HonoCtx<{
    Variables: Meta;
  }> | null;
  private $meta: Meta;
  private $validation: Validation | null;
  private $headers: Record<string, string | string[]>;
  private $query: qs.ParsedUrlQuery | null;
  private $body: Body | null;
  private $params: (Body & Params) | null;
  private $reqParams: Params | null;
  private $reqHeaders: Headers;
  private $isRest: boolean;
  private $broker: BlazeBroker;

  constructor(
    options: Omit<
      CreateContextOption<Body, Params, Validation, Headers>,
      'validator'
    >
  ) {
    const { honoCtx, body, params, headers } = options;

    this.$honoCtx = honoCtx;
    this.$meta = {} as Meta;
    this.$headers = {};
    this.$reqHeaders = headers ?? ({} as Headers);
    this.$reqParams = params;
    this.$params = null;
    this.$query = null;
    this.$body = body;
    this.$isRest = !!options.honoCtx;
    this.$validation = options.validation ?? null;
    this.$broker = new BlazeBroker();

    this.call = this.$broker.call.bind(this.$broker);
    this.mcall = this.$broker.mcall.bind(this.$broker);
    this.emit = this.$broker.emit.bind(this.$broker);
    this.event = this.$broker.event.bind(this.$broker);
  }

  private getMeta(key: keyof Meta): Meta[keyof Meta] {
    const value = this.$meta[key];

    if (!this.$honoCtx) return value;

    const honoValue = this.$honoCtx.get(key);

    if (honoValue !== value) {
      this.$meta[key] = honoValue;
    }

    return this.$meta[key];
  }

  private setMeta(key: keyof Meta, value: Meta[keyof Meta]) {
    this.$meta[key] = value;

    if (!this.$honoCtx) return;

    this.$honoCtx.set(key, value);
  }

  public get meta() {
    return {
      get: this.getMeta.bind(this),
      set: this.setMeta.bind(this),
    };
  }

  public get broker() {
    return this.$broker;
  }

  // Aliases
  public call = this.broker?.call;
  public mcall = this.broker?.mcall;
  public emit = this.broker?.emit;
  public event = this.broker?.event;

  private getHeader(): Record<string, string | string[]>;
  private getHeader(key: string): string | string[];
  private getHeader(key?: string) {
    if (key) {
      const value = this.$headers[key];

      return value;
    }

    return this.$headers;
  }

  private setHeader(key: string, value: string, append: boolean = false) {
    if (!append) {
      this.$headers[key] = value;
      return;
    }

    const currentValue = this.$headers[key];
    const isArray = Array.isArray(currentValue);

    if (!isArray) {
      this.$headers[key] = [currentValue, value];
      return;
    }

    currentValue.push(value);
  }

  public get header() {
    return {
      get: this.getHeader.bind(this),
      set: this.setHeader.bind(this),
    };
  }

  public get validation() {
    return this.$validation;
  }

  public get query() {
    if (!this.$honoCtx) return {};

    if (this.$query) return this.$query;

    const url = new URL(this.$honoCtx.req.url).searchParams;

    this.$query = qs.parse(url.toString());

    return this.$query;
  }

  public get params() {
    if (this.$params) return this.$params;

    const body = this.$body ?? ({} as Body);
    const param = this.$reqParams ?? ({} as Params);

    this.$params = {
      ...body,
      ...param,
    };

    return this.$params;
  }

  public get isRest() {
    return this.$isRest;
  }

  public get request() {
    return {
      headers: this.$reqHeaders,
      query: this.query,
      params: this.$reqParams,
      body: this.$body,
    };
  }

  public static async create<
    Meta extends RecordUnknown = RecordUnknown,
    Body extends RecordUnknown = RecordUnknown,
    Params extends RecordUnknown = RecordUnknown,
    Validation extends RecordUnknown = RecordUnknown,
    Headers extends RecordString = RecordString,
  >(
    options: CreateContextOption<Body, Params, Validation, Headers>
  ): Promise<BlazeContext<Meta, Body, Params, Validation, Headers>> {
    const { honoCtx } = options;

    let body: Body | null = null;
    let params: Params | null = null;
    let headers: Headers | null = null;
    let validation: Validation | null = null;

    if (options.body) {
      body = options.body;
    } else if (honoCtx) {
      body = await getReqBody(honoCtx);
    }

    if (options.params) {
      params = options.params;
    } else if (honoCtx) {
      params = honoCtx.req.param() as never;
    }

    if (options.headers) {
      headers = options.headers;
    } else if (honoCtx) {
      headers = honoCtx.req.header() as never;
    }

    if (options.validator) {
      if (
        hasOwnProperty(options.validator, 'body') ||
        hasOwnProperty(options.validator, 'params')
      ) {
        const validator = options.validator as ActionValidation;

        if (validator.body) {
          if (!validation) validation = {} as Validation;
          Object.assign(validation, {
            body: validator.body.safeParse(body),
          });
        }

        if (validator.params) {
          if (!validation) validation = {} as Validation;
          Object.assign(validation, {
            params: validator.params.safeParse(params),
          });
        }
      } else {
        const validator = options.validator as ZodTypeAny;
        validation = validator.safeParse(body) as unknown as Validation;
      }
    }

    const ctx = new BlazeContext<Meta, Body, Params, Validation, Headers>({
      body,
      params,
      honoCtx,
      headers,
      validation,
    });

    return ctx;
  }
}
