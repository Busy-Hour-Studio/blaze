import { BlazeContext } from '@/event/BlazeContext';
import { BlazeEvent } from '@/event/BlazeEvent';
import type { Action, ActionCallResult } from '@/types/action';
import type { EventActionHandler } from '@/types/event';
import type { RecordString, RecordUnknown } from '@/types/helper';
import type { AssignActionOption } from '@/types/service';
import { getServiceName, resolvePromise } from '../common';
import { setupRestHandler } from '../rest';
import { handleAfterActionHook, handleBeforeActionHook } from './hooks';

export function createActionHandler(action: Action) {
  return async function EventActionHandler(
    body: RecordUnknown,
    params: RecordUnknown,
    headers: RecordString
  ): Promise<ActionCallResult<unknown>> {
    const [blazeCtx, blazeErr] = await resolvePromise(
      BlazeContext.create({
        honoCtx: null,
        body,
        params,
        headers,
      })
    );

    if (!blazeCtx || blazeErr) {
      return {
        error: blazeErr as Error,
        ok: false,
      };
    }

    if (action.hooks?.before) {
      const beforeHooksRes = await handleBeforeActionHook({
        blazeCtx,
        hooks: action.hooks.before as never,
      });

      if (!beforeHooksRes.ok) return beforeHooksRes;
    }

    // eslint-disable-next-line prefer-const
    let [result, err] = await resolvePromise(action.handler(blazeCtx as never));

    if (err) {
      return {
        error: err as Error,
        ok: false,
      };
    }

    if (action.hooks?.after) {
      const afterHooksRes = await handleAfterActionHook({
        blazeCtx,
        hooks: action.hooks.after as never,
        result,
      });

      return afterHooksRes;
    }

    return {
      ok: true,
      result,
    };
  };
}

export function assignAction(
  options: AssignActionOption
): EventActionHandler[] {
  const { service, router } = options;

  if (!service.actions) return [];

  const handlers = Object.entries<Action>(
    service.actions
  ).map<EventActionHandler>(([actionAlias, action]) => {
    const serviceName = getServiceName(service);
    const actionName = [serviceName, actionAlias].join('.');

    if (action.rest) {
      setupRestHandler({
        handler: action.handler,
        hooks: action.hooks,
        rest: action.rest,
        router,
      });
    }

    const eventHandler = createActionHandler(action);

    BlazeEvent.on(actionName, eventHandler);

    return {
      name: actionName,
      handler: eventHandler,
    };
  });

  return handlers;
}
