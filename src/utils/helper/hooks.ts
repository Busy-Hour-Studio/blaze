import type { ActionCallResult } from '@/types/action';
import type {
  AfterHookHandlerOption,
  AfterHookRestHandlerOption,
  BeforeHookHandlerOption,
  BeforeHookRestHandlerOption,
} from '@/types/hooks';
import { resolvePromise, toArray } from '../common';

export async function handleBeforeActionHook(
  options: BeforeHookHandlerOption
): Promise<ActionCallResult<unknown>> {
  const hooks = toArray(options.hooks);

  for (const hook of hooks) {
    const hookFn = hook instanceof Function ? hook : hook.handler;
    const [, hookErr] = await resolvePromise(hookFn(options.blazeCtx));

    if (hookErr) {
      return {
        error: hookErr as Error,
        ok: false,
      };
    }
  }

  return {
    ok: true,
    result: null,
  };
}

export async function handleAfterActionHook(
  options: AfterHookHandlerOption
): Promise<ActionCallResult<unknown>> {
  const hooks = toArray(options.hooks);

  // eslint-disable-next-line prefer-destructuring
  let result: unknown = options.result;

  for (const hook of hooks) {
    const hookFn = hook instanceof Function ? hook : hook.handler;
    const [hookRes, hookErr] = await resolvePromise(
      hookFn(options.blazeCtx, result)
    );

    if (hookErr) {
      return {
        error: hookErr as Error,
        ok: false,
      };
    }

    result = hookRes;
  }

  return {
    ok: true,
    result,
  };
}

export async function handleRestBeforeHook(
  options: BeforeHookRestHandlerOption
): Promise<ActionCallResult<unknown>> {
  const hooks = toArray(options.hooks);

  for (const hook of hooks) {
    const hookFn = hook instanceof Function ? hook : hook.handler;
    const [, hookErr] = await resolvePromise(hookFn(options.blazeCtx));

    if (hookErr) {
      return {
        ok: false,
        error: hookErr as Error,
      };
    }
  }

  return {
    ok: true,
    result: null,
  };
}

export async function handleRestAfterHook(
  options: AfterHookRestHandlerOption
): Promise<ActionCallResult<unknown>> {
  const hooks = toArray(options.hooks);

  // eslint-disable-next-line prefer-destructuring
  let result: unknown = options.result;

  for (const hook of hooks) {
    const hookFn = hook instanceof Function ? hook : hook.handler;
    const [hookRes, hookErr] = await resolvePromise(
      hookFn(options.blazeCtx, result)
    );

    if (hookErr) {
      return {
        ok: false,
        error: hookErr as Error,
      };
    }

    result = hookRes;
  }

  return {
    ok: true,
    result,
  };
}
