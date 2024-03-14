import { BlazeEvent } from '../../event/BlazeEventEmitter';
import type { Action } from '../../types/action';
import type { RecordString, RecordUnknown } from '../../types/helper';
import type { CreateActionOption } from '../../types/service';
import { createContext } from '../common';
import { eventHandler } from '../helper/handler';

export class BlazeServiceAction {
  public readonly serviceName: string;
  public readonly actionName: string;
  public readonly action: Action;

  constructor(options: CreateActionOption) {
    this.serviceName = options.serviceName;
    this.actionName = [this.serviceName, options.actionAlias].join('.');
    this.action = options.action;

    BlazeEvent.on(this.actionName, this.actionHandler.bind(this));
  }

  public async actionHandler(
    body: RecordUnknown,
    params: RecordUnknown,
    headers: RecordString
  ) {
    const contextRes = await createContext({
      honoCtx: null,
      body,
      headers,
      params,
      validator: this.action.validator ?? null,
      throwOnValidationError: this.action.throwOnValidationError ?? false,
    });

    if (!contextRes.ok) return contextRes;

    const { result: blazeCtx } = contextRes;

    return eventHandler(this.action, blazeCtx);
  }
}
