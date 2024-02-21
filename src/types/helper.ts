import type { ZodObject, ZodRawShape } from 'zod';

export type RecordUnknown = Record<string, unknown>;

export type RecordString = Record<string, string>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Random = any;

export type PartialRequire<O, K extends keyof O> = {
  [P in K]-?: O[P];
} & O;

export type RequireOne<T, K extends keyof T = keyof T> = K extends keyof T
  ? PartialRequire<T, K>
  : never;

export interface ContextValidation<
  Body extends ZodObject<ZodRawShape> = ZodObject<ZodRawShape>,
  Params extends ZodObject<ZodRawShape> = ZodObject<ZodRawShape>,
  Header extends ZodObject<ZodRawShape> = ZodObject<ZodRawShape>,
> {
  body: Body;
  params: Params;
  header: Header;
}

export interface ValidationResult {
  body: boolean;
  params: boolean;
  header: boolean;
}
