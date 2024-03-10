import { BlazeContext } from '../event/BlazeContext';
import type { ActionCallResult } from '../types/action';
import type { CreateContextOption } from '../types/context';
import type { Random } from '../types/helper';
import type { Service } from '../types/service';

export function hasOwnProperty<
  Z extends NonNullable<unknown>,
  X extends NonNullable<unknown> = NonNullable<unknown>,
  Y extends PropertyKey = PropertyKey,
>(obj: X, property: Y): obj is X & Record<Y, Z> {
  return Object.hasOwn(obj, property);
}

export function mapToObject(
  map: Map<Random, unknown>,
  valueMapper?: (value: unknown) => unknown
) {
  const result = Object.create(null);

  for (const [key, value] of map.entries()) {
    Object.defineProperty(result, key, {
      value: valueMapper ? valueMapper(value) : value,
      writable: true,
      enumerable: true,
      configurable: true,
    });
  }

  return result;
}

export function removeTrailingSlash(path: string) {
  return path.replace(/^\/+/, '');
}

export function getRestPath(service: Service) {
  const version = service.version ? `v${service.version}` : '';

  return [version, service.name]
    .map((val) => (typeof val === 'string' ? removeTrailingSlash(val) : null))
    .filter(Boolean)
    .join('/');
}

export function getServiceName(service: Service) {
  const version = service.version ? `v${service.version}` : '';

  return [version, service.name].filter(Boolean).join('.');
}

export async function resolvePromise<T>(promise: Promise<T> | T) {
  try {
    const res = await promise;

    return [res, null] as const;
  } catch (err) {
    return [null, err] as const;
  }
}

export function toArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value];
}

export function isNil<T>(
  value: T | null | undefined
): value is null | undefined {
  return value === null || value === undefined;
}

export async function createContext(
  options: CreateContextOption
): Promise<ActionCallResult<BlazeContext>> {
  const [blazeCtx, blazeErr] = await resolvePromise(
    BlazeContext.create(options)
  );

  if (!blazeCtx || blazeErr) {
    return {
      error: blazeErr as Error,
      ok: false,
    };
  }

  return {
    result: blazeCtx,
    ok: true,
  };
}
