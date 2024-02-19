import type {
  SafeParseReturnType,
  ZodObject,
  ZodRawShape,
  ZodTypeAny,
} from 'zod';

export type RecordUnknown = Record<string, unknown>;

export type RecordString = Record<string, string>;

export interface FinalActionType<
  Body extends ZodTypeAny,
  Params extends ZodObject<ZodRawShape>,
  FinalBody extends RecordUnknown = Body['_output'] & RecordUnknown,
  FinalParams extends RecordUnknown = Params['_output'] & RecordUnknown,
  ValidBody = Body extends ZodTypeAny
    ? SafeParseReturnType<Params, Body['_output']>
    : never,
  ValidParam = Params extends ZodObject<ZodRawShape>
    ? SafeParseReturnType<Params, Params['_output']>
    : never,
  Validation = RecordUnknown & {
    body: ValidBody;
    params: ValidParam;
  },
> {
  Body: FinalBody;
  Params: FinalParams;
  Validation: Validation;
}

export interface FinalEventType<
  Params extends ZodTypeAny | ZodObject<ZodRawShape> = ZodTypeAny,
  FinalParams extends RecordUnknown = Params['_output'] & RecordUnknown,
  ValidParam = Params extends ZodObject<ZodRawShape>
    ? SafeParseReturnType<Params, Params['_output']>
    : never,
> {
  Params: FinalParams;
  Validation: ValidParam;
}
