import type { Context as HonoCtx } from 'hono';
import type { StatusCode } from 'hono/utils/http-status';
import qs from 'node:querystring';
import type { ZodObject, ZodRawShape } from 'zod';
import type {
  ContextConstructorOption,
  CreateContextOption,
} from '../types/context';
import type {
  ContextDataMap,
  ContextValidation,
  RecordString,
  RecordUnknown,
  ValidationResultMap,
} from '../types/helper';
import type { ResponseType } from '../types/rest';
import { getReqBody } from '../utils/helper/context';
import {
  validateBody,
  validateHeader,
  validateParams,
} from '../utils/helper/validator';
import { BlazeBroker } from './BlazeBroker';

export class BlazeContext<
  Meta extends RecordUnknown = RecordUnknown,
  Body extends RecordUnknown = RecordUnknown,
  Params extends RecordUnknown = RecordUnknown,
  Headers extends RecordString = RecordString,
> {
  private readonly $honoCtx: HonoCtx | null;
  private $query: qs.ParsedUrlQuery | null;
  private $body: Body | null;
  private $params: (Body & Params) | null;
  private $reqParams: Params | null;
  private $reqHeaders: Headers | null;

  public response: ResponseType | null;
  public status: StatusCode | null;
  public readonly meta: Map<keyof Meta, Meta[keyof Meta]>;
  public readonly headers: Map<string, string | string[]>;
  public readonly validations: ValidationResultMap | null;
  public readonly isRest: boolean;
  public readonly broker: BlazeBroker;

  // Aliases for broker
  public readonly call: BlazeBroker['call'];
  public readonly mcall: BlazeBroker['mcall'];
  public readonly emit: BlazeBroker['emit'];
  public readonly event: BlazeBroker['event'];

  constructor(options: ContextConstructorOption<Body, Params, Headers>) {
    const { honoCtx, body, params, headers, validations } = options;

    this.$honoCtx = honoCtx;
    this.$reqHeaders = headers;
    this.$reqParams = params;
    this.$params = null;
    this.$query = null;
    this.$body = body;

    this.response = null;
    this.status = null;
    this.meta = new Map<keyof Meta, Meta[keyof Meta]>();
    this.headers = new Map<string, string | string[]>();
    this.isRest = !!options.honoCtx;
    this.validations = validations;
    this.broker = new BlazeBroker();

    // Aliases for broker
    this.call = this.broker.call.bind(this.broker);
    this.mcall = this.broker.mcall.bind(this.broker);
    this.emit = this.broker.emit.bind(this.broker);
    this.event = this.broker.event.bind(this.broker);
  }

  public get query() {
    if (this.$query) return this.$query;

    if (!this.$honoCtx) {
      this.$query = {} as qs.ParsedUrlQuery;
    } else {
      const url = new URL(this.$honoCtx.req.url).searchParams;

      this.$query = qs.parse(url.toString());
    }

    return this.$query;
  }

  private get reqHeaders(): Headers {
    if (this.$reqHeaders) return this.$reqHeaders;

    if (!this.$honoCtx) {
      this.$reqHeaders = {} as Headers;
    } else {
      this.$reqHeaders = this.$honoCtx.req.header() as Headers;
    }

    return this.$reqHeaders;
  }

  private get reqParams(): Params {
    if (this.$reqParams) return this.$reqParams;

    if (!this.$honoCtx) {
      this.$reqParams = {} as Params;
    } else {
      this.$reqParams = this.$honoCtx.req.param() as Params;
    }

    return this.$reqParams;
  }

  private async getBody(): Promise<Body> {
    if (this.$body) return this.$body;

    if (!this.$honoCtx) {
      this.$body = {} as Body;
    } else {
      this.$body = (await getReqBody(this.$honoCtx)) ?? ({} as Body);
    }

    return this.$body as Body;
  }

  public async params() {
    if (this.$params) return this.$params;

    const body = await this.getBody();
    const param = this.reqParams as Params;

    this.$params = {
      ...body,
      ...param,
    };

    return this.$params;
  }

  public get request() {
    return {
      headers: this.reqHeaders,
      query: this.query,
      params: this.reqParams,
      body: this.getBody.bind(this),
    };
  }

  public static async create<
    Meta extends RecordUnknown = RecordUnknown,
    Body extends RecordUnknown = RecordUnknown,
    Params extends RecordUnknown = RecordUnknown,
    Headers extends RecordString = RecordString,
    BodyValidation extends ZodObject<ZodRawShape> = ZodObject<ZodRawShape>,
    ParamsValidation extends ZodObject<ZodRawShape> = ZodObject<ZodRawShape>,
    HeaderValidation extends ZodObject<ZodRawShape> = ZodObject<ZodRawShape>,
    Validator extends Partial<
      ContextValidation<BodyValidation, ParamsValidation, HeaderValidation>
    > = Partial<
      ContextValidation<BodyValidation, ParamsValidation, HeaderValidation>
    >,
  >(
    options: CreateContextOption<
      Body,
      Params,
      Headers,
      BodyValidation,
      ParamsValidation,
      HeaderValidation,
      Validator
    >
  ): Promise<BlazeContext<Meta, Body, Params, Headers>> {
    const { honoCtx, validator, throwOnValidationError } = options;
    const data: ContextDataMap = new Map();
    const validations: ValidationResultMap = new Map([
      ['body', true],
      ['params', true],
      ['header', true],
    ]);

    if (validator?.header) {
      validateHeader({
        data,
        honoCtx,
        schema: validator.header,
        throwOnValidationError,
        validations,
      });
    }

    if (validator?.params) {
      validateParams({
        data,
        honoCtx,
        schema: validator.params,
        throwOnValidationError,
        validations,
      });
    }

    if (validator?.body) {
      await validateBody({
        data,
        honoCtx,
        schema: validator.body,
        throwOnValidationError,
        validations,
      });
    }

    const ctx = new BlazeContext<Meta, Body, Params, Headers>({
      body: data.get('body') as Body | null,
      params: data.get('params') as Params | null,
      headers: data.get('headers') as Headers | null,
      honoCtx,
      validations,
    });

    return ctx;
  }
}
